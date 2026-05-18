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
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
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
 * Foreground push handler. FCM only auto-shows notifications when the
 * app is in the background (per browser/SW spec). When the user is
 * actively on the page, we get the payload via this callback and
 * decide whether to surface it (toast, inline indicator, etc.).
 *
 * We intentionally do NOT show a duplicate browser Notification for
 * foreground events — the MessagesContext already triggers an in-app
 * Notification for new incoming messages, and showing both is noisy.
 * The hook simply logs for now; surface via a toast if you wire one.
 */
export async function attachFcmForegroundHandler(): Promise<() => void> {
    const messaging = await getFcmMessaging();
    if (!messaging) return () => {};
    const unsub = onMessage(messaging, (payload) => {
        // eslint-disable-next-line no-console
        console.log('[fcm] foreground push:', payload);
    });
    return unsub;
}
