/**
 * DietWizard — 4-step calculator → match → assign flow.
 *
 *   Step 1: Inputs (sex / age / weight / height / activity / goal)
 *   Step 2: Targets (calculated kcal + macros, confirm)
 *   Step 3: Meal count preference (3 or 5 — matches the PDF library)
 *   Step 4: Matched plan + Assign
 *
 * Persists results to `users/{uid}.dietProfile` so the wizard prefills
 * on subsequent runs. Active assignment is written to `userDiets/{uid}`.
 *
 * Inputs are prefilled from the existing user doc when possible:
 *   - community: users/{uid} has heightCm / age / currentWeightKg / goal already
 *   - client:    intakeData has the same fields
 */
import { useMemo, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
    User as UserIcon, Activity, Target, Utensils, ChevronRight, Check,
    ArrowLeft, Loader2, Sparkles, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAssignedDiet } from '../../hooks/useAssignedDiet';
import { db } from '../../lib/firebase';
import {
    computeDietProfile, matchDiet,
    GOAL_ADJUSTMENT,
} from '../../lib/dietCalculator';
import type {
    Sex, ActivityLevel, DietGoal, MealsPerDay, DietProfile, Diet,
} from '../../types';
import { dietPlans } from '../../data/diets';
import { coverUrl } from '../../data/diets/covers';
import { tPlanName } from '../../lib/dietTranslations';

// ─── Translation key lookups ────────────────────────────────────────────
// Map enum values → translation keys. Keeps the JSX clean and lets us
// translate every chip/row label without touching the data layer.
const DIET_GOAL_KEY: Record<DietGoal, string> = {
    aggressive_cut: 'dietGoalAggressiveCut',
    cut:            'dietGoalCut',
    recomp:         'dietGoalRecomp',
    maintain:       'dietGoalMaintain',
    lean_bulk:      'dietGoalLeanBulk',
    bulk:           'dietGoalBulk',
};
const ACTIVITY_KEY: Record<ActivityLevel, string> = {
    sedentary: 'activitySedentary',
    light:     'activityLight',
    moderate:  'activityModerate',
    active:    'activityActive',
    extra:     'activityExtra',
};
const ACTIVITY_DESC_KEY: Record<ActivityLevel, string> = {
    sedentary: 'activitySedentaryDesc',
    light:     'activityLightDesc',
    moderate:  'activityModerateDesc',
    active:    'activityActiveDesc',
    extra:     'activityExtraDesc',
};

const ACTIVITY_OPTIONS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'extra'];
const GOAL_OPTIONS: DietGoal[] = ['aggressive_cut', 'cut', 'recomp', 'maintain', 'lean_bulk', 'bulk'];

type Step = 1 | 2 | 3 | 4;

interface Props {
    onClose?: () => void;
    onAssigned?: (diet: Diet) => void;
}

export const DietWizard = ({ onClose, onAssigned }: Props) => {
    const { user } = useAuth();
    // Look up the user's existing plan id once; if it differs from the
    // wizard's match, we surface a "this will replace…" banner in step 4.
    const { assignedDietId } = useAssignedDiet();
    const { t } = useLanguage();

    const existing = user?.dietProfile;
    const [step, setStep] = useState<Step>(1);

    // ── Step 1 inputs (prefilled from existing profile if any) ──────────
    const [sex, setSex] = useState<Sex>(existing?.sex ?? 'male');
    const [age, setAge] = useState<string>(String(existing?.age ?? user?.age ?? ''));
    const [weightKg, setWeightKg] = useState<string>(String(existing?.weightKg ?? user?.currentWeightKg ?? ''));
    const [heightCm, setHeightCm] = useState<string>(String(existing?.heightCm ?? user?.heightCm ?? ''));
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>(existing?.activityLevel ?? 'moderate');
    const [goal, setGoal] = useState<DietGoal>(existing?.goal ?? mapUserGoalToDietGoal(user?.goal) ?? 'cut');
    const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(existing?.mealsPerDay ?? 3);

    const [savingProfile, setSavingProfile] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Compute profile live as inputs change (Step 2 reads from this).
    const profile: DietProfile | null = useMemo(() => {
        const a = Number(age), w = Number(weightKg), h = Number(heightCm);
        if (!(a > 0 && w > 0 && h > 0)) return null;
        return computeDietProfile({
            sex, age: a, weightKg: w, heightCm: h,
            activityLevel, goal, mealsPerDay,
        });
    }, [sex, age, weightKg, heightCm, activityLevel, goal, mealsPerDay]);

    // Match against the catalog (may be null if no PDFs loaded yet).
    const matched: Diet | null = useMemo(() => {
        if (!profile) return null;
        return matchDiet(profile, dietPlans);
    }, [profile]);

    const step1Valid = profile !== null && Number(age) >= 13 && Number(age) <= 100
                       && Number(weightKg) >= 30 && Number(weightKg) <= 300
                       && Number(heightCm) >= 100 && Number(heightCm) <= 250;

    // ── Persist profile to users/{uid}.dietProfile when reaching step 2 ──
    const persistProfile = async (p: DietProfile) => {
        if (!user) return;
        setSavingProfile(true);
        setError(null);
        try {
            await setDoc(
                doc(db, 'users', user.id),
                {
                    dietProfile: {
                        ...p,
                        calculatedAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    },
                },
                { merge: true },
            );
        } catch (e: any) {
            console.error('Failed to save diet profile:', e);
            setError(e?.message ?? 'Failed to save.');
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Assign matched plan to userDiets/{uid} ──────────────────────────
    const assignDiet = async () => {
        if (!user || !matched) return;
        setAssigning(true);
        setError(null);
        try {
            await setDoc(doc(db, 'userDiets', user.id), {
                id: user.id,
                userId: user.id,
                dietId: matched.id,
                snapshot: {
                    name: matched.name,
                    mealsPerDay: matched.mealsPerDay,
                    calories: matched.calories,
                    macros: matched.macros,
                    pdfUrl: matched.pdfUrl ?? null,
                },
                assignedAt: serverTimestamp(),
            });
            onAssigned?.(matched);
            onClose?.();
        } catch (e: any) {
            console.error('Failed to assign diet:', e);
            setError(e?.message ?? 'Failed to assign.');
        } finally {
            setAssigning(false);
        }
    };

    // ── Step navigation ─────────────────────────────────────────────────
    const next = async () => {
        if (step === 1 && step1Valid && profile) {
            await persistProfile(profile);
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3 && profile) {
            // Re-persist with the updated mealsPerDay (it changes the matcher result).
            await persistProfile({ ...profile, mealsPerDay });
            setStep(4);
        }
    };
    const back = () => setStep(s => (s > 1 ? ((s - 1) as Step) : s));

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
                className="bzt-rise-in max-w-xl w-full rounded-3xl bg-surface-container-high border border-outline-variant/40 overflow-hidden max-h-[92vh] flex flex-col"
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
                                {t('dietsTitle')}
                            </span>
                            <h2 className="text-lg md:text-xl font-headline font-extrabold text-on-surface tracking-tight truncate">
                                {step === 1 && t('dietWizardStep1')}
                                {step === 2 && t('dietWizardStep2')}
                                {step === 3 && t('dietWizardStep3')}
                                {step === 4 && t('dietWizardStep4')}
                            </h2>
                        </div>
                    </div>
                    <StepDots step={step} />
                </div>

                {/* Body — scrolls when content overflows the viewport */}
                <div className="px-6 md:px-8 py-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <Step1
                            sex={sex} setSex={setSex}
                            age={age} setAge={setAge}
                            weightKg={weightKg} setWeightKg={setWeightKg}
                            heightCm={heightCm} setHeightCm={setHeightCm}
                            activityLevel={activityLevel} setActivityLevel={setActivityLevel}
                            goal={goal} setGoal={setGoal}
                        />
                    )}
                    {step === 2 && profile && <Step2 profile={profile} />}
                    {step === 3 && (
                        <Step3 mealsPerDay={mealsPerDay} setMealsPerDay={setMealsPerDay} />
                    )}
                    {step === 4 && profile && (
                        <Step4
                            profile={profile}
                            matched={matched}
                            replacingPlanName={
                                assignedDietId && matched && assignedDietId !== matched.id
                                    ? (dietPlans.find(p => p.id === assignedDietId)?.name)
                                    : undefined
                            }
                        />
                    )}
                </div>

                {/* Footer — Back / Next or Assign */}
                <div className="px-6 md:px-8 py-5 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between gap-3">
                    {step > 1 ? (
                        <button
                            onClick={back}
                            className="bzt-press flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface/70 hover:text-on-surface text-[11px] font-bold uppercase tracking-[0.16em] font-label transition-colors"
                        >
                            <ArrowLeft size={14} /> {t('back')}
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="bzt-press text-on-surface/55 hover:text-on-surface text-[11px] font-bold uppercase tracking-[0.16em] font-label transition-colors"
                        >
                            {t('cancel')}
                        </button>
                    )}

                    {error && (
                        <span className="text-xs text-red-400 font-body truncate">{error}</span>
                    )}

                    {step < 4 ? (
                        <button
                            onClick={next}
                            disabled={(step === 1 && !step1Valid) || savingProfile}
                            className="bzt-press flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.18em] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{
                                background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))',
                                color: 'rgb(var(--on-primary))',
                                boxShadow: '0 8px 22px rgb(var(--primary) / 0.32)',
                            }}
                        >
                            {savingProfile ? <Loader2 size={14} className="animate-spin" /> : null}
                            {t('next')}
                            <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={assignDiet}
                            disabled={!matched || assigning}
                            className="bzt-press flex items-center gap-2 px-5 py-3 rounded-2xl font-label font-extrabold text-[11px] uppercase tracking-[0.18em] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{
                                background: matched
                                    ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))'
                                    : 'rgb(var(--surface-container-highest))',
                                color: matched ? 'rgb(var(--on-primary))' : 'rgb(var(--on-surface) / 0.5)',
                                boxShadow: matched ? '0 8px 22px rgb(var(--primary) / 0.32)' : 'none',
                            }}
                        >
                            {assigning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {t('assignDietCta')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Step components ────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
    return (
        <div className="flex items-center gap-2 shrink-0">
            {[1, 2, 3, 4].map(n => (
                <span
                    key={n}
                    className="rounded-full transition-all"
                    style={{
                        width: n === step ? 18 : 6,
                        height: 6,
                        background: n <= step
                            ? 'linear-gradient(90deg, rgb(var(--primary)), rgb(var(--primary-container)))'
                            : 'rgb(var(--surface-container-highest))',
                    }}
                />
            ))}
        </div>
    );
}

function Step1(props: {
    sex: Sex; setSex: (v: Sex) => void;
    age: string; setAge: (v: string) => void;
    weightKg: string; setWeightKg: (v: string) => void;
    heightCm: string; setHeightCm: (v: string) => void;
    activityLevel: ActivityLevel; setActivityLevel: (v: ActivityLevel) => void;
    goal: DietGoal; setGoal: (v: DietGoal) => void;
}) {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            {/* Sex */}
            <Field icon={<UserIcon size={14} />} label={t('sex')}>
                <div className="grid grid-cols-2 gap-2">
                    {(['male', 'female'] as Sex[]).map(s => (
                        <SelectChip key={s} active={props.sex === s} onClick={() => props.setSex(s)}>
                            {t(s)}
                        </SelectChip>
                    ))}
                </div>
            </Field>

            {/* Age + Weight + Height — stacks on phones, three-across on
                tablets+. Unit lives inside the input as a small chip so the
                label stays one short word and never wraps. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <NumberField label={t('age')}    value={props.age}      onChange={props.setAge}      placeholder="28" />
                <NumberField label={t('weight')} value={props.weightKg} onChange={props.setWeightKg} placeholder="80"  unit="kg" />
                <NumberField label={t('height')} value={props.heightCm} onChange={props.setHeightCm} placeholder="175" unit="cm" />
            </div>

            {/* Activity */}
            <Field icon={<Activity size={14} />} label={t('activityLevel')}>
                <div className="grid gap-2">
                    {ACTIVITY_OPTIONS.map(a => (
                        <SelectRow key={a} active={props.activityLevel === a} onClick={() => props.setActivityLevel(a)}>
                            <span className="font-headline font-bold text-[14px]">{t(ACTIVITY_KEY[a])}</span>
                            <span className="text-[12px] text-on-surface-variant">{t(ACTIVITY_DESC_KEY[a])}</span>
                        </SelectRow>
                    ))}
                </div>
            </Field>

            {/* Goal */}
            <Field icon={<Target size={14} />} label={t('goal')}>
                <div className="grid grid-cols-2 gap-2">
                    {GOAL_OPTIONS.map(g => (
                        <SelectChip key={g} active={props.goal === g} onClick={() => props.setGoal(g)}>
                            <span className="block">{t(DIET_GOAL_KEY[g])}</span>
                            <span className="block text-[10px] text-on-surface-variant mt-0.5">
                                {GOAL_ADJUSTMENT[g] === 0 ? '0%' : `${GOAL_ADJUSTMENT[g] > 0 ? '+' : ''}${Math.round(GOAL_ADJUSTMENT[g] * 100)}%`}
                            </span>
                        </SelectChip>
                    ))}
                </div>
            </Field>
        </div>
    );
}

function Step2({ profile }: { profile: DietProfile }) {
    const { t } = useLanguage();
    const macroSplit = [
        { label: t('protein'), g: profile.targetProtein, kcal: profile.targetProtein * 4, color: '#7fc8d8' },
        { label: t('carbs'),   g: profile.targetCarbs,   kcal: profile.targetCarbs * 4,   color: 'rgb(var(--primary))' },
        { label: t('fats'),    g: profile.targetFat,     kcal: profile.targetFat * 9,     color: '#e89b7a' },
    ];
    const total = macroSplit.reduce((sum, m) => sum + m.kcal, 0) || 1;

    return (
        <div className="space-y-6">
            {/* BMR / TDEE / Target — three numbers, increasing weight */}
            <div className="grid grid-cols-3 gap-3">
                <StatBlock label="BMR"   value={profile.bmr} sub="kcal" />
                <StatBlock label="TDEE"  value={profile.tdee} sub="kcal" />
                <StatBlock label={t('targetCalories')} value={profile.targetCalories} sub="kcal" hero />
            </div>

            {/* Macro split bar — visual proportion */}
            <div>
                <div className="flex items-baseline justify-between mb-2">
                    <span className="font-label font-bold text-[10px] uppercase tracking-[0.18em] text-on-surface/55">
                        {t('macroSplit')}
                    </span>
                    <span className="text-[12px] text-on-surface-variant">{profile.targetCalories} kcal</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex bg-surface-container-highest">
                    {macroSplit.map(m => (
                        <div
                            key={m.label}
                            className="bzt-fade-in"
                            style={{
                                width: `${(m.kcal / total) * 100}%`,
                                background: m.color,
                                animationDuration: '0.6s',
                            }}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                    {macroSplit.map(m => (
                        <div key={m.label} className="text-center">
                            <div className="font-headline font-extrabold text-[22px] text-on-surface tracking-tight">{m.g}<span className="text-[12px] text-on-surface-variant ml-1">g</span></div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/55 mt-0.5">{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-[13px] text-on-surface-variant font-body leading-relaxed">
                {t('dietWizardStep2Note')}
            </p>
        </div>
    );
}

function Step3({ mealsPerDay, setMealsPerDay }: {
    mealsPerDay: MealsPerDay; setMealsPerDay: (n: MealsPerDay) => void;
}) {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            <p className="text-[14px] text-on-surface font-body leading-relaxed">
                {t('dietWizardStep3Body')}
            </p>
            <div className="grid grid-cols-2 gap-3">
                {([3, 4] as MealsPerDay[]).map(n => (
                    <button
                        key={n}
                        onClick={() => setMealsPerDay(n)}
                        className="bzt-press p-5 rounded-2xl text-left transition-all"
                        style={{
                            background: mealsPerDay === n ? 'rgb(var(--primary) / 0.10)' : 'rgb(var(--surface-container))',
                            border: mealsPerDay === n ? '1px solid rgb(var(--primary) / 0.55)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                        }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                    background: mealsPerDay === n
                                        ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-container)))'
                                        : 'rgb(var(--surface-container-highest))',
                                    color: mealsPerDay === n ? 'rgb(var(--on-primary))' : 'rgb(var(--on-surface-variant))',
                                }}
                            >
                                <Utensils size={18} />
                            </div>
                            <div className="font-headline font-extrabold text-[28px] text-on-surface tracking-tight">{n}</div>
                        </div>
                        <div className="font-headline font-bold text-[15px] text-on-surface mb-1">
                            {n} {t('mealsPerDay')}
                        </div>
                        <div className="text-[12px] text-on-surface-variant font-body leading-snug">
                            {n === 3 ? t('threeMealsBlurb') : t('fourMealsBlurb')}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function Step4({ profile, matched, replacingPlanName }: {
    profile: DietProfile;
    matched: Diet | null;
    /** Name of the user's current plan when assigning the matched plan
     * would replace it. Drives the replace-confirm banner. */
    replacingPlanName?: string;
}) {
    const { t, lang } = useLanguage();

    if (!matched) {
        return (
            <div className="rounded-2xl bg-surface-container border border-outline-variant/30 p-6 text-center">
                <div
                    className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgb(var(--primary) / 0.12)' }}
                >
                    <Utensils size={20} className="text-primary" />
                </div>
                <h3 className="font-headline font-bold text-[18px] text-on-surface mb-2">
                    {t('dietNoMatchTitle')}
                </h3>
                <p className="text-[13px] text-on-surface-variant font-body leading-relaxed mb-4">
                    {t('dietNoMatchBody')}
                </p>
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-surface-container-lowest border border-outline-variant/30">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {t('targetCalories')}
                    </span>
                    <span className="font-headline font-extrabold text-[18px] text-primary">
                        {profile.targetCalories} kcal
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Replace-confirm banner — only when wizard's match differs
                from the user's currently-assigned plan. */}
            {replacingPlanName && (
                <div
                    className="rounded-2xl px-4 py-3 flex items-start gap-3 bzt-fade-in"
                    style={{
                        background: 'rgb(var(--primary) / 0.10)',
                        border: '1px solid rgb(var(--primary) / 0.35)',
                    }}
                >
                    <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="text-[12px] text-on-surface font-body leading-relaxed">
                        {t('replaceCurrentPlanLead')}
                        {' '}
                        <span className="font-headline font-bold text-on-surface">{tPlanName(replacingPlanName, lang, t('mealsWord'))}</span>
                    </div>
                </div>
            )}

            {/* Hero card */}
            <div className="rounded-2xl overflow-hidden border border-outline-variant/30">
                <div
                    className="h-32 bzt-hero-card relative"
                    style={{ background: `url(${matched.coverImageUrl ?? coverUrl(matched.calories)}) center/cover no-repeat, linear-gradient(135deg, rgb(var(--primary) / 0.20), rgb(var(--primary-container) / 0.10))` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.2em] text-primary block mb-1">
                            {matched.label ? `${matched.label} · ` : ''}{matched.mealsPerDay} {t('mealsPerDay')}
                        </span>
                        <h3 className="font-headline font-extrabold text-white text-[20px] tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                            {tPlanName(matched.name, lang, t('mealsWord'))}
                        </h3>
                    </div>
                </div>
                <div className="p-5 bg-surface-container">
                    <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                            <div className="font-headline font-extrabold text-[18px] text-primary">{matched.calories}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/55 mt-0.5">kcal</div>
                        </div>
                        <div>
                            <div className="font-headline font-extrabold text-[18px] text-on-surface">{matched.macros.protein}<span className="text-[10px] text-on-surface-variant ml-0.5">g</span></div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/55 mt-0.5">{t('protein')}</div>
                        </div>
                        <div>
                            <div className="font-headline font-extrabold text-[18px] text-on-surface">{matched.macros.carbs}<span className="text-[10px] text-on-surface-variant ml-0.5">g</span></div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/55 mt-0.5">{t('carbs')}</div>
                        </div>
                        <div>
                            <div className="font-headline font-extrabold text-[18px] text-on-surface">{matched.macros.fat}<span className="text-[10px] text-on-surface-variant ml-0.5">g</span></div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/55 mt-0.5">{t('fats')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Training day */}
            <DayTable
                tone="primary"
                eyebrow={t('trainingDay')}
                day={matched.trainingDay}
            />

            {/* Rest day */}
            <DayTable
                tone="muted"
                eyebrow={t('restDay')}
                day={matched.restDay}
            />

            {matched.description && (
                <p className="text-[13px] text-on-surface-variant font-body leading-relaxed">{matched.description}</p>
            )}
        </div>
    );
}

function DayTable({ tone, eyebrow, day }: {
    tone: 'primary' | 'muted';
    eyebrow: string;
    day: import('../../types').DietDayMacros;
}) {
    const accent = tone === 'primary' ? 'rgb(var(--primary))' : 'rgb(var(--on-surface) / 0.55)';
    return (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/25 overflow-hidden">
            <div className="px-4 py-3 flex items-baseline justify-between gap-3 border-b border-outline-variant/20">
                <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em]" style={{ color: accent }}>
                    {eyebrow}
                </span>
                <span className="text-[12px] text-on-surface-variant">
                    <span className="font-headline font-extrabold text-on-surface">{day.kcal}</span> kcal · {day.protein}P · {day.carbs}C · {day.fat}F
                </span>
            </div>
            <div className="divide-y divide-outline-variant/15">
                {day.meals.map(m => (
                    <div key={m.order} className="px-4 py-2.5 flex items-center justify-between gap-3 text-[12px]">
                        <div className="min-w-0 flex-1">
                            <div className="font-headline font-bold text-on-surface text-[13px] truncate">{m.name}</div>
                            {m.extras && (
                                <div className="text-[11px] text-on-surface-variant truncate">{m.extras}</div>
                            )}
                        </div>
                        <div className="shrink-0 font-body text-on-surface-variant tabular-nums">
                            {m.carbs > 0 ? `${m.carbs}C` : '—'} · {m.protein}P · {m.fat > 0 ? `${m.fat}F` : '—'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── UI primitives ──────────────────────────────────────────────────────

function Field({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-2 mb-2 text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-on-surface/65">
                {icon}
                <span>{label}</span>
            </label>
            {children}
        </div>
    );
}

function NumberField({ label, value, onChange, placeholder, unit }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
    /** Right-aligned unit chip inside the input (e.g. "kg", "cm"). Pulled
     * out of the label so the label stays one short word and never wraps
     * — wrapped labels were misaligning the inputs at the 3-col breakpoint. */
    unit?: string;
}) {
    return (
        <div>
            <label className="block whitespace-nowrap text-[10px] font-label font-extrabold uppercase tracking-[0.18em] text-on-surface/65 mb-2 truncate">
                {label}
            </label>
            <div className="relative">
                <input
                    type="number"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full min-h-[44px] bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary focus:bg-surface-container rounded-xl ${unit ? 'pe-9' : 'pe-3.5'} ps-3.5 py-2.5 text-[15px] font-body text-on-surface placeholder-on-surface/30 transition-all`}
                />
                {unit && (
                    <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[11px] font-label font-bold uppercase tracking-[0.14em] text-on-surface/45">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

function SelectChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bzt-press inline-flex w-full items-center justify-center min-h-[44px] text-[14px] font-body font-semibold px-3 py-2.5 rounded-xl transition-all text-center"
            style={{
                background: active ? 'rgb(var(--primary) / 0.12)' : 'rgb(var(--surface-container-lowest))',
                border: active ? '1px solid rgb(var(--primary) / 0.55)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                color: active ? 'rgb(var(--primary))' : 'rgb(var(--on-surface) / 0.85)',
            }}
        >
            {children}
        </button>
    );
}

function SelectRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bzt-press flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl text-left transition-all"
            style={{
                background: active ? 'rgb(var(--primary) / 0.10)' : 'rgb(var(--surface-container-lowest))',
                border: active ? '1px solid rgb(var(--primary) / 0.55)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                color: active ? 'rgb(var(--primary))' : 'rgb(var(--on-surface) / 0.85)',
            }}
        >
            {children}
        </button>
    );
}

function StatBlock({ label, value, sub, hero }: { label: string; value: number; sub?: string; hero?: boolean }) {
    return (
        <div
            className="rounded-2xl p-4 text-center"
            style={{
                background: hero ? 'linear-gradient(135deg, rgb(var(--primary) / 0.12), rgb(var(--primary-container) / 0.05))' : 'rgb(var(--surface-container))',
                border: hero ? '1px solid rgb(var(--primary) / 0.30)' : '1px solid rgb(var(--outline-variant) / 0.20)',
            }}
        >
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface/55 mb-1">{label}</div>
            <div className={`font-headline font-extrabold tracking-tight ${hero ? 'text-[28px] text-primary' : 'text-[20px] text-on-surface'}`}>
                {value}
            </div>
            {sub && <div className="text-[10px] text-on-surface-variant mt-0.5">{sub}</div>}
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────
// Map a free-text user goal (e.g. 'fat_loss', 'muscle_gain' from Week 0) to
// the diet-domain goal taxonomy. Falls back to undefined when no clean match.
function mapUserGoalToDietGoal(g: string | undefined): DietGoal | undefined {
    if (!g) return undefined;
    if (g === 'fat_loss')    return 'cut';
    if (g === 'muscle_gain') return 'lean_bulk';
    if (g === 'recomp')      return 'recomp';
    if (g === 'maintenance') return 'maintain';
    if (g === 'strength')    return 'lean_bulk';
    if (g === 'endurance')   return 'maintain';
    return undefined;
}

