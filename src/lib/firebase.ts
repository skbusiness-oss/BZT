// ============================================================
// firebase.ts — FULL INITIALIZATION (Auth + Firestore + Storage)
// ============================================================
// BEFORE: Only had getAuth()
// NOW: Adds Firestore (database) and Storage (photos)
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, isSupported as isMessagingSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Cloud Functions — callable client. Region must match the function deploys.
export const functions = getFunctions(app, 'us-central1');

/**
 * Lazy Messaging accessor. Browsers without service worker support
 * (Safari pre-iOS-16.4, in-app webviews, some embedded contexts) throw
 * if you call `getMessaging` directly. `isSupported()` does an async
 * feature-detect; we wrap it so callers can `await getFcmMessaging()`
 * and get null on unsupported browsers instead of an exception.
 */
let _messaging: Messaging | null = null;
let _messagingChecked = false;
export async function getFcmMessaging(): Promise<Messaging | null> {
    if (_messagingChecked) return _messaging;
    _messagingChecked = true;
    try {
        const ok = await isMessagingSupported();
        if (!ok) return null;
        _messaging = getMessaging(app);
        return _messaging;
    } catch {
        return null;
    }
}

export default app;
