// AuthContext.tsx
// Replaces your existing AuthContext.tsx
// Key change: role now comes from Firestore users/{uid} instead of localStorage
// Everything else (signIn, signOut, createUserAccount) stays the same API

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Role } from '../types';
import { auth, db, functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
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

  const clearAuthError = () => setAuthError(null);

  // ── Idle timeout check (runs once before any auth subscription wires up) ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_ACTIVE_KEY);
      if (stored) {
        const last = parseInt(stored, 10);
        if (!Number.isNaN(last) && Date.now() - last > IDLE_TIMEOUT_MS) {
          // User has been idle longer than the timeout. Force a sign-out
          // before any other auth logic runs.
          localStorage.removeItem(LAST_ACTIVE_KEY);
          firebaseSignOut(auth).catch(() => {
            /* ignore — best effort */
          });
        }
      }
    } catch {
      // ignore — private mode / quota
    }
    // Eagerly mark the session as active so we don't immediately re-trigger.
    touchLastActive();

    const onBeforeUnload = () => touchLastActive();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
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

      if (!firebaseUser) {
        setUser(null);
        setFreshUserDocLoaded(false);
        setLoading(false);
        return;
      }

      // Tombstone gate (public-launch hardening): if `deletionLogs/{uid}`
      // exists for this uid the account was previously deleted by a coach.
      // We MUST fail-closed: sign them out and refuse to proceed. The
      // earlier version swallowed all errors here, including
      // permission-denied — which silently let deleted accounts re-sign-in
      // any time the rules read failed. Now we treat permission-denied /
      // unavailable as a *gate failure* (refuse sign-in) and only allow
      // the flow to continue if we got a definitive "no tombstone".
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
        // Fail-closed. Anything other than a confirmed "no tombstone" is
        // treated as a sign-in refusal — better to lock out a real user
        // for a few seconds during a network hiccup than to let a
        // tombstoned account back in.
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] Tombstone check failed — refusing sign-in:', err);
        setAuthError('Could not verify account status. Please try again.');
        await firebaseSignOut(auth).catch(() => { /* ignore */ });
        setUser(null);
        setFreshUserDocLoaded(true);
        setLoading(false);
        return;
      }

      // We do NOT auto-create users/{uid} on sign-in anymore for arbitrary
      // accounts. The previous behavior — silently creating a
      // `defaultProfile` whenever the doc was missing — was an
      // account-resurrection vector: a user whose Firestore doc was wiped
      // but whose Auth record survived would get a brand-new `community`
      // profile on next sign-in, bypassing any out-of-band deletion that
      // didn't write a tombstone. Account creation now happens exactly
      // once per user, in coach-driven flows (AddClientModal) or via the
      // platform-owner bootstrap below.
      //
      // Platform-owner bootstrap: the founder's email is allowed to
      // self-create an admin doc on first sign-in. This is the ONLY
      // exception — every other path requires an explicitly-created doc.
      try {
        if (firebaseUser.email === 'souktanimohamed@gmail.com') {
          const initialSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (!initialSnap.exists()) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              displayName:
                firebaseUser.displayName ||
                firebaseUser.email?.split('@')[0] ||
                'Admin',
              email: firebaseUser.email,
              role: 'admin' satisfies Role,
              createdAt: serverTimestamp(),
              macros: null,
              stripeCustomerId: null,
            });
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] Platform-owner bootstrap skipped:', err);
      }

      // Now subscribe in real-time to users/{uid}. This catches role changes,
      // disabled flag flips, and tosAcceptedAt updates without a reload.
      userDocUnsubRef.current = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          touchLastActive();

          if (!snap.exists()) {
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
            currentWeightKg: typeof data.currentWeightKg === 'number' ? data.currentWeightKg : undefined,
            targetWeightKg: typeof data.targetWeightKg === 'number' ? data.targetWeightKg : undefined,
            communityProfileStartedAt: tsToIso(data.communityProfileStartedAt) ?? (typeof data.communityProfileStartedAt === 'string' ? data.communityProfileStartedAt : undefined),
          };

          setUser(nextUser);
          setFreshUserDocLoaded(true);
          setLoading(false);

          // One-time custom-claim bootstrap. Storage rules + Firestore
          // `isCoach()` prefer `request.auth.token.role`. Coaches/admins from
          // before the claim system landed need their claim set once. We do
          // it automatically on sign-in: if the Firestore role is coach/admin
          // but the token has no `role` claim, call `setUserRole` on
          // themselves (the Cloud Function falls back to Firestore-role for
          // the caller-is-coach check). After success, force a token refresh.
          (async () => {
            try {
              if (resolvedRole !== 'coach' && resolvedRole !== 'admin') return;
              const tokenResult = await firebaseUser.getIdTokenResult();
              const tokenRole = (tokenResult.claims as { role?: string }).role;
              if (tokenRole === resolvedRole) return;
              const callSetUserRole = httpsCallable<
                { targetUid: string; role: Role },
                { ok: boolean }
              >(functions, 'setUserRole');
              await callSetUserRole({ targetUid: firebaseUser.uid, role: resolvedRole });
              await firebaseUser.getIdToken(true);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[AuthContext] Role-claim bootstrap failed (non-fatal):', err);
            }
          })();
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
      await signInWithEmailAndPassword(auth, email, password);
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
      await sendPasswordResetEmail(auth, email);
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
      // Create the Auth user on the secondary app (coach stays signed in on main app)
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = credential.user.uid;

      // Set display name on the new user
      await updateProfile(credential.user, { displayName: name });

      // Sign the secondary app out immediately so it doesn't linger
      await firebaseSignOut(secondaryAuth);

      // Write the user profile to Firestore (main db — no auth needed, coach writes it)
      await setDoc(doc(db, 'users', newUid), {
        displayName: name,
        email,
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
