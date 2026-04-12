// ============================================================
// WorkoutEditor.tsx
// Full-featured coach workout builder.
//   • Create from scratch OR load any static template
//   • Single-Session mode OR Weekly-Plan mode (Mon–Sun days)
//   • Add exercises via ExerciseDB live search (GIF previews)
//   • Reorder exercises with up / down arrows
//   • Mark each day as Training or Rest (weekly mode)
//   • Set sets, reps, rest, notes per exercise
//   • Saves to Firestore via onSave callback
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
    Workout, Exercise, WorkoutDay, WorkoutGoal,
} from '../../types';
import { searchExercises, ExerciseResult } from '../../lib/exerciseService';
import { ALL_TRAINING_PROGRAMS } from '../../data';
import {
    X, Plus, Trash2, Search, ChevronUp, ChevronDown,
    Moon, Dumbbell, Loader2, Calendar, Layers,
    LayoutTemplate, Flame, TrendingUp, Shield,
    RotateCcw, Heart, Activity,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Constants ────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GOAL_CFG: Record<WorkoutGoal, { label: string; icon: typeof Flame }> = {
    fat_loss:    { label: 'Fat Loss',    icon: Flame },
    muscle_gain: { label: 'Muscle Gain', icon: TrendingUp },
    strength:    { label: 'Strength',    icon: Shield },
    recomp:      { label: 'Recomp',      icon: RotateCcw },
    maintenance: { label: 'Maintenance', icon: Heart },
    endurance:   { label: 'Endurance',   icon: Activity },
};

const EMPTY_EXERCISE: Exercise = { name: '', sets: 3, reps: '10-12', restSeconds: 90 };

const freshDays = (): WorkoutDay[] =>
    DAYS_OF_WEEK.map((label, i) => ({
        dayIndex: i,
        label,
        type: i < 5 ? 'training' : 'rest',
        exercises: [],
    }));

// ─── Sub-component: one editable exercise row ─────────────────

interface ExerciseRowProps {
    exercise: Exercise;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onUpdate: (field: keyof Exercise, value: string | number) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

const ExerciseRow = ({
    exercise, index, isFirst, isLast,
    onUpdate, onRemove, onMoveUp, onMoveDown,
}: ExerciseRowProps) => (
    <div className="clay-inset p-3 rounded-xl">
        <div className="flex items-start gap-2">
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                <button
                    onClick={onMoveUp}
                    disabled={isFirst}
                    title="Move up"
                    className="w-6 h-6 rounded flex items-center justify-center text-navy-400 hover:text-white hover:bg-navy-700/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronUp size={14} />
                </button>
                <button
                    onClick={onMoveDown}
                    disabled={isLast}
                    title="Move down"
                    className="w-6 h-6 rounded flex items-center justify-center text-navy-400 hover:text-white hover:bg-navy-700/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Row number */}
            <span className="text-xs font-bold text-navy-600 w-4 mt-2.5 shrink-0 select-none">
                {index + 1}
            </span>

            {/* Fields */}
            <div className="flex-1 space-y-2 min-w-0">
                <input
                    type="text"
                    value={exercise.name}
                    onChange={e => onUpdate('name', e.target.value)}
                    placeholder="Exercise name"
                    className="w-full clay-input p-2.5 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] text-navy-500 uppercase font-semibold tracking-wide">Sets</label>
                        <input
                            type="number" min="1"
                            value={exercise.sets}
                            onChange={e => onUpdate('sets', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full clay-input p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-navy-500 uppercase font-semibold tracking-wide">Reps</label>
                        <input
                            type="text"
                            value={exercise.reps}
                            onChange={e => onUpdate('reps', e.target.value)}
                            placeholder="8-12"
                            className="w-full clay-input p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-navy-500 uppercase font-semibold tracking-wide">Rest (s)</label>
                        <input
                            type="number" min="0"
                            value={exercise.restSeconds}
                            onChange={e => onUpdate('restSeconds', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full clay-input p-2 text-sm"
                        />
                    </div>
                </div>
                <input
                    type="text"
                    value={exercise.notes ?? ''}
                    onChange={e => onUpdate('notes', e.target.value)}
                    placeholder="Notes (optional) — e.g. REST PAUSE, Pump Set"
                    className="w-full clay-input p-2.5 text-sm"
                />
            </div>

            {/* Delete */}
            <button
                onClick={onRemove}
                title="Remove exercise"
                className="shrink-0 mt-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-navy-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
);

// ─── Sub-component: ExerciseDB search bar + dropdown ──────────

interface ExerciseSearchProps {
    query: string;
    setQuery: (q: string) => void;
    results: ExerciseResult[];
    isSearching: boolean;
    onSelect: (r: ExerciseResult) => void;
    onAddManual: () => void;
}

const ExerciseSearchBar = ({
    query, setQuery, results, isSearching, onSelect, onAddManual,
}: ExerciseSearchProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [setQuery]);

    return (
        <div ref={wrapRef} className="relative">
            {/* Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" size={15} />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search ExerciseDB… (e.g. bench press, squat)"
                    className="w-full clay-input py-2.5 pl-10 pr-10 text-sm"
                />
                {isSearching && (
                    <Loader2
                        size={15}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 animate-spin pointer-events-none"
                    />
                )}
            </div>

            {/* Results dropdown */}
            {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 clay-card overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                    {results.map(r => (
                        <button
                            key={r.exerciseId}
                            onClick={() => onSelect(r)}
                            className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0 text-left group"
                        >
                            {/* Mini GIF */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-navy-800/60">
                                {r.gifUrl && (
                                    <img
                                        src={r.gifUrl}
                                        alt={r.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                            <span className="flex-1 text-sm font-medium text-white capitalize group-hover:text-gold-300 transition-colors line-clamp-1">
                                {r.name}
                            </span>
                            <Plus size={15} className="text-gold-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            )}

            {/* Manual add link */}
            <button
                onClick={onAddManual}
                className="mt-2 text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium transition-colors"
            >
                <Plus size={13} /> Add exercise manually
            </button>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────

export interface WorkoutEditorProps {
    workout?: Workout | null;
    workoutCategories: string[];
    onClose: () => void;
    onSave: (data: Omit<Workout, 'id' | 'createdAt'>) => void;
}

export const WorkoutEditor = ({
    workout, workoutCategories, onClose, onSave,
}: WorkoutEditorProps) => {
    // ── Metadata ──────────────────────────────────────────────
    const [name, setName]             = useState(workout?.name ?? '');
    const [description, setDesc]      = useState(workout?.description ?? '');
    const [category, setCategory]     = useState(workout?.category ?? workoutCategories[0] ?? 'Full Body');
    const [goal, setGoal]             = useState<WorkoutGoal>(workout?.goal ?? 'muscle_gain');
    const [minutes, setMinutes]       = useState(workout?.estimatedMinutes ?? 60);

    // ── Mode ──────────────────────────────────────────────────
    const [mode, setMode] = useState<'single' | 'weekly'>(() =>
        workout?.days && workout.days.length > 0 ? 'weekly' : 'single'
    );

    // ── Exercises (single mode) ───────────────────────────────
    const [exercises, setExercises] = useState<Exercise[]>(() =>
        workout?.exercises.length
            ? workout.exercises.map(e => ({ ...e }))
            : [{ ...EMPTY_EXERCISE }]
    );

    // ── Days (weekly mode) ────────────────────────────────────
    const [days, setDays] = useState<WorkoutDay[]>(() =>
        workout?.days?.length
            ? workout.days.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e })) }))
            : freshDays()
    );
    const [activeDayIdx, setActiveDayIdx] = useState(0);

    // ── Search ────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ExerciseResult[]>([]);
    const [isSearching, setIsSearching]     = useState(false);

    // ── Template picker ───────────────────────────────────────
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');

    // ── Debounced exercise search ─────────────────────────────
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setIsSearching(true);
            const res = await searchExercises(searchQuery);
            setSearchResults(res.slice(0, 12));
            setIsSearching(false);
        }, 500);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Clear search when switching day / mode
    useEffect(() => {
        setSearchQuery('');
        setSearchResults([]);
    }, [activeDayIdx, mode]);

    // ── Exercise helpers ──────────────────────────────────────

    /** Return setter for the currently-active exercise list */
    const activeExercises = mode === 'single' ? exercises : days[activeDayIdx].exercises;

    const setActiveExercises = (fn: (prev: Exercise[]) => Exercise[]) => {
        if (mode === 'single') {
            setExercises(fn);
        } else {
            setDays(prev => {
                const updated = [...prev];
                updated[activeDayIdx] = {
                    ...updated[activeDayIdx],
                    exercises: fn(updated[activeDayIdx].exercises),
                };
                return updated;
            });
        }
    };

    const addFromSearch = (result: ExerciseResult) => {
        const ex: Exercise = { name: result.name, sets: 3, reps: '10-12', restSeconds: 90 };
        setActiveExercises(prev => [...prev.filter(e => e.name.trim()), ex]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const addManual = () => {
        setActiveExercises(prev => [...prev, { ...EMPTY_EXERCISE }]);
    };

    const updateAt = (i: number, field: keyof Exercise, value: string | number) => {
        setActiveExercises(prev => {
            const u = [...prev];
            u[i] = { ...u[i], [field]: value };
            return u;
        });
    };

    const removeAt = (i: number) => {
        setActiveExercises(prev => prev.filter((_, idx) => idx !== i));
    };

    const moveAt = (from: number, to: number) => {
        if (to < 0 || to >= activeExercises.length) return;
        setActiveExercises(prev => {
            const u = [...prev];
            [u[from], u[to]] = [u[to], u[from]];
            return u;
        });
    };

    const toggleDayType = (i: number) => {
        setDays(prev => {
            const updated = [...prev];
            updated[i] = {
                ...updated[i],
                type: updated[i].type === 'training' ? 'rest' : 'training',
            };
            return updated;
        });
    };

    // ── Template loader ───────────────────────────────────────

    const filteredTemplates = ALL_TRAINING_PROGRAMS.filter(p =>
        p.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(templateSearch.toLowerCase()) ||
        p.goal.includes(templateSearch.toLowerCase())
    ).slice(0, 24);

    const loadTemplate = (templateId: string) => {
        const t = ALL_TRAINING_PROGRAMS.find(p => p.id === templateId);
        if (!t) return;
        if (!name)  setName(t.name);
        if (!description) setDesc(t.description);
        setGoal(t.goal);
        setCategory(t.category);
        setMinutes(t.estimatedMinutes);

        if (mode === 'single') {
            setExercises(t.exercises.map(e => ({ ...e })));
        } else {
            // Load template exercises into the currently active day (if training)
            if (days[activeDayIdx].type === 'training') {
                setActiveExercises(() => t.exercises.map(e => ({ ...e })));
            }
        }
        setShowTemplates(false);
    };

    // ── Save ──────────────────────────────────────────────────

    const clean = (list: Exercise[]) => list.filter(e => e.name.trim());

    const handleSave = () => {
        if (!name.trim()) return;

        const flatExercises =
            mode === 'single'
                ? clean(exercises)
                : days.flatMap(d => d.type === 'training' ? clean(d.exercises) : []);

        const payload: Omit<Workout, 'id' | 'createdAt'> = {
            name: name.trim().slice(0, 200),
            description: description.trim().slice(0, 2000),
            category,
            goal,
            estimatedMinutes: Math.max(1, minutes),
            exercises: flatExercises,
            ...(mode === 'weekly'
                ? { days: days.map(d => ({ ...d, exercises: clean(d.exercises) })) }
                : {}),
        };

        onSave(payload);
    };

    // ── Derived ───────────────────────────────────────────────

    const canSave = name.trim().length > 0;
    const activeDay = days[activeDayIdx];

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-200">
            <div className="clay-card w-full max-w-4xl max-h-[96vh] md:max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* ── Header ─────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-400/20 flex items-center justify-center shrink-0">
                            <Dumbbell className="text-gold-400" size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {workout ? 'Edit Workout' : 'New Workout'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-navy-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Scrollable body ─────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                                Workout Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Push Day – Chest & Triceps"
                                className="w-full clay-input p-3"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Briefly describe this workout…"
                                rows={2}
                                className="w-full clay-input p-3 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                                Split Type
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full clay-input p-3"
                            >
                                {workoutCategories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                                Goal
                            </label>
                            <select
                                value={goal}
                                onChange={e => setGoal(e.target.value as WorkoutGoal)}
                                className="w-full clay-input p-3"
                            >
                                {(Object.keys(GOAL_CFG) as WorkoutGoal[]).map(g => (
                                    <option key={g} value={g}>{GOAL_CFG[g].label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                                Duration (min)
                            </label>
                            <input
                                type="number" min="1"
                                value={minutes}
                                onChange={e => setMinutes(Math.max(1, parseInt(e.target.value) || 60))}
                                className="w-full clay-input p-3"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setShowTemplates(v => !v)}
                                className={clsx(
                                    'w-full clay-button py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors',
                                    showTemplates
                                        ? 'bg-gold-500/10 border border-gold-400/20 text-gold-400'
                                        : 'bg-navy-800 hover:bg-navy-700 text-navy-200 hover:text-white'
                                )}
                            >
                                <LayoutTemplate size={16} />
                                {showTemplates ? 'Close Templates' : 'Load Template'}
                            </button>
                        </div>
                    </div>

                    {/* Template picker */}
                    {showTemplates && (
                        <div className="clay-inset p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <Layers size={15} className="text-gold-400" /> Choose a Template
                                </span>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" size={13} />
                                    <input
                                        type="text"
                                        value={templateSearch}
                                        onChange={e => setTemplateSearch(e.target.value)}
                                        placeholder="Filter templates…"
                                        className="w-full clay-input py-1.5 pl-8 pr-3 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                                {filteredTemplates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => loadTemplate(t.id)}
                                        className="text-left p-3 rounded-xl bg-navy-800/50 hover:bg-navy-700/60 border border-white/[0.04] hover:border-white/[0.08] transition-colors group"
                                    >
                                        <p className="text-sm font-semibold text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                                            {t.name}
                                        </p>
                                        <p className="text-[10px] text-navy-500 mt-0.5">
                                            {t.exercises.length} exercises · {t.category}
                                        </p>
                                    </button>
                                ))}
                                {filteredTemplates.length === 0 && (
                                    <p className="text-navy-400 text-sm col-span-3 text-center py-4">No templates match</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1 bg-navy-900/60 rounded-xl w-fit border border-white/[0.04]">
                        {(['single', 'weekly'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={clsx(
                                    'px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                                    mode === m
                                        ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-lg shadow-gold-400/15'
                                        : 'text-navy-400 hover:text-white'
                                )}
                            >
                                {m === 'single' ? <Dumbbell size={15} /> : <Calendar size={15} />}
                                {m === 'single' ? 'Single Session' : 'Weekly Plan'}
                            </button>
                        ))}
                    </div>

                    {/* ─── SINGLE SESSION ─── */}
                    {mode === 'single' && (
                        <div className="space-y-3">
                            {exercises.length === 0 && (
                                <p className="text-navy-500 text-sm text-center py-4">
                                    No exercises yet — search below or add manually.
                                </p>
                            )}
                            {exercises.map((ex, i) => (
                                <ExerciseRow
                                    key={i}
                                    exercise={ex}
                                    index={i}
                                    isFirst={i === 0}
                                    isLast={i === exercises.length - 1}
                                    onUpdate={(field, val) => updateAt(i, field, val)}
                                    onRemove={() => removeAt(i)}
                                    onMoveUp={() => moveAt(i, i - 1)}
                                    onMoveDown={() => moveAt(i, i + 1)}
                                />
                            ))}
                            <ExerciseSearchBar
                                query={searchQuery}
                                setQuery={setSearchQuery}
                                results={searchResults}
                                isSearching={isSearching}
                                onSelect={addFromSearch}
                                onAddManual={addManual}
                            />
                        </div>
                    )}

                    {/* ─── WEEKLY PLAN ─── */}
                    {mode === 'weekly' && (
                        <div className="space-y-4">
                            {/* Day tabs */}
                            <div className="flex gap-1.5 flex-wrap">
                                {days.map((day, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveDayIdx(i)}
                                        className={clsx(
                                            'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border',
                                            activeDayIdx === i
                                                ? day.type === 'rest'
                                                    ? 'bg-navy-700 border-navy-500 text-white'
                                                    : 'bg-gradient-to-b from-gold-400/20 to-gold-600/10 border-gold-400/30 text-gold-300'
                                                : 'clay-card-sm border-transparent text-navy-400 hover:text-white'
                                        )}
                                    >
                                        {day.type === 'rest'
                                            ? <Moon size={14} className={activeDayIdx === i ? 'text-indigo-400' : 'text-navy-600'} />
                                            : <Dumbbell size={14} className={activeDayIdx === i ? 'text-gold-400' : 'text-navy-600'} />
                                        }
                                        <span>{DAYS_SHORT[i]}</span>
                                        {day.type === 'training' && day.exercises.length > 0 && (
                                            <span className="w-4 h-4 rounded-full bg-gold-400/20 text-gold-400 text-[9px] font-bold flex items-center justify-center">
                                                {day.exercises.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Active day editor */}
                            <div className="clay-inset p-4 rounded-xl space-y-4">
                                {/* Day header */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        {activeDay.type === 'rest'
                                            ? <Moon size={16} className="text-indigo-400" />
                                            : <Dumbbell size={16} className="text-gold-400" />
                                        }
                                        {activeDay.label}
                                    </h3>
                                    <button
                                        onClick={() => toggleDayType(activeDayIdx)}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border',
                                            activeDay.type === 'rest'
                                                ? 'bg-navy-700 border-navy-600 text-navy-200 hover:text-white'
                                                : 'bg-gold-500/10 border-gold-400/20 text-gold-400 hover:bg-gold-500/20'
                                        )}
                                    >
                                        {activeDay.type === 'rest'
                                            ? <><Dumbbell size={12} /> Set as Training Day</>
                                            : <><Moon size={12} /> Set as Rest Day</>
                                        }
                                    </button>
                                </div>

                                {/* Rest day placeholder */}
                                {activeDay.type === 'rest' && (
                                    <div className="text-center py-8">
                                        <Moon className="text-indigo-400/30 mx-auto mb-2" size={36} />
                                        <p className="text-navy-500 text-sm">
                                            Rest Day — Recovery &amp; Nutrition Focus
                                        </p>
                                    </div>
                                )}

                                {/* Training day exercises */}
                                {activeDay.type === 'training' && (
                                    <div className="space-y-3">
                                        {activeDay.exercises.length === 0 && (
                                            <p className="text-navy-500 text-sm text-center py-3">
                                                No exercises yet — search below or add manually.
                                            </p>
                                        )}
                                        {activeDay.exercises.map((ex, i) => (
                                            <ExerciseRow
                                                key={i}
                                                exercise={ex}
                                                index={i}
                                                isFirst={i === 0}
                                                isLast={i === activeDay.exercises.length - 1}
                                                onUpdate={(field, val) => updateAt(i, field, val)}
                                                onRemove={() => removeAt(i)}
                                                onMoveUp={() => moveAt(i, i - 1)}
                                                onMoveDown={() => moveAt(i, i + 1)}
                                            />
                                        ))}
                                        <ExerciseSearchBar
                                            query={searchQuery}
                                            setQuery={setSearchQuery}
                                            results={searchResults}
                                            isSearching={isSearching}
                                            onSelect={addFromSearch}
                                            onAddManual={addManual}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────── */}
                <div className="flex gap-3 px-5 py-4 border-t border-white/[0.05] shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3 font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:text-navy-500 disabled:cursor-not-allowed text-navy-950 py-3 font-bold"
                    >
                        {workout ? 'Save Changes' : 'Create Workout'}
                    </button>
                </div>
            </div>
        </div>
    );
};
