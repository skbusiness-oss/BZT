/**
 * AssignDietPicker — coach picks a plan from the catalog and assigns it
 * to a specific client. Used from:
 *
 *   - Clients page: "Assign diet" button on a client row → set base diet
 *   - CoachReview page: "Change diet" button during weekly review → swap
 *     the plan when signals say the carbs need to move up/down a tier.
 *
 * Writes to `userDiets/{clientUserId}` with the same snapshot shape the
 * client wizard uses, so downstream surfaces (TodayDietCard, plan detail,
 * dashboard) read identically regardless of who assigned it.
 *
 * Filtering matches the public Diets page: meal-count + calorie band, so
 * the coach can narrow ~20 plans to the relevant 3–4 at a glance.
 */
import { useMemo, useState } from 'react';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Filter, Utensils, X, Loader2, Check, Search, AlertTriangle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { dietPlans } from '../../data/diets';
import { dietBand } from '../../lib/dietCalculator';
import { useLanguage } from '../../context/LanguageContext';
import { useCoaching } from '../../context/CoachingContext';
import { tPlanName } from '../../lib/dietTranslations';
import type { Diet, DietBand, MealsPerDay } from '../../types';

const BANDS: ('all' | DietBand)[] = ['all', 'low', 'mid', 'high', 'super'];
const MEAL_COUNTS: ('all' | MealsPerDay)[] = ['all', 3, 4];
const BAND_RANGE: Record<DietBand, string> = {
    low: '≤ 1,800',
    mid: '2,000–2,400',
    high: '2,600–3,000',
    super: '3,200+',
};

interface Props {
    /** uid of the user who will receive the assignment. */
    clientUserId: string;
    /** Optional name for the modal title — falls back to a generic copy. */
    clientName?: string;
    /** Currently-assigned plan id, when known. Highlights the active row
     * and lets the coach see what the client is currently on. */
    currentDietId?: string;
    onClose: () => void;
    /** Fired after a successful write. Receives the newly assigned plan
     * so the parent can reflect state immediately. */
    onAssigned?: (diet: Diet) => void;
}

export const AssignDietPicker = ({
    clientUserId, clientName, currentDietId, onClose, onAssigned,
}: Props) => {
    const { t, lang } = useLanguage();
    const { clients, cascadeTargets } = useCoaching();
    const [bandFilter, setBandFilter] = useState<'all' | DietBand>('all');
    const [mealFilter, setMealFilter] = useState<'all' | MealsPerDay>('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(currentDietId ?? null);
    const [carbMode, setCarbMode] = useState<'cycling' | 'moderate'>('cycling');
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return dietPlans.filter(d => {
            if (bandFilter !== 'all' && dietBand(d.calories) !== bandFilter) return false;
            if (mealFilter !== 'all' && d.mealsPerDay !== mealFilter) return false;
            if (q && !d.name.toLowerCase().includes(q) && !(d.label?.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [bandFilter, mealFilter, search]);

    const selected = selectedId ? dietPlans.find(d => d.id === selectedId) ?? null : null;

    const handleAssign = async () => {
        if (!selected) return;
        setAssigning(true);
        setError(null);
        try {
            await setDoc(doc(db, 'userDiets', clientUserId), {
                id: clientUserId,
                userId: clientUserId,
                dietId: selected.id,
                snapshot: {
                    name: selected.name,
                    mealsPerDay: selected.mealsPerDay,
                    calories: selected.calories,
                    macros: selected.macros,
                    pdfUrl: selected.pdfUrl ?? null,
                },
                assignedAt: serverTimestamp(),
            });

            // Best-effort: seed the coaching client's weekly macro targets
            // from the diet's training/rest day. Cascades to the current
            // week and all future weeks so the targets persist until the
            // coach manually overrides them via CoachReview. Skips silently
            // for non-coaching audiences (community users self-assigning,
            // newly-created clients with no Week docs yet).
            try {
                const client = clients.find(c => c.userId === clientUserId);
                if (client) {
                    const targets = {
                        mode: carbMode,
                        highCarb: {
                            carbs:    selected.trainingDay.carbs,
                            protein:  selected.trainingDay.protein,
                            fats:     selected.trainingDay.fat,
                            calories: selected.trainingDay.kcal,
                        },
                        moderateCarb: {
                            carbs:    Math.round((selected.trainingDay.carbs + selected.restDay.carbs) / 2),
                            protein:  Math.round((selected.trainingDay.protein + selected.restDay.protein) / 2),
                            fats:     Math.round((selected.trainingDay.fat + selected.restDay.fat) / 2),
                            calories: Math.round((selected.trainingDay.kcal + selected.restDay.kcal) / 2),
                        },
                        lowCarb: {
                            carbs:    selected.restDay.carbs,
                            protein:  selected.restDay.protein,
                            fats:     selected.restDay.fat,
                            calories: selected.restDay.kcal,
                        },
                    };
                    // Math.max(currentWeek, 1) — never overwrite Week 0
                    // (intake snapshot, sealed at onboarding).
                    const startWeek = Math.max(client.currentWeek ?? 1, 1);
                    await cascadeTargets(client.id, startWeek, targets);
                }
            } catch (e) {
                // Non-fatal: diet assignment already succeeded; macros seed
                // can be retried by the coach via CoachReview's targets edit.
                console.warn('[AssignDietPicker] macro seed failed:', e);
            }

            onAssigned?.(selected);
            onClose();
        } catch (e: any) {
            console.error('Failed to assign diet:', e);
            setError(e?.message ?? 'Failed to assign.');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[180] flex items-center justify-center p-4 bzt-fade-in"
            style={{
                background: 'rgb(0 0 0 / 0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
            }}
        >
            <div
                className="bzt-rise-in max-w-3xl w-full rounded-3xl bg-surface-container-high border border-outline-variant/40 overflow-hidden max-h-[92vh] flex flex-col"
                style={{ boxShadow: '0 24px 64px rgb(0 0 0 / 0.55)' }}
            >
                {/* Header */}
                <div className="px-6 md:px-8 pt-6 pb-5 flex items-center justify-between gap-4 border-b border-outline-variant/20 bg-surface-container-lowest">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))' }}
                        >
                            <Sparkles size={18} className="text-on-primary" strokeWidth={2.4} />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-label font-extrabold uppercase tracking-[0.2em] text-primary">
                                {t('assignDietEyebrow')}
                            </span>
                            <h2 className="text-lg md:text-xl font-headline font-extrabold text-on-surface tracking-tight truncate">
                                {clientName ? `${t('assignDietToClient')} ${clientName}` : t('assignDietPickPlan')}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bzt-press p-2 rounded-xl hover:bg-surface-container text-on-surface/60 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 md:px-8 py-4 border-b border-outline-variant/15 bg-surface-container-lowest space-y-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('searchPlans')}
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary rounded-xl pl-10 pr-3.5 py-2.5 text-[13px] font-body text-on-surface placeholder-on-surface/30 transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant text-[10px] font-label font-bold uppercase tracking-[0.18em] mr-2">
                            <Filter size={10} /> {t('filterByCalories') ?? 'Calories'}
                        </span>
                        {BANDS.map(b => (
                            <Chip key={b} active={bandFilter === b} onClick={() => setBandFilter(b)}>
                                {b === 'all' ? (t('all') ?? 'All') : BAND_RANGE[b]}
                            </Chip>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant text-[10px] font-label font-bold uppercase tracking-[0.18em] mr-2">
                            <Utensils size={10} /> {t('mealsPerDay') ?? 'Meals/day'}
                        </span>
                        {MEAL_COUNTS.map(m => (
                            <Chip key={m} active={mealFilter === m} onClick={() => setMealFilter(m)}>
                                {m === 'all' ? (t('all') ?? 'All') : `${m}`}
                            </Chip>
                        ))}
                    </div>
                    {/* Carb mode toggle — controls how the assigned plan's
                        macros are seeded into the client's weekly targets.
                          - 'cycling' (default): High-carb on training days,
                            Low-carb on rest days, Moderate in between if
                            triggered manually by the coach. Classic HC/LC.
                          - 'moderate': Same macros every day (mean of HC
                            and LC). Used for clients who need consistency
                            (hormonal sensitivity, hectic schedule, etc).
                        The coach can switch later by re-assigning. */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant text-[10px] font-label font-bold uppercase tracking-[0.18em] mr-2">
                            <Sparkles size={10} /> Carb mode
                        </span>
                        <Chip active={carbMode === 'cycling'} onClick={() => setCarbMode('cycling')}>
                            HC / LC cycling
                        </Chip>
                        <Chip active={carbMode === 'moderate'} onClick={() => setCarbMode('moderate')}>
                            Moderate (steady)
                        </Chip>
                    </div>
                </div>

                {/* Replace-confirm banner — shown when the client already has
                    a plan assigned. Makes it explicit that picking a new
                    plan REPLACES the current one (setDoc is destructive). */}
                {currentDietId && (() => {
                    const cur = dietPlans.find(p => p.id === currentDietId);
                    return (
                        <div className="px-6 md:px-8 pt-3 bzt-fade-in">
                            <div
                                className="rounded-2xl px-4 py-3 flex items-start gap-3"
                                style={{
                                    background: 'rgb(var(--primary) / 0.10)',
                                    border: '1px solid rgb(var(--primary) / 0.35)',
                                }}
                            >
                                <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
                                <div className="text-[12px] text-on-surface font-body leading-relaxed">
                                    {t('replaceCurrentPlanLead')}
                                    {' '}
                                    <span className="font-headline font-bold text-on-surface">{tPlanName(cur?.name ?? currentDietId, lang, t('mealsWord'))}</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* List */}
                <div className="px-6 md:px-8 py-4 overflow-y-auto flex-1">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-on-surface-variant text-[13px] font-body">
                            {t('dietNoFilterMatch')}
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {filtered.map(d => {
                                const isCurrent = d.id === currentDietId;
                                const isSelected = d.id === selectedId;
                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => setSelectedId(d.id)}
                                        className="bzt-press w-full text-left rounded-2xl px-4 py-3 transition-all flex items-center justify-between gap-4"
                                        style={{
                                            background: isSelected ? 'rgb(var(--primary) / 0.10)' : 'rgb(var(--surface-container-lowest))',
                                            border: isSelected ? '1px solid rgb(var(--primary) / 0.55)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                                        }}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-primary">
                                                    {d.label ? `${d.label} · ` : ''}{d.mealsPerDay} {t('mealsPerDay')}
                                                </span>
                                                {isCurrent && (
                                                    <span
                                                        className="text-[9px] font-label font-extrabold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                                                        style={{ background: 'rgb(var(--primary) / 0.15)', color: 'rgb(var(--primary))' }}
                                                    >
                                                        {t('current')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-headline font-extrabold text-[15px] text-on-surface tracking-tight truncate">
                                                {tPlanName(d.name, lang, t('mealsWord'))}
                                            </div>
                                            <div className="text-[12px] text-on-surface-variant font-body mt-0.5">
                                                <span className="font-headline font-extrabold text-primary">{d.calories}</span> kcal · {d.macros.protein}P · {d.macros.carbs}C · {d.macros.fat}F
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <span
                                                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                                                style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))' }}
                                            >
                                                <Check size={14} className="text-on-primary" strokeWidth={3} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 md:px-8 py-5 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between gap-3">
                    <span className="text-[11px] text-on-surface-variant font-body">
                        {filtered.length} {filtered.length === 1 ? t('planSingular') : t('planPlural')}
                    </span>
                    {error && <span className="text-xs text-red-400 font-body truncate">{error}</span>}
                    <button
                        onClick={handleAssign}
                        disabled={!selected || assigning || selected?.id === currentDietId}
                        className="bzt-press flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.18em] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{
                            background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                            color: 'rgb(var(--on-primary))',
                            boxShadow: '0 8px 22px rgb(var(--primary) / 0.32)',
                        }}
                    >
                        {assigning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {selected?.id === currentDietId ? t('alreadyAssigned') : t('assignDietCta')}
                    </button>
                </div>
            </div>
        </div>
    );
};

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="bzt-press text-[11px] font-body font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
                background: active ? 'rgb(var(--primary) / 0.12)' : 'rgb(var(--surface-container))',
                border: active ? '1px solid rgb(var(--primary) / 0.55)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                color: active ? 'rgb(var(--primary))' : 'rgb(var(--on-surface) / 0.75)',
            }}
        >
            {children}
        </button>
    );
}
