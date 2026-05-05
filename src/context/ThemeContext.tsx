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

    // When the signed-in user has a saved theme on their profile, use it
    useEffect(() => {
        let unsubDoc: (() => void) | null = null;
        const unsubAuth = auth.onAuthStateChanged((user) => {
            unsubDoc?.();
            unsubDoc = null;
            if (!user) return;
            const ref = doc(db, 'users', user.uid);
            unsubDoc = onSnapshot(ref, (snap) => {
                const remote = (snap.data()?.theme as Theme | undefined);
                if (remote === 'light' || remote === 'dark') {
                    setThemeState(remote);
                }
            });
        });
        return () => {
            unsubDoc?.();
            unsubAuth();
        };
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
