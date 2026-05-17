/**
 * WorkoutWizard — 5-step program selection wizard.
 *
 * Step 1: Goal selection (6 cards, 2×3 grid)
 * Step 2: Difficulty selection (3 vertical cards)
 * Step 3: Split selection (filtered, with recommended badge)
 * Step 4: Program preview (ProgramDetail read-only)
 * Step 5: Confirmation + save
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import {
    getGoalContext, getAvailableSplits, GOAL_DESCRIPTIONS, DIFFICULTY_DESCRIPTIONS,
} from '../../data/programUtils';
import { ProgramDetail } from './ProgramDetail';
import { ProgramCard } from './ProgramCard';
import { WorkoutGoal, Difficulty, TrainingProgram, UserActiveProgram } from '../../types';
import {
    ArrowLeft, ArrowRight, Rocket, Flame, TrendingUp,
    Shield, RotateCcw, Heart, Activity, ChevronRight,
    Sparkles, Trophy,
} from 'lucide-react';
import clsx from 'clsx';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const GOAL_ORDER: WorkoutGoal[] = ['fat_loss', 'muscle_gain', 'strength', 'recomp', 'maintenance', 'endurance'];

const GOAL_ICONS = {
    fat_loss: Flame,
    muscle_gain: TrendingUp,
    strength: Shield,
    recomp: RotateCcw,
    maintenance: Heart,
    endurance: Activity,
};

const GOAL_COLORS: Record<WorkoutGoal, string> = {
    fat_loss: 'orange',
    muscle_gain: 'blue',
    strength: 'red',
    recomp: 'purple',
    maintenance: 'green',
    endurance: 'teal',
};

// Cover image per goal — lives under /public/workout-covers/. Filenames
// use hyphens, not the underscore goal ids. Files are pre-bundled into
// the deploy so the <img> tag below doesn't trigger an extra network
// round-trip; the browser fetches them in parallel with the page chunk.
const GOAL_IMAGES: Record<WorkoutGoal, string> = {
    fat_loss: '/workout-covers/goal-fat-loss.jpg',
    muscle_gain: '/workout-covers/goal-muscle-gain.jpg',
    strength: '/workout-covers/goal-strength.jpg',
    recomp: '/workout-covers/goal-recomp.jpg',
    maintenance: '/workout-covers/goal-maintenance.jpg',
    endurance: '/workout-covers/goal-endurance.jpg',
};

interface WorkoutWizardProps {
    /**
     * If set, the wizard saves the program to `userPrograms/{targetUserId}` instead
     * of the signed-in user's. Used by coaches to assign a full program to a client.
     * Coach-assigned programs have `assignedByCoach: true` so the client can't delete them.
     */
    targetUserId?: string;
    /** Called after a successful save (coach flow uses this to close the modal). */
    onAssigned?: () => void;
}

export const WorkoutWizard = ({ targetUserId, onAssigned }: WorkoutWizardProps = {}) => {
    const navigate = useNavigate();
    const { lang, isRTL } = useLanguage();
    const { user } = useAuth();
    const { save } = useActiveProgram();
    const isAr = lang === 'ar';
    const isCoachFlow = !!targetUserId;

    const [step, setStep] = useState<WizardStep>(1);
    const [selectedGoal, setSelectedGoal] = useState<WorkoutGoal | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Available splits for step 3
    const availableSplits = selectedGoal && selectedDifficulty
        ? getAvailableSplits(selectedGoal, selectedDifficulty)
        : [];

    const handleGoalSelect = (goal: WorkoutGoal) => {
        setSelectedGoal(goal);
        setSelectedDifficulty(null);
        setSelectedProgram(null);
    };

    const handleDifficultySelect = (diff: Difficulty) => {
        setSelectedDifficulty(diff);
        setSelectedProgram(null);
    };

    const handleSplitSelect = (program: TrainingProgram) => {
        setSelectedProgram(program);
    };

    const handleAssign = async () => {
        if (!user || !selectedGoal || !selectedDifficulty || !selectedProgram) return;

        setIsSaving(true);

        const ownerUid = targetUserId ?? user.id;
        const activeProgram: UserActiveProgram = {
            userId: ownerUid,
            programId: selectedProgram.id,
            programName: selectedProgram.name,
            goal: selectedGoal,
            split: selectedProgram.split,
            difficulty: selectedDifficulty,
            startDate: new Date().toISOString().split('T')[0],
            currentCycle: 1,
            completedDays: [],
            rotation: selectedProgram.rotation,
            assignedByCoach: isCoachFlow,
        };

        if (isCoachFlow) {
            // Coach flow: write directly to the client's userPrograms doc.
            // useActiveProgram's `save` is locked to the signed-in user.
            await setDoc(doc(db, 'userPrograms', ownerUid), {
                ...activeProgram,
                updatedAt: serverTimestamp(),
            });
        } else {
            await save(activeProgram);
        }

        setIsSaving(false);
        setStep(5);
        onAssigned?.();
    };

    const goBack = () => {
        if (step === 1) return;
        setStep((s) => (s - 1) as WizardStep);
    };

    const goNext = () => {
        if (step >= 5) return;
        setStep((s) => (s + 1) as WizardStep);
    };

    // ─── Step 1: Goal Selection ───────────────────────────────

    if (step === 1) {
        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-300">
                <StepHeader
                    step={1}
                    total={4}
                    title={isAr ? 'ما هو هدفك؟' : "What's your goal?"}
                    subtitle={isAr ? 'اختر هدفك الرئيسي من التمرين' : 'Choose your main training objective'}
                    isAr={isAr}
                />

                <div className="grid grid-cols-2 gap-3">
                    {GOAL_ORDER.map(goal => {
                        const ctx = getGoalContext(goal);
                        const desc = GOAL_DESCRIPTIONS[goal];
                        const GoalIcon = GOAL_ICONS[goal];
                        const isSelected = selectedGoal === goal;
                        const color = GOAL_COLORS[goal];
                        const img = GOAL_IMAGES[goal];

                        return (
                            <button
                                key={goal}
                                onClick={() => handleGoalSelect(goal)}
                                className={clsx(
                                    'relative rounded-2xl border text-start transition-all overflow-hidden min-h-[148px]',
                                    isSelected
                                        ? `border-${color}-400 ring-2 ring-${color}-400 shadow-lg`
                                        : 'border-white/[0.06] hover:border-white/[0.15]'
                                )}
                            >
                                {/* Cover image. Loading=lazy because there are
                                    6 of these on a single step and only one
                                    is "above the fold" on mobile. */}
                                <img
                                    src={img}
                                    alt=""
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Bottom-up dark gradient for text legibility.
                                    Selected state adds a tint of the goal color
                                    on top so the chosen card visibly pops. */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: isSelected
                                            ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.90) 100%)'
                                            : 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.70) 60%, rgba(0,0,0,0.92) 100%)',
                                    }}
                                />
                                {/* Content sits above the image+overlay layers */}
                                <div className="relative p-4 flex flex-col h-full">
                                    <div className={clsx(
                                        'w-10 h-10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm',
                                        `bg-${color}-500/30`
                                    )}>
                                        <GoalIcon className={`text-${color}-200`} size={20} />
                                    </div>
                                    <h3 className="font-bold text-white text-sm">
                                        {ctx.emoji} {isAr ? ctx.labelAr : ctx.label}
                                    </h3>
                                    <p className="text-[11px] text-white/85 mt-1 line-clamp-2">
                                        {isAr ? desc.descAr : desc.desc}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={goNext}
                        disabled={!selectedGoal}
                        className={clsx(
                            'px-6 py-3 font-bold flex items-center gap-2 transition-all',
                            selectedGoal
                                ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20'
                                : 'bg-surface-container text-on-surface-variant/60 cursor-not-allowed'
                        )}
                    >
                        {isAr ? 'التالي' : 'Next'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // ─── Step 2: Difficulty Selection ─────────────────────────

    if (step === 2) {
        const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-300">
                <StepHeader
                    step={2}
                    total={4}
                    title={isAr ? 'ما مستواك؟' : "What's your level?"}
                    subtitle={isAr ? 'اختر مستوى خبرتك في التدريب' : 'Choose your training experience level'}
                    isAr={isAr}
                    onBack={goBack}
                />

                <div className="space-y-3">
                    {difficulties.map(diff => {
                        const info = DIFFICULTY_DESCRIPTIONS[diff];
                        const isSelected = selectedDifficulty === diff;
                        const colors = diff === 'beginner'
                            ? { ring: 'ring-green-400', bg: 'bg-green-500/10', border: 'border-green-400', text: 'text-green-400', iconBg: 'bg-green-500/15' }
                            : diff === 'intermediate'
                            ? { ring: 'ring-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-400', text: 'text-yellow-400', iconBg: 'bg-yellow-500/15' }
                            : { ring: 'ring-red-400', bg: 'bg-red-500/10', border: 'border-red-400', text: 'text-red-400', iconBg: 'bg-red-500/15' };

                        const levelEmoji = diff === 'beginner' ? '🌱' : diff === 'intermediate' ? '⚡' : '🔥';

                        return (
                            <button
                                key={diff}
                                onClick={() => handleDifficultySelect(diff)}
                                className={clsx(
                                    'w-full rounded-2xl border p-5 text-start transition-all flex items-center gap-4',
                                    isSelected
                                        ? `${colors.bg} ${colors.border} ring-2 ${colors.ring} shadow-lg`
                                        : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.07]'
                                )}
                            >
                                <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl', colors.iconBg)}>
                                    {levelEmoji}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-on-surface text-lg">
                                        {isAr ? info.labelAr : info.label}
                                    </h3>
                                    <p className="text-sm text-on-surface-variant mt-0.5">
                                        {isAr ? info.descAr : info.desc}
                                    </p>
                                </div>
                                <ChevronRight size={20} className={isSelected ? colors.text : 'text-on-surface-variant/40'} />
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={goNext}
                        disabled={!selectedDifficulty}
                        className={clsx(
                            'clay-button px-6 py-3 font-bold flex items-center gap-2 transition-all',
                            selectedDifficulty
                                ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20'
                                : 'bg-surface-container text-on-surface-variant/60 cursor-not-allowed'
                        )}
                    >
                        {isAr ? 'التالي' : 'Next'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // ─── Step 3: Split Selection ──────────────────────────────

    if (step === 3) {
        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-300">
                <StepHeader
                    step={3}
                    total={4}
                    title={isAr ? 'اختر نظام التقسيم' : 'Choose your split'}
                    subtitle={isAr ? 'الأنظمة المرشحة لهدفك ومستواك' : 'Programs matched to your goal and level'}
                    isAr={isAr}
                    onBack={goBack}
                />

                <div className="space-y-3">
                    {availableSplits.map(({ program, isRecommended }, i) => (
                        <ProgramCard
                            key={program.id}
                            program={program}
                            isRecommended={isRecommended && i === 0}
                            isSelected={selectedProgram?.id === program.id}
                            onClick={() => handleSplitSelect(program)}
                        />
                    ))}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={goNext}
                        disabled={!selectedProgram}
                        className={clsx(
                            'clay-button px-6 py-3 font-bold flex items-center gap-2 transition-all',
                            selectedProgram
                                ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20'
                                : 'bg-surface-container text-on-surface-variant/60 cursor-not-allowed'
                        )}
                    >
                        {isAr ? 'عرض البرنامج' : 'See Program'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // ─── Step 4: Program Preview ──────────────────────────────

    if (step === 4 && selectedProgram) {
        return (
            <div className="animate-in fade-in duration-300">
                <div className="mb-4">
                    <ProgressDots current={4} total={4} />
                </div>
                <ProgramDetail
                    program={selectedProgram}
                    onAssign={handleAssign}
                    onBack={goBack}
                />
                {isSaving && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="clay-card p-8 text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-on-surface font-medium">{isAr ? 'جاري الحفظ...' : 'Setting up your program...'}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Step 5: Confirmation ─────────────────────────────────

    if (step === 5 && selectedProgram && selectedGoal && selectedDifficulty) {
        const goalCtx = getGoalContext(selectedGoal);

        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative">
                    <Trophy className="text-primary" size={64} />
                    <Sparkles className="text-primary-fixed absolute -top-2 -right-2 animate-pulse" size={24} />
                </div>

                <h1 className="text-3xl font-extrabold text-on-surface">
                    {isAr ? '🚀 برنامجك جاهز!' : '🚀 Your program is ready!'}
                </h1>

                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 max-w-sm w-full space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">{isAr ? 'الهدف' : 'Goal'}</span>
                        <span className="text-on-surface font-semibold">
                            {goalCtx.emoji} {isAr ? goalCtx.labelAr : goalCtx.label}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">{isAr ? 'التقسيم' : 'Split'}</span>
                        <span className="text-on-surface font-semibold">{selectedProgram.split}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">{isAr ? 'المستوى' : 'Level'}</span>
                        <span className="text-on-surface font-semibold capitalize">{selectedDifficulty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">{isAr ? 'الدورة' : 'Cycle'}</span>
                        <span className="text-on-surface font-semibold">{isAr ? '10 أيام — تتكرر' : '10 days — repeating'}</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="py-4 px-8 rounded-full font-label text-[12px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                >
                    <Rocket size={22} />
                    {isAr ? 'ابدأ برنامجي 🚀' : 'Start My Program 🚀'}
                </button>
            </div>
        );
    }

    return null;
};

// ─── Helper Components ──────────────────────────────────────

interface StepHeaderProps {
    step: number;
    total: number;
    title: string;
    subtitle: string;
    isAr: boolean;
    onBack?: () => void;
}

const StepHeader = ({ step, total, title, subtitle, isAr, onBack }: StepHeaderProps) => (
    <div>
        <div className="flex items-center justify-between mb-4">
            {onBack ? (
                <button onClick={onBack} className="flex items-center gap-2 text-on-surface/70 hover:text-on-surface transition-colors">
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">{isAr ? 'رجوع' : 'Back'}</span>
                </button>
            ) : (
                <div />
            )}
            <ProgressDots current={step} total={total} />
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface">{title}</h1>
        <p className="text-on-surface-variant text-sm mt-1">{subtitle}</p>
    </div>
);

const ProgressDots = ({ current, total }: { current: number; total: number }) => (
    <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={clsx(
                    'h-1.5 rounded-full transition-all',
                    i + 1 <= current ? 'w-6 bg-primary' : 'w-1.5 bg-surface-container-high'
                )}
            />
        ))}
    </div>
);
