import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { auth } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    // Coach-only: create accounts for clients (not exposed on login page)
    createUserAccount: (email: string, password: string, name: string, role: 'coaching' | 'community') => Promise<{ error?: string }>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_KEY = 'biozack_profiles';

function saveProfile(uid: string, data: { name: string; role: Role }) {
    try {
        const all = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
        all[uid] = data;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
}

function loadProfile(uid: string): { name: string; role: Role } | null {
    try {
        const all = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
        return all[uid] || null;
    } catch { return null; }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const profile = loadProfile(firebaseUser.uid);
                setUser({
                    id: firebaseUser.uid,
                    name: profile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    role: profile?.role || 'community',
                    avatarUrl: firebaseUser.photoURL || undefined,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return {};
        } catch (error: any) {
            if (
                error.code === 'auth/wrong-password' ||
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/invalid-credential'
            ) {
                return { error: 'Email or password is incorrect' };
            }
            return { error: getFirebaseErrorMessage(error.code) };
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
    };

    // Coach-only function: create a new user account for a client
    // This is NOT exposed on the login page — only used from the coach's admin panel
    const createUserAccount = async (
        email: string,
        password: string,
        name: string,
        role: 'coaching' | 'community'
    ): Promise<{ error?: string }> => {
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: name });
            saveProfile(credential.user.uid, { name, role });
            return {};
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                return { error: 'User already exists. Please sign in' };
            }
            return { error: getFirebaseErrorMessage(error.code) };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signIn,
            signOut,
            createUserAccount,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

function getFirebaseErrorMessage(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'User already exists. Please sign in';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.';
        case 'auth/user-not-found':
            return 'Email or password is incorrect';
        case 'auth/wrong-password':
            return 'Email or password is incorrect';
        case 'auth/invalid-credential':
            return 'Email or password is incorrect';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please wait and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection.';
        default:
            return `Authentication error: ${code}`;
    }
}
