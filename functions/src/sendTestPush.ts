/**
 * sendTestPush — callable. Sends a single test push to the caller's
 * own registered FCM tokens so the user can verify the end-to-end
 * delivery pipeline without needing a second account to message them.
 *
 * Returns:
 *   { ok, tokenCount, successCount, failureCount, failures: [{code,message}], userExists }
 *
 * Failure modes the caller can act on:
 *   - tokenCount === 0
 *     -> Device never registered. Check Notification.permission +
 *        registerFcmToken logs in DevTools.
 *   - tokenCount > 0 but successCount === 0
 *     -> Tokens stale or FCM rejecting. Inspect `failures[].code`.
 *   - successCount > 0 but no OS notification appears
 *     -> Browser-level issue: SW not handling the push, permission
 *        revoked at OS level, "Do Not Disturb" mode, etc.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { throttle } from './rateLimit';

interface UserDoc {
    fcmTokens?: string[];
}

export const sendTestPush = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public', timeoutSeconds: 30 },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        await throttle(callerUid, 'sendTestPush', { maxPerWindow: 10, windowSec: 60 });

        const db = getFirestore();
        const userSnap = await db.doc(`users/${callerUid}`).get();
        const userExists = userSnap.exists;
        const userData = (userSnap.data() ?? {}) as UserDoc;
        const tokens = userData.fcmTokens ?? [];

        if (tokens.length === 0) {
            return {
                ok: false,
                tokenCount: 0,
                successCount: 0,
                failureCount: 0,
                failures: [] as { code: string; message: string }[],
                userExists,
                reason: 'No FCM tokens registered for this user. Open the app, grant notification permission, and check DevTools console for [fcm] log lines.',
            };
        }

        const result = await getMessaging().sendEachForMulticast({
            tokens,
            notification: {
                title: 'BioZackTeam — Test push',
                body: 'If you see this, push notifications are working on this device.',
            },
            data: { type: 'test', url: '/' },
            webpush: {
                fcmOptions: { link: '/' },
                notification: {
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                },
            },
            android: { priority: 'high' },
            apns: {
                payload: { aps: { sound: 'default' } },
                headers: { 'apns-priority': '10' },
            },
        });

        const failures: { code: string; message: string }[] = [];
        const staleTokens: string[] = [];
        result.responses.forEach((r, i) => {
            if (r.success) return;
            const code = r.error?.code ?? '(no code)';
            const message = r.error?.message ?? '(no message)';
            failures.push({ code, message });
            if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token'
            ) {
                staleTokens.push(tokens[i]);
            }
        });
        if (staleTokens.length > 0) {
            await db.doc(`users/${callerUid}`).update({
                fcmTokens: FieldValue.arrayRemove(...staleTokens),
            });
        }

        // Audit log so we can see test-push usage over time.
        try {
            await db.collection('auditLog').add({
                action: 'sendTestPush',
                actorUid: callerUid,
                tokenCount: tokens.length,
                successCount: result.successCount,
                failureCount: result.failureCount,
                stalePruned: staleTokens.length,
                createdAt: FieldValue.serverTimestamp(),
            });
        } catch {
            // best-effort
        }

        return {
            ok: result.successCount > 0,
            tokenCount: tokens.length,
            successCount: result.successCount,
            failureCount: result.failureCount,
            failures,
            userExists,
        };
    },
);
