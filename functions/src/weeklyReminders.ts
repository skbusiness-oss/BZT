/**
 * weeklyReminders — scheduled push that nudges every active user to
 * log their weekly check-in (coaching clients) or weekly update +
 * cardio (community). Runs every Sunday at 18:00 UTC (Cairo/Istanbul
 * evening — close to user prime-time without burning into late night).
 *
 * Targets:
 *   - role: 'client'   → "Don't forget your weekly check-in. Tap to log."
 *   - role: 'community' → "Time to log your weekly update + cardio."
 *
 * Skips:
 *   - users with `disabled: true`
 *   - users with no fcmTokens (nothing to push to)
 *   - users who already submitted this week (checkIns where status in
 *     ['submitted','reviewed'] for the current 7-day window — clients
 *     only; community uses weeklyUpdates collection, see below)
 *
 * Why a single weekly cron vs per-user smart scheduling: 1 function
 * invocation per week per user keeps cost flat, and the "did they
 * already submit?" check inline keeps the message accurate. A more
 * sophisticated streak-based ping can replace this later.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

interface UserDoc {
    role?: string;
    disabled?: boolean;
    fcmTokens?: string[];
}

function startOfWeekUtc(now: Date): Date {
    // Week starts Monday 00:00 UTC. (Sunday triggers the reminder, so
    // "this week" = the Monday-to-Sunday window that just finished.)
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    const dow = d.getUTCDay(); // 0 = Sun, 1 = Mon, ...
    const daysSinceMonday = (dow + 6) % 7;
    d.setUTCDate(d.getUTCDate() - daysSinceMonday);
    return d;
}

export const weeklyReminders = onSchedule(
    {
        // 18:00 every Sunday (UTC).
        schedule: 'every sunday 18:00',
        timeZone: 'UTC',
        region: 'us-central1',
        memory: '256MiB',
    },
    async () => {
        const db = getFirestore();
        const now = new Date();
        const weekStart = startOfWeekUtc(now);

        const usersSnap = await db.collection('users').get();
        const clientPush: Promise<unknown>[] = [];
        const communityPush: Promise<unknown>[] = [];

        for (const userDoc of usersSnap.docs) {
            const data = (userDoc.data() ?? {}) as UserDoc;
            if (data.disabled === true) continue;
            const tokens = data.fcmTokens ?? [];
            if (tokens.length === 0) continue;

            if (data.role === 'client') {
                // Skip if they already submitted this week.
                const checkInsSnap = await db.collection('checkIns')
                    .where('userId', '==', userDoc.id)
                    .where('weekStart', '>=', weekStart.toISOString())
                    .limit(1)
                    .get();
                if (!checkInsSnap.empty) {
                    const c = checkInsSnap.docs[0].data();
                    if (c.status === 'submitted' || c.status === 'reviewed') continue;
                }
                clientPush.push(
                    getMessaging().sendEachForMulticast({
                        tokens,
                        notification: {
                            title: 'Check-in reminder',
                            body: 'Time to submit your weekly check-in. Coach Zaki is waiting.',
                        },
                        data: { type: 'reminder-checkin', url: '/checkin' },
                        webpush: { fcmOptions: { link: '/checkin' } },
                        android: { priority: 'high' },
                        apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
                    }).catch(() => null),
                );
            } else if (data.role === 'community') {
                // Skip if a weeklyUpdate exists for this week.
                const updateRef = db.doc(`users/${userDoc.id}/weeklyUpdates/${weekStart.toISOString().slice(0, 10)}`);
                const exists = (await updateRef.get()).exists;
                if (exists) continue;
                communityPush.push(
                    getMessaging().sendEachForMulticast({
                        tokens,
                        notification: {
                            title: 'Weekly update reminder',
                            body: 'Time to log your weekly update + cardio.',
                        },
                        data: { type: 'reminder-update', url: '/update' },
                        webpush: { fcmOptions: { link: '/update' } },
                        android: { priority: 'high' },
                        apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
                    }).catch(() => null),
                );
            }
        }

        await Promise.all([...clientPush, ...communityPush]);

        // Audit log so we can verify the run later.
        await db.collection('auditLog').add({
            action: 'weeklyReminders',
            clientPushCount: clientPush.length,
            communityPushCount: communityPush.length,
            weekStart: weekStart.toISOString(),
            createdAt: new Date(),
        });
    },
);
