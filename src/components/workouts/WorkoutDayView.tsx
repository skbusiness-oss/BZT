/**
 * WorkoutDayView — Shows today's workout with exercises and goal context.
 *
 * Features:
 * - Goal banner (from GOAL_CONTEXT)
 * - Exercise list with cards (sets × reps, rest, notes)
 * - Rep scheme display (from parseRepScheme)
 * - "MARK DAY AS COMPLETE" button
 * - Rest day: shows RestDayCard
 * - Completion celebration
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import { getGoalContext } from '../../data/programUtils';
import { ALL_TRAINING_PROGRAMS } from '../../data';
import { RestDayCard } from './RestDayCard';
import { ExerciseModal } from './ExerciseModal';
import { ExerciseSections } from './ExerciseSections';
import { Workout } from '../../types';
import { getExerciseDetail } from '../../data/exerciseLibrary';
import {
    ArrowLeft, CheckCircle2, Timer, Dumbbell,
    Target, Trophy, Flame, Sparkles,
} from 'lucide-react';

export const WorkoutDayView = () => {
    const { dayNumber: dayParam } = useParams<{ dayNumber: string }>();
    const navigate = useNavigate();
    const { lang, isRTL } = useLanguage();
    const isAr = lang === 'ar';
    const { activeProgram, completeDay, todaysDayNumber } = useActiveProgram();

    const [showExerciseModal, setShowExerciseModal] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    const dayNum = dayParam ? parseInt(dayParam, 10) : todaysDayNumber;

    const day = useMemo(() => {
        if (!activeProgram) return null;
        return activeProgram.rotation.find(d => d.dayNumber === dayNum) ?? null;
    }, [activeProgram, dayNum]);

    const workout: Workout | null = useMemo(() => {
        if (!day || day.type !== 'workout' || !day.workoutId) return null;
        return ALL_TRAINING_PROGRAMS.find(w => w.id === day.workoutId) ?? null;
    }, [day]);

    const goalContext = activeProgram ? getGoalContext(activeProgram.goal) : null;

    const isCompleted = activeProgram?.completedDays.includes(dayNum) ?? false;

    const handleComplete = async () => {
        setIsCompleting(true);
        await completeDay(dayNum);
        setShowCelebration(true);
        setIsCompleting(false);
    };

    // Get next day info for celebration screen
    const nextDayNum = dayNum < 10 ? dayNum + 1 : 1;
    const nextDay = activeProgram?.rotation.find(d => d.dayNumber === nextDayNum);
    const isCycleComplete = dayNum === 10;

    // Celebration screen
    if (showCelebration) {
        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
                <div className="relative">
                    <Trophy className="text-primary animate-bounce" size={64} />
                    <Sparkles className="text-primary-fixed absolute -top-2 -right-2 animate-pulse" size={24} />
                </div>

                {isCycleComplete ? (
                    <>
                        <h1 className="text-3xl font-extrabold text-on-surface">
                            {isAr ? `🎉 الدورة ${activeProgram?.currentCycle ?? 1} مكتملة!` : `🎉 Cycle ${activeProgram?.currentCycle ?? 1} Complete!`}
                        </h1>
                        <p className="text-on-surface/70 text-lg max-w-sm">
                            {isAr
                                ? 'عمل ممتاز! البرنامج يستمر — دورة جديدة تبدأ.'
                                : 'Amazing work! Your program continues — a new cycle begins.'
                            }
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-extrabold text-on-surface">
                            {isAr ? `🎉 اليوم ${dayNum} مكتمل!` : `🎉 Day ${dayNum} Complete!`}
                        </h1>
                        {nextDay && (
                            <p className="text-on-surface/70 text-lg">
                                {isAr ? 'الغد: ' : 'Tomorrow: '}
                                <span className="text-on-surface font-semibold">{nextDay.label}</span>
                            </p>
                        )}
                    </>
                )}

                <button
                    onClick={() => navigate('/')}
                    className="py-4 px-8 rounded-full font-label text-[12px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {isAr ? '← العودة للوحة' : '← Back to Dashboard'}
                </button>
            </div>
        );
    }

    if (!activeProgram || !day) {
        return (
            <div className="text-center py-20">
                <Dumbbell className="text-on-surface-variant/60 mx-auto mb-4" size={48} />
                <p className="text-on-surface/70 text-lg">{isAr ? 'لا يوجد برنامج نشط' : 'No active program'}</p>
                <button onClick={() => navigate('/workouts')} className="mt-4 py-3 px-6 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-highest transition-colors">
                    {isAr ? 'اذهب للتمارين' : 'Go to Workouts'}
                </button>
            </div>
        );
    }

    // Rest day
    if (day.type === 'rest') {
        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-500 pb-20">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface/70 hover:text-on-surface transition-colors">
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">{isAr ? 'رجوع' : 'Back'}</span>
                </button>
                <RestDayCard day={day} onAcknowledge={handleComplete} isCompleted={isCompleted} />
            </div>
        );
    }

    // Workout day
    const goalColor = goalContext?.color ?? 'orange';
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-400/20', text: 'text-orange-400' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-400/20', text: 'text-blue-400' },
        red: { bg: 'bg-red-500/10', border: 'border-red-400/20', text: 'text-red-400' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-400/20', text: 'text-purple-400' },
        green: { bg: 'bg-green-500/10', border: 'border-green-400/20', text: 'text-green-400' },
        teal: { bg: 'bg-teal-500/10', border: 'border-teal-400/20', text: 'text-teal-400' },
    };
    const colors = colorMap[goalColor] ?? colorMap.orange;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-5 animate-in fade-in duration-500 pb-20">
            {/* Back */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface/70 hover:text-on-surface transition-colors">
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">{isAr ? 'رجوع' : 'Back'}</span>
            </button>

            {/* Day header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-on-surface">{day.label}</h1>
                    <p className="text-on-surface-variant text-sm mt-1">
                        {isAr ? `اليوم ${dayNum} من 10` : `Day ${dayNum} of 10`}
                        {workout && ` — ${workout.name}`}
                    </p>
                </div>
                {isCompleted && (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold">{isAr ? 'مكتمل' : 'Done'}</span>
                    </div>
                )}
            </div>

            {/* Goal banner */}
            {goalContext && (
                <div className={`rounded-2xl p-4 border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className={colors.text} size={18} />
                        <span className={`text-sm font-bold ${colors.text}`}>
                            {goalContext.emoji} {isAr ? goalContext.labelAr : goalContext.label}
                        </span>
                    </div>
                    <p className="text-on-surface text-xs leading-relaxed">
                        {isAr ? goalContext.focusAr : goalContext.focus}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface/70">
                            <Timer size={12} className={colors.text} />
                            <span>{isAr ? goalContext.restGuidanceAr : goalContext.restGuidance}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface/70">
                            <Dumbbell size={12} className={colors.text} />
                            <span>{isAr ? goalContext.weightGuidanceAr : goalContext.weightGuidance}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Exercise list */}
            {workout && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider flex items-center gap-2">
                        <Target size={14} className="text-primary" />
                        {isAr ? `${workout.exercises.length} تمرين` : `${workout.exercises.length} Exercises`}
                    </h3>

                    <ExerciseSections exercises={workout.exercises} onExerciseClick={exercise => setShowExerciseModal(exercise.name)} />
                </div>
            )}

            {/* Mark complete button */}
            {!isCompleted && (
                <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
                >
                    <CheckCircle2 size={22} />
                    {isCompleting
                        ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                        : (isAr ? '✅ تم إكمال هذا اليوم' : '✅ Mark Day as Complete')
                    }
                </button>
            )}

            {/* Exercise modal */}
            {showExerciseModal && (
                <ExerciseModal
                    exerciseName={showExerciseModal}
                    exerciseDetail={getExerciseDetail(showExerciseModal)}
                    onClose={() => setShowExerciseModal(null)}
                />
            )}
        </div>
    );
};
