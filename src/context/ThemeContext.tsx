import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'bzt-theme';

function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
}

function readInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch {
        // localStorage may be unavailable (privacy mode).
    }
    return 'dark';
}

// Module-level boot: paint the initial theme to <html> immediately on
// import, BEFORE React even renders. This avoids a single-frame
// background flash on cold loads — particularly important now that
// ThemeProvider is nested INSIDE AuthProvider and so doesn't mount
// quite as early in the tree.
applyTheme(readInitialTheme());

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [theme, setThemeState] = useState<Theme>(readInitialTheme);
    // seededForUidRef: uid whose Firestore theme has been seeded with
    //   this device's local value. ONLY set after the setDoc resolves
    //   so the adopt effect below doesn't adopt the pre-seed remote
    //   value while the seed is in flight (founder direction: theme
    //   must NOT flip on sign-in; localStorage is the source of truth).
    // seedingForUidRef: uid for which a setDoc is currently in flight.
    //   Prevents StrictMode double-mount from re-firing the write.
    const seededForUidRef = useRef<string | null>(null);
    const seedingForUidRef = useRef<string | null>(null);

    // Apply theme to <html> on every state change.
    useEffect(() => {
        applyTheme(theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // ignore — private mode / quota
        }
    }, [theme]);

    // Seed Firestore from local on first sign-in this session. Replaces
    // the previous duplicate `auth.onAuthStateChanged` + `onSnapshot`
    // pair — AuthContext already subscribes to users/{uid} and surfaces
    // `theme` via the user object. seededForUidRef is set ONLY after
    // the write resolves so the adopt effect below knows the seed is
    // durable.
    useEffect(() => {
        if (!user) {
            seededForUidRef.current = null;
            seedingForUidRef.current = null;
            return;
        }
        if (seededForUidRef.current === user.id) return;
        if (seedingForUidRef.current === user.id) return;
        seedingForUidRef.current = user.id;
        const local = (() => {
            try { return (localStorage.getItem(STORAGE_KEY) as Theme | null) || 'dark'; }
            catch { return 'dark' as Theme; }
        })();
        const uidAtStart = user.id;
        setDoc(doc(db, 'users', uidAtStart), { theme: local }, { merge: true })
            .then(() => { seededForUidRef.current = uidAtStart; })
            // Acknowledge even on failure so we don't permanently block
            // remote-to-local sync — a transient write failure shouldn't
            // freeze the adopt path forever.
            .catch(() => { seededForUidRef.current = uidAtStart; });
    }, [user]);

    // Adopt remote theme when it actually changes (toggle from another
    // device, or remote echo of our own setTheme call). Deliberately
    // does NOT depend on `theme` — if it did, toggling locally would
    // re-fire this effect with the still-stale user.theme value and
    // flip the user back to the old theme until the snapshot caught
    // up. By depending only on user.id + user.theme, this effect runs
    // only when the remote field actually changes.
    useEffect(() => {
        if (!user || !user.theme) return;
        if (seededForUidRef.current !== user.id) return; // wait for seed
        if (user.theme !== 'light' && user.theme !== 'dark') return;
        setThemeState((prev) => (user.theme === prev ? prev : (user.theme as Theme)));
    // Intentionally depending only on user.id / user.theme. Adding the
    // whole `user` object would re-fire this effect on every user-doc
    // snapshot delta (theme/displayName/streak/...) which we don't want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.theme]);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        // Persist to the user's doc so the choice follows them across
        // devices. Best-effort — UI never blocks on this write.
        if (user) {
            setDoc(doc(db, 'users', user.id), { theme: next }, { merge: true }).catch(() => {});
        }
    }, [user]);

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
