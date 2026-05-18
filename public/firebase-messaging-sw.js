/* eslint-env serviceworker */
/* global importScripts, firebase */
/**
 * Firebase Messaging service worker — handles BACKGROUND push events.
 *
 * Loaded by the Firebase Messaging SDK when the user is offline / has
 * the tab in the background / has the PWA minimised. The SW wakes when
 * Google's push servers deliver a payload, fires a system Notification,
 * and (on click) focuses the existing app tab or opens a new one.
 *
 * Foreground messages don't hit this SW — they go through the
 * `onMessage` callback in src/lib/fcm.ts so the app can decide how to
 * render them in-context.
 *
 * Why the firebase compat shim (versus modular v9+ syntax): the
 * modular SDK doesn't ship a ready-to-use service worker bundle.
 * Compat works in classic service worker contexts without bundling.
 *
 * Keep the Firebase SDK version pinned and in sync with the version
 * the main app uses (see package.json firebase entry) so the SW and
 * the app speak the same protocol.
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Mirror src/lib/firebase.ts. apiKey is safe to expose in client
// surfaces (it's a project identifier, NOT an auth secret — actual
// access is controlled by Firestore + Storage rules).
// Must EXACTLY match the values in .env.local (VITE_FIREBASE_*).
// If senderId/appId here disagree with the main app, Google's push
// servers route the token to a different project and pushes silently
// fail — symptom: getToken succeeds, no notifications ever arrive.
firebase.initializeApp({
    apiKey: 'AIzaSyAoClMgn0gpXR-TKyOAIip3k5v6eKqoo1U',
    authDomain: 'biozackteam-3d593.firebaseapp.com',
    projectId: 'biozackteam-3d593',
    storageBucket: 'biozackteam-3d593.firebasestorage.app',
    messagingSenderId: '51844467480',
    appId: '1:51844467480:web:82166cd88343dac05e6c6d',
});

const messaging = firebase.messaging();

/**
 * Background push handler. Payload shape (from our Cloud Functions):
 *   {
 *     notification: { title, body },
 *     data: { url?, type?, requireInteraction? },
 *     webpush: { fcmOptions: { link }, notification: { icon, badge } }
 *   }
 *
 * Server sends a `notification` field, which means the BROWSER
 * automatically displays the OS notification — onBackgroundMessage
 * is called only for telemetry / extra side-effects, NOT for
 * rendering. We intentionally skip showNotification here when the
 * payload contains a notification field, otherwise the user sees
 * two notifications for every push (one browser, one ours).
 *
 * If a payload arrives with no `notification` field (data-only),
 * we fall back to composing one ourselves so the user still sees it.
 */
messaging.onBackgroundMessage(function (payload) {
    // Browser already rendered it — nothing to do. Log for diagnostics.
    if (payload.notification) {
        // eslint-disable-next-line no-console
        console.log('[fcm-sw] notification auto-rendered by browser:', payload);
        return;
    }

    // Data-only fallback path.
    const data = payload.data || {};
    const title = data.title || 'BioZackTeam';
    const body = data.body || '';

    self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || data.messageId || undefined,
        data: { url: data.url || '/' },
        requireInteraction: data.requireInteraction === 'true',
    });
});

/**
 * Click handler — focus the open app tab if any, else open a new tab
 * at the URL the Cloud Function specified (e.g. `/messages?to=<uid>`
 * for a message push, `/profile` for a check-in review).
 */
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if ('focus' in client) {
                    // If a tab is already open, focus it and tell it to
                    // navigate. Avoids opening duplicate tabs.
                    client.focus();
                    if ('navigate' in client) client.navigate(targetUrl).catch(() => {});
                    return;
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
