/**
 * ProgramCard — Displays program summary in wizard and browse mode.
 */

import { TrainingProgram, Difficulty } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getDifficulty } from '../../data/programUtils';
import {
    Dumbbell, Moon, Repeat, Star, Clock,
    Flame, TrendingUp, Shield, RotateCcw, Heart, Activity,
} from 'lucide-react';
import clsx from 'clsx';

interface ProgramCardProps {
    program: TrainingProgram;
    isRecommended?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    compact?: boolean;
}

const GOAL_ICONS = {
    fat_loss: Flame,
    muscle_gain: TrendingUp,
    strength: Shield,
    recomp: RotateCcw,
    maintenance: Heart,
    endurance: Activity,
};

const GOAL_COLORS = {
    fat_loss: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-400/30' },
    muscle_gain: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-400/30' },
    strength: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-400/30' },
    recomp: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-400/30' },
    maintenance: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-400/30' },
    endurance: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-400/30' },
};

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string }> = {
    beginner: { bg: 'bg-green-500/15', text: 'text-green-300' },
    intermediate: { bg: 'bg-yellow-500/15', text: 'text-yellow-300' },
    advanced: { bg: 'bg-red-500/15', text: 'text-red-300' },
};

export const ProgramCard = ({ program, isRecommended, isSelected, onClick, compact }: ProgramCardProps) => {
    const { lang, isRTL } = useLanguage();
    const isAr = lang === 'ar';

    const difficulty = getDifficulty(program);
    const workoutDays = program.rotation.filter(d => d.type === 'workout').length;
    const restDays = program.rotation.filter(d => d.type === 'rest').length;
    const goalColors = GOAL_COLORS[program.goal];
    const diffColors = DIFFICULTY_COLORS[difficulty];
    const GoalIcon = GOAL_ICONS[program.goal];

    // Estimate average duration (rough: ~55 min per session)
    const avgDuration = Math.round(55 * workoutDays / workoutDays);

    // Goal-themed cover photo. The card is small so we use it as a low-
    // opacity backdrop rather than a hero strip, keeping the dense info
    // layout legible while still tying the card visually to the goal.
    const goalCovers: Record<string, string> = {
        fat_loss:    '/workout-covers/goal-fat-loss.jpg',
        muscle_gain: '/workout-covers/goal-muscle-gain.jpg',
        strength:    '/workout-covers/goal-strength.jpg',
        recomp:      '/workout-covers/goal-recomp.jpg',
        maintenance: '/workout-covers/goal-maintenance.jpg',
        endurance:   '/workout-covers/goal-endurance.jpg',
    };
    const cover = goalCovers[program.goal];

    return (
        <div
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={onClick}
            className={clsx(
                'relative rounded-2xl border p-4 transition-all overflow-hidden',
                onClick && 'cursor-pointer',
                isSelected
                    ? 'bg-orange-500/15 border-orange-400 ring-2 ring-orange-400 shadow-lg shadow-orange-400/10'
                    : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.1]',
            )}
        >
            {/* Goal-themed backdrop — low opacity so it tints the card
                without overwhelming the content. */}
            {cover && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.85)), url(${cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}

            {/* Recommended badge */}
            {isRecommended && (
                <div className="absolute z-10 -top-2.5 start-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary text-[10px] font-bold uppercase tracking-wider">
                    <Star size={10} />
                    {isAr ? 'موصى' : 'Recommended'}
                </div>
            )}

            <div className="relative flex items-start gap-3">
                {/* Goal icon */}
                <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', goalColors.bg)}>
                    <GoalIcon className={goalColors.text} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title + split */}
                    <h3 className="font-bold text-on-surface text-sm truncate">{program.name}</h3>
                    {!compact && (
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{program.description}</p>
                    )}

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={clsx('px-2 py-0.5 rounded-md text-[10px] font-bold', diffColors.bg, diffColors.text)}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </span>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <Repeat size={10} /> 10 {isAr ? 'يوم' : 'days'}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Dumbbell size={10} /> {workoutDays} {isAr ? 'تمرين' : 'sessions'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1">
                            <Moon size={10} /> {restDays} {isAr ? 'راحة' : 'rest'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <Clock size={10} /> ~{avgDuration}m
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
