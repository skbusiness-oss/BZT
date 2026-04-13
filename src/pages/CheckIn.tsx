import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { DayEntry, WeekPhotos } from '../types';
import { DailyTrackingTable } from '../components/checkin/DailyTrackingTable';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Send,
    Camera,
    MessageSquare,
    Target,
    AlertCircle,
    Dumbbell,
    X,
    CheckCircle,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';

export const CheckIn = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { clients, getClientWeeks, updateWeek, updateClient, workouts, uploadPhoto } = useData();

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

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (weekData) {
            setEntries(weekData.dailyEntries || Array.from({ length: 7 }, () => ({} as DayEntry)));
            setSummary(weekData.weeklySummary || '');
            setHunger(weekData.hungerScale || 5);
            setPhotos(weekData.photos || {});
        }
    }, [weekData]);

    if (!client || !weekData) return <div className="text-white">{t('loading')}</div>;

    const isReadOnly = weekData.status === 'submitted' || weekData.status === 'reviewed' || weekData.status === 'locked';

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
                photos,
            });
            showToast('success', t('progressSaved'));
        } catch {
            showToast('error', 'Failed to save. Please try again.');
        }
    };

    const handleSubmit = async () => {
        if (!client) return;
        try {
            await updateWeek(weekData.id, {
                dailyEntries: entries,
                weeklySummary: summary,
                hungerScale: hunger,
                photos,
                status: 'submitted'
            });
            await updateClient(client.id, { needsReview: true });
            showToast('success', t('checkInSubmitted'));
        } catch {
            showToast('error', 'Submission failed. Please try again.');
        }
    };

    // Upload photo to Firebase Storage and store the download URL
    const handlePhotoUpload = async (angle: keyof WeekPhotos, file: File) => {
        if (!user) return;
        setUploadingAngle(angle);
        try {
            const downloadUrl = await uploadPhoto(file, user.id, selectedWeekNum);
            setPhotos(prev => ({ ...prev, [angle]: downloadUrl }));
        } catch {
            showToast('error', 'Photo upload failed. Please try again.');
        } finally {
            setUploadingAngle(null);
        }
    };

    const removePhoto = (angle: keyof WeekPhotos) => {
        setPhotos(prev => { const next = { ...prev }; delete next[angle]; return next; });
    };

    // Assigned workouts for this week
    const assignedWorkouts = (weekData.assignedWorkoutIds || []).map(id => workouts.find(w => w.id === id)).filter(Boolean);

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className={clsx(
                    "fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-top-2 duration-300",
                    toast.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                )}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="font-medium text-sm">{toast.msg}</span>
                </div>
            )}
            <div className="max-w-6xl mx-auto pb-20 space-y-6 animate-in fade-in duration-500">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            {t('checkInTitle')}
                            <span className={clsx("px-3 py-1 rounded-full text-sm font-bold border",
                                weekData.status === 'pending' ? "bg-navy-500/20 text-navy-300 border-navy-500/30" :
                                    weekData.status === 'submitted' ? "bg-gold-500/15 text-gold-400 border-gold-500/30" :
                                        weekData.status === 'reviewed' ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                                            weekData.status === 'locked' ? "bg-navy-400/20 text-navy-200 border-navy-400/30" :
                                                "bg-navy-400/20 text-navy-200 border-navy-400/30"
                            )}>
                                {weekData.status === 'locked' ? '✓ COMPLETED' : weekData.status === 'reviewed' ? '★ REVIEWED' : weekData.status.toUpperCase()}
                            </span>
                        </h1>
                        <p className="text-navy-200">{t('week')} {selectedWeekNum} / {client.programLength}</p>
                    </div>

                    <div className="flex items-center gap-4 clay-card-sm p-2">
                        <button
                            disabled={selectedWeekNum <= 1}
                            onClick={() => setSelectedWeekNum(prev => prev - 1)}
                            className="p-2 hover:bg-navy-700 rounded-lg text-navy-300 hover:text-white disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-white min-w-[100px] text-center">{t('week')} {selectedWeekNum}</span>
                        <button
                            disabled={selectedWeekNum >= client.programLength}
                            onClick={() => setSelectedWeekNum(prev => prev + 1)}
                            className="p-2 hover:bg-navy-700 rounded-lg text-navy-300 hover:text-white disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Coach Zone */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Targets Panel */}
                        <div className="clay-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Target className="text-gold-400" size={20} />
                                <h3 className="font-bold text-white">{t('currentTargets')}</h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-navy-300">{t('highCarbDay')}</span>
                                        <span className="text-sm text-navy-300">{weekData.activeTargets.highCarb.calories} Cal</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div className="clay-inset p-2">
                                            <div className="text-navy-400 text-xs">C</div>
                                            <div className="text-white font-bold">{weekData.activeTargets.highCarb.carbs}</div>
                                        </div>
                                        <div className="clay-inset p-2">
                                            <div className="text-navy-400 text-xs">P</div>
                                            <div className="text-white font-bold">{weekData.activeTargets.highCarb.protein}</div>
                                        </div>
                                        <div className="clay-inset p-2">
                                            <div className="text-navy-400 text-xs">F</div>
                                            <div className="text-white font-bold">{weekData.activeTargets.highCarb.fats}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/[0.04] pt-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-gold-500">{t('lowCarbDay')}</span>
                                        <span className="text-sm text-navy-300">{weekData.activeTargets.lowCarb.calories} Cal</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div className="clay-inset p-2">
                                            <div className="text-navy-400 text-xs">C</div>
                                            <div className="text-white font-bold">{weekData.activeTargets.lowCarb.carbs}</div>
                                        </div>
                                        <div className="clay-inset p-2">
                                            <div className="text-navy-400 text-xs">P</div>
                                            <div className="text-white font-bold">{weekData.activeTargets.lowCarb.protein}</div>
                                        </div>
                                        <div className="clay-inset p-2">
                                            <div className="text-navy-400 text-xs">F</div>
                                            <div className="text-white font-bold">{weekData.activeTargets.lowCarb.fats}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coach Feedback */}
                        <div className="clay-card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="text-gold-400" size={20} />
                                <h3 className="font-bold text-white">{t('coachFeedback')}</h3>
                            </div>
                            {weekData.coachFeedback ? (
                                <div className="bg-gold-500/5 border border-gold-500/15 rounded-xl p-4">
                                    <p className="text-navy-100 text-sm leading-relaxed">"{weekData.coachFeedback}"</p>
                                    <div className="mt-3 text-xs text-gold-600 font-medium">
                                        Reviewed by Coach Zack
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-navy-400 text-sm">
                                    No feedback yet for this week.
                                </div>
                            )}
                        </div>

                        {/* Assigned Workouts */}
                        {assignedWorkouts.length > 0 && (
                            <div className="clay-card p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Dumbbell className="text-gold-400" size={20} />
                                    <h3 className="font-bold text-white">This Week's Workouts</h3>
                                </div>
                                <div className="space-y-3">
                                    {assignedWorkouts.map(w => w && (
                                        <div key={w.id} className="clay-inset p-3 rounded-lg">
                                            <h4 className="text-white font-medium text-sm">{w.name}</h4>
                                            <p className="text-navy-400 text-xs mt-1">{w.exercises.length} exercises · {w.estimatedMinutes}min</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Client Input */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Daily Tracking */}
                        <section className="clay-card p-6">
                            <h3 className="text-lg font-bold text-white mb-4">{t('dailyEntries')}</h3>
                            <DailyTrackingTable
                                entries={entries}
                                readOnly={isReadOnly}
                                onChange={handleEntryChange}
                            />
                        </section>

                        {/* Photos & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="clay-card p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Camera size={20} /> {t('progressPhotos')}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['front', 'side', 'back', 'face'] as const).map((angle) => (
                                        <div key={angle} className="relative">
                                            {photos[angle] ? (
                                                <div className="relative group">
                                                    <img
                                                        src={photos[angle]}
                                                        alt={angle}
                                                        className="aspect-[3/4] w-full rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => setPhotoModal(photos[angle]!)}
                                                    />
                                                    <div className="absolute top-1 left-1 px-2 py-0.5 rounded bg-black/60 text-xs text-white capitalize">{angle}</div>
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => removePhoto(angle)}
                                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <label className={clsx(
                                                    "aspect-[3/4] rounded-lg clay-inset border border-dashed border-navy-600 flex flex-col items-center justify-center gap-2 text-navy-400 transition-all",
                                                    !isReadOnly && "cursor-pointer hover:border-gold-500/40 hover:text-gold-400"
                                                )}>
                                                    {uploadingAngle === angle ? (
                                                        <Loader2 size={24} className="animate-spin text-gold-400" />
                                                    ) : (
                                                        <Camera size={24} />
                                                    )}
                                                    <span className="text-xs capitalize">{angle}</span>
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
                                {/* Hunger Scale */}
                                <div className="clay-card p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">{t('hungerScale')}</h3>
                                        <span className="text-2xl font-bold text-gold-400">{hunger}<span className="text-sm text-navy-400">/10</span></span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        disabled={isReadOnly}
                                        value={hunger}
                                        onChange={(e) => setHunger(parseInt(e.target.value))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-navy-400 mt-2">
                                        <span>No Hunger</span>
                                        <span>Starving</span>
                                    </div>
                                </div>

                                {/* Weekly Summary */}
                                <div className="clay-card p-6 flex-1">
                                    <h3 className="font-bold text-white mb-4">{t('weeklySummary')}</h3>
                                    <textarea
                                        disabled={isReadOnly}
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder={t('weeklyReflectionPlaceholder')}
                                        className="w-full h-32 clay-input p-4 placeholder-navy-500 resize-none"
                                    />
                                </div>
                            </section>
                        </div>

                        {/* Action Bar */}
                        {!isReadOnly && (
                            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/[0.04]">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 text-navy-300 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors"
                                >
                                    <Save size={20} /> {t('saveProgress')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-8 py-3 flex items-center gap-2 gold-glow"
                                >
                                    <Send size={20} /> {t('submitCheckIn')}
                                </button>
                            </div>
                        )}

                        {isReadOnly && (
                            <div className={clsx(
                                "rounded-xl p-4 flex items-center gap-3",
                                weekData.status === 'locked' ? "bg-navy-400/5 border border-navy-400/15 text-navy-300" :
                                    weekData.status === 'reviewed' ? "bg-emerald-500/5 border border-emerald-500/15 text-emerald-400" :
                                        "bg-gold-500/5 border border-gold-500/15 text-gold-400"
                            )}>
                                <AlertCircle size={20} />
                                <p>
                                    {weekData.status === 'locked' ? 'This week has been completed and locked.' :
                                        weekData.status === 'reviewed' ? 'This week has been reviewed by your coach. Check the feedback panel.' :
                                            'This week has been submitted and is awaiting coach review.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Photo Lightbox Modal */}
            {
                photoModal && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setPhotoModal(null)}
                    >
                        <button
                            onClick={() => setPhotoModal(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={photoModal}
                            alt="Progress photo"
                            className="max-w-full max-h-[90vh] rounded-xl object-contain"
                        />
                    </div>
                )}
        </>
    );
};
