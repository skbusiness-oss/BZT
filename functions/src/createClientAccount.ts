/**
 * createClientAccount — coach/admin creates a new Auth user + Firestore
 * profile in a single server-side transaction.
 *
 * Why this exists (and why we don't do this client-side anymore)
 * ───────────────────────────────────────────────────────────────
 * The previous flow used a "secondary Firebase app" pattern on the
 * client: createUserWithEmailAndPassword(secondaryAuth, …) then
 * setDoc(users/{newUid}, …) from the coach's main session. Two ways
 * this could fail and surface as "Authentication error: …":
 *
 *   1. If Firebase Console → Authentication → Sign-in method has
 *      Email/Password's self-signup toggle disabled (a reasonable
 *      launch-hardening step), the client SDK refuses the call with
 *      auth/admin-restricted-operation. The coach's add-client flow
 *      broke the moment the toggle flipped.
 *
 *   2. The payment-gate rule at users/{uid}.create now requires
 *      isCoach() and blocks self-create. The Firestore client's gRPC
 *      stream can briefly hold the just-created user's token (not the
 *      coach's), which makes the rule deny the write — even though
 *      the coach was the one who initiated it.
 *
 *   3. Bonus: if the Firestore write failed AFTER the Auth user was
 *      created, we leaked an orphan Auth user with no profile doc.
 *      Logging in as that user would brick them (AuthContext kicks
 *      out accounts with no Firestore doc).
 *
 * Moving the whole flow into a Cloud Function with the Admin SDK
 * closes all three failure modes at once: admin SDK bypasses the
 * self-signup toggle, bypasses Firestore rules, and lets us do the
 * Auth-create + Firestore-write inside the same try/catch so we can
 * clean up the Auth user on failure.
 *
 * Inputs
 * ──────
 *   email     string  — lowercased, trimmed before the Auth call
 *   password  string  — minimum 6 chars (Firebase Auth's own minimum)
 *   name      string  — display name; written to Auth + users/{uid}.name + .displayName
 *   role      'client' | 'community'  — what the user becomes
 *
 * Returns
 * ───────
 *   { uid: string }
 *
 * Audit
 * ─────
 * Writes an `auditLog/{auto}` entry — same pattern as setUserRole —
 * so we have a server-side record of "coach X created user Y at time T."
 * Useful for compliance, abuse triage, and the deletion-history report.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { throttle } from './rateLimit';

// (No `macros` seed on users/{uid}. Real macro targets live in
// dietProfile / userDiets, not on the user doc — an earlier draft
// of this function seeded a placeholder here, which was harmless
// but never read by anything. Removed for clarity.)

type CreatableRole = 'client' | 'community';

interface CreateClientAccountInput {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    role?: unknown;
}

async function callerIsCoach(uid: string): Promise<boolean> {
    // 1. Custom claim — fastest, no Firestore read.
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'coach' || claims?.role === 'admin') return true;
    // 2. Firestore mirror fallback for accounts whose claim hasn't been
    //    bootstrapped yet. Matches the fallback ladder in setUserRole.ts.
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    return role === 'coach' || role === 'admin';
}

async function writeAuditLog(
    db: Firestore,
    actorUid: string,
    targetUid: string,
    extras: Record<string, unknown>,
): Promise<void> {
    try {
        await db.collection('auditLog').add({
            action: 'createClientAccount',
            actorUid,
            target: targetUid,
            ...extras,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        // Best-effort. Account creation already succeeded — don't fail
        // the whole call because the audit row didn't land.
        // eslint-disable-next-line no-console
        console.warn('[createClientAccount] audit log write failed:', err);
    }
}

export const createClientAccount = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public' },
    async (request) => {
        // ── Auth gate ────────────────────────────────────────────
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');

        // Rate limit — a coach realistically adds maybe 10 clients in
        // a busy day. 30/hour gives plenty of headroom; protects
        // against a leaked coach session being used to spray accounts.
        await throttle(callerUid, 'createClientAccount', { maxPerWindow: 30, windowSec: 3600 });

        if (!(await callerIsCoach(callerUid))) {
            throw new HttpsError('permission-denied', 'Only coaches can create accounts.');
        }

        // ── Input validation ─────────────────────────────────────
        const { email, password, name, role } = (request.data ?? {}) as CreateClientAccountInput;

        if (typeof email !== 'string' || !email.trim()) {
            throw new HttpsError('invalid-argument', 'email is required.');
        }
        if (typeof password !== 'string' || password.length < 6) {
            throw new HttpsError('invalid-argument', 'password must be at least 6 characters.');
        }
        if (typeof name !== 'string' || !name.trim()) {
            throw new HttpsError('invalid-argument', 'name is required.');
        }
        if (role !== 'client' && role !== 'community') {
            throw new HttpsError('invalid-argument', 'role must be "client" or "community".');
        }

        const safeEmail = email.toLowerCase().trim();
        const safeName = name.trim().slice(0, 60);
        const targetRole: CreatableRole = role;

        // Quick sanity check — admin SDK gives a verbose Firebase error
        // here too, but this gives the modal a cleaner message.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
            throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
        }

        // ── Create the Auth user ─────────────────────────────────
        let newUid: string;
        try {
            const userRecord = await getAuth().createUser({
                email: safeEmail,
                password,
                displayName: safeName,
                emailVerified: false,
                disabled: false,
            });
            newUid = userRecord.uid;
        } catch (err) {
            const code = (err as { code?: string })?.code ?? '';
            if (code === 'auth/email-already-exists') {
                throw new HttpsError('already-exists', 'A user with this email already exists.');
            }
            if (code === 'auth/invalid-email') {
                throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
            }
            if (code === 'auth/weak-password' || code === 'auth/invalid-password') {
                throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
            }
            // eslint-disable-next-line no-console
            console.error('[createClientAccount] auth create failed:', err);
            throw new HttpsError('internal', 'Could not create the account. Please try again.');
        }

        // ── Set the role custom claim ────────────────────────────
        // So Firestore + Storage rules can do request.auth.token.role
        // checks without a Firestore lookup. We don't wait for the
        // client's token to refresh — they'll either get a fresh
        // token on next sign-in (which happens after the coach hands
        // them their credentials), or the rules fall back to the
        // Firestore role field we write next.
        try {
            await getAuth().setCustomUserClaims(newUid, { role: targetRole });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[createClientAccount] setCustomUserClaims failed (non-fatal):', err);
            // Non-fatal: the Firestore role mirror covers the rules
            // fallback. We log it so it's visible if it becomes a
            // pattern, but we don't roll back.
        }

        // ── Write the Firestore profile doc ──────────────────────
        try {
            await getFirestore().doc(`users/${newUid}`).set({
                displayName: safeName,
                name: safeName,
                email: safeEmail,
                role: targetRole,
                createdAt: FieldValue.serverTimestamp(),
                createdBy: callerUid,
                createdVia: 'coach-add-client',
                stripeCustomerId: null,
                disabled: false,
            });
        } catch (err) {
            // Roll back the Auth user so we don't leak an orphan.
            // Without this, the coach sees an error AND the email is
            // now "taken" — they can't retry with the same email.
            // eslint-disable-next-line no-console
            console.error('[createClientAccount] Firestore write failed, rolling back Auth user:', err);
            try { await getAuth().deleteUser(newUid); } catch { /* best-effort */ }
            throw new HttpsError('internal', 'Could not save the profile. Please try again.');
        }

        // ── Audit log (best-effort) ──────────────────────────────
        await writeAuditLog(getFirestore(), callerUid, newUid, {
            email: safeEmail,
            role: targetRole,
        });

        return { uid: newUid };
    },
);
