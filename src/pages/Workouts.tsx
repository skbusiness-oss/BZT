import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Workout, Exercise, WorkoutGoal } from '../types';
import { ALL_PROGRAMS } from '../data';
import {
    Search, Plus, X, Trash2, Edit3, Clock, Dumbbell, ChevronDown, ChevronUp,
    Zap, Target, Timer, Award, Moon, Calendar, Repeat, Flame, TrendingUp,
    Shield, RotateCcw, Heart, Activity
} from 'lucide-react';
import clsx from 'clsx';

const GOAL_CONFIG: Record<WorkoutGoal, { label: string; color: string; bgColor: string; icon: typeof Flame }> = {
    fat_loss: { label: 'Fat Loss', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: Flame },
    muscle_gain: { label: 'Muscle Gain', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: TrendingUp },
    strength: { label: 'Strength', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: Shield },
    recomp: { label: 'Recomp', color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: RotateCcw },
    maintenance: { label: 'Maintenance', color: 'text-teal-400', bgColor: 'bg-teal-500/10', icon: Heart },
    endurance: { label: 'Endurance', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: Activity },
};

const EMPTY_EXERCISE: Exercise = { name: '', sets: 3, reps: '10-12', restSeconds: 90 };

export const Workouts = () => {
    const { workouts, workoutCategories, addWorkout, updateWorkout, removeWorkout, addWorkoutCategory } = useData();
    const { user } = useAuth();
    const isCoach = user?.role === 'coach';
    const { t } = useLanguage();

    // View mode: 'programs' (10-day rotations) or 'custom' (coach-created)
    const [viewMode, setViewMode] = useState<'programs' | 'custom'>('programs');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [goalFilter, setGoalFilter] = useState<'all' | WorkoutGoal>('all');
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // form state
    const [form, setForm] = useState({
        name: '', description: '', category: workoutCategories[0] || 'Full Body',
        goal: 'muscle_gain' as WorkoutGoal, estimatedMinutes: 60,
        exercises: [{ ...EMPTY_EXERCISE }] as Exercise[],
    });

    const resetForm = () => {
        setForm({ name: '', description: '', category: workoutCategories[0] || 'Full Body', goal: 'muscle_gain', estimatedMinutes: 60, exercises: [{ ...EMPTY_EXERCISE }] });
        setEditingWorkout(null);
    };
    const openCreate = () => { resetForm(); setShowModal(true); };
    const openEdit = (w: Workout) => {
        setEditingWorkout(w);
        setForm({ name: w.name, description: w.description, category: w.category, goal: w.goal, estimatedMinutes: w.estimatedMinutes, exercises: w.exercises.map(e => ({ ...e })) });
        setShowModal(true);
    };
    const handleSave = () => {
        if (!form.name || form.exercises.length === 0 || !form.exercises[0].name) return;
        const payload = { name: form.name, description: form.description, category: form.category, goal: form.goal, estimatedMinutes: form.estimatedMinutes, exercises: form.exercises.filter(e => e.name.trim() !== '') };
        if (editingWorkout) updateWorkout(editingWorkout.id, payload);
        else addWorkout(payload);
        setShowModal(false); resetForm();
    };
    const handleDelete = (id: string) => { removeWorkout(id); setConfirmDelete(null); };
    const addExerciseRow = () => setForm(prev => ({ ...prev, exercises: [...prev.exercises, { ...EMPTY_EXERCISE }] }));
    const removeExerciseRow = (i: number) => setForm(prev => ({ ...prev, exercises: prev.exercises.filter((_, idx) => idx !== i) }));
    const updateExercise = (i: number, field: keyof Exercise, value: string | number) => {
        setForm(prev => { const u = [...prev.exercises]; u[i] = { ...u[i], [field]: value }; return { ...prev, exercises: u }; });
    };
    const handleAddCategory = () => {
        if (newCategoryName.trim()) { addWorkoutCategory(newCategoryName.trim()); setNewCategoryName(''); setShowCategoryModal(false); }
    };

    // Filter programs
    const filteredPrograms = useMemo(() => {
        return ALL_PROGRAMS.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
            const matchesCat = categoryFilter === 'All' || p.split === categoryFilter;
            const matchesGoal = goalFilter === 'all' || p.goal === goalFilter;
            return matchesSearch && matchesCat && matchesGoal;
        });
    }, [search, categoryFilter, goalFilter]);

    // Filter custom (user-created) workouts
    const customWorkouts = useMemo(() => {
        return workouts.filter(w => {
            const isCustom = !w.id.startsWith('tp') && !w.id.startsWith('ul') && !w.id.startsWith('ppl') && !w.id.startsWith('bro') && !w.id.startsWith('str') && !w.id.startsWith('hc');
            if (!isCustom) return false;
            const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.description.toLowerCase().includes(search.toLowerCase());
            const matchesCat = categoryFilter === 'All' || w.category === categoryFilter;
            const matchesGoal = goalFilter === 'all' || w.goal === goalFilter;
            return matchesSearch && matchesCat && matchesGoal;
        });
    }, [workouts, search, categoryFilter, goalFilter]);

    // Get workout by id
    const getWorkout = (id: string): Workout | undefined => workouts.find(w => w.id === id);

    const allCategories = ['All', ...workoutCategories];
    const totalSets = (w: Workout) => w.exercises.reduce((sum, e) => sum + e.sets, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('workoutsTitle')}</h1>
                    <p className="text-navy-200">
                        {isCoach ? t('workoutsCoachSubtitle') : 'Browse complete training programs with 10-day rotations.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                        <input type="text" placeholder={t('searchWorkouts')} value={search} onChange={e => setSearch(e.target.value)}
                            className="clay-input py-2 pl-10 pr-4 w-full sm:w-64" />
                    </div>
                    {isCoach && (
                        <div className="flex gap-2">
                            <button onClick={openCreate} className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-5 py-2 flex items-center gap-2">
                                <Plus size={18} /> {t('newWorkout')}
                            </button>
                            <button onClick={() => setShowCategoryModal(true)} className="clay-button bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 flex items-center gap-2">
                                <Plus size={16} /> Category
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
                <button onClick={() => setViewMode('programs')}
                    className={clsx("px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                        viewMode === 'programs' ? "bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-lg shadow-gold-400/20" : "clay-card-sm text-navy-200 hover:text-white"
                    )}>
                    <Calendar size={16} /> Training Programs
                </button>
                {isCoach && (
                    <button onClick={() => setViewMode('custom')}
                        className={clsx("px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            viewMode === 'custom' ? "bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-lg shadow-gold-400/20" : "clay-card-sm text-navy-200 hover:text-white"
                        )}>
                        <Dumbbell size={16} /> Custom Workouts
                    </button>
                )}
            </div>

            {/* Split Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {allCategories.map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)}
                        className={clsx("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            categoryFilter === cat ? "bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-clay-sm" : "clay-card-sm text-navy-200 hover:text-white"
                        )}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Goal Filter */}
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setGoalFilter('all')}
                    className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        goalFilter === 'all' ? 'bg-navy-600 text-white' : 'text-navy-300 hover:text-white')}>
                    All Goals
                </button>
                {(Object.keys(GOAL_CONFIG) as WorkoutGoal[]).map(goal => {
                    const GoalIcon = GOAL_CONFIG[goal].icon;
                    return (
                        <button key={goal} onClick={() => setGoalFilter(goal)}
                            className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                                goalFilter === goal ? `${GOAL_CONFIG[goal].bgColor} ${GOAL_CONFIG[goal].color}` : "text-navy-300 hover:text-white")}>
                            <GoalIcon size={12} /> {GOAL_CONFIG[goal].label}
                        </button>
                    );
                })}
            </div>

            {/* ═══════ PROGRAMS VIEW ═══════ */}
            {viewMode === 'programs' && (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPrograms.map(program => {
                        const isExpanded = expandedProgram === program.id;
                        const goalConfig = GOAL_CONFIG[program.goal];
                        const GoalIcon = goalConfig.icon;
                        const workoutDays = program.rotation.filter(d => d.type === 'workout').length;
                        const restDays = program.rotation.filter(d => d.type === 'rest').length;

                        return (
                            <div key={program.id} className="clay-card overflow-hidden transition-all">
                                {/* Program Header */}
                                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    onClick={() => setExpandedProgram(isExpanded ? null : program.id)}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", goalConfig.bgColor)}>
                                            <GoalIcon className={goalConfig.color} size={26} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg">{program.name}</h3>
                                            <p className="text-sm text-navy-300 mt-0.5">{program.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                        <span className="clay-card-sm px-3 py-1 text-xs font-medium text-navy-200">{program.split}</span>
                                        <span className={clsx("px-3 py-1 rounded-lg text-xs font-bold", goalConfig.bgColor, goalConfig.color)}>
                                            {goalConfig.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm">
                                            <Repeat size={14} /> 10 days
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                                            <Dumbbell size={14} /> {workoutDays}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-navy-400 text-sm">
                                            <Moon size={14} /> {restDays}
                                        </div>
                                        {isExpanded ? <ChevronUp className="text-gold-400" size={20} /> : <ChevronDown className="text-navy-400" size={20} />}
                                    </div>
                                </div>

                                {/* Expanded: 10-Day Rotation */}
                                {isExpanded && (
                                    <div className="border-t border-white/[0.04] animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Global Rules */}
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

                                        {/* 10-Day Grid */}
                                        <div className="px-5 pb-5 space-y-2">
                                            <h4 className="text-xs font-bold uppercase text-navy-400 tracking-wider mt-3 mb-3 flex items-center gap-2">
                                                <Calendar size={14} className="text-gold-400" /> 10-Day Rotation
                                            </h4>
                                            {program.rotation.map((day) => {
                                                if (day.type === 'rest') {
                                                    const isActive = day.restDayType === 'active_recovery';
                                                    return (
                                                        <div key={day.dayNumber} className={clsx("flex items-center gap-4 p-3 rounded-xl border", isActive ? "bg-emerald-900/10 border-emerald-400/10" : "bg-navy-900/30 border-white/[0.02]")}>
                                                            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isActive ? "bg-emerald-900/30" : "bg-navy-800/50")}>
                                                                <span className={clsx("text-sm font-bold", isActive ? "text-emerald-500" : "text-navy-500")}>{day.dayNumber}</span>
                                                            </div>
                                                            {isActive ? <Activity className="text-emerald-400/60" size={18} /> : <Moon className="text-indigo-400/60" size={18} />}
                                                            <span className={clsx("text-sm font-medium italic", isActive ? "text-emerald-400/80" : "text-navy-400")}>
                                                                {isActive ? 'Active Recovery — Light Movement, Stretching & Mobility' : 'Rest Day — Recovery & Nutrition Focus'}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                const workout = getWorkout(day.workoutId || '');
                                                const isWorkoutExpanded = expandedWorkout === day.workoutId;

                                                return (
                                                    <div key={day.dayNumber} className="rounded-xl border border-white/[0.04] overflow-hidden">
                                                        <div className={clsx("flex items-center gap-4 p-3 cursor-pointer transition-colors", isWorkoutExpanded ? "bg-navy-800/40" : "hover:bg-white/[0.02]")}
                                                            onClick={() => setExpandedWorkout(isWorkoutExpanded ? null : (day.workoutId || null))}>
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center shrink-0 border border-gold-400/20">
                                                                <span className="text-sm font-bold text-gold-400">{day.dayNumber}</span>
                                                            </div>
                                                            <Dumbbell className="text-gold-400" size={18} />
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-white font-medium text-sm">{day.label}</span>
                                                                {workout && <span className="text-navy-400 text-xs ml-2">— {workout.name}</span>}
                                                            </div>
                                                            {/* CNS Load Indicator */}
                                                            {day.cnsLoad && day.cnsLoad >= 3 && (
                                                                <div className="flex items-center gap-1 shrink-0" title={`CNS Load: ${day.cnsLoad}/5`}>
                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                        <div key={i} className={clsx("w-1.5 h-1.5 rounded-full",
                                                                            i < (day.cnsLoad || 0)
                                                                                ? ((day.cnsLoad || 0) >= 4 ? "bg-red-400" : "bg-amber-400")
                                                                                : "bg-navy-700"
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
                                                                {isWorkoutExpanded ? <ChevronUp className="text-gold-400" size={16} /> : <ChevronDown className="text-navy-500" size={16} />}
                                                            </div>
                                                        </div>

                                                        {/* Expanded Exercise Table */}
                                                        {isWorkoutExpanded && workout && (
                                                            <div className="border-t border-white/[0.04] p-4 animate-in fade-in duration-150">
                                                                <div className="overflow-x-auto rounded-xl clay-inset">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="text-xs text-navy-300 uppercase" style={{ background: 'rgba(4,5,14,0.6)' }}>
                                                                            <tr>
                                                                                <th className="px-4 py-3 w-8">#</th>
                                                                                <th className="px-4 py-3">Exercise</th>
                                                                                <th className="px-4 py-3 text-center">Sets</th>
                                                                                <th className="px-4 py-3 text-center">Reps</th>
                                                                                <th className="px-4 py-3 text-center">Rest</th>
                                                                                <th className="px-4 py-3">Notes</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-white/[0.03]">
                                                                            {workout.exercises.map((ex, i) => (
                                                                                <tr key={i} className="hover:bg-navy-800/20 transition-colors">
                                                                                    <td className="px-4 py-3 text-navy-400 font-medium">{i + 1}</td>
                                                                                    <td className="px-4 py-3 font-medium text-white">{ex.name}</td>
                                                                                    <td className="px-4 py-3 text-center text-gold-400 font-bold">{ex.sets}</td>
                                                                                    <td className="px-4 py-3 text-center text-navy-100">{ex.reps}</td>
                                                                                    <td className="px-4 py-3 text-center text-navy-300 flex items-center justify-center gap-1">
                                                                                        <Timer size={12} /> {ex.restSeconds}s
                                                                                    </td>
                                                                                    <td className="px-4 py-3 text-navy-400 italic text-xs">
                                                                                        {ex.notes ? (
                                                                                            <span className={clsx(ex.notes.includes('REST PAUSE') && 'text-amber-400 font-semibold not-italic')}>
                                                                                                {ex.notes}
                                                                                            </span>
                                                                                        ) : '—'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
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

            {/* ═══════ CUSTOM WORKOUTS VIEW ═══════ */}
            {viewMode === 'custom' && (
                <div className="grid grid-cols-1 gap-5">
                    {customWorkouts.map(workout => {
                        const isExpanded = expandedWorkout === workout.id;
                        const goalConfig = GOAL_CONFIG[workout.goal];
                        return (
                            <div key={workout.id} className="clay-card overflow-hidden transition-all">
                                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                                    onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}>
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
                                        <span className={clsx("px-3 py-1 rounded-lg text-xs font-bold", goalConfig.bgColor, goalConfig.color)}>
                                            {goalConfig.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Clock size={14} /> {workout.estimatedMinutes}m</div>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Target size={14} /> {workout.exercises.length} ex</div>
                                        <div className="flex items-center gap-1.5 text-navy-300 text-sm"><Zap size={14} /> {totalSets(workout)} sets</div>
                                        {isCoach && (
                                            <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => openEdit(workout)} className="clay-button bg-navy-800 hover:bg-navy-700 text-white p-2" title="Edit"><Edit3 size={16} /></button>
                                                {confirmDelete === workout.id ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleDelete(workout.id)} className="clay-button bg-red-600 hover:bg-red-500 text-white px-3 py-2 text-xs">Yes</button>
                                                        <button onClick={() => setConfirmDelete(null)} className="clay-button bg-navy-700 text-white px-3 py-2 text-xs">No</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDelete(workout.id)} className="clay-button bg-navy-800 hover:bg-red-600/20 hover:text-red-400 text-navy-300 p-2" title="Delete"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp className="text-navy-400" size={20} /> : <ChevronDown className="text-navy-400" size={20} />}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-white/[0.04] p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="overflow-x-auto rounded-xl clay-inset">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-navy-300 uppercase" style={{ background: 'rgba(4,5,14,0.6)' }}>
                                                    <tr>
                                                        <th className="px-4 py-3 w-8">#</th><th className="px-4 py-3">Exercise</th><th className="px-4 py-3 text-center">Sets</th>
                                                        <th className="px-4 py-3 text-center">Reps</th><th className="px-4 py-3 text-center">Rest</th><th className="px-4 py-3">Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/[0.03]">
                                                    {workout.exercises.map((ex, i) => (
                                                        <tr key={i} className="hover:bg-navy-800/20 transition-colors">
                                                            <td className="px-4 py-3 text-navy-400 font-medium">{i + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-white">{ex.name}</td>
                                                            <td className="px-4 py-3 text-center text-gold-400 font-bold">{ex.sets}</td>
                                                            <td className="px-4 py-3 text-center text-navy-100">{ex.reps}</td>
                                                            <td className="px-4 py-3 text-center text-navy-300"><Timer size={12} className="inline mr-1" />{ex.restSeconds}s</td>
                                                            <td className="px-4 py-3 text-navy-400 italic text-xs">{ex.notes || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {customWorkouts.length === 0 && (
                        <div className="text-center py-20 clay-card p-8">
                            <Dumbbell className="text-navy-500 mx-auto mb-4" size={40} />
                            <p className="text-navy-300 text-lg">No custom workouts</p>
                            <p className="text-navy-400 text-sm mt-1">{isCoach ? 'Create your first custom workout above.' : 'Your coach hasn\'t created any custom workouts yet.'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Workout Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{editingWorkout ? 'Edit Workout' : 'New Workout'}</h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-navy-300 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Workout Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. PPL Day 1 – Push (Chest Focus)" className="w-full clay-input p-3" />
                            </div>
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe..." rows={2} className="w-full clay-input p-3 resize-none" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-navy-200 mb-1">Split Type *</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full clay-input p-3">
                                        {workoutCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-navy-200 mb-1">Goal</label>
                                    <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value as WorkoutGoal })} className="w-full clay-input p-3">
                                        {(Object.keys(GOAL_CONFIG) as WorkoutGoal[]).map(g => <option key={g} value={g}>{GOAL_CONFIG[g].label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-navy-200 mb-1">Duration (min)</label>
                                    <input type="number" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: parseInt(e.target.value) || 0 })} className="w-full clay-input p-3" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-white">Exercises *</label>
                                    <button onClick={addExerciseRow} className="text-gold-400 hover:text-gold-300 text-sm flex items-center gap-1 font-medium"><Plus size={14} /> Add Exercise</button>
                                </div>
                                <div className="space-y-3">
                                    {form.exercises.map((ex, i) => (
                                        <div key={i} className="clay-inset p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-navy-400 font-bold uppercase">Exercise {i + 1}</span>
                                                {form.exercises.length > 1 && <button onClick={() => removeExerciseRow(i)} className="text-red-400/60 hover:text-red-400"><Trash2 size={14} /></button>}
                                            </div>
                                            <input type="text" placeholder="Exercise name" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} className="w-full clay-input p-2.5 text-sm" />
                                            <div className="grid grid-cols-3 gap-2">
                                                <div><label className="text-[10px] text-navy-400 uppercase">Sets</label><input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 0)} className="w-full clay-input p-2 text-sm" /></div>
                                                <div><label className="text-[10px] text-navy-400 uppercase">Reps</label><input type="text" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} placeholder="8-12" className="w-full clay-input p-2 text-sm" /></div>
                                                <div><label className="text-[10px] text-navy-400 uppercase">Rest (s)</label><input type="number" value={ex.restSeconds} onChange={e => updateExercise(i, 'restSeconds', parseInt(e.target.value) || 0)} className="w-full clay-input p-2 text-sm" /></div>
                                            </div>
                                            <input type="text" placeholder="Notes (optional)" value={ex.notes || ''} onChange={e => updateExercise(i, 'notes', e.target.value)} className="w-full clay-input p-2.5 text-sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.04]">
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">Cancel</button>
                            <button onClick={handleSave} disabled={!form.name || form.exercises.length === 0 || !form.exercises[0].name}
                                className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3">
                                {editingWorkout ? 'Save Changes' : 'Create Workout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add Split Type</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-navy-300 hover:text-white"><X size={20} /></button>
                        </div>
                        <div>
                            <label className="block text-sm text-navy-200 mb-1">Split Type Name</label>
                            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Arnold Split..." className="w-full clay-input p-3" />
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-navy-400 mb-2">Existing:</p>
                            <div className="flex flex-wrap gap-2">
                                {workoutCategories.map(cat => <span key={cat} className="px-2 py-1 clay-card-sm rounded text-xs text-navy-200">{cat}</span>)}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">Cancel</button>
                            <button onClick={handleAddCategory} disabled={!newCategoryName.trim()}
                                className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3">
                                Add Split Type
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
