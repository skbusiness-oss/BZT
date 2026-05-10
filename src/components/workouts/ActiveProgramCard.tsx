/**
 * ActiveProgramCard — Dashboard widget showing current program status.
 *
 * Shows: program name, today's day, progress bar, streak,
 * START TODAY'S WORKOUT button, DELETE button (hidden if coach-assigned).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import { getGoalContext } from '../../data/programUtils';
import {
    Play, Trash2, Moon, Lock, AlertTriangle,
    Flame, TrendingUp, Shield, RotateCcw, Heart, Activity,
    Repeat, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const GOAL_ICONS = {
    fat_loss: Flame,
    muscle_gain: TrendingUp,
    strength: Shield,
    recomp: RotateCcw,
    maintenance: Heart,
    endurance: Activity,
};

export const ActiveProgramCard = () => {
    const navigate = useNavigate();
    const { lang, isRTL } = useLanguage();
    const isAr = lang === 'ar';
    const { activeProgram, todaysDayNumber, getTodaysDay, deleteProgram, canDelete, loading } = useActiveProgram();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (loading || !activeProgram) return null;

    const goalContext = getGoalContext(activeProgram.goal);
    const GoalIcon = GOAL_ICONS[activeProgram.goal];
    const todaysDay = getTodaysDay();
    const isRestDay = todaysDay?.type === 'rest';
    const completedCount = activeProgram.completedDays.length;
    const totalDays = activeProgram.rotation.length;
    const progressPercent = Math.round((completedCount / totalDays) * 100);

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteProgram();
        setIsDeleting(false);
        setShowDeleteConfirm(false);
    };

    const colorMap: Record<string, { bg: string; gradient: string; text: string; border: string }> = {
        orange: { bg: 'bg-orange-500/10', gradient: 'from-orange-500 to-orange-600', text: 'text-orange-400', border: 'border-orange-400/20' },
        blue: { bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-blue-600', text: 'text-blue-400', border: 'border-blue-400/20' },
        red: { bg: 'bg-red-500/10', gradient: 'from-red-500 to-red-600', text: 'text-red-400', border: 'border-red-400/20' },
        purple: { bg: 'bg-purple-500/10', gradient: 'from-purple-500 to-purple-600', text: 'text-purple-400', border: 'border-purple-400/20' },
        green: { bg: 'bg-green-500/10', gradient: 'from-green-500 to-green-600', text: 'text-green-400', border: 'border-green-400/20' },
        teal: { bg: 'bg-teal-500/10', gradient: 'from-teal-500 to-teal-600', text: 'text-teal-400', border: 'border-teal-400/20' },
    };
    const colors = colorMap[goalContext.color] ?? colorMap.orange;

    // Goal-themed cover photo for the card. Falls back to the rest-day
    // cover when today is a rest day, or to the generic workout-hero
    // when the goal isn't recognized.
    const coverByGoal: Record<string, string> = {
        fat_loss:    '/workout-covers/goal-fat-loss.jpg',
        muscle_gain: '/workout-covers/goal-muscle-gain.jpg',
        strength:    '/workout-covers/goal-strength.jpg',
        recomp:      '/workout-covers/goal-recomp.jpg',
        maintenance: '/workout-covers/goal-maintenance.jpg',
        endurance:   '/workout-covers/goal-endurance.jpg',
    };
    const coverUrl = isRestDay
        ? '/workout-covers/goal-rest.jpg'
        : (coverByGoal[activeProgram.goal] ?? '/workout-hero.jpg');

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className={`clay-card relative overflow-hidden ${colors.border} border animate-in fade-in duration-500`}>
            {/* Goal-themed cover photo backdrop — sits behind everything at low
                opacity so card content stays the focus. The dark overlay
                ensures text legibility regardless of cover brightness. */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 60%, rgba(0,0,0,0.92) 100%), url(${coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Header */}
            <div className="relative p-4 pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', colors.bg)}>
                            <GoalIcon className={colors.text} size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-on-surface text-sm">{activeProgram.programName}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-on-surface-variant">{activeProgram.split}</span>
                                <span className="text-on-surface-variant/40">•</span>
                                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                                    <Repeat size={10} />
                                    {isAr ? `الدورة ${activeProgram.currentCycle}` : `Cycle ${activeProgram.currentCycle}`}
                                </span>
                                {activeProgram.assignedByCoach && (
                                    <span className="text-[10px] text-primary flex items-center gap-0.5">
                                        <Lock size={9} />
                                        {isAr ? 'من المدرب' : 'Coach'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Delete button */}
                    {canDelete && !showDeleteConfirm && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-on-surface-variant/60 hover:text-red-400 transition-colors p-1"
                            title={isAr ? 'حذف البرنامج' : 'Delete program'}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Mini rotation (10 dots) */}
            <div className="relative px-4 pb-3">
                <div className="flex items-center gap-1">
                    {activeProgram.rotation.map(day => {
                        const isDone = activeProgram.completedDays.includes(day.dayNumber);
                        const isCurrent = day.dayNumber === todaysDayNumber;
                        const isRest = day.type === 'rest';

                        return (
                            <div
                                key={day.dayNumber}
                                className={clsx(
                                    'flex-1 h-2 rounded-full transition-all',
                                    isDone
                                        ? `bg-gradient-to-r ${colors.gradient}`
                                        : isCurrent
                                        ? 'bg-primary animate-pulse'
                                        : isRest
                                        ? 'bg-surface-container'
                                        : 'bg-surface-container/50'
                                )}
                                title={`${isAr ? 'يوم' : 'Day'} ${day.dayNumber}: ${day.label}`}
                            />
                        );
                    })}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-on-surface-variant/60">
                        {isAr ? `${completedCount}/${totalDays} مكتمل` : `${completedCount}/${totalDays} complete`}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/60">{progressPercent}%</span>
                </div>
            </div>

            {/* Today's action */}
            <div className="relative px-4 pb-4">
                <button
                    onClick={() => navigate(`/workouts/day/${todaysDayNumber}`)}
                    className={clsx(
                        'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                        isRestDay
                            ? 'bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-300 border border-indigo-400/20'
                            : 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/10 hover:shadow-primary/20'
                    )}
                >
                    {isRestDay ? (
                        <>
                            <Moon size={16} />
                            {isAr
                                ? `اليوم ${todaysDayNumber}: ${todaysDay?.restDayType === 'active_recovery' ? 'تعافي نشط' : 'يوم راحة'}`
                                : `Day ${todaysDayNumber}: ${todaysDay?.restDayType === 'active_recovery' ? 'Active Recovery' : 'Rest Day'}`
                            }
                        </>
                    ) : (
                        <>
                            <Play size={16} />
                            {isAr
                                ? `ابدأ تمرين اليوم ${todaysDayNumber}`
                                : `Start Today's Workout — Day ${todaysDayNumber}`
                            }
                        </>
                    )}
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Delete confirmation */}
            {showDeleteConfirm && (
                <div className="relative px-4 pb-4 animate-in fade-in duration-200">
                    <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                            <div className="flex-1">
                                <p className="text-sm text-red-300 font-medium">
                                    {isAr ? 'حذف هذا البرنامج؟' : 'Delete this program?'}
                                </p>
                                <p className="text-xs text-red-400/60 mt-1">
                                    {isAr ? 'سيتم فقدان كل التقدم.' : 'All progress will be lost.'}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold transition-colors"
                                    >
                                        {isDeleting ? '...' : (isAr ? 'نعم، احذف' : 'Yes, Delete')}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-1.5 rounded-lg bg-surface-container text-on-surface/70 text-xs font-medium"
                                    >
                                        {isAr ? 'إلغاء' : 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
