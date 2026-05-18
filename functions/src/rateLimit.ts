/**
 * Per-uid rate limiter for callable Cloud Functions.
 *
 * Uses a tiny Firestore doc per (function, uid) pair to track invocation
 * count in a rolling window. Cheap — one get() + one set() per call.
 * Throws `resource-exhausted` when the caller exceeds the limit.
 *
 *   await throttle(callerUid, 'awardXp', { maxPerWindow: 30, windowSec: 60 });
 *
 * Without this, a single authenticated user with a script can hammer
 * setUserRole / awardXp / deleteUser at 100K calls/sec, burning Cloud
 * Functions + Firestore quota. Firebase Auth's default per-IP throttle
 * doesn't apply to authenticated callable invocations.
 *
 * NOT for write-heavy abuse prevention (use Cloud Armor / GCS Quota
 * for that). This is a "slow your roll" speedbump that costs ~$0 extra
 * per legitimate call.
 *
 * Doc shape: rateLimits/{uid}_{fnName} = { count: number; windowStart: Timestamp }
 */
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface ThrottleOpts {
    /** Max invocations allowed within the window. */
    maxPerWindow: number;
    /** Window size in seconds. */
    windowSec: number;
}

/**
 * Throw `resource-exhausted` if `uid` has made more than `maxPerWindow`
 * calls to `fnName` in the last `windowSec` seconds. Otherwise count
 * this call towards the current window.
 *
 * Best-effort. Read+write race conditions exist between concurrent
 * calls (TOCTOU) but this is a speedbump for casual abuse, not a
 * hard guarantee. Defenders run hard rate limits at the CDN/load
 * balancer for that.
 */
export async function throttle(
    uid: string | undefined,
    fnName: string,
    opts: ThrottleOpts,
): Promise<void> {
    if (!uid) return; // unauthenticated calls are rejected elsewhere

    const db = getFirestore();
    const ref = db.doc(`rateLimits/${uid}_${fnName}`);
    const now = Date.now();
    const windowMs = opts.windowSec * 1000;

    const snap = await ref.get();
    const data = snap.data() as { count?: number; windowStart?: Timestamp } | undefined;

    const windowStartMs = data?.windowStart?.toMillis() ?? 0;
    const windowExpired = now - windowStartMs >= windowMs;

    if (windowExpired) {
        // Fresh window — reset counter, allow this call.
        await ref.set(
            {
                count: 1,
                windowStart: FieldValue.serverTimestamp(),
                fnName, // for ops debugging — easy to grep auditLog ↔ rateLimits
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: false },
        );
        return;
    }

    const currentCount = data?.count ?? 0;
    if (currentCount >= opts.maxPerWindow) {
        throw new HttpsError(
            'resource-exhausted',
            `Too many ${fnName} calls. Wait ~${opts.windowSec}s and try again.`,
        );
    }

    // Within the window — increment counter, keep existing windowStart.
    await ref.update({
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
    });
}
