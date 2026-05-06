/**
 * awardXp — server-side, idempotent activity score writer.
 *
 * Why server-side: client-side awardXp was forgeable (anyone could increment
 * their own score from DevTools). This callable validates the source against
 * an allowlist, deduplicates by composite key, and is the ONLY path that
 * mutates `users/{uid}.activityScore`, `users/{uid}.streak`, and
 * `publicProfiles/{uid}` going forward.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// --- Constants (mirror src/lib/activityScore.ts) ---
const XP_TABLE: Record<string, number> = {
    SELF_LOG: 10,
    WEEKLY_CHECKIN: 50,
    WORKOUT_DAY: 20,
    LESSON_COMPLETE: 15,
    POST: 10,
    COMMENT: 3,
    STREAK_MILESTONE_7: 25,
};
const MAX_SOURCE_ID_LENGTH = 200;

interface ActivityStreak {
    current: number;
    best: number;
    lastActiveDate: string;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

function daysBetween(a: string, b: string): number {
    return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function nextStreak(prev: ActivityStreak | undefined, today: string): ActivityStreak {
    if (!prev || !prev.lastActiveDate) {
        return { current: 1, best: 1, lastActiveDate: today };
    }
    if (prev.lastActiveDate === today) return prev;
    const gap = daysBetween(prev.lastActiveDate, today);
    const current = gap === 1 ? prev.current + 1 : 1;
    return {
        current,
        best: Math.max(prev.best ?? 0, current),
        lastActiveDate: today,
    };
}

export const awardXp = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public' },
    async (request) => {
        const uid = request.auth?.uid;
        if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

        const data = request.data as { source?: string; sourceId?: string } | undefined;
        const source = data?.source;
        const sourceId = data?.sourceId;

        if (!source || typeof source !== 'string' || !(source in XP_TABLE)) {
            throw new HttpsError('invalid-argument', `Unknown XP source: ${source}`);
        }
        if (!sourceId || typeof sourceId !== 'string' || sourceId.length > MAX_SOURCE_ID_LENGTH) {
            throw new HttpsError('invalid-argument', 'sourceId required (string ≤ 200 chars).');
        }

        const amount = XP_TABLE[source];
        const eventId = `${source}__${sourceId}`;
        const db = getFirestore();
        const userRef = db.doc(`users/${uid}`);
        const publicRef = db.doc(`publicProfiles/${uid}`);
        const eventRef = db.doc(`users/${uid}/xpEvents/${eventId}`);

        // Idempotency + write in a single transaction.
        const result = await db.runTransaction(async (tx) => {
            const eventSnap = await tx.get(eventRef);
            if (eventSnap.exists) {
                return { status: 'duplicate' as const, amount: 0 };
            }
            const userSnap = await tx.get(userRef);
            const userData = userSnap.data() ?? {};

            // Refuse to credit a disabled user — defense in depth.
            if (userData.disabled === true) {
                throw new HttpsError('permission-denied', 'Account disabled.');
            }

            const today = todayISO();
            const prevStreak = userData.streak as ActivityStreak | undefined;
            const streak = nextStreak(prevStreak, today);

            tx.set(eventRef, {
                source,
                sourceId,
                amount,
                createdAt: FieldValue.serverTimestamp(),
            });
            tx.update(userRef, {
                activityScore: FieldValue.increment(amount),
                streak,
                lastActiveAt: FieldValue.serverTimestamp(),
            });
            tx.set(
                publicRef,
                {
                    name: userData.displayName ?? userData.name ?? 'Athlete',
                    role: userData.role ?? 'community',
                    activityScore: FieldValue.increment(amount),
                    streak,
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true },
            );

            return { status: 'awarded' as const, amount };
        });

        return result;
    },
);

// Re-export for unit tests.
export const __test__ = { nextStreak, daysBetween, XP_TABLE };
// Avoid the un-used Timestamp import warning when test exports change.
export type { Timestamp };
