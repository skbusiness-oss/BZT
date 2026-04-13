// AuthContext.tsx
// Replaces your existing AuthContext.tsx
// Key change: role now comes from Firestore users/{uid} instead of localStorage
// Everything else (signIn, signOut, createUserAccount) stays the same API

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  getAuth,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createUserAccount: (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => Promise<{ uid?: string; error?: string }>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoach: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Read role + name from Firestore users/{uid}
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            name: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: data.role as Role,
            avatarUrl: firebaseUser.photoURL || undefined,
          });
        } else {
          // No Firestore doc yet — create one with community role as default
          // This handles community members who self-registered before the doc was created
          const isPlatformOwner = firebaseUser.email === 'souktanimohamed@gmail.com';
          const initialRole: Role = isPlatformOwner ? 'admin' : 'community';
          
          const defaultProfile = {
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: initialRole,
            createdAt: serverTimestamp(),
            macros: null,
            stripeCustomerId: null,
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
          setUser({
            id: firebaseUser.uid,
            name: defaultProfile.displayName,
            email: defaultProfile.email,
            role: initialRole,
            avatarUrl: firebaseUser.photoURL || undefined,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: unknown) {
      return { error: getFirebaseErrorMessage((error as { code?: string })?.code ?? '') };
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
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
        role, // 'coaching' or 'community'
        createdAt: serverTimestamp(),
        macros: role === 'coaching' ? DEFAULT_TARGETS : null,
        stripeCustomerId: null,
      });

      return { uid: newUid };
    } catch (error: any) {
      if ((error as { code?: string })?.code === 'auth/email-already-in-use') {
        return { error: 'A user with this email already exists.' };
      }
      return { error: getFirebaseErrorMessage(error.code) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        createUserAccount,
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
