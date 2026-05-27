/**
 * CardioCalculatorCard — community-user self-service tool for
 * figuring out how much cardio to do per session.
 *
 * Why this exists (founder direction): coaching clients get a cardio
 * target prescribed by Coach Med, but community users are on their
 * own. They need a way to compute "how long should I do cardio for
 * and what intensity?" without leaving the app or buying coaching.
 *
 * The calculator uses the classic Tanaka / Fox formula:
 *     Max Heart Rate (MHR) = 220 − age
 *
 * From MHR we derive two zones with very different intents:
 *
 *   FAT BURN (60–70 % of MHR)
 *     - "Conversational pace" — you can speak in full sentences
 *     - Long, easy sessions (30–60 min)
 *     - Body uses a higher % of fat as fuel
 *     - MET ≈ 5–7
 *     - Best for: cutting, recovery cardio, building aerobic base
 *
 *   TRAIN HEART / HIIT (70–90 % of MHR)
 *     - Hard intensity — short sentences only
 *     - Short, intense sessions (15–30 min)
 *     - Body uses more carbs, but burns more TOTAL calories
 *     - Big EPOC afterburn (calories burned for hours post-workout)
 *     - MET ≈ 8–12
 *     - Best for: cardio fitness, time-efficient calorie burn
 *
 * Calorie burn estimate uses the standard MET formula:
 *     kcal/min ≈ (MET × 3.5 × weight_kg) / 200
 *
 * The card flows in three states:
 *   1. Intro      — show MHR + the two zone cards, prompt to pick one
 *   2. Picked     — show the selected zone, duration slider, live kcal
 *                   estimate, notes field, Save button, Academy link
 *   3. Saved      — confirmation pulse, "Save another?" affordance
 *
 * Side-effects on Save:
 *   - Writes a self-log entry via the parent's onLogCardio callback
 *     with { cardioCalories, notes, intensity } so the calculator's
 *     output shows up on the user's tracking chart alongside their
 *     manual weight logs.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    Flame, Zap, GraduationCap, ChevronRight, CheckCircle, Heart,
    Info, Loader2, Save,
} from 'lucide-react';
import clsx from 'clsx';

/** Heart-rate-zone configuration. Both zones share the same math
 *  shape (MET-based kcal estimate, fraction-of-MHR target band),
 *  just with different defaults that match how each zone is trained
 *  in practice. */
const ZONES = {
    fat: {
        id: 'fat' as const,
        // Heart-rate band as a fraction of MHR
        hrMin: 0.60, hrMax: 0.70,
        // MET range (used for the calorie estimate)
        metLow: 5, metHigh: 7,
        // Default duration when the zone is first selected
        defaultMin: 40,
        // Allowed slider range
        rangeMin: 15, rangeMax: 90,
    },
    heart: {
        id: 'heart' as const,
        hrMin: 0.70, hrMax: 0.90,
        metLow: 8, metHigh: 12,
        defaultMin: 20,
        rangeMin: 10, rangeMax: 45,
    },
} as const;

type ZoneId = keyof typeof ZONES;

interface Props {
    /** Called with the planned cardio when the user taps Save. The
     *  parent decides where the data lands (selfLogs for community,
     *  weekly metric for coaching). Best-effort: the card shows a
     *  success state even if the callback fails so the user knows
     *  their plan was at least computed. */
    onSaveCardio: (entry: {
        zone: ZoneId;
        durationMin: number;
        targetKcal: number;
        targetHrLow: number;
        targetHrHigh: number;
        notes: string;
    }) => Promise<void>;
}

export function CardioCalculatorCard({ onSaveCardio }: Props) {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    // Pull age + weight from the user's community baseline profile.
    // These get set when the user fills out CommunityBaselineForm
    // after first sign-in. We default to placeholder values
    // (30y / 70kg) for the unlikely case where they're missing —
    // the calculation degrades gracefully rather than 404.
    const age      = user?.age ?? 30;
    const weightKg = user?.currentWeightKg ?? 70;

    const mhr = useMemo(() => Math.max(220 - age, 100), [age]);

    const [zone, setZone] = useState<ZoneId | null>(null);
    const [durationMin, setDurationMin] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pickZone = (z: ZoneId) => {
        setZone(z);
        setDurationMin(ZONES[z].defaultMin);
        setSaved(false);
    };

    const cfg = zone ? ZONES[zone] : null;
    const hrLow  = cfg ? Math.round(mhr * cfg.hrMin) : 0;
    const hrHigh = cfg ? Math.round(mhr * cfg.hrMax) : 0;

    // Average MET for the picked zone. We use the midpoint so the
    // estimate sits in the middle of "if I push" and "if I cruise".
    const avgMet = cfg ? (cfg.metLow + cfg.metHigh) / 2 : 0;
    const kcalEstimate = useMemo(() => {
        if (!cfg) return 0;
        // Standard MET formula: kcal/min = (MET × 3.5 × weight_kg) / 200
        const kcalPerMin = (avgMet * 3.5 * weightKg) / 200;
        return Math.round(kcalPerMin * durationMin);
    }, [cfg, avgMet, weightKg, durationMin]);

    const handleSave = async () => {
        if (!cfg) return;
        setSaving(true);
        setError(null);
        try {
            await onSaveCardio({
                zone: cfg.id,
                durationMin,
                targetKcal: kcalEstimate,
                targetHrLow: hrLow,
                targetHrHigh: hrHigh,
                notes,
            });
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface-container-low rounded-2xl p-6 ghost-border" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
                        <Flame size={20} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
                            {t('cardioCalcTitle')}
                        </h3>
                        <p className="font-body text-on-surface/55 text-[13px] mt-0.5 leading-snug">
                            {t('cardioCalcSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── MHR readout ─────────────────────────────────────── */}
            <div className="bg-surface-container rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 mb-1">
                        {t('cardioCalcMhrLabel')}
                    </div>
                    <div className="text-on-surface/85 text-[12px] font-body">
                        {t('cardioCalcMhrFormula')
                            ?.replace('{age}', String(age))
                            ?? `220 − ${age} years`}
                    </div>
                </div>
                <div className="text-end shrink-0" dir="ltr">
                    <div className="text-3xl font-headline font-extrabold text-orange-400 tabular-nums leading-none">{mhr}</div>
                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface/45 mt-1">bpm</div>
                </div>
            </div>

            {/* ── Zone picker (state 1: not picked) ───────────────── */}
            {!zone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <ZoneOption
                        zoneId="fat"
                        active={false}
                        onPick={pickZone}
                        mhr={mhr}
                    />
                    <ZoneOption
                        zoneId="heart"
                        active={false}
                        onPick={pickZone}
                        mhr={mhr}
                    />
                </div>
            )}

            {/* ── Picked state: planning UI ───────────────────────── */}
            {cfg && (
                <div className="bzt-rise-in" style={{ animationDuration: '220ms' }}>
                    {/* Selected-zone summary chip with switch back to picker */}
                    <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-outline-variant/15">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className={clsx(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                zone === 'fat' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400',
                            )}>
                                {zone === 'fat' ? <Heart size={16} strokeWidth={2.4} /> : <Zap size={16} strokeWidth={2.4} />}
                            </span>
                            <div className="min-w-0">
                                <div className="font-headline font-bold text-on-surface text-[14px] leading-tight">
                                    {zone === 'fat' ? t('cardioCalcZoneFatTitle') : t('cardioCalcZoneHeartTitle')}
                                </div>
                                <div className="text-on-surface/55 text-[11px] font-body" dir="ltr">
                                    {hrLow}–{hrHigh} bpm
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setZone(null); setSaved(false); setNotes(''); }}
                            className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/45 hover:text-primary transition-colors shrink-0"
                        >
                            {t('cardioCalcChangeZone')}
                        </button>
                    </div>

                    {/* Duration slider + live kcal estimate */}
                    <div className="mb-5">
                        <div className="flex items-baseline justify-between mb-3">
                            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55">
                                {t('cardioCalcDurationLabel')}
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
                            onChange={(e) => { setDurationMin(parseInt(e.target.value)); setSaved(false); }}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary"
                        />
                        <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                            <span>{cfg.rangeMin} min</span>
                            <span>{cfg.rangeMax} min</span>
                        </div>
                    </div>

                    {/* Live calorie estimate — the headline number */}
                    <div className="bg-gradient-to-br from-orange-500/12 to-amber-500/8 rounded-2xl p-5 mb-5 border border-orange-500/20 text-center">
                        <div className="text-[10px] font-label font-bold uppercase tracking-widest text-orange-400 mb-2">
                            {t('cardioCalcEstimateLabel')}
                        </div>
                        <div className="flex items-baseline justify-center gap-2" dir="ltr">
                            <span className="text-5xl font-headline font-extrabold text-orange-400 tabular-nums leading-none">{kcalEstimate}</span>
                            <span className="text-sm font-label uppercase tracking-widest text-on-surface/55 font-bold">kcal</span>
                        </div>
                        <p className="text-[11px] text-on-surface/50 font-body mt-3 leading-relaxed max-w-xs mx-auto">
                            {t('cardioCalcEstimateFootnote')
                                ?.replace('{weight}', String(weightKg))
                                ?? `Estimate for ${weightKg} kg body weight.`}
                        </p>
                    </div>

                    {/* Notes — for the user's own log / memory */}
                    <div className="mb-5">
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55 mb-2">
                            {t('cardioCalcNotesLabel')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
                            placeholder={t('cardioCalcNotesPlaceholder')}
                            className="w-full h-20 bg-surface-container-lowest rounded-xl p-3 text-on-surface placeholder-on-surface/30 resize-none border-none outline-none focus:ring-1 focus:ring-primary/30 font-body text-sm transition-all"
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] font-body">
                            {error}
                        </div>
                    )}

                    {/* Save + saved state */}
                    {saved ? (
                        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 mb-4">
                            <CheckCircle size={16} />
                            <span className="text-[12px] font-label font-bold uppercase tracking-widest">
                                {t('cardioCalcSavedConfirm')}
                            </span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="bzt-press w-full px-6 py-3.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary text-[12px] font-label font-bold uppercase tracking-widest shadow-[0_8px_22px_rgba(230,195,100,0.30)] disabled:opacity-60 flex items-center justify-center gap-2 transition-all mb-4"
                        >
                            {saving
                                ? <Loader2 size={14} className="animate-spin" />
                                : <><Save size={14} /> {t('cardioCalcSaveCta')}</>}
                        </button>
                    )}
                </div>
            )}

            {/* ── Academy link (always visible) ───────────────────── */}
            <button
                type="button"
                onClick={() => navigate('/library?topic=cardio')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-all group"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <GraduationCap size={16} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 text-start">
                        <div className="font-headline font-bold text-on-surface text-[13px] leading-tight">
                            {t('cardioCalcAcademyCtaTitle')}
                        </div>
                        <div className="text-on-surface/55 text-[11px] font-body mt-0.5">
                            {t('cardioCalcAcademyCtaSub')}
                        </div>
                    </div>
                </div>
                <ChevronRight size={16} className="text-on-surface/40 group-hover:text-primary transition-colors shrink-0" style={{ transform: isRTL ? 'rotate(180deg)' : undefined }} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Single-zone selector tile — used twice in the picker grid
// ─────────────────────────────────────────────────────────────────
function ZoneOption({
    zoneId, onPick, mhr,
}: {
    zoneId: ZoneId;
    active: boolean;
    onPick: (z: ZoneId) => void;
    mhr: number;
}) {
    const { t, isRTL } = useLanguage();
    const cfg = ZONES[zoneId];
    const hrLow  = Math.round(mhr * cfg.hrMin);
    const hrHigh = Math.round(mhr * cfg.hrMax);
    const isFat = zoneId === 'fat';

    return (
        <button
            type="button"
            onClick={() => onPick(zoneId)}
            className={clsx(
                'group text-start p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]',
                isFat
                    ? 'bg-emerald-500/8 border-emerald-500/25 hover:border-emerald-500/55 hover:bg-emerald-500/12'
                    : 'bg-orange-500/8 border-orange-500/25 hover:border-orange-500/55 hover:bg-orange-500/12',
            )}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    isFat ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400',
                )}>
                    {isFat ? <Heart size={18} strokeWidth={2.4} /> : <Zap size={18} strokeWidth={2.4} />}
                </span>
                <div className="min-w-0">
                    <div className="font-headline font-bold text-on-surface text-[14px] leading-tight">
                        {isFat ? t('cardioCalcZoneFatTitle') : t('cardioCalcZoneHeartTitle')}
                    </div>
                    <div className="text-on-surface/55 text-[10px] font-label font-bold uppercase tracking-widest mt-0.5" dir="ltr">
                        {Math.round(cfg.hrMin * 100)}–{Math.round(cfg.hrMax * 100)}% MHR
                    </div>
                </div>
            </div>

            <p className="text-on-surface/75 text-[12.5px] font-body leading-relaxed mb-3">
                {isFat ? t('cardioCalcZoneFatBody') : t('cardioCalcZoneHeartBody')}
            </p>

            <div className="flex items-center justify-between text-[10px] font-label font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1 text-on-surface/55" dir="ltr">
                    <Info size={10} />
                    {hrLow}–{hrHigh} bpm
                </div>
                <span className={clsx(
                    'transition-colors',
                    isFat ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-orange-400 group-hover:text-orange-300',
                )}>
                    {t('cardioCalcSelect')}
                    <ChevronRight size={11} className="inline ms-0.5" style={{ transform: isRTL ? 'rotate(180deg)' : undefined }} />
                </span>
            </div>
        </button>
    );
}
