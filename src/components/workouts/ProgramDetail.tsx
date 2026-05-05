/**
 * ProgramDetail — 10-day rotation preview with assign button.
 */

import { TrainingProgram } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getDifficulty, getGoalContext } from '../../data/programUtils';
import {
    Dumbbell, Moon, Activity, Calendar, ArrowLeft,
    Flame, TrendingUp, Shield, RotateCcw, Heart,
} from 'lucide-react';
import clsx from 'clsx';

interface ProgramDetailProps {
    program: TrainingProgram;
    onAssign?: () => void;
    onBack: () => void;
    readOnly?: boolean;
}

const GOAL_ICONS = {
    fat_loss: Flame,
    muscle_gain: TrendingUp,
    strength: Shield,
    recomp: RotateCcw,
    maintenance: Heart,
    endurance: Activity,
};

export const ProgramDetail = ({ program, onAssign, onBack, readOnly }: ProgramDetailProps) => {
    const { lang, isRTL } = useLanguage();
    const isAr = lang === 'ar';
    const goalContext = getGoalContext(program.goal);
    const difficulty = getDifficulty(program);
    const GoalIcon = GOAL_ICONS[program.goal];
    const workoutDays = program.rotation.filter(d => d.type === 'workout').length;
    const restDays = program.rotation.filter(d => d.type === 'rest').length;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-5 animate-in fade-in duration-300">
            {/* Back */}
            <button onClick={onBack} className="flex items-center gap-2 text-on-surface/70 hover:text-on-surface transition-colors">
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">{isAr ? 'رجوع' : 'Back'}</span>
            </button>

            {/* Header */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                    <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                        `bg-${goalContext.color}-500/10`)}>
                        <GoalIcon className={`text-${goalContext.color}-400`} size={28} />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-extrabold text-on-surface">{program.name}</h1>
                        <p className="text-sm text-on-surface/70 mt-1">{program.description}</p>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <span className="px-3 py-1 rounded-lg bg-white/5 text-xs font-medium text-on-surface">
                                {program.split}
                            </span>
                            <span className={clsx('px-3 py-1 rounded-lg text-xs font-bold',
                                difficulty === 'beginner' ? 'bg-green-500/15 text-green-300' :
                                difficulty === 'intermediate' ? 'bg-yellow-500/15 text-yellow-300' :
                                'bg-red-500/15 text-red-300'
                            )}>
                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </span>
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                                <Dumbbell size={12} /> {workoutDays} {isAr ? 'تمرين' : 'sessions'}
                            </span>
                            <span className="text-xs text-on-surface-variant/60 flex items-center gap-1">
                                <Moon size={12} /> {restDays} {isAr ? 'راحة' : 'rest'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Training Rules */}
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl p-4">
                <h3 className="text-xs font-bold uppercase text-primary tracking-wider mb-3">
                    {isAr ? 'قواعد التدريب' : 'Training Rules'}
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {program.rules.map((rule, i) => (
                        <li key={i} className="text-xs text-on-surface/70 flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{rule}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 10-Day Rotation */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {isAr ? 'جدول 10 أيام' : '10-Day Rotation'}
                </h3>

                {program.rotation.map(day => {
                    const isRest = day.type === 'rest';
                    const isActiveRecovery = day.restDayType === 'active_recovery';

                    return (
                        <div
                            key={day.dayNumber}
                            className={clsx(
                                'flex items-center gap-4 p-3 rounded-xl border',
                                isRest
                                    ? (isActiveRecovery ? 'bg-emerald-900/10 border-emerald-400/10' : 'bg-surface-container-low/30 border-white/[0.02]')
                                    : 'bg-white/[0.03] border-white/[0.04]'
                            )}
                        >
                            <div className={clsx(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                isRest
                                    ? (isActiveRecovery ? 'bg-emerald-900/30' : 'bg-surface-container/50')
                                    : 'bg-gradient-to-br from-primary/20 to-primary-container/10 border border-primary/20'
                            )}>
                                <span className={clsx('text-sm font-bold',
                                    isRest
                                        ? (isActiveRecovery ? 'text-emerald-500' : 'text-on-surface-variant/60')
                                        : 'text-primary'
                                )}>{day.dayNumber}</span>
                            </div>

                            {isRest ? (
                                <>
                                    {isActiveRecovery ? <Activity className="text-emerald-400/60" size={18} /> : <Moon className="text-indigo-400/60" size={18} />}
                                    <span className={clsx('text-sm font-medium italic',
                                        isActiveRecovery ? 'text-emerald-400/80' : 'text-on-surface-variant'
                                    )}>
                                        {isActiveRecovery
                                            ? (isAr ? 'تعافي نشط — حركة خفيفة وتمدد' : 'Active Recovery — Light Movement & Stretching')
                                            : (isAr ? 'يوم راحة — تعافي وتغذية' : 'Rest Day — Recovery & Nutrition Focus')
                                        }
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Dumbbell className="text-primary" size={18} />
                                    <span className="text-on-surface font-medium text-sm">{day.label}</span>
                                    {day.cnsLoad && day.cnsLoad >= 3 && (
                                        <div className="flex items-center gap-0.5 ms-auto shrink-0" title={`CNS Load: ${day.cnsLoad}/5`}>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className={clsx('w-1.5 h-1.5 rounded-full',
                                                    i < (day.cnsLoad || 0)
                                                        ? ((day.cnsLoad || 0) >= 4 ? 'bg-red-400' : 'bg-amber-400')
                                                        : 'bg-surface-container-high'
                                                )} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action buttons */}
            {!readOnly && onAssign && (
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-highest transition-colors"
                    >
                        {isAr ? '← رجوع' : '← Back'}
                    </button>
                    <button
                        onClick={onAssign}
                        className="flex-1 py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isAr ? '✓ اختر هذا البرنامج' : '✓ Assign This Program'}
                    </button>
                </div>
            )}
        </div>
    );
};
