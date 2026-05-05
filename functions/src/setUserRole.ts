/**
 * setUserRole — coach/admin only. Sets the target user's role as a custom
 * Auth claim AND mirrors it onto the Firestore user doc. Forces a token
 * refresh on the affected user so the new claim takes effect within ~5
 * seconds (next foreground / API call).
 *
 * Why custom claims: storage rules can't reliably read Firestore. With
 * `request.auth.token.role` we get a fast, free, in-token role check.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const ALLOWED_ROLES = ['community', 'client', 'coach', 'admin'] as const;
type Role = (typeof ALLOWED_ROLES)[number];

async function callerIsCoach(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'coach' || claims?.role === 'admin') return true;
    // Fallback: read Firestore role until all coaches have been migrated to claims.
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    return role === 'coach' || role === 'admin';
}

export const setUserRole = onCall(
    { region: 'us-central1', memory: '256MiB' },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        if (!(await callerIsCoach(callerUid))) {
            throw new HttpsError('permission-denied', 'Only coaches can change roles.');
        }

        const { targetUid, role } = (request.data ?? {}) as { targetUid?: string; role?: string };
        if (!targetUid || typeof targetUid !== 'string') {
            throw new HttpsError('invalid-argument', 'targetUid required.');
        }
        if (!role || !ALLOWED_ROLES.includes(role as Role)) {
            throw new HttpsError('invalid-argument', `role must be one of ${ALLOWED_ROLES.join('|')}.`);
        }

        // Set claim → token now carries the new role on next refresh.
        await getAuth().setCustomUserClaims(targetUid, { role });
        // Force a refresh: revoke existing tokens. Client gets booted within ~1 hour
        // automatically; client-side `visibilitychange` listener picks it up faster.
        await getAuth().revokeRefreshTokens(targetUid);

        // Mirror to Firestore for queries + UI display.
        await getFirestore().doc(`users/${targetUid}`).set(
            { role, updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
        );
        await getFirestore().doc(`publicProfiles/${targetUid}`).set(
            { role, updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
        );

        return { ok: true };
    },
);
