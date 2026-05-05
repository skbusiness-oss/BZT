/**
 * Activity score client. ALL writes go through the `awardXp` Cloud Function;
 * the client cannot mutate `users/{uid}.activityScore` or `streak` directly
 * (Firestore rules block it). The function is idempotent — same
 * (source, sourceId) pair only credits once.
 *
 * `awardXp(uid, source, sourceId)` is a fire-and-forget convenience: errors
 * are logged but don't bubble up so a Firestore hiccup never breaks the
 * underlying user action.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * XP source allowlist. Must match the table in
 * `functions/src/awardXp.ts` exactly. Amounts live server-side; the client
 * just names the source.
 */
export const XP_SOURCE = {
    SELF_LOG: 'SELF_LOG',
    WEEKLY_CHECKIN: 'WEEKLY_CHECKIN',
    WORKOUT_DAY: 'WORKOUT_DAY',
    LESSON_COMPLETE: 'LESSON_COMPLETE',
    POST: 'POST',
    COMMENT: 'COMMENT',
} as const;

export type XpSource = keyof typeof XP_SOURCE;

const callAwardXp = httpsCallable<
    { source: XpSource; sourceId: string },
    { status: 'awarded' | 'duplicate'; amount: number }
>(functions, 'awardXp');

/**
 * Credit a user with XP for an action. Best-effort; failures are swallowed.
 *
 * @param uid    The user being credited. Must match the signed-in user
 *               (the function ignores this param and uses the caller's
 *               auth uid; we accept it here for backwards-compat with
 *               existing call sites).
 * @param source One of XP_SOURCE.
 * @param sourceId Stable identifier for the action (e.g. date, lesson ID,
 *               post ID). Same `(source, sourceId)` pair is idempotent.
 */
export async function awardXp(
    uid: string | undefined,
    source: XpSource,
    sourceId: string,
): Promise<void> {
    if (!uid || !sourceId) return;
    try {
        await callAwardXp({ source, sourceId });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('awardXp failed:', err);
    }
}

// ─── Local helpers (no server round-trip) ────────────────────────────────
// These mirror the formula on the server so dashboard UIs can show
// level/progress without an extra read after every write.

/** Level from score. 100 XP per level, simple linear. */
export function levelFromScore(score: number): number {
    return Math.max(1, Math.floor(score / 100) + 1);
}

/** Progress (0..100) toward the next level. */
export function levelProgress(score: number): number {
    return score % 100;
}

// ─── Backwards-compat: old call sites passed (uid, amount) ────────────────
// We keep `XP` exported so existing imports compile, but it's no longer
// the source of truth — the server owns the amounts.
export const XP = {
    SELF_LOG: 10,
    WEEKLY_CHECKIN: 50,
    WORKOUT_DAY: 20,
    LESSON_COMPLETE: 15,
    POST: 10,
    COMMENT: 3,
} as const;
