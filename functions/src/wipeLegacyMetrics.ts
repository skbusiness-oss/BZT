/**
 * wipeLegacyMetrics — admin-only callable. One-shot cleanup that nukes
 * every user's check-in subcollections so the schema split (selfLogs ->
 * weighIns + metrics) starts everyone from zero.
 *
 * What it deletes per user:
 *   - users/{uid}/selfLogs/*    (legacy combined doc, with locked: true rows
 *                                blocking new submissions under the old rule)
 *   - users/{uid}/weighIns/*    (new weight collection — fresh if just deployed)
 *   - users/{uid}/metrics/*     (new metrics collection — fresh too)
 *   - users/{uid}/xpEvents/*    (XP idempotency markers — without this,
 *                                a wiped selfLog still blocks the XP credit
 *                                for the next fresh submission on the same
 *                                date because xpEvents/SELF_LOG__YYYY-MM-DD
 *                                already exists)
 *
 * Optionally clears the user-doc weight anchors:
 *   - currentWeightKg  (so the dashboard doesn't show a stale number)
 *   - startWeightKg    (so the chart's startWeight migration re-runs cleanly)
 *
 * Uses the admin SDK which bypasses Firestore rules — necessary because
 * the existing rules block delete on `locked: true` rows.
 *
 * Usage from Firebase Console > Functions > wipeLegacyMetrics > "Test
 * function" tab, paste:
 *   { "data": { "all": true, "clearWeightAnchors": true } }
 * Click "Test the function".
 *
 * Or for a single user:
 *   { "data": { "targetUid": "abc123", "clearWeightAnchors": true } }
 *
 * Safety: this is destructive and irreversible (no soft-delete). Caller
 * MUST be an admin (claims OR Firestore role). Coaches are explicitly
 * NOT allowed to invoke this — too easy to fat-finger an entire user base
 * away.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

const SUBCOLLECTIONS_TO_WIPE = ['selfLogs', 'weighIns', 'metrics', 'xpEvents'] as const;
const BATCH_SIZE = 200;

async function callerIsAdmin(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'admin') return true;
    // Fallback for accounts whose admin role only lives in Firestore (the
    // claim-migration is incomplete for older admins).
    const snap = await getFirestore().doc(`users/${uid}`).get();
    return snap.data()?.role === 'admin';
}

/** Delete every doc in a subcollection in batched commits. Returns the
 *  total deleted count. Each batch is capped at BATCH_SIZE to stay under
 *  Firestore's 500-write batch limit with headroom. */
async function wipeSubcollection(db: Firestore, path: string): Promise<number> {
    const ref = db.collection(path);
    let total = 0;
    for (;;) {
        const snap = await ref.limit(BATCH_SIZE).get();
        if (snap.empty) return total;
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        total += snap.size;
        // If we got less than a full page, we're done — saves a round-trip.
        if (snap.size < BATCH_SIZE) return total;
    }
}

interface WipeResult {
    uid: string;
    deleted: Record<string, number>;
    weightAnchorsCleared: boolean;
}

async function wipeOne(
    db: Firestore,
    uid: string,
    clearWeightAnchors: boolean,
): Promise<WipeResult> {
    const deleted: Record<string, number> = {};
    for (const sub of SUBCOLLECTIONS_TO_WIPE) {
        deleted[sub] = await wipeSubcollection(db, `users/${uid}/${sub}`);
    }
    if (clearWeightAnchors) {
        await db.doc(`users/${uid}`).set(
            {
                currentWeightKg: FieldValue.delete(),
                startWeightKg: FieldValue.delete(),
                activityScore: 0,
                streak: FieldValue.delete(),
                lastActiveAt: FieldValue.delete(),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
    }
    return { uid, deleted, weightAnchorsCleared: clearWeightAnchors };
}

export const wipeLegacyMetrics = onCall(
    { region: 'us-central1', memory: '512MiB', invoker: 'public', timeoutSeconds: 540 },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        if (!(await callerIsAdmin(callerUid))) {
            throw new HttpsError(
                'permission-denied',
                'Only admins can wipe legacy metrics. Coaches are not permitted.',
            );
        }

        const { targetUid, all, clearWeightAnchors } = (request.data ?? {}) as {
            targetUid?: string;
            all?: boolean;
            clearWeightAnchors?: boolean;
        };
        if (!all && !targetUid) {
            throw new HttpsError(
                'invalid-argument',
                'Must specify either `all: true` or `targetUid: <uid>`.',
            );
        }
        if (all && targetUid) {
            throw new HttpsError(
                'invalid-argument',
                'Specify `all` OR `targetUid`, not both.',
            );
        }

        const db = getFirestore();
        const wipeAnchors = clearWeightAnchors === true; // default false unless explicit

        // Single-user path.
        if (targetUid) {
            const result = await wipeOne(db, targetUid, wipeAnchors);
            return { ok: true, count: 1, results: [result] };
        }

        // All-users path. Stream the users collection in pages so memory
        // stays flat regardless of user count.
        const results: WipeResult[] = [];
        let lastDocId: string | null = null;
        for (;;) {
            let q = db.collection('users').orderBy('__name__').limit(50);
            if (lastDocId) q = q.startAfter(lastDocId);
            const page = await q.get();
            if (page.empty) break;
            for (const userDoc of page.docs) {
                const r = await wipeOne(db, userDoc.id, wipeAnchors);
                results.push(r);
            }
            lastDocId = page.docs[page.docs.length - 1].id;
            if (page.size < 50) break;
        }

        // Summary totals for quick visual sanity in the console output.
        const totals: Record<string, number> = {};
        for (const r of results) {
            for (const [k, v] of Object.entries(r.deleted)) {
                totals[k] = (totals[k] ?? 0) + v;
            }
        }
        return {
            ok: true,
            count: results.length,
            totals,
            weightAnchorsCleared: wipeAnchors,
        };
    },
);
