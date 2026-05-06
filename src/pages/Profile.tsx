import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Shield, Calendar, User, Award, Activity, Edit2, Target } from 'lucide-react';
import { ProgressPanel } from '../components/profile/ProgressPanel';
import { CommunityBaselineForm } from '../components/profile/CommunityBaselineForm';

function calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

const LEVEL_STYLES: Record<string, { color: string; emoji: string }> = {
    beginner: { color: 'emerald', emoji: '🟢' },
    intermediate: { color: 'yellow', emoji: '🟡' },
    pro_competitions: { color: 'red', emoji: '🔴' },
};

const LEVEL_LABEL_KEY: Record<string, string> = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    pro_competitions: 'proCompetitions',
};

export const Profile = () => {
    const { user } = useAuth();
    const { clients } = useData();
    const { t } = useLanguage();

    // Auto-open of the Week 0 baseline now lives in AuthenticatedShell as a
    // global gate — runs on first sign-in across any route. Here we only
    // expose the manual "Edit profile info" entry point.
    const [showBaseline, setShowBaseline] = useState(false);

    if (!user) return null;

    const client = clients.find(c => c.userId === user.id);
    const isCommunity = user.role === 'community';
    const hasBaseline = Boolean(user.communityProfileStartedAt);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            {/* Editorial header */}
            <header className="mb-10">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Member Identity</span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    {t('profileTitle')}<span className="text-primary-container">.</span>
                </h1>
            </header>

            {/* Identity hero card */}
            <section className="bg-surface-container-low p-10 md:p-12 rounded-2xl flex flex-col items-center text-center ghost-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="w-32 h-32 rounded-full p-1 mb-6 bg-gradient-to-br from-primary to-primary-container ring-1 ring-primary/20 shadow-[0_10px_30px_rgba(230,195,100,0.2)] mx-auto">
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-headline font-extrabold text-on-surface">{user.name.charAt(0)}</span>
                            )}
                        </div>
                    </div>

                    <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">{user.name}</h2>
                    <p className="text-on-surface/60 font-body text-sm mb-6">{user.email}</p>

                    <div className="inline-flex">
                        <span className="px-5 py-2.5 rounded-full bg-surface-container-highest text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/20 inline-flex items-center gap-2 shadow-lg shadow-surface-container-lowest">
                            <Shield size={14} /> {t(user.role as any)}
                        </span>
                    </div>
                </div>
            </section>

            {/* Community Week 0 baseline — only for community users */}
            {isCommunity && hasBaseline && (
                <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Target size={20} className="text-primary" />
                            </div>
                            <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">{t('personalInfo')}</h3>
                        </div>
                        <button
                            onClick={() => setShowBaseline(true)}
                            className="px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface/70 hover:text-primary hover:border-primary/40 text-[10px] font-label font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-colors"
                        >
                            <Edit2 size={12} /> {t('edit')}
                        </button>
                    </div>
                    <div className="space-y-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-2">
                        {user.age !== undefined && (
                            <Row icon={<Calendar size={18} />} label={t('age')} value={`${user.age} ${t('yearsOld')}`} isLast={false} />
                        )}
                        {user.heightCm !== undefined && (
                            <Row icon={<User size={18} />} label={t('height')} value={`${user.heightCm} cm`} isLast={false} />
                        )}
                        {user.goal && (
                            <Row icon={<Target size={18} />} label={t('goal')} value={t(`goal${user.goal.charAt(0).toUpperCase()}${user.goal.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase())}` as any)} isLast={false} />
                        )}
                        {user.currentWeightKg !== undefined && (
                            <Row icon={<Activity size={18} />} label={t('currentWeight')} value={`${user.currentWeightKg} kg`} isLast={false} />
                        )}
                        {user.targetWeightKg !== undefined && (
                            <Row icon={<Award size={18} />} label="Target" value={`${user.targetWeightKg} kg`} isLast={true} />
                        )}
                    </div>
                </section>
            )}

            {/* Personal Details — only show for clients with data */}
            {client && (client.birthdate || client.gender || client.fitnessLevel) && (
                <section className="bg-surface-container-low rounded-2xl p-8 ghost-border space-y-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <User size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">{t('personalDetails')}</h3>
                    </div>

                    <div className="space-y-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-2">
                        {client.birthdate && (
                            <Row icon={<Calendar size={18} />} label={t('age')} value={`${calculateAge(client.birthdate)} ${t('yearsOld')}`} isLast={!client.gender && !client.fitnessLevel} />
                        )}
                        {client.gender && (
                            <Row icon={<User size={18} />} label={t('gender')} value={`${client.gender === 'male' ? '♂' : '♀'} ${t(client.gender as any)}`} isLast={!client.fitnessLevel} />
                        )}
                        {client.fitnessLevel && (
                            <Row
                                icon={<Award size={18} />}
                                label={t('fitnessLevel')}
                                isLast={true}
                                value={
                                    <span className={`px-3 py-1.5 rounded-md text-[10px] font-label font-bold uppercase tracking-widest bg-${LEVEL_STYLES[client.fitnessLevel]?.color ?? 'slate'}-500/10 text-${LEVEL_STYLES[client.fitnessLevel]?.color ?? 'slate'}-400 inline-flex items-center gap-1.5 border border-${LEVEL_STYLES[client.fitnessLevel]?.color ?? 'slate'}-500/20`}>
                                        <span className="text-sm">{LEVEL_STYLES[client.fitnessLevel]?.emoji}</span> {t((LEVEL_LABEL_KEY[client.fitnessLevel] ?? client.fitnessLevel) as any)}
                                    </span>
                                }
                            />
                        )}
                    </div>
                </section>
            )}

            <section className="bg-surface-container-low rounded-2xl p-8 ghost-border space-y-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/30">
                        <Shield size={20} className="text-on-surface/50" />
                    </div>
                    <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">{t('accountInfo')}</h3>
                </div>
                <div className="space-y-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-2">
                    <Row icon={<Mail size={18} />} label={t('email')} value={user.email} isLast={false} />
                    <Row icon={<Calendar size={18} />} label={t('memberSince')} value="Feb 2026" isLast={true} />
                </div>
            </section>

            {(user.role === 'client' || user.role === 'community') && (
                <section>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Activity size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">{t('profileProgress')}</h3>
                    </div>
                    <ProgressPanel />
                </section>
            )}

            <div className="text-center text-on-surface/30 text-[10px] font-label font-bold uppercase tracking-widest pt-8">
                            BioZackTeam · v1.0.0
            </div>

            {showBaseline && (
                <CommunityBaselineForm
                    onClose={() => setShowBaseline(false)}
                    initial={hasBaseline ? {
                        age: user.age,
                        heightCm: user.heightCm,
                        goal: user.goal,
                        currentWeightKg: user.currentWeightKg,
                        targetWeightKg: user.targetWeightKg,
                    } : undefined}
                />
            )}
        </div>
    );
};

function Row({ icon, label, value, isLast }: { icon: React.ReactNode; label: string; value: React.ReactNode; isLast: boolean }) {
    return (
        <div className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-outline-variant/30' : ''}`}>
            <div className="flex items-center gap-4 text-on-surface/50">
                {icon}
                <span className="text-sm font-body font-medium">{label}</span>
            </div>
            <span className="text-on-surface font-headline font-bold">{value}</span>
        </div>
    );
}
