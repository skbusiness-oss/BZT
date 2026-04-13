import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { DailyTrackingTable } from '../components/checkin/DailyTrackingTable';
import { ProgressCharts } from '../components/dashboard/ProgressCharts';
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
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { MacroTarget } from '../types';

export const CoachReview = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { clients, getClientWeeks, updateWeek, updateClient, cascadeTargets, createProgram, advanceWeek, workouts, assignWorkout, unassignWorkout } = useData();
    const { t } = useLanguage();

    const client = clients.find(c => c.id === clientId);
    const weeks = client ? getClientWeeks(client.id) : [];

    const weekNeedingReview = weeks.find(w => w.status === 'submitted');
    const [selectedWeekNum, setSelectedWeekNum] = useState<number>(weekNeedingReview?.weekNumber || client?.currentWeek || 0);

    const isProgramCreation = client?.currentWeek === 0;
    const weekData = weeks.find(w => w.weekNumber === selectedWeekNum);

    const [feedback, setFeedback] = useState('');
    const [changeTargets, setChangeTargets] = useState(false);

    const [newHighCarb, setNewHighCarb] = useState<MacroTarget>({ carbs: 250, protein: 180, fats: 60, calories: 2260 });
    const [newLowCarb, setNewLowCarb] = useState<MacroTarget>({ carbs: 120, protein: 180, fats: 80, calories: 1920 });
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            setChangeTargets(false);
        }
    }, [weekData]);

    if (!client) {
        return <div className="text-white p-8">{t('clientNotFound')}</div>;
    }

    const handleAction = async () => {
        setIsSubmitting(true);
        try {
            if (isProgramCreation) {
                await createProgram(client.id, { highCarb: newHighCarb, lowCarb: newLowCarb });
                showToast('success', `Program created! ${client.name} is now on Week 1.`);
                setTimeout(() => navigate('/'), 1000);
            } else if (weekData) {
                await updateWeek(weekData.id, { coachFeedback: feedback, status: 'reviewed' });

                if (changeTargets) {
                    await cascadeTargets(client.id, weekData.weekNumber + 1, { highCarb: newHighCarb, lowCarb: newLowCarb });
                }

                await advanceWeek(client.id, weekData.weekNumber);
                await updateClient(client.id, { needsReview: false });

                showToast('success', changeTargets
                    ? `Week ${weekData.weekNumber} reviewed. Targets updated from Week ${weekData.weekNumber + 1} onwards.`
                    : `Week ${weekData.weekNumber} reviewed. Client advanced to Week ${weekData.weekNumber + 1}.`
                );
                setTimeout(() => navigate('/'), 1000);
            }
        } catch {
            showToast('error', 'Action failed. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
            )}>
                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="font-medium text-sm">{toast.msg}</span>
            </div>
        )}
        <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 clay-card p-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="hover:bg-navy-700 p-2 rounded-lg text-navy-300 hover:text-white transition-colors">
                        <ChevronLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {isProgramCreation ? t('programCreation') : t('coachReviewTitle')}: {client.name}
                            {!isProgramCreation && <span className="text-sm font-normal text-navy-300 clay-card-sm px-2 py-1">{t('week')} {selectedWeekNum}</span>}
                            {isProgramCreation && <span className="text-sm font-bold text-gold-400 bg-gold-500/10 px-2 py-1 rounded">Intake Data</span>}
                        </h1>
                    </div>
                </div>

                {!isProgramCreation && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedWeekNum(prev => Math.max(0, prev - 1))}
                            disabled={selectedWeekNum <= 0}
                            className="text-navy-300 hover:text-white disabled:opacity-30"
                        >
                            <ChevronLeft />
                        </button>
                        <span className="text-navy-400 text-sm">
                            {selectedWeekNum === 0 ? 'Intake Week' : `Week ${selectedWeekNum}`}
                        </span>
                        <button
                            onClick={() => setSelectedWeekNum(prev => Math.min(client.programLength, prev + 1))}
                            disabled={selectedWeekNum >= client.programLength}
                            className="text-navy-300 hover:text-white disabled:opacity-30"
                        >
                            <ChevronRight />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN - Client Data */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Week 0 Intake VIEW */}
                    {isProgramCreation ? (
                        <div className="clay-card p-8 space-y-8">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-gold-400" /> {t('clientSummary')}
                            </h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="clay-inset p-4">
                                    <div className="text-navy-400 text-sm mb-1">{t('startingWeight')}</div>
                                    <div className="text-2xl font-bold text-white">{client.intakeData?.startingWeight || '--'} kg</div>
                                </div>
                                <div className="clay-inset p-4">
                                    <div className="text-navy-400 text-sm mb-1">{t('height')}</div>
                                    <div className="text-2xl font-bold text-white">{client.intakeData?.height || '--'} cm</div>
                                </div>
                                <div className="clay-inset p-4">
                                    <div className="text-navy-400 text-sm mb-1">{t('goal')}</div>
                                    <div className="text-2xl font-bold text-white capitalize">{client.intakeData?.goal?.replace('_', ' ') || '--'}</div>
                                </div>
                                <div className="clay-inset p-4">
                                    <div className="text-navy-400 text-sm mb-1">{t('activityLevel')}</div>
                                    <div className="text-2xl font-bold text-white capitalize">{client.intakeData?.activityLevel || '--'}</div>
                                </div>
                            </div>

                            {/* Photos Placeholder */}
                            <div className="clay-inset p-6">
                                <h3 className="font-bold text-white mb-4">{t('photos')}</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Front', 'Side', 'Back'].map(i => (
                                        <div key={i} className="aspect-[3/4] bg-navy-950 rounded border border-navy-700 flex items-center justify-center text-navy-500 font-medium hover:border-gold-500/30 transition-colors">
                                            {i} Raw
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="clay-card p-6">
                            <div className="flex justify-between mb-6">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <History className="text-gold-400" size={20} /> {t('dailyEntries')}
                                </h3>
                            </div>
                            {weekData && <DailyTrackingTable entries={weekData.dailyEntries} readOnly={true} onChange={() => { }} />}
                        </div>
                    )}

                    {/* Client Photos */}
                    {!isProgramCreation && weekData?.photos && Object.values(weekData.photos).some(Boolean) && (
                        <div className="clay-card p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Camera className="text-gold-400" size={20} /> Progress Photos
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                                {(['front', 'side', 'back', 'face'] as const).map(angle => (
                                    weekData.photos?.[angle] ? (
                                        <div key={angle} className="relative">
                                            <img
                                                src={weekData.photos[angle]}
                                                alt={angle}
                                                className="aspect-[3/4] w-full rounded-lg object-cover"
                                            />
                                            <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/60 text-xs text-white capitalize">{angle}</div>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Charts */}
                    {!isProgramCreation && <ProgressCharts weeks={weeks} />}
                </div>

                {/* RIGHT COLUMN - Coach Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Target Adjustment / Program Builder */}
                    <div className="clay-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                {isProgramCreation ? <Dumbbell className="text-gold-400" size={20} /> : <Target className="text-gold-400" size={20} />}
                                {isProgramCreation ? t('setInitialTargets') : t('adjustTargets')}
                            </h3>

                            {!isProgramCreation && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={changeTargets}
                                        onChange={(e) => setChangeTargets(e.target.checked)}
                                        className="accent-gold-500 w-4 h-4"
                                    />
                                    <span className="text-sm text-gold-400 font-medium">Change?</span>
                                </label>
                            )}
                        </div>

                        {/* Program Builder / Target Inputs */}
                        <div className={`space-y-6 transition-all ${(isProgramCreation || changeTargets) ? 'opacity-100' : 'opacity-60 pointer-events-none grayscale'}`}>
                            {/* High Carb Inputs */}
                            <div className="clay-inset p-4">
                                <div className="flex justify-between text-xs text-navy-300 font-bold mb-3 uppercase">
                                    {t('highCarb')} {t('adjustTargets')}
                                    <span>{newHighCarb.calories} kcal</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['carbs', 'protein', 'fats'].map((macro) => (
                                        <div key={macro}>
                                            <label className="text-[10px] text-navy-400 uppercase">{macro.charAt(0)}</label>
                                            <input
                                                type="number"
                                                value={newHighCarb[macro as keyof MacroTarget]}
                                                onChange={(e) => updateTarget('high', macro as keyof MacroTarget, parseInt(e.target.value))}
                                                className="w-full clay-input px-2 py-1 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Low Carb Inputs */}
                            <div className="clay-inset p-4">
                                <div className="flex justify-between text-xs text-gold-500 font-bold mb-3 uppercase">
                                    {t('lowCarb')} {t('adjustTargets')}
                                    <span>{newLowCarb.calories} kcal</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['carbs', 'protein', 'fats'].map((macro) => (
                                        <div key={macro}>
                                            <label className="text-[10px] text-navy-400 uppercase">{macro.charAt(0)}</label>
                                            <input
                                                type="number"
                                                value={newLowCarb[macro as keyof MacroTarget]}
                                                onChange={(e) => updateTarget('low', macro as keyof MacroTarget, parseInt(e.target.value))}
                                                className="w-full clay-input px-2 py-1 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {changeTargets && !isProgramCreation && (
                            <div className="mt-4 p-3 bg-navy-500/10 border border-navy-400/20 rounded-lg text-xs text-navy-200 flex items-start gap-2">
                                <TrendingUp size={14} className="mt-0.5 shrink-0" />
                                Changes will cascade from Next Week (Week {(weekData?.weekNumber || 0) + 1}) onwards.
                            </div>
                        )}

                        {isProgramCreation && (
                            <div className="mt-4 p-3 bg-gold-500/5 border border-gold-500/15 rounded-lg text-xs text-gold-300 flex items-start gap-2">
                                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                This will generate Weeks 1-12 with these targets.
                            </div>
                        )}

                    </div>

                    {/* Feedback & Actions */}
                    <div className="clay-card p-6">
                        {!isProgramCreation && (
                            <>
                                <h3 className="font-bold text-white mb-4">{t('coachFeedback')}</h3>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={t('writeYourFeedback')}
                                    className="w-full h-32 clay-input p-4 placeholder-navy-500 resize-none mb-6"
                                />
                            </>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAction}
                                disabled={isSubmitting}
                                className="w-full clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 py-3 flex items-center justify-center gap-2 gold-glow disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                {isProgramCreation ? t('createProgram') : t('markReviewed')}
                            </button>
                            <button className="w-full clay-button bg-navy-800 hover:bg-navy-700 text-navy-200 py-3">
                                {t('saveProgress')}
                            </button>
                        </div>
                    </div>

                    {/* Workout Assignment */}
                    {!isProgramCreation && weekData && (
                        <div className="clay-card p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Dumbbell className="text-gold-400" size={20} /> Assign Workouts
                            </h3>
                            <div className="space-y-2 mb-4">
                                {(weekData.assignedWorkoutIds || []).map(wId => {
                                    const w = workouts.find(x => x.id === wId);
                                    if (!w) return null;
                                    return (
                                        <div key={w.id} className="flex items-center justify-between clay-inset p-3 rounded-lg">
                                            <div>
                                                <p className="text-white text-sm font-medium">{w.name}</p>
                                                <p className="text-navy-400 text-xs">{w.exercises.length} exercises · {w.estimatedMinutes}min</p>
                                            </div>
                                            <button onClick={() => unassignWorkout(weekData.id, w.id)} className="text-red-400 hover:text-red-300 p-1">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {(!weekData.assignedWorkoutIds || weekData.assignedWorkoutIds.length === 0) && (
                                    <p className="text-navy-400 text-sm text-center py-4">No workouts assigned yet</p>
                                )}
                            </div>
                            <select
                                onChange={(e) => { if (e.target.value) { assignWorkout(weekData.id, e.target.value); e.target.value = ''; } }}
                                defaultValue=""
                                className="w-full clay-input px-3 py-2 text-sm"
                            >
                                <option value="" disabled>+ Add a workout...</option>
                                {workouts
                                    .filter(w => !(weekData.assignedWorkoutIds || []).includes(w.id))
                                    .map(w => (<option key={w.id} value={w.id}>{w.name} ({w.category})</option>))
                                }
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};
