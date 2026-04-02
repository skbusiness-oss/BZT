import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: TranslationKey) => string;
    dir: 'ltr' | 'rtl';
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Language>(() => {
        const saved = localStorage.getItem('biozack-lang');
        return (saved === 'ar' ? 'ar' : 'en') as Language;
    });

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('biozack-lang', newLang);
    };

    const t = (key: TranslationKey): string => {
        return translations[key]?.[lang] || translations[key]?.['en'] || key;
    };

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
