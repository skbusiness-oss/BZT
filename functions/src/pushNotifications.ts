/**
 * Push notification triggers.
 *
 * Two events fire here:
 *   - `onMessageCreated`: new doc in messages/{id} → push to receiver's
 *     registered FCM tokens. The receiver gets a system notification
 *     even when the app is closed.
 *   - `onCheckInReviewed`: a checkIns/{id} doc transitions from status
 *     'submitted' → 'reviewed' (coach left feedback). The client gets
 *     a push saying their week was reviewed.
 *
 * Token lifecycle:
 *   - Tokens land in `users/{uid}.fcmTokens` array via src/lib/fcm.ts
 *     after sign-in.
 *   - FCM returns 410/404 for stale tokens (uninstalled PWA, revoked
 *     permission). When that happens, we prune the stale token from
 *     the user doc so future pushes don't waste cycles on it.
 *   - Tokens DON'T expire on a fixed schedule — they survive across
 *     sessions until explicitly revoked.
 *
 * Cost shape: a single push costs ~$0.0000004 in Cloud Functions
 * invocations + zero in FCM (Google charges per-bandwidth, free at
 * our scale). Triggers run from Firestore writes that ALREADY pay
 * for themselves; this is incremental, not a new cost class.
 */
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface UserDoc {
    fcmTokens?: string[];
    displayName?: string;
    name?: string;
}

/**
 * Send a push to every token a user has registered. Returns the number
 * of tokens that FCM accepted. Stale tokens are pruned from the user
 * doc atomically (FieldValue.arrayRemove per failed token).
 */
async function pushToUser(
    uid: string,
    payload: {
        title: string;
        body: string;
        data?: Record<string, string>;
    },
): Promise<number> {
    const db = getFirestore();
    // eslint-disable-next-line no-console
    const log = (...args: unknown[]) => console.log('[pushToUser]', uid.slice(0, 8), ...args);

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
        log('SKIP: user doc does not exist');
        return 0;
    }
    const userData = (userSnap.data() ?? {}) as UserDoc;
    const tokens = userData.fcmTokens ?? [];
    if (tokens.length === 0) {
        log('SKIP: no fcmTokens on user doc');
        return 0;
    }
    log(`sending to ${tokens.length} token(s)`);

    // sendEachForMulticast tells us which tokens failed individually.
    // We can then prune precisely without retrying-the-whole-batch on
    // partial failures.
    let result: Awaited<ReturnType<ReturnType<typeof getMessaging>['sendEachForMulticast']>>;
    try {
        result = await getMessaging().sendEachForMulticast({
        tokens,
        // Send a `notification` payload (title/body) so the browser
        // AUTO-DISPLAYS the OS notification when the app is closed —
        // no SW execution required for display. This is the only
        // reliable way to get notifications when the PWA is fully
        // killed (especially on iOS / mobile Chrome in power save).
        //
        // `data` is for routing only (URL, type). The SW's
        // notificationclick handler reads `data.url` for deep linking.
        //
        // The SW's onBackgroundMessage is deliberately a no-op when a
        // notification payload is present (see firebase-messaging-sw.js)
        // to avoid duplicate notifications on platforms that fire both.
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: {
            ...(payload.data ?? {}),
        },
        webpush: {
            // Web-specific overrides. fcm_options.link controls where
            // a click navigates when the notification is auto-displayed
            // by the browser (no SW execution required).
            fcmOptions: {
                link: payload.data?.url || '/',
            },
            notification: {
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                requireInteraction: payload.data?.requireInteraction === 'true',
            },
            // TTL in seconds — see android.ttl note below. Web push
            // (VAPID) reads this header per RFC 8030.
            headers: {
                TTL: '600',
                Urgency: 'high',
            },
        },
        // High priority on Android: Google delivers within seconds
        // instead of batching for power-saving. Reasonable for chat
        // and coach-feedback events.
        //
        // TTL = 10 minutes. If the device is offline longer than this,
        // FCM drops the message instead of queueing — prevents the
        // "5 old notifications fire when phone comes back online" UX
        // we were seeing. A new-message ping that's >10 min stale is
        // worse than no ping at all; the user will see the unread
        // count in the app when they next open it.
        android: {
            priority: 'high',
            ttl: 600_000, // milliseconds in the admin SDK
        },
        // APNS priority 10 = immediate. Apple uses these for sound/
        // badge updates; matches Android high priority. apns-expiration
        // = epoch seconds; using 0 would mean "drop if not deliverable
        // immediately". 10 minutes matches the Android/web TTL so all
        // three transports have the same staleness window.
        //
        // CRITICAL — `apns-push-type: alert` is REQUIRED by Apple for
        // visible notifications since iOS 13 / WebKit Web Push (iOS
        // 16.4+). Without it, Apple's gateway treats the push as a
        // generic background event and may coalesce / delay / silently
        // drop it. Symptom that pointed at this: "notifications are
        // late, and only arrive after I open the app and quit it" —
        // exactly the behavior of pushes that have to wait for the
        // PWA to be foregrounded so iOS can decide they're meant to
        // be visible.
        //
        // `apns-collapse-id` is set to the conversation key (when
        // present) so multiple back-to-back messages in the same
        // thread replace each other on the lock screen rather than
        // piling up.
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    'mutable-content': 1, // enables iOS notification-service-extension rich content
                },
            },
            headers: {
                'apns-push-type': 'alert',
                'apns-priority': '10',
                'apns-expiration': String(Math.floor(Date.now() / 1000) + 600),
                ...(payload.data?.threadId
                    ? { 'apns-collapse-id': String(payload.data.threadId).slice(0, 64) }
                    : {}),
            },
        },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string })?.code ?? '(no code)';
        // eslint-disable-next-line no-console
        console.error('[pushToUser]', uid.slice(0, 8), 'sendEachForMulticast THREW:', code, msg);
        throw err;
    }

    log(`result: success=${result.successCount}, failure=${result.failureCount}`);

    // Prune stale tokens AND log every failure (not just the prune-worthy
    // ones). Without this, IAM permission errors etc. were invisible.
    const staleTokens: string[] = [];
    result.responses.forEach((r, i) => {
        if (r.success) return;
        const code = r.error?.code ?? '(no code)';
        const msg = r.error?.message ?? '(no message)';
        // eslint-disable-next-line no-console
        console.warn('[pushToUser]', uid.slice(0, 8), `token #${i} failed:`, code, msg);
        // The two codes that mean "this token is dead, stop trying"
        // per Firebase docs.
        if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
        ) {
            staleTokens.push(tokens[i]);
        }
    });
    if (staleTokens.length > 0) {
        log(`pruning ${staleTokens.length} stale token(s)`);
        await db.doc(`users/${uid}`).update({
            fcmTokens: FieldValue.arrayRemove(...staleTokens),
        });
    }
    return result.successCount;
}

/**
 * New message → notify the receiver. The receiver is the OTHER party
 * (we deliberately don't push the sender for their own outbound).
 * URL deep-link routes to /messages with their conversation pre-
 * selected, so a tap from the lock screen goes straight to the thread.
 */
export const onMessageCreated = onDocumentCreated(
    'messages/{messageId}',
    async (event) => {
        // eslint-disable-next-line no-console
        console.log('[onMessageCreated] fired for', event.params.messageId);
        const msg = event.data?.data();
        if (!msg) {
            // eslint-disable-next-line no-console
            console.warn('[onMessageCreated] no msg data, exiting');
            return;
        }
        const receiverId = msg.receiverId as string | undefined;
        const senderId = msg.senderId as string | undefined;
        const senderName = (msg.senderName as string | undefined) ?? 'Someone';
        const text = (msg.text as string | undefined) ?? '';
        const hasImage = typeof msg.imageUrl === 'string' && msg.imageUrl.length > 0;
        // eslint-disable-next-line no-console
        console.log('[onMessageCreated] from', senderId?.slice(0, 8), '→', receiverId?.slice(0, 8));
        if (!receiverId || !senderId || receiverId === senderId) {
            // eslint-disable-next-line no-console
            console.warn('[onMessageCreated] skip: invalid sender/receiver pair');
            return;
        }
        const body = text
            ? (text.length > 140 ? text.slice(0, 137) + '...' : text)
            : (hasImage ? 'Sent you a photo.' : 'Sent you a message.');

        await pushToUser(receiverId, {
            title: `New message from ${senderName}`,
            // Trim long messages — notification body has a hard char
            // limit on iOS (~178) and gets clipped past ~80 on Android.
            body,
            data: {
                type: 'message',
                messageId: event.params.messageId,
                senderId,
                // Deep-link target. Clicked notification opens this URL
                // via the SW's notificationclick handler.
                url: `/messages?to=${senderId}`,
                // threadId drives apns-collapse-id in pushToUser — keeps
                // multiple messages in the same conversation from piling
                // up as separate lock-screen entries.
                threadId: `msg:${senderId}:${receiverId}`,
            },
        });
    },
);

/**
 * Check-in reviewed by coach → notify the client. Fires only on the
 * specific status transition 'submitted' → 'reviewed' (or anything
 * → 'reviewed' from a non-reviewed prior state). Other update events
 * (coach typing feedback live, target changes, etc.) are ignored.
 */
export const onCheckInReviewed = onDocumentUpdated(
    'checkIns/{checkInId}',
    async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();
        if (!before || !after) return;
        const beforeStatus = before.status as string | undefined;
        const afterStatus = after.status as string | undefined;

        // Only fire on the specific transition INTO 'reviewed'.
        if (afterStatus !== 'reviewed' || beforeStatus === 'reviewed') return;

        // Recipient resolution. The `checkIns` schema stores TWO
        // different fields and they are NOT the same thing:
        //   - userId   = the auth UID of the user (matches users/{uid})
        //   - clientId = the doc ID in the `clients` collection
        // FCM tokens live under users/{uid}, so we MUST use userId.
        // If userId is missing (legacy docs), fall back to clientId on
        // the off chance the two happened to match.
        const clientUid = (after.userId as string | undefined) ?? (after.clientId as string | undefined);
        if (!clientUid) return;

        const weekNumber = (after.weekNumber as number | undefined) ?? null;
        const weekLabel = weekNumber !== null ? `week ${weekNumber}` : 'your check-in';

        await pushToUser(clientUid, {
            title: 'Your week has been reviewed',
            body: `Coach Zaki left feedback on ${weekLabel}. Tap to view.`,
            data: {
                type: 'review',
                checkInId: event.params.checkInId,
                weekNumber: String(weekNumber ?? ''),
                // Deep-link to the profile / check-in detail surface.
                // The CheckIn page reads the latest week by default;
                // a more specific deep-link (e.g., /checkin/<weekNum>)
                // can land here later once the route exists.
                url: '/checkin',
                requireInteraction: 'true',
            },
        });

        // Belt + suspenders: also create an auto-message FROM the coach
        // to the client. Two reasons:
        //   1. If the FCM push above silently fails (token stale, perm
        //      revoked, browser quirk), the client still gets visible
        //      proof of review via the inbox + the message-created
        //      trigger fires its own redundant push.
        //   2. Gives the client a thread to reply with questions about
        //      the feedback — they don't have to compose a new chat.
        //
        // Idempotency: deterministic message doc id keyed on the
        // check-in id. If the trigger fires twice (Eventarc
        // at-least-once delivery), the second .create() throws
        // ALREADY_EXISTS, which we swallow.
        const COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3';
        const COACH_NAME = 'Coach Zaki';
        const db = getFirestore();
        const messageRef = db.doc(`messages/feedback-${event.params.checkInId}`);
        const weekLabelAr = weekNumber !== null ? `الأسبوع ${weekNumber}` : 'تسجيلك';
        const bilingualBody =
            `Your ${weekLabel} feedback is ready — check it on your profile, ` +
            `and reply here with any questions.\n\n` +
            `راجع ملاحظات ${weekLabelAr} في صفحة الملف الشخصي، وإذا كانت لديك أسئلة اكتبها هنا.`;
        try {
            await messageRef.create({
                senderId: COACH_UID,
                receiverId: clientUid,
                senderName: COACH_NAME,
                text: bilingualBody,
                timestamp: FieldValue.serverTimestamp(),
                read: false,
                kind: 'auto-feedback-review',
                checkInId: event.params.checkInId,
            });
        } catch (err: unknown) {
            // ALREADY_EXISTS = duplicate event delivery; safe to ignore.
            const code = (err as { code?: string | number })?.code;
            if (code !== 6 && code !== 'already-exists') {
                throw err;
            }
        }
    },
);
