/**
 * generateSetPasswordLink — coach tool to recover a member who never
 * received their welcome / "set your password" email.
 *
 * On a brand-new sending domain the first transactional emails routinely
 * land in spam, so a paying member can be stuck: account created, but no
 * usable password-set link in their inbox. This function lets the coach
 * fix it instantly:
 *
 *   1. Generates a REAL password-set link via the Admin SDK — the exact
 *      same link the welcome email carries.
 *   2. Returns it to the coach, who can copy it and send it directly
 *      (WhatsApp / Discord), bypassing email deliverability entirely.
 *   3. Optionally ALSO (re)sends the branded welcome email via Resend.
 *
 * Coach/admin ONLY — this hands out a password-set link for an arbitrary
 * account, so it must never be callable by a regular member. Rate-limited
 * per coach as a backstop against a leaked coach token harvesting links.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { RESEND_API_KEY, sendEmail } from './emailService';
import { welcomeEmail } from './emailTemplates';

const APP_ORIGIN = 'https://app.biozackteam.com';

// Per-coach rate limit — 60 generations/hour. Generous (a launch-day
// recovery session touches many members) but bounded.
const RATE_LIMIT_WINDOW_SEC = 60 * 60;
const RATE_LIMIT_MAX = 60;

async function callerIsCoach(uid: string, token: { role?: unknown }): Promise<boolean> {
    if (token?.role === 'coach' || token?.role === 'admin') return true;
    // Fallback to the Firestore role for tokens minted before the claim
    // propagated (mirrors isCoach() in firestore.rules).
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    return role === 'coach' || role === 'admin';
}

async function throttleByCoach(uid: string): Promise<void> {
    const ref = getFirestore().doc(`rateLimits/setpwlink_${uid}`);
    const now = Date.now();
    const snap = await ref.get();
    const data = snap.data() as { count?: number; windowStart?: Timestamp } | undefined;
    const startMs = data?.windowStart?.toMillis() ?? 0;
    const expired = now - startMs >= RATE_LIMIT_WINDOW_SEC * 1000;
    if (expired) {
        await ref.set({
            count: 1,
            windowStart: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return;
    }
    if ((data?.count ?? 0) >= RATE_LIMIT_MAX) {
        throw new HttpsError('resource-exhausted', 'Too many link generations. Wait a bit and try again.');
    }
    await ref.update({
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export const generateSetPasswordLink = onCall(
    {
        secrets: [RESEND_API_KEY],
        region: 'us-central1',
        memory: '256MiB',
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Sign in required.');
        }
        const callerUid = request.auth.uid;
        const token = (request.auth.token ?? {}) as { role?: unknown };
        if (!(await callerIsCoach(callerUid, token))) {
            throw new HttpsError('permission-denied', 'Coach access required.');
        }

        const raw = (request.data ?? {}) as { email?: unknown; sendEmail?: unknown };
        if (typeof raw.email !== 'string' || !raw.email.trim()) {
            throw new HttpsError('invalid-argument', 'email is required.');
        }
        const email = raw.email.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
        }
        const alsoEmail = raw.sendEmail === true;

        await throttleByCoach(callerUid);

        // Resolve the member — for the email greeting AND to give the
        // coach a clear "no such account" answer (unlike the public reset
        // endpoint, a coach IS allowed to know whether the account exists).
        let displayName: string | undefined;
        try {
            const userRecord = await getAuth().getUserByEmail(email);
            displayName = userRecord.displayName || undefined;
            if (!displayName) {
                const snap = await getFirestore().doc(`users/${userRecord.uid}`).get();
                const n = snap.data()?.name;
                if (typeof n === 'string' && n.trim()) displayName = n.trim();
            }
        } catch (err) {
            const code = (err as { code?: string })?.code ?? '';
            if (code === 'auth/user-not-found') {
                throw new HttpsError(
                    'not-found',
                    'No account found for that email. Check the address, or confirm the payment landed in Stripe.',
                );
            }
            throw err;
        }

        // The set-password link itself (Admin SDK). Same link the welcome
        // email would carry; lands on Firebase's hosted reset page.
        const link = await getAuth().generatePasswordResetLink(email, {
            url: `${APP_ORIGIN}/login`,
            handleCodeInApp: false,
        });

        let emailed = false;
        let emailError: string | undefined;
        if (alsoEmail) {
            const { subject, html, text } = welcomeEmail(link, displayName);
            const result = await sendEmail({ to: email, subject, html, text });
            emailed = result.ok;
            if (!result.ok) {
                emailError = result.error;
                // eslint-disable-next-line no-console
                console.warn(`[generateSetPasswordLink] email send failed for ${email}:`, result.error);
            }
        }

        // eslint-disable-next-line no-console
        console.log(`[generateSetPasswordLink] coach=${callerUid} generated link for ${email} (emailed=${emailed})`);

        return { ok: true, link, email, emailed, emailError };
    },
);
