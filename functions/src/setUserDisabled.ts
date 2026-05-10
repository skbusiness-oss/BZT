/**
 * setUserDisabled — coach/admin only. Disables/re-enables a user at BOTH
 * the Firebase Auth layer AND the Firestore layer.
 *
 * The Firebase Auth disable is the load-bearing step. With the Auth user
 * disabled, every token refresh fails — within an hour their PWA is
 * forced back to the login screen. Client-side `visibilitychange` listener
 * picks this up in ~5 seconds on app foreground.
 *
 * The previous implementation only wrote a Firestore flag, which the
 * client could ignore until it next read the user doc. That left the
 * "disabled but still watching videos via PWA bookmark" loophole.
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

export const setUserDisabled = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public' },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        const callerClaims = (await getAuth().getUser(callerUid)).customClaims as { role?: string } | undefined;
        const callerClaimRole = callerClaims?.role ?? null;
        if (!(await callerIsCoach(callerUid))) {
            throw new HttpsError('permission-denied', 'Only coaches can disable users.');
        }

        const { targetUid, disabled, reason } = (request.data ?? {}) as {
            targetUid?: string;
            disabled?: boolean;
            reason?: string;
        };
        if (!targetUid || typeof targetUid !== 'string') {
            throw new HttpsError('invalid-argument', 'targetUid required.');
        }
        if (typeof disabled !== 'boolean') {
            throw new HttpsError('invalid-argument', 'disabled must be a boolean.');
        }
        if (targetUid === callerUid) {
            throw new HttpsError('failed-precondition', 'You cannot disable yourself.');
        }

        // Coaches cannot disable another coach or an admin.
        const targetSnap = await getFirestore().doc(`users/${targetUid}`).get();
        const targetRole = (targetSnap.data()?.role as string | undefined) ?? null;
        if ((targetRole === 'coach' || targetRole === 'admin') && callerClaimRole !== 'admin') {
            throw new HttpsError('permission-denied', `Only admins can disable a ${targetRole}.`);
        }

        // 1. Auth layer (the real revocation)
        await getAuth().updateUser(targetUid, { disabled });
        if (disabled) {
            await getAuth().revokeRefreshTokens(targetUid);
        }

        // 2. Firestore mirror (for UI / coach-side queries / audit)
        await getFirestore().doc(`users/${targetUid}`).set(
            {
                disabled,
                disabledAt: disabled ? FieldValue.serverTimestamp() : null,
                disabledBy: disabled ? callerUid : null,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
        );

        // 3. Audit trail (one doc per ban; overwritable on re-ban)
        if (disabled) {
            await getFirestore().doc(`deletionLogs/${targetUid}`).set(
                {
                    type: 'disabled',
                    disabledAt: FieldValue.serverTimestamp(),
                    disabledBy: callerUid,
                    reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
                },
                { merge: true },
            );
        }

        return { ok: true, disabled };
    },
);
