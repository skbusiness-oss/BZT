/**
 * CardioPlan — community-user cardio planner. Lives at /cardio.
 *
 * Iteration 2 (coach feedback): the earlier version exposed max
 * heart rate, target HR bands, zone percentages, MET values, and a
 * fat-burn-vs-heart-train dichotomy. The reviewing coach said it
 * was "too many numbers" and that community users would get lost.
 *
 * Plain-English rewrite:
 *   1. Pick an activity (8 tiles, each shows default 30-min kcal)
 *   2. Tap → expanded panel
 *   3. Adjust duration + Easy/Hard intensity
 *   4. See one big calorie number
 *
 * No MHR formula. No bpm. No %-of-max. No "Fat Burn zone" vs
 * "Heart Training zone" labels. The science is still under the
 * hood (same MET formula) but the surface is invisible to the
 * user. Anyone who wants the science taps through to the Academy
 * cardio course at the bottom.
 *
 * Logging stays elsewhere: a prominent "log on Update" callout
 * sits near the top. This page is purely planning.
 */
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    ArrowLeft, GraduationCap, ChevronRight, Info, Footprints,
    Bike, Activity, Waves, ChevronsUp, Repeat, Zap, Flame,
    User, Ruler, Scale, Edit2, Target, Minus, TrendingUp, Mountain,
    type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
//  Activity catalog
//  Each entry has two MET values: easy / hard. We use the standard
//  MET formula behind the scenes (no jargon in the UI):
//      kcal/min = (MET × 3.5 × weight_kg) / 200
//  Defaults show the EASY intensity at 30 minutes on each tile so
//  the grid has a concrete number to read at a glance.
// ─────────────────────────────────────────────────────────────────
interface Activity {
    id: string;
    labelKey: string;
    icon: LucideIcon;
    easyMet: number;
    hardMet: number;
    /** If true, the result panel shows an incline toggle (Flat /
     *  Some / Steep) that adds a MET bonus to the estimate. Only
     *  used by the treadmill — walking outdoors gets its own
     *  hiking/incline path via the Walking tile if needed later. */
    supportsIncline?: boolean;
}

const ACTIVITIES: Activity[] = [
    { id: 'treadmill',  labelKey: 'cardioActTreadmill',  icon: Footprints, easyMet: 6,   hardMet: 11, supportsIncline: true },
    { id: 'bike',       labelKey: 'cardioActBike',       icon: Bike,       easyMet: 5,   hardMet: 9 },
    { id: 'elliptical', labelKey: 'cardioActElliptical', icon: Activity,   easyMet: 5,   hardMet: 8 },
    { id: 'rower',      labelKey: 'cardioActRower',      icon: Repeat,     easyMet: 5,   hardMet: 8 },
    { id: 'stairs',     labelKey: 'cardioActStairs',     icon: ChevronsUp, easyMet: 6,   hardMet: 9 },
    { id: 'walk',       labelKey: 'cardioActWalk',       icon: Footprints, easyMet: 3.5, hardMet: 6 },
    { id: 'jumprope',   labelKey: 'cardioActJumprope',   icon: Zap,        easyMet: 9,   hardMet: 12 },
    { id: 'swim',       labelKey: 'cardioActSwim',       icon: Waves,      easyMet: 6,   hardMet: 10 },
];

type Intensity = 'easy' | 'hard';
type Incline = 'flat' | 'some' | 'steep';

// MET bonus per incline level. Numbers approximated from the
// Compendium of Physical Activities walking/running-on-grade
// entries — incline at 5% adds ~1.5 MET, 10%+ adds ~3.5 MET.
// Conservative defaults; real burn varies with stride + speed.
const INCLINE_MET_BONUS: Record<Incline, number> = {
    flat:  0,
    some:  1.5,
    steep: 3.5,
};

// Standard MET-based calorie estimate. Weight in kg, duration in min.
// Used everywhere a "kcal burned" number is shown on this page.
const kcalEstimate = (met: number, weightKg: number, minutes: number) =>
    Math.round(((met * 3.5 * weightKg) / 200) * minutes);

// Mifflin-St Jeor basal metabolic rate (BMR) — kcal/day at rest.
// We use the "average" form (no sex input) by taking the midpoint
// of the male / female formulas. Page-level UX choice: keeps the
// stats panel to three fields (age / height / weight) instead of
// four. Per-person accuracy is within ±5% which is plenty for a
// planning estimate.
const estimateBmr = (age: number, heightCm: number, weightKg: number) => {
    const baseMale   = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const baseFemale = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    return Math.round((baseMale + baseFemale) / 2);
};

// WHO's standard for adult cardio: 150 minutes of moderate-intensity
// activity per week. We surface this as a personalised target on the
// page — "Aim for 150 min/week → ~X kcal at your stats."
const WEEKLY_CARDIO_TARGET_MIN = 150;
const TARGET_MET = 5; // "moderate" intensity, same as the easy MET on the bike

export const CardioPlan = () => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    // Stats default from the user's profile, but become locally
    // editable so the user can tweak them ("what if I were 5 kg
    // lighter?") without changing their profile. Founder direction:
    // surface age + height + weight as visible inputs, since they
    // drive the recommendation below + the per-activity kcal
    // estimates above.
    const [age, setAge]           = useState<number>(user?.age ?? 30);
    const [heightCm, setHeightCm] = useState<number>(user?.heightCm ?? 170);
    const [weightKg, setWeightKg] = useState<number>(user?.currentWeightKg ?? 70);
    const [statsOpen, setStatsOpen] = useState<boolean>(false);

    const [pickedId, setPickedId] = useState<string | null>(null);
    const [durationMin, setDurationMin] = useState<number>(30);
    const [intensity, setIntensity] = useState<Intensity>('easy');
    // Treadmill-only: incline level. Resets to 'flat' whenever a
    // new activity is picked so the user always starts from a
    // neutral baseline.
    const [incline, setIncline] = useState<Incline>('flat');

    const picked = pickedId ? ACTIVITIES.find(a => a.id === pickedId) : null;

    // Per-tile default estimate at the easy intensity, 30 min.
    // Recomputes whenever weight changes (e.g. user edited the
    // stats panel) so the grid always reflects current inputs.
    const defaultEstimates = useMemo(() => {
        const map: Record<string, number> = {};
        for (const a of ACTIVITIES) {
            map[a.id] = kcalEstimate(a.easyMet, weightKg, 30);
        }
        return map;
    }, [weightKg]);

    // Weekly cardio recommendation, personalised. WHO says 150
    // min/week at moderate intensity — at the user's body weight
    // that translates to a concrete kcal-per-week number, which
    // is more actionable than the abstract "150 minutes".
    const weeklyTargetKcal = useMemo(
        () => kcalEstimate(TARGET_MET, weightKg, WEEKLY_CARDIO_TARGET_MIN),
        [weightKg],
    );

    // BMR — daily calories burned at rest. Useful context number,
    // shown subtly in the stats panel when expanded.
    const bmr = useMemo(() => estimateBmr(age, heightCm, weightKg), [age, heightCm, weightKg]);

    const pickedKcal = picked
        ? kcalEstimate(
            (intensity === 'easy' ? picked.easyMet : picked.hardMet)
              + (picked.supportsIncline ? INCLINE_MET_BONUS[incline] : 0),
            weightKg,
            durationMin,
          )
        : 0;

    const handlePick = (id: string) => {
        setPickedId(id);
        setDurationMin(30);
        setIntensity('easy');
        setIncline('flat');
    };

    return (
        <div className="max-w-3xl mx-auto pb-24 animate-in fade-in duration-300" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* ── Back nav ───────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-on-surface/60 hover:text-primary text-[12px] font-label font-bold uppercase tracking-widest mb-6 transition-colors"
            >
                <ArrowLeft size={14} style={{ transform: isRTL ? 'rotate(180deg)' : undefined }} />
                {t('cardioBackToDashboard')}
            </button>

            {/* ── Header ─────────────────────────────────────────── */}
            <header className="mb-7">
                <span className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-primary block mb-2">
                    {t('cardioPlanEyebrow')}
                </span>
                <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter leading-tight mb-3">
                    {t('cardioPlanTitle')}
                </h1>
                <p className="font-body text-on-surface/65 text-base leading-relaxed">
                    {t('cardioPlanSubtitleV2')}
                </p>
            </header>

            {/* ── Log-on-Update callout ──────────────────────────── */}
            <button
                type="button"
                onClick={() => navigate('/update')}
                className="w-full mb-8 group flex items-start gap-4 p-5 rounded-2xl bg-primary/6 border border-primary/25 hover:bg-primary/10 hover:border-primary/40 transition-all text-start"
            >
                <span className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Info size={20} strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-on-surface text-[15px] leading-tight mb-1">
                        {t('cardioPlanLogNoteTitle')}
                    </h3>
                    <p className="font-body text-on-surface/65 text-[13.5px] leading-relaxed">
                        {t('cardioPlanLogNoteBody')}
                    </p>
                </div>
                <ChevronRight
                    size={18}
                    className="text-primary/60 group-hover:text-primary mt-1 shrink-0"
                    style={{ transform: isRTL ? 'rotate(180deg)' : undefined }}
                />
            </button>

            {/* ── Stats panel (collapsed by default) ─────────────
                Compact one-line display of age + height + weight.
                Tap edit → expands into 3 small editable inputs.
                Founder direction: surface these so the user can
                see and adjust them, but keep visually small. */}
            <div className="bg-surface-container-low rounded-2xl ghost-border mb-6 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setStatsOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-container/40 transition-colors"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
                            <User size={14} strokeWidth={2.4} />
                        </span>
                        <div className="min-w-0 text-start">
                            <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50">
                                {t('cardioStatsLabel')}
                            </div>
                            <div className="text-on-surface text-[13px] font-headline font-bold tabular-nums" dir="ltr">
                                {age}y · {heightCm} cm · {weightKg} kg
                            </div>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 shrink-0">
                        <Edit2 size={11} />
                        {statsOpen ? t('cardioStatsHide') : t('cardioStatsEdit')}
                    </span>
                </button>

                {statsOpen && (
                    <div className="px-5 pb-5 pt-2 space-y-3 border-t border-outline-variant/15 bzt-rise-in" style={{ animationDuration: '180ms' }}>
                        <div className="grid grid-cols-3 gap-3 pt-3">
                            {/* StatField now clamps internally on
                                blur/Enter, so the parent setters can
                                just take the value as-is. */}
                            <StatField
                                icon={User}
                                label={t('cardioStatAge')}
                                value={age}
                                onChange={setAge}
                                suffix={t('cardioStatYears')}
                                min={15} max={100}
                            />
                            <StatField
                                icon={Ruler}
                                label={t('cardioStatHeight')}
                                value={heightCm}
                                onChange={setHeightCm}
                                suffix="cm"
                                min={120} max={220}
                            />
                            <StatField
                                icon={Scale}
                                label={t('cardioStatWeight')}
                                value={weightKg}
                                onChange={setWeightKg}
                                suffix="kg"
                                min={35} max={200}
                            />
                        </div>
                        <p className="text-[11px] text-on-surface/45 font-body leading-relaxed inline-flex items-start gap-1.5">
                            <Info size={10} className="mt-0.5 shrink-0" />
                            {t('cardioStatsFootnote')?.replace('{bmr}', String(bmr))}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Weekly cardio target — personalised recommendation
                Founder direction: add an "average cardio" target
                that uses the stats above. WHO's 150 min/week of
                moderate cardio, translated to a real kcal number
                at the user's stats. More actionable than "150
                minutes" alone. */}
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/8 border border-orange-500/25 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        <Target size={18} strokeWidth={2.4} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-label font-bold uppercase tracking-widest text-orange-400 mb-1">
                            {t('cardioTargetEyebrow')}
                        </div>
                        <h3 className="font-headline font-bold text-on-surface text-[16px] leading-tight mb-1">
                            {t('cardioTargetTitle')
                                ?.replace('{min}', String(WEEKLY_CARDIO_TARGET_MIN))}
                        </h3>
                        <p className="text-on-surface/70 font-body text-[13px] leading-relaxed" dir="ltr">
                            {t('cardioTargetBody')
                                ?.replace('{kcal}', String(weeklyTargetKcal))}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Activity picker grid ───────────────────────────── */}
            <h2 className="font-headline font-extrabold text-on-surface text-xl tracking-tight mb-1">
                {t('cardioPickActivityTitle')}
            </h2>
            <p className="font-body text-on-surface/55 text-[13px] mb-4">
                {t('cardioPickActivityHint')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {ACTIVITIES.map(a => (
                    <ActivityTile
                        key={a.id}
                        icon={a.icon}
                        label={t(a.labelKey)}
                        kcal={defaultEstimates[a.id]}
                        active={pickedId === a.id}
                        onPick={() => handlePick(a.id)}
                    />
                ))}
            </div>

            {/* ── Expanded result panel ──────────────────────────── */}
            {picked && (
                <div
                    className="bg-surface-container-low rounded-2xl p-6 ghost-border bzt-rise-in mb-8"
                    style={{ animationDuration: '220ms' }}
                >
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-11 h-11 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
                            <picked.icon size={20} strokeWidth={2.4} />
                        </span>
                        <div className="min-w-0">
                            <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
                                {t(picked.labelKey)}
                            </h3>
                            <p className="text-on-surface/55 text-[12.5px] font-body mt-0.5">
                                {t('cardioPickedSubtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Duration slider */}
                    <div className="mb-5">
                        <div className="flex items-baseline justify-between mb-3">
                            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55">
                                {t('cardioHowLong')}
                            </span>
                            <span className="text-2xl font-headline font-extrabold text-primary tabular-nums" dir="ltr">
                                {durationMin}<span className="text-xs text-on-surface/40 font-normal"> min</span>
                            </span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={60}
                            step={5}
                            value={durationMin}
                            onChange={(e) => setDurationMin(parseInt(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary"
                        />
                        <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                            <span>10 min</span>
                            <span>60 min</span>
                        </div>
                    </div>

                    {/* Intensity toggle — 2 options, plain English */}
                    <div className="mb-6">
                        <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                            {t('cardioHowHard')}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <IntensityToggle
                                value="easy"
                                active={intensity === 'easy'}
                                onPick={setIntensity}
                            />
                            <IntensityToggle
                                value="hard"
                                active={intensity === 'hard'}
                                onPick={setIntensity}
                            />
                        </div>
                    </div>

                    {/* Treadmill-only incline toggle. Three levels —
                        plain English ("Flat / Some incline / Steep")
                        with the MET bonus driving the kcal result
                        below silently. Walking on a 10% grade burns
                        materially more than walking flat, and most
                        treadmill users either know this intuitively
                        ("I want incline today") or want to see what
                        difference it makes. */}
                    {picked.supportsIncline && (
                        <div className="mb-6">
                            <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                                {t('cardioInclineLabel')}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <InclineToggle value="flat"  active={incline === 'flat'}  onPick={setIncline} />
                                <InclineToggle value="some"  active={incline === 'some'}  onPick={setIncline} />
                                <InclineToggle value="steep" active={incline === 'steep'} onPick={setIncline} />
                            </div>
                        </div>
                    )}

                    {/* Big result card */}
                    <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500/12 to-amber-500/8 border border-orange-500/25 text-center">
                        <div className="text-[10px] font-label font-bold uppercase tracking-widest text-orange-400 mb-2">
                            {t('cardioResultLabel')}
                        </div>
                        <div className="flex items-baseline justify-center gap-2" dir="ltr">
                            <span className="text-5xl md:text-6xl font-headline font-extrabold text-orange-400 tabular-nums leading-none">
                                {pickedKcal}
                            </span>
                            <span className="text-base font-label font-bold uppercase tracking-widest text-on-surface/55">
                                kcal
                            </span>
                        </div>
                        <p className="text-[12px] text-on-surface/55 font-body mt-3 leading-relaxed">
                            {t('cardioResultFootnote')}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Academy CTA ────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => navigate('/library?topic=cardio')}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-all group"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <GraduationCap size={20} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 text-start">
                        <div className="font-headline font-bold text-on-surface text-[15px] leading-tight mb-0.5">
                            {t('cardioAcademyCtaTitle')}
                        </div>
                        <div className="text-on-surface/55 text-[12.5px] font-body">
                            {t('cardioAcademyCtaSub')}
                        </div>
                    </div>
                </div>
                <ChevronRight
                    size={18}
                    className="text-on-surface/40 group-hover:text-primary shrink-0"
                    style={{ transform: isRTL ? 'rotate(180deg)' : undefined }}
                />
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
//  ActivityTile — one tile in the picker grid
// ─────────────────────────────────────────────────────────────────
function ActivityTile({ icon: Icon, label, kcal, active, onPick }: {
    icon: LucideIcon;
    label: string;
    kcal: number;
    active: boolean;
    onPick: () => void;
}) {
    const { t } = useLanguage();
    return (
        <button
            type="button"
            onClick={onPick}
            className={clsx(
                'group text-start p-4 rounded-2xl border-2 transition-all',
                active
                    ? 'bg-primary/12 border-primary'
                    : 'bg-surface-container-low border-outline-variant/30 hover:border-primary/40 hover:-translate-y-0.5',
            )}
        >
            <span className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors',
                active ? 'bg-primary/25 text-primary' : 'bg-orange-500/15 text-orange-400',
            )}>
                <Icon size={20} strokeWidth={2.4} />
            </span>
            <div className="font-headline font-bold text-on-surface text-[14px] leading-tight mb-2">
                {label}
            </div>
            <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-lg font-headline font-extrabold text-on-surface tabular-nums">{kcal}</span>
                <span className="text-[10px] font-label uppercase tracking-widest text-on-surface/45 font-bold">
                    {t('cardioTileKcal30Min')}
                </span>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
//  StatField — one of the three editable stats (age / height /
//  weight) in the expanded stats panel.
//
//  Bug fix: the first version clamped on every keystroke (e.g.
//  typing "175" for height meant "1" → clamped to 120 instantly,
//  then "17" → still 120, then "175" → finally 175). Felt
//  uncontrollable, which is the founder report.
//
//  Fix: keep a local string while the user is typing. Only parse
//  + clamp + propagate to the parent on BLUR or Enter. The input
//  syncs back from `value` whenever the parent changes it for
//  other reasons (initial render, another component setting it).
// ─────────────────────────────────────────────────────────────────
function StatField({ icon: Icon, label, value, onChange, suffix, min, max }: {
    icon: LucideIcon;
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix: string;
    min: number;
    max: number;
}) {
    const [text, setText] = useState<string>(String(value));

    // Sync local text from parent value when it changes from outside
    // (e.g. profile load, initial render). Skip when the user is
    // mid-edit — handled by the input only updating `text`, not
    // calling onChange until blur.
    useEffect(() => { setText(String(value)); }, [value]);

    const commit = () => {
        const n = parseInt(text, 10);
        if (Number.isNaN(n)) {
            // User cleared the field or entered junk — restore the
            // last good value rather than leaving the input empty
            // (which would break the BMR / weekly target math
            // downstream).
            setText(String(value));
            return;
        }
        const clamped = Math.max(min, Math.min(max, n));
        if (clamped !== value) onChange(clamped);
        // Reflect the clamped value in the input too — so if you
        // tried to type 999 and max is 200, the field shows 200.
        setText(String(clamped));
    };

    return (
        <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20">
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} className="text-on-surface/50" strokeWidth={2.4} />
                <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface/55">
                    {label}
                </span>
            </div>
            <div className="flex items-baseline gap-1" dir="ltr">
                <input
                    type="number"
                    inputMode="numeric"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                    // Drop the native min/max attribute so the browser
                    // doesn't interfere with typing. Clamping is our
                    // job on commit, not the browser's mid-keystroke.
                    className="w-full min-w-0 bg-transparent border-none outline-none text-2xl font-headline font-extrabold text-on-surface tabular-nums focus:text-primary transition-colors"
                />
                <span className="text-[10px] font-label uppercase tracking-widest text-on-surface/45 font-bold shrink-0">
                    {suffix}
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  InclineToggle — Flat / Some / Steep buttons (treadmill only)
// ─────────────────────────────────────────────────────────────────
function InclineToggle({ value, active, onPick }: {
    value: Incline;
    active: boolean;
    onPick: (v: Incline) => void;
}) {
    const { t } = useLanguage();
    const config = value === 'flat'
        ? { icon: Minus, labelKey: 'cardioInclineFlat',  activeBg: 'bg-emerald-500/15 border-emerald-500', activeText: 'text-emerald-400' }
        : value === 'some'
            ? { icon: TrendingUp, labelKey: 'cardioInclineSome', activeBg: 'bg-amber-500/15 border-amber-500', activeText: 'text-amber-400' }
            : { icon: Mountain, labelKey: 'cardioInclineSteep', activeBg: 'bg-orange-500/15 border-orange-500', activeText: 'text-orange-400' };
    const Icon = config.icon;
    return (
        <button
            type="button"
            onClick={() => onPick(value)}
            className={clsx(
                'py-2.5 px-3 rounded-xl text-center transition-all flex flex-col items-center gap-1',
                active
                    ? `${config.activeBg} border-2`
                    : 'bg-surface-container-lowest border-2 border-outline-variant/25 hover:border-primary/40',
            )}
        >
            <Icon size={14} className={active ? config.activeText : 'text-on-surface/55'} strokeWidth={2.4} />
            <span className={clsx(
                'font-headline font-bold text-[12px]',
                active ? 'text-on-surface' : 'text-on-surface/70',
            )}>
                {t(config.labelKey)}
            </span>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
//  IntensityToggle — Easy / Hard buttons
// ─────────────────────────────────────────────────────────────────
function IntensityToggle({ value, active, onPick }: {
    value: Intensity;
    active: boolean;
    onPick: (v: Intensity) => void;
}) {
    const { t } = useLanguage();
    const isEasy = value === 'easy';
    return (
        <button
            type="button"
            onClick={() => onPick(value)}
            className={clsx(
                'py-3 px-4 rounded-xl text-start transition-all',
                active && (isEasy
                    ? 'bg-emerald-500/15 border-2 border-emerald-500 text-on-surface'
                    : 'bg-orange-500/15 border-2 border-orange-500 text-on-surface'),
                !active && 'bg-surface-container-lowest border-2 border-outline-variant/25 text-on-surface/70 hover:border-primary/40',
            )}
        >
            <div className="flex items-center gap-2 mb-1">
                {isEasy
                    ? <Footprints size={14} className={active ? 'text-emerald-400' : 'text-on-surface/55'} />
                    : <Flame size={14} className={active ? 'text-orange-400' : 'text-on-surface/55'} />}
                <span className="font-headline font-bold text-[14px]">
                    {isEasy ? t('cardioIntensityEasy') : t('cardioIntensityHard')}
                </span>
            </div>
            <div className="text-[11px] font-body text-on-surface/55 leading-snug">
                {isEasy ? t('cardioIntensityEasyHint') : t('cardioIntensityHardHint')}
            </div>
        </button>
    );
}
