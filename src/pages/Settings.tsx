/**
 * Settings — account-shaped surface. Where Profile is "your data + your
 * progress", Settings is "you, your preferences, your session".
 *
 * Sections (in order):
 *   1. Identity card — avatar, name, email, role badge.
 *      Moved here from Profile so the user can edit "themselves" in one
 *      place without confusion about which page is which.
 *   2. Preferences — language, theme, notifications.
 *      Theme + language are also in the sidebar footer; duplicating them
 *      here keeps the canonical control accessible from the menu, since
 *      a fresh user looking for "settings" will check this page first.
 *   3. Account — member since · "Edit profile info" (opens the same
 *      CommunityBaselineForm) · Sign out.
 *
 * The previous version of Settings had a "View profile" link to /profile.
 * Removed — the identity card here makes it redundant, and Profile now
 * means "progress + details", not "your account".
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    Globe, Bell, LogOut, Shield, Sun, Moon, Edit2, Calendar, UserRound, Activity, Target, Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommunityBaselineForm } from '../components/profile/CommunityBaselineForm';

function calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

export const Settings = () => {
    const { user, signOut } = useAuth();
    const { clients } = useData();
    const { t, lang, setLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showBaseline, setShowBaseline] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user) return null;

    const isCommunity = user.role === 'community';
    const hasBaseline = Boolean(user.communityProfileStartedAt);
    const client = clients.find(c => c.userId === user.id);

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            {/* ── Editorial header ─────────────────────────────────── */}
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('preferences')}
                </span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    {t('settingsTitle')}<span className="text-primary-container">.</span>
                </h1>
                <p className="text-on-surface/60 mt-3 font-body">
                    {t('settingsSubtitle')}
                </p>
            </header>

            {/* ── Identity card ────────────────────────────────────── */}
            <section className="bg-surface-container-low rounded-2xl p-8 ghost-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-primary to-primary-container ring-1 ring-primary/20 shadow-[0_8px_24px_rgba(230,195,100,0.18)] shrink-0">
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-headline font-extrabold text-on-surface">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight truncate">
                            {user.name}
                        </h2>
                        <p className="text-on-surface/60 font-body text-sm mb-3 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20">
                            <Shield size={12} /> {t(user.role)}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Preferences card ─────────────────────────────────── */}
            {(isCommunity || client) && (
                <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
                    <div className="px-6 pt-6 pb-3">
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                            {t('personalInfo')}
                        </span>
                    </div>

                    {isCommunity && user.age !== undefined && (
                        <Row icon={<Calendar size={18} className="text-on-surface-variant" />} label={t('age')} control={<InfoValue>{user.age} {t('yearsOld')}</InfoValue>} />
                    )}
                    {isCommunity && user.heightCm !== undefined && (
                        <Row icon={<UserRound size={18} className="text-on-surface-variant" />} label={t('height')} control={<InfoValue>{user.heightCm} cm</InfoValue>} />
                    )}
                    {isCommunity && user.goal && (
                        <Row
                            icon={<Target size={18} className="text-on-surface-variant" />}
                            label={t('goal')}
                            control={<InfoValue>{t(`goal${user.goal.charAt(0).toUpperCase()}${user.goal.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase())}`)}</InfoValue>}
                        />
                    )}
                    {isCommunity && user.currentWeightKg !== undefined && (
                        <Row icon={<Activity size={18} className="text-on-surface-variant" />} label={t('currentWeight')} control={<InfoValue>{user.currentWeightKg} kg</InfoValue>} />
                    )}
                    {isCommunity && user.targetWeightKg !== undefined && (
                        <Row icon={<Award size={18} className="text-on-surface-variant" />} label={t('targetWeight') || 'Target'} control={<InfoValue>{user.targetWeightKg} kg</InfoValue>} />
                    )}
                    {client?.birthdate && (
                        <Row icon={<Calendar size={18} className="text-on-surface-variant" />} label={t('age')} control={<InfoValue>{calculateAge(client.birthdate)} {t('yearsOld')}</InfoValue>} />
                    )}
                    {client?.gender && (
                        <Row icon={<UserRound size={18} className="text-on-surface-variant" />} label={t('gender')} control={<InfoValue>{t(client.gender)}</InfoValue>} />
                    )}
                    {client?.fitnessLevel && (
                        <Row icon={<Award size={18} className="text-on-surface-variant" />} label={t('fitnessLevel')} control={<InfoValue>{t(client.fitnessLevel === 'pro_competitions' ? 'proCompetitions' : client.fitnessLevel)}</InfoValue>} />
                    )}
                </section>
            )}

            <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                        {t('preferences')}
                    </span>
                </div>

                <Row
                    icon={<Globe size={18} className="text-on-surface-variant" />}
                    label={t('language')}
                    control={
                        <button
                            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                            className="bzt-press px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                        >
                            {lang === 'en' ? 'العربية' : 'English'}
                        </button>
                    }
                />
                <Row
                    icon={theme === 'dark'
                        ? <Moon size={18} className="text-on-surface-variant" />
                        : <Sun size={18} className="text-on-surface-variant" />
                    }
                    label={t('theme')}
                    control={
                        <button
                            onClick={toggleTheme}
                            className="bzt-press px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                        >
                            {theme === 'dark' ? t('lightTheme') : t('darkTheme')}
                        </button>
                    }
                />
                <Row
                    icon={<Bell size={18} className="text-on-surface-variant" />}
                    label={t('notifications')}
                    control={
                        <button
                            onClick={() => setNotificationsEnabled(v => !v)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'gold-gradient' : 'bg-surface-container-highest'}`}
                            aria-pressed={notificationsEnabled}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-surface transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    }
                    last
                />
            </section>

            {/* ── Account card ─────────────────────────────────────── */}
            <section className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                        {t('accountSection')}
                    </span>
                </div>

                <Row
                    icon={<Calendar size={18} className="text-on-surface-variant" />}
                    label={t('memberSince')}
                    control={
                        <span className="text-sm font-headline font-bold text-on-surface">Feb 2026</span>
                    }
                />

                {/* Edit profile info — only meaningful for community users
                    (clients update via the coach-driven check-in flow). */}
                {isCommunity && hasBaseline && (
                    <Row
                        icon={<Edit2 size={18} className="text-on-surface-variant" />}
                        label={t('editProfileInfo')}
                        control={
                            <button
                                onClick={() => setShowBaseline(true)}
                                className="bzt-press px-4 py-1.5 text-sm rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-label uppercase tracking-widest"
                            >
                                {t('edit')}
                            </button>
                        }
                    />
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-5 text-rose-400 hover:bg-rose-500/5 transition-colors border-t border-outline-variant/30"
                >
                    <LogOut size={18} />
                    <span className="font-body">{t('signOut')}</span>
                </button>
            </section>

            <div className="text-center text-on-surface/30 text-[10px] font-label font-bold uppercase tracking-widest pt-4">
                BioZackTeam · v1.0.0
            </div>

            {showBaseline && (
                <CommunityBaselineForm
                    onClose={() => setShowBaseline(false)}
                    initial={{
                        age: user.age,
                        heightCm: user.heightCm,
                        goal: user.goal,
                        currentWeightKg: user.currentWeightKg,
                        targetWeightKg: user.targetWeightKg,
                        phone: user.phone,
                    }}
                />
            )}
        </div>
    );
};

// Compact row for the preferences/account cards.
function Row({ icon, label, control, last }: {
    icon: React.ReactNode;
    label: string;
    control: React.ReactNode;
    last?: boolean;
}) {
    return (
        <div className={`flex items-center justify-between gap-4 px-6 py-4 ${last ? '' : 'border-b border-outline-variant/30'}`}>
            <div className="flex items-center gap-3 text-on-surface min-w-0">
                <span className="shrink-0">{icon}</span>
                <span className="font-body truncate">{label}</span>
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    );
}

function InfoValue({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-headline font-bold text-on-surface">{children}</span>;
}
