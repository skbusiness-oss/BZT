import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { DayEntry, WeekPhotos } from '../types';
import { awardXp, XP_SOURCE } from '../lib/activityScore';
import { DailyTrackingTable } from '../components/checkin/DailyTrackingTable';
import { CheckInWizard } from '../components/checkin/CheckInWizard';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Send,
    Camera,
    MessageSquare,
    Target,
    AlertCircle,
    X,
    CheckCircle,
    Loader2,
    Flame,
    Zap,
    Shield,
    Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';

export const CheckIn = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { clients, getClientWeeks, updateWeek, updateClient, uploadPhoto } = useData();

    const client = clients.find(c => c.userId === user?.id);
    const weeks = client ? getClientWeeks(client.id) : [];

    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(client?.currentWeek || 1);
    const weekData = weeks.find(w => w.weekNumber === selectedWeekNum);

    const [entries, setEntries] = useState<DayEntry[]>([]);
    const [summary, setSummary] = useState('');
    const [hunger, setHunger] = useState(5);
    const [photos, setPhotos] = useState<WeekPhotos>({});
    const [photoModal, setPhotoModal] = useState<string | null>(null);
    const [uploadingAngle, setUploadingAngle] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [strength, setStrength] = useState(5);
    const [energy, setEnergy] = useState(5);
    const [cardioCalories, setCardioCalories] = useState(0);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (weekData) {
            setEntries(weekData.dailyEntries || Array.from({ length: 7 }, () => ({} as DayEntry)));
            setSummary(weekData.weeklySummary || '');
            setHunger(weekData.hungerScale || 5);
            setStrength(weekData.strengthScale || 5);
            setEnergy(weekData.energyScale || 5);
            setCardioCalories(weekData.cardioCalories || 0);
            setPhotos(weekData.photos || {});
        }
    }, [weekData]);

    if (!client || !weekData) return <div className="text-on-surface">{t('loading')}</div>;

    const isReadOnly = weekData.status === 'submitted' || weekData.status === 'reviewed' || weekData.status === 'locked';
    const targetMode = weekData.activeTargets.mode ?? 'cycling';
    const moderateTarget = weekData.activeTargets.moderateCarb ?? {
        carbs: Math.round((weekData.activeTargets.highCarb.carbs + weekData.activeTargets.lowCarb.carbs) / 2),
        protein: Math.round((weekData.activeTargets.highCarb.protein + weekData.activeTargets.lowCarb.protein) / 2),
        fats: Math.round((weekData.activeTargets.highCarb.fats + weekData.activeTargets.lowCarb.fats) / 2),
        calories: Math.round((weekData.activeTargets.highCarb.calories + weekData.activeTargets.lowCarb.calories) / 2),
    };

    const handleEntryChange = (index: number, field: keyof DayEntry, value: number) => {
        if (isReadOnly) return;
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const handleSave = async () => {
        try {
            await updateWeek(weekData.id, {
                dailyEntries: entries,
                weeklySummary: summary,
                hungerScale: hunger,
                strengthScale: strength,
                energyScale: energy,
                cardioCalories: cardioCalories,
                photos,
            });
            showToast('success', t('progressSaved'));
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('CheckIn save failed:', err);
            showToast('error', err?.message ?? t('failedToSave'));
        }
    };

    const handleSubmit = async () => {
        if (!client) return;
        // Photos are recommended but not blocking — a client who forgot
        // to take photos this week can still submit metrics + macros and
        // upload photos in a follow-up. Previously this was a hard gate
        // and was reported as "I can't submit". The coach still sees a
        // visible "no photos this week" cue in CoachReview because the
        // photos field is just absent on the doc.
        const missing: string[] = [];
        if (!photos.front) missing.push(t('front') ?? 'front');
        if (!photos.side) missing.push(t('side') ?? 'side');
        if (!photos.back) missing.push(t('back') ?? 'back');
        if (missing.length > 0) {
            const list = missing.join(', ');
            // Soft warning toast — leaves it on screen 5s so they have a
            // chance to add photos before tapping submit again, but does
            // not block the submission they're confirming.
            const ok = window.confirm(
                `${t('photosMissingWarn') ?? 'No photos uploaded for'}: ${list}.\n\n${t('photosMissingPrompt') ?? 'Submit anyway?'}`
            );
            if (!ok) return;
        }
        try {
            await updateWeek(weekData.id, {
                dailyEntries: entries,
                weeklySummary: summary,
                hungerScale: hunger,
                strengthScale: strength,
                energyScale: energy,
                cardioCalories: cardioCalories,
                photos,
                status: 'submitted'
            });
            await updateClient(client.id, { needsReview: true });
            // Idempotent — one WEEKLY_CHECKIN award per week submission.
            await awardXp(user?.id, XP_SOURCE.WEEKLY_CHECKIN, weekData.id);
            showToast('success', t('checkInSubmitted'));
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('CheckIn submit failed:', err);
            const msg = err?.code === 'permission-denied'
                ? (t('permissionDeniedSubmit') ?? 'Permission denied. Please refresh and try again.')
                : err?.message ?? t('submissionFailed') ?? 'Submission failed.';
            showToast('error', msg);
        }
    };

    // Upload photo to Firebase Storage and store the download URL
    const handlePhotoUpload = async (angle: keyof WeekPhotos, file: File) => {
        if (!user) return;
        setUploadingAngle(angle);
        try {
            const downloadUrl = await uploadPhoto(file, user.id, selectedWeekNum);
            setPhotos(prev => ({ ...prev, [angle]: downloadUrl }));
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('Photo upload failed:', err);
            const msg = err?.code === 'storage/unauthorized'
                ? (t('photoUploadUnauthorized') ?? 'Permission denied. Sign in again or check the file type.')
                : err?.message ?? t('photoUploadFailed') ?? 'Photo upload failed.';
            showToast('error', msg);
        } finally {
            setUploadingAngle(null);
        }
    };

    const removePhoto = (angle: keyof WeekPhotos) => {
        setPhotos(prev => { const next = { ...prev }; delete next[angle]; return next; });
    };

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className={clsx(
                    "fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-300",
                    toast.type === 'success'
                        ? 'bg-surface-container border border-emerald-500/20 text-emerald-400'
                        : 'bg-surface-container border border-red-500/20 text-red-400'
                )}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="font-body text-sm">{toast.msg}</span>
                </div>
            )}
            <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">

                {/* ── Editorial Header ── */}
                <header className="text-center md:text-start">
                    <p className="text-primary font-label uppercase tracking-[0.3em] text-[10px] font-bold mb-2">Weekly Protocol</p>
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tighter leading-tight">
                        {t('checkInTitle')}
                    </h1>
                </header>

                {/* ── Big Week Switcher (centered, lock-aware) ── */}
                {(() => {
                    const maxUnlocked = client.currentWeek; // forward stops here until coach reviews
                    const canGoBack = selectedWeekNum > 1;
                    const canGoForward = selectedWeekNum < maxUnlocked;
                    const statusBadge =
                        weekData.status === 'locked' ? `✓ ${t('done').toUpperCase()}`
                            : weekData.status === 'reviewed' ? `★ ${t('reviewed').toUpperCase()}`
                                : weekData.status.toUpperCase();
                    const statusClass =
                        weekData.status === 'pending' ? "bg-primary/10 text-primary border-primary/20"
                            : weekData.status === 'submitted' ? "bg-primary/10 text-primary border-primary/20"
                                : weekData.status === 'reviewed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-surface-container-highest text-on-surface/50 border-outline-variant/30";

                    return (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center gap-3 bg-surface-container-low rounded-full p-2 ghost-border shadow-lg w-full max-w-md">
                                <button
                                    disabled={!canGoBack}
                                    onClick={() => setSelectedWeekNum(prev => prev - 1)}
                                    className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-20 disabled:cursor-not-allowed text-on-surface flex items-center justify-center transition-colors shrink-0"
                                    aria-label="Previous week"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <div className="flex-1 text-center px-2">
                                    <div className="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-on-surface/40 mb-0.5">{t('week')}</div>
                                    <div className="text-3xl md:text-4xl font-headline font-extrabold text-primary tracking-tighter leading-none">
                                        {selectedWeekNum}
                                        <span className="text-on-surface/30 text-base font-normal mx-1">/</span>
                                        <span className="text-on-surface/50 text-xl">{client.programLength}</span>
                                    </div>
                                </div>
                                <button
                                    disabled={!canGoForward}
                                    onClick={() => setSelectedWeekNum(prev => prev + 1)}
                                    className="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-20 disabled:cursor-not-allowed text-on-surface flex items-center justify-center transition-colors shrink-0"
                                    aria-label="Next week"
                                    title={!canGoForward && selectedWeekNum >= maxUnlocked && maxUnlocked < client.programLength ? (t('weekLockedHint') ?? 'Awaiting coach review') : undefined}
                                >
                                    <ChevronRight size={22} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={clsx("px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-widest border", statusClass)}>
                                    {statusBadge}
                                </span>
                                {/* Lock notice when at the cap and not the final week */}
                                {selectedWeekNum >= maxUnlocked && maxUnlocked < client.programLength && (
                                    <span className="text-[10px] font-label uppercase tracking-widest text-on-surface/50">
                                        {t('weekLockedHint') ?? 'Awaiting coach review'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* ── Step-by-step Wizard (pending weeks only) ──
                    For weeks the client is actively filling, we use
                    the wizard instead of the long-scroll flat layout
                    so daily entries are the FIRST visible step and
                    no section is buried below 2-3 screens of coach
                    panels. Submitted / reviewed / locked weeks still
                    render the flat layout below so scrolling back
                    through history stays scannable. */}
                {weekData.status === 'pending' && (
                    <CheckInWizard
                        targets={weekData.activeTargets}
                        coachFeedback={weekData.coachFeedback ?? null}
                        entries={entries}
                        setEntries={setEntries}
                        photos={photos}
                        setPhotos={setPhotos}
                        strength={strength}             setStrength={setStrength}
                        hunger={hunger}                 setHunger={setHunger}
                        energy={energy}                 setEnergy={setEnergy}
                        cardioCalories={cardioCalories} setCardioCalories={setCardioCalories}
                        summary={summary}               setSummary={setSummary}
                        onPhotoUpload={handlePhotoUpload}
                        onPhotoRemove={removePhoto}
                        uploadingAngle={uploadingAngle}
                        onPhotoTap={setPhotoModal}
                        onSaveDraft={handleSave}
                        onSubmit={handleSubmit}
                    />
                )}

                {weekData.status !== 'pending' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── LEFT COLUMN — Coach Zone ── */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Targets Panel */}
                        <div className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Target size={20} />
                                </div>
                                <h3 className="font-headline font-bold text-on-surface text-lg">{t('currentTargets')}</h3>
                            </div>

                            <div className="space-y-8">
                                {targetMode === 'moderate' && (
                                    <div>
                                        <div className="flex justify-between mb-3">
                                            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Moderate carb day</span>
                                            <span className="font-headline font-bold text-primary text-sm">{moderateTarget.calories} Cal</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="bg-surface-container-lowest rounded-xl p-3">
                                                <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">C</div>
                                                <div className="text-lg font-headline font-bold text-on-surface">{moderateTarget.carbs}</div>
                                            </div>
                                            <div className="bg-surface-container-lowest rounded-xl p-3">
                                                <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">P</div>
                                                <div className="text-lg font-headline font-bold text-on-surface">{moderateTarget.protein}</div>
                                            </div>
                                            <div className="bg-surface-container-lowest rounded-xl p-3">
                                                <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">F</div>
                                                <div className="text-lg font-headline font-bold text-on-surface">{moderateTarget.fats}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={targetMode === 'moderate' ? 'hidden' : ''}>
                                    <div className="flex justify-between mb-3">
                                        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/50 font-bold">{t('highCarbDay')}</span>
                                        <span className="font-headline font-bold text-primary text-sm">{weekData.activeTargets.highCarb.calories} Cal</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="bg-surface-container-lowest rounded-xl p-3">
                                            <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">C</div>
                                            <div className="text-lg font-headline font-bold text-on-surface">{weekData.activeTargets.highCarb.carbs}</div>
                                        </div>
                                        <div className="bg-surface-container-lowest rounded-xl p-3">
                                            <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">P</div>
                                            <div className="text-lg font-headline font-bold text-on-surface">{weekData.activeTargets.highCarb.protein}</div>
                                        </div>
                                        <div className="bg-surface-container-lowest rounded-xl p-3">
                                            <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">F</div>
                                            <div className="text-lg font-headline font-bold text-on-surface">{weekData.activeTargets.highCarb.fats}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className={targetMode === 'moderate' ? 'hidden' : 'pt-6'}>
                                    <div className="flex justify-between mb-3">
                                        <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">{t('lowCarbDay')}</span>
                                        <span className="font-headline font-bold text-primary text-sm">{weekData.activeTargets.lowCarb.calories} Cal</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="bg-surface-container-lowest rounded-xl p-3">
                                            <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">C</div>
                                            <div className="text-lg font-headline font-bold text-on-surface">{weekData.activeTargets.lowCarb.carbs}</div>
                                        </div>
                                        <div className="bg-surface-container-lowest rounded-xl p-3">
                                            <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">P</div>
                                            <div className="text-lg font-headline font-bold text-on-surface">{weekData.activeTargets.lowCarb.protein}</div>
                                        </div>
                                        <div className="bg-surface-container-lowest rounded-xl p-3">
                                            <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/40 mb-1">F</div>
                                            <div className="text-lg font-headline font-bold text-on-surface">{weekData.activeTargets.lowCarb.fats}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cardio Target — coach-prescribed weekly target */}
                                {(weekData.activeTargets.cardio ?? 0) > 0 && (
                                    <div className="pt-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-label text-[10px] uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                                                <Flame size={12} />
                                                {t('cardioTargetLabel')}
                                            </span>
                                            <span className="font-headline font-bold text-orange-400 text-sm">
                                                {weekData.activeTargets.cardio} {t('kcalUnit')}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-body text-on-surface/40">
                                            {cardioCalories} / {weekData.activeTargets.cardio} {t('kcalUnit')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coach Feedback */}
                        <div className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <MessageSquare size={20} />
                                </div>
                                <h3 className="font-headline font-bold text-on-surface text-lg">{t('coachFeedback')}</h3>
                            </div>
                            {weekData.coachFeedback ? (
                                <div className="bg-surface-container rounded-xl p-6 border-l-4 border-primary relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-5">
                                        <Lightbulb size={48} />
                                    </div>
                                    <p className="text-on-surface/90 leading-relaxed font-body italic">"{weekData.coachFeedback}"</p>
                                    <div className="mt-4 text-[10px] font-label uppercase tracking-widest text-primary font-bold">
                                        {t('reviewedByCoachZack')}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-on-surface/30 font-body">
                                    {t('noFeedbackYet')}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN — Client Input ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Daily Tracking */}
                        <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                            <h3 className="text-xl font-headline font-bold text-on-surface mb-6">{t('dailyEntries')}</h3>
                            <DailyTrackingTable
                                entries={entries}
                                readOnly={isReadOnly}
                                onChange={handleEntryChange}
                            />
                        </section>

                        {/* Photos & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                                <h3 className="text-lg font-headline font-bold text-on-surface mb-6 flex items-center gap-3">
                                    <Camera size={20} className="text-primary" /> {t('progressPhotos')}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['front', 'side', 'back', 'face'] as const).map((angle) => (
                                        <div key={angle} className="relative">
                                            {photos[angle] ? (
                                                <div className="relative group">
                                                    <img
                                                        src={photos[angle]}
                                                        alt={angle}
                                                        className="aspect-[3/4] w-full rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity ghost-border"
                                                        onClick={() => setPhotoModal(photos[angle]!)}
                                                    />
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/80 backdrop-blur-sm text-[10px] font-label uppercase tracking-widest text-on-surface/60 capitalize">{angle}</div>
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => removePhoto(angle)}
                                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-on-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <label className={clsx(
                                                    "aspect-[3/4] rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 text-on-surface/30 transition-all",
                                                    !isReadOnly && "cursor-pointer hover:border-primary/40 hover:text-primary"
                                                )}>
                                                    {uploadingAngle === angle ? (
                                                        <Loader2 size={24} className="animate-spin text-primary" />
                                                    ) : (
                                                        <Camera size={24} />
                                                    )}
                                                    <span className="text-[10px] font-label uppercase tracking-widest capitalize">{angle}</span>
                                                    {!isReadOnly && (
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handlePhotoUpload(angle, file);
                                                            }}
                                                        />
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                {/* Strength Scale */}
                                <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 text-sm">
                                            <Shield size={16} className="text-primary" />
                                            {t('strengthScale')}
                                        </h3>
                                        <span className="text-2xl font-headline font-extrabold text-primary">{strength}<span className="text-xs text-on-surface/40 font-normal">/10</span></span>
                                    </div>
                                    <input type="range" min="0" max="10" step="1" disabled={isReadOnly} value={strength} onChange={(e) => setStrength(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary" />
                                    <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                                        <span>{t('weak')}</span>
                                        <span>{t('strong')}</span>
                                    </div>
                                </div>

                                {/* Hunger Scale */}
                                <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-headline font-bold text-on-surface text-sm">{t('hungerScale')}</h3>
                                        <span className="text-2xl font-headline font-extrabold text-primary">{hunger}<span className="text-xs text-on-surface/40 font-normal">/10</span></span>
                                    </div>
                                    <input type="range" min="0" max="10" step="1" disabled={isReadOnly} value={hunger} onChange={(e) => setHunger(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary" />
                                    <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                                        <span>{t('noHunger')}</span>
                                        <span>{t('starving')}</span>
                                    </div>
                                </div>

                                {/* Energy Scale */}
                                <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 text-sm">
                                            <Zap size={16} className="text-primary" />
                                            {t('energyScale')}
                                        </h3>
                                        <span className="text-2xl font-headline font-extrabold text-primary">{energy}<span className="text-xs text-on-surface/40 font-normal">/10</span></span>
                                    </div>
                                    <input type="range" min="0" max="10" step="1" disabled={isReadOnly} value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary" />
                                    <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                                        <span>{t('noEnergy')}</span>
                                        <span>{t('fullEnergy')}</span>
                                    </div>
                                </div>

                                {/* Cardio Calories */}
                                <div className="bg-surface-container-low rounded-2xl p-6 ghost-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 text-sm">
                                            <Flame size={16} className="text-primary" />
                                            {t('cardioCalories')}
                                        </h3>
                                        <span className="text-2xl font-headline font-extrabold text-primary">{cardioCalories}<span className="text-xs text-on-surface/40 font-normal"> kcal</span></span>
                                    </div>
                                    <input type="range" min="0" max="2000" step="50" disabled={isReadOnly} value={cardioCalories} onChange={(e) => setCardioCalories(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary" />
                                    <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                                        <span>0</span>
                                        <span>2000 kcal</span>
                                    </div>
                                </div>

                                {/* Weekly Summary */}
                                <div className="bg-surface-container-low rounded-2xl p-6 ghost-border flex-1">
                                    <h3 className="font-headline font-bold text-on-surface mb-4 text-sm">{t('weeklySummary')}</h3>
                                    <textarea
                                        disabled={isReadOnly}
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder={t('weeklyReflectionPlaceholder')}
                                        className="w-full h-32 bg-surface-container-lowest rounded-xl p-4 text-on-surface placeholder-on-surface/30 resize-none border-none outline-none focus:ring-1 focus:ring-primary/30 font-body text-sm transition-all"
                                    />
                                </div>
                            </section>
                        </div>

                        {/* Action Bar */}
                        {!isReadOnly && (
                            <div className="flex items-center justify-end gap-4 pt-6">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 text-on-surface/50 hover:text-on-surface px-6 py-3 rounded-full font-label text-sm uppercase tracking-widest transition-colors"
                                >
                                    <Save size={18} /> {t('saveProgress')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-8 py-4 rounded-full font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    <Send size={18} /> {t('submitCheckIn')}
                                </button>
                            </div>
                        )}

                        {isReadOnly && (
                            <div className={clsx(
                                "rounded-2xl p-6 flex items-center gap-4",
                                weekData.status === 'locked' ? "bg-surface-container-low ghost-border text-on-surface/50" :
                                    weekData.status === 'reviewed' ? "bg-emerald-500/5 border border-emerald-500/15 text-emerald-400" :
                                        "bg-primary/5 border border-primary/15 text-primary"
                            )}>
                                <AlertCircle size={20} />
                                <p className="font-body text-sm">
                                    {weekData.status === 'locked' ? t('weekCompletedLocked') :
                                        weekData.status === 'reviewed' ? t('weekReviewedByCoachMsg') :
                                            t('weekSubmittedPending')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                )}

            </div>

            {/* Photo Lightbox Modal */}
            {
                photoModal && (
                    <div
                        className="fixed inset-0 z-[100] bg-surface-container-lowest/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setPhotoModal(null)}
                    >
                        <button
                            onClick={() => setPhotoModal(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-highest/50 text-on-surface flex items-center justify-center hover:bg-surface-bright transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={photoModal}
                            alt="Progress photo"
                            className="max-w-full max-h-[90vh] rounded-2xl object-contain ghost-border"
                        />
                    </div>
                )}
        </>
    );
};
