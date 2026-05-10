/**
 * CommunityBaselineForm — Week 0 baseline for community members.
 *
 * Now a 2-step flow that captures the baseline AND runs the diet
 * calculator in one shot, so a fresh community user lands on the platform
 * with both: (a) baseline metrics for weekly check-ins and (b) a saved
 * dietProfile + auto-assigned diet plan.
 *
 *   Step 1 — Baseline & inputs
 *     sex · age · height · current weight · target weight · goal · activity
 *
 *   Step 2 — Targets & meal count
 *     Computed BMR / TDEE / target kcal + macro split. User picks 3 vs 4
 *     meals. Submitting writes the user doc + dietProfile and auto-assigns
 *     the closest matching plan to userDiets/{uid}.
 *
 * Two entry points (unchanged):
 *   - Auto-opens when a community user lands without baseline data
 *     (gated by `communityProfileStartedAt` in AppRoutes.tsx).
 *   - Manually opens via "Edit profile info" button on the Profile page.
 *
 * For "edit profile" reopens (initial provided), step 1 prefills and the
 * user can re-run the calculator if they choose. Otherwise the existing
 * dietProfile is left untouched.
 */
import { useMemo, useState } from 'react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
    X, Target, Scale, Calendar, ChevronRight, ArrowLeft, Sparkles,
    Activity as ActivityIcon, Utensils, Loader2, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../lib/firebase';
import { computeDietProfile, matchDiet } from '../../lib/dietCalculator';
import { dietPlans } from '../../data/diets';
import { tPlanName } from '../../lib/dietTranslations';
import type {
    Sex, ActivityLevel, DietGoal, MealsPerDay, DietProfile,
} from '../../types';

// Map enum → translation key. Mirrors the same pair in DietWizard so the
// activity picker reads consistently in both surfaces.
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

const GOAL_OPTIONS = [
    { value: 'fat_loss',     labelKey: 'goalFatLoss',    desc: 'Lose body fat while keeping muscle.' },
    { value: 'muscle_gain',  labelKey: 'goalMuscleGain', desc: 'Build lean muscle.' },
    { value: 'recomp',       labelKey: 'goalRecomp',     desc: 'Lose fat and gain muscle simultaneously.' },
    { value: 'maintenance',  labelKey: 'goalMaintenance',desc: 'Stay at current weight, improve fitness.' },
    { value: 'endurance',    labelKey: 'goalEndurance',  desc: 'Improve cardiovascular performance.' },
    { value: 'strength',     labelKey: 'goalStrength',   desc: 'Get stronger across the board.' },
] as const;

const ACTIVITY_OPTIONS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'extra'];

// Map the Week-0 free-text goal to the diet calculator's calorie-adjustment
// taxonomy. Same logic as in the standalone DietWizard so the two stay in sync.
function goalToDietGoal(g: string): DietGoal {
    if (g === 'fat_loss')    return 'cut';
    if (g === 'muscle_gain') return 'lean_bulk';
    if (g === 'recomp')      return 'recomp';
    if (g === 'maintenance') return 'maintain';
    if (g === 'strength')    return 'lean_bulk';
    if (g === 'endurance')   return 'maintain';
    return 'maintain';
}

interface Props {
    onClose: () => void;
    initial?: {
        age?: number;
        heightCm?: number;
        goal?: string;
        currentWeightKg?: number;
        targetWeightKg?: number;
    };
}

export const CommunityBaselineForm = ({ onClose, initial }: Props) => {
    const { user } = useAuth();
    const { t, lang } = useLanguage();

    const isInitial = initial?.age === undefined;

    // ── Step 1 inputs ─────────────────────────────────────────────────
    const [step, setStep] = useState<1 | 2>(1);
    const [sex, setSex] = useState<Sex>('male');
    const [age, setAge] = useState<string>(initial?.age?.toString() ?? '');
    const [heightCm, setHeightCm] = useState<string>(initial?.heightCm?.toString() ?? '');
    const [goal, setGoal] = useState<string>(initial?.goal ?? '');
    const [currentWeightKg, setCurrentWeightKg] = useState<string>(initial?.currentWeightKg?.toString() ?? '');
    const [targetWeightKg, setTargetWeightKg] = useState<string>(initial?.targetWeightKg?.toString() ?? '');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

    // ── Step 2 ────────────────────────────────────────────────────────
    const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(3);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const step1Valid =
        Number(age) > 0 && Number(age) < 120 &&
        Number(heightCm) > 80 && Number(heightCm) < 250 &&
        goal.length > 0 &&
        Number(currentWeightKg) > 20 && Number(currentWeightKg) < 350 &&
        Number(targetWeightKg) > 20 && Number(targetWeightKg) < 350;

    // Live profile + auto-match. Recomputes whenever any input changes.
    const profile: DietProfile | null = useMemo(() => {
        if (!step1Valid) return null;
        return computeDietProfile({
            sex,
            age: Number(age),
            weightKg: Number(currentWeightKg),
            heightCm: Number(heightCm),
            activityLevel,
            goal: goalToDietGoal(goal),
            mealsPerDay,
        });
    }, [sex, age, heightCm, currentWeightKg, activityLevel, goal, mealsPerDay, step1Valid]);

    const matched = useMemo(() => {
        if (!profile) return null;
        return matchDiet(profile, dietPlans);
    }, [profile]);

    // ── Submit — writes user doc + dietProfile + userDiets atomically-ish ─
    const handleSubmit = async () => {
        if (!user || !profile) return;
        setSaving(true);
        setError(null);
        try {
            // 1. Baseline + dietProfile on the user doc.
            await updateDoc(doc(db, 'users', user.id), {
                age: Number(age),
                heightCm: Number(heightCm),
                goal,
                currentWeightKg: Number(currentWeightKg),
                targetWeightKg: Number(targetWeightKg),
                dietProfile: {
                    ...profile,
                    calculatedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                },
                ...(isInitial ? { communityProfileStartedAt: serverTimestamp() } : {}),
            });
            // 2. Auto-assign the matched plan if one exists for this kcal+meals.
            if (matched) {
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
            }
            onClose();
        } catch (e: any) {
            console.error('Failed to save baseline:', e);
            setError(e?.message ?? 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
            <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200 ghost-border max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div className="min-w-0">
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                            {isInitial ? `Week 0 · ${step}/2` : `${t('edit')} · ${step}/2`}
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface">
                            {step === 1
                                ? (isInitial ? t('tellUsAboutYourself') : t('personalInfo'))
                                : (t('yourTargets') ?? 'Your targets')}
                        </h2>
                        {step === 1 && isInitial && (
                            <p className="font-body text-sm text-on-surface/60 mt-2">
                                {t('baselineSetItOnce')}
                            </p>
                        )}
                        {step === 2 && (
                            <p className="font-body text-sm text-on-surface/60 mt-2">
                                {t('basedOnYourNumbers')}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-surface-container text-on-surface/60 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {step === 1 && (
                    <div className="space-y-5">
                        {/* Sex */}
                        <Field label={t('sex') ?? 'Sex'}>
                            <div className="grid grid-cols-2 gap-2">
                                {(['male', 'female'] as Sex[]).map(s => (
                                    <Chip key={s} active={sex === s} onClick={() => setSex(s)}>
                                        {t(s) ?? (s === 'male' ? 'Male' : 'Female')}
                                    </Chip>
                                ))}
                            </div>
                        </Field>

                        {/* Age + Height row */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field icon={<Calendar size={14} />} label={t('age')} unit={t('yearsOld')}>
                                <NumInput value={age} onChange={setAge} placeholder="28" />
                            </Field>
                            <Field icon={<Scale size={14} />} label={t('height')} unit="cm">
                                <NumInput value={heightCm} onChange={setHeightCm} placeholder="175" />
                            </Field>
                        </div>

                        {/* Current + target weight */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={t('currentWeight')} unit="kg">
                                <NumInput value={currentWeightKg} onChange={setCurrentWeightKg} placeholder="80.0" step="0.1" />
                            </Field>
                            <Field label={t('targetWeight')} unit="kg">
                                <NumInput value={targetWeightKg} onChange={setTargetWeightKg} placeholder="75.0" step="0.1" />
                            </Field>
                        </div>

                        {/* Goal */}
                        <Field icon={<Target size={14} />} label={t('goal')}>
                            <div className="grid grid-cols-2 gap-2">
                                {GOAL_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setGoal(opt.value)}
                                        className={`text-left px-3 py-2.5 rounded-xl border text-sm font-body transition-all ${
                                            goal === opt.value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface/70 hover:border-outline-variant/60'
                                        }`}
                                    >
                                        {t(opt.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Activity */}
                        <Field icon={<ActivityIcon size={14} />} label={t('activityLevel')}>
                            <div className="grid gap-2">
                                {ACTIVITY_OPTIONS.map(a => (
                                    <button
                                        key={a}
                                        type="button"
                                        onClick={() => setActivityLevel(a)}
                                        className={`text-left px-4 py-3 rounded-xl border text-sm font-body transition-all flex flex-col gap-0.5 ${
                                            activityLevel === a
                                                ? 'border-primary bg-primary/10'
                                                : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/60'
                                        }`}
                                    >
                                        <span className={`font-headline font-bold ${activityLevel === a ? 'text-primary' : 'text-on-surface'}`}>{t(ACTIVITY_KEY[a])}</span>
                                        <span className="text-[12px] text-on-surface-variant">{t(ACTIVITY_DESC_KEY[a])}</span>
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}

                {step === 2 && profile && (
                    <div className="space-y-6">
                        {/* BMR / TDEE / Target — three numbers */}
                        <div className="grid grid-cols-3 gap-3">
                            <StatBlock label="BMR"   value={profile.bmr} sub="kcal" />
                            <StatBlock label="TDEE"  value={profile.tdee} sub="kcal" />
                            <StatBlock label={t('targetCalories') ?? 'Target'} value={profile.targetCalories} sub="kcal" hero />
                        </div>

                        {/* Macro split bar */}
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="font-label font-bold text-[10px] uppercase tracking-[0.18em] text-on-surface/55">
                                    {t('macroSplit') ?? 'Macro split'}
                                </span>
                                <span className="text-[12px] text-on-surface-variant">{profile.targetCalories} kcal</span>
                            </div>
                            <MacroBar profile={profile} />
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <MacroPill g={profile.targetProtein} label={t('protein') ?? 'Protein'} />
                                <MacroPill g={profile.targetCarbs}   label={t('carbs') ?? 'Carbs'} />
                                <MacroPill g={profile.targetFat}     label={t('fats') ?? 'Fats'} />
                            </div>
                        </div>

                        {/* Meal count */}
                        <Field icon={<Utensils size={14} />} label={t('mealsPerDay') ?? 'Meals/day'}>
                            <div className="grid grid-cols-2 gap-3">
                                {([3, 4] as MealsPerDay[]).map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setMealsPerDay(n)}
                                        className="bzt-press p-4 rounded-xl text-left transition-all"
                                        style={{
                                            background: mealsPerDay === n ? 'rgb(var(--primary) / 0.10)' : 'rgb(var(--surface-container))',
                                            border: mealsPerDay === n ? '1px solid rgb(var(--primary) / 0.55)' : '1px solid rgb(var(--outline-variant) / 0.30)',
                                        }}
                                    >
                                        <div className="font-headline font-extrabold text-[24px] text-on-surface tracking-tight mb-1">{n}</div>
                                        <div className="font-headline font-bold text-[13px] text-on-surface mb-0.5">
                                            {n} {t('mealsPerDay') ?? 'meals/day'}
                                        </div>
                                        <div className="text-[11px] text-on-surface-variant font-body leading-snug">
                                            {n === 3
                                                ? (t('threeMealsBlurb') ?? 'Bigger meals, simpler routine.')
                                                : (t('fourMealsBlurb') ?? 'Smaller meals, steady energy.')}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        {/* Matched plan preview */}
                        {matched ? (
                            <div className="rounded-2xl p-4 border border-primary/30 bg-primary/[0.06]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-primary" />
                                    <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.22em] text-primary">
                                        {t('matchedPlan')}
                                    </span>
                                </div>
                                <div className="font-headline font-extrabold text-on-surface text-[16px] tracking-tight">{tPlanName(matched.name, lang, t('mealsWord'))}</div>
                                <div className="text-[12px] text-on-surface-variant font-body mt-0.5">
                                    {matched.calories} kcal · {matched.macros.protein}P · {matched.macros.carbs}C · {matched.macros.fat}F
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl p-4 border border-outline-variant/30 bg-surface-container-lowest text-[12px] text-on-surface-variant font-body">
                                {t('dietNoMatchBody') ?? 'No exact match yet — we\'ll save your targets so a plan can be assigned later.'}
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-body">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 mt-7">
                    {step === 1 ? (
                        <>
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 px-4 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-label text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!step1Valid}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {t('next') ?? 'Next'} <ChevronRight size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                disabled={saving}
                                className="px-4 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-label text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft size={14} /> {t('back') ?? 'Back'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving || !profile}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                {isInitial ? (t('done') ?? 'Done') : (t('save') ?? 'Save')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Local primitives ───────────────────────────────────────────────────
function Field({ icon, label, unit, children }: {
    icon?: React.ReactNode; label: string; unit?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-2 mb-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/70">
                {icon}
                <span>{label}</span>
                {unit && <span className="text-on-surface/40 normal-case tracking-normal font-body">· {unit}</span>}
            </label>
            {children}
        </div>
    );
}

function NumInput({ value, onChange, placeholder, step }: {
    value: string; onChange: (v: string) => void; placeholder?: string; step?: string;
}) {
    return (
        <input
            type="number"
            inputMode={step ? 'decimal' : 'numeric'}
            step={step}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-body focus:border-primary/50 outline-none"
        />
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bzt-press text-[14px] font-body font-semibold px-3 py-2.5 rounded-xl transition-all text-center"
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

function MacroBar({ profile }: { profile: DietProfile }) {
    const splits = [
        { kcal: profile.targetProtein * 4, color: '#7fc8d8' },
        { kcal: profile.targetCarbs   * 4, color: 'rgb(var(--primary))' },
        { kcal: profile.targetFat     * 9, color: '#e89b7a' },
    ];
    const total = splits.reduce((s, x) => s + x.kcal, 0) || 1;
    return (
        <div className="h-3 rounded-full overflow-hidden flex bg-surface-container-highest">
            {splits.map((m, i) => (
                <div key={i} style={{ width: `${(m.kcal / total) * 100}%`, background: m.color }} />
            ))}
        </div>
    );
}

function MacroPill({ g, label }: { g: number; label: string }) {
    return (
        <div className="text-center">
            <div className="font-headline font-extrabold text-[22px] text-on-surface tracking-tight">
                {g}<span className="text-[12px] text-on-surface-variant ml-1">g</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/55 mt-0.5">{label}</div>
        </div>
    );
}
