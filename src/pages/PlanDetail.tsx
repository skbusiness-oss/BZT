/**
 * PlanDetail — full coded diet plan view at /diets/plan/:id.
 *
 * Replaces the PDF download as the primary surface. Renders the entire diet
 * plan in-app as a long, structured article so the user can self-coach
 * without ever leaving the app. Optimised for "explain to a caveman":
 *
 *   1. Hero: kcal tier, meal count, label, today's day-type toggle
 *   2. How this plan works — 3 plain-English rules
 *   3. Worked example — pick a meal, show grams of real food to hit it
 *   4. Training-day meal table (carbs / protein / fat per meal)
 *   5. Rest-day meal table
 *   6. Food keys (proteins, carbs, fats, veggies, fruits)
 *   7. Supplements
 *   8. Carb-adjustment note + the 7-group signals matrix
 *   9. Disclaimer
 *
 * Pulls plan data from `src/data/diets/index.ts` and shared reference content
 * from `src/data/diets/reference.ts`. PDF is offered as a download fallback.
 */
import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Sparkles, FileDown, Sun, Moon, Apple, Beef, Wheat, Droplet,
    Carrot, Cherry, Pill, AlertTriangle, BookOpen, Calculator, Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAssignedDiet } from '../hooks/useAssignedDiet';
import {
    dietPlans,
    PROTEIN_KEYS, CARB_KEYS, FAT_KEYS, VEGGIES, FRUITS,
    SUPPLEMENTS, SIGNAL_GROUPS,
} from '../data/diets';
import {
    tFood, tSupplement, tSignal, tAction, tSignalGroupTitle, tMealName, tExtras,
} from '../lib/dietTranslations';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Diet, DietDayMacros, DietMeal } from '../types';

// ─── Worked-example math ────────────────────────────────────────────────
// Given a target macro (grams) and a food's per-100g content (or per-20g
// for fats), return the grams of food needed to hit that target. Rounded
// to a sensible portion size (5g step) so a person can actually weigh it.
function gramsOfFoodForMacro(target: number, perUnit: number, unitGrams: number) {
    if (perUnit <= 0 || target <= 0) return 0;
    const exact = (target / perUnit) * unitGrams;
    return Math.max(5, Math.round(exact / 5) * 5);
}

// Pick a sensible primary protein, carb, fat for the worked example.
const PRIMARY_PROTEIN = PROTEIN_KEYS[0]; // chicken breast
const PRIMARY_CARB    = CARB_KEYS[1];    // rice (cooked, dry rice content)
const PRIMARY_FAT     = FAT_KEYS[2];     // almonds (per 20g)

type DietTabId = 'meals' | 'foods' | 'supplements' | 'adjust' | 'notes';
type FoodTabId = 'protein' | 'carbs' | 'fats' | 'free';
type SignalGroupOption = typeof SIGNAL_GROUPS[number];
type SignalRowOption = SignalGroupOption['rows'][number];

export const PlanDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, lang } = useLanguage();

    const plan = useMemo(() => dietPlans.find(d => d.id === id), [id]);

    // Live-read the user's currently-assigned plan id so we know whether
    // assigning the plan being viewed is *new* or a *replace*.
    const { assignedDietId } = useAssignedDiet();
    const isReplacing = !!assignedDietId && assignedDietId !== plan?.id;
    const isAlreadyMine = !!assignedDietId && assignedDietId === plan?.id;
    const currentPlanForBanner = useMemo(
        () => (isReplacing ? dietPlans.find(d => d.id === assignedDietId) : undefined),
        [isReplacing, assignedDietId],
    );

    // Default to training-day view when toggle hasn't been touched. We don't
    // auto-detect from the user's program day here — the user picks. Keeps
    // the page simple and predictable.
    const [dayMode, setDayMode] = useState<'training' | 'rest'>('training');
    const [activeDietTab, setActiveDietTab] = useState<DietTabId>('meals');
    const [activeFoodTab, setActiveFoodTab] = useState<FoodTabId>('protein');
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignedJustNow, setAssignedJustNow] = useState(false);
    const [selectedSignalGroupTitle, setSelectedSignalGroupTitle] = useState(SIGNAL_GROUPS[0]?.title ?? '');
    const [selectedSignalKey, setSelectedSignalKey] = useState(SIGNAL_GROUPS[0]?.rows[0]?.signal ?? '');
    const selectedSignalGroup = SIGNAL_GROUPS.find(group => group.title === selectedSignalGroupTitle) ?? SIGNAL_GROUPS[0];
    const selectedSignal = selectedSignalGroup?.rows.find(row => row.signal === selectedSignalKey) ?? selectedSignalGroup?.rows[0];

    const detailTabs: { id: DietTabId; label: string; icon: React.ReactNode }[] = [
        { id: 'meals', label: t('dailyPlan'), icon: <Sun size={14} /> },
        { id: 'foods', label: t('foodKeysTitle'), icon: <Apple size={14} /> },
        { id: 'supplements', label: t('supplementsTitle'), icon: <Pill size={14} /> },
        { id: 'adjust', label: t('adjustCarbsTitle'), icon: <Flame size={14} /> },
        { id: 'notes', label: lang === 'ar' ? 'ملاحظات' : 'Notes', icon: <AlertTriangle size={14} /> },
    ];

    const foodTabs: { id: FoodTabId; label: string; icon: React.ReactNode }[] = [
        { id: 'protein', label: t('proteinSources'), icon: <Beef size={14} /> },
        { id: 'carbs', label: t('carbSources'), icon: <Wheat size={14} /> },
        { id: 'fats', label: t('fatSources'), icon: <Droplet size={14} /> },
        { id: 'free', label: `${t('veggies')} / ${t('fruits')}`, icon: <Carrot size={14} /> },
    ];

    const handleSignalGroupSelect = (group: SignalGroupOption) => {
        setSelectedSignalGroupTitle(group.title);
        setSelectedSignalKey(group.rows[0]?.signal ?? '');
    };

    if (!plan) {
        return (
            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-24 text-center">
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-10">
                    <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">
                        {t('planNotFound')}
                    </h1>
                    <p className="text-on-surface-variant font-body mb-6">
                        {t('planNotFoundBody')}
                    </p>
                    <Link
                        to="/diets"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.18em]"
                        style={{
                            background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                            color: 'rgb(var(--on-primary))',
                        }}
                    >
                        <ArrowLeft size={14} /> {t('backToDiets')}
                    </Link>
                </div>
            </div>
        );
    }

    const day: DietDayMacros = dayMode === 'training' ? plan.trainingDay : plan.restDay;

    // ── Self-assign to userDiets/{uid}. Mirrors what the wizard does. ──
    const handleAssign = async () => {
        if (!user) return;
        setAssigning(true);
        setAssignError(null);
        try {
            await setDoc(doc(db, 'userDiets', user.id), {
                id: user.id,
                userId: user.id,
                dietId: plan.id,
                snapshot: {
                    name: plan.name,
                    mealsPerDay: plan.mealsPerDay,
                    calories: plan.calories,
                    macros: plan.macros,
                    pdfUrl: plan.pdfUrl ?? null,
                },
                assignedAt: serverTimestamp(),
            });
            setAssignedJustNow(true);
        } catch (e: any) {
            console.error('Failed to assign diet:', e);
            setAssignError(e?.message ?? 'Failed to assign.');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-32 space-y-12">
            {/* Back link */}
            <button
                onClick={() => navigate('/diets')}
                className="bzt-press inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-[11px] font-label font-bold uppercase tracking-[0.18em] transition-colors -mb-2"
            >
                <ArrowLeft size={14} /> {t('backToDiets')}
            </button>

            {/* ── Hero ─────────────────────────────────────────────── */}
            <Hero
                plan={plan}
                onAssign={handleAssign}
                assigning={assigning}
                assignError={assignError}
                assigned={assignedJustNow || isAlreadyMine}
                replacingPlanName={currentPlanForBanner?.name}
            />

            {/* ── How this plan works ───────────────────────────────── */}
            <Section
                eyebrow={t('howThisWorks')}
                title={t('howThisWorksTitle')}
                icon={<BookOpen size={16} className="text-primary" />}
            >
                <ol className="space-y-3 list-none counter-reset-step">
                    <Rule n={1} title={t('howRule1Title')} body={t('howRule1Body')} />
                    <Rule n={2} title={t('howRule2Title')} body={t('howRule2Body')} />
                    <Rule n={3} title={t('howRule3Title')} body={t('howRule3Body')} />
                </ol>
            </Section>

            {/* ── Worked example — explain like a caveman ───────────── */}
            <WorkedExample plan={plan} />

            {/* ── Day toggle + meal table ───────────────────────────── */}
            <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {detailTabs.map(tab => (
                        <TabButton key={tab.id} active={activeDietTab === tab.id} onClick={() => setActiveDietTab(tab.id)}>
                            {tab.icon} {tab.label}
                        </TabButton>
                    ))}
                </div>

                {activeDietTab === 'meals' && (
                    <Section
                        eyebrow={t('dailyPlan')}
                        title={dayMode === 'training' ? t('trainingDay') : t('restDay')}
                        icon={dayMode === 'training' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
                        actions={
                            <div className="inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-lowest p-1">
                                <DayTab active={dayMode === 'training'} onClick={() => setDayMode('training')}>
                                    <Sun size={12} /> {t('trainingShort')}
                                </DayTab>
                                <DayTab active={dayMode === 'rest'} onClick={() => setDayMode('rest')}>
                                    <Moon size={12} /> {t('restShort')}
                                </DayTab>
                            </div>
                        }
                    >
                        <DayTotals day={day} />
                        <MealsTable meals={day.meals} lang={lang} />
                    </Section>
                )}

                {activeDietTab === 'foods' && (
                    <Section
                        eyebrow={t('foodKeys')}
                        title={t('foodKeysTitle')}
                        icon={<Apple size={16} className="text-primary" />}
                    >
                        <p className="text-[13.5px] text-on-surface-variant font-body leading-relaxed mb-5 max-w-2xl">
                            {t('foodKeysIntro')}
                        </p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
                            {foodTabs.map(tab => (
                                <TabButton key={tab.id} active={activeFoodTab === tab.id} onClick={() => setActiveFoodTab(tab.id)} compact>
                                    {tab.icon} {tab.label}
                                </TabButton>
                            ))}
                        </div>
                        {activeFoodTab === 'protein' && (
                            <KeyTable
                                icon={<Beef size={14} className="text-primary" />}
                                title={t('proteinSources')}
                                headers={[t('foodHeaderFood'), 'P', 'C', 'F']}
                                rows={PROTEIN_KEYS.map(p => [tFood(p.food, lang), `${p.protein}`, `${p.carbs}`, `${p.fat}`])}
                            />
                        )}
                        {activeFoodTab === 'carbs' && (
                            <KeyTable
                                icon={<Wheat size={14} className="text-primary" />}
                                title={t('carbSources')}
                                headers={[t('foodHeaderFood'), 'P', 'C', t('foodHeaderFibre'), 'F']}
                                rows={CARB_KEYS.map(c => [tFood(c.food, lang), `${c.protein}`, `${c.carbs}`, `${c.fibers}`, `${c.fat}`])}
                            />
                        )}
                        {activeFoodTab === 'fats' && (
                            <KeyTable
                                icon={<Droplet size={14} className="text-primary" />}
                                title={t('fatSources')}
                                headers={[t('foodHeaderFood'), 'P', 'C', 'F']}
                                rows={FAT_KEYS.map(f => [tFood(f.food, lang), `${f.protein}`, `${f.carbs}`, `${f.fat}`])}
                            />
                        )}
                        {activeFoodTab === 'free' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FreeFoodCard icon={<Carrot size={14} className="text-emerald-400" />} title={t('veggies')} items={VEGGIES.map(v => tFood(v, lang))} />
                                <FreeFoodCard icon={<Cherry size={14} className="text-rose-400" />} title={t('fruits')} items={FRUITS.map(f => tFood(f, lang))} />
                            </div>
                        )}
                    </Section>
                )}

                {activeDietTab === 'supplements' && (
                    <Section eyebrow={t('supplementsEyebrow')} title={t('supplementsTitle')} icon={<Pill size={16} className="text-primary" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SupplementCard when={t('preBreakfast')} items={SUPPLEMENTS.preBreakfast.map(s => tSupplement(s, lang))} />
                            <SupplementCard when={t('intraWorkout')} items={SUPPLEMENTS.intraWorkout.map(s => tSupplement(s, lang))} />
                            <SupplementCard when={t('postWorkout')} items={SUPPLEMENTS.postWorkout.map(s => tSupplement(s, lang))} />
                        </div>
                    </Section>
                )}

                {activeDietTab === 'adjust' && (
                    <Section eyebrow={t('weeklyCheckin')} title={t('adjustCarbsTitle')} icon={<Flame size={16} className="text-primary" />}>
                        <DietDecisionGuide
                            groups={SIGNAL_GROUPS}
                            selectedGroup={selectedSignalGroup}
                            selectedSignal={selectedSignal}
                            selectedKey={selectedSignalKey}
                            onSelectGroup={handleSignalGroupSelect}
                            onSelectSignal={setSelectedSignalKey}
                            lang={lang}
                        />
                        <details className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4">
                            <summary className="cursor-pointer text-[11px] font-label font-extrabold uppercase tracking-[0.18em] text-on-surface-variant">
                                {lang === 'ar' ? 'كل الحالات' : 'Full reference matrix'}
                            </summary>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {SIGNAL_GROUPS.map(g => (
                                    <SignalGroupCard key={g.title} group={g} lang={lang} />
                                ))}
                            </div>
                        </details>
                    </Section>
                )}

                {activeDietTab === 'notes' && (
                    <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-6 space-y-4">
                        <p className="text-[12.5px] text-on-surface-variant font-body leading-relaxed italic">
                            {t('dietDisclaimer')}
                        </p>
                        <p className="text-[14px] text-primary font-headline font-bold tracking-tight italic">
                            “{t('dietQuote')}”
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default PlanDetail;

// ─── Hero ───────────────────────────────────────────────────────────────
function Hero({ plan, onAssign, assigning, assignError, assigned, replacingPlanName }: {
    plan: Diet; onAssign: () => void; assigning: boolean; assignError: string | null; assigned: boolean;
    /** Name of the user's current plan when assigning this one would replace it. */
    replacingPlanName?: string;
}) {
    const { t } = useLanguage();
    return (
        <section
            className="bzt-rise-in relative overflow-hidden rounded-3xl border border-outline-variant/30"
            style={{ minHeight: 260 }}
        >
            {/* Cookbook + plate hero photo. Per-plan tier covers are great
                on the catalog grid, but a single editorial photo here keeps
                the long detail page calm and consistent across all plans. */}
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/diets/covers/plan-detail-hero.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)',
            }} />
            <div className="bzt-halo-drift absolute -top-20 -right-12 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgb(var(--primary) / 0.20), transparent 70%)', animationDuration: '24s' }}
            />
            <div className="relative p-7 md:p-10">
                <div className="flex items-center gap-2.5 mb-4">
                    <Sparkles size={14} style={{ color: '#e6c364' }} />
                    <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em]" style={{ color: '#e6c364' }}>
                        {plan.label ? `${plan.label} · ` : ''}{plan.mealsPerDay} {t('mealsPerDay')}
                    </span>
                </div>
                <h1 className="font-headline font-extrabold text-[clamp(1.8rem,3.6vw,2.6rem)] tracking-[-0.03em] leading-[1.1] mb-6"
                    style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>
                    {plan.name}
                </h1>

                {/* Stat row — translucent so the photo bleeds through, white
                    text. RTL-friendly: borders flip via logical `border-s`. */}
                <div className="grid grid-cols-4 max-w-md rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                    }}>
                    <HeroStat value={plan.calories} label="kcal" hero />
                    <HeroStat value={plan.macros.protein} suffix="g" label={t('protein')} divided />
                    <HeroStat value={plan.macros.carbs}   suffix="g" label={t('carbs')}   divided />
                    <HeroStat value={plan.macros.fat}     suffix="g" label={t('fats')}    divided />
                </div>

                {/* Replace-confirm — only when user has an active *different* plan. */}
                {replacingPlanName && !assigned && (
                    <div
                        className="mt-7 rounded-2xl px-5 py-4 flex items-start gap-3 bzt-fade-in"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgb(var(--primary) / 0.45)',
                        }}
                    >
                        <AlertTriangle size={16} style={{ color: '#e6c364' }} className="shrink-0 mt-0.5" />
                        <div className="text-[12.5px] font-body leading-relaxed" style={{ color: '#fff' }}>
                            {t('replaceCurrentPlanLead')}
                            {' '}
                            <span className="font-headline font-bold">{replacingPlanName}</span>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                        onClick={onAssign}
                        disabled={assigning || assigned}
                        className="bzt-press inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.2em] disabled:opacity-60 transition-all"
                        style={{
                            background: assigned
                                ? 'rgb(var(--surface-container-highest))'
                                : 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                            color: assigned ? 'rgb(var(--on-surface) / 0.85)' : 'rgb(var(--on-primary))',
                            boxShadow: assigned ? 'none' : '0 12px 28px rgb(var(--primary) / 0.32)',
                        }}
                    >
                        <Sparkles size={14} />
                        {assigning
                            ? t('assigning')
                            : assigned
                                ? t('assigned')
                                : replacingPlanName
                                    ? t('replaceWithThisPlan')
                                    : t('assignDietCta')
                        }
                    </button>

                    {plan.pdfUrl && (
                        <a
                            href={plan.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bzt-press inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-label font-bold text-[11px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface border border-outline-variant/40 transition-colors"
                        >
                            <FileDown size={14} /> {t('downloadPdf')}
                        </a>
                    )}
                </div>

                {assignError && (
                    <p className="mt-4 text-[12.5px] text-red-400 font-body">{assignError}</p>
                )}
            </div>
        </section>
    );
}

// 4-up stat block in the hero. Each cell renders as a self-contained tile
// — generous vertical padding, optional logical-start-side divider, and
// a small unit chip beneath the value so the macro words ("PROTEIN" /
// "بروتين") never sit flush against the number.
function HeroStat({ value, suffix, label, hero, divided }: {
    value: number; suffix?: string; label: string; hero?: boolean; divided?: boolean;
}) {
    // Tuned for the dark photo backdrop on the PlanDetail Hero —
    // gold for the kcal value, white for macro values, soft white for the labels.
    return (
        <div
            className={`px-4 py-5 md:px-5 md:py-6 ${divided ? 'border-s' : ''}`}
            style={divided ? { borderColor: 'rgba(255,255,255,0.18)' } : undefined}
        >
            <div
                className={`font-headline font-extrabold tracking-tight leading-none ${hero ? 'text-[26px] md:text-[30px]' : 'text-[22px] md:text-[26px]'}`}
                style={{
                    color: hero ? '#e6c364' : '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}
            >
                {value}
            </div>
            <div className="mt-3 space-y-0.5">
                <div
                    className="text-[10px] font-label font-bold uppercase tracking-[0.18em] leading-tight"
                    style={{ color: 'rgba(255,255,255,0.72)' }}
                >
                    {suffix ? `${suffix} · ${label}` : label}
                </div>
            </div>
        </div>
    );
}

// ─── Worked example ─────────────────────────────────────────────────────
function WorkedExample({ plan }: { plan: Diet }) {
    const { t, lang } = useLanguage();
    // Pick the heaviest meal (most carbs) from the training day so the
    // numbers are concrete and meaningful.
    const meal = plan.trainingDay.meals.reduce<DietMeal>(
        (best, m) => (m.carbs + m.protein + m.fat > best.carbs + best.protein + best.fat ? m : best),
        plan.trainingDay.meals[0],
    );

    const proteinFood  = tFood(PRIMARY_PROTEIN.food, lang);
    const proteinGrams = gramsOfFoodForMacro(meal.protein, PRIMARY_PROTEIN.protein, 100);

    const carbFood  = tFood(PRIMARY_CARB.food, lang);
    const carbGrams = gramsOfFoodForMacro(meal.carbs, PRIMARY_CARB.carbs, 100);

    const fatFood  = tFood(PRIMARY_FAT.food, lang);
    const fatGrams = gramsOfFoodForMacro(meal.fat, PRIMARY_FAT.fat, 20);

    // Interpolate the meal name into the section title.
    const title = t('workedExampleTitleFor').replace('{name}', tMealName(meal.name, lang));
    const intro = t('workedExampleIntro')
        .replace('{c}', String(meal.carbs))
        .replace('{p}', String(meal.protein))
        .replace('{f}', String(meal.fat));

    return (
        <Section
            eyebrow={t('workedExample')}
            title={title}
            icon={<Calculator size={16} className="text-primary" />}
        >
            <p className="text-[13.5px] text-on-surface-variant font-body leading-relaxed mb-5 max-w-2xl">
                {intro}
            </p>

            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest divide-y divide-outline-variant/15 overflow-hidden">
                {meal.protein > 0 && (
                    <ExampleRow
                        macro="P"
                        target={`${meal.protein}g`}
                        food={proteinFood}
                        amount={`${proteinGrams}g`}
                        math={`${meal.protein}g ÷ ${PRIMARY_PROTEIN.protein}g/100g × 100`}
                    />
                )}
                {meal.carbs > 0 && (
                    <ExampleRow
                        macro="C"
                        target={`${meal.carbs}g`}
                        food={`${carbFood} (${t('uncookedSuffix')})`}
                        amount={`${carbGrams}g`}
                        math={`${meal.carbs}g ÷ ${PRIMARY_CARB.carbs}g/100g × 100`}
                    />
                )}
                {meal.fat > 0 && (
                    <ExampleRow
                        macro="F"
                        target={`${meal.fat}g`}
                        food={fatFood}
                        amount={`${fatGrams}g`}
                        math={`${meal.fat}g ÷ ${PRIMARY_FAT.fat}g/20g × 20`}
                    />
                )}
                {meal.extras && (
                    <div className="px-5 py-3.5 text-[12.5px] text-on-surface-variant font-body italic">
                        + {tExtras(meal.extras, lang)}
                    </div>
                )}
            </div>

            <p className="mt-5 text-[12.5px] text-on-surface-variant font-body leading-relaxed max-w-2xl">
                {t('workedExampleNote')}
            </p>
        </Section>
    );
}

function ExampleRow({ macro, target, food, amount, math }: {
    macro: string; target: string; food: string; amount: string; math: string;
}) {
    return (
        <div className="px-5 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <span
                className="w-9 h-9 rounded-xl flex items-center justify-center font-headline font-extrabold text-[13px] text-primary"
                style={{ background: 'rgb(var(--primary) / 0.12)' }}
            >
                {macro}
            </span>
            <div className="min-w-0">
                <div className="font-headline font-bold text-on-surface text-[14px] truncate mb-0.5">
                    <span className="text-primary">{amount}</span>
                    <span className="text-on-surface/40 mx-1.5">·</span>
                    {food}
                </div>
                <div className="text-[11.5px] text-on-surface-variant font-body truncate tabular-nums">
                    {math}
                </div>
            </div>
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface/55">
                → {target}
            </span>
        </div>
    );
}

// ─── Day totals + meals ─────────────────────────────────────────────────
function DayTotals({ day }: { day: DietDayMacros }) {
    const { t } = useLanguage();
    return (
        <div className="grid grid-cols-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/25 overflow-hidden mb-5">
            <Stat value={day.kcal}    label="kcal"          hero />
            <Stat value={day.protein} suffix="g" label={t('protein')} divided />
            <Stat value={day.carbs}   suffix="g" label={t('carbs')}   divided />
            <Stat value={day.fat}     suffix="g" label={t('fats')}    divided />
        </div>
    );
}

function Stat({ value, suffix, label, hero, divided }: {
    value: number; suffix?: string; label: string; hero?: boolean; divided?: boolean;
}) {
    return (
        <div className={`px-3 py-5 md:px-4 md:py-6 text-center ${divided ? 'border-s border-outline-variant/25' : ''}`}>
            <div className={`font-headline font-extrabold tracking-tight leading-none ${hero ? 'text-[22px] md:text-[24px] text-primary' : 'text-[19px] md:text-[20px] text-on-surface'}`}>
                {value}
            </div>
            <div className="mt-2.5 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-on-surface/55 leading-tight">
                {suffix ? `${suffix} · ${label}` : label}
            </div>
        </div>
    );
}

function MealsTable({ meals, lang }: { meals: DietMeal[]; lang: 'en' | 'ar' }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 overflow-hidden">
            <div className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 bg-surface-container border-b border-outline-variant/20 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                <span>{lang === 'ar' ? 'الوجبة' : 'Meal'}</span>
                <span className="w-12 text-right">C</span>
                <span className="w-12 text-right">P</span>
                <span className="w-12 text-right">F</span>
            </div>
            <div className="divide-y divide-outline-variant/15">
                {meals.map(m => (
                    <div key={m.order} className="px-5 py-4 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 text-[13.5px]">
                        <div className="min-w-0">
                            <div className="font-headline font-bold text-on-surface truncate">{tMealName(m.name, lang)}</div>
                            {m.extras && (
                                <div className="text-[12px] text-on-surface-variant truncate mt-1">+ {tExtras(m.extras, lang)}</div>
                            )}
                        </div>
                        <span className="w-12 text-right tabular-nums text-on-surface font-bold">{m.carbs > 0 ? `${m.carbs}g` : '—'}</span>
                        <span className="w-12 text-right tabular-nums text-on-surface font-bold">{m.protein}g</span>
                        <span className="w-12 text-right tabular-nums text-on-surface font-bold">{m.fat > 0 ? `${m.fat}g` : '—'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Generic table for food keys ────────────────────────────────────────
function KeyTable({ icon, title, headers, rows }: {
    icon: React.ReactNode; title: string; headers: string[]; rows: string[][];
}) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-2.5 bg-surface-container border-b border-outline-variant/20">
                {icon}
                <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-on-surface">{title}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                    <thead>
                        <tr className="text-on-surface-variant">
                            {headers.map((h, i) => (
                                <th key={h}
                                    className={`px-5 py-3 font-label font-bold uppercase tracking-[0.14em] text-[10px] ${i === 0 ? 'text-left' : 'text-right'}`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                        {rows.map((r, i) => (
                            <tr key={i}>
                                {r.map((cell, j) => (
                                    <td key={j}
                                        className={`px-5 py-3.5 ${j === 0 ? 'text-left font-headline font-bold text-on-surface' : 'text-right tabular-nums text-on-surface-variant'}`}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FreeFoodCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: readonly string[] }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 p-5">
            <div className="flex items-center gap-2.5 mb-3">
                {icon}
                <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-on-surface">{title}</span>
            </div>
            <p className="text-[13.5px] text-on-surface-variant font-body leading-relaxed">
                {items.join(', ')}.
            </p>
        </div>
    );
}

function SupplementCard({ when, items }: { when: string; items: string[] }) {
    return (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 p-5">
            <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-primary mb-4">
                {when}
            </div>
            <ul className="space-y-2.5 text-[13.5px] text-on-surface font-body">
                {items.map(it => (
                    <li key={it} className="flex items-baseline gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 translate-y-[-2px]" />
                        <span className="leading-relaxed">{it}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DietDecisionGuide(props: {
    groups?: SignalGroupOption[];
    selectedGroup?: SignalGroupOption;
    selectedSignal?: SignalRowOption;
    selectedKey: string;
    onSelectGroup?: (group: SignalGroupOption) => void;
    onSelectSignal?: (key: string) => void;
    options?: { group: SignalGroupOption; row: SignalRowOption }[];
    selected?: { group: SignalGroupOption; row: SignalRowOption } | SignalRowOption;
    onSelect?: (key: string) => void;
    lang: 'en' | 'ar';
}) {
    const groups = props.groups ?? Array.from(new Map((props.options ?? []).map(item => [item.group.title, item.group])).values());
    const selectedProp = props.selected && 'row' in props.selected ? props.selected : undefined;
    const selectedRowProp = props.selected && !('row' in props.selected) ? props.selected : undefined;
    const selectedGroup = props.selectedGroup ?? selectedProp?.group ?? groups[0];
    const selectedSignal = props.selectedSignal ?? selectedProp?.row ?? selectedRowProp ?? selectedGroup?.rows[0];
    const onSelectSignal = props.onSelectSignal ?? props.onSelect ?? (() => {});
    const onSelectGroup = props.onSelectGroup ?? ((group: SignalGroupOption) => onSelectSignal(group.rows[0]?.signal ?? ''));

    if (!selectedGroup || !selectedSignal) return null;

    return (
        <div className="space-y-5">
            <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 p-5">
                <div className="flex items-start gap-4">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[13.5px] text-on-surface font-body leading-relaxed">
                        {props.lang === 'ar'
                            ? 'اختر نوع المشكلة، ثم اختر الحالة الأقرب لأسبوعك. سيظهر لك التعديل المطلوب مباشرة.'
                            : 'Pick the issue area, then the situation closest to your week. The app will show the adjustment directly.'}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-on-surface/50">
                    {props.lang === 'ar' ? '1. اختر المنطقة' : '1. Choose the area'}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {groups.map(group => (
                        <button
                            key={group.title}
                            type="button"
                            onClick={() => onSelectGroup(group)}
                            className={`text-left rounded-xl px-4 py-3 border transition-colors ${selectedGroup.title === group.title
                                ? 'bg-primary/10 border-primary/45 text-on-surface'
                                : 'bg-surface-container-lowest border-outline-variant/25 text-on-surface-variant hover:text-on-surface hover:border-primary/25'
                            }`}
                        >
                            <div className="text-[11px] font-headline font-bold leading-tight">
                                {tSignalGroupTitle(group.title, props.lang)}
                            </div>
                            <div className="mt-2 text-[10px] font-label font-bold uppercase tracking-[0.14em] text-on-surface/40">
                                {group.rows.length} {props.lang === 'ar' ? 'حالات' : 'cases'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] gap-4">
                <div className="space-y-3">
                    <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-on-surface/50">
                        {props.lang === 'ar' ? '2. اختر الحالة' : '2. Choose the situation'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedGroup.rows.map(row => (
                            <button
                                key={row.signal}
                                type="button"
                                onClick={() => onSelectSignal(row.signal)}
                                className={`text-left rounded-xl px-4 py-3 border transition-colors ${props.selectedKey === row.signal
                                    ? 'bg-primary/10 border-primary/45 text-on-surface'
                                    : 'bg-surface-container-lowest border-outline-variant/25 text-on-surface-variant hover:text-on-surface hover:border-primary/25'
                                }`}
                            >
                                <div className="text-[12.5px] font-body leading-relaxed">
                                    {tSignal(row.signal, props.lang)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-primary/[0.06] border border-primary/20 p-5">
                    <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-on-surface/60 mb-3">
                        {tSignalGroupTitle(selectedGroup.title, props.lang)}
                    </div>
                    <p className="text-[13.5px] text-on-surface-variant font-body leading-relaxed mb-5">
                        {tSignal(selectedSignal.signal, props.lang)}
                    </p>
                    <div className="rounded-xl bg-surface-container-lowest/70 border border-outline-variant/25 p-4">
                        <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-primary mb-2">
                            {props.lang === 'ar' ? 'ماذا تفعل' : 'What to do'}
                        </div>
                        <div className="text-[15px] text-primary font-headline font-bold leading-relaxed">
                            {tAction(selectedSignal.action, props.lang)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SignalGroupCard({ group, lang }: { group: typeof SIGNAL_GROUPS[number]; lang: 'en' | 'ar' }) {
    const TONE_BG: Record<typeof group.tone, string> = {
        general:     'rgb(217 119 6 / 0.10)',
        energy:      'rgb(34 197 94 / 0.10)',
        performance: 'rgb(59 130 246 / 0.10)',
        hunger:      'rgb(168 85 247 / 0.10)',
        visual:      'rgb(234 88 12 / 0.10)',
        weight:      'rgb(20 184 166 / 0.10)',
        digestion:   'rgb(139 92 246 / 0.10)',
    };
    const TONE_BORDER: Record<typeof group.tone, string> = {
        general:     'rgb(217 119 6 / 0.45)',
        energy:      'rgb(34 197 94 / 0.45)',
        performance: 'rgb(59 130 246 / 0.45)',
        hunger:      'rgb(168 85 247 / 0.45)',
        visual:      'rgb(234 88 12 / 0.45)',
        weight:      'rgb(20 184 166 / 0.45)',
        digestion:   'rgb(139 92 246 / 0.45)',
    };
    return (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 overflow-hidden">
            <div
                className="px-5 py-3.5"
                style={{ background: TONE_BG[group.tone], borderBottom: `1px solid ${TONE_BORDER[group.tone]}` }}
            >
                <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-on-surface">
                    {tSignalGroupTitle(group.title, lang)}
                </span>
            </div>
            <ul className="divide-y divide-outline-variant/15">
                {group.rows.map(r => (
                    <li key={r.signal} className="px-5 py-4 space-y-2.5">
                        <div className="text-[13px] text-on-surface-variant font-body leading-relaxed">
                            {tSignal(r.signal, lang)}
                        </div>
                        <div className="text-[13px] text-primary font-headline font-bold leading-relaxed flex items-baseline gap-1.5">
                            <span aria-hidden className="text-primary/60">→</span>
                            <span>{tAction(r.action, lang)}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Section + helpers ──────────────────────────────────────────────────
function Section({ eyebrow, title, icon, actions, children }: {
    eyebrow: string; title: string; icon?: React.ReactNode; actions?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                        {icon}
                        <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-primary">
                            {eyebrow}
                        </span>
                    </div>
                    <h2 className="font-headline font-extrabold text-on-surface text-[clamp(1.25rem,2vw,1.6rem)] tracking-[-0.02em] leading-[1.15]">
                        {title}
                    </h2>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

function Rule({ n, title, body }: { n: number; title: string; body: string }) {
    return (
        <li className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 p-6 flex gap-5">
            <span
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-headline font-extrabold text-[16px]"
                style={{ background: 'rgb(var(--primary) / 0.12)', color: 'rgb(var(--primary))' }}
            >
                {n}
            </span>
            <div className="min-w-0">
                <div className="font-headline font-extrabold text-on-surface text-[15.5px] mb-2 leading-snug">{title}</div>
                <p className="text-[13.5px] text-on-surface-variant font-body leading-relaxed max-w-2xl">{body}</p>
            </div>
        </li>
    );
}

function DayTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="bzt-press inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-label font-bold uppercase tracking-[0.16em] transition-all"
            style={{
                background: active ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))' : 'transparent',
                color: active ? 'rgb(var(--on-primary))' : 'rgb(var(--on-surface) / 0.65)',
                boxShadow: active ? '0 6px 14px rgb(var(--primary) / 0.32)' : 'none',
            }}
        >
            {children}
        </button>
    );
}

function TabButton({ active, onClick, children, compact }: {
    active: boolean; onClick: () => void; children: React.ReactNode; compact?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`bzt-press inline-flex items-center gap-2 shrink-0 rounded-full border font-label font-extrabold uppercase tracking-[0.16em] transition-all ${
                compact ? 'px-3.5 py-2 text-[10px]' : 'px-4 py-2.5 text-[10px]'
            }`}
            style={{
                background: active ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))' : 'rgb(var(--surface-container-low))',
                color: active ? 'rgb(var(--on-primary))' : 'rgb(var(--on-surface) / 0.66)',
                borderColor: active ? 'rgb(var(--primary) / 0.75)' : 'rgb(var(--outline-variant) / 0.30)',
                boxShadow: active ? '0 8px 18px rgb(var(--primary) / 0.22)' : 'none',
            }}
        >
            {children}
        </button>
    );
}
