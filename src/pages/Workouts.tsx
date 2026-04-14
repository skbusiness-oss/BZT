import { useState, useMemo } from 'react';
import { useData }     from '../context/DataContext';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Workout, WorkoutGoal } from '../types';
import { ALL_PROGRAMS, ALL_TRAINING_PROGRAMS } from '../data';
import { ExerciseCard }    from '../components/workouts/ExerciseCard';
import { WorkoutEditor }   from '../components/workouts/WorkoutEditor';
import {
    Search, Plus, X, Trash2, Edit3, Clock, Dumbbell, ChevronDown, ChevronUp,
    Zap, Target, Timer, Award, Moon, Calendar, Repeat, Flame, TrendingUp,
    Shield, RotateCcw, Heart, Activity, BookOpen,
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

type ViewMode = 'programs' | 'custom' | 'myweek';

export const Workouts = () => {
    const {
        workouts, workoutCategories,
        addWorkout, updateWorkout, removeWorkout, addWorkoutCategory,
        clients, weeks,
    } = useData();
    const { user } = useAuth();
    const { t }   = useLanguage();

    const isCoach   = user?.role === 'coach' || user?.role === 'admin';
    const isClient  = user?.role === 'client' || user?.role === 'community';

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

    // ── Client week data ───────────────────────────────────────
    const myClient = isClient ? clients[0] : null;
    const currentWeekNum = myClient?.currentWeek ?? 1;

    const myWeek = useMemo(() =>
        isClient
            ? weeks.find(w => w.clientId === user?.id && w.weekNumber === currentWeekNum)
            : null,
        [isClient, weeks, user?.id, currentWeekNum]
    );

    const assignedWorkouts = useMemo((): Workout[] => {
        if (!myWeek?.assignedWorkoutIds) return [];
        return myWeek.assignedWorkoutIds
            .map(id => workouts.find(w => w.id === id))
            .filter((w): w is Workout => w !== undefined);
    }, [myWeek, workouts]);

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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            {/* ── Page header ──────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('workoutsTitle')}</h1>
                    <p className="text-navy-200">
                        {isCoach
                            ? t('workoutsCoachSubtitle')
                            : 'Browse complete training programs with 10-day rotations.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" size={18} />
                        <input
                            type="text"
                            placeholder={t('searchWorkouts')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="clay-input py-2 pl-10 pr-4 w-full sm:w-64"
                        />
                    </div>
                    {isCoach && (
                        <div className="flex gap-2">
                            <button
                                onClick={openCreate}
                                className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-5 py-2 flex items-center gap-2"
                            >
                                <Plus size={18} /> {t('newWorkout')}
                            </button>
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="clay-button bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 flex items-center gap-2"
                            >
                                <Plus size={16} /> Category
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── View mode tabs ────────────────────────────── */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setViewMode('programs')}
                    className={clsx(
                        'px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                        viewMode === 'programs'
                            ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-lg shadow-gold-400/20'
                            : 'clay-card-sm text-navy-200 hover:text-white'
                    )}
                >
                    <Calendar size={16} /> Training Programs
                </button>

                {isCoach && (
                    <button
                        onClick={() => setViewMode('custom')}
                        className={clsx(
                            'px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                            viewMode === 'custom'
                                ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-lg shadow-gold-400/20'
                                : 'clay-card-sm text-navy-200 hover:text-white'
                        )}
                    >
                        <Dumbbell size={16} /> Custom Workouts
                    </button>
                )}

                {isClient && (
                    <button
                        onClick={() => setViewMode('myweek')}
                        className={clsx(
                            'px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                            viewMode === 'myweek'
                                ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-lg shadow-gold-400/20'
                                : 'clay-card-sm text-navy-200 hover:text-white'
                        )}
                    >
                        <BookOpen size={16} /> My Week
                    </button>
                )}
            </div>

            {/* ── Split / category filter (Programs + Custom views) ── */}
            {viewMode !== 'myweek' && (
                <>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {allCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={clsx(
                                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                                    categoryFilter === cat
                                        ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-clay-sm'
                                        : 'clay-card-sm text-navy-200 hover:text-white'
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setGoalFilter('all')}
                            className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                goalFilter === 'all' ? 'bg-navy-600 text-white' : 'text-navy-300 hover:text-white'
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
                                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                                        goalFilter === g
                                            ? `${GOAL_CONFIG[g].bgColor} ${GOAL_CONFIG[g].color}`
                                            : 'text-navy-300 hover:text-white'
                                    )}
                                >
                                    <GoalIcon size={12} /> {GOAL_CONFIG[g].label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════
                TRAINING PROGRAMS VIEW
            ════════════════════════════════════════════════ */}
            {viewMode === 'programs' && (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPrograms.map(program => {
                        const isExpanded  = expandedProgram === program.id;
                        const goalConfig  = GOAL_CONFIG[program.goal];
                        const GoalIcon    = goalConfig.icon;
                        const workoutDays = program.rotation.filter(d => d.type === 'workout').length;
                        const restDays    = program.rotation.filter(d => d.type === 'rest').length;

                        return (
                            <div key={program.id} className="clay-card overflow-hidden transition-all">
                                {/* Program header */}
                                <div
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', goalConfig.bgColor)}>
                                            <GoalIcon className={goalConfig.color} size={26} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg">{program.name}</h3>
                                            <p className="text-sm text-navy-300 mt-0.5">{program.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                        <span className="clay-card-sm px-3 py-1 text-xs font-medium text-navy-200">{program.split}</span>
                                        <span className={clsx('px-3 py-1 rounded-lg text-xs font-bold', goalConfig.bgColor, goalConfig.color)}>
                                            {goalConfig.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Repeat size={14} /> 10 days</div>
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium"><Dumbbell size={14} /> {workoutDays}</div>
                                        <div className="flex items-center gap-1.5 text-navy-400 text-sm"><Moon size={14} /> {restDays}</div>
                                        {isExpanded
                                            ? <ChevronUp className="text-gold-400" size={20} />
                                            : <ChevronDown className="text-navy-400" size={20} />
                                        }
                                    </div>
                                </div>

                                {/* Expanded: 10-day rotation */}
                                {isExpanded && (
                                    <div className="border-t border-white/[0.04] animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Training rules */}
                                        <div className="px-5 pt-4 pb-2">
                                            <div className="clay-inset p-4 rounded-xl">
                                                <h4 className="text-xs font-bold uppercase text-gold-400 mb-2 tracking-wider">Training Rules</h4>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                    {program.rules.map((rule, i) => (
                                                        <li key={i} className="text-xs text-navy-300 flex items-start gap-2">
                                                            <span className="text-gold-400 mt-0.5">•</span> {rule}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* 10-day grid */}
                                        <div className="px-5 pb-5 space-y-2">
                                            <h4 className="text-xs font-bold uppercase text-navy-400 tracking-wider mt-3 mb-3 flex items-center gap-2">
                                                <Calendar size={14} className="text-gold-400" /> 10-Day Rotation
                                            </h4>
                                            {program.rotation.map(day => {
                                                if (day.type === 'rest') {
                                                    const isActive = day.restDayType === 'active_recovery';
                                                    return (
                                                        <div key={day.dayNumber} className={clsx(
                                                            'flex items-center gap-4 p-3 rounded-xl border',
                                                            isActive ? 'bg-emerald-900/10 border-emerald-400/10' : 'bg-navy-900/30 border-white/[0.02]'
                                                        )}>
                                                            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isActive ? 'bg-emerald-900/30' : 'bg-navy-800/50')}>
                                                                <span className={clsx('text-sm font-bold', isActive ? 'text-emerald-500' : 'text-navy-500')}>{day.dayNumber}</span>
                                                            </div>
                                                            {isActive ? <Activity className="text-emerald-400/60" size={18} /> : <Moon className="text-indigo-400/60" size={18} />}
                                                            <span className={clsx('text-sm font-medium italic', isActive ? 'text-emerald-400/80' : 'text-navy-400')}>
                                                                {isActive ? 'Active Recovery — Light Movement, Stretching & Mobility' : 'Rest Day — Recovery & Nutrition Focus'}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                const workout = getWorkout(day.workoutId || '');
                                                const isWorkoutExpanded = expandedWorkout === day.workoutId;

                                                return (
                                                    <div key={day.dayNumber} className="rounded-xl border border-white/[0.04] overflow-hidden">
                                                        {/* Workout row */}
                                                        <div
                                                            className={clsx('flex items-center gap-4 p-3 cursor-pointer transition-colors', isWorkoutExpanded ? 'bg-navy-800/40' : 'hover:bg-white/[0.02]')}
                                                            onClick={() => setExpandedWorkout(isWorkoutExpanded ? null : (day.workoutId || null))}
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center shrink-0 border border-gold-400/20">
                                                                <span className="text-sm font-bold text-gold-400">{day.dayNumber}</span>
                                                            </div>
                                                            <Dumbbell className="text-gold-400" size={18} />
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-white font-medium text-sm">{day.label}</span>
                                                                {workout && <span className="text-navy-400 text-xs ml-2">— {workout.name}</span>}
                                                            </div>
                                                            {/* CNS load bars */}
                                                            {day.cnsLoad && day.cnsLoad >= 3 && (
                                                                <div className="flex items-center gap-1 shrink-0" title={`CNS Load: ${day.cnsLoad}/5`}>
                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                        <div key={i} className={clsx('w-1.5 h-1.5 rounded-full',
                                                                            i < (day.cnsLoad || 0)
                                                                                ? ((day.cnsLoad || 0) >= 4 ? 'bg-red-400' : 'bg-amber-400')
                                                                                : 'bg-navy-700'
                                                                        )} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                {workout && (
                                                                    <>
                                                                        <span className="text-navy-400 text-xs flex items-center gap-1"><Clock size={12} />{workout.estimatedMinutes}m</span>
                                                                        <span className="text-navy-400 text-xs flex items-center gap-1"><Target size={12} />{workout.exercises.length} ex</span>
                                                                        <span className="text-navy-400 text-xs flex items-center gap-1"><Zap size={12} />{totalSets(workout)} sets</span>
                                                                    </>
                                                                )}
                                                                {isWorkoutExpanded
                                                                    ? <ChevronUp className="text-gold-400" size={16} />
                                                                    : <ChevronDown className="text-navy-500" size={16} />
                                                                }
                                                            </div>
                                                        </div>

                                                        {/* Expanded: ExerciseCards */}
                                                        {isWorkoutExpanded && workout && (
                                                            <div className="border-t border-white/[0.04] p-4 animate-in fade-in duration-150 space-y-2">
                                                                {workout.exercises.map((ex, i) => (
                                                                    <ExerciseCard key={i} exercise={ex} index={i} />
                                                                ))}
                                                                <div className="flex gap-6 mt-3 pt-3 border-t border-white/[0.04]">
                                                                    <div className="flex items-center gap-2 text-navy-300 text-xs">
                                                                        <Award className="text-gold-400" size={14} />
                                                                        <strong className="text-white">{workout.exercises.length}</strong> exercises
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-navy-300 text-xs">
                                                                        <Zap className="text-gold-400" size={14} />
                                                                        <strong className="text-white">{totalSets(workout)}</strong> total sets
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-navy-300 text-xs">
                                                                        <Clock className="text-gold-400" size={14} />
                                                                        ~<strong className="text-white">{workout.estimatedMinutes}</strong> min
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
                        <div className="text-center py-20 clay-card p-8">
                            <Calendar className="text-navy-500 mx-auto mb-4" size={40} />
                            <p className="text-navy-300 text-lg">No programs found</p>
                            <p className="text-navy-400 text-sm mt-1">Try adjusting your split or goal filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                CUSTOM WORKOUTS VIEW  (coach only)
            ════════════════════════════════════════════════ */}
            {viewMode === 'custom' && (
                <div className="grid grid-cols-1 gap-5">
                    {customWorkouts.map(workout => {
                        const isExpanded = expandedWorkout === workout.id;
                        const goalConfig = GOAL_CONFIG[workout.goal];
                        return (
                            <div key={workout.id} className="clay-card overflow-hidden transition-all">
                                {/* Workout header */}
                                <div
                                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                                    onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center clay-inset shrink-0">
                                            <Dumbbell className="text-gold-400" size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg truncate">{workout.name}</h3>
                                            <p className="text-sm text-navy-300 truncate">{workout.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                        <span className="clay-card-sm px-3 py-1 text-xs font-medium text-navy-200">{workout.category}</span>
                                        <span className={clsx('px-3 py-1 rounded-lg text-xs font-bold', goalConfig.bgColor, goalConfig.color)}>
                                            {goalConfig.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Clock size={14} /> {workout.estimatedMinutes}m</div>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Target size={14} /> {workout.exercises.length} ex</div>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Zap size={14} /> {totalSets(workout)} sets</div>

                                        {/* Coach actions */}
                                        <div className="flex gap-1 ml-1" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => openEdit(workout)}
                                                title="Edit workout"
                                                className="clay-button bg-navy-800 hover:bg-navy-700 text-white p-2"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            {confirmDelete === workout.id ? (
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleDelete(workout.id)} className="clay-button bg-red-600 hover:bg-red-500 text-white px-3 py-2 text-xs font-semibold">Yes</button>
                                                    <button onClick={() => setConfirmDelete(null)}    className="clay-button bg-navy-700 text-white px-3 py-2 text-xs">No</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(workout.id)}
                                                    title="Delete workout"
                                                    className="clay-button bg-navy-800 hover:bg-red-600/20 hover:text-red-400 text-navy-300 p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {isExpanded
                                            ? <ChevronUp className="text-navy-400" size={20} />
                                            : <ChevronDown className="text-navy-400" size={20} />
                                        }
                                    </div>
                                </div>

                                {/* Expanded exercise details */}
                                {isExpanded && (
                                    <div className="border-t border-white/[0.04] p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Weekly plan: show day-by-day */}
                                        {workout.days && workout.days.length > 0 ? (
                                            <div className="space-y-5">
                                                {workout.days.map(day => (
                                                    <div key={day.dayIndex}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {day.type === 'rest'
                                                                ? <Moon size={15} className="text-indigo-400" />
                                                                : <Dumbbell size={15} className="text-gold-400" />
                                                            }
                                                            <span className="text-sm font-bold text-white">{day.label}</span>
                                                            <span className={clsx(
                                                                'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                                                day.type === 'rest'
                                                                    ? 'bg-indigo-500/10 text-indigo-400'
                                                                    : 'bg-gold-500/10 text-gold-400'
                                                            )}>
                                                                {day.type === 'rest' ? 'Rest' : `${day.exercises.length} exercises`}
                                                            </span>
                                                        </div>
                                                        {day.type === 'training' && day.exercises.length > 0 && (
                                                            <div className="space-y-2 pl-4 border-l border-white/[0.05]">
                                                                {day.exercises.map((ex, i) => (
                                                                    <ExerciseCard key={i} exercise={ex} index={i} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {day.type === 'rest' && (
                                                            <div className="pl-4 border-l border-white/[0.05]">
                                                                <p className="text-navy-500 text-xs italic">Recovery &amp; Nutrition Focus</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Single session */
                                            <div className="space-y-2">
                                                {workout.exercises.map((ex, i) => (
                                                    <ExerciseCard key={i} exercise={ex} index={i} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Summary stats */}
                                        <div className="flex gap-6 mt-4 pt-4 border-t border-white/[0.04]">
                                            <div className="flex items-center gap-2 text-navy-300 text-xs">
                                                <Award className="text-gold-400" size={14} />
                                                <strong className="text-white">{workout.exercises.length}</strong> exercises
                                            </div>
                                            <div className="flex items-center gap-2 text-navy-300 text-xs">
                                                <Zap className="text-gold-400" size={14} />
                                                <strong className="text-white">{totalSets(workout)}</strong> total sets
                                            </div>
                                            <div className="flex items-center gap-2 text-navy-300 text-xs">
                                                <Clock className="text-gold-400" size={14} />
                                                ~<strong className="text-white">{workout.estimatedMinutes}</strong> min
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {customWorkouts.length === 0 && (
                        <div className="text-center py-20 clay-card p-8">
                            <Dumbbell className="text-navy-500 mx-auto mb-4" size={40} />
                            <p className="text-navy-300 text-lg">No custom workouts yet</p>
                            <p className="text-navy-400 text-sm mt-1">
                                {isCoach ? 'Create your first custom workout above.' : "Your coach hasn't created any custom workouts yet."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                MY WEEK VIEW  (clients)
            ════════════════════════════════════════════════ */}
            {viewMode === 'myweek' && (
                <div className="space-y-6">
                    {/* Week header */}
                    <div className="clay-card p-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="text-gold-400" size={20} />
                                Week {currentWeekNum} — Assigned Workouts
                            </h2>
                            <p className="text-navy-400 text-sm mt-1">
                                {assignedWorkouts.length
                                    ? `${assignedWorkouts.length} workout${assignedWorkouts.length > 1 ? 's' : ''} assigned by your coach`
                                    : 'No workouts assigned for this week yet'}
                            </p>
                        </div>
                        {myWeek && (
                            <span className={clsx(
                                'px-3 py-1.5 rounded-xl text-xs font-bold',
                                myWeek.status === 'reviewed' ? 'bg-emerald-500/10 text-emerald-400' :
                                myWeek.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-navy-700/60 text-navy-300'
                            )}>
                                {myWeek.status === 'reviewed' ? 'Reviewed' :
                                 myWeek.status === 'submitted' ? 'Submitted' : 'In Progress'}
                            </span>
                        )}
                    </div>

                    {assignedWorkouts.length === 0 ? (
                        <div className="clay-card p-16 text-center">
                            <Dumbbell className="text-navy-600 mx-auto mb-3" size={44} />
                            <p className="text-navy-300 text-lg">No workouts this week</p>
                            <p className="text-navy-500 text-sm mt-1">Your coach will assign workouts to your weekly plan.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {assignedWorkouts.map(workout => {
                                const goalConfig = GOAL_CONFIG[workout.goal];
                                const GoalIcon   = goalConfig.icon;
                                const isExpanded = expandedWorkout === workout.id;

                                return (
                                    <div key={workout.id} className="clay-card overflow-hidden">
                                        {/* Header */}
                                        <div
                                            className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                            onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                                        >
                                            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', goalConfig.bgColor)}>
                                                <GoalIcon className={goalConfig.color} size={22} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-lg truncate">{workout.name}</h3>
                                                <p className="text-sm text-navy-300 truncate">{workout.description}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={clsx('px-3 py-1 rounded-lg text-xs font-bold hidden sm:block', goalConfig.bgColor, goalConfig.color)}>
                                                    {goalConfig.label}
                                                </span>
                                                <span className="text-navy-400 text-xs flex items-center gap-1"><Clock size={12} />{workout.estimatedMinutes}m</span>
                                                <span className="text-navy-400 text-xs flex items-center gap-1"><Timer size={12} />{workout.exercises.length} ex</span>
                                                {isExpanded
                                                    ? <ChevronUp className="text-gold-400" size={18} />
                                                    : <ChevronDown className="text-navy-400" size={18} />
                                                }
                                            </div>
                                        </div>

                                        {/* Exercise cards */}
                                        {isExpanded && (
                                            <div className="border-t border-white/[0.04] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {workout.days && workout.days.length > 0 ? (
                                                    <div className="space-y-5">
                                                        {workout.days.map(day => (
                                                            <div key={day.dayIndex}>
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    {day.type === 'rest'
                                                                        ? <Moon size={15} className="text-indigo-400" />
                                                                        : <Dumbbell size={15} className="text-gold-400" />
                                                                    }
                                                                    <span className="text-sm font-bold text-white">{day.label}</span>
                                                                    <span className={clsx(
                                                                        'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                                                        day.type === 'rest' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gold-500/10 text-gold-400'
                                                                    )}>
                                                                        {day.type === 'rest' ? 'Rest Day' : `${day.exercises.length} exercises`}
                                                                    </span>
                                                                </div>
                                                                {day.type === 'training' && day.exercises.length > 0 && (
                                                                    <div className="space-y-2 pl-4 border-l border-white/[0.05]">
                                                                        {day.exercises.map((ex, i) => (
                                                                            <ExerciseCard key={i} exercise={ex} index={i} />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {day.type === 'rest' && (
                                                                    <div className="pl-4 border-l border-white/[0.05]">
                                                                        <p className="text-navy-500 text-xs italic">Rest &amp; recovery</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {workout.exercises.map((ex, i) => (
                                                            <ExerciseCard key={i} exercise={ex} index={i} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add Split Type</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-navy-300 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm text-navy-200 mb-1">Split Type Name</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                placeholder="e.g. Arnold Split…"
                                className="w-full clay-input p-3"
                            />
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-navy-400 mb-2">Existing:</p>
                            <div className="flex flex-wrap gap-2">
                                {workoutCategories.map(cat => (
                                    <span key={cat} className="px-2 py-1 clay-card-sm rounded text-xs text-navy-200">{cat}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3"
                            >
                                Add Split Type
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
