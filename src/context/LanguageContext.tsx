import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../i18n/translations';

/**
 * Translation lookup. Overloads:
 *   - Known key (TranslationKey union)  → returns the translated string.
 *   - Arbitrary string (e.g. dynamic role name, category) → returns the
 *     translated string, OR the key itself as a graceful fallback when the
 *     key isn't in the dictionary. This keeps TS happy for runtime-computed
 *     keys without forcing `as any` everywhere, and prevents the UI from
 *     ever rendering a literal `undefined`.
 */
export interface TranslateFn {
    (key: TranslationKey): string;
    (key: string): string;
}

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: TranslateFn;
    dir: 'ltr' | 'rtl';
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Language>(() => {
        // Arabic is the default for new visitors. Returning users keep
        // whatever they last picked (English or Arabic).
        const saved = localStorage.getItem('biozack-lang');
        return (saved === 'en' ? 'en' : 'ar') as Language;
    });

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('biozack-lang', newLang);
    };

    const t = ((key: string): string => {
        const entry = (translations as Record<string, { en: string; ar: string }>)[key];
        if (!entry) return key;
        return entry[lang] || entry.en;
    }) as TranslateFn;

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const isRTL = lang === 'ar';

    // Set document direction and lang attribute
    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
    }, [lang, dir]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, dir, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};
