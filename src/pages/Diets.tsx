/**
 * Diets — top-level menu page. Mirrors src/pages/Workouts.tsx pattern.
 *
 * Two surfaces:
 *   1. "Calculate my plan" hero CTA — opens the DietWizard.
 *   2. Browse grid of all available plans, filterable by calorie band +
 *      meal count.
 *
 * Plans aren't keyed by goal — they're calorie tiers (1,400 → 3,400 kcal).
 * The user's goal feeds the calculator that produces a target kcal; the
 * matcher then snaps to the closest tier inside the requested meal count.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Filter, Utensils, FileText, ChevronRight, CheckCircle2, Salad } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAssignedDiet } from '../hooks/useAssignedDiet';
import { dietPlans, getDietById } from '../data/diets';
import { coverUrl } from '../data/diets/covers';
import { DietWizard } from '../components/diets/DietWizard';
import { DietCoverAttributions } from '../components/diets/DietCoverAttributions';
import { dietBand } from '../lib/dietCalculator';
import { tPlanName } from '../lib/dietTranslations';
import type { DietBand, MealsPerDay } from '../types';

const BANDS: ('all' | DietBand)[] = ['all', 'low', 'mid', 'high', 'super'];
const MEAL_COUNTS: ('all' | MealsPerDay)[] = ['all', 3, 4];

const BAND_RANGE: Record<DietBand, string> = {
    low: '≤ 1,800',
    mid: '2,000–2,400',
    high: '2,600–3,000',
    super: '3,200+',
};

export const Diets = () => {
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [showWizard, setShowWizard] = useState(false);
    // Two-step picker: bandFilter / mealFilter start as null = "not
    // picked yet". This drives the progressive-reveal flow — meal
    // cards stay hidden until the user picks a calorie band, plan
    // list stays hidden until they pick a meal count. "all" is a
    // valid explicit pick (= "every tier" / "any cadence"), distinct
    // from "not picked yet".
    type BandPick = 'all' | DietBand | null;
    type MealPick = 'all' | MealsPerDay | null;
    const [bandFilter, setBandFilter] = useState<BandPick>(null);
    const [mealFilter, setMealFilter] = useState<MealPick>(null);

    // Reset the meals pick whenever the calorie band changes — old
    // selection might not match the new band's plans, and the
    // progressive UX wants the user to re-confirm the cadence after
    // changing tiers.
    const pickBand = (b: 'all' | DietBand) => {
        setBandFilter(b);
        setMealFilter(null);
    };

    const profile = user?.dietProfile;
    const { assignedDietId, snapshot: assignedSnapshot } = useAssignedDiet();
    // Resolve the active plan from the catalog when possible (gives us full
    // training/rest split + cover image). Falls back to the assignment
    // snapshot for the headline numbers when the catalog id has been retired.
    const activePlan = assignedDietId ? getDietById(assignedDietId) : undefined;

    const filtered = useMemo(() => {
        // Skip the list entirely until BOTH steps have been picked.
        if (bandFilter === null || mealFilter === null) return [];
        return dietPlans.filter(d => {
            if (bandFilter !== 'all' && dietBand(d.calories) !== bandFilter) return false;
            if (mealFilter !== 'all' && d.mealsPerDay !== mealFilter) return false;
            return true;
        });
    }, [bandFilter, mealFilter]);

    // Calorie-band counts ignore mealFilter — the meal step doesn't
    // exist yet when the user is looking at the band cards, so the
    // count should reflect the full catalog for that tier.
    const bandCounts = useMemo(() => {
        const counts: Record<'all' | DietBand, number> = { all: 0, low: 0, mid: 0, high: 0, super: 0 };
        for (const d of dietPlans) {
            counts.all++;
            const band = dietBand(d.calories);
            counts[band]++;
        }
        return counts;
    }, []);

    // Meal counts respect the currently-picked band, since the meals
    // step is only shown AFTER a band has been chosen.
    const mealCounts = useMemo(() => {
        const counts: Record<'all' | 3 | 4, number> = { all: 0, 3: 0, 4: 0 };
        for (const d of dietPlans) {
            if (bandFilter !== null && bandFilter !== 'all' && dietBand(d.calories) !== bandFilter) continue;
            counts.all++;
            if (d.mealsPerDay === 3) counts[3]++;
            else if (d.mealsPerDay === 4) counts[4]++;
        }
        return counts;
    }, [bandFilter]);

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-24 space-y-8">
            {/* Editorial header */}
            <header className="bzt-rise-in">
                <div className="flex items-center gap-3 mb-3">
                    <span className="block w-6 h-px" style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), transparent)' }} />
                    <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-primary">
                        {t('dietsEyebrow') ?? 'Nutrition'}
                    </span>
                </div>
                <h1 className="font-headline font-extrabold text-on-surface text-[clamp(2rem,4vw,3rem)] tracking-[-0.03em] leading-[1] mb-3">
                    {t('dietsTitle') ?? 'Diets'}
                </h1>
                <p className="text-on-surface/60 font-body leading-relaxed max-w-xl">
                    {t('dietsSubtitle') ?? 'Calculate your daily targets, then get matched to a plan that fits your goal and meal cadence.'}
                </p>
            </header>

            {/* Calculate-or-summary card. If the user already has a dietProfile,
                we show their saved targets + a "Recalculate" button. Otherwise
                a hero CTA. Backdrop is a Gemini-generated photo: calculator-
                empty (kitchen scale + ingredients) for fresh users, calculator-
                active (meal-prep containers) once the calculator has run. */}
            <section
                className="bzt-rise-in bzt-hero-card relative overflow-hidden rounded-3xl border border-outline-variant/30 cursor-pointer"
                onClick={() => setShowWizard(true)}
                style={{
                    minHeight: 220,
                    animationDelay: '80ms',
                }}
            >
                <div
                    className="bzt-hero-photo absolute inset-0"
                    style={{
                        // Always the empty-state photo here — this card is the
                        // calculator action regardless of whether a profile
                        // exists. The dialed-in meal-prep image is reserved
                        // for the "Your active plan" hero below.
                        backgroundImage: `url(/diets/covers/calculator-empty.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                }} />
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-h-[220px]">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} style={{ color: '#e6c364' }} />
                            <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em]" style={{ color: '#e6c364' }}>
                                {profile ? (t('dietProfileSaved') ?? 'Your plan') : (t('dietCalculatorEyebrow') ?? 'Calculator')}
                            </span>
                        </div>
                        <h2 className="font-headline font-extrabold text-[26px] md:text-[30px] tracking-tight leading-tight mb-2" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
                            {profile
                                ? (t('dietRecalculatePrompt') ?? 'Update your targets')
                                : (t('dietCalculatePrompt') ?? 'Calculate my plan')
                            }
                        </h2>
                        <p className="text-[14px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {profile
                                ? `${profile.targetCalories} kcal · ${profile.targetProtein}P / ${profile.targetCarbs}C / ${profile.targetFat}F · ${profile.mealsPerDay} ${t('mealsPerDay') ?? 'meals/day'}`
                                : (t('dietCalculateBlurb') ?? 'Sex, age, weight, height, activity, goal. We do the math, match the plan.')
                            }
                        </p>
                    </div>
                    <div
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.18em]"
                        style={{
                            background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                            color: 'rgb(var(--on-primary))',
                            boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)',
                        }}
                    >
                        <Sparkles size={14} />
                        {profile ? (t('recalculate') ?? 'Recalculate') : (t('startCalculator') ?? 'Start')}
                    </div>
                </div>
            </section>

            {/* Active plan — only shown when the user has assigned a plan.
                Sits between the calculator hero and the catalog so a returning
                user sees their plan first, while a fresh account skips this
                block entirely and goes straight to filters. Backdrop is the
                meal-prep photo (week-on-track imagery). */}
            {assignedDietId && (
                <section
                    className="bzt-rise-in rounded-3xl border border-primary/30 overflow-hidden cursor-pointer bzt-hero-card relative"
                    onClick={() => navigate(`/diets/plan/${assignedDietId}`)}
                    style={{ animationDelay: '120ms' }}
                >
                    <div
                        className="bzt-hero-photo absolute inset-0"
                        style={{
                            backgroundImage: 'url(/diets/covers/calculator-active.jpg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                    }} />
                    <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={14} style={{ color: '#e6c364' }} />
                                <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em]" style={{ color: '#e6c364' }}>
                                    {t('activePlanEyebrow') ?? 'Your active plan'}
                                </span>
                            </div>
                            <h2 className="font-headline font-extrabold text-[22px] md:text-[26px] tracking-tight leading-tight mb-1.5 truncate" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
                                {tPlanName(activePlan?.name ?? assignedSnapshot?.name ?? assignedDietId ?? '', lang, t('mealsWord'))}
                            </h2>
                            <p className="text-[13px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                {(activePlan?.calories ?? assignedSnapshot?.calories ?? 0)} kcal
                                {' · '}
                                {(activePlan?.macros.protein ?? assignedSnapshot?.macros.protein ?? 0)}P / {(activePlan?.macros.carbs ?? assignedSnapshot?.macros.carbs ?? 0)}C / {(activePlan?.macros.fat ?? assignedSnapshot?.macros.fat ?? 0)}F
                                {' · '}
                                {(activePlan?.mealsPerDay ?? assignedSnapshot?.mealsPerDay ?? 3)} {t('mealsPerDay') ?? 'meals/day'}
                            </p>
                        </div>
                        <div
                            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.18em]"
                            style={{
                                background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                                color: 'rgb(var(--on-primary))',
                                boxShadow: '0 12px 28px rgb(var(--primary) / 0.32)',
                            }}
                        >
                            {t('openMyPlan') ?? 'Open my plan'} <ChevronRight size={14} />
                        </div>
                    </div>
                </section>
            )}

            {/* Browse — filters + plan grid (or empty-state when catalog is empty) */}
            <section className="space-y-5">
                {assignedDietId && (
                    <p className="text-[12px] text-on-surface-variant font-body italic">
                        {t('switchPlanHint') ?? 'Want a different tier? Pick another plan below — switching replaces your current plan.'}
                    </p>
                )}

                {/* STEP 1 — Big calorie-band cards with the same per-tier
                    cover photos used on the plan thumbnails. Visible at
                    all times. Picking one reveals the meals/day step
                    below and resets any prior meal pick. */}
                <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-label font-bold uppercase tracking-[0.18em]">
                            <Filter size={12} /> Step 1 · {t('filterByCalories') ?? 'Calories'}
                        </div>
                        {bandFilter !== null && (
                            <button
                                onClick={() => { setBandFilter(null); setMealFilter(null); }}
                                className="text-[10px] font-label font-bold uppercase tracking-widest text-primary hover:underline"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {BANDS.map(b => (
                            <BigCalorieBandCard
                                key={b}
                                value={b}
                                count={bandCounts[b]}
                                active={bandFilter === b}
                                onClick={() => pickBand(b)}
                            />
                        ))}
                    </div>
                </div>

                {/* STEP 2 — Meals/day. Only visible once a calorie band
                    has been picked. Each pick reveals the plan list. */}
                {bandFilter !== null && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 text-on-surface-variant text-[10px] font-label font-bold uppercase tracking-[0.18em]">
                                <Utensils size={12} /> Step 2 · {t('mealsPerDay') ?? 'Meals/day'}
                            </div>
                            {mealFilter !== null && (
                                <button
                                    onClick={() => setMealFilter(null)}
                                    className="text-[10px] font-label font-bold uppercase tracking-widest text-primary hover:underline"
                                >
                                    Change
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {MEAL_COUNTS.map(m => (
                                <MealCountCard
                                    key={m}
                                    value={m}
                                    count={mealCounts[m]}
                                    active={mealFilter === m}
                                    onClick={() => setMealFilter(m)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3 — Plan list. Only visible after both picks. */}
                {bandFilter === null || mealFilter === null ? (
                    <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-10 md:p-14 text-center">
                        <div
                            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'rgb(var(--primary) / 0.10)' }}
                        >
                            <Salad size={22} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-[18px] text-on-surface mb-2">
                            {bandFilter === null ? 'Pick a calorie tier' : 'Pick a meal cadence'}
                        </h3>
                        <p className="text-[13px] text-on-surface-variant font-body leading-relaxed max-w-md mx-auto">
                            {bandFilter === null
                                ? 'Tap one of the calorie cards above to begin. Meal cadence appears next.'
                                : 'Choose 3 meals, 4 meals, or any cadence. Matching plans appear below.'}
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-8 text-center">
                        <div
                            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'rgb(var(--primary) / 0.10)' }}
                        >
                            <FileText size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-[18px] text-on-surface mb-2">
                            {dietPlans.length === 0
                                ? (t('dietCatalogEmpty') ?? 'Plans coming soon')
                                : (t('dietNoFilterMatch') ?? 'No plans match these filters')
                            }
                        </h3>
                        <p className="text-[13px] text-on-surface-variant font-body leading-relaxed">
                            {dietPlans.length === 0
                                ? (t('dietCatalogEmptyBody') ?? 'Coach is preparing the diet PDFs. Run the calculator above to save your targets — plans will be matched automatically.')
                                : (t('dietNoFilterMatchBody') ?? 'Try a different goal or meal count.')
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(d => {
                            const isActive = d.id === assignedDietId;
                            return (
                                <article
                                    key={d.id}
                                    onClick={() => navigate(`/diets/plan/${d.id}`)}
                                    className="bzt-hero-card rounded-2xl bg-surface-container overflow-hidden cursor-pointer"
                                    style={{
                                        border: isActive
                                            ? '1px solid rgb(var(--primary) / 0.55)'
                                            : '1px solid rgb(var(--outline-variant) / 0.30)',
                                        boxShadow: isActive ? '0 12px 32px rgb(var(--primary) / 0.18)' : undefined,
                                    }}
                                >
                                    <div
                                        className="h-32 bzt-hero-photo relative"
                                        style={{
                                            // Resolution order: per-plan static override → tier cover
                                            // (from /public/diets/covers/) → primary-tinted gradient.
                                            background: `url(${d.coverImageUrl ?? coverUrl(d.calories)}) center/cover no-repeat, linear-gradient(135deg, rgb(var(--primary) / 0.18), rgb(var(--primary-container) / 0.05))`,
                                        }}
                                    >
                                        {isActive && (
                                            <span
                                                className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-label font-extrabold uppercase tracking-[0.18em]"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                                                    color: 'rgb(var(--on-primary))',
                                                    boxShadow: '0 6px 14px rgb(var(--primary) / 0.32)',
                                                }}
                                            >
                                                <CheckCircle2 size={11} strokeWidth={3} />
                                                {t('active') ?? 'Active'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-primary">
                                            {d.label ? `${d.label} · ` : ''}{d.mealsPerDay} {t('mealsPerDay') ?? 'meals'}
                                        </div>
                                        <h3 className="font-headline font-extrabold text-[18px] text-on-surface tracking-tight">{tPlanName(d.name, lang, t('mealsWord'))}</h3>
                                        <div className="flex items-baseline gap-3 pt-1 border-t border-outline-variant/20">
                                            <span className="font-headline font-extrabold text-[22px] text-primary">{d.calories}</span>
                                            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">kcal</span>
                                            <span className="ml-auto text-[12px] text-on-surface-variant">
                                                {d.macros.protein}P · {d.macros.carbs}C · {d.macros.fat}F
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <DietCoverAttributions />

            {showWizard && <DietWizard onClose={() => setShowWizard(false)} />}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────
// BigCalorieBandCard — full-photo card, one per calorie tier. Uses
// the same per-tier cover image the matching plan thumbnails use, so
// the user sees the kind of food they'd be eating at that calorie
// level before committing. Active card gets a gold border + Active
// pill in the top corner.
//
// "All" tier gets the mid-balance cover as a representative.
// ─────────────────────────────────────────────────────────────────────
// Representative kcal per band — feeds coverUrl() which is keyed on
// calories rather than band name. We pick a value squarely inside
// each band so a future cover-tier shift doesn't accidentally fall
// into a different bucket.
const REPRESENTATIVE_KCAL: Record<'all' | DietBand, number> = {
    all: 2000,    // balanced tier
    low: 1500,    // lean
    mid: 2200,    // highProtein
    high: 2800,   // performance
    super: 3400,  // athlete
};

function BigCalorieBandCard({
    value, count, active, onClick,
}: {
    value: 'all' | DietBand;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    const title = value === 'all' ? 'All tiers' : BAND_RANGE[value];
    const cover = coverUrl(REPRESENTATIVE_KCAL[value]);
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative overflow-hidden rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{
                aspectRatio: '16 / 10',
                border: active ? '2px solid rgb(var(--primary))' : '1px solid rgb(var(--outline-variant) / 0.30)',
                boxShadow: active
                    ? '0 14px 32px rgb(var(--primary) / 0.30)'
                    : '0 8px 24px rgba(0,0,0,0.20)',
            }}
        >
            {/* Photo backdrop — same tier covers used on the plan cards. */}
            <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
                style={{
                    backgroundImage: `url(${cover})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {/* Bottom darken so the title + count are legible regardless
                of cover brightness. Slightly heavier when active so the
                gold border has visual support. */}
            <div
                className="absolute inset-0"
                style={{
                    background: active
                        ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)'
                        : 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.80) 100%)',
                }}
            />

            {/* Active pill — top-right when this tier is the current
                selection. */}
            {active && (
                <span
                    className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-label font-extrabold uppercase tracking-[0.18em]"
                    style={{
                        background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                        color: 'rgb(var(--on-primary))',
                        boxShadow: '0 6px 14px rgb(var(--primary) / 0.32)',
                    }}
                >
                    <CheckCircle2 size={11} strokeWidth={3} /> Active
                </span>
            )}

            {/* Title + meta — anchored to the bottom-left. */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <span
                    className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] block mb-1.5"
                    style={{ color: '#e6c364' }}
                >
                    {value === 'all' ? 'Browse everything' : `${value} tier`}
                </span>
                <h3
                    className="font-headline font-extrabold text-2xl md:text-[26px] leading-none tracking-tight"
                    style={{ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
                >
                    {title}
                </h3>
                <p
                    className="text-xs font-body mt-2"
                    style={{ color: 'rgb(255 255 255 / 0.78)' }}
                >
                    {count} {count === 1 ? 'plan' : 'plans'} · kcal
                </p>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────
// MealCountCard — same pattern, tiny grid (3 tiles). Big number is
// the meal count so the user reads "3" / "4" at a glance.
// ─────────────────────────────────────────────────────────────────────
function MealCountCard({
    value, count, active, onClick,
}: {
    value: 'all' | 3 | 4;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    const label = value === 'all' ? 'All' : String(value);
    const sub = value === 'all' ? 'any cadence' : 'meals / day';
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{
                background: active ? 'rgb(var(--primary) / 0.10)' : 'rgb(var(--surface-container-lowest))',
                border: active ? '2px solid rgb(var(--primary))' : '1px solid rgb(var(--outline-variant) / 0.30)',
                boxShadow: active ? '0 8px 20px rgb(var(--primary) / 0.20)' : undefined,
            }}
        >
            <div className="flex items-center justify-between gap-2 mb-2">
                <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                        background: active ? 'rgb(var(--primary) / 0.20)' : 'rgb(var(--surface-container))',
                        color: active ? 'rgb(var(--primary))' : 'rgb(var(--on-surface) / 0.55)',
                    }}
                >
                    <Utensils size={16} />
                </span>
                {active && (
                    <span className="text-[9px] font-label font-bold uppercase tracking-widest text-primary">Active</span>
                )}
            </div>
            <h3 className="font-headline font-extrabold text-2xl leading-none text-on-surface">
                {label}
            </h3>
            <p className="text-[11px] text-on-surface/45 font-body mt-2">
                {count} {count === 1 ? 'plan' : 'plans'} · {sub}
            </p>
        </button>
    );
}

export default Diets;
