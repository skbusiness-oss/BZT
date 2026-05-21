/**
 * Firebase Cloud Messaging (push) — registration + token lifecycle.
 *
 * Goal: when the app is CLOSED (tab killed, phone screen off, PWA
 * minimised), the user still gets a system notification for new
 * messages and weekly-review feedback. The Web Notifications API
 * only fires while the page is loaded; FCM uses a service worker
 * registered via `firebase-messaging-sw.js` that wakes on push
 * payload delivery from Google's push servers.
 *
 * Token model:
 *   users/{uid}.fcmTokens: string[]   // one or more devices per user
 *
 * Each device adds its own token on sign-in. Cloud Functions read
 * the array when an event fires and push to every entry. Stale
 * tokens (returned 410/404 from FCM) get pruned by the Cloud
 * Function — see functions/src/notifyOnMessage.ts.
 *
 * iOS gotcha: Apple only honours web push when the PWA is added to
 * Home Screen AND iOS ≥ 16.4. Regular Safari tabs ignore push
 * notifications entirely. We attempt registration regardless;
 * unsupported environments resolve to null.
 */
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, getFcmMessaging } from './firebase';

/**
 * VAPID public key from Firebase Console → Project Settings → Cloud
 * Messaging → Web configuration → Generate key pair. The key itself
 * is safe to ship in client code — it's the PUBLIC half of a key
 * pair; the private half stays in Firebase's infrastructure.
 *
 * Resolution order:
 *   1. VITE_FCM_VAPID_KEY env var (lets a staging build point at a
 *      different Firebase project's key)
 *   2. Hardcoded default below (production project key)
 *
 * If you ever rotate the key in Firebase Console (rare), update the
 * fallback string AND any deployed staging env vars.
 */
const VAPID_KEY =
    (import.meta.env.VITE_FCM_VAPID_KEY as string | undefined) ||
    'BGJ_az6Dzixt5gmKdgYS3CvRgBuWKXq4ATh_hjLzyTBror9wd80IlRpo9ePeok1PM_XYV3IicEfFiKEPpH_JSXU';

/**
 * Try to register this device for push notifications for the given uid.
 * Best-effort: returns false on any failure (unsupported browser,
 * denied permission, missing VAPID key, network error) without
 * throwing. The app keeps working without push.
 *
 *   await registerFcmToken(user.id);
 *
 * Safe to call multiple times; arrayUnion dedups tokens on the user
 * doc.
 */
export async function registerFcmToken(uid: string): Promise<boolean> {
    // Verbose logging — every step prints to console so the user can
    // see exactly which step succeeded/failed when push isn't working.
    // Remove or downgrade to debug once push is verified stable.
    // eslint-disable-next-line no-console
    const log = (...args: unknown[]) => console.log('[fcm]', ...args);

    if (!VAPID_KEY) {
        log('FAIL: VAPID_KEY missing — push disabled');
        return false;
    }
    log('VAPID key present:', VAPID_KEY.slice(0, 12) + '…');

    const messaging = await getFcmMessaging();
    if (!messaging) {
        log('FAIL: messaging unsupported in this browser (iOS Safari pre-16.4? in-app webview?)');
        return false;
    }
    log('messaging supported, getFcmMessaging() OK');

    // Permission gate.
    if (typeof Notification === 'undefined') {
        log('FAIL: Notification API not in window');
        return false;
    }
    log('Notification.permission =', Notification.permission);
    if (Notification.permission === 'denied') {
        log('FAIL: notifications blocked. User must re-allow via browser site settings.');
        return false;
    }
    if (Notification.permission === 'default') {
        try {
            log('requesting permission…');
            const perm = await Notification.requestPermission();
            log('permission result:', perm);
            if (perm !== 'granted') return false;
        } catch (err) {
            log('FAIL: requestPermission threw:', err);
            return false;
        }
    }

    // Explicitly register the SW first. Some browsers (notably iOS
    // Safari) need the SW registration to be awaited before getToken
    // will find it. Default scope is fine.
    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
        if ('serviceWorker' in navigator) {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            log('SW registered, scope:', swRegistration.scope);
        }
    } catch (err) {
        log('FAIL: SW registration threw:', err);
        return false;
    }

    let token: string;
    try {
        log('calling getToken…');
        token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration,
        });
    } catch (err) {
        // Common: messaging/permission-blocked, messaging/notifications-blocked,
        // messaging/failed-service-worker-registration, AbortError
        log('FAIL: getToken threw:', err);
        return false;
    }
    if (!token) {
        log('FAIL: getToken returned empty string');
        return false;
    }
    log('got token:', token.slice(0, 20) + '…');

    try {
        await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayUnion(token),
            fcmLastRegisteredAt: new Date().toISOString(),
        });
        log('OK: token persisted to users/' + uid + '.fcmTokens');
    } catch (err) {
        log('FAIL: failed to persist token to user doc:', err);
        return false;
    }
    return true;
}

/**
 * Remove this device's FCM token from the given user doc on sign-out.
 * Prevents cross-user notification bleed when User A signs out and
 * User B signs in on the same device — without this, FCM would still
 * deliver A's incoming-message pushes to the device, but B's app
 * would see them and (worse) the click handler would deep-link into
 * B's account with A's senderId.
 *
 * Best-effort: failure here MUST NOT block sign-out. We swallow any
 * error so the user always succeeds in signing out.
 */
export async function unregisterFcmToken(uid: string): Promise<void> {
    try {
        const messaging = await getFcmMessaging();
        if (!messaging) return;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);
        if (!token) return;
        await updateDoc(doc(db, 'users', uid), {
            fcmTokens: arrayRemove(token),
        });
    } catch {
        // Sign-out must not be blocked by token cleanup failures.
    }
}

/**
 * Foreground push handler. FCM only auto-shows OS-level notifications
 * when the app is in the BACKGROUND (browser/SW spec). When the user
 * is actively on the page, the payload arrives via `onMessage` here
 * and the SW does NOT display it — so without this hook, the coach
 * or client gets *zero* feedback for incoming messages while the app
 * tab is open. Bug surface: "I'm staring at the app and didn't see
 * the new message until I refreshed."
 *
 * Behavior:
 *   - Surface an OS-level Notification via the SW registration so it
 *     looks identical to a background push. We deliberately route
 *     through the same SW (not the page's `new Notification(...)`)
 *     because: (a) consistent click-handling — the SW's
 *     `notificationclick` handler runs in both cases, and (b) iOS
 *     PWAs treat SW-registered notifications as system events.
 *   - Tag-dedup by messageId so a re-delivered FCM push (queued
 *     during offline) replaces rather than stacks.
 *   - Skip if the user already has the conversation OPEN in
 *     foreground — that thread is rendered live by the messages
 *     listener and a notification on top would be noisy.
 *
 * Idempotent: returns an `unsub` even when messaging is unsupported.
 */
export async function attachFcmForegroundHandler(): Promise<() => void> {
    const messaging = await getFcmMessaging();
    if (!messaging) return () => {};

    const swRegistration =
        ('serviceWorker' in navigator)
            ? await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').catch(() => undefined)
            : undefined;

    const unsub = onMessage(messaging, (payload) => {
        // eslint-disable-next-line no-console
        console.log('[fcm] foreground push:', payload);

        const title = payload.notification?.title || payload.data?.title || 'BioZackTeam';
        const body = payload.notification?.body || payload.data?.body || '';
        const url = (payload.data?.url as string | undefined) || '/';
        const tag = (payload.data?.messageId as string | undefined)
                 || (payload.data?.checkInId as string | undefined)
                 || undefined;

        // Skip if the user is already looking at the destination route —
        // they've got the live data, no need for a popup. Best-effort
        // path-prefix match; deep links like `/messages?to=…` are still
        // considered "on the messages page".
        try {
            const here = window.location.pathname;
            if (url.startsWith('/messages') && here.startsWith('/messages')) return;
        } catch {
            // window may be unavailable in unusual contexts (workers, SSR).
        }

        // Prefer routing through the SW so click-handling is identical
        // to background pushes (the SW's `notificationclick` listener
        // focuses the existing tab and navigates to `data.url`).
        const options: NotificationOptions = {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag,
            data: { url },
        };

        if (swRegistration && 'showNotification' in swRegistration) {
            swRegistration.showNotification(title, options).catch(() => {
                // Fallback to page-level Notification if SW path fails.
                try {
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(title, options);
                    }
                } catch { /* ignore */ }
            });
        } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try { new Notification(title, options); } catch { /* ignore */ }
        }
    });
    return unsub;
}
