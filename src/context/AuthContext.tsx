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

      // Make sure the doc exists before subscribing. Self-registered community
      // users may sign in with no Firestore profile yet.
      try {
        const initialSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!initialSnap.exists()) {
          const isPlatformOwner = firebaseUser.email === 'souktanimohamed@gmail.com';
          const initialRole: Role = isPlatformOwner ? 'admin' : 'community';

          const defaultProfile = {
            displayName:
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'User',
            email: firebaseUser.email || '',
            role: initialRole,
            createdAt: serverTimestamp(),
            macros: null,
            stripeCustomerId: null,
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
        }
      } catch {
        // If we can't read/write the user doc (rules / network), still try to
        // subscribe below; the listener will surface the real error if any.
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

  // ── visibilitychange: force token refresh + idle-stamp on foreground ─────
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Foregrounding is "activity" — bump the idle clock.
      touchLastActive();

      const current = auth.currentUser;
      if (!current) return;

      // Mark that we need to wait for a fresh user-doc snapshot before we
      // trust any cached UI for protected routes.
      setFreshUserDocLoaded(false);

      try {
        await current.getIdToken(/* forceRefresh */ true);
      } catch {
        // Token refresh failed — most likely the user was disabled or deleted
        // while the PWA was backgrounded. Sign them out hard.
        try {
          await firebaseSignOut(auth);
        } catch {
          /* ignore */
        }
        setUser(null);
        setFreshUserDocLoaded(false);
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
