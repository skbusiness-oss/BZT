/**
 * Coach broadcast notifications.
 *
 * The coach writes a note in the in-app /broadcast page and picks an
 * audience (all, community only, coaching only, or both). The form
 * writes a single doc to broadcasts/{id} with:
 *   { body, audience: 'all' | 'community' | 'coaching' | 'both',
 *     senderId, senderName, createdAt }
 *
 * This trigger fires on that write, resolves the audience to a list
 * of users by role, and fans out a push notification to each user's
 * FCM tokens via the same `pushToUser` helper we use for chat.
 *
 * Audience matrix:
 *   'all'         → roles in ['client', 'community']
 *   'community'   → role === 'community'
 *   'coaching'    → role === 'client'
 *   'both'        → roles in ['client', 'community']  (alias of 'all',
 *                                                      kept explicit
 *                                                      for the UI's
 *                                                      label clarity)
 *
 * Cost: broadcasts are infrequent (coach sends a handful per week),
 * so we DON'T set minInstances:1 here. A cold start on a manually-
 * triggered broadcast is acceptable — coach hits Send, push lands
 * within ~5-10s. Compare with onMessageCreated which is conversation-
 * latency-critical.
 *
 * The push payload sets data.type='broadcast' + data.broadcastId so
 * the SW's notificationclick handler routes to /notifications (the
 * inbox page).
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface BroadcastDoc {
    body?: string;
    audience?: 'all' | 'community' | 'coaching' | 'both';
    senderId?: string;
    senderName?: string;
}

interface UserDoc {
    fcmTokens?: string[];
    role?: 'admin' | 'coach' | 'client' | 'community';
}

/**
 * Send a push to a single user. Mirrors functions/src/pushNotifications.ts
 * pushToUser exactly — duplicated here rather than imported to keep the
 * broadcast function self-contained and avoid an unrelated TS file
 * dependency cycle. If we ever change push payload shape, update both.
 */
async function pushToUserBroadcast(
    uid: string,
    payload: { title: string; body: string; data: Record<string, string> },
): Promise<{ success: number; failure: number }> {
    const db = getFirestore();
    // eslint-disable-next-line no-console
    const log = (...args: unknown[]) => console.log('[broadcastPushToUser]', uid.slice(0, 8), ...args);

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
        log('SKIP: user doc does not exist');
        return { success: 0, failure: 0 };
    }
    const userData = (userSnap.data() ?? {}) as UserDoc;
    const tokens = userData.fcmTokens ?? [];
    if (tokens.length === 0) {
        log('SKIP: no fcmTokens');
        return { success: 0, failure: 0 };
    }

    const result = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data,
        webpush: {
            fcmOptions: { link: payload.data.url || '/notifications' },
            notification: {
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                requireInteraction: false,
            },
            headers: { TTL: '600', Urgency: 'high' },
        },
        android: { priority: 'high', ttl: 600_000 },
        apns: {
            payload: { aps: { sound: 'default', 'mutable-content': 1 } },
            headers: {
                'apns-push-type': 'alert',
                'apns-priority': '10',
                'apns-expiration': String(Math.floor(Date.now() / 1000) + 600),
            },
        },
    });

    // Prune stale tokens (same logic as the chat pushToUser).
    const staleTokens: string[] = [];
    result.responses.forEach((r, i) => {
        if (r.success) return;
        const code = r.error?.code ?? '';
        if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
        ) {
            staleTokens.push(tokens[i]);
        }
    });
    if (staleTokens.length > 0) {
        await db.doc(`users/${uid}`).update({
            fcmTokens: FieldValue.arrayRemove(...staleTokens),
        });
    }

    log(`success=${result.successCount}, failure=${result.failureCount}`);
    return { success: result.successCount, failure: result.failureCount };
}

/**
 * Resolve a broadcast audience tag to a list of recipient UIDs.
 */
async function resolveAudience(audience: BroadcastDoc['audience']): Promise<string[]> {
    const db = getFirestore();
    const roles: UserDoc['role'][] =
        audience === 'community' ? ['community'] :
        audience === 'coaching'  ? ['client'] :
        /* all | both | undefined */ ['client', 'community'];

    // Firestore 'in' query supports max 30 values, but we only have 2
    // so we're well within bounds.
    const snap = await db.collection('users').where('role', 'in', roles).get();
    return snap.docs
        .filter((d) => {
            // Skip disabled users so a deactivated account doesn't get
            // a notification ping that would deep-link them into a UI
            // that immediately signs them out.
            const data = d.data() as { disabled?: boolean };
            return !data.disabled;
        })
        .map((d) => d.id);
}

export const onBroadcastCreated = onDocumentCreated(
    'broadcasts/{broadcastId}',
    async (event) => {
        // eslint-disable-next-line no-console
        console.log('[onBroadcastCreated] fired for', event.params.broadcastId);

        const data = event.data?.data() as BroadcastDoc | undefined;
        if (!data) {
            // eslint-disable-next-line no-console
            console.warn('[onBroadcastCreated] no data, exiting');
            return;
        }
        const body = (data.body ?? '').trim();
        const audience = data.audience ?? 'all';
        const senderName = data.senderName ?? 'Coach Zaki';
        if (!body) {
            // eslint-disable-next-line no-console
            console.warn('[onBroadcastCreated] empty body, skipping push');
            return;
        }

        const recipients = await resolveAudience(audience);
        // eslint-disable-next-line no-console
        console.log(`[onBroadcastCreated] audience='${audience}' → ${recipients.length} user(s)`);

        const title = `${senderName}`;
        const preview = body.length > 140 ? body.slice(0, 137) + '...' : body;

        // Fan out in parallel. Promise.allSettled so one user's token
        // failures don't tank the whole broadcast.
        const results = await Promise.allSettled(
            recipients.map((uid) =>
                pushToUserBroadcast(uid, {
                    title,
                    body: preview,
                    data: {
                        type: 'broadcast',
                        broadcastId: event.params.broadcastId,
                        url: '/notifications',
                        senderId: data.senderId ?? '',
                    },
                }),
            ),
        );

        const totalSuccess = results.reduce((acc, r) => {
            if (r.status === 'fulfilled') return acc + r.value.success;
            return acc;
        }, 0);
        const totalFailure = results.reduce((acc, r) => {
            if (r.status === 'fulfilled') return acc + r.value.failure;
            return acc + 1; // promise rejected = whole-user failure
        }, 0);
        // eslint-disable-next-line no-console
        console.log(`[onBroadcastCreated] DONE — pushed to ${totalSuccess} device(s), ${totalFailure} failure(s)`);
    },
);
