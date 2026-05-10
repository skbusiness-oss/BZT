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

async function callerRole(uid: string | undefined): Promise<Role | null> {
    if (!uid) return null;
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    const claimRole = claims?.role;
    if (claimRole === 'coach' || claimRole === 'admin') return claimRole;
    // Fallback: read Firestore role until all coaches have been migrated to claims.
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    if (role === 'admin' || role === 'coach' || role === 'client' || role === 'community') return role;
    return null;
}

export const setUserRole = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public' },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        const caller = await callerRole(callerUid);
        if (caller !== 'coach' && caller !== 'admin') {
            throw new HttpsError('permission-denied', 'Only coaches can change roles.');
        }

        const { targetUid, role } = (request.data ?? {}) as { targetUid?: string; role?: string };
        if (!targetUid || typeof targetUid !== 'string') {
            throw new HttpsError('invalid-argument', 'targetUid required.');
        }
        if (!role || !ALLOWED_ROLES.includes(role as Role)) {
            throw new HttpsError('invalid-argument', `role must be one of ${ALLOWED_ROLES.join('|')}.`);
        }

        // Privilege escalation guard: only existing admins can grant the
        // `admin` role. Without this, any coach could call
        // `setUserRole({ targetUid: myOwnUid, role: 'admin' })` and take
        // over the platform. Coaches can promote up to `coach` only.
        if (role === 'admin' && caller !== 'admin') {
            throw new HttpsError('permission-denied', 'Only admins can grant the admin role.');
        }
        // Symmetric guard: only an admin can demote another admin.
        if (targetUid !== callerUid) {
            const targetSnap = await getFirestore().doc(`users/${targetUid}`).get();
            const targetCurrentRole = targetSnap.data()?.role;
            if (targetCurrentRole === 'admin' && caller !== 'admin') {
                throw new HttpsError('permission-denied', 'Only admins can change another admin\'s role.');
            }
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
