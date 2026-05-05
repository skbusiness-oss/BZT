import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
    const { user, signOut } = useAuth();
    const { t, lang, setLang } = useLanguage();
    const navigate = useNavigate();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Editorial header */}
            <header>
                <span className="eyebrow block mb-2">{t('preferences')}</span>
                <h1 className="display-headline text-5xl md:text-6xl text-on-surface">
                    {t('settingsTitle')}<span className="text-primary-container">.</span>
                </h1>
                <p className="text-on-surface-variant mt-3 font-light">{t('settingsSubtitle')}</p>
            </header>

            {/* Preferences card */}
            <section className="clay-card overflow-hidden">
                <div className="p-5">
                    <span className="eyebrow text-on-surface-variant opacity-70">{t('preferences')}</span>
                </div>
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3 text-on-surface">
                        <Globe size={18} className="text-on-surface-variant" />
                        <span>{t('language')}</span>
                    </div>
                    <button
                        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                        className="px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                    >
                        {lang === 'en' ? 'العربية' : 'English'}
                    </button>
                </div>
                <div className="flex items-center justify-between p-5" style={{ background: 'rgba(9, 14, 28, 0.4)' }}>
                    <div className="flex items-center gap-3 text-on-surface">
                        <Bell size={18} className="text-on-surface-variant" />
                        <span>{t('notifications')}</span>
                    </div>
                    <button
                        onClick={() => setNotificationsEnabled(v => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'gold-gradient' : 'bg-surface-container-highest'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-surface transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </section>

            {/* Account card */}
            <section className="clay-card overflow-hidden">
                <div className="p-5">
                    <span className="eyebrow text-on-surface-variant opacity-70">{t('accountSection')}</span>
                </div>
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-5 hover:bg-surface-container-highest/40 transition-colors"
                >
                    <div className="flex items-center gap-3 text-on-surface">
                        <Shield size={18} className="text-on-surface-variant" />
                        <span>{t('viewProfile')}</span>
                    </div>
                    <ChevronRight size={16} className="text-on-surface-variant" />
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-5 text-rose-400 hover:bg-rose-500/5 transition-colors"
                    style={{ background: 'rgba(9, 14, 28, 0.4)' }}
                >
                    <LogOut size={18} />
                    <span>{t('signOut')}</span>
                </button>
            </section>

            <div className="text-center text-on-surface-variant/40 text-xs uppercase tracking-widest">
                BioZackTeam · v1.0.0
            </div>
        </div>
    );
};
