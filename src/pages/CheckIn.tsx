import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { DayEntry, WeekPhotos } from '../types';
import { awardXp, XP_SOURCE } from '../lib/activityScore';
import { CheckInWizard } from '../components/checkin/CheckInWizard';
import {
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle,
    AlertCircle,
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

                {/* ── Step-by-step Wizard (every week, every status)
                    Founder direction: the wizard IS the check-in
                    experience now. Pending weeks get the editable
                    flow with Save Draft + Submit. Submitted /
                    reviewed / locked weeks render the same wizard
                    in read-only mode so the client can step through
                    a "tour" of what they logged + read the coach's
                    feedback (the coach pill auto-opens on reviewed
                    weeks). One layout, one mental model, regardless
                    of where the week sits in the cycle. */}
                <CheckInWizard
                    readOnly={isReadOnly}
                    weekStatus={weekData.status as 'pending' | 'submitted' | 'reviewed' | 'locked'}
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
