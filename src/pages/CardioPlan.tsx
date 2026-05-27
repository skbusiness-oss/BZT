/**
 * CardioPlan — the full self-service cardio planner. Modelled after
 * the Diets page architecture: educational sections + machine-level
 * detail + a calculator. Lives at /cardio. Community users land
 * here from the small "Plan your cardio" trailer card on the
 * dashboard.
 *
 * Critically: this page does NOT log cardio. Logging happens on
 * /update (ProgressPanel) inside the weekly check-in. The page is
 * for understanding + planning. A prominent callout near the top
 * makes that explicit so users don't search for a Save button
 * that isn't here.
 *
 * Calorie burn math uses standard METs (Metabolic Equivalents):
 *     kcal/min = (MET × 3.5 × weight_kg) / 200
 *
 * Each machine has two MET values — one for the Fat Burn zone
 * (60-70% MHR, conversational pace) and one for the Train Heart
 * zone (70-90% MHR, hard effort / HIIT-like). When the user
 * picks a zone above, every machine card recalculates with the
 * right MET so they can compare "treadmill at fat burn" vs
 * "bike at heart" at a glance.
 *
 * MET values sourced from the Compendium of Physical Activities
 * (Ainsworth et al., 2024 update). Approximations — real burn
 * varies with effort, terrain, machine resistance, individual
 * metabolism.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    ArrowLeft, Heart, Zap, Flame, GraduationCap, ChevronRight,
    Info, Footprints, Bike, Activity, Waves, ChevronsUp, Repeat,
    Dumbbell, Target, type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
//  Zone configuration — shared with the dashboard trailer card
// ─────────────────────────────────────────────────────────────────
const ZONES = {
    fat: {
        id: 'fat' as const,
        hrMin: 0.60, hrMax: 0.70,
        defaultMin: 40,
        rangeMin: 15, rangeMax: 90,
    },
    heart: {
        id: 'heart' as const,
        hrMin: 0.70, hrMax: 0.90,
        defaultMin: 20,
        rangeMin: 10, rangeMax: 45,
    },
} as const;
type ZoneId = keyof typeof ZONES;

// ─────────────────────────────────────────────────────────────────
//  Machine catalog — MET values per zone
//
//  MET source: Compendium of Physical Activities, 2024 update.
//  Each entry has fatMet (sustainable effort, ~60-70% MHR) and
//  heartMet (hard effort, ~70-90% MHR / HIIT-style intervals).
//
//  Order is deliberate: most-common machines first (treadmill,
//  bike, elliptical), then less-common, with outdoor options last.
// ─────────────────────────────────────────────────────────────────
interface Machine {
    id: string;
    labelKey: string;
    descKey: string;
    icon: LucideIcon;
    fatMet: number;   // MET at fat-burn intensity
    heartMet: number; // MET at heart-training intensity
}

const MACHINES: Machine[] = [
    { id: 'treadmill',  labelKey: 'cardioMachTreadmill',  descKey: 'cardioMachTreadmillDesc',  icon: Footprints, fatMet: 6,   heartMet: 11 },
    { id: 'bike',       labelKey: 'cardioMachBike',       descKey: 'cardioMachBikeDesc',       icon: Bike,       fatMet: 5,   heartMet: 9 },
    { id: 'elliptical', labelKey: 'cardioMachElliptical', descKey: 'cardioMachEllipticalDesc', icon: Activity,   fatMet: 5,   heartMet: 8 },
    { id: 'rower',      labelKey: 'cardioMachRower',      descKey: 'cardioMachRowerDesc',      icon: Repeat,     fatMet: 5,   heartMet: 8 },
    { id: 'stairs',     labelKey: 'cardioMachStairs',     descKey: 'cardioMachStairsDesc',     icon: ChevronsUp, fatMet: 6,   heartMet: 9 },
    { id: 'walk',       labelKey: 'cardioMachWalk',       descKey: 'cardioMachWalkDesc',       icon: Footprints, fatMet: 3.5, heartMet: 6 },
    { id: 'jumprope',   labelKey: 'cardioMachJumprope',   descKey: 'cardioMachJumpropeDesc',   icon: Zap,        fatMet: 9,   heartMet: 12 },
    { id: 'swim',       labelKey: 'cardioMachSwim',       descKey: 'cardioMachSwimDesc',       icon: Waves,      fatMet: 6,   heartMet: 10 },
];

// kcal/min for a given MET + body weight. Standard formula.
const kcalPerMin = (met: number, weightKg: number) => (met * 3.5 * weightKg) / 200;

export const CardioPlan = () => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    const age      = user?.age ?? 30;
    const weightKg = user?.currentWeightKg ?? 70;
    const mhr      = Math.max(220 - age, 100);

    const [zone, setZone] = useState<ZoneId>('fat');
    const [durationMin, setDurationMin] = useState<number>(ZONES.fat.defaultMin);

    const cfg = ZONES[zone];
    const hrLow  = Math.round(mhr * cfg.hrMin);
    const hrHigh = Math.round(mhr * cfg.hrMax);

    const pickZone = (z: ZoneId) => {
        setZone(z);
        setDurationMin(ZONES[z].defaultMin);
    };

    // Per-machine kcal-burn estimates for the user's body weight at
    // the selected zone's MET. Recomputed on zone / weight change.
    const machineRows = useMemo(() => {
        return MACHINES.map(m => {
            const met = zone === 'fat' ? m.fatMet : m.heartMet;
            const perMin = kcalPerMin(met, weightKg);
            const total = Math.round(perMin * durationMin);
            return { ...m, met, perMin, total };
        });
    }, [zone, weightKg, durationMin]);

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-in fade-in duration-500" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
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
            <header className="mb-8">
                <span className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-primary block mb-2">
                    {t('cardioPlanEyebrow')}
                </span>
                <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter leading-tight mb-3">
                    {t('cardioPlanTitle')}
                </h1>
                <p className="font-body text-on-surface/65 text-base md:text-lg max-w-2xl leading-relaxed">
                    {t('cardioPlanSubtitle')}
                </p>
            </header>

            {/* ── "Log on Update" callout ────────────────────────
                The thing the user most needs to know up front: this
                page is for planning, not logging. Without this,
                users hunt for a Save button that doesn't exist.
                Tap routes straight to /update. */}
            <button
                type="button"
                onClick={() => navigate('/update')}
                className="w-full mb-10 group flex items-start gap-4 p-5 rounded-2xl bg-primary/6 border border-primary/25 hover:bg-primary/10 hover:border-primary/40 transition-all text-start"
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

            {/* ═══════════════════════════════════════════════════
                SECTION 1 — Your numbers
            ═══════════════════════════════════════════════════ */}
            <Section
                index={1}
                title={t('cardioSection1Title')}
                description={t('cardioSection1Hint')}
            >
                <div className="bg-surface-container-low rounded-2xl p-6 ghost-border grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricTile
                        label={t('cardioMhrLabel')}
                        value={mhr}
                        unit="bpm"
                        icon={Heart}
                        accent="text-rose-400"
                        sub={t('cardioMhrFormula')?.replace('{age}', String(age))}
                    />
                    <MetricTile
                        label={t('cardioYourWeight')}
                        value={weightKg}
                        unit="kg"
                        icon={Dumbbell}
                        accent="text-primary"
                        sub={t('cardioWeightSub')}
                    />
                    <MetricTile
                        label={t('cardioFormula')}
                        value="220 − age"
                        icon={Target}
                        accent="text-on-surface/85"
                        sub={t('cardioFormulaSub')}
                    />
                </div>
                <p className="text-[12.5px] text-on-surface/55 font-body mt-3 leading-relaxed">
                    {t('cardioSection1Footnote')}
                </p>
            </Section>

            {/* ═══════════════════════════════════════════════════
                SECTION 2 — Pick a goal
            ═══════════════════════════════════════════════════ */}
            <Section
                index={2}
                title={t('cardioSection2Title')}
                description={t('cardioSection2Hint')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ZoneCard
                        zoneId="fat"
                        active={zone === 'fat'}
                        onPick={pickZone}
                        hrLow={Math.round(mhr * 0.60)}
                        hrHigh={Math.round(mhr * 0.70)}
                    />
                    <ZoneCard
                        zoneId="heart"
                        active={zone === 'heart'}
                        onPick={pickZone}
                        hrLow={Math.round(mhr * 0.70)}
                        hrHigh={Math.round(mhr * 0.90)}
                    />
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════
                SECTION 3 — Machine variations
            ═══════════════════════════════════════════════════ */}
            <Section
                index={3}
                title={t('cardioSection3Title')}
                description={t('cardioSection3Hint')
                    ?.replace('{zone}', zone === 'fat' ? (t('cardioZoneFatTitle') || 'Fat burn') : (t('cardioZoneHeartTitle') || 'Train heart'))}
            >
                {/* Live duration slider that drives the per-machine
                    totals in the grid below. */}
                <div className="bg-surface-container-low rounded-2xl p-5 ghost-border mb-4">
                    <div className="flex items-baseline justify-between mb-3">
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55">
                            {t('cardioDurationLabel')}
                        </span>
                        <span className="text-2xl font-headline font-extrabold text-primary tabular-nums" dir="ltr">
                            {durationMin}<span className="text-xs text-on-surface/40 font-normal"> min</span>
                        </span>
                    </div>
                    <input
                        type="range"
                        min={cfg.rangeMin}
                        max={cfg.rangeMax}
                        step={5}
                        value={durationMin}
                        onChange={(e) => setDurationMin(parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary"
                    />
                    <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                        <span>{cfg.rangeMin} min</span>
                        <span>{cfg.rangeMax} min</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {machineRows.map(m => (
                        <MachineTile
                            key={m.id}
                            icon={m.icon}
                            label={t(m.labelKey)}
                            desc={t(m.descKey)}
                            perMin={m.perMin}
                            total={m.total}
                            durationMin={durationMin}
                            zone={zone}
                        />
                    ))}
                </div>

                <div className="mt-4 rounded-xl p-4 bg-surface-container-lowest border border-outline-variant/30 flex items-start gap-3">
                    <Info size={14} className="text-on-surface/45 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-on-surface/55 font-body leading-relaxed">
                        {t('cardioSection3Footnote')
                            ?.replace('{weight}', String(weightKg))}
                    </p>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════
                SECTION 4 — Targets at a glance
            ═══════════════════════════════════════════════════ */}
            <Section
                index={4}
                title={t('cardioSection4Title')}
                description={t('cardioSection4Hint')}
            >
                <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500/10 via-amber-500/8 to-orange-500/6 border border-orange-500/25">
                    <div className="text-center mb-4">
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-orange-400 block mb-2">
                            {t('cardioTargetHrLabel')}
                        </span>
                        <div className="text-4xl font-headline font-extrabold text-orange-400 tabular-nums" dir="ltr">
                            {hrLow}–{hrHigh}<span className="text-base text-on-surface/45 font-normal ms-1">bpm</span>
                        </div>
                    </div>
                    <div className="border-t border-orange-500/15 pt-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-1">
                                {t('cardioPickedZoneLabel')}
                            </div>
                            <div className="font-headline font-bold text-on-surface text-[14px]">
                                {zone === 'fat' ? t('cardioZoneFatTitle') : t('cardioZoneHeartTitle')}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-1">
                                {t('cardioPickedDurationLabel')}
                            </div>
                            <div className="font-headline font-bold text-on-surface text-[14px] tabular-nums">
                                {durationMin} min
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Academy CTA ─────────────────────────────────── */}
            <button
                type="button"
                onClick={() => navigate('/library?topic=cardio')}
                className="w-full mt-8 flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-all group"
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
//  Section header — numbered, with title + hint underneath
// ─────────────────────────────────────────────────────────────────
function Section({ index, title, description, children }: {
    index: number;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-10">
            <header className="flex items-start gap-3 mb-5">
                <span className="w-9 h-9 rounded-lg bg-primary/12 text-primary flex items-center justify-center font-headline font-extrabold text-[15px] tabular-nums shrink-0 border border-primary/25" dir="ltr">
                    {index}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-headline font-extrabold text-on-surface text-xl md:text-2xl tracking-tight leading-tight mb-1">
                        {title}
                    </h2>
                    <p className="font-body text-on-surface/55 text-[13.5px] leading-relaxed">
                        {description}
                    </p>
                </div>
            </header>
            {children}
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Metric tile — MHR / weight / formula at the top of section 1
// ─────────────────────────────────────────────────────────────────
function MetricTile({ label, value, unit, icon: Icon, accent, sub }: {
    label: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    accent: string;
    sub?: string;
}) {
    return (
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/25">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={accent} strokeWidth={2.4} />
                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55">
                    {label}
                </span>
            </div>
            <div className="flex items-baseline gap-1.5" dir="ltr">
                <span className={`text-2xl md:text-3xl font-headline font-extrabold tabular-nums ${accent}`}>{value}</span>
                {unit && <span className="text-xs text-on-surface/45 font-body">{unit}</span>}
            </div>
            {sub && (
                <p className="text-[11px] text-on-surface/45 font-body mt-1.5 leading-snug">{sub}</p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Zone card — Fat Burn / Train Heart picker
// ─────────────────────────────────────────────────────────────────
function ZoneCard({ zoneId, active, onPick, hrLow, hrHigh }: {
    zoneId: ZoneId;
    active: boolean;
    onPick: (z: ZoneId) => void;
    hrLow: number;
    hrHigh: number;
}) {
    const { t } = useLanguage();
    const isFat = zoneId === 'fat';
    return (
        <button
            type="button"
            onClick={() => onPick(zoneId)}
            className={clsx(
                'group text-start p-5 rounded-2xl border-2 transition-all',
                active && (isFat
                    ? 'bg-emerald-500/14 border-emerald-500'
                    : 'bg-orange-500/14 border-orange-500'),
                !active && (isFat
                    ? 'bg-emerald-500/6 border-emerald-500/25 hover:border-emerald-500/50'
                    : 'bg-orange-500/6 border-orange-500/25 hover:border-orange-500/50'),
            )}
        >
            <div className="flex items-center gap-3 mb-3">
                <span className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isFat ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400',
                )}>
                    {isFat ? <Heart size={20} strokeWidth={2.4} /> : <Zap size={20} strokeWidth={2.4} />}
                </span>
                <div className="min-w-0">
                    <div className="font-headline font-extrabold text-on-surface text-[18px] leading-tight">
                        {isFat ? t('cardioZoneFatTitle') : t('cardioZoneHeartTitle')}
                    </div>
                    <div className="text-on-surface/55 text-[11px] font-label font-bold uppercase tracking-widest mt-0.5" dir="ltr">
                        {Math.round((isFat ? 0.60 : 0.70) * 100)}–{Math.round((isFat ? 0.70 : 0.90) * 100)}% MHR · {hrLow}–{hrHigh} bpm
                    </div>
                </div>
            </div>
            <p className="text-on-surface/80 text-[13.5px] font-body leading-relaxed mb-3">
                {isFat ? t('cardioZoneFatLong') : t('cardioZoneHeartLong')}
            </p>
            <ul className="space-y-1.5 text-[12.5px] text-on-surface/70 font-body">
                <li className="flex items-start gap-2"><span className={isFat ? 'text-emerald-400' : 'text-orange-400'}>•</span>{isFat ? t('cardioZoneFatBullet1') : t('cardioZoneHeartBullet1')}</li>
                <li className="flex items-start gap-2"><span className={isFat ? 'text-emerald-400' : 'text-orange-400'}>•</span>{isFat ? t('cardioZoneFatBullet2') : t('cardioZoneHeartBullet2')}</li>
                <li className="flex items-start gap-2"><span className={isFat ? 'text-emerald-400' : 'text-orange-400'}>•</span>{isFat ? t('cardioZoneFatBullet3') : t('cardioZoneHeartBullet3')}</li>
            </ul>
            {active && (
                <div className={clsx(
                    'mt-3 inline-flex items-center gap-1.5 text-[10px] font-label font-bold uppercase tracking-widest',
                    isFat ? 'text-emerald-400' : 'text-orange-400',
                )}>
                    <Flame size={11} /> {t('cardioZonePickedLabel')}
                </div>
            )}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Machine tile — one card per machine in section 3
// ─────────────────────────────────────────────────────────────────
function MachineTile({ icon: Icon, label, desc, perMin, total, durationMin, zone }: {
    icon: LucideIcon;
    label: string;
    desc: string;
    perMin: number;
    total: number;
    durationMin: number;
    zone: ZoneId;
}) {
    const { t } = useLanguage();
    return (
        <div className="bg-surface-container-low rounded-2xl p-4 ghost-border">
            <div className="flex items-center gap-2.5 mb-3">
                <span className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    zone === 'fat' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400',
                )}>
                    <Icon size={16} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="font-headline font-bold text-on-surface text-[14px] leading-tight">
                        {label}
                    </div>
                    <div className="text-on-surface/50 text-[11px] font-body mt-0.5 leading-snug">
                        {desc}
                    </div>
                </div>
            </div>
            <div className="flex items-baseline justify-between" dir="ltr">
                <div>
                    <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/45 mb-0.5">
                        {durationMin} min →
                    </div>
                    <div className="text-2xl font-headline font-extrabold text-primary tabular-nums">
                        {total} <span className="text-[11px] text-on-surface/45 font-normal font-body">kcal</span>
                    </div>
                </div>
                <div className="text-end">
                    <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/45 mb-0.5">
                        {t('cardioPerMinLabel')}
                    </div>
                    <div className="text-[13px] font-headline font-bold text-on-surface/80 tabular-nums">
                        {perMin.toFixed(1)}<span className="text-[10px] text-on-surface/45 font-normal font-body"> kcal/min</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
