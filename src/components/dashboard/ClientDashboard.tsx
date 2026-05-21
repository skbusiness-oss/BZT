import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useData, useCoaching } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import { useAcademy } from '../../context/AcademyContext';
import { useCommunity } from '../../context/CommunityContext';
import { useAssignedDiet } from '../../hooks/useAssignedDiet';
import { db } from '../../lib/firebase';
import { computeDietProfile, matchDiet } from '../../lib/dietCalculator';
import { dietPlans } from '../../data/diets';
import type { Sex, ActivityLevel, DietGoal, MealsPerDay } from '../../types';

// Activity-level enum → translation key. Mirrors the same pair in
// DietWizard / CommunityBaselineForm so the intake picker reads
// consistently across all three surfaces.
const ACTIVITY_KEY: Record<ActivityLevel, string> = {
    sedentary: 'activitySedentary',
    light:     'activityLight',
    moderate:  'activityModerate',
    active:    'activityActive',
    extra:     'activityExtra',
};
const ACTIVITY_DESC_KEY: Record<ActivityLevel, string> = {
    sedentary: 'activitySedentaryDesc',
    light:     'activityLightDesc',
    moderate:  'activityModerateDesc',
    active:    'activityActiveDesc',
    extra:     'activityExtraDesc',
};
import {
    t as bzt, goldGradient,
    WeekStatusPanel,
    ContinueAcademyCard, TodayWorkoutCard, TodayDietCard, CommunityActivityCard, ProgressCTA,
} from './biozackteam/shared';
import {
    Calendar,
    Activity,
    MessageSquare,
    Camera,
    CheckCircle2,
    Loader2,
    X,
    User,
    Clock,
} from 'lucide-react';
import { PhoneInput } from '../shared/PhoneInput';

// ─── Client welcome header — editorial hero, mirrors Community shape ──────
function getGreetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
    const h = new Date().getHours();
    if (h < 12) return 'goodMorning';
    if (h < 18) return 'goodAfternoon';
    return 'goodEvening';
}

// ─── Section header ────────────────────────────────────────────────
// Used to group the dashboard cards into a few clear buckets so the
// user reads the page as "do this now → see your progress → grow."
// Each header carries a one-line subtitle that names the section's
// purpose in plain English (founder direction: every card should
// explain itself at a glance).
function SectionHeader({ eyebrow, title, subtitle }: {
    eyebrow: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div style={{ margin: '8px 0 14px' }}>
            <div style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgb(var(--primary))',
                marginBottom: 4,
            }}>
                {eyebrow}
            </div>
            <h2 style={{
                fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
                fontSize: 22, fontWeight: 700,
                color: 'rgb(var(--on-surface))',
                margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
                {title}
            </h2>
            <p style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontSize: 13, lineHeight: 1.5,
                color: 'rgb(var(--on-surface) / 0.62)',
                margin: '4px 0 0',
            }}>
                {subtitle}
            </p>
        </div>
    );
}

function ClientWelcomeHeader({
    firstName, initials, weekNumber, programLength, weekStreak, weekStatus,
}: {
    firstName: string;
    initials: string;
    weekNumber: number;
    programLength: number;
    weekStreak: number;
    weekStatus: string;
}) {
    const { t: tStrict, lang } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;
    const greeting = t(getGreetingKey()) ?? 'Hello';
    const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : undefined, {
        weekday: 'long', day: 'numeric', month: 'long',
    });
    const statusLabel = weekStatus === 'pending'
        ? t('checkInPendingStatus')
        : weekStatus === 'submitted'
            ? t('awaitingReviewStatus')
            : t('reviewedStatus');
    const statusDotColor = weekStatus === 'reviewed'
        ? '#10b981'
        : weekStatus === 'submitted'
            ? bzt.primary
            : '#f59e0b';

    return (
        <div
            className="bzt-rise-in"
            style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 24, marginBottom: 32, paddingLeft: 4,
            }}
        >
            <div style={{ maxWidth: 720, minWidth: 0, flex: 1 }}>
                {/* Date eyebrow with thin gold accent line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span aria-hidden style={{
                        display: 'block', width: 24, height: 1,
                        background: `linear-gradient(90deg, ${bzt.primary}, transparent)`,
                    }} />
                    <span style={{
                        fontFamily: bzt.body, fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: bzt.onSurfaceVariant,
                    }}>
                        {today}
                    </span>
                </div>

                <h1 style={{
                    fontFamily: bzt.display,
                    fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                    fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.035em',
                    color: bzt.onSurface, margin: 0,
                }}>
                    <span style={{ display: 'block', fontWeight: 300 }}>{greeting},</span>
                    <span style={{
                        fontWeight: 600, background: goldGradient,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        display: 'inline-block',
                    }}>
                        {firstName}
                    </span>
                </h1>

                {/* Status chip — week + status pill, plus a streak badge if active */}
                <div
                    className="bzt-rise-in"
                    style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8, animationDelay: '180ms' }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 12,
                        padding: '8px 14px 8px 12px', borderRadius: 999,
                        background: bzt.surfaceContainerLow,
                        border: `1px solid ${bzt.outline}`,
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: statusDotColor,
                            boxShadow: `0 0 8px ${statusDotColor}`,
                        }} />
                        <span style={{
                            fontFamily: bzt.body, fontSize: 13, fontWeight: 600, color: bzt.onSurface,
                        }}>
                            {t('week')} {weekNumber} <span style={{ color: bzt.onSurfaceVariant, fontWeight: 500 }}>/ {programLength}</span>
                        </span>
                        <span style={{ width: 1, height: 14, background: bzt.outline }} />
                        <span style={{
                            fontFamily: bzt.body, fontSize: 13, fontWeight: 500, color: bzt.onSurfaceVariant,
                        }}>
                            {statusLabel}
                        </span>
                    </div>
                    {weekStreak > 0 && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 999,
                            background: 'rgb(var(--primary) / 0.10)',
                            border: '1px solid rgb(var(--primary) / 0.25)',
                        }}>
                            <span style={{
                                fontFamily: bzt.body, fontSize: 13, fontWeight: 700, color: bzt.primary,
                            }}>
                                {weekStreak}
                            </span>
                            <span style={{
                                fontFamily: bzt.body, fontSize: 12, fontWeight: 500, color: bzt.onSurfaceVariant,
                            }}>
                                {t('weekCheckInStreak')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div
                className="bzt-rise-in"
                style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: bzt.surfaceContainerHighest,
                    border: `1px solid ${bzt.outline}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: bzt.display, fontSize: 20, fontWeight: 600,
                    color: bzt.primary, letterSpacing: '0.04em',
                    flexShrink: 0,
                    boxShadow: `0 8px 24px rgb(0 0 0 / 0.20), inset 0 0 0 1px rgb(var(--primary) / 0.08)`,
                    animationDelay: '80ms',
                }}
            >{initials}</div>
        </div>
    );
}

export const ClientDashboard = () => {
    const { user } = useAuth();
    const { t: tStrict, lang } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;
    const { clients, getClientWeeks, completeOnboarding, createProgram, uploadPhoto } = useData();
    // Direct read of CoachingContext.loading so we can distinguish
    // "client doc genuinely doesn't exist for this uid" from "listener
    // is still hydrating after sign-in". Without this gate, the
    // dashboard flashes "Client record not found" for ~500ms on every
    // load before the snapshot lands and the real dashboard renders.
    const { loading: coachingLoading } = useCoaching();
    const navigate = useNavigate();
    const { activeProgram, getTodaysDay, todaysDayNumber } = useActiveProgram();
    const { assignedDietId, snapshot: assignedDietSnapshot } = useAssignedDiet();
    const { courses, userProgress, lessons, loadLessons } = useAcademy();
    const { posts } = useCommunity();

    const client = clients.find(c => c.userId === user?.id);
    // Derive weeks early so hooks aren't called conditionally below
    const allWeeks = useMemo(() => client ? getClientWeeks(client.id) : [], [client, getClientWeeks]);

    // Onboarding form state
    const [formData, setFormData] = useState({
        startingWeight: '',
        height: '',
        goal: 'fat_loss',
        activityLevel: 'moderate',
        dietHistory: '',
        injuries: '',
        birthdate: '',
        gender: '',
        fitnessLevel: 'beginner',
        mealsPerDay: '3',
        phone: '',
    });

    // Photo upload state for onboarding
    const [photoUrls, setPhotoUrls] = useState<{ front?: string; side?: string; back?: string }>({});
    const [uploadingAngle, setUploadingAngle] = useState<'front' | 'side' | 'back' | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);

    const goals = [
        { id: 'fat_loss', label: t('objFatLoss'), desc: t('objFatLossDesc') },
        { id: 'muscle_gain', label: t('objMuscleGain'), desc: t('objMuscleGainDesc') },
        { id: 'recomp', label: t('objRecomp'), desc: t('objRecompDesc') },
        { id: 'performance', label: t('objPerformance'), desc: t('objPerformanceDesc') }
    ];

    const fitnessLevels = [
        { id: 'beginner', label: t('beginner'), desc: t('fitnessLevelDesc_beginner'), emoji: '🟢' },
        { id: 'intermediate', label: t('intermediate'), desc: t('fitnessLevelDesc_intermediate'), emoji: '🟡' },
        { id: 'pro_competitions', label: t('proCompetitions'), desc: t('fitnessLevelDesc_pro'), emoji: '🔴' },
    ];

    const photoAngles = [
        { key: 'front', label: t('front') },
        { key: 'side', label: t('side') },
        { key: 'back', label: t('back') },
    ];

    const defaultTargets = {
        mode: 'cycling' as const,
        highCarb: { carbs: 280, protein: 180, fats: 60, calories: 2380 },
        moderateCarb: { carbs: 210, protein: 180, fats: 68, calories: 2172 },
        lowCarb: { carbs: 140, protein: 180, fats: 75, calories: 1955 }
    };

    const handlePhotoChange = async (angle: 'front' | 'side' | 'back', file: File) => {
        if (!user) return;
        setUploadingAngle(angle);
        setPhotoError(null);
        try {
            const url = await uploadPhoto(file, user.id, 0); // week 0 = onboarding
            setPhotoUrls(prev => ({ ...prev, [angle]: url }));
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('Onboarding photo upload failed:', err);
            setPhotoError(
                err?.code === 'storage/unauthorized'
                    ? 'Permission denied. Sign in again or check the file type.'
                    : err?.message ?? 'Photo upload failed. Check your connection and try again.'
            );
        } finally {
            setUploadingAngle(null);
        }
    };

    // Map the client's onboarding goal to the diet calculator's calorie-
    // adjustment taxonomy. Same logic as DietWizard / community baseline.
    const onboardGoalToDietGoal = (g: string): DietGoal => {
        if (g === 'fat_loss')    return 'cut';
        if (g === 'muscle_gain') return 'lean_bulk';
        if (g === 'recomp')      return 'recomp';
        if (g === 'performance') return 'maintain';
        return 'maintain';
    };

    const ageFromBirthdate = (iso: string): number | null => {
        if (!iso) return null;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
        return age > 0 ? age : null;
    };

    const handleIntakeSubmit = async () => {
        if (!client || !user) {
            alert(t('fillRequired'));
            return;
        }
        const phoneOk = formData.phone.startsWith('+') && formData.phone.replace(/\D+/g, '').length >= 7;
        if (!(formData.startingWeight && formData.height && formData.birthdate && formData.gender && phoneOk)) {
            alert(t('fillRequired'));
            return;
        }

        // 1. Existing intake/program writes (unchanged behaviour).
        completeOnboarding(client.id, {
            ...formData,
            frontPhoto: photoUrls.front ?? '',
            sidePhoto: photoUrls.side ?? '',
            backPhoto: photoUrls.back ?? '',
        }, photoUrls);
        createProgram(client.id, defaultTargets);

        // Mirror the phone onto users/{uid} so the coach can reach the
        // user from any surface that reads the user doc (Messages,
        // ClientInfoPanel, etc.) without joining through the clients
        // collection. Best-effort; intake still completes if this fails.
        try {
            await updateDoc(doc(db, 'users', user.id), { phone: formData.phone });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to mirror phone to user doc:', e);
        }

        // 2. Compute + persist dietProfile and auto-assign the matched plan.
        //    Best-effort — if any of the diet writes fail we still let the
        //    client through onboarding with the workout program.
        try {
            const age = ageFromBirthdate(formData.birthdate);
            if (age == null) return;
            const profile = computeDietProfile({
                sex: formData.gender as Sex,
                age,
                weightKg: Number(formData.startingWeight),
                heightCm: Number(formData.height),
                activityLevel: formData.activityLevel as ActivityLevel,
                goal: onboardGoalToDietGoal(formData.goal),
                mealsPerDay: Number(formData.mealsPerDay) as MealsPerDay,
            });

            await updateDoc(doc(db, 'users', user.id), {
                dietProfile: { ...profile, calculatedAt: serverTimestamp(), updatedAt: serverTimestamp() },
            });

            const matched = matchDiet(profile, dietPlans);
            if (matched) {
                await setDoc(doc(db, 'userDiets', user.id), {
                    id: user.id,
                    userId: user.id,
                    dietId: matched.id,
                    snapshot: {
                        name: matched.name,
                        mealsPerDay: matched.mealsPerDay,
                        calories: matched.calories,
                        macros: matched.macros,
                        pdfUrl: matched.pdfUrl ?? null,
                    },
                    assignedAt: serverTimestamp(),
                });
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to compute/save diet on intake submit:', e);
        }
    };

    if (!client) {
        // Hydration window: CoachingContext listener hasn't fired yet.
        // Show a soft spinner instead of the "Client record not found"
        // error so the user doesn't see a flash of failure text before
        // the snapshot arrives.
        if (coachingLoading) {
            return (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 size={28} className="animate-spin text-primary" />
                </div>
            );
        }
        return <div className="text-on-surface">{t('clientRecord')}</div>;
    }

    // ========================================================
    // STATE 1: ONBOARDING (isOnboarding === true)
    // ========================================================
    if (client.isOnboarding) {
        return (
            <div className="max-w-3xl mx-auto py-4 animate-in fade-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-headline font-bold text-on-surface mb-3 tracking-tight">{t('welcomeClient')} {client.name}! 👋</h1>
                    <p className="text-on-surface/60 font-body">{t('completeIntake')}</p>
                </div>

                <div className="bg-surface-container-low rounded-2xl p-8 space-y-10 border border-outline-variant/30 ghost-border shadow-xl">

                    {/* Personal Information — Birthdate & Gender */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3 flex items-center gap-2">
                            <User size={20} className="text-primary" />
                            {t('personalInfo')} <span className="text-red-400">*</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('birthdate')}</label>
                                <input
                                    type="date"
                                    value={formData.birthdate}
                                    onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('gender')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['male', 'female'] as const).map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={`py-3 px-4 rounded-xl border text-center transition-all font-label text-[10px] uppercase tracking-widest font-bold ${
                                                formData.gender === g
                                                    ? 'bg-primary/10 border-primary/50 text-primary'
                                                    : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface/60 hover:border-outline-variant/50 hover:text-on-surface'
                                            }`}
                                        >
                                            {g === 'male' ? '♂️' : '♀️'} {t(g)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Phone — required so the coach can reach the client */}
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">
                                {t('phoneLabel')} <span className="text-red-400">*</span>
                            </label>
                            <PhoneInput
                                value={formData.phone}
                                onChange={(next) => setFormData({ ...formData, phone: next })}
                                lang={lang as 'en' | 'ar'}
                            />
                            <p className="text-[11px] text-on-surface/50 mt-1.5">{t('phoneHelper')}</p>
                        </div>
                    </section>

                    {/* Weight & Height */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">{t('baseMeasurements')} <span className="text-red-400">*</span></h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('weightKg')}</label>
                                <input
                                    type="number"
                                    value={formData.startingWeight}
                                    onChange={e => setFormData({ ...formData, startingWeight: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface transition-colors"
                                    placeholder="75"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('heightCm')}</label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface transition-colors"
                                    placeholder="175"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    {/* Physique Documentation */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">{t('physiqueDocumentation')}</h2>
                        <p className="text-on-surface/50 text-sm font-body">{t('uploadPhotos')}</p>
                        <div className="grid grid-cols-3 gap-4">
                            {photoAngles.map(({ key, label }) => {
                                const angle = key as 'front' | 'side' | 'back';
                                const url = photoUrls[angle];
                                const isUploading = uploadingAngle === angle;
                                return (
                                    <div key={angle} className="relative">
                                        {url ? (
                                            <div className="aspect-[3/4] rounded-xl overflow-hidden relative group border border-outline-variant/30 shadow-sm">
                                                <img
                                                    src={url}
                                                    alt={label}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-surface-container-highest/80 backdrop-blur-sm text-[10px] font-label uppercase tracking-widest text-on-surface font-bold">{label}</div>
                                                <button
                                                    onClick={() => setPhotoUrls(prev => { const n = { ...prev }; delete n[angle]; return n; })}
                                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-on-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest flex flex-col items-center justify-center gap-3 text-on-surface/40 hover:border-primary/40 hover:bg-surface-container transition-all cursor-pointer group">
                                                {isUploading ? (
                                                    <Loader2 size={24} className="animate-spin text-primary" />
                                                ) : (
                                                    <Camera size={24} className="group-hover:text-primary transition-colors" />
                                                )}
                                                <span className="text-[10px] font-label font-bold uppercase tracking-widest">{label}</span>
                                                {!isUploading && (
                                                    <span className="text-[10px] font-label text-on-surface/30">{t('noFileChosen')}</span>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    disabled={isUploading}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handlePhotoChange(angle, file);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {photoError && (
                            <p className="text-red-400 text-xs font-body mt-2">{photoError}</p>
                        )}
                    </section>

                    {/* Current Nutrition */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">{t('currentNutrition')}</h2>
                        <textarea
                            value={formData.dietHistory}
                            onChange={e => setFormData({ ...formData, dietHistory: e.target.value })}
                            placeholder={t('nutritionPlaceholder')}
                            className="w-full h-32 bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface placeholder-on-surface/30 resize-none transition-colors"
                        />
                    </section>

                    {/* Primary Objectives */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">{t('primaryObjectives')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.map(goal => (
                                <button
                                    key={goal.id}
                                    onClick={() => setFormData({ ...formData, goal: goal.id })}
                                    className={`flex items-center justify-between p-5 rounded-xl border text-left transition-all shadow-sm ${formData.goal === goal.id
                                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                                        : "bg-surface-container border-outline-variant/30 hover:border-outline-variant/50 hover:bg-surface-container-high"
                                        }`}
                                >
                                    <div>
                                        <div className={`font-headline font-bold mb-1 ${formData.goal === goal.id ? "text-primary" : "text-on-surface"}`}>{goal.label}</div>
                                        <div className="text-[11px] font-body text-on-surface/50 leading-relaxed">{goal.desc}</div>
                                    </div>
                                    {formData.goal === goal.id && <CheckCircle2 className="text-primary shrink-0 ml-3" size={20} />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Fitness Level */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">{t('fitnessLevel')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {fitnessLevels.map(level => (
                                <button
                                    key={level.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, fitnessLevel: level.id })}
                                    className={`flex flex-col items-center justify-center p-6 rounded-xl border text-center transition-all shadow-sm ${formData.fitnessLevel === level.id
                                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                                        : "bg-surface-container border-outline-variant/30 hover:border-outline-variant/50 hover:bg-surface-container-high"
                                    }`}
                                >
                                    <span className="text-3xl mb-3">{level.emoji}</span>
                                    <div className={`font-headline font-bold mb-1.5 ${formData.fitnessLevel === level.id ? "text-primary" : "text-on-surface"}`}>{level.label}</div>
                                    <div className="text-[11px] font-body text-on-surface/50 leading-relaxed">{level.desc}</div>
                                    {formData.fitnessLevel === level.id && <CheckCircle2 className="text-primary mt-3" size={18} />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Activity Level — drives the diet calorie calculator. */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">
                            {t('activityLevel') ?? 'Activity level'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(['sedentary', 'light', 'moderate', 'active', 'extra'] as const).map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activityLevel: a })}
                                    className={`flex flex-col gap-1 p-4 rounded-xl border text-left transition-all ${
                                        formData.activityLevel === a
                                            ? 'bg-primary/10 border-primary/50'
                                            : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant/50'
                                    }`}
                                >
                                    <span className={`font-headline font-bold text-sm ${formData.activityLevel === a ? 'text-primary' : 'text-on-surface'}`}>{t(ACTIVITY_KEY[a as ActivityLevel])}</span>
                                    <span className="text-[12px] font-body text-on-surface/55">{t(ACTIVITY_DESC_KEY[a as ActivityLevel])}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Meals per day — drives plan matching (3 vs 4 meal variant). */}
                    <section className="space-y-5">
                        <h2 className="text-xl font-headline font-bold text-on-surface border-b border-outline-variant/30 pb-3">
                            {t('mealsPerDay') ?? 'Meals/day'}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {(['3', '4'] as const).map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, mealsPerDay: n })}
                                    className={`p-5 rounded-xl border text-left transition-all ${
                                        formData.mealsPerDay === n
                                            ? 'bg-primary/10 border-primary/50'
                                            : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant/50'
                                    }`}
                                >
                                    <div className="font-headline font-extrabold text-2xl text-on-surface mb-1">{n}</div>
                                    <div className="text-sm font-headline font-bold text-on-surface mb-0.5">
                                        {n} {t('mealsPerDay') ?? 'meals/day'}
                                    </div>
                                    <div className="text-[12px] font-body text-on-surface/55 leading-snug">
                                        {n === '3'
                                            ? (t('threeMealsBlurb') ?? 'Bigger meals, simpler routine.')
                                            : (t('fourMealsBlurb') ?? 'Smaller meals, steady energy.')}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Submit */}
                    <div className="pt-8 border-t border-outline-variant/30">
                        <button
                            onClick={handleIntakeSubmit}
                            disabled={!formData.startingWeight || !formData.height || !formData.birthdate || !formData.gender || !(formData.phone.startsWith('+') && formData.phone.replace(/\D+/g, '').length >= 7)}
                            className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            <CheckCircle2 size={20} /> {t('submitIntake')}
                        </button>
                        <p className="text-center text-xs font-body text-on-surface/40 mt-4">
                            {t('coachWillReview')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // STATE 2: PENDING COACH (currentWeek === 0, isOnboarding === false)
    // ========================================================
    if (client.currentWeek === 0) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in fade-in duration-500">
                <div className="bg-surface-container-low rounded-2xl p-10 border border-outline-variant/30 ghost-border shadow-xl">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-[0_0_30px_rgba(230,195,100,0.15)]">
                        <Activity size={40} className="text-primary" />
                    </div>
                    <h1 className="text-4xl font-headline font-bold text-on-surface mb-4 tracking-tight">{t('allSetTitle')} 🎉</h1>
                    <p className="text-on-surface/60 font-body text-lg mb-8 leading-relaxed max-w-md mx-auto">
                        {t('intakeReceived')} <br />
                        {t('coachBuilding')}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant/30 px-5 py-2.5 rounded-full text-on-surface/50 text-[10px] font-label font-bold uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(230,195,100,0.8)]" />
                        {t('statusPendingReview')}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // STATE 3: ACTIVE CLIENT (currentWeek >= 1)
    // ========================================================
    const weeks = allWeeks;
    const currentWeekIndex = client.currentWeek - 1;
    const currentWeekData = weeks[currentWeekIndex];

    if (!currentWeekData) {
        return <div className="text-on-surface">{t('weekData')}</div>;
    }

    const reviewedWeeksWithFeedback = weeks.filter(w =>
        (w.status === 'reviewed' || w.status === 'locked') && w.coachFeedback
    );
    const latestReviewedWeek = reviewedWeeksWithFeedback.length > 0
        ? reviewedWeeksWithFeedback[reviewedWeeksWithFeedback.length - 1]
        : null;

    // Real streak: consecutive submitted weeks (most recent first)
    const weekStreak = (() => {
        let streak = 0;
        for (let i = weeks.length - 1; i >= 0; i--) {
            if (['submitted', 'reviewed', 'locked'].includes(weeks[i].status)) streak++;
            else break;
        }
        return streak;
    })();

    // Real activity score + streak from the user doc
    const xp = user?.activityScore ?? 0;
    const dailyStreak = user?.streak?.current ?? 0;
    const bestStreak = user?.streak?.best ?? 0;

    // Set of YYYY-MM-DD dates where the client filled in a daily entry within
    // the current week. Feeds the calendar-strip "logged" indicator.
    // Plain computation rather than useMemo — this code path is reached
    // only after three early returns above, so a hook here would violate
    // the rules-of-hooks (was the source of a past React #310). The set
    // has ≤7 entries, so memoization is unnecessary.
    const loggedDates = (() => {
        const set = new Set<string>();
        const entries = currentWeekData?.dailyEntries ?? [];
        for (const e of entries) {
            const hasData = (e.carbs ?? 0) > 0 || (e.protein ?? 0) > 0 || (e.fats ?? 0) > 0 || (typeof e.weight === 'number' && e.weight > 0);
            if (hasData && e.date) set.add(e.date);
        }
        return set;
    })();

    const firstName = client.name.split(' ')[0];
    const initials = client.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'ME';

    return (
        <div style={{ fontFamily: bzt.body, color: bzt.onSurface, padding: '8px 0 40px' }}>
            {/* Welcome header — time-of-day greeting + week status. */}
            <ClientWelcomeHeader
                firstName={firstName}
                initials={initials}
                weekNumber={client.currentWeek}
                programLength={client.programLength}
                weekStreak={weekStreak}
                weekStatus={currentWeekData.status}
            />

            {/* Submission-window notice — stays at the top because it's
                a TIMING notice (Friday submit / Saturday review), not a
                routine card. Surfaces every week, not section-specific. */}
            <div style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        padding: '14px 16px', borderRadius: 14,
                        background: 'rgba(255, 199, 78, 0.08)',
                        border: '1px solid rgba(255, 199, 78, 0.28)',
                    }}
                >
                    <div style={{
                        flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255, 199, 78, 0.18)',
                        color: '#FFC74E',
                    }}>
                        <Calendar size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: bzt.body, fontSize: 12, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: '#FFC74E', marginBottom: 4,
                        }}>
                            {t('submissionWindowTitle')}
                        </div>
                        <div style={{
                            fontFamily: bzt.body, fontSize: 13, lineHeight: 1.5,
                            color: bzt.onSurface, opacity: 0.85,
                        }}>
                            {t('submissionWindowBody')}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 1 — TODAY'S ACTIONS
                The three things the client should do today.
            ════════════════════════════════════════════════ */}
            <SectionHeader
                eyebrow="Step 1"
                title="Today"
                subtitle="Do these three things now — submit your check-in, train, eat."
            />

            {/* Weekly check-in hero — consolidates the prior dual cards
                   (status row + coach-feedback banner) into one image-backed card.
                   States: pending / submitted (awaiting review) / reviewed (with quote). */}
            <div style={{ marginBottom: 24 }}>
                <div
                    onClick={() => navigate('/checkin')}
                    className="bzt-hero-card"
                    style={{
                        position: 'relative', borderRadius: 20, overflow: 'hidden',
                        cursor: 'pointer', minHeight: 240, padding: 0,
                        border: `1px solid ${bzt.outline}`,
                        boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
                    }}
                >
                    {/* Layered: coach photo (kbruns on hover), gold tint (multiply),
                        bottom dark fade for readability. */}
                    <div className="bzt-hero-photo" style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'url(/checkin-hero.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 25%',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(135deg, rgb(var(--primary) / 0.4), rgb(var(--primary-container) / 0.25))`,
                        mixBlendMode: 'multiply',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)',
                    }} />

                    <div style={{
                        position: 'relative', zIndex: 1, padding: 24,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        minHeight: 240,
                    }}>
                        {/* Top — eyebrow + status pill */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{
                                fontFamily: bzt.body, fontSize: 11, fontWeight: 600,
                                letterSpacing: '0.16em', textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.82)',
                            }}>
                                {t('weeklyCheckInEyebrow')}
                            </div>
                            <div style={{
                                padding: '6px 12px', borderRadius: 999,
                                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                                color: '#fff', fontFamily: bzt.body, fontSize: 11, fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                {currentWeekData.status === 'pending' && <><Clock size={13} /> {t('dueLabel')}</>}
                                {currentWeekData.status === 'submitted' && <><CheckCircle2 size={13} /> {t('submittedLabel')}</>}
                                {currentWeekData.status === 'reviewed' && <><MessageSquare size={13} /> {t('reviewedStatus')}</>}
                            </div>
                        </div>

                        {/* Bottom — title, status copy, coach quote (if reviewed), CTA */}
                        <div>
                            <h2 style={{
                                fontFamily: bzt.display, fontSize: 26, fontWeight: 600,
                                color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                            }}>
                                {t('week')} {client.currentWeek} · {
                                    currentWeekData.status === 'reviewed'
                                        ? t('reviewedStatus')
                                        : currentWeekData.status === 'submitted'
                                            ? t('awaitingReviewStatus')
                                            : t('pendingSubmission')
                                }
                            </h2>
                            {/* Purpose caption — explains in one line what
                                the user can do on the check-in screen. Same
                                pattern as the dashboard's PurposeLine helper
                                but inlined here because this card lives on
                                a dark hero photo with its own styles. */}
                            <p style={{
                                fontFamily: bzt.body, fontSize: 11.5, fontWeight: 500, fontStyle: 'italic',
                                color: 'rgba(255,255,255,0.72)',
                                margin: '0 0 8px', lineHeight: 1.45,
                            }}>
                                {currentWeekData.status === 'reviewed'
                                    ? 'Read coach Zaki’s feedback and start the next week.'
                                    : currentWeekData.status === 'submitted'
                                        ? 'Already submitted — sit tight while coach Zaki reviews it.'
                                        : 'Log weight, photos, and macros so coach Zaki can review your week.'}
                            </p>
                            {/* Subtitle drops the duplicate "Weekly check-in" wording for the
                                pending state — the eyebrow already announces the section. */}
                            {currentWeekData.status !== 'pending' && (
                                <p style={{
                                    fontFamily: bzt.body, fontSize: 12,
                                    color: 'rgba(255,255,255,0.82)',
                                    margin: '0 0 12px',
                                }}>
                                    {currentWeekData.status === 'reviewed'
                                        ? t('coachReviewedYourWeek')
                                        : t('submittedAwaitingReview')}
                                </p>
                            )}

                            {/* Coach feedback note — show whenever any prior week has been
                                reviewed, regardless of THIS week's status. The user wants
                                their last received feedback visible while they're working
                                on the current week. */}
                            {latestReviewedWeek?.coachFeedback && (
                                <p style={{
                                    fontFamily: bzt.body, fontSize: 13, fontStyle: 'italic',
                                    color: 'rgba(255,255,255,0.92)',
                                    margin: '0 0 14px',
                                    overflow: 'hidden', display: '-webkit-box',
                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                                    paddingLeft: 14, position: 'relative',
                                }}>
                                    {/* Quote mark instead of side-stripe (impeccable rule: no side stripes) */}
                                    <span aria-hidden style={{
                                        position: 'absolute', left: 0, top: -4,
                                        fontSize: 22, color: 'rgb(var(--primary))',
                                        fontFamily: bzt.display, lineHeight: 1,
                                    }}>“</span>
                                    {latestReviewedWeek.coachFeedback}
                                </p>
                            )}

                            {/* CTA — combines submit/view with read-feedback when both
                                actions are useful at once. Center dot acts as a separator.
                                Pulses softly when status === pending so the user has a
                                visual cue that they need to submit (no anxiety; just a heartbeat). */}
                            <span
                                className={currentWeekData.status === 'pending' ? 'bzt-pulse-soft' : ''}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '8px 18px', borderRadius: 999,
                                    background: goldGradient, color: bzt.onPrimaryFixed,
                                    fontFamily: bzt.body, fontSize: 12, fontWeight: 600,
                                    letterSpacing: '0.04em', textTransform: 'uppercase',
                                }}
                            >
                                <Calendar size={14} />
                                {currentWeekData.status === 'reviewed' ? (
                                    // Already reviewed — coach already gave feedback for THIS week
                                    t('readCta')
                                ) : currentWeekData.status === 'submitted' ? (
                                    // Awaiting review — view what was submitted, plus optionally read prior feedback
                                    latestReviewedWeek?.coachFeedback
                                        ? <>{t('viewCheckIn')} <span style={{ opacity: 0.7 }}>·</span> {t('readCta')}</>
                                        : t('viewCheckIn')
                                ) : (
                                    // Pending — submit this week, plus read prior feedback if it exists
                                    latestReviewedWeek?.coachFeedback
                                        ? <>{t('submitThisWeekCta')} <span style={{ opacity: 0.7 }}>·</span> {t('readCta')}</>
                                        : t('submitThisWeekCta')
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Workout — what to train today. */}
            <div style={{ marginBottom: 16 }}>
                <TodayWorkoutCard
                    activeProgram={activeProgram}
                    getTodaysDay={getTodaysDay}
                    todaysDayNumber={todaysDayNumber}
                    onNavigate={navigate}
                />
            </div>

            {/* Today's Diet — what to eat today. */}
            <div style={{ marginBottom: 32 }}>
                <TodayDietCard
                    dietProfile={user?.dietProfile}
                    assignedDietId={assignedDietId}
                    assignedSnapshot={assignedDietSnapshot}
                    onNavigate={navigate}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 2 — YOUR PROGRESS
                See how the work is paying off.
            ════════════════════════════════════════════════ */}
            <SectionHeader
                eyebrow="Step 2"
                title="Your progress"
                subtitle="Streak, weight trend, and where you rank — your numbers at a glance."
            />

            {/* Combined week status panel — calendar + streak ring + level + rank. */}
            <div style={{ marginBottom: 16 }}>
                <WeekStatusPanel
                    uid={user?.id}
                    score={xp}
                    currentStreak={dailyStreak}
                    bestStreak={bestStreak}
                    logCount={weeks.filter(w => w.status === 'submitted' || w.status === 'reviewed').length}
                    loggedDates={loggedDates}
                    onNavigate={navigate}
                />
            </div>

            {/* Progress CTA — chart + caveman "what's inside" preview. */}
            <div style={{ marginBottom: 32 }}>
                <ProgressCTA
                    onNavigate={navigate}
                    weightHistory={weeks
                        .map(w => (w.dailyEntries ?? []).filter(e => typeof e.weight === 'number' && (e.weight as number) > 0).slice(-1)[0]?.weight as number | undefined)
                        .filter((n): n is number => typeof n === 'number')}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 3 — GROW & CONNECT
                Education + the community feed, last so they
                don't distract from the user's own program first.
            ════════════════════════════════════════════════ */}
            <SectionHeader
                eyebrow="Step 3"
                title="Grow & connect"
                subtitle="Keep learning and see what the rest of the team is doing this week."
            />

            <div style={{ marginBottom: 16 }}>
                <ContinueAcademyCard courses={courses} userProgress={userProgress} lessons={lessons} loadLessons={loadLessons} onNavigate={navigate} />
            </div>

            <CommunityActivityCard posts={posts.slice(0, 3)} onNavigate={navigate} />
        </div>
    );
};
