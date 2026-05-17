import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { DailyTrackingTable } from '../components/checkin/DailyTrackingTable';
import { ProgressCharts } from '../components/dashboard/ProgressCharts';
import { ClientInfoPanel } from '../components/checkin/ClientInfoPanel';
import { CheckInCompare } from '../components/checkin/CheckInCompare';
import { WorkoutWizard } from '../components/workouts/WorkoutWizard';
import { AssignDietPicker } from '../components/diets/AssignDietPicker';
import { dietPlans } from '../data/diets';
import { tPlanName } from '../lib/dietTranslations';
import type { UserActiveProgram } from '../types';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Target,
    TrendingUp,
    History,
    FileText,
    Dumbbell,
    X,
    Camera,
    AlertCircle,
    Loader2,
    Plus,
    Activity,
    Info,
    Shield,
    Zap,
    Flame,
    Apple,
    MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';
import { MacroTarget } from '../types';

export const CoachReview = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { clients, getClientWeeks, updateWeek, updateClient, cascadeTargets, createProgram, advanceWeek, extendProgram } = useData();
    const { t, lang } = useLanguage();

    const client = clients.find(c => c.id === clientId);
    const weeks = client ? getClientWeeks(client.id) : [];

    const weekNeedingReview = weeks.find(w => w.status === 'submitted');
    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(weekNeedingReview?.weekNumber || client?.currentWeek || 0);

    const isProgramCreation = client?.currentWeek === 0;
    const weekData = weeks.find(w => w.weekNumber === selectedWeekNum);

    const [feedback, setFeedback] = useState('');
    const [changeTargets, setChangeTargets] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showProgramWizard, setShowProgramWizard] = useState(false);
    const [showDietPicker, setShowDietPicker] = useState(false);
    const [clientDietId, setClientDietId] = useState<string | undefined>(undefined);
    const [clientProgram, setClientProgram] = useState<UserActiveProgram | null>(null);

    const [newHighCarb, setNewHighCarb] = useState<MacroTarget>({ carbs: 250, protein: 180, fats: 60, calories: 2260 });
    const [newLowCarb, setNewLowCarb] = useState<MacroTarget>({ carbs: 120, protein: 180, fats: 80, calories: 1920 });
    const [newCardio, setNewCardio] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [additionalWeeks, setAdditionalWeeks] = useState(4);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (weekData) {
            setFeedback(weekData.coachFeedback || '');
            setNewHighCarb({ ...weekData.activeTargets.highCarb });
            setNewLowCarb({ ...weekData.activeTargets.lowCarb });
            setNewCardio(weekData.activeTargets.cardio ?? 0);
            setChangeTargets(false);
        }
    }, [weekData]);

    // Live subscription to the client's active training program (whatever
    // the coach assigns here also shows up on the client's dashboard via
    // useActiveProgram, which reads userPrograms/{uid}).
    useEffect(() => {
        if (!client?.userId) {
            setClientProgram(null);
            return;
        }
        const ref = doc(db, 'userPrograms', client.userId);
        const unsub = onSnapshot(ref, (snap) => {
            setClientProgram(snap.exists() ? (snap.data() as UserActiveProgram) : null);
        }, () => setClientProgram(null));
        return unsub;
    }, [client?.userId]);

    // Live-read the client's currently-assigned diet so the picker can
    // highlight it as "Current" and we can show a swap CTA when reviewing
    // a weekly check-in.
    useEffect(() => {
        if (!client?.userId) {
            setClientDietId(undefined);
            return;
        }
        const ref = doc(db, 'userDiets', client.userId);
        const unsub = onSnapshot(ref, (snap) => {
            setClientDietId(snap.exists() ? (snap.data() as { dietId?: string }).dietId : undefined);
        }, () => setClientDietId(undefined));
        return unsub;
    }, [client?.userId]);

    const removeAssignedProgram = async () => {
        if (!client?.userId) return;
        try {
            await deleteDoc(doc(db, 'userPrograms', client.userId));
            showToast('success', 'Program removed.');
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('Remove program failed:', err);
            showToast('error', err?.message ?? 'Failed to remove program.');
        }
    };

    if (!client) {
        return <div className="text-on-surface p-8 font-body">{t('clientNotFound')}</div>;
    }

    const handleAction = async () => {
        setIsSubmitting(true);
        try {
            if (isProgramCreation) {
                await createProgram(client.id, { highCarb: newHighCarb, lowCarb: newLowCarb, cardio: newCardio });
                showToast('success', `Program created! ${client.name} is now on Week 1.`);
                setTimeout(() => navigate('/'), 1000);
            } else if (weekData) {
                await updateWeek(weekData.id, { coachFeedback: feedback, status: 'reviewed' });

                if (changeTargets) {
                    await cascadeTargets(client.id, weekData.weekNumber + 1, { highCarb: newHighCarb, lowCarb: newLowCarb, cardio: newCardio });
                }

                await advanceWeek(client.id, weekData.weekNumber);
                await updateClient(client.id, { needsReview: false });

                showToast('success', changeTargets
                    ? `Week ${weekData.weekNumber} reviewed. Targets updated from Week ${weekData.weekNumber + 1} onwards.`
                    : `Week ${weekData.weekNumber} reviewed. Client advanced to Week ${weekData.weekNumber + 1}.`
                );
                setTimeout(() => navigate('/'), 1000);
            }
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('Coach review action failed:', err);
            showToast('error', err?.message ?? t('actionFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExtendProgram = async () => {
        if (!client) return;
        setIsExtending(true);
        try {
            await extendProgram(client.id, additionalWeeks, { highCarb: newHighCarb, lowCarb: newLowCarb, cardio: newCardio });
            showToast('success', `Program extended by ${additionalWeeks} weeks!`);
            setChangeTargets(false);
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('Extend program failed:', err);
            showToast('error', err?.message ?? 'Failed to extend program.');
        } finally {
            setIsExtending(false);
        }
    };

    const calculateCals = (m: MacroTarget) => (m.carbs * 4) + (m.protein * 4) + (m.fats * 9);

    const updateTarget = (type: 'high' | 'low', field: keyof MacroTarget, value: number) => {
        if (type === 'high') {
            const updated = { ...newHighCarb, [field]: value };
            updated.calories = calculateCals(updated);
            setNewHighCarb(updated);
        } else {
            const updated = { ...newLowCarb, [field]: value };
            updated.calories = calculateCals(updated);
            setNewLowCarb(updated);
        }
    };

    return (
        <>
        {toast && (
            <div className={clsx(
                "fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-top-2 duration-300",
                toast.type === 'success'
                    ? 'bg-surface-container border border-emerald-500/20 text-emerald-400'
                    : 'bg-surface-container border border-red-500/20 text-red-400'
            )}>
                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="font-body text-sm">{toast.msg}</span>
            </div>
        )}
        <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-500">

            {/* ── Editorial Header ── */}
            {/* Will be rendered below; this comment kept for grep continuity. */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-low rounded-2xl p-6 ghost-border">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="hover:bg-surface-container-highest p-3 rounded-full text-on-surface/50 hover:text-primary transition-colors">
                        <ChevronLeft />
                    </button>
                    <div>
                        <p className="text-primary font-label uppercase tracking-[0.3em] text-[10px] font-bold mb-1">{isProgramCreation ? t('programCreation') : t('coachReviewTitle')}</p>
                        <h1 className="text-3xl font-headline font-extrabold text-on-surface flex items-center gap-3 flex-wrap">
                            {client.name}
                            {!isProgramCreation && <span className="px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest text-on-surface/50 border border-outline-variant/30">{t('week')} {selectedWeekNum}</span>}
                            {isProgramCreation && <span className="px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">{t('intakeDataLabel')}</span>}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Message client — opens Messages page with this client
                        already selected via `?to=<userId>`. Visible during
                        program-creation too because that's exactly when a
                        coach often needs to ask the client about their
                        intake answers. */}
                    {client.userId && (
                        <button
                            onClick={() => navigate(`/messages?to=${client.userId}`)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 transition-colors text-sm font-headline font-bold"
                            title={`Message ${client.name}`}
                        >
                            <MessageSquare size={16} />
                            <span className="hidden sm:inline">{t('messageClient') ?? 'Message client'}</span>
                        </button>
                    )}

                    {!isProgramCreation && (
                        <div className="flex items-center gap-1 bg-surface-container-highest/50 rounded-full p-1">
                            <button
                                onClick={() => setSelectedWeekNum(prev => Math.max(0, prev - 1))}
                                disabled={selectedWeekNum <= 0}
                                className="p-2.5 rounded-full hover:bg-surface-container-highest text-on-surface/50 hover:text-primary disabled:opacity-20 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="font-headline font-bold text-on-surface min-w-[120px] text-center text-sm">
                                {selectedWeekNum === 0 ? t('intakeWeek') : `${t('week')} ${selectedWeekNum}`}
                            </span>
                            <button
                                onClick={() => setSelectedWeekNum(prev => Math.min(client.programLength, prev + 1))}
                                disabled={selectedWeekNum >= client.programLength}
                                className="p-2.5 rounded-full hover:bg-surface-container-highest text-on-surface/50 hover:text-primary disabled:opacity-20 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Prominent client-info CTA ── */}
            <button
                onClick={() => setShowInfo(true)}
                className="w-full flex items-center justify-between gap-4 bg-surface-container-low hover:bg-surface-container ghost-border rounded-2xl p-4 md:p-5 transition-colors group active:scale-[0.99]"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Info size={20} />
                    </div>
                    <div className="text-start min-w-0">
                        <p className="font-headline font-bold text-on-surface text-base md:text-lg leading-tight truncate">
                            {t('clientInfoCtaTitle') ?? 'View client overall info'}
                        </p>
                        <p className="text-[11px] md:text-xs text-on-surface-variant truncate">
                            {t('clientInfoCtaDesc') ?? 'Personal info, measurements, history, photos & reports'}
                        </p>
                    </div>
                </div>
                <span className="text-primary text-[10px] font-label font-bold uppercase tracking-widest shrink-0 group-hover:translate-x-1 transition-transform">
                    {t('view')} →
                </span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── LEFT COLUMN - Client Data ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Week 0 Intake VIEW */}
                    {isProgramCreation ? (
                        <div className="bg-surface-container-low rounded-2xl p-8 ghost-border space-y-8">
                            <h2 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FileText size={20} />
                                </div>
                                {t('clientSummary')}
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-1">{t('startingWeight')}</div>
                                    <div className="text-2xl font-headline font-bold text-on-surface">{client.intakeData?.startingWeight || '--'} <span className="text-sm font-normal text-on-surface/40">kg</span></div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-1">{t('height')}</div>
                                    <div className="text-2xl font-headline font-bold text-on-surface">{client.intakeData?.height || '--'} <span className="text-sm font-normal text-on-surface/40">cm</span></div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-1">{t('age')}</div>
                                    <div className="text-2xl font-headline font-bold text-on-surface">
                                        {client.birthdate
                                            ? (() => {
                                                const birth = new Date(client.birthdate);
                                                const today = new Date();
                                                let age = today.getFullYear() - birth.getFullYear();
                                                const m = today.getMonth() - birth.getMonth();
                                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                                return `${age}`;
                                            })()
                                            : '--'} <span className="text-sm font-normal text-on-surface/40">{client.birthdate ? t('yearsOld') : ''}</span>
                                    </div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-1">{t('gender')}</div>
                                    <div className="text-2xl font-headline font-bold text-on-surface capitalize">
                                        {client.gender ? `${client.gender === 'male' ? '♂️' : '♀️'} ${t(client.gender as any)}` : '--'}
                                    </div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-1">{t('goal')}</div>
                                    <div className="text-2xl font-headline font-bold text-on-surface capitalize">{client.intakeData?.goal?.replace('_', ' ') || '--'}</div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-1">{t('fitnessLevel')}</div>
                                    <div className="text-xl font-headline font-bold text-on-surface">
                                        {client.fitnessLevel === 'beginner' && `🟢 ${t('beginner')}`}
                                        {client.fitnessLevel === 'intermediate' && `🟡 ${t('intermediate')}`}
                                        {client.fitnessLevel === 'pro_competitions' && `🔴 ${t('proCompetitions')}`}
                                        {!client.fitnessLevel && '--'}
                                    </div>
                                </div>
                            </div>

                            {/* Onboarding Photos */}
                            {(() => {
                                // Get photos from Week 0 check-in doc, or fall back to intakeData
                                const w0 = weeks.find(w => w.weekNumber === 0);
                                const photoMap: Record<string, string | undefined> = {
                                    front: w0?.photos?.front || client.intakeData?.frontPhoto || undefined,
                                    side: w0?.photos?.side || client.intakeData?.sidePhoto || undefined,
                                    back: w0?.photos?.back || client.intakeData?.backPhoto || undefined,
                                };
                                const hasPhotos = Object.values(photoMap).some(Boolean);

                                return (
                                    <div className="bg-surface-container-lowest rounded-xl p-8 ghost-border">
                                        <h3 className="font-headline font-bold text-on-surface mb-6 flex items-center gap-3 text-lg">
                                            <Camera size={20} className="text-primary" /> {t('photos')}
                                        </h3>
                                        {hasPhotos ? (
                                            <div className="grid grid-cols-3 gap-4">
                                                {(['front', 'side', 'back'] as const).map(angle => (
                                                    photoMap[angle] ? (
                                                        <div key={angle} className="relative">
                                                            <img
                                                                src={photoMap[angle]}
                                                                alt={angle}
                                                                className="aspect-[3/4] w-full rounded-xl object-cover ghost-border"
                                                            />
                                                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/80 backdrop-blur-sm text-[10px] font-label uppercase tracking-widest text-on-surface/60 capitalize">{angle}</div>
                                                        </div>
                                                    ) : (
                                                        <div key={angle} className="aspect-[3/4] bg-surface-container rounded-xl border border-dashed border-outline-variant/30 flex items-center justify-center text-on-surface/30 font-label text-[10px] uppercase tracking-widest text-center px-4">
                                                            {angle} — {t('notUploadedLabel')}
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-on-surface/40 font-body text-sm">
                                                {t('noPhotosDuringOnboarding')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>
                    ) : (
                        <div className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                            <div className="flex justify-between mb-8">
                                <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <History size={20} />
                                    </div>
                                    {t('dailyEntries')}
                                </h3>
                            </div>
                            {weekData && <DailyTrackingTable entries={weekData.dailyEntries} readOnly={true} onChange={() => { }} />}
                        </div>
                    )}

                    {/* Client Photos */}
                    {!isProgramCreation && weekData?.photos && Object.values(weekData.photos).some(Boolean) && (
                        <div className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                            <h3 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Camera size={20} />
                                </div>
                                {t('progressPhotos')}
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                {(['front', 'side', 'back', 'face'] as const).map(angle => (
                                    weekData.photos?.[angle] ? (
                                        <div key={angle} className="relative">
                                            <img
                                                src={weekData.photos[angle]}
                                                alt={angle}
                                                className="aspect-[3/4] w-full rounded-xl object-cover ghost-border"
                                            />
                                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/80 backdrop-blur-sm text-[10px] font-label uppercase tracking-widest text-on-surface/60 capitalize">{angle}</div>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Charts */}
                    {!isProgramCreation && <ProgressCharts weeks={weeks} />}

                    {/* Client Weekly Metrics */}
                    {!isProgramCreation && weekData && (
                        <div className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                            <h3 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Activity size={20} />
                                </div>
                                {t('weeklySummary')}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border text-center">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-2 flex items-center justify-center gap-1.5"><Shield size={12} className="text-blue-400" /> {t('strengthScale')}</div>
                                    <div className="text-2xl font-headline font-bold text-blue-400">{weekData.strengthScale ?? '--'}<span className="text-sm font-normal text-on-surface/40">/10</span></div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border text-center">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-2 flex items-center justify-center gap-1.5"><Target size={12} className="text-primary" /> {t('hungerScale')}</div>
                                    <div className="text-2xl font-headline font-bold text-primary">{weekData.hungerScale ?? '--'}<span className="text-sm font-normal text-on-surface/40">/10</span></div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border text-center">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-2 flex items-center justify-center gap-1.5"><Zap size={12} className="text-yellow-400" /> {t('energyScale')}</div>
                                    <div className="text-2xl font-headline font-bold text-yellow-400">{weekData.energyScale ?? '--'}<span className="text-sm font-normal text-on-surface/40">/10</span></div>
                                </div>
                                <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border text-center">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/50 mb-2 flex items-center justify-center gap-1.5"><Flame size={12} className="text-orange-400" /> {t('cardioCalories')}</div>
                                    <div className="text-2xl font-headline font-bold text-orange-400">{weekData.cardioCalories ?? 0}<span className="text-sm font-normal text-on-surface/40"> kcal</span></div>
                                </div>
                            </div>
                            {weekData.weeklySummary && (
                                <div className="mt-6 bg-surface-container rounded-xl p-6 border-l-4 border-outline-variant/50 relative overflow-hidden">
                                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-3">{t('weeklyReflection')}</div>
                                    <p className="text-on-surface/90 text-sm leading-relaxed font-body">"{weekData.weeklySummary}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN - Coach Actions ── */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Target Adjustment / Program Builder */}
                    <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-headline font-bold text-on-surface flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    {isProgramCreation ? <Dumbbell size={16} /> : <Target size={16} />}
                                </div>
                                {isProgramCreation ? t('setInitialTargets') : t('adjustTargets')}
                            </h3>

                            {!isProgramCreation && (
                                <label className="flex items-center gap-2 cursor-pointer bg-surface-container-lowest px-3 py-1.5 rounded-full ghost-border">
                                    <input
                                        type="checkbox"
                                        checked={changeTargets}
                                        onChange={(e) => setChangeTargets(e.target.checked)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">{t('changeQuestion')}</span>
                                </label>
                            )}
                        </div>

                        {/* Program Builder / Target Inputs */}
                        <div className={`space-y-6 transition-all duration-300 ${(isProgramCreation || changeTargets) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            {/* High Carb Inputs */}
                            <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                <div className="flex justify-between font-label text-[10px] uppercase tracking-widest text-on-surface/50 font-bold mb-4">
                                    {t('highCarb')} {t('adjustTargets')}
                                    <span className="text-primary">{newHighCarb.calories} kcal</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {['carbs', 'protein', 'fats'].map((macro) => (
                                        <div key={macro}>
                                            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1 block text-center">{macro.charAt(0)}</label>
                                            <input
                                                type="number"
                                                value={newHighCarb[macro as keyof MacroTarget]}
                                                onChange={(e) => updateTarget('high', macro as keyof MacroTarget, parseInt(e.target.value))}
                                                className="w-full bg-surface-container rounded-lg px-2 py-2 text-center text-sm font-headline font-bold text-on-surface border-none outline-none focus:ring-1 focus:ring-primary/30"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Low Carb Inputs */}
                            <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                <div className="flex justify-between font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-4">
                                    {t('lowCarb')} {t('adjustTargets')}
                                    <span>{newLowCarb.calories} kcal</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {['carbs', 'protein', 'fats'].map((macro) => (
                                        <div key={macro}>
                                            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1 block text-center">{macro.charAt(0)}</label>
                                            <input
                                                type="number"
                                                value={newLowCarb[macro as keyof MacroTarget]}
                                                onChange={(e) => updateTarget('low', macro as keyof MacroTarget, parseInt(e.target.value))}
                                                className="w-full bg-surface-container rounded-lg px-2 py-2 text-center text-sm font-headline font-bold text-on-surface border-none outline-none focus:ring-1 focus:ring-primary/30"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cardio Target */}
                            <div className="bg-surface-container-lowest rounded-xl p-5 ghost-border">
                                <div className="flex justify-between items-center font-label text-[10px] uppercase tracking-widest text-on-surface/50 font-bold mb-4">
                                    <span className="flex items-center gap-1.5">
                                        <Flame size={12} className="text-orange-400" />
                                        {t('cardioTargetLabel')} {t('adjustTargets')}
                                    </span>
                                    <span className="text-orange-400">{newCardio} {t('kcalUnit')}</span>
                                </div>
                                <input
                                    type="number"
                                    min={0}
                                    max={5000}
                                    value={newCardio}
                                    onChange={(e) => setNewCardio(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-surface-container rounded-lg px-3 py-2.5 text-center text-base font-headline font-bold text-on-surface border-none outline-none focus:ring-1 focus:ring-primary/30"
                                />
                                <p className="text-[10px] font-body text-on-surface/40 mt-2 text-center">
                                    {t('cardioTargetHint')}
                                </p>
                            </div>
                        </div>

                        {changeTargets && !isProgramCreation && (
                            <div className="mt-6 p-4 bg-primary/5 border border-primary/15 rounded-xl flex items-start gap-3 text-sm font-body text-primary">
                                <TrendingUp size={16} className="mt-0.5 shrink-0" />
                                {t('cascadeNote')} ({t('week')} {(weekData?.weekNumber || 0) + 1})
                            </div>
                        )}

                        {isProgramCreation && (
                            <div className="mt-6 p-4 bg-primary/5 border border-primary/15 rounded-xl flex items-start gap-3 text-sm font-body text-primary">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                {t('generateWeeksNote')}
                            </div>
                        )}

                    </div>

                    {/* Feedback & Actions */}
                    <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                        {!isProgramCreation && (
                            <>
                                <h3 className="font-headline font-bold text-on-surface mb-4 text-sm uppercase tracking-wider">{t('coachFeedback')}</h3>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={t('writeYourFeedback')}
                                    className="w-full h-32 bg-surface-container-lowest rounded-xl p-4 text-on-surface placeholder-on-surface/30 resize-none border-none outline-none focus:ring-1 focus:ring-primary/30 font-body text-sm transition-all mb-6"
                                />
                            </>
                        )}

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleAction}
                                disabled={isSubmitting}
                                className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                {isProgramCreation ? t('createProgram') : t('markReviewed')}
                            </button>
                            <button className="w-full py-4 rounded-xl text-on-surface/60 hover:text-on-surface bg-surface-container-lowest hover:bg-surface-container transition-colors font-label uppercase tracking-widest text-[10px] font-bold">
                                {t('saveProgress')}
                            </button>
                        </div>
                    </div>

                    {/* Training Program Assignment — full program, lands on the client's
                        dashboard via useActiveProgram. */}
                    {!isProgramCreation && weekData && client.userId && (
                        <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                            <h3 className="font-headline font-bold text-on-surface flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface/60">
                                    <Dumbbell size={16} />
                                </div>
                                {t('assignWorkouts')}
                            </h3>

                            {clientProgram ? (
                                <div className="space-y-3">
                                    <div className="bg-surface-container-lowest p-4 rounded-xl ghost-border">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-on-surface font-headline font-bold text-sm truncate">{clientProgram.programName}</p>
                                                <p className="text-on-surface/40 text-[10px] font-label uppercase tracking-widest mt-1">
                                                    {clientProgram.split} · {clientProgram.difficulty} · {clientProgram.goal.replace('_', ' ')}
                                                </p>
                                                <p className="text-on-surface/60 text-xs font-body mt-2">
                                                    Cycle {clientProgram.currentCycle} · Day {(clientProgram.completedDays.length % clientProgram.rotation.length) + 1} of {clientProgram.rotation.length}
                                                    {clientProgram.assignedByCoach && <span className="text-primary ms-2">· Coach-assigned</span>}
                                                </p>
                                            </div>
                                            <button
                                                onClick={removeAssignedProgram}
                                                className="text-red-400 hover:text-red-300 p-2 bg-red-400/10 rounded-lg transition-colors shrink-0"
                                                title="Remove program"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowProgramWizard(true)}
                                        className="w-full px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-bold border border-outline-variant/30 hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Dumbbell size={16} />
                                        Replace program
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-on-surface/40 text-sm font-body text-center py-6 border border-dashed border-outline-variant/30 rounded-xl">
                                        {t('noWorkoutsAssigned')}
                                    </p>
                                    <button
                                        onClick={() => setShowProgramWizard(true)}
                                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                    >
                                        <Dumbbell size={16} />
                                        Assign Training Program
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Diet assignment ─────────────────────────────────
                        Coach picks a plan from the catalog and writes it to
                        userDiets/{client.userId}. Shown as a sibling of the
                        program block so weekly-check-in adjustments are one
                        click away — when signals say "decrease carbs", the
                        coach swaps to the next-tier-down plan here. */}
                    {client.userId && (
                        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 ghost-border">
                            <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 mb-4">
                                <Apple size={18} className="text-primary" />
                                {t('dietPlan')}
                            </h3>
                            {clientDietId ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-primary mb-1">
                                                {t('current')}
                                            </div>
                                            <div className="font-headline font-bold text-on-surface truncate">
                                                {tPlanName(dietPlans.find(p => p.id === clientDietId)?.name ?? clientDietId, lang, t('mealsWord'))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDietPicker(true)}
                                        className="w-full px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-bold border border-outline-variant/30 hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Apple size={16} />
                                        {t('changeDiet')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-on-surface/40 text-sm font-body text-center py-6 border border-dashed border-outline-variant/30 rounded-xl">
                                        {t('noDietAssigned')}
                                    </p>
                                    <button
                                        onClick={() => setShowDietPicker(true)}
                                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                    >
                                        <Apple size={16} />
                                        {t('assignDiet')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showDietPicker && client.userId && (
                        <AssignDietPicker
                            clientUserId={client.userId}
                            clientName={client.name}
                            currentDietId={clientDietId}
                            onClose={() => setShowDietPicker(false)}
                            onAssigned={() => showToast('success', `Diet assigned to ${client.name}.`)}
                        />
                    )}

                    {/* Program assignment modal — embeds the same WorkoutWizard the
                        client uses, but writes to the client's userPrograms doc. */}
                    {showProgramWizard && client.userId && (
                        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto">
                            <div className="bg-surface-container-low rounded-2xl ghost-border shadow-2xl max-w-3xl w-full my-8">
                                <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
                                    <h2 className="font-headline font-bold text-on-surface text-lg">
                                        Assign program to {client.name}
                                    </h2>
                                    <button
                                        onClick={() => setShowProgramWizard(false)}
                                        className="text-on-surface-variant hover:text-on-surface p-2"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4 md:p-6">
                                    <WorkoutWizard
                                        targetUserId={client.userId}
                                        onAssigned={() => {
                                            setTimeout(() => setShowProgramWizard(false), 1500);
                                            showToast('success', `Program assigned to ${client.name}.`);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Extend Program Section */}
                    {!isProgramCreation && client.programLength && selectedWeekNum === client.programLength && (
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                            <h3 className="font-headline font-bold text-primary mb-4 flex items-center gap-2">
                                <Plus size={20} /> Extend Program
                            </h3>
                            <p className="text-sm text-on-surface/70 font-body mb-6">
                                This client has reached the final week of their current program ({client.programLength} weeks). Add more weeks using the targets defined above.
                            </p>
                            <div className="flex gap-3 mb-6">
                                {[4, 8, 12].map(weeks => (
                                    <button
                                        key={weeks}
                                        onClick={() => setAdditionalWeeks(weeks)}
                                        className={clsx(
                                            "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                                            additionalWeeks === weeks
                                                ? "bg-primary text-on-primary"
                                                : "bg-surface-container text-on-surface/60 hover:bg-surface-container-high hover:text-on-surface"
                                        )}
                                    >
                                        +{weeks} Weeks
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleExtendProgram}
                                disabled={isExtending}
                                className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isExtending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                Extend to {client.programLength + additionalWeeks} Weeks
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Compare check-ins — visible whenever there are ≥2 weeks */}
            {!isProgramCreation && weeks.filter(w => w.weekNumber > 0).length >= 2 && (
                <CheckInCompare weeks={weeks} />
            )}
        </div>

        {/* Info panel modal */}
        {showInfo && client && (
            <ClientInfoPanel client={client} weeks={weeks} onClose={() => setShowInfo(false)} />
        )}
        </>
    );
};
