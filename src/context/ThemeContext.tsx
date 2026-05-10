import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'bzt-theme';

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function readInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(readInitialTheme);

    // Apply theme to <html> immediately and on every change
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    // Theme persistence rule (founder direction: theme must NOT flip on sign-in):
    // - localStorage is the device's source of truth.
    // - On sign-in, write the local theme to Firestore (overwriting any prior
    //   value) so this device's choice is what's stored.
    // - Subsequent remote changes (from another device toggling theme) DO sync
    //   in via onSnapshot, but only AFTER we've established our local truth.
    // This eliminates the "user signs in → page flips dark→light because
    // Firestore had a stale value" regression.
    useEffect(() => {
        let unsubDoc: (() => void) | null = null;
        let seeded = false;
        const unsubAuth = auth.onAuthStateChanged((user) => {
            unsubDoc?.();
            unsubDoc = null;
            seeded = false;
            if (!user) return;

            const ref = doc(db, 'users', user.uid);

            // Seed Firestore from localStorage immediately so the first
            // onSnapshot reflects the local choice, not a stale remote one.
            const local = (localStorage.getItem(STORAGE_KEY) as Theme | null) || 'dark';
            setDoc(ref, { theme: local }, { merge: true })
                .then(() => { seeded = true; })
                .catch(() => { seeded = true; });

            unsubDoc = onSnapshot(ref, (snap) => {
                const remote = (snap.data()?.theme as Theme | undefined);
                // Only honor remote changes once we've completed the seed.
                // This blocks the dark→light flip on sign-in.
                if (!seeded) return;
                if ((remote === 'light' || remote === 'dark') && remote !== theme) {
                    setThemeState(remote);
                }
            });
        });
        return () => {
            unsubDoc?.();
            unsubAuth();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        const user = auth.currentUser;
        if (user) {
            // Best-effort: persist to Firestore so theme follows the user across devices.
            setDoc(doc(db, 'users', user.uid), { theme: next }, { merge: true }).catch(() => {});
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};
