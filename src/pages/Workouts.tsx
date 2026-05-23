import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData }     from '../context/DataContext';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Workout, WorkoutGoal } from '../types';
import { ALL_PROGRAMS, ALL_TRAINING_PROGRAMS } from '../data';
import { getExerciseDetail } from '../data/exerciseLibrary';
import { ExerciseModal } from '../components/workouts/ExerciseModal';
import { ExerciseSections } from '../components/workouts/ExerciseSections';
import { WorkoutEditor }   from '../components/workouts/WorkoutEditor';
import { WorkoutWizard }   from '../components/workouts/WorkoutWizard';
import { ActiveProgramCard } from '../components/workouts/ActiveProgramCard';
import { useActiveProgram } from '../hooks/useActiveProgram';
import {
    Search, Plus, X, Trash2, Edit3, Clock, Dumbbell, ChevronDown, ChevronUp,
    Zap, Target, Award, Moon, Calendar, Repeat, Flame, TrendingUp,
    Shield, RotateCcw, Heart, Activity,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Goal config ──────────────────────────────────────────────

const GOAL_CONFIG: Record<WorkoutGoal, { label: string; color: string; bgColor: string; icon: typeof Flame }> = {
    fat_loss:    { label: 'Fat Loss',    color: 'text-orange-400',  bgColor: 'bg-orange-500/10',  icon: Flame },
    muscle_gain: { label: 'Muscle Gain', color: 'text-blue-400',    bgColor: 'bg-blue-500/10',    icon: TrendingUp },
    strength:    { label: 'Strength',    color: 'text-red-400',     bgColor: 'bg-red-500/10',     icon: Shield },
    recomp:      { label: 'Recomp',      color: 'text-purple-400',  bgColor: 'bg-purple-500/10',  icon: RotateCcw },
    maintenance: { label: 'Maintenance', color: 'text-teal-400',    bgColor: 'bg-teal-500/10',    icon: Heart },
    endurance:   { label: 'Endurance',   color: 'text-cyan-400',    bgColor: 'bg-cyan-500/10',    icon: Activity },
};

// ─── Helpers ──────────────────────────────────────────────────

const totalSets = (w: Workout) => w.exercises.reduce((s, e) => s + e.sets, 0);

// Build a set of all static workout IDs at module load so detection
// doesn't depend on fragile ID prefix patterns.
const STATIC_WORKOUT_IDS = new Set(ALL_TRAINING_PROGRAMS.map(w => w.id));

// True when the workout was saved by a coach (not a static template)
const isCustom = (w: Workout) => !STATIC_WORKOUT_IDS.has(w.id);

const groupItems = <T,>(items: T[], getLabel: (item: T) => string): [string, T[]][] => {
    const grouped = new Map<string, T[]>();
    items.forEach(item => {
        const label = getLabel(item);
        grouped.set(label, [...(grouped.get(label) ?? []), item]);
    });
    return Array.from(grouped.entries());
};

// ─── Component ────────────────────────────────────────────────

export const Workouts = () => {
    const [searchParams] = useSearchParams();
    const {
        workouts, workoutCategories,
        addWorkout, updateWorkout, removeWorkout, addWorkoutCategory,
    } = useData();
    const { user } = useAuth();
    const { t }   = useLanguage();
    const { activeProgram, loading: programLoading } = useActiveProgram();

    const isCoach   = user?.role === 'coach' || user?.role === 'admin';

    // Show wizard for non-coach users without an active program
    const showWizard = !isCoach && !programLoading && !activeProgram;

    // ── View / filter state ────────────────────────────────────
    // viewMode was removed with the Training Programs / Workout
    // Library / Custom tab pills — category cards alone drive what
    // renders now. Each section auto-shows when there's content for
    // the picked category.
    const [search, setSearch]             = useState('');
    // categoryFilter is the active category name, or '' for "nothing
    // selected" (which shows the empty state — pick a category to
    // start browsing). Legacy ?category=All URLs are normalized to ''
    // in the effect below.
    const [categoryFilter, setCategoryFilter] = useState(() => {
        const c = searchParams.get('category') || '';
        return c === 'All' ? '' : c;
    });
    const [goalFilter, setGoalFilter]     = useState<'all' | WorkoutGoal>('all');
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
    const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);

    // ── Editor state ───────────────────────────────────────────
    const [showEditor, setShowEditor]     = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
    const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);

    // ── Category modal state ───────────────────────────────────
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName]     = useState('');

    // URL-driven deep-linking — only `?category=` still matters.
    // `?view=` was removed alongside the view-mode tabs.
    useEffect(() => {
        const category = searchParams.get('category');
        if (category === 'All') setCategoryFilter('');
        else if (category) setCategoryFilter(category);
    }, [searchParams]);

    // ── Editor handlers ────────────────────────────────────────
    const openCreate = () => { setEditingWorkout(null); setShowEditor(true); };
    const openEdit   = (w: Workout) => { setEditingWorkout(w); setShowEditor(true); };
    const handleEditorClose = () => { setShowEditor(false); setEditingWorkout(null); };
    const handleEditorSave  = (data: Omit<Workout, 'id' | 'createdAt'>) => {
        if (editingWorkout) updateWorkout(editingWorkout.id, data);
        else                addWorkout(data);
        setShowEditor(false);
        setEditingWorkout(null);
    };

    const handleDelete = (id: string) => { removeWorkout(id); setConfirmDelete(null); };
    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            addWorkoutCategory(newCategoryName.trim());
            setNewCategoryName('');
            setShowCategoryModal(false);
        }
    };

    // ── Filtered data ──────────────────────────────────────────
    const filteredPrograms = useMemo(() =>
        ALL_PROGRAMS.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                                p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat  = !categoryFilter || p.split === categoryFilter;
            const matchGoal = goalFilter === 'all' || p.goal === goalFilter;
            return matchSearch && matchCat && matchGoal;
        }),
        [search, categoryFilter, goalFilter]
    );

    const libraryWorkouts = useMemo(() =>
        workouts.filter(w => {
            if (isCustom(w)) return false;
            const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                                w.description.toLowerCase().includes(search.toLowerCase());
            const matchCat  = !categoryFilter || w.category === categoryFilter;
            const matchGoal = goalFilter === 'all' || w.goal === goalFilter;
            return matchSearch && matchCat && matchGoal;
        }),
        [workouts, search, categoryFilter, goalFilter]
    );

    const customWorkouts = useMemo(() =>
        workouts.filter(w => {
            if (!isCustom(w)) return false;
            const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                                w.description.toLowerCase().includes(search.toLowerCase());
            const matchCat  = !categoryFilter || w.category === categoryFilter;
            const matchGoal = goalFilter === 'all' || w.goal === goalFilter;
            return matchSearch && matchCat && matchGoal;
        }),
        [workouts, search, categoryFilter, goalFilter]
    );

    const getWorkout = (id: string) => workouts.find(w => w.id === id);

    const groupedPrograms = useMemo(() => groupItems(filteredPrograms, p => p.split), [filteredPrograms]);
    const groupedLibraryWorkouts = useMemo(() => groupItems(libraryWorkouts, w => w.category), [libraryWorkouts]);
    // No "All" bubble — the user picks a specific category to start
    // browsing, otherwise we render the empty state. Removing "All"
    // also leaves an even bubble count (8 → 4 pairs on phone) which
    // grids more nicely than the old odd count.
    const allCategories = Array.from(new Set([
        ...ALL_PROGRAMS.map(p => p.split),
        ...workoutCategories,
        ...workouts.map(w => w.category),
    ]));

    // Per-category count for the bubble. Sum of static programs whose
    // split matches + workout-library entries whose category matches.
    // So "Full Body" surfaces both the Full Body training programs and
    // standalone Full Body workouts as one number — what the user
    // expects to see.
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const cat of allCategories) {
            const programs = ALL_PROGRAMS.filter(p => p.split === cat).length;
            const wks = workouts.filter(w => w.category === cat).length;
            counts[cat] = programs + wks;
        }
        return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workouts, allCategories.join('|')]);

    const handleCategoryFilter = (cat: string) => {
        // viewMode auto-switching went away with the tab pills — each
        // section auto-renders when it has matching content for the
        // chosen category, so the user doesn't have to think about
        // which "view" their picked category lives in.
        setCategoryFilter(cat);
    };

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">

            {/* ── Workout Wizard (non-coach, no active program) ── */}
            {showWizard && (
                <WorkoutWizard />
            )}

            {/* ── Active Program Banner (non-coach, has program) ── */}
            {!isCoach && activeProgram && (
                <ActiveProgramCard />
            )}

            {/* ── Full browse view (always for coach, below wizard/program for clients) ── */}

            {/* ── Page header ──────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between gap-6 bg-surface-container-low rounded-2xl p-6 md:p-8 ghost-border">
                <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">{t('trainingHubEyebrow')}</span>
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tighter">{t('workoutsTitle')}</h1>
                    <p className="text-on-surface/60 font-body mt-3 max-w-lg">
                        {isCoach
                            ? t('workoutsCoachSubtitle')
                            : t('workoutsCommunitySubtitle')}
                    </p>
                </div>
                <div className="flex flex-col gap-3 justify-end">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 pointer-events-none" size={18} />
                        <input
                            type="text"
                            placeholder={t('searchWorkouts')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full sm:w-64 bg-surface-container-lowest rounded-xl pl-11 pr-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30 border-none outline-none focus:ring-1 focus:ring-primary/30"
                        />
                    </div>
                    {isCoach && (
                        <div className="flex gap-3">
                            <button
                                onClick={openCreate}
                                className="flex-1 py-3 flex items-center justify-center gap-2 text-on-primary font-bold font-label text-[10px] uppercase tracking-widest rounded-xl bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] border border-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Plus size={16} /> {t('newWorkout')}
                            </button>
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="flex-1 py-3 flex items-center justify-center gap-2 text-primary font-bold font-label text-[10px] uppercase tracking-widest rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus size={16} /> {t('categoryNoun')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View-mode tabs (Training Programs / Workout Library /
                Custom Workouts) were removed — founder direction is
                that the category cards alone drive filtering. When a
                category is selected, every section that has matching
                content for that category renders below. */}

            {/* ── Categories + (scoped) Goal filter ─────────────
                Bubble grid replaces the old card grid. The "All"
                bubble was removed: it was visually heaviest but
                semantically meant "nothing selected", which is
                confusing, and removing it leaves an even bubble count
                that pairs cleanly across rows. To reset the filter,
                use the "Show all" link in the header.

                Goals filter is hidden until a category is selected.
                Picking "Push / Pull / Legs" reveals the goal chips
                scoped to that category — "Filter goals in Push /
                Pull / Legs" — instead of a global goal strip that
                competed with the category bubble grid for attention. */}
            <div className="bg-surface-container-low rounded-2xl p-6 ghost-border space-y-6">
                <div>
                    <div className="flex items-baseline justify-between gap-3 mb-4">
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block">{t('filterByCategory')}</span>
                        {categoryFilter && (
                            <button
                                onClick={() => handleCategoryFilter('')}
                                className="text-[10px] font-label font-bold uppercase tracking-widest text-primary hover:underline"
                            >
                                Show all
                            </button>
                        )}
                    </div>
                    {/* Swipeable horizontal carousel. CSS scroll-snap
                        gives the native iOS-style snap-to-bubble feel
                        without any gesture library — the browser
                        handles inertia, momentum, snap points, and
                        rubber-banding for free.

                        Layout:
                        - Container is `overflow-x-auto snap-x mandatory`
                        - Each bubble is `snap-center shrink-0`
                        - Edge padding (px-1/2 of container minus 1/2
                          of bubble) lets the first and last bubble
                          center themselves when scrolled to either end
                        - Fade-out gradients on each edge hint that
                          there's more content beyond the viewport
                        - Scrollbar hidden visually (-ms-overflow-style
                          + ::-webkit-scrollbar:none via global CSS)
                          so the swipe feels like one continuous gesture.

                        Why a carousel beats the previous grid:
                        - On a 360px phone, 4 fixed columns are too
                          cramped; 2 cols wastes a lot of vertical
                          space when there are 8+ categories
                        - Native swipe is the muscle memory people
                          have from iOS App Library, Apple Watch home,
                          and every modern picker
                        - One bubble is always "in focus" (centered),
                          which matches the Apple Watch metaphor the
                          founder originally asked for. */}
                    <CategoryCarousel
                        categories={allCategories}
                        counts={categoryCounts}
                        activeFilter={categoryFilter}
                        onPick={handleCategoryFilter}
                    />
                </div>

                {/* Goal filter — only when a category is picked.
                    Without a category selected, goal filtering has
                    nothing to scope (the list area is empty anyway),
                    so showing the chips would just be decoration. */}
                {categoryFilter && (
                    <div className="bzt-rise-in" style={{ animationDelay: '40ms' }}>
                        <div className="border-t border-outline-variant/20 pt-5">
                            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-3">
                                Filter goals in <span className="text-primary">{categoryFilter}</span>
                            </span>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setGoalFilter('all')}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg text-xs font-headline font-bold transition-colors border',
                                        goalFilter === 'all' ? 'bg-surface-container-highest text-on-surface border-outline-variant/50' : 'bg-surface-container-lowest text-on-surface/50 border-outline-variant/30 hover:text-on-surface'
                                    )}
                                >
                                    All Goals
                                </button>
                                {(Object.keys(GOAL_CONFIG) as WorkoutGoal[]).map(g => {
                                    const GoalIcon = GOAL_CONFIG[g].icon;
                                    return (
                                        <button
                                            key={g}
                                            onClick={() => setGoalFilter(g)}
                                            className={clsx(
                                                'px-4 py-2 rounded-lg text-xs font-headline font-bold transition-colors flex items-center gap-2 border',
                                                goalFilter === g
                                                    ? `${GOAL_CONFIG[g].bgColor} ${GOAL_CONFIG[g].color} border-current/20`
                                                    : 'bg-surface-container-lowest text-on-surface/50 border-outline-variant/30 hover:text-on-surface hover:bg-surface-container'
                                            )}
                                        >
                                            <GoalIcon size={14} /> {GOAL_CONFIG[g].label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════
                EMPTY STATE — when no category is picked, the list
                area stays quiet on purpose. Founder direction:
                user should see only their active program + the
                category cards. Picking a card opens the matching
                list (programs / library / custom) below.
            ════════════════════════════════════════════════ */}
            {!categoryFilter && (
                <div className="bg-surface-container-low rounded-2xl p-10 md:p-16 text-center ghost-border">
                    <Dumbbell size={36} className="mx-auto mb-4 text-on-surface/30" />
                    <h3 className="font-headline font-extrabold text-lg text-on-surface mb-2">
                        Pick a category to browse
                    </h3>
                    <p className="text-on-surface/55 font-body text-sm max-w-md mx-auto">
                        Tap one of the bubbles above (Full Body, PPL, Stretching, …) to see
                        the programs and workouts inside it.
                    </p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                TRAINING PROGRAMS VIEW
                Only renders when a category is selected AND there's
                at least one program in that category — keeps the
                page quiet if the user picked a category that's
                only represented in the library.
            ════════════════════════════════════════════════ */}
            {!!categoryFilter && filteredPrograms.length > 0 && (
                <div className="space-y-8">
                    {groupedPrograms.map(([split, programs]) => (
                        <section key={split} className="space-y-4">
                            <div className="flex items-center justify-between gap-4 px-1">
                                <div>
                                    <h2 className="text-lg font-headline font-extrabold text-on-surface">{split}</h2>
                                    <p className="text-xs font-body text-on-surface/45">{programs.length} programs</p>
                                </div>
                                <span className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 border border-outline-variant/30">
                                    {split}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                    {programs.map(program => {
                        const isExpanded  = expandedProgram === program.id;
                        const goalConfig  = GOAL_CONFIG[program.goal];
                        const GoalIcon    = goalConfig.icon;
                        const workoutDays = program.rotation.filter(d => d.type === 'workout').length;
                        const restDays    = program.rotation.filter(d => d.type === 'rest').length;

                        return (
                            <div key={program.id} className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden transition-all duration-300">
                                {/* Program header */}
                                <div
                                    className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-surface-container/30 transition-colors"
                                    onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                                >
                                    <div className="flex items-center gap-5 flex-1">
                                        <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-current/10', goalConfig.bgColor, goalConfig.color)}>
                                            <GoalIcon size={32} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-headline font-extrabold text-on-surface text-2xl tracking-tight mb-1">{program.name}</h3>
                                            <p className="text-sm font-body text-on-surface/60 line-clamp-2">{program.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                        <span className="bg-surface-container-highest px-3 py-1.5 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/70 border border-outline-variant/30">{program.split}</span>
                                        <span className={clsx('px-3 py-1.5 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest border border-current/20', goalConfig.bgColor, goalConfig.color)}>
                                            {goalConfig.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-on-surface/60 font-body text-sm ml-2"><Repeat size={16} className="text-on-surface/40" /> 10 days</div>
                                        <div className="flex items-center gap-1.5 text-emerald-400 font-body text-sm font-medium ml-2"><Dumbbell size={16} className="opacity-80" /> {workoutDays}</div>
                                        <div className="flex items-center gap-1.5 text-on-surface/40 font-body text-sm ml-2"><Moon size={16} /> {restDays}</div>
                                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center ml-2 border border-outline-variant/30 text-on-surface/60">
                                            {isExpanded
                                                ? <ChevronUp size={20} className="text-primary" />
                                                : <ChevronDown size={20} />
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded: 10-day rotation */}
                                {isExpanded && (
                                    <div className="border-t border-outline-variant/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Training rules */}
                                        <div className="px-6 md:px-8 pt-6 pb-4">
                                            <div className="bg-surface-container-lowest p-6 rounded-2xl ghost-border">
                                                <h4 className="text-[10px] font-label font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                                    <Zap size={14} /> Training Rules
                                                </h4>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {program.rules.map((rule, i) => (
                                                        <li key={i} className="text-sm font-body text-on-surface/70 flex items-start gap-3">
                                                            <span className="text-primary mt-0.5">•</span> {rule}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* 10-day grid */}
                                        <div className="px-6 md:px-8 pb-8">
                                            <h4 className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 mt-6 mb-4 flex items-center gap-2">
                                                <Calendar size={14} /> 10-Day Rotation
                                            </h4>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                            {program.rotation.map(day => {
                                                if (day.type === 'rest') {
                                                    const isActive = day.restDayType === 'active_recovery';
                                                    return (
                                                        <div key={day.dayNumber} className={clsx(
                                                            'flex items-center gap-5 p-4 rounded-xl border',
                                                            isActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-container-lowest border-outline-variant/30'
                                                        )}>
                                                            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border', isActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surface-container border-outline-variant/30')}>
                                                                <span className={clsx('text-base font-headline font-bold', isActive ? 'text-emerald-400' : 'text-on-surface/40')}>{day.dayNumber}</span>
                                                            </div>
                                                            {isActive ? <Activity className="text-emerald-400" size={20} /> : <Moon className="text-on-surface/30" size={20} />}
                                                            <span className={clsx('text-sm font-body font-medium italic', isActive ? 'text-emerald-400/80' : 'text-on-surface/50')}>
                                                                {isActive ? 'Active Recovery — Light Movement, Stretching & Mobility' : 'Rest Day — Recovery & Nutrition Focus'}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                const workout = getWorkout(day.workoutId || '');
                                                const isWorkoutExpanded = expandedWorkout === day.workoutId;

                                                return (
                                                    <div key={day.dayNumber} className="rounded-xl border border-outline-variant/30 overflow-hidden bg-surface-container-lowest">
                                                        {/* Workout row */}
                                                        <div
                                                            className={clsx('flex items-center gap-5 p-4 cursor-pointer transition-colors', isWorkoutExpanded ? 'bg-surface-container' : 'hover:bg-surface-container/50')}
                                                            onClick={() => setExpandedWorkout(isWorkoutExpanded ? null : (day.workoutId || null))}
                                                        >
                                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                                <span className="text-base font-headline font-bold text-primary">{day.dayNumber}</span>
                                                            </div>
                                                            <Dumbbell className="text-primary hidden sm:block" size={20} />
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-on-surface font-headline font-bold text-base">{day.label}</span>
                                                                {workout && <span className="text-on-surface/50 font-body text-sm ml-2">— {workout.name}</span>}
                                                            </div>
                                                            {/* CNS load bars */}
                                                            {day.cnsLoad && day.cnsLoad >= 3 && (
                                                                <div className="flex items-center gap-1 shrink-0" title={`CNS Load: ${day.cnsLoad}/5`}>
                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                        <div key={i} className={clsx('w-2 h-2 rounded-full',
                                                                            i < (day.cnsLoad || 0)
                                                                                ? ((day.cnsLoad || 0) >= 4 ? 'bg-red-400' : 'bg-primary')
                                                                                : 'bg-surface-container-highest'
                                                                        )} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-4 shrink-0">
                                                                {workout && (
                                                                    <>
                                                                        <span className="text-on-surface/50 font-label text-[10px] font-bold uppercase tracking-widest hidden md:flex items-center gap-1.5"><Clock size={14} />{workout.estimatedMinutes}m</span>
                                                                        <span className="text-on-surface/50 font-label text-[10px] font-bold uppercase tracking-widest hidden md:flex items-center gap-1.5"><Target size={14} />{workout.exercises.length} ex</span>
                                                                        <span className="text-on-surface/50 font-label text-[10px] font-bold uppercase tracking-widest hidden md:flex items-center gap-1.5"><Zap size={14} />{totalSets(workout)} sets</span>
                                                                    </>
                                                                )}
                                                                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30 text-on-surface/60">
                                                                    {isWorkoutExpanded
                                                                        ? <ChevronUp size={16} className="text-primary" />
                                                                        : <ChevronDown size={16} />
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded: ExerciseCards */}
                                                        {isWorkoutExpanded && workout && (
                                                            <div className="border-t border-outline-variant/30 p-6 animate-in fade-in duration-300 bg-surface-container/30">
                                                                <ExerciseSections exercises={workout.exercises} onExerciseClick={exercise => setSelectedExerciseName(exercise.name)} />
                                                                <div className="flex gap-8 mt-6 pt-6 border-t border-outline-variant/30">
                                                                    <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                                        <Award className="text-primary" size={16} />
                                                                        <strong className="text-on-surface">{workout.exercises.length}</strong> exercises
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                                        <Zap className="text-primary" size={16} />
                                                                        <strong className="text-on-surface">{totalSets(workout)}</strong> total sets
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                                        <Clock className="text-primary" size={16} />
                                                                        ~<strong className="text-on-surface">{workout.estimatedMinutes}</strong> min
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                            </div>
                        </section>
                    ))}
                    {filteredPrograms.length === 0 && (
                        <div className="text-center py-24 bg-surface-container-low rounded-2xl ghost-border p-8">
                            <Calendar className="text-on-surface/20 mx-auto mb-6" size={48} />
                            <p className="text-on-surface/70 font-headline font-bold text-xl mb-2">{t('noProgramsFound')}</p>
                            <p className="text-on-surface/40 font-body text-sm">{t('noProgramsFoundHint')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                WORKOUT LIBRARY VIEW
                Static stretching / standalone workouts. Same render
                gate: only when a category is selected AND there's
                content for it.
            ════════════════════════════════════════════════ */}
            {!!categoryFilter && libraryWorkouts.length > 0 && (
                <div className="space-y-8">
                    {groupedLibraryWorkouts.map(([category, items]) => (
                        <section key={category} className="space-y-4">
                            <div className="flex items-center justify-between gap-4 px-1">
                                <div>
                                    <h2 className="text-lg font-headline font-extrabold text-on-surface">{category}</h2>
                                    <p className="text-xs font-body text-on-surface/45">{items.length} sessions</p>
                                </div>
                                <span className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 border border-outline-variant/30">
                                    {category}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {items.map(workout => {
                                    const isExpanded = expandedWorkout === workout.id;
                                    const goalConfig = GOAL_CONFIG[workout.goal];
                                    const GoalIcon = goalConfig.icon;

                                    return (
                                        <div key={workout.id} className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden transition-all duration-300">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                                                className="w-full p-5 flex items-start justify-between gap-4 text-left hover:bg-surface-container/30 transition-colors"
                                            >
                                                <div className="flex items-start gap-4 min-w-0">
                                                    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-current/10', goalConfig.bgColor, goalConfig.color)}>
                                                        <GoalIcon size={22} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-headline font-extrabold text-on-surface text-lg leading-tight mb-1">{workout.name}</h3>
                                                        <p className="text-sm font-body text-on-surface/55 line-clamp-2">{workout.description}</p>
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <span className="bg-surface-container-highest px-2.5 py-1 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 border border-outline-variant/30">{workout.category}</span>
                                                            <span className={clsx('px-2.5 py-1 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest border border-current/20', goalConfig.bgColor, goalConfig.color)}>
                                                                {goalConfig.label}
                                                            </span>
                                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 border border-outline-variant/30">
                                                                {workout.estimatedMinutes}m
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 text-on-surface/60 shrink-0">
                                                    {isExpanded ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} />}
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-outline-variant/30 p-5 bg-surface-container-lowest animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <ExerciseSections exercises={workout.exercises} onExerciseClick={exercise => setSelectedExerciseName(exercise.name)} />
                                                    <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t border-outline-variant/30">
                                                        <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                            <Award className="text-primary" size={16} />
                                                            <strong className="text-on-surface">{workout.exercises.length}</strong> exercises
                                                        </div>
                                                        <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                            <Zap className="text-primary" size={16} />
                                                            <strong className="text-on-surface">{totalSets(workout)}</strong> total sets
                                                        </div>
                                                        <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                            <Clock className="text-primary" size={16} />
                                                            ~<strong className="text-on-surface">{workout.estimatedMinutes}</strong> min
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    {libraryWorkouts.length === 0 && (
                        <div className="text-center py-24 bg-surface-container-low rounded-2xl ghost-border p-8">
                            <Dumbbell className="text-on-surface/20 mx-auto mb-6" size={48} />
                            <p className="text-on-surface/70 font-headline font-bold text-xl mb-2">No sessions found</p>
                            <p className="text-on-surface/40 font-body text-sm">Try another split, goal, or search term.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Coach-only custom workouts for the selected category. */}
            {isCoach && !!categoryFilter && customWorkouts.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    {customWorkouts.map(workout => {
                        const isExpanded = expandedWorkout === workout.id;
                        const goalConfig = GOAL_CONFIG[workout.goal];
                        return (
                            <div key={workout.id} className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden transition-all duration-300">
                                {/* Workout header */}
                                <div
                                    className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-surface-container/30 transition-colors"
                                    onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                                >
                                    <div className="flex items-center gap-5 flex-1">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface-container border border-outline-variant/30 shrink-0">
                                            <Dumbbell className="text-primary" size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-headline font-extrabold text-on-surface text-2xl tracking-tight mb-1 truncate">{workout.name}</h3>
                                            <p className="text-sm font-body text-on-surface/60 truncate">{workout.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                        <span className="bg-surface-container-highest px-3 py-1.5 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/70 border border-outline-variant/30">{workout.category}</span>
                                        <span className={clsx('px-3 py-1.5 rounded-lg text-[10px] font-label font-bold uppercase tracking-widest border border-current/20', goalConfig.bgColor, goalConfig.color)}>
                                            {goalConfig.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-on-surface/60 font-body text-sm ml-2"><Clock size={16} /> {workout.estimatedMinutes}m</div>
                                        <div className="flex items-center gap-1.5 text-on-surface/60 font-body text-sm ml-2"><Target size={16} /> {workout.exercises.length} ex</div>
                                        <div className="flex items-center gap-1.5 text-on-surface/60 font-body text-sm ml-2"><Zap size={16} /> {totalSets(workout)} sets</div>

                                        {/* Coach actions */}
                                        <div className="flex gap-2 ml-4 pl-4 border-l border-outline-variant/30" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => openEdit(workout)}
                                                title="Edit workout"
                                                className="w-10 h-10 rounded-xl bg-surface-container-highest hover:bg-primary/10 text-on-surface/70 hover:text-primary flex items-center justify-center transition-colors border border-outline-variant/30 hover:border-primary/30"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            {confirmDelete === workout.id ? (
                                                <div className="flex gap-2 items-center bg-red-500/10 rounded-xl border border-red-500/20 px-2 py-1">
                                                    <span className="text-[10px] font-label uppercase text-red-400 font-bold px-1">Sure?</span>
                                                    <button onClick={() => handleDelete(workout.id)} className="w-8 h-8 rounded-lg bg-red-500 text-on-surface flex items-center justify-center hover:bg-red-400 transition-colors"><Trash2 size={14}/></button>
                                                    <button onClick={() => setConfirmDelete(null)}    className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface hover:text-on-surface flex items-center justify-center"><X size={14}/></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(workout.id)}
                                                    title="Delete workout"
                                                    className="w-10 h-10 rounded-xl bg-surface-container-highest hover:bg-red-500/10 text-on-surface/70 hover:text-red-400 flex items-center justify-center transition-colors border border-outline-variant/30 hover:border-red-500/30"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center ml-2 border border-outline-variant/30 text-on-surface/60">
                                            {isExpanded
                                                ? <ChevronUp size={20} className="text-primary" />
                                                : <ChevronDown size={20} />
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded exercise details */}
                                {isExpanded && (
                                    <div className="border-t border-outline-variant/30 p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-300 bg-surface-container-lowest">
                                        {/* Weekly plan: show day-by-day */}
                                        {workout.days && workout.days.length > 0 ? (
                                            <div className="space-y-6">
                                                {workout.days.map(day => (
                                                    <div key={day.dayIndex}>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            {day.type === 'rest'
                                                                ? <Moon size={18} className="text-indigo-400" />
                                                                : <Dumbbell size={18} className="text-primary" />
                                                            }
                                                            <span className="text-base font-headline font-bold text-on-surface">{day.label}</span>
                                                            <span className={clsx(
                                                                'px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-widest',
                                                                day.type === 'rest'
                                                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                                    : 'bg-primary/10 text-primary border border-primary/20'
                                                            )}>
                                                                {day.type === 'rest' ? 'Rest' : `${day.exercises.length} exercises`}
                                                            </span>
                                                        </div>
                                                        {day.type === 'training' && day.exercises.length > 0 && (
                                                            <div className="pl-5 md:pl-6 border-l-2 border-surface-container">
                                                                <ExerciseSections exercises={day.exercises} onExerciseClick={exercise => setSelectedExerciseName(exercise.name)} />
                                                            </div>
                                                        )}
                                                        {day.type === 'rest' && (
                                                            <div className="pl-5 md:pl-6 border-l-2 border-surface-container">
                                                                <p className="text-on-surface/40 text-sm font-body italic">Recovery &amp; Nutrition Focus</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Single session */
                                            <ExerciseSections exercises={workout.exercises} onExerciseClick={exercise => setSelectedExerciseName(exercise.name)} />
                                        )}

                                        {/* Summary stats */}
                                        <div className="flex gap-8 mt-8 pt-6 border-t border-outline-variant/30">
                                            <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                <Award className="text-primary" size={16} />
                                                <strong className="text-on-surface">{workout.exercises.length}</strong> exercises
                                            </div>
                                            <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                <Zap className="text-primary" size={16} />
                                                <strong className="text-on-surface">{totalSets(workout)}</strong> total sets
                                            </div>
                                            <div className="flex items-center gap-2 text-on-surface/50 font-body text-sm">
                                                <Clock className="text-primary" size={16} />
                                                ~<strong className="text-on-surface">{workout.estimatedMinutes}</strong> min
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {customWorkouts.length === 0 && (
                        <div className="text-center py-24 bg-surface-container-low rounded-2xl ghost-border p-8">
                            <Dumbbell className="text-on-surface/20 mx-auto mb-6" size={48} />
                            <p className="text-on-surface/70 font-headline font-bold text-xl mb-2">{t('noCustomWorkoutsYet')}</p>
                            <p className="text-on-surface/40 font-body text-sm">
                                {isCoach ? t('noCustomWorkoutsCoachHint') : t('noCustomWorkoutsClientHint')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── WorkoutEditor overlay ─────────────────────── */}
            {showEditor && (
                <WorkoutEditor
                    workout={editingWorkout}
                    workoutCategories={workoutCategories}
                    onClose={handleEditorClose}
                    onSave={handleEditorSave}
                />
            )}

            {/* ── Add category modal ────────────────────────── */}
            {selectedExerciseName && (
                <ExerciseModal
                    exerciseName={selectedExerciseName}
                    exerciseDetail={getExerciseDetail(selectedExerciseName)}
                    onClose={() => setSelectedExerciseName(null)}
                />
            )}

            {showCategoryModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="bg-surface-container-low p-8 rounded-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300 ghost-border shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Add Split Type</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface/50 hover:text-on-surface hover:bg-surface-container-highest transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 mb-2">Split Type Name</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                placeholder="e.g. Arnold Split…"
                                className="w-full bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/30 rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30"
                            />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 mb-3">Existing Categories:</p>
                            <div className="flex flex-wrap gap-2">
                                {workoutCategories.map(cat => (
                                    <span key={cat} className="px-3 py-1.5 bg-surface-container rounded-lg text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 border border-outline-variant/30">{cat}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest bg-surface-container hover:bg-surface-container-highest text-on-surface transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="flex-1 py-4 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] border border-primary/20 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Add Split
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────
// CategoryCarousel — horizontally scrollable strip of category bubbles
// with CSS scroll-snap. Replaces the previous static 2-col grid.
//
// Why a carousel: the founder wanted a swipe-with-finger feel like the
// Apple Watch home or App Library — one bubble centered, neighbours
// peeking from the sides. Native scroll-snap delivers that with zero
// JS gesture code and the browser handles inertia + momentum + rubber-
// banding for free, which a hand-rolled solution never quite nails.
//
// Implementation details:
// - The scroll container is `overflow-x-auto snap-x snap-mandatory`
// - Each bubble cell is `snap-center shrink-0` so the browser snaps
//   that cell to the container's horizontal center after a swipe
// - Container's left/right padding is half the container width minus
//   half the bubble width — that lets the FIRST and LAST bubbles
//   centre themselves when scrolled to either extreme (otherwise the
//   first bubble could never reach the centre snap point)
// - Edge fade gradients hint at off-screen content
// - The bubble matching `activeFilter` auto-scrolls into the centre
//   on mount + whenever the filter changes (so URL deep links and
//   programmatic changes land visibly)
// - Scrollbar is hidden via inline style + global CSS (see index.css
//   for the .bzt-scrollbar-hide utility if you want to reuse it)
// ─────────────────────────────────────────────────────────────────────
function CategoryCarousel({
    categories,
    counts,
    activeFilter,
    onPick,
}: {
    categories: string[];
    counts: Record<string, number>;
    activeFilter: string;
    onPick: (cat: string) => void;
}) {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const bubbleRefs  = useRef<Record<string, HTMLDivElement | null>>({});

    // Auto-centre the active bubble. Fires on mount + whenever the
    // filter changes from outside the carousel (e.g. via URL param).
    // We use scrollIntoView with `inline: 'center'` instead of writing
    // scrollLeft directly so the browser handles smooth-scrolling and
    // respects user prefers-reduced-motion.
    useEffect(() => {
        if (!activeFilter) return;
        const el = bubbleRefs.current[activeFilter];
        if (!el) return;
        // Schedule on the next frame so layout has settled (avoids a
        // jump when the carousel renders for the first time).
        requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    }, [activeFilter]);

    return (
        <div className="relative">
            {/* Edge fade hints — gradient over-paint on each side of
                the scroll viewport. The from-* color matches the panel
                background so the gradient melts cleanly into the card.
                pointer-events-none so taps still hit the bubbles
                underneath. */}
            <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-10 sm:w-12 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to right, rgb(var(--surface-container-low)) 0%, transparent 100%)' }}
            />
            <div
                aria-hidden
                className="absolute inset-y-0 right-0 w-10 sm:w-12 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgb(var(--surface-container-low)) 0%, transparent 100%)' }}
            />
            {/* Ambient gold halo behind the centred bubble — same
                trick as the cloud version, just narrower. */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 200px 120px at center, rgb(var(--primary) / 0.10) 0%, transparent 70%)',
                    filter: 'blur(18px)',
                }}
            />

            <div
                ref={scrollerRef}
                className="relative flex items-center gap-4 sm:gap-5 overflow-x-auto py-5 snap-x snap-mandatory scroll-smooth"
                style={{
                    // Hide the scrollbar in WebKit + Firefox + IE. The
                    // global `*::-webkit-scrollbar` rule in index.css
                    // doesn't apply because we'd want bars elsewhere;
                    // inline these so the carousel is self-contained.
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    // Allow the first & last bubble to reach centre.
                    // 50% of the container minus half the bubble (56px = 112/2).
                    paddingLeft: 'calc(50% - 56px)',
                    paddingRight: 'calc(50% - 56px)',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* WebKit scrollbar hide — inline <style> so we don't
                    need to touch the global stylesheet for a one-off. */}
                <style>{`.bzt-cat-scroller::-webkit-scrollbar { display: none; }`}</style>

                {categories.map(cat => (
                    <div
                        key={cat}
                        ref={(el) => { bubbleRefs.current[cat] = el; }}
                        className="snap-center shrink-0"
                    >
                        <CategoryBrowserCard
                            label={cat}
                            count={counts[cat] ?? 0}
                            active={activeFilter === cat}
                            onClick={() => onPick(cat)}
                        />
                    </div>
                ))}
            </div>

            {/* Pagination dots — tiny visual indicator of how many
                bubbles total + which one is centred. Tap a dot to
                scroll to that bubble. Hidden on hover-capable devices
                (desktop with mouse) since the scrollbar / mousewheel
                give the same info there. */}
            <div className="flex items-center justify-center gap-1.5 mt-1 md:hidden" aria-hidden>
                {categories.map(cat => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onPick(cat)}
                        className={clsx(
                            'h-1.5 rounded-full transition-all',
                            activeFilter === cat
                                ? 'w-5 bg-primary'
                                : 'w-1.5 bg-on-surface/25'
                        )}
                        aria-label={`Jump to ${cat}`}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// CategoryBrowserCard — circular bubble category picker. Uniform size
// across all categories (the size-by-popularity variant looked organic
// but threw the page off-balance on narrow screens — founder wanted
// the bubbles to "pair next to each other" cleanly, so uniform wins).
// Active bubble gets a gold ring + soft halo glow + 1.06x scale.
// ─────────────────────────────────────────────────────────────────────

/** Pick the best-fit background image for a category bubble.
 *  We reuse the existing /workout-covers/goal-*.jpg assets (already
 *  optimised + pre-warmed by the SW). The mapping is "what photo
 *  best evokes this style of training" — not exact, intentionally
 *  a bit aspirational (e.g. Powerlifting → strength shot, Stretching
 *  → rest/recovery). Falls back to the workout hero for anything
 *  unrecognised (coach-added custom categories). */
function imageFor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('full body')) return '/workout-hero.jpg';
    if (n.includes('upper') || n.includes('lower')) return '/workout-covers/goal-strength.jpg';
    if (n.includes('push') || n.includes('pull') || n.includes('legs') || n.includes('ppl')) return '/workout-covers/goal-muscle-gain.jpg';
    if (n.includes('bro')) return '/workout-covers/goal-recomp.jpg';
    if (n.includes('powerlifting') || n.includes('strength') || n.includes('power')) return '/workout-covers/goal-strength.jpg';
    if (n.includes('hiit') || n.includes('circuit')) return '/workout-covers/goal-fat-loss.jpg';
    if (n.includes('cardio')) return '/workout-covers/goal-endurance.jpg';
    if (n.includes('stretch') || n.includes('mobility') || n.includes('recovery')) return '/workout-covers/goal-rest.jpg';
    if (n.includes('endurance')) return '/workout-covers/goal-endurance.jpg';
    return '/workout-hero.jpg';
}

function CategoryBrowserCard({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    // 112px diameter — fits 2 per phone row with breathing room around
    // them (a 360px viewport easily seats 2 × 112 + 12 gap + padding),
    // and the 22px icon stays well above the 16px-text accessibility
    // floor. Touch target is comfortably above Apple's 44pt minimum.
    const DIAMETER = 112;
    const ICON_PX = 22;
    const imgSrc = imageFor(label);

    // Lightweight icon-by-name map. Falls back to the generic
    // dumbbell when a category is custom (coach-added) and so doesn't
    // match a known split. Rendered over the image with a tinted
    // backdrop so it stays legible on any photo.
    const iconFor = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('full body')) return <Activity size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('upper') || n.includes('lower')) return <Repeat size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('push') || n.includes('pull') || n.includes('legs') || n.includes('ppl')) return <Zap size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('bro')) return <Award size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('hiit') || n.includes('cardio')) return <Heart size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('stretch') || n.includes('mobility') || n.includes('recovery')) return <Moon size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('strength') || n.includes('power')) return <Shield size={ICON_PX} strokeWidth={2.2} />;
        if (n.includes('endurance')) return <RotateCcw size={ICON_PX} strokeWidth={2.2} />;
        return <Dumbbell size={ICON_PX} strokeWidth={2.2} />;
    };

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            aria-label={`${label} — ${count} workouts`}
            style={{
                width: DIAMETER,
                height: DIAMETER,
                transform: active ? 'scale(1.06)' : undefined,
            }}
            className={clsx(
                'group relative shrink-0 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200 overflow-hidden',
                'hover:-translate-y-1 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low',
                active
                    ? 'border-2 border-primary shadow-[0_10px_30px_rgba(230,195,100,0.42),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'border border-outline-variant/40 hover:border-primary/50 hover:shadow-[0_8px_22px_rgba(0,0,0,0.30)]'
            )}
        >
            {/* Background image — fills the bubble. Lazy-loaded;
                decoding async so we don't block the carousel paint
                while the JPEG decodes. */}
            <img
                src={imgSrc}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                draggable={false}
            />

            {/* Dark gradient overlay — bottom-heavy so the label +
                count near the bottom of the disc are always legible.
                Active bubble gets a gold-tinted overlay instead so
                the gold ring + glow read consistently. */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none transition-colors duration-200"
                style={{
                    background: active
                        ? 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.30) 35%, rgba(230,195,100,0.30) 100%)'
                        : 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)',
                }}
            />

            {/* Icon — small chip near the top of the disc so it
                doesn't fight the label for reading order. */}
            <span
                className={clsx(
                    'relative z-10 flex items-center justify-center mt-1 transition-colors',
                    active ? 'text-primary' : 'text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                )}
            >
                {iconFor(label)}
            </span>

            {/* Label — line-clamped to 2 so "Push / Pull / Legs"
                wraps cleanly inside the 112px disc. White over the
                image gradient instead of on-surface. */}
            <span
                className="relative z-10 font-headline font-bold leading-[1.05] tracking-tight text-center px-2 text-[12px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
                style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {label}
            </span>

            {/* Count — small numeric line under the label. Gold +
                bold when active so the picked bubble reads at a
                glance. */}
            <span
                className={clsx(
                    'relative z-10 font-body leading-none tabular-nums text-[10.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
                    active ? 'text-primary font-bold' : 'text-white/75'
                )}
            >
                {count}
            </span>
        </button>
    );
}
