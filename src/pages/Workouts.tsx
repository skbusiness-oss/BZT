import { useState, useMemo } from 'react';
import { useData }     from '../context/DataContext';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Workout, WorkoutGoal } from '../types';
import { ALL_PROGRAMS, ALL_TRAINING_PROGRAMS } from '../data';
import { ExerciseCard }    from '../components/workouts/ExerciseCard';
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

// ─── Component ────────────────────────────────────────────────

type ViewMode = 'programs' | 'custom';

export const Workouts = () => {
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
    const [viewMode, setViewMode]         = useState<ViewMode>('programs');
    const [search, setSearch]             = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [goalFilter, setGoalFilter]     = useState<'all' | WorkoutGoal>('all');
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

    // ── Editor state ───────────────────────────────────────────
    const [showEditor, setShowEditor]     = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
    const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);

    // ── Category modal state ───────────────────────────────────
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName]     = useState('');

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
            const matchCat  = categoryFilter === 'All' || p.split === categoryFilter;
            const matchGoal = goalFilter === 'all' || p.goal === goalFilter;
            return matchSearch && matchCat && matchGoal;
        }),
        [search, categoryFilter, goalFilter]
    );

    const customWorkouts = useMemo(() =>
        workouts.filter(w => {
            if (!isCustom(w)) return false;
            const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                                w.description.toLowerCase().includes(search.toLowerCase());
            const matchCat  = categoryFilter === 'All' || w.category === categoryFilter;
            const matchGoal = goalFilter === 'all' || w.goal === goalFilter;
            return matchSearch && matchCat && matchGoal;
        }),
        [workouts, search, categoryFilter, goalFilter]
    );

    const getWorkout = (id: string) => workouts.find(w => w.id === id);

    const allCategories = ['All', ...workoutCategories];

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
            {(!showWizard) && (
            <>

            {/* ── Page header ──────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between gap-6 bg-surface-container-low rounded-2xl p-6 md:p-8 ghost-border">
                <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Training Hub</span>
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tighter">{t('workoutsTitle')}</h1>
                    <p className="text-on-surface/60 font-body mt-3 max-w-lg">
                        {isCoach
                            ? t('workoutsCoachSubtitle')
                            : 'Browse complete training programs with 10-day rotations.'}
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
                                <Plus size={16} /> Category
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── View mode tabs ────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={() => setViewMode('programs')}
                    className={clsx(
                        'px-6 py-3 rounded-full text-[10px] font-label font-bold uppercase tracking-widest transition-all flex items-center gap-2 border',
                        viewMode === 'programs'
                            ? 'bg-primary text-on-primary border-primary shadow-[0_10px_20px_rgba(230,195,100,0.2)]'
                            : 'bg-surface-container-low text-on-surface/60 border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
                    )}
                >
                    <Calendar size={14} /> Training Programs
                </button>

                {isCoach && (
                    <button
                        onClick={() => setViewMode('custom')}
                        className={clsx(
                            'px-6 py-3 rounded-full text-[10px] font-label font-bold uppercase tracking-widest transition-all flex items-center gap-2 border',
                            viewMode === 'custom'
                                ? 'bg-primary text-on-primary border-primary shadow-[0_10px_20px_rgba(230,195,100,0.2)]'
                                : 'bg-surface-container-low text-on-surface/60 border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
                        )}
                    >
                        <Dumbbell size={14} /> Custom Workouts
                    </button>
                )}

            </div>

            {/* ── Split / category filter (Programs + Custom views) ── */}
            <div className="bg-surface-container-low rounded-2xl p-6 ghost-border space-y-6">
                    <div>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-3">Filter by Category</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg text-xs font-headline font-bold whitespace-nowrap transition-colors border',
                                        categoryFilter === cat
                                            ? 'bg-primary/10 text-primary border-primary/30'
                                            : 'bg-surface-container-lowest text-on-surface/60 border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-3">Filter by Goal</span>
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

            {/* ═══════════════════════════════════════════════
                TRAINING PROGRAMS VIEW
            ════════════════════════════════════════════════ */}
            {viewMode === 'programs' && (
                <div className="grid grid-cols-1 gap-6">
                    {filteredPrograms.map(program => {
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
                                        <div className="px-6 md:px-8 pb-8 space-y-3">
                                            <h4 className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 mt-6 mb-4 flex items-center gap-2">
                                                <Calendar size={14} /> 10-Day Rotation
                                            </h4>
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
                                                            <div className="border-t border-outline-variant/30 p-6 animate-in fade-in duration-300 bg-surface-container/30 space-y-3">
                                                                {workout.exercises.map((ex, i) => (
                                                                    <ExerciseCard key={i} exercise={ex} index={i} />
                                                                ))}
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
                                )}
                            </div>
                        );
                    })}
                    {filteredPrograms.length === 0 && (
                        <div className="text-center py-24 bg-surface-container-low rounded-2xl ghost-border p-8">
                            <Calendar className="text-on-surface/20 mx-auto mb-6" size={48} />
                            <p className="text-on-surface/70 font-headline font-bold text-xl mb-2">No programs found</p>
                            <p className="text-on-surface/40 font-body text-sm">Try adjusting your split or goal filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                CUSTOM WORKOUTS VIEW  (coach only)
            ════════════════════════════════════════════════ */}
            {viewMode === 'custom' && (
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
                                                            <div className="space-y-3 pl-5 md:pl-6 border-l-2 border-surface-container">
                                                                {day.exercises.map((ex, i) => (
                                                                    <ExerciseCard key={i} exercise={ex} index={i} />
                                                                ))}
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
                                            <div className="space-y-3">
                                                {workout.exercises.map((ex, i) => (
                                                    <ExerciseCard key={i} exercise={ex} index={i} />
                                                ))}
                                            </div>
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
                            <p className="text-on-surface/70 font-headline font-bold text-xl mb-2">No custom workouts yet</p>
                            <p className="text-on-surface/40 font-body text-sm">
                                {isCoach ? 'Create your first custom workout above.' : "Your coach hasn't created any custom workouts yet."}
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

            </> /* End of browse view wrapper */
            )}
        </div>
    );
};
