import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import { useAcademy } from '../../context/AcademyContext';
import { useCommunity } from '../../context/CommunityContext';
import { levelFromScore, levelProgress } from '../../lib/activityScore';
import {
    t as bzt, goldGradient,
    Card, Eyebrow, MetricCard,
    ContinueAcademyCard, TodayWorkoutCard, CommunityActivityCard, ProgressCTA, YourStandingCard,
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

export const ClientDashboard = () => {
    const { user } = useAuth();
    const { t: tStrict } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;
    const { clients, getClientWeeks, completeOnboarding, createProgram, uploadPhoto } = useData();
    const navigate = useNavigate();
    const { activeProgram, getTodaysDay, todaysDayNumber } = useActiveProgram();
    const { courses, userProgress } = useAcademy();
    const { posts } = useCommunity();

    const client = clients.find(c => c.userId === user?.id);
    // Derive weeks early so hooks aren't called conditionally below
    const allWeeks = useMemo(() => client ? getClientWeeks(client.id) : [], [client, getClientWeeks]);

    // Onboarding form state
    const [formData, setFormData] = useState({
        startingWeight: '',
        height: '',
        goal: 'fat_loss',
        activityLevel: 'sedentary',
        dietHistory: '',
        injuries: '',
        birthdate: '',
        gender: '',
        fitnessLevel: 'beginner',
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
        highCarb: { carbs: 280, protein: 180, fats: 60, calories: 2380 },
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

    const handleIntakeSubmit = () => {
        if (client && formData.startingWeight && formData.height && formData.birthdate && formData.gender) {
            completeOnboarding(client.id, {
                ...formData,
                // store photo URLs in intake data so coach can see them
                frontPhoto: photoUrls.front ?? '',
                sidePhoto: photoUrls.side ?? '',
                backPhoto: photoUrls.back ?? '',
            }, photoUrls);
            createProgram(client.id, defaultTargets);
        } else {
            alert(t('fillRequired'));
        }
    };

    if (!client) {
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

                    {/* Submit */}
                    <div className="pt-8 border-t border-outline-variant/30">
                        <button
                            onClick={handleIntakeSubmit}
                            disabled={!formData.startingWeight || !formData.height || !formData.birthdate || !formData.gender}
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

    const lastWeight = weeks[currentWeekIndex - 1]?.minWeight;

    // Real activity score + streak from the user doc
    const xp = user?.activityScore ?? 0;
    const level = levelFromScore(xp);
    const xpPct = levelProgress(xp);
    const dailyStreak = user?.streak?.current ?? 0;
    const bestStreak = user?.streak?.best ?? 0;

    const firstName = client.name.split(' ')[0];
    const initials = client.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'ME';

    return (
        <div style={{ fontFamily: bzt.body, color: bzt.onSurface, padding: '8px 0 40px' }}>
            {/* 1. Coach feedback banner */}
            {latestReviewedWeek && (
                <Card
                    onClick={() => navigate('/checkin')}
                    style={{
                        marginBottom: 24,
                        background: `linear-gradient(135deg, rgb(var(--primary) / 0.08), ${bzt.surfaceContainerLow})`,
                        border: `1px solid ${bzt.outline}`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: `rgb(var(--primary) / 0.15)`, border: `1px solid ${bzt.outline}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <MessageSquare size={20} style={{ color: bzt.primary }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                                fontFamily: bzt.display, fontSize: 18, fontWeight: 600,
                                color: bzt.onSurface, margin: 0, letterSpacing: '-0.01em',
                            }}>
                                {t('coachReviewedYourWeek')} {latestReviewedWeek.weekNumber}!
                            </h3>
                            <p style={{
                                fontFamily: bzt.body, fontSize: 13, color: bzt.onSurfaceVariant,
                                margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                "{latestReviewedWeek.coachFeedback}"
                            </p>
                        </div>
                        <span style={{
                            fontFamily: bzt.body, fontSize: 11, fontWeight: 600, color: bzt.primary,
                            textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0,
                        }}>{t('readCta')}</span>
                    </div>
                </Card>
            )}

            {/* 2. Header */}
            <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 24, marginBottom: 32, paddingLeft: 12,
            }}>
                <div style={{ maxWidth: 700 }}>
                    <Eyebrow>{t('biozackTeamCoaching')}</Eyebrow>
                    <h1 style={{
                        fontFamily: bzt.display, fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.03em',
                        color: bzt.onSurface, margin: '12px 0 0',
                    }}>
                        {t('welcomeBack')}{' '}
                        <span style={{
                            fontWeight: 600, background: goldGradient,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>{firstName}</span>
                    </h1>
                    <p style={{
                        fontFamily: bzt.body, fontSize: 14, color: bzt.onSurfaceVariant,
                        marginTop: 10, letterSpacing: '0.01em',
                    }}>
                        {t('week')} {client.currentWeek} {t('weekOfLabel')} {client.programLength}
                        {weekStreak > 0 ? ` · ${weekStreak} ${t('weekCheckInStreak')}` : ''}
                        {' · '}
                        {currentWeekData.status === 'pending'
                            ? t('checkInPendingStatus')
                            : currentWeekData.status === 'submitted'
                                ? t('awaitingReviewStatus')
                                : t('reviewedStatus')}
                    </p>
                </div>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: bzt.surfaceContainerHighest, border: `1px solid ${bzt.outline}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: bzt.display, fontSize: 18, fontWeight: 500,
                    color: bzt.primary, letterSpacing: '0.04em',
                }}>{initials}</div>
            </div>

            {/* 3. Stats row */}
            <div style={{
                display: 'grid', gap: 16, marginBottom: 24,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}>
                <MetricCard label={t('dailyStreakLabel') ?? 'Daily Streak'} value={dailyStreak} unit={t('daysUnit')} sub={dailyStreak > 0 ? `${t('bestPrefix')} ${bestStreak} ${t('daysUnit')}` : (t('logTodayToStart') ?? 'Log today to start')} hero />
                <MetricCard label={t('levelLabel') ?? 'Level'} value={level} sub={`${xp} ${t('xpUnit')} · ${xpPct}% ${t('xpToNext')}`} />
                <MetricCard label={t('lastWeightLabel') ?? 'Last Weight'} value={lastWeight ?? '--'} unit={t('kgUnit')} sub={lastWeight ? `${t('week')} ${currentWeekIndex}` : (t('noDataYet') ?? 'No data yet')} />
            </div>

            {/* 4. Weekly check-in (coach-specific) */}
            <div style={{ marginBottom: 24 }}>
                <Card variant="bright">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div>
                            <Eyebrow>{t('weeklyCheckInEyebrow')}</Eyebrow>
                            <h2 style={{
                                fontFamily: bzt.display, fontSize: 24, fontWeight: 500,
                                color: bzt.onSurface, margin: '8px 0 4px', letterSpacing: '-0.02em',
                            }}>
                                {t('weeklyCheckIn') || t('thisWeekTitle')}
                            </h2>
                            <p style={{ fontFamily: bzt.body, fontSize: 13, color: bzt.onSurfaceVariant, margin: 0 }}>
                                {t('week')} {client.currentWeek} ·{' '}
                                {currentWeekData.status === 'pending'
                                    ? t('pendingSubmission')
                                    : currentWeekData.status === 'submitted'
                                        ? t('submittedAwaitingReview')
                                        : t('reviewedStatus')}
                            </p>
                        </div>
                        {currentWeekData.status === 'pending' && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 8,
                                background: `rgb(var(--primary) / 0.10)`, border: `1px solid ${bzt.outline}`,
                                color: bzt.primary, fontFamily: bzt.body, fontSize: 11, fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                            }}>
                                <Clock size={13} /> {t('dueLabel')}
                            </div>
                        )}
                        {currentWeekData.status === 'submitted' && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 8,
                                background: bzt.surfaceContainer, border: `1px solid ${bzt.outlineVariant}`,
                                color: bzt.onSurfaceVariant, fontFamily: bzt.body, fontSize: 11, fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                            }}>
                                <CheckCircle2 size={13} /> {t('submittedLabel')}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/checkin')}
                        style={{
                            width: '100%', padding: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: bzt.body, fontSize: 13, fontWeight: 600,
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                            color: bzt.onPrimaryFixed, background: goldGradient,
                            border: 'none', borderRadius: 999, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgb(var(--primary) / 0.25)',
                        }}
                    >
                        <Calendar size={16} />
                        {currentWeekData.status === 'pending'
                            ? (t('updateDailyTracking') || t('submitThisWeekCta'))
                            : (t('viewCheckIn') || t('viewCheckInCta'))}
                    </button>
                </Card>
            </div>

            {/* 5. Continue Academy */}
            <div style={{ marginBottom: 24 }}>
                <ContinueAcademyCard courses={courses} userProgress={userProgress} onNavigate={navigate} />
            </div>

            {/* 6. Today's Workout */}
            <div style={{ marginBottom: 24 }}>
                <TodayWorkoutCard
                    activeProgram={activeProgram}
                    getTodaysDay={getTodaysDay}
                    todaysDayNumber={todaysDayNumber}
                    onNavigate={navigate}
                />
            </div>

            {/* 7. Your Standing (private rank widget) */}
            <div style={{ marginBottom: 24 }}>
                <YourStandingCard uid={user?.id} score={xp} onNavigate={navigate} />
            </div>
            {/* (clients are never coaches, so no role-split CTA shown) */}

            {/* 8. Community Activity */}
            <div style={{ marginBottom: 24 }}>
                <CommunityActivityCard posts={posts.slice(0, 3)} onNavigate={navigate} />
            </div>

            {/* 9. Progress CTA */}
            <ProgressCTA onNavigate={navigate} />
        </div>
    );
};
