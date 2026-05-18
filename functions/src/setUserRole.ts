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
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { throttle } from './rateLimit';

/** Append-only audit-log helper. One doc per privileged action. Lives at
 *  auditLog/{auto} per firestore.rules — coach/admin can read for review,
 *  nobody can update/delete. */
async function writeAuditLog(
    db: Firestore,
    actor: { uid: string; role: string | null },
    action: string,
    target: string,
    extras: Record<string, unknown>,
): Promise<void> {
    try {
        await db.collection('auditLog').add({
            action,
            actorUid: actor.uid,
            actorRole: actor.role,
            target,
            ...extras,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        // Best-effort. We do NOT fail the main action if audit logging
        // fails — security-relevant actions still go through. Console
        // surfaces the audit gap so it can be triaged.
        // eslint-disable-next-line no-console
        console.warn(`[auditLog/${action}] write failed:`, err);
    }
}

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
        // Conservative — role changes should be rare. 20/min/caller is
        // plenty for legitimate bulk-promotion flows, hard stop for a
        // script trying to flip roles in a loop.
        await throttle(callerUid, 'setUserRole', { maxPerWindow: 20, windowSec: 60 });
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

        // Capture target's current role for the audit log entry (the
        // setSnap read above is repurposed if the admin-only branch
        // didn't fire; otherwise we read it here).
        const targetSnap = await getFirestore().doc(`users/${targetUid}`).get();
        const previousRole = (targetSnap.data()?.role as string | undefined) ?? null;

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

        // Audit log. Best-effort — see writeAuditLog comment. Captures
        // who-changed-whom-from-what-to-what for after-the-fact review
        // (e.g., "who demoted admin X last week?" — the role-history was
        // previously lost the moment the mirror overwrote it).
        await writeAuditLog(
            getFirestore(),
            { uid: callerUid, role: caller },
            'setUserRole',
            targetUid,
            { previousRole, newRole: role },
        );

        return { ok: true };
    },
);
