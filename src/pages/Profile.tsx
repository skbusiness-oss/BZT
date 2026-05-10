/**
 * Profile — your data + your progress.
 *
 * Trimmed down to the two things that don't fit anywhere else:
 *   1. Personal details (age, height, weights, goal, gender, fitness level)
 *      — displayed read-only here for community + clients with data.
 *   2. Progress panel — chart + measurements + photos timeline.
 *
 * Identity (avatar, email, role), preferences (language, theme, notifications),
 * "Edit profile info", and Sign out have all moved to /settings — see
 * Settings.tsx. This keeps Profile single-purpose: a page about your fitness
 * data, not your account.
 */
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Calendar, User, Award, Activity, Target, TrendingUp,
} from 'lucide-react';
import { ProgressPanel } from '../components/profile/ProgressPanel';
import { CoachingJourneyPanel } from '../components/profile/CoachingJourneyPanel';

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

    if (!user) return null;

    const client = clients.find(c => c.userId === user.id);
    const isCommunity = user.role === 'community';
    const isCoachingClient = user.role === 'client';
    const hasBaseline = Boolean(user.communityProfileStartedAt);
    const showProgress = isCoachingClient || isCommunity;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            {/* Editorial header */}
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('memberIdentityEyebrow')}
                </span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    {t('profileTitle')}<span className="text-primary-container">.</span>
                </h1>
            </header>

            {/* ── Community baseline (age/height/goal/weights) ───────── */}
            {isCommunity && hasBaseline && (
                <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Target size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
                            {t('personalInfo')}
                        </h3>
                    </div>
                    <div className="space-y-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-2">
                        {user.age !== undefined && (
                            <Row icon={<Calendar size={18} />} label={t('age')} value={`${user.age} ${t('yearsOld')}`} isLast={false} />
                        )}
                        {user.heightCm !== undefined && (
                            <Row icon={<User size={18} />} label={t('height')} value={`${user.heightCm} cm`} isLast={false} />
                        )}
                        {user.goal && (
                            <Row
                                icon={<Target size={18} />}
                                label={t('goal')}
                                value={t(`goal${user.goal.charAt(0).toUpperCase()}${user.goal.slice(1).replace(/_(\w)/g, (_, c) => c.toUpperCase())}`)}
                                isLast={false}
                            />
                        )}
                        {user.currentWeightKg !== undefined && (
                            <Row icon={<Activity size={18} />} label={t('currentWeight')} value={`${user.currentWeightKg} kg`} isLast={false} />
                        )}
                        {user.targetWeightKg !== undefined && (
                            <Row
                                icon={<Award size={18} />}
                                label={t('targetWeight') || 'Target'}
                                value={`${user.targetWeightKg} kg`}
                                isLast
                            />
                        )}
                    </div>
                </section>
            )}

            {/* ── Coaching client personal details ──────────────────── */}
            {client && (client.birthdate || client.gender || client.fitnessLevel) && (
                <section className="bg-surface-container-low rounded-2xl p-8 ghost-border space-y-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <User size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
                            {t('personalDetails')}
                        </h3>
                    </div>

                    <div className="space-y-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-2">
                        {client.birthdate && (
                            <Row
                                icon={<Calendar size={18} />}
                                label={t('age')}
                                value={`${calculateAge(client.birthdate)} ${t('yearsOld')}`}
                                isLast={!client.gender && !client.fitnessLevel}
                            />
                        )}
                        {client.gender && (
                            <Row
                                icon={<User size={18} />}
                                label={t('gender')}
                                value={`${client.gender === 'male' ? '♂' : '♀'} ${t(client.gender)}`}
                                isLast={!client.fitnessLevel}
                            />
                        )}
                        {client.fitnessLevel && (
                            <Row
                                icon={<Award size={18} />}
                                label={t('fitnessLevel')}
                                isLast
                                value={
                                    <span className={`px-3 py-1.5 rounded-md text-[10px] font-label font-bold uppercase tracking-widest bg-${LEVEL_STYLES[client.fitnessLevel]?.color ?? 'slate'}-500/10 text-${LEVEL_STYLES[client.fitnessLevel]?.color ?? 'slate'}-400 inline-flex items-center gap-1.5 border border-${LEVEL_STYLES[client.fitnessLevel]?.color ?? 'slate'}-500/20`}>
                                        <span className="text-sm">{LEVEL_STYLES[client.fitnessLevel]?.emoji}</span>
                                        {t(LEVEL_LABEL_KEY[client.fitnessLevel] ?? client.fitnessLevel)}
                                    </span>
                                }
                            />
                        )}
                    </div>
                </section>
            )}

            {/* ── Progress / Journey ──────────────────────────────────
                Coaching clients see the editorial "My Journey" panel —
                photos, coach feedback, transformation reel. Community
                users see the utility ProgressPanel — charts + measurement
                entry. Coaches/admins see neither. */}
            {showProgress && (
                <section>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <TrendingUp size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
                            {isCoachingClient ? t('myJourneyTitle') : t('profileProgress')}
                        </h3>
                    </div>
                    {isCoachingClient ? <CoachingJourneyPanel /> : <ProgressPanel />}
                </section>
            )}
        </div>
    );
};

function Row({ icon, label, value, isLast }: { icon: React.ReactNode; label: string; value: React.ReactNode; isLast: boolean }) {
    return (
        <div className={`flex items-center justify-between gap-4 p-4 ${!isLast ? 'border-b border-outline-variant/30' : ''}`}>
            <div className="flex items-center gap-4 text-on-surface/50 min-w-0">
                <span className="shrink-0">{icon}</span>
                <span className="text-sm font-body font-medium truncate">{label}</span>
            </div>
            <span className="text-on-surface font-headline font-bold shrink-0">{value}</span>
        </div>
    );
}
