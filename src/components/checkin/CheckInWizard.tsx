/**
 * CheckInWizard — step-by-step replacement for the long-scroll
 * Check-In form. Shipped after user testing surfaced a recurring
 * confusion: clients didn't realise they had to scroll past the
 * coach panels to find the daily-entries table. Founders called
 * it "the daily entries are buried" — testers thought they were
 * done after reading the coach's note at the top of the page.
 *
 * This wizard fixes that with four steps:
 *   1. Daily log         — the 7-day macros + weight + cardio table
 *   2. How you felt      — strength / hunger / energy / cardio sliders
 *   3. Progress photos   — 4 angles (front / side / back / face)
 *   4. Reflect & submit  — weekly summary textarea + Submit button
 *
 * Why 4 steps, not 3:
 *   - Sliders + photos in one step adds two heavy actions (drag four
 *     sliders, then take/upload four photos) — exactly the kind of
 *     cognitive piling that caused the original page to feel
 *     overwhelming. Splitting them keeps each step's hand-on-the-
 *     screen workload predictable.
 *
 * The wizard is ONLY shown when weekData.status === 'pending' (the
 * client is actively filling). For submitted / reviewed / locked
 * weeks the parent renders the original flat layout so historic
 * weeks remain scannable in one scroll.
 *
 * Sticky `CoachReferencePill` sits above each step. The original
 * Coach Targets + Coach Feedback panels stay accessible there
 * (taps expand a panel with the full targets + feedback) so the
 * client never loses the brief while filling — the panels just
 * stop competing for first-paint attention.
 */
import { useState, useEffect } from 'react';
import { DayEntry, WeekPhotos, MacroTargets, MacroTarget } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { DailyTrackingTable } from './DailyTrackingTable';
import {
    ChevronLeft, ChevronRight, ArrowRight, Send, Save, Camera, X,
    Flame, Shield, Zap, Loader2, CheckCircle, Target, MessageSquare,
    Lightbulb, Info,
    type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
    /** When true, the wizard renders a read-only "tour" of a past
     *  week — every input disabled, no Submit, no Save Draft. The
     *  client can still step through and review what they logged
     *  + the coach's feedback. Used for submitted / reviewed /
     *  locked week states. */
    readOnly: boolean;
    /** Status of the week — used in read-only mode to render the
     *  right status badge at the top of each step. */
    weekStatus: 'pending' | 'submitted' | 'reviewed' | 'locked';
    /** Active week macro targets prescribed by the coach. */
    targets: MacroTargets;
    /** Coach's review note from the previous reviewed week (or null). */
    coachFeedback: string | null;
    /** Current daily entries — the wizard mutates via `setEntries`. */
    entries: DayEntry[];
    setEntries: (next: DayEntry[]) => void;
    photos: WeekPhotos;
    setPhotos: React.Dispatch<React.SetStateAction<WeekPhotos>>;
    strength: number;        setStrength: (n: number) => void;
    hunger: number;          setHunger: (n: number) => void;
    energy: number;          setEnergy: (n: number) => void;
    cardioCalories: number;  setCardioCalories: (n: number) => void;
    summary: string;         setSummary: (s: string) => void;
    /** Photo upload handler — wizard delegates upstream because Firebase
     *  Storage upload + downloadURL state lives in the parent. */
    onPhotoUpload: (angle: keyof WeekPhotos, file: File) => Promise<void>;
    onPhotoRemove: (angle: keyof WeekPhotos) => void;
    uploadingAngle: string | null;
    onPhotoTap: (url: string) => void;
    /** Save current state as a draft (writes to Firestore, stays
     *  editable). Wizard calls this on every Continue tap so the
     *  client never loses progress by closing the tab mid-flow. */
    onSaveDraft: () => Promise<void>;
    /** Submit the whole week — locks it, sets needsReview = true,
     *  awards XP. */
    onSubmit: () => Promise<void>;
}

// Map of step number → translation-key suffix. Centralised so the
// progress indicator + step body + footer all read from the same
// source of truth.
const STEPS = [
    { id: 1, key: 'log',      icon: Target },
    { id: 2, key: 'felt',     icon: Zap },
    { id: 3, key: 'photos',   icon: Camera },
    { id: 4, key: 'reflect',  icon: Send },
] as const;

export function CheckInWizard(props: Props) {
    const { t, isRTL } = useLanguage();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // Coach panel default state: collapsed for pending (filling)
    // weeks so the coach reference doesn't fight for attention,
    // pre-expanded for reviewed weeks so the coach's feedback is
    // visible the moment the client opens their past week.
    const [coachOpen, setCoachOpen] = useState(props.weekStatus === 'reviewed');

    // When the parent loads a different week's data (entries reset),
    // start from step 1. Otherwise the wizard could land on Step 3
    // looking at a week the client hasn't started.
    useEffect(() => {
        setStep(1);
    }, [props.entries.length === 7 && props.entries.every(e => !e.weight && !e.carbs)]); // crude reset signal

    const goNext = async () => {
        // Auto-save the draft on every Continue tap (only in pending
        // mode — for read-only weeks there's nothing to save). Best-
        // effort: we catch errors silently. Failures surface on the
        // final Submit instead.
        if (!props.readOnly) {
            setSaving(true);
            try { await props.onSaveDraft(); } catch { /* best-effort */ }
            setSaving(false);
        }
        setStep(s => Math.min(s + 1, STEPS.length));
    };
    const goBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setSubmitting(true);
        try { await props.onSubmit(); } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6">

            {/* ── Coach reference pill ─────────────────────────────
                Sticky above the step body. Default: small horizontal
                row showing the active macros at a glance. Tap → the
                full targets + feedback expand inline. Always visible
                so clients never lose their brief while filling. */}
            <CoachReferencePill
                targets={props.targets}
                coachFeedback={props.coachFeedback}
                open={coachOpen}
                onToggle={() => setCoachOpen(v => !v)}
            />

            {/* ── Progress indicator ──────────────────────────────
                4 dots connected by a thin gold rail. Filled gold =
                completed, ringed gold = current, faint = upcoming.
                Above the dots: "Step 2 of 4 — How you felt". */}
            <div className="bg-surface-container-low rounded-2xl p-5 ghost-border">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface/55">
                        {t('checkInWizStepLabel')
                            ?.replace('{n}', String(step))
                            ?.replace('{total}', String(STEPS.length))
                            ?? `Step ${step} of ${STEPS.length}`}
                    </span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                        {t(`checkInWizStep${STEPS[step - 1].key}Title`)}
                    </span>
                </div>

                {/* Dot rail. The rail is a single horizontal line
                    behind the dots; we colour-clip it via a flex
                    width % equal to (completed steps) / (total - 1)
                    so it grows from left to right as the client
                    progresses. */}
                <div className="relative">
                    <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-on-surface/15" />
                    <div
                        className="absolute top-1/2 h-px -translate-y-1/2 bg-primary transition-all duration-500"
                        style={{
                            [isRTL ? 'right' : 'left']: 0,
                            width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
                        }}
                    />
                    <div className="relative flex items-center justify-between">
                        {STEPS.map(({ id, icon: Icon }) => {
                            const done = id < step;
                            const current = id === step;
                            return (
                                <div
                                    key={id}
                                    className={clsx(
                                        'relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all',
                                        done && 'bg-primary text-on-primary shadow-[0_4px_14px_rgba(230,195,100,0.35)]',
                                        current && 'bg-primary/20 text-primary border-2 border-primary',
                                        !done && !current && 'bg-surface-container text-on-surface/35 border border-outline-variant/30',
                                    )}
                                >
                                    {done ? <CheckCircle size={16} strokeWidth={2.4} /> : <Icon size={14} strokeWidth={2.4} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Status banner (read-only weeks only) ──────────
                When the client is reviewing a past week, every step
                shows a banner explaining the lock state so they
                always know "I can't edit this — it's already
                submitted/reviewed/locked". For pending weeks the
                banner is suppressed (no need to remind them they
                can edit). */}
            {props.readOnly && <ReadOnlyStatusBanner status={props.weekStatus} />}

            {/* ── Step body ────────────────────────────────────── */}
            <div className="bzt-rise-in" key={step} style={{ animationDuration: '320ms' }}>
                {step === 1 && <StepDailyLog
                    entries={props.entries}
                    setEntries={props.setEntries}
                    readOnly={props.readOnly}
                />}
                {step === 2 && <StepHowYouFelt
                    strength={props.strength}             setStrength={props.setStrength}
                    hunger={props.hunger}                 setHunger={props.setHunger}
                    energy={props.energy}                 setEnergy={props.setEnergy}
                    cardioCalories={props.cardioCalories} setCardioCalories={props.setCardioCalories}
                    readOnly={props.readOnly}
                />}
                {step === 3 && <StepPhotos
                    photos={props.photos}
                    onUpload={props.onPhotoUpload}
                    onRemove={props.onPhotoRemove}
                    uploadingAngle={props.uploadingAngle}
                    onTap={props.onPhotoTap}
                    readOnly={props.readOnly}
                />}
                {step === 4 && <StepReflectAndSubmit
                    summary={props.summary}
                    setSummary={props.setSummary}
                    entries={props.entries}
                    photos={props.photos}
                    strength={props.strength}
                    hunger={props.hunger}
                    energy={props.energy}
                    cardioCalories={props.cardioCalories}
                    onJumpToStep={setStep}
                    readOnly={props.readOnly}
                />}
            </div>

            {/* ── Footer action bar ────────────────────────────── */}
            <div className="sticky bottom-4 z-20 pt-2">
                <div className="bg-surface-container/95 backdrop-blur-md rounded-2xl p-4 ghost-border flex items-center gap-3">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={saving || submitting}
                            className="bzt-press flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-[12px] font-label font-bold uppercase tracking-widest hover:bg-surface-container-highest disabled:opacity-40 transition-all"
                        >
                            {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            {t('checkInWizBack')}
                        </button>
                    ) : <div />}

                    <div className="flex-1" />

                    {step < STEPS.length ? (
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={saving || submitting}
                            className="bzt-press flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary text-[12px] font-label font-bold uppercase tracking-widest shadow-[0_8px_22px_rgba(230,195,100,0.30)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
                        >
                            {saving
                                ? <Loader2 size={14} className="animate-spin" />
                                : <>{t('checkInWizContinue')} {isRTL ? <ChevronLeft size={14} /> : <ArrowRight size={14} />}</>}
                        </button>
                    ) : props.readOnly ? (
                        // Last step in read-only mode: no submit.
                        // Just a "Done" affordance that scrolls back
                        // to the top so the client can re-read or
                        // switch weeks via the picker above.
                        <button
                            type="button"
                            onClick={() => {
                                setStep(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bzt-press flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-high text-on-surface text-[12px] font-label font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all"
                        >
                            <CheckCircle size={14} /> {t('done')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bzt-press flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary text-[12px] font-label font-bold uppercase tracking-widest shadow-[0_8px_22px_rgba(230,195,100,0.32)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
                        >
                            {submitting
                                ? <Loader2 size={14} className="animate-spin" />
                                : <><Send size={14} /> {t('checkInWizSubmit')}</>}
                        </button>
                    )}
                </div>
                {/* Save-draft secondary action under the bar.
                    Shown only when editable AND not on the final
                    step (step 4's Submit already persists). */}
                {!props.readOnly && step < STEPS.length && (
                    <div className="flex justify-center pt-2">
                        <button
                            type="button"
                            onClick={async () => {
                                setSaving(true);
                                try { await props.onSaveDraft(); } finally { setSaving(false); }
                            }}
                            disabled={saving}
                            className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/45 hover:text-on-surface/80 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Save size={10} /> {t('checkInWizSaveDraft')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Coach reference pill — sticky context above the step body
// ─────────────────────────────────────────────────────────────────
function CoachReferencePill({
    targets, coachFeedback, open, onToggle,
}: {
    targets: MacroTargets;
    coachFeedback: string | null;
    open: boolean;
    onToggle: () => void;
}) {
    const { t } = useLanguage();
    const mode = targets.mode ?? 'cycling';
    const moderate = targets.moderateCarb ?? {
        carbs: Math.round((targets.highCarb.carbs + targets.lowCarb.carbs) / 2),
        protein: Math.round((targets.highCarb.protein + targets.lowCarb.protein) / 2),
        fats: Math.round((targets.highCarb.fats + targets.lowCarb.fats) / 2),
        calories: Math.round((targets.highCarb.calories + targets.lowCarb.calories) / 2),
    };

    return (
        <div className="bg-surface-container-low rounded-2xl ghost-border overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container/40 transition-colors"
            >
                <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Target size={14} />
                </span>
                <div className="flex-1 min-w-0 text-start">
                    <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/55">
                        {t('checkInWizCoachReferenceLabel')}
                    </div>
                    {mode === 'moderate' ? (
                        <div className="text-on-surface text-[13px] font-headline font-bold truncate" dir="ltr">
                            {moderate.calories} kcal · C {moderate.carbs} · P {moderate.protein} · F {moderate.fats}
                        </div>
                    ) : (
                        <div className="text-on-surface text-[12.5px] font-headline font-bold truncate" dir="ltr">
                            {t('checkInWizCarbCyclingShort')
                                ?.replace('{highKcal}', String(targets.highCarb.calories))
                                ?.replace('{lowKcal}', String(targets.lowCarb.calories))
                                ?? `High: ${targets.highCarb.calories} · Low: ${targets.lowCarb.calories}`}
                        </div>
                    )}
                </div>
                {(targets.cardio ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-label font-bold uppercase tracking-widest" dir="ltr">
                        <Flame size={10} /> {targets.cardio} kcal
                    </span>
                )}
                <ChevronRight
                    size={16}
                    className="text-on-surface/40 shrink-0 transition-transform"
                    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-outline-variant/15 bzt-rise-in" style={{ animationDuration: '180ms' }}>
                    {/* Full targets breakdown — same data the original
                        flat-page Targets panel rendered, just compacted
                        into a single panel that opens on demand. */}
                    {mode === 'cycling' && (
                        <div className="grid grid-cols-2 gap-3" dir="ltr">
                            <MacroBlock label={t('highCarbDay')} t={targets.highCarb} accent="primary" />
                            <MacroBlock label={t('lowCarbDay')}  t={targets.lowCarb}  accent="dim" />
                        </div>
                    )}
                    {mode === 'moderate' && (
                        <div dir="ltr">
                            <MacroBlock label={t('moderateCarbDay') ?? 'Moderate carb day'} t={moderate} accent="primary" />
                        </div>
                    )}

                    {coachFeedback && (
                        <div className="bg-surface-container rounded-xl p-4 border-l-2 border-primary/60">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={12} className="text-primary" />
                                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary">
                                    {t('coachFeedback')}
                                </span>
                                <Lightbulb size={12} className="text-primary/40 ms-auto" />
                            </div>
                            <p className="font-body text-on-surface/85 text-[13px] leading-relaxed italic">
                                "{coachFeedback}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MacroBlock({ label, t, accent }: { label: string; t: MacroTarget; accent: 'primary' | 'dim' }) {
    const accentText = accent === 'primary' ? 'text-primary' : 'text-on-surface/55';
    return (
        <div className="bg-surface-container-lowest rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-label font-bold uppercase tracking-widest ${accentText}`}>{label}</span>
                <span className={`text-[12px] font-headline font-bold ${accentText} tabular-nums`}>{t.calories}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
                {(['carbs', 'protein', 'fats'] as const).map(k => (
                    <div key={k} className="bg-surface-container-low rounded-md py-1">
                        <div className="text-[9px] font-label uppercase tracking-widest text-on-surface/40">{k[0].toUpperCase()}</div>
                        <div className="text-[12px] font-headline font-bold text-on-surface tabular-nums">{t[k]}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Step 1 — Daily log (the 7-day table)
// ─────────────────────────────────────────────────────────────────
function StepDailyLog({
    entries, setEntries, readOnly,
}: {
    entries: DayEntry[];
    setEntries: (next: DayEntry[]) => void;
    readOnly: boolean;
}) {
    const { t } = useLanguage();
    const handleEntryChange = (index: number, field: keyof DayEntry, value: number) => {
        if (readOnly) return;
        const next = [...entries];
        next[index] = { ...next[index], [field]: value };
        setEntries(next);
    };
    return (
        <div className="space-y-4">
            <StepHeader
                title={t('checkInWizStepLogTitle')}
                description={readOnly ? t('checkInWizStepLogHintReadOnly') : t('checkInWizStepLogHint')}
            />
            <div className="bg-surface-container-low rounded-2xl p-4 sm:p-6 ghost-border">
                <DailyTrackingTable entries={entries} readOnly={readOnly} onChange={handleEntryChange} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Step 2 — How you felt (4 sliders)
// ─────────────────────────────────────────────────────────────────
function StepHowYouFelt({
    strength, setStrength, hunger, setHunger,
    energy, setEnergy, cardioCalories, setCardioCalories, readOnly,
}: {
    strength: number; setStrength: (n: number) => void;
    hunger: number; setHunger: (n: number) => void;
    energy: number; setEnergy: (n: number) => void;
    cardioCalories: number; setCardioCalories: (n: number) => void;
    readOnly: boolean;
}) {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            <StepHeader
                title={t('checkInWizStepFeltTitle')}
                description={readOnly ? t('checkInWizStepFeltHintReadOnly') : t('checkInWizStepFeltHint')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SliderCard
                    label={t('strengthScale')}
                    icon={Shield}
                    value={strength}
                    onChange={setStrength}
                    min={0} max={10} step={1} suffix="/10"
                    minLabel={t('weak')} maxLabel={t('strong')}
                    readOnly={readOnly}
                />
                <SliderCard
                    label={t('hungerScale')}
                    value={hunger}
                    onChange={setHunger}
                    min={0} max={10} step={1} suffix="/10"
                    minLabel={t('noHunger')} maxLabel={t('starving')}
                    readOnly={readOnly}
                />
                <SliderCard
                    label={t('energyScale')}
                    icon={Zap}
                    value={energy}
                    onChange={setEnergy}
                    min={0} max={10} step={1} suffix="/10"
                    minLabel={t('noEnergy')} maxLabel={t('fullEnergy')}
                    readOnly={readOnly}
                />
                <SliderCard
                    label={t('cardioCalories')}
                    icon={Flame}
                    value={cardioCalories}
                    onChange={setCardioCalories}
                    min={0} max={2000} step={50} suffix=" kcal"
                    minLabel="0" maxLabel="2000"
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
}

function SliderCard({
    label, icon: Icon, value, onChange, min, max, step, suffix, minLabel, maxLabel, readOnly,
}: {
    label: string;
    icon?: LucideIcon;
    value: number;
    onChange: (n: number) => void;
    min: number; max: number; step: number; suffix: string;
    minLabel: string; maxLabel: string;
    readOnly: boolean;
}) {
    return (
        <div className="bg-surface-container-low rounded-2xl p-5 ghost-border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline font-bold text-on-surface text-sm flex items-center gap-2">
                    {Icon && <Icon size={14} className="text-primary" />}
                    {label}
                </h3>
                <span className="text-2xl font-headline font-extrabold text-primary tabular-nums" dir="ltr">
                    {value}<span className="text-xs text-on-surface/40 font-normal">{suffix}</span>
                </span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                disabled={readOnly}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-highest accent-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface/40 mt-2">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Step 3 — Progress photos
// ─────────────────────────────────────────────────────────────────
function StepPhotos({
    photos, onUpload, onRemove, uploadingAngle, onTap, readOnly,
}: {
    photos: WeekPhotos;
    onUpload: (angle: keyof WeekPhotos, file: File) => Promise<void>;
    onRemove: (angle: keyof WeekPhotos) => void;
    uploadingAngle: string | null;
    onTap: (url: string) => void;
    readOnly: boolean;
}) {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            <StepHeader
                title={t('checkInWizStepPhotosTitle')}
                description={readOnly ? t('checkInWizStepPhotosHintReadOnly') : t('checkInWizStepPhotosHint')}
            />
            <div className="bg-surface-container-low rounded-2xl p-5 ghost-border">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['front', 'side', 'back', 'face'] as const).map((angle) => (
                        <div key={angle} className="relative">
                            {photos[angle] ? (
                                <div className="relative group">
                                    <img
                                        src={photos[angle]}
                                        alt={angle}
                                        className="aspect-[3/4] w-full rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity ghost-border"
                                        onClick={() => onTap(photos[angle]!)}
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/80 backdrop-blur-sm text-[10px] font-label uppercase tracking-widest text-on-surface/60 capitalize">{angle}</div>
                                    {!readOnly && (
                                        <button
                                            onClick={() => onRemove(angle)}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-on-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ) : readOnly ? (
                                // Read-only empty slot: no upload affordance,
                                // just a faint "—" so the client knows they
                                // didn't upload this angle that week.
                                <div className="aspect-[3/4] rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/25 flex flex-col items-center justify-center gap-1 text-on-surface/25">
                                    <Camera size={20} />
                                    <span className="text-[10px] font-label uppercase tracking-widest capitalize">{angle}</span>
                                    <span className="text-[9px] font-body italic">{t('checkInWizPhotoNotUploaded')}</span>
                                </div>
                            ) : (
                                <label className="aspect-[3/4] rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/40 hover:border-primary/50 hover:text-primary flex flex-col items-center justify-center gap-2 text-on-surface/35 transition-all cursor-pointer">
                                    {uploadingAngle === angle ? (
                                        <Loader2 size={24} className="animate-spin text-primary" />
                                    ) : (
                                        <Camera size={24} />
                                    )}
                                    <span className="text-[10px] font-label uppercase tracking-widest capitalize">{angle}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onUpload(angle, file);
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                    ))}
                </div>
                {!readOnly && (
                    <p className="text-[11px] text-on-surface/45 font-body mt-4 leading-relaxed inline-flex items-start gap-2">
                        <Info size={11} className="text-on-surface/40 mt-0.5 shrink-0" />
                        {t('checkInWizPhotosOptionalHint')}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Step 4 — Reflect & submit
// ─────────────────────────────────────────────────────────────────
function StepReflectAndSubmit({
    summary, setSummary, entries, photos, strength, hunger, energy, cardioCalories, onJumpToStep, readOnly,
}: {
    summary: string; setSummary: (s: string) => void;
    entries: DayEntry[]; photos: WeekPhotos;
    strength: number; hunger: number; energy: number; cardioCalories: number;
    onJumpToStep: (n: number) => void;
    readOnly: boolean;
}) {
    const { t } = useLanguage();
    // Count filled days for the review summary so the client can see
    // at a glance "you logged 5 out of 7 days" before they submit.
    const loggedDays = entries.filter(e => e.weight || e.carbs || e.protein || e.fats).length;
    const photoCount = (['front', 'side', 'back', 'face'] as const).filter(a => photos[a]).length;

    return (
        <div className="space-y-4">
            <StepHeader
                title={readOnly ? t('checkInWizStepReflectTitleReadOnly') : t('checkInWizStepReflectTitle')}
                description={readOnly ? t('checkInWizStepReflectHintReadOnly') : t('checkInWizStepReflectHint')}
            />

            {/* Reflection textarea — primary content of this step */}
            <div className="bg-surface-container-low rounded-2xl p-5 ghost-border">
                <h3 className="font-headline font-bold text-on-surface text-sm mb-3">{t('weeklySummary')}</h3>
                {readOnly && !summary ? (
                    <p className="text-on-surface/40 text-[13px] font-body italic">
                        {t('checkInWizNoReflectionFiled')}
                    </p>
                ) : (
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        disabled={readOnly}
                        placeholder={t('weeklyReflectionPlaceholder')}
                        className="w-full h-32 bg-surface-container-lowest rounded-xl p-4 text-on-surface placeholder-on-surface/30 resize-none border-none outline-none focus:ring-1 focus:ring-primary/30 font-body text-sm transition-all disabled:opacity-80 disabled:cursor-default"
                    />
                )}
            </div>

            {/* Read-back summary — what the client filled.
                Tap any row to jump back to that step (even in
                read-only mode, jumping is useful — they can re-read
                a specific section). */}
            <div className="bg-surface-container-low rounded-2xl p-5 ghost-border space-y-2">
                <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55 mb-3">
                    {readOnly ? t('checkInWizReviewHeadingReadOnly') : t('checkInWizReviewHeading')}
                </h3>
                <ReviewRow
                    label={t('dailyEntries')}
                    value={t('checkInWizDaysLoggedValue')
                        ?.replace('{n}', String(loggedDays))
                        ?? `${loggedDays} / 7 days logged`}
                    onClick={() => onJumpToStep(1)}
                    readOnly={readOnly}
                />
                <ReviewRow
                    label={t('checkInWizSlidersLabel')}
                    value={`💪 ${strength}/10 · 🍽 ${hunger}/10 · ⚡ ${energy}/10 · 🔥 ${cardioCalories} kcal`}
                    onClick={() => onJumpToStep(2)}
                    readOnly={readOnly}
                />
                <ReviewRow
                    label={t('progressPhotos')}
                    value={t('checkInWizPhotosCountValue')
                        ?.replace('{n}', String(photoCount))
                        ?? `${photoCount} / 4 uploaded`}
                    onClick={() => onJumpToStep(3)}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
}

function ReviewRow({ label, value, onClick, readOnly }: { label: string; value: string; onClick: () => void; readOnly: boolean }) {
    const { t } = useLanguage();
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container/40 transition-colors text-start"
        >
            <div className="min-w-0">
                <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50">{label}</div>
                <div className="text-[13px] font-body text-on-surface truncate">{value}</div>
            </div>
            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 hover:text-primary shrink-0">
                {readOnly ? t('checkInWizReviewView') : t('checkInWizReviewEdit')}
            </span>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Read-only status banner — sits above the step body for any week
//  that's been submitted/reviewed/locked. Tells the client at a
//  glance "you can't edit this — here's why".
// ─────────────────────────────────────────────────────────────────
function ReadOnlyStatusBanner({ status }: { status: 'pending' | 'submitted' | 'reviewed' | 'locked' }) {
    const { t } = useLanguage();
    const config = status === 'reviewed'
        ? { bg: 'bg-emerald-500/8', border: 'border-emerald-500/25', text: 'text-emerald-400', icon: CheckCircle, msg: t('weekReviewedByCoachMsg') }
        : status === 'submitted'
            ? { bg: 'bg-primary/8', border: 'border-primary/20', text: 'text-primary', icon: CheckCircle, msg: t('weekSubmittedPending') }
            : { bg: 'bg-surface-container-low', border: 'border-outline-variant/30', text: 'text-on-surface/55', icon: Info, msg: t('weekCompletedLocked') };
    const Icon = config.icon;
    return (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${config.bg} border ${config.border} ${config.text}`}>
            <Icon size={18} className="shrink-0" />
            <p className="font-body text-[13px] leading-relaxed">{config.msg}</p>
        </div>
    );
}

// Shared step header — gold eyebrow + headline + hint
function StepHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="px-1">
            <h2 className="font-headline font-extrabold text-on-surface text-[22px] md:text-[26px] tracking-tight leading-tight mb-1.5">
                {title}
            </h2>
            <p className="font-body text-on-surface/55 text-[13.5px] leading-relaxed">
                {description}
            </p>
        </div>
    );
}
