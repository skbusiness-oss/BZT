// AuthContext.tsx
// Replaces your existing AuthContext.tsx
// Key change: role now comes from Firestore users/{uid} instead of localStorage
// Everything else (signIn, signOut, createUserAccount) stays the same API

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Role } from '../types';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { initializeApp as initializeSecondaryApp } from 'firebase/app';
import { DEFAULT_TARGETS } from '../lib/constants';
import { registerFcmToken } from '../lib/fcm';

// ─── Secondary Firebase app for creating client accounts ───────────────────
// When you call createUserWithEmailAndPassword on the main app,
// Firebase automatically signs out the coach and signs in as the new user.
// This secondary app instance prevents that — the coach stays logged in.
const secondaryApp = initializeSecondaryApp(
  {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
  'secondary' // name it so Firebase doesn't confuse it with the main app
);
const secondaryAuth = getAuth(secondaryApp);

// ─── Constants ───────────────────────────────────────────────────────────────

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVE_KEY = 'bzt-lastActiveAt';
/** Skip the visibility-driven token refresh for this many ms after a
 *  fresh sign-in. iOS PWAs flip visibility transiently during autofill
 *  / FaceID, and a force-refresh in that window has been observed to
 *  fail with transient errors and trigger a spurious sign-out
 *  (a.k.a. the "double-login" bug). */
const POST_SIGNIN_GRACE_MS = 60 * 1000;
/** Auth error codes that genuinely warrant signing the user out. Any
 *  other failure from `getIdToken(true)` is treated as transient
 *  (network, keychain race) and ignored. */
const HARD_AUTH_ERROR_CODES = new Set([
  'auth/user-token-expired',
  'auth/user-disabled',
  'auth/user-not-found',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-user-token',
  'auth/requires-recent-login',
]);

const touchLastActive = () => {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // ignore — private mode / quota
  }
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  freshUserDocLoaded: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createUserAccount: (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => Promise<{ uid?: string; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoach: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

const tsToIso = (v: unknown): string | undefined => {
  if (!v) return undefined;
  // Firestore Timestamp has a toDate() method
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return undefined;
    }
  }
  if (typeof v === 'string') return v;
  return undefined;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [freshUserDocLoaded, setFreshUserDocLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const userDocUnsubRef = useRef<Unsubscribe | null>(null);
  /** Wall-clock ms when the most recent successful signIn() resolved.
   *  Used to gate the visibility-driven token refresh — see #3 fix. */
  const signedInAtRef = useRef<number>(0);
  /** Guard against re-registering the FCM token on every snapshot
   *  delta. The user-doc onSnapshot listener fires for any field
   *  change (theme, displayName, activityScore, ...) — without this
   *  ref, every such tick would arrayUnion the same token again.
   *  Reset to false on auth change so a re-login re-registers cleanly. */
  const fcmRegisteredRef = useRef<boolean>(false);

  const clearAuthError = () => setAuthError(null);

  // ── Idle timeout: check on mount, on visibility change, and on a 60s
  //    interval so a long-foregrounded tab still gets signed out at 30 min.
  //    Real interactivity (pointer / key / scroll) bumps the active stamp.
  useEffect(() => {
    const checkIdle = () => {
      try {
        const stored = localStorage.getItem(LAST_ACTIVE_KEY);
        if (!stored) return;
        const last = parseInt(stored, 10);
        if (Number.isNaN(last)) return;
        if (Date.now() - last > IDLE_TIMEOUT_MS) {
          localStorage.removeItem(LAST_ACTIVE_KEY);
          firebaseSignOut(auth).catch(() => { /* best effort */ });
        }
      } catch {
        // ignore — private mode / quota
      }
    };

    checkIdle();
    touchLastActive();

    const onActivity = () => touchLastActive();
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });

    const onBeforeUnload = () => touchLastActive();
    window.addEventListener('beforeunload', onBeforeUnload);

    const interval = window.setInterval(checkIdle, 60 * 1000);

    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.clearInterval(interval);
    };
  }, []);

  // ── Main auth subscription ────────────────────────────────────────────────
  useEffect(() => {
    const cleanupUserDoc = () => {
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Tear down any previous user-doc listener whenever the auth user changes
      cleanupUserDoc();
      // Reset FCM registration guard so the next signed-in user
      // (could be a different account) re-registers their device.
      fcmRegisteredRef.current = false;

      if (!firebaseUser) {
        setUser(null);
        setFreshUserDocLoaded(false);
        setLoading(false);
        return;
      }

      // Tombstone gate: explicit positive check only. If a deletionLogs/{uid}
      // doc EXISTS, this account was deleted by a coach — refuse sign-in.
      // Any OTHER outcome (no doc, permission-denied during token-propagation
      // race, transient network error) is treated as "no tombstone present"
      // and we proceed. The user-doc onSnapshot listener below is the real
      // disabled/deleted defense — if the users/{uid} doc is gone or has
      // disabled:true, that listener catches it and signs out cleanly.
      //
      // The previous fail-closed implementation caused a login-loop: first
      // sign-in attempt would race the auth token propagation, getDoc would
      // throw permission-denied, the catch block force-signed-out the user,
      // and they had to re-enter credentials. Second attempt worked because
      // the token had fully propagated by then. Reported via Sentry as
      // permission-denied on /login.
      try {
        const tombstone = await getDoc(doc(db, 'deletionLogs', firebaseUser.uid));
        if (tombstone.exists()) {
          setAuthError('This account has been removed. Please contact your coach.');
          await firebaseSignOut(auth).catch(() => { /* ignore */ });
          setUser(null);
          setFreshUserDocLoaded(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fail-OPEN on read error. Log it (Sentry will pick up via
        // window.unhandledrejection if it bubbles), continue with sign-in,
        // and let the users/{uid} listener do the actual access check.
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] Tombstone check skipped (read error, falling through to users-doc listener):', err);
      }

      // We do NOT auto-create users/{uid} on sign-in for arbitrary
      // accounts. Silent default-profile creation was an account-
      // resurrection vector (wiped doc + surviving Auth record →
      // fresh community profile on next sign-in). All account
      // creation now happens via the AddClientModal coach flow or
      // via a one-shot bootstrap Cloud Function (see prior
      // rescueAccounts/bootstrapRoles patterns in commit history).
      // The previous client-side platform-owner-email bootstrap was
      // removed: hardcoded gates in the bundle are brittle, and the
      // admin doc already exists in production. Future admin recovery
      // is a Cloud Function call, not a client write.

      // Now subscribe in real-time to users/{uid}. This catches role changes,
      // disabled flag flips, and tosAcceptedAt updates without a reload.
      userDocUnsubRef.current = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          touchLastActive();

          if (!snap.exists()) {
            // Two cases where `!snap.exists()` fires:
            //   1. Initial snapshot from local cache before the server
            //      response arrives. metadata.fromCache === true. The doc
            //      MAY exist on the server; we just don't know yet. Do
            //      NOTHING and wait for the next snapshot.
            //   2. Server-confirmed "doc doesn't exist" (was deleted by
            //      deleteUser cascade, or never existed). metadata.
            //      fromCache === false. Hard sign-out.
            //
            // The previous version skipped this distinction and fail-
            // closed on every !exists snapshot, which caused a login-
            // loop on FIRST sign-in: cache is empty → first snapshot
            // says !exists → user signed out → kicked back to /login.
            // Second attempt worked because cache had warmed up from
            // the first attempt. Reported via Sentry as permission-
            // denied / repeated /login hits.
            if (snap.metadata.fromCache) {
              // Don't decide yet — keep waiting for server confirmation.
              return;
            }
            setAuthError('Your account no longer exists. Please contact your coach.');
            firebaseSignOut(auth).catch(() => { /* ignore */ });
            setUser(null);
            setFreshUserDocLoaded(true);
            setLoading(false);
            return;
          }

          const data = snap.data();
          // Disabled flag → kick them out immediately.
          if (data.disabled === true) {
            setAuthError('Your account has been disabled. Please contact your coach.');
            firebaseSignOut(auth).catch(() => { /* ignore */ });
            setUser(null);
            setFreshUserDocLoaded(true);
            setLoading(false);
            return;
          }

          const resolvedRole = (data.role === 'coaching' ? 'client' : data.role) as Role;
          const nextUser: User = {
            id: firebaseUser.uid,
            name:
              data.displayName ||
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'User',
            email: firebaseUser.email || data.email || '',
            role: resolvedRole || 'community',
            avatarUrl: firebaseUser.photoURL || undefined,
            theme: data.theme,
            activityScore: typeof data.activityScore === 'number' ? data.activityScore : 0,
            streak: data.streak,
            tosAcceptedAt: tsToIso(data.tosAcceptedAt),
            tosVersion: typeof data.tosVersion === 'string' ? data.tosVersion : undefined,
            age: typeof data.age === 'number' ? data.age : undefined,
            heightCm: typeof data.heightCm === 'number' ? data.heightCm : undefined,
            goal: typeof data.goal === 'string' ? data.goal : undefined,
            startWeightKg: typeof data.startWeightKg === 'number' ? data.startWeightKg : undefined,
            currentWeightKg: typeof data.currentWeightKg === 'number' ? data.currentWeightKg : undefined,
            targetWeightKg: typeof data.targetWeightKg === 'number' ? data.targetWeightKg : undefined,
            communityProfileStartedAt: tsToIso(data.communityProfileStartedAt) ?? (typeof data.communityProfileStartedAt === 'string' ? data.communityProfileStartedAt : undefined),
          };

          setUser(nextUser);
          setFreshUserDocLoaded(true);
          setLoading(false);

          // Register this device for FCM push notifications. Fire-and-
          // forget — failures (unsupported browser, denied permission,
          // missing VAPID config) are swallowed so they never block
          // sign-in. registerFcmToken is idempotent (arrayUnion on the
          // user doc) so re-registering on every snapshot is safe but
          // wasteful; we only run it once per snapshot listener
          // lifetime via the ref below.
          if (!fcmRegisteredRef.current) {
            fcmRegisteredRef.current = true;
            registerFcmToken(firebaseUser.uid).catch(() => { /* silent */ });
          }

          // Custom-claim bootstrap REMOVED — it caused a login-loop.
          // Previous behavior: if the user's id-token didn't carry a `role`
          // claim matching their Firestore role, this called setUserRole
          // on themselves. setUserRole calls revokeRefreshTokens server-
          // side → the current token died → onAuthStateChanged fired with
          // null → user got kicked back to /login. On any sign-in where
          // claim drift was present, the loop was infinite.
          //
          // Claims are now an exclusively server-side responsibility.
          // To set/repair a user's claim, an admin runs the bootstrap or
          // rescueAccounts Cloud Function once. The user signs in fresh
          // afterward and gets the new claim in their token.
          //
          // The Firestore rules `isCoach()` still falls back to the
          // Firestore role doc when the claim is missing, so coach
          // access does not break in the meantime — it just doesn't
          // use the (faster, no-Firestore-read) claim path.
        },
        () => {
          // Permission/network error — clear state so we don't render stale UI.
          setFreshUserDocLoaded(true);
          setLoading(false);
        }
      );
    });

    return () => {
      cleanupUserDoc();
      unsubscribe();
    };
  }, []);

  // ── visibilitychange: silent token refresh + idle-stamp on foreground ────
  // History notes:
  //   - We used to flip `freshUserDocLoaded → false` here so AppRoutes would
  //     re-show its loading spinner until the user-doc snapshot fired again.
  //     Removed: the live `onSnapshot` to `users/{uid}` already delivers
  //     role/disabled changes mid-session; the gated re-render only created
  //     a spurious spinner flash on every app return.
  //   - We used to sign the user out on ANY token-refresh failure. Removed:
  //     iOS Safari fires visibility transiently during autofill/FaceID
  //     immediately after sign-in, and the force-refresh in that window can
  //     fail with transient network/keychain errors — which then signed the
  //     user back out and produced the "double-login" symptom.
  //
  // Current behavior:
  //   1. Stamp last-active so the idle-timeout doesn't fire spuriously.
  //   2. Skip force-refresh if we're inside the post-sign-in grace window.
  //   3. Otherwise, force-refresh in the background — silent. The UI is
  //      NOT gated on this; the snapshot listener handles state changes.
  //   4. Only sign out if the refresh fails with a code that genuinely
  //      indicates the credential was revoked / expired (set above).
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Foregrounding is "activity" — bump the idle clock.
      touchLastActive();

      const current = auth.currentUser;
      if (!current) return;

      // Skip the force-refresh entirely in the post-sign-in grace window.
      // The token we just got is fresh; refreshing it again can transiently
      // fail on iOS PWA and trigger a sign-out loop.
      if (Date.now() - signedInAtRef.current < POST_SIGNIN_GRACE_MS) return;

      try {
        await current.getIdToken(/* forceRefresh */ true);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? '';
        // Only sign out on real revocation / expiry. Transient errors
        // (network, keychain race) get swallowed — the next snapshot or
        // the next user action will surface any actual problem.
        if (HARD_AUTH_ERROR_CODES.has(code)) {
          try { await firebaseSignOut(auth); } catch { /* ignore */ }
          setUser(null);
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      touchLastActive();
      // Stamp the sign-in time so the visibility handler can skip its
      // force-refresh during the grace window — see #3 fix.
      signedInAtRef.current = Date.now();
      return {};
    } catch (error: unknown) {
      return { error: getFirebaseErrorMessage((error as { code?: string })?.code ?? '') };
    }
  };

  // ── Password reset ────────────────────────────────────────────────────────
  const sendPasswordReset = async (email: string): Promise<{ error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      return {};
    } catch (error: unknown) {
      return { error: getFirebaseErrorMessage((error as { code?: string })?.code ?? '') };
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFreshUserDocLoaded(false);
    try {
      localStorage.removeItem(LAST_ACTIVE_KEY);
    } catch {
      /* ignore */
    }
  };

  // ── Create client / community account (coach-only) ─────────────────────────
  // Uses a secondary Firebase app so the coach's session is NOT interrupted
  const createUserAccount = async (
    email: string,
    password: string,
    name: string,
    role: Role
  ): Promise<{ uid?: string; error?: string }> => {
    try {
      const safeEmail = email.toLowerCase().trim();
      // Create the Auth user on the secondary app (coach stays signed in on main app)
      const credential = await createUserWithEmailAndPassword(secondaryAuth, safeEmail, password);
      const newUid = credential.user.uid;

      // Set display name on the new user
      await updateProfile(credential.user, { displayName: name });

      // Sign the secondary app out immediately so it doesn't linger
      await firebaseSignOut(secondaryAuth);

      // Write the user profile to Firestore (main db — no auth needed, coach writes it)
      await setDoc(doc(db, 'users', newUid), {
        displayName: name,
        email: safeEmail,
        role, // 'client' or 'community'
        createdAt: serverTimestamp(),
        macros: role === 'client' ? DEFAULT_TARGETS : null,
        stripeCustomerId: null,
      });

      return { uid: newUid };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        return { error: 'A user with this email already exists.' };
      }
      return { error: getFirebaseErrorMessage(code) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        freshUserDocLoaded,
        authError,
        clearAuthError,
        signIn,
        signOut,
        createUserAccount,
        sendPasswordReset,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isCoach: user?.role === 'admin' || user?.role === 'coach',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// ─── Error messages ───────────────────────────────────────────────────────────

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':    return 'A user with this email already exists.';
    case 'auth/invalid-email':           return 'Please enter a valid email address.';
    case 'auth/weak-password':           return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':          return 'Email or password is incorrect.';
    case 'auth/wrong-password':          return 'Email or password is incorrect.';
    case 'auth/invalid-credential':      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':       return 'Too many failed attempts. Please wait and try again.';
    case 'auth/network-request-failed':  return 'Network error. Check your connection.';
    default:                             return `Authentication error: ${code}`;
  }
}
