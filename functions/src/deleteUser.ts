/**
 * deleteUser — coach/admin only. Deletes a user across:
 *   - Firebase Auth (most important: revokes all tokens forever).
 *   - Firestore: users/{uid}, clients/{clientId}, all checkIns,
 *     userPrograms, publicProfiles, all subcollections.
 *   - (Stripe cancellation hook — stub until Stripe is wired.)
 *   - Writes deletionLogs/{uid} as the audit trail.
 *
 * This is the strongest revocation. Once the Auth user is deleted, no
 * token they ever held is valid. Every subsequent request from that uid
 * fails with `auth/user-not-found`.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

async function callerIsCoach(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'coach' || claims?.role === 'admin') return true;
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    return role === 'coach' || role === 'admin';
}

/** Delete every doc in a subcollection, in batches of 200. */
async function deleteCollection(path: string): Promise<void> {
    const db = getFirestore();
    const ref = db.collection(path);
    while (true) {
        const snap = await ref.limit(200).get();
        if (snap.empty) return;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        if (snap.size < 200) return;
    }
}

export const deleteUser = onCall(
    { region: 'us-central1', memory: '256MiB', timeoutSeconds: 120, invoker: 'public' },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        if (!(await callerIsCoach(callerUid))) {
            throw new HttpsError('permission-denied', 'Only coaches can delete users.');
        }

        const { targetUid, reason } = (request.data ?? {}) as { targetUid?: string; reason?: string };
        if (!targetUid || typeof targetUid !== 'string') {
            throw new HttpsError('invalid-argument', 'targetUid required.');
        }
        if (targetUid === callerUid) {
            throw new HttpsError('failed-precondition', 'You cannot delete yourself.');
        }

        const db = getFirestore();

        // Capture user info for the audit log BEFORE deleting.
        const userSnap = await db.doc(`users/${targetUid}`).get();
        const userData = userSnap.data() ?? {};
        let stripeCustomerId: string | null = (userData.stripeCustomerId as string | null) ?? null;

        // Find the matching client doc by userId field (clientId !== uid).
        const clientQ = await db.collection('clients').where('userId', '==', targetUid).get();
        const clientIds = clientQ.docs.map((d) => d.id);

        // ----- Cleanup Firestore -----
        const ops: Promise<unknown>[] = [];

        // User doc + private subcollections
        ops.push(deleteCollection(`users/${targetUid}/selfLogs`));
        ops.push(deleteCollection(`users/${targetUid}/xpEvents`));

        // Client docs + their weekly check-ins
        for (const cid of clientIds) {
            const weeksQ = await db.collection('checkIns').where('clientId', '==', cid).get();
            for (const w of weeksQ.docs) {
                ops.push(w.ref.delete());
            }
            ops.push(db.doc(`clients/${cid}`).delete());
        }

        // Program assignment + public projection
        ops.push(db.doc(`userPrograms/${targetUid}`).delete());
        ops.push(db.doc(`publicProfiles/${targetUid}`).delete());

        await Promise.all(ops);
        // Delete the user doc last so callerIsCoach lookups still work mid-flight.
        await db.doc(`users/${targetUid}`).delete();

        // ----- Audit log (BEFORE deleting Auth, so we keep a trail) -----
        await db.doc(`deletionLogs/${targetUid}`).set(
            {
                type: 'deleted',
                deletedAt: FieldValue.serverTimestamp(),
                deletedBy: callerUid,
                reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
                // Cached snapshot so the log is meaningful even after the doc is gone.
                snapshot: {
                    displayName: userData.displayName ?? null,
                    email: userData.email ?? null,
                    role: userData.role ?? null,
                    clientIds,
                },
            },
            { merge: true },
        );

        // ----- Stripe cancel (stub) -----
        if (stripeCustomerId) {
            // TODO: when Stripe is wired, cancel here.
            // const stripe = new Stripe(...); await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active' })
            //   .then(s => Promise.all(s.data.map(sub => stripe.subscriptions.cancel(sub.id))));
            stripeCustomerId = null; // satisfies linter
        }

        // ----- Auth (terminal step — every token they hold becomes invalid) -----
        try {
            await getAuth().deleteUser(targetUid);
        } catch (e) {
            // If Auth user already gone, that's fine.
            const err = e as { code?: string };
            if (err.code !== 'auth/user-not-found') throw e;
        }

        return { ok: true, deletedClientIds: clientIds };
    },
);
