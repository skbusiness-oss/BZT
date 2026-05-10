import { useState, useMemo, useRef } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSelfLogs, BodyMeasurements as Meas } from '../../hooks/useSelfLogs';
import { levelFromScore, levelProgress } from '../../lib/activityScore';
import { CheckInCompare } from '../checkin/CheckInCompare';
import type { Week } from '../../types';

const t = {
    surface: 'rgb(var(--surface))',
    surfaceContainerLow: 'rgb(var(--surface-container-low))',
    surfaceContainer: 'rgb(var(--surface-container))',
    surfaceContainerHighest: 'rgb(var(--surface-container-highest))',
    surfaceBright: 'rgb(var(--surface-bright))',
    primary: 'rgb(var(--primary))',
    primaryContainer: 'rgb(var(--primary-container))',
    onPrimaryFixed: 'rgb(var(--on-primary))',
    onSurface: 'rgb(var(--on-surface))',
    onSurfaceVariant: 'rgb(var(--on-surface-variant))',
    onSurfaceMuted: 'rgb(var(--outline))',
    outline: 'rgb(var(--primary) / 0.15)',
    outlineVariant: 'rgb(var(--outline-variant) / 0.4)',
    gold: 'rgb(var(--primary))',
    cyan: '#7fc8d8',
    coral: '#e89b7a',
    violet: '#b39ddb',
    display: '"Manrope", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
};
const goldGradient = `linear-gradient(135deg, ${t.primary} 0%, ${t.primaryContainer} 100%)`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const weekStartISO = () => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
};

function Card({ children, variant = 'default', style = {} }: {
    children: React.ReactNode; variant?: 'default' | 'glass' | 'bright'; style?: React.CSSProperties;
}) {
    const variants: Record<string, React.CSSProperties> = {
        default: { background: t.surfaceContainer, border: 'none' },
        glass: {
            background: `${t.surfaceContainerHighest}99`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
        },
        bright: { background: t.surfaceBright, border: `1px solid ${t.outline}` },
    };
    return <div style={{ borderRadius: 20, padding: '2rem', ...variants[variant], ...style }}>{children}</div>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontFamily: t.body, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: t.onSurfaceVariant,
        }}>{children}</div>
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                fontFamily: t.body, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '7px 14px', borderRadius: 999, border: 'none',
                background: active ? goldGradient : t.surfaceContainerHighest,
                color: active ? t.onPrimaryFixed : t.onSurfaceVariant,
                cursor: 'pointer', transition: 'all 0.2s ease',
            }}
        >{children}</button>
    );
}

function StatBlock({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
    return (
        <div>
            <Eyebrow>{label}</Eyebrow>
            <div style={{
                fontFamily: t.display, fontSize: 22, fontWeight: 400,
                color: gold ? t.primary : t.onSurface, marginTop: 6, letterSpacing: '-0.01em',
            }}>{value}</div>
        </div>
    );
}

// (Removed: MetricCard helper. The 3-up Streak / Level / Logs grid was
// replaced by a single switchable StatusCarousel below.)

// ─── StatusCarousel ─────────────────────────────────────────────────────
// Single switchable card replacing the 3 stacked Streak / Level / Logs metric
// cards. Two interactions:
//   - Tap dots / arrows to flip between slides.
//   - Touch swipe (horizontal) on mobile.
// No auto-rotate — the user said "switch between," meaning a deliberate flip.
// Auto-rotation also tends to fight reading on a metric, so we stay still.
function StatusCarousel({ slides }: {
    slides: { label: string; value: string | number; unit?: string; sub?: string }[];
}) {
    const [idx, setIdx] = useState(0);
    // Track direction so the entrance animation matches the user's intent —
    // arrow-right / swipe-left = new slide enters from the right.
    const [dir, setDir] = useState<1 | -1>(1);
    const touchStartX = useRef<number | null>(null);

    const go = (n: number) => {
        const next = (n + slides.length) % slides.length;
        setDir(next > idx || (idx === slides.length - 1 && next === 0) ? 1 : -1);
        setIdx(next);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
        touchStartX.current = null;
    };
    const enterClass = dir === 1 ? 'bzt-slide-in-right' : 'bzt-slide-in-left';

    const slide = slides[idx];
    return (
        <Card variant="glass" style={{ overflow: 'hidden', position: 'relative' }}>
            <div
                tabIndex={0}
                role="region"
                aria-roledescription="carousel"
                aria-label={slide.label}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(idx - 1); }
                    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, outline: 'none' }}
            >
                <button
                    onClick={() => go(idx - 1)}
                    aria-label="Previous"
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: `1px solid ${t.outline}`, background: 'transparent',
                        color: t.onSurfaceVariant, cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = t.primary; e.currentTarget.style.borderColor = t.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = t.onSurfaceVariant; e.currentTarget.style.borderColor = t.outline; }}
                >‹</button>

                <div style={{ flex: 1, textAlign: 'center', minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Eyebrow>{slide.label}</Eyebrow>
                    <div
                        key={`${idx}-row`}
                        className={enterClass}
                        style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}
                    >
                        <span style={{
                            fontFamily: t.display, fontSize: 56, fontWeight: 300,
                            lineHeight: 1, letterSpacing: '-0.03em',
                            color: t.primary,
                        }}>{slide.value}</span>
                        {slide.unit && <span style={{ fontFamily: t.body, fontSize: 14, color: t.onSurfaceVariant }}>{slide.unit}</span>}
                    </div>
                    {slide.sub && (
                        <div
                            key={`${idx}-sub`}
                            className={enterClass}
                            style={{
                                marginTop: 12, fontFamily: t.body, fontSize: 12,
                                color: t.onSurfaceVariant,
                                animationDelay: '40ms',
                            }}
                        >{slide.sub}</div>
                    )}
                </div>

                <button
                    onClick={() => go(idx + 1)}
                    aria-label="Next"
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: `1px solid ${t.outline}`, background: 'transparent',
                        color: t.onSurfaceVariant, cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = t.primary; e.currentTarget.style.borderColor = t.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = t.onSurfaceVariant; e.currentTarget.style.borderColor = t.outline; }}
                >›</button>
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        aria-label={`Slide ${i + 1}`}
                        style={{
                            width: i === idx ? 24 : 6, height: 6, borderRadius: 999,
                            border: 'none', cursor: 'pointer',
                            background: i === idx ? goldGradient : t.surfaceContainerHighest,
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    />
                ))}
            </div>
        </Card>
    );
}

function WeightChart({ data, startWeight, goalWeight }: {
    data: { label: string; weight: number }[]; startWeight: number; goalWeight: number;
}) {
    const [range, setRange] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
    const ranges: ('1M' | '3M' | '6M' | '1Y')[] = ['1M', '3M', '6M', '1Y'];
    const filtered = useMemo(() => {
        const counts: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
        return data.slice(-counts[range]);
    }, [data, range]);
    const current = filtered.length ? filtered[filtered.length - 1].weight : startWeight;
    const pct = (goalWeight > 0 && goalWeight !== startWeight)
        ? Math.round(((startWeight - current) / (startWeight - goalWeight)) * 100)
        : 0;
    return (
        <Card variant="glass">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <div>
                    <Eyebrow>Weight Progress</Eyebrow>
                    <h2 style={{ fontFamily: t.display, fontSize: 24, fontWeight: 400, color: t.onSurface, margin: '8px 0 0', letterSpacing: '-0.02em' }}>
                        The descent, charted.
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {ranges.map(r => <Chip key={r} active={range === r} onClick={() => setRange(r)}>{r}</Chip>)}
                </div>
            </div>
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: t.onSurfaceMuted, fontFamily: t.body, fontSize: 13 }}>
                    Log a weight to see the chart.
                </div>
            ) : (
                <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer>
                        <AreaChart data={filtered} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="bzWeightStrokeP" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={t.primary} />
                                    <stop offset="100%" stopColor={t.primaryContainer} />
                                </linearGradient>
                                <linearGradient id="bzWeightFillP" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={t.primary} stopOpacity={0.28} />
                                    <stop offset="100%" stopColor={t.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={t.outlineVariant} vertical={false} strokeDasharray="2 6" />
                            <XAxis dataKey="label" stroke={t.onSurfaceMuted} tick={{ fontFamily: t.body, fontSize: 11, fill: t.onSurfaceVariant }} tickLine={false} axisLine={false} />
                            <YAxis reversed domain={['dataMin - 1', 'dataMax + 1']} stroke={t.onSurfaceMuted} tick={{ fontFamily: t.body, fontSize: 11, fill: t.onSurfaceVariant }} tickLine={false} axisLine={false} width={40} />
                            <Tooltip contentStyle={{ background: t.surfaceBright, border: `1px solid ${t.outline}`, borderRadius: 10, fontFamily: t.body, fontSize: 13, color: t.onSurface }} itemStyle={{ color: t.primary }} labelStyle={{ color: t.onSurfaceVariant, fontSize: 11 }} />
                            <Area type="monotone" dataKey="weight" stroke="url(#bzWeightStrokeP)" strokeWidth={2.5} fill="url(#bzWeightFillP)" dot={{ r: 4, fill: t.primary, stroke: t.surface, strokeWidth: 2 }} activeDot={{ r: 7, fill: t.primary, stroke: t.surface, strokeWidth: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                marginTop: 24, padding: '20px 24px', background: t.surfaceContainerLow, borderRadius: 14,
            }}>
                <StatBlock label="Start" value={`${startWeight || '--'} kg`} />
                <StatBlock label="Goal" value={`${goalWeight || '--'} kg`} />
                <StatBlock label="Progress" value={`${pct}%`} gold />
            </div>
        </Card>
    );
}

function MetricsChart({ data }: { data: { date: string; strength: number; energy: number; hunger: number; cardio: number }[] }) {
    const [range, setRange] = useState<'1W' | '2W' | '1M'>('2W');
    const ranges: ('1W' | '2W' | '1M')[] = ['1W', '2W', '1M'];
    const filtered = useMemo(() => {
        const counts: Record<string, number> = { '1W': 7, '2W': 14, '1M': 30 };
        return data.slice(-counts[range]);
    }, [data, range]);
    const series = [
        { key: 'strength', label: 'Strength', color: t.cyan },
        { key: 'energy', label: 'Energy', color: t.gold },
        { key: 'hunger', label: 'Hunger', color: t.coral },
        { key: 'cardio', label: 'Cardio (cal ÷ 10)', color: t.violet },
    ];
    return (
        <Card variant="glass">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <div>
                    <Eyebrow>Daily Metrics</Eyebrow>
                    <h2 style={{ fontFamily: t.display, fontSize: 24, fontWeight: 400, color: t.onSurface, margin: '8px 0 0', letterSpacing: '-0.02em' }}>
                        Signal from your body.
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {ranges.map(r => <Chip key={r} active={range === r} onClick={() => setRange(r)}>{r}</Chip>)}
                </div>
            </div>
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: t.onSurfaceMuted, fontFamily: t.body, fontSize: 13 }}>
                    Save a check-in to see metrics.
                </div>
            ) : (
                <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                        <LineChart data={filtered} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid stroke={t.outlineVariant} vertical={false} strokeDasharray="2 6" />
                            <XAxis dataKey="date" stroke={t.onSurfaceMuted} tick={{ fontFamily: t.body, fontSize: 10, fill: t.onSurfaceVariant }} tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 10]} stroke={t.onSurfaceMuted} tick={{ fontFamily: t.body, fontSize: 11, fill: t.onSurfaceVariant }} tickLine={false} axisLine={false} width={30} />
                            <Tooltip contentStyle={{ background: t.surfaceBright, border: `1px solid ${t.outline}`, borderRadius: 10, fontFamily: t.body, fontSize: 13 }} itemStyle={{ color: t.onSurface }} labelStyle={{ color: t.onSurfaceVariant, fontSize: 11 }} />
                            {series.map(s => (
                                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
                {series.map(s => (
                    <div key={s.key} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                        borderRadius: 999, background: t.surfaceContainerHighest,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                        <span style={{ fontFamily: t.body, fontSize: 12, color: t.onSurface, letterSpacing: '0.01em' }}>{s.label}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// 1–10 slider used by the community weekly check-in for subjective metrics
// (strength / hunger / energy). Renders a thin gold-filled track with a
// numeric "value / max" readout to the right of the label.
function ProgressSlider({ label, value, onChange, max = 10, disabled }: {
    label: string; value: number; onChange: (v: number) => void; max?: number; disabled?: boolean;
}) {
    const pct = ((value - 1) / (max - 1)) * 100;
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500, color: t.primary }}>
                    {value}<span style={{ color: t.onSurfaceMuted, fontWeight: 300 }}> / {max}</span>
                </span>
            </div>
            <input
                type="range" min={1} max={max} value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className="progress-panel-slider"
                style={{
                    width: '100%',
                    background: `linear-gradient(to right, ${t.primary} 0%, ${t.primaryContainer} ${pct}%, ${t.surfaceContainerHighest} ${pct}%, ${t.surfaceContainerHighest} 100%)`,
                    opacity: disabled ? 0.5 : 1,
                }}
            />
        </div>
    );
}

// ─── WeeklyCheckIn — community members only ─────────────────────────────────
// Captures one row per submission: weight + subjective metrics (strength /
// hunger / energy on a 1–10 scale, cardio calories) + optional notes. Once
// submitted, the log is server-side locked (Firestore rule blocks update/
// delete on resource.data.locked == true). Next entry opens 7 full days
// after the last submission (rolling window — NOT Monday-reset).
//
// Sliders feed `metrics` on the SelfLog so the MetricsChart below renders
// a trend over time. Founder direction: keep these on the WEEKLY card for
// community — not a separate daily flow.
//
// Two lock signals:
//   - `existingLog.locked` — today's entry already exists and is server-locked.
//   - `isWindowLocked` — last submission was less than 7 days ago, render
//     a status card showing "Last submitted X · Next available Y".
function WeeklyCheckIn({ existingLog, isWindowLocked, lastSubmittedDate, nextAvailableAt, onSave }: {
    existingLog?: {
        weight?: number; notes?: string; locked?: boolean;
        metrics?: { strength?: number; hunger?: number; energy?: number; cardioCalories?: number };
    };
    isWindowLocked?: boolean;
    lastSubmittedDate?: string | null;
    nextAvailableAt?: string | null;
    onSave: (p: {
        weight: number; notes: string;
        metrics: { strength: number; hunger: number; energy: number; cardioCalories: number };
    }) => Promise<void>;
}) {
    const { t: tx } = useLanguage();
    const [weight, setWeight] = useState<string>(existingLog?.weight?.toString() ?? '');
    const [notes, setNotes] = useState<string>(existingLog?.notes ?? '');
    const [strength, setStrength] = useState<number>(existingLog?.metrics?.strength ?? 7);
    const [hunger, setHunger] = useState<number>(existingLog?.metrics?.hunger ?? 4);
    const [energy, setEnergy] = useState<number>(existingLog?.metrics?.energy ?? 8);
    const [cardioCalories, setCardioCalories] = useState<string>(
        existingLog?.metrics?.cardioCalories?.toString() ?? ''
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const isLocked = existingLog?.locked === true || isWindowLocked === true;
    const cardioNum = cardioCalories === '' ? 0 : Number(cardioCalories);
    const cardioValid = Number.isFinite(cardioNum) && cardioNum >= 0 && cardioNum <= 2000;
    const valid = Number(weight) > 20 && Number(weight) < 350 && cardioValid;

    const handleSave = async () => {
        if (!valid || isLocked) return;
        setSaving(true);
        try {
            await onSave({
                weight: Number(weight),
                notes,
                metrics: { strength, hunger, energy, cardioCalories: cardioNum },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    // Friendly date format for "Last submitted" / "Next available" strings.
    const fmt = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <Card variant="glass">
            <Eyebrow>Weekly check-in</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 22, fontWeight: 400, color: t.onSurface, margin: '8px 0 8px', letterSpacing: '-0.02em' }}>
                {isLocked ? 'This week is logged.' : 'Update your weight and progress once per week.'}
            </h2>
            {isLocked && (
                <div style={{
                    fontFamily: t.body, fontSize: 12, color: t.onSurfaceVariant,
                    marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                    {lastSubmittedDate && (
                        <span>Last submitted: <strong style={{ color: t.onSurface }}>{fmt(lastSubmittedDate)}</strong></span>
                    )}
                    {nextAvailableAt && (
                        <span>Next available: <strong style={{ color: t.primary }}>{fmt(nextAvailableAt)}</strong></span>
                    )}
                </div>
            )}
            <div style={{ marginBottom: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500 }}>{tx('currentWeightLabel')}</span>
                    <span style={{ fontFamily: t.body, fontSize: 11, color: t.onSurfaceMuted, letterSpacing: '0.08em' }}>kg</span>
                </div>
                <input
                    type="number" inputMode="decimal" step="0.1"
                    value={weight} disabled={isLocked}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="80.0"
                    style={{
                        width: '100%', padding: '12px 0',
                        fontFamily: t.display, fontSize: 24, fontWeight: 400,
                        color: isLocked ? t.onSurfaceMuted : t.onSurface,
                        background: 'transparent', border: 'none',
                        borderBottom: `2px solid ${t.outlineVariant}`,
                        outline: 'none',
                    }}
                />
            </div>

            {/* Subjective sliders + cardio — feed `metrics` on the log so the
                MetricsChart below renders a trend across submitted weeks. */}
            <div style={{ marginBottom: 16 }}>
                <ProgressSlider label="Strength" value={strength} onChange={setStrength} disabled={isLocked} />
                <ProgressSlider label="Hunger"   value={hunger}   onChange={setHunger}   disabled={isLocked} />
                <ProgressSlider label="Energy"   value={energy}   onChange={setEnergy}   disabled={isLocked} />
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500 }}>{tx('cardioCaloriesLabel')}</span>
                        <span style={{ fontFamily: t.body, fontSize: 11, color: t.onSurfaceMuted, letterSpacing: '0.08em' }}>0–2000 / week</span>
                    </div>
                    <input
                        type="number" inputMode="numeric" min={0} max={2000}
                        value={cardioCalories} disabled={isLocked}
                        onChange={(e) => setCardioCalories(e.target.value)}
                        placeholder="0"
                        style={{
                            width: '100%', padding: '10px 0',
                            fontFamily: t.display, fontSize: 18, fontWeight: 400,
                            color: isLocked ? t.onSurfaceMuted : t.onSurface,
                            background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${t.outlineVariant}`,
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500 }}>{tx('notesWord')}</span>
                    <span style={{ fontFamily: t.body, fontSize: 11, color: t.onSurfaceMuted, letterSpacing: '0.08em' }}>{tx('notesOptional')}</span>
                </div>
                <textarea
                    value={notes} disabled={isLocked} rows={3}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={tx('howDidThisWeekGo')}
                    style={{
                        width: '100%', padding: '10px 12px',
                        fontFamily: t.body, fontSize: 13, color: t.onSurface,
                        background: t.surfaceContainerLow, borderRadius: 12,
                        border: `1px solid ${t.outlineVariant}`,
                        outline: 'none', resize: 'vertical',
                    }}
                />
            </div>
            <button
                onClick={handleSave}
                disabled={saving || !valid || isLocked}
                style={{
                    width: '100%', padding: 14,
                    fontFamily: t.body, fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: t.onPrimaryFixed, background: isLocked ? t.surfaceContainerHighest : goldGradient,
                    border: 'none', borderRadius: 999,
                    cursor: (isLocked || !valid) ? 'not-allowed' : (saving ? 'wait' : 'pointer'),
                    opacity: (isLocked || !valid) ? 0.4 : 1,
                    transition: 'all 0.2s ease',
                }}
            >
                {isLocked ? 'Locked' : saved ? '✓ Saved' : saving ? 'Saving…' : 'Submit & lock week'}
            </button>
        </Card>
    );
}

// (Removed: DailyCheckIn card. The strength/hunger/energy/cardio sliders are
// now exclusively part of the coaching weekly check-in flow at /checkin —
// they don't belong on the profile surface.)

function BodyMeasurementsCard({ current, baseline, onUpdate }: {
    current?: Meas; baseline?: Meas; onUpdate: (m: Meas) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Meas>(current ?? {});
    const [saving, setSaving] = useState(false);

    const rows: { key: keyof Meas; label: string; goodDirection: 'up' | 'down' }[] = [
        { key: 'chest', label: 'Chest', goodDirection: 'down' },
        { key: 'waist', label: 'Waist', goodDirection: 'down' },
        { key: 'hips', label: 'Hips', goodDirection: 'down' },
        { key: 'arms', label: 'Arms', goodDirection: 'up' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(draft);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <Eyebrow>Body Measurements</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 20, fontWeight: 400, color: t.onSurface, margin: '8px 0 24px', letterSpacing: '-0.02em' }}>
                Beyond the scale.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map(r => {
                    const c = current?.[r.key];
                    const b = baseline?.[r.key];
                    const delta = (c !== undefined && b !== undefined) ? c - b : null;
                    const isGood = delta !== null && (
                        (r.goodDirection === 'down' && delta < 0) ||
                        (r.goodDirection === 'up' && delta > 0)
                    );
                    const color = delta === null || delta === 0
                        ? t.onSurfaceMuted
                        : (isGood ? t.primary : t.coral);
                    const arrow = delta === null ? '–' : (delta === 0 ? '–' : (delta > 0 ? '↑' : '↓'));
                    return (
                        <div key={r.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', background: t.surfaceContainerLow, borderRadius: 12,
                        }}>
                            <span style={{ fontFamily: t.body, fontSize: 14, fontWeight: 500, color: t.onSurface }}>{r.label}</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                {editing ? (
                                    <input
                                        type="number" step="0.1" value={draft[r.key] ?? ''}
                                        onChange={e => {
                                            const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                            setDraft(prev => {
                                                const next = { ...prev };
                                                if (v === undefined || Number.isNaN(v)) delete next[r.key];
                                                else next[r.key] = v;
                                                return next;
                                            });
                                        }}
                                        style={{
                                            width: 72, padding: '5px 8px',
                                            background: t.surfaceContainerHighest,
                                            border: `1px solid ${t.outline}`, borderRadius: 8,
                                            color: t.onSurface, fontFamily: t.body, fontSize: 14, textAlign: 'right',
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontFamily: t.display, fontSize: 20, fontWeight: 400, color: t.onSurface, letterSpacing: '-0.01em' }}>
                                        {c ?? '--'}
                                        <span style={{ fontSize: 11, color: t.onSurfaceMuted, fontFamily: t.body, marginLeft: 4 }}>cm</span>
                                    </span>
                                )}
                                {!editing && delta !== null && (
                                    <span style={{ fontFamily: t.body, fontSize: 12, fontWeight: 600, color, minWidth: 48, textAlign: 'right' }}>
                                        {arrow} {Math.abs(delta).toFixed(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                style={{
                    marginTop: 20, width: '100%', padding: 11,
                    fontFamily: t.body, fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: t.primary, background: 'transparent',
                    border: `1px solid ${t.outline}`, borderRadius: 999,
                    cursor: 'pointer', transition: 'border-color 0.2s ease',
                }}
            >
                {editing ? (saving ? 'Saving…' : 'Save measurements') : 'Update measurements'}
            </button>
        </Card>
    );
}

function PhotoGallery({ photos }: { photos: { weekNumber: number; front?: string; side?: string; back?: string }[] }) {
    if (photos.length === 0) return null;
    const recent = photos.slice(-4).reverse();
    return (
        <Card>
            <Eyebrow>Progress Photos</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 20, fontWeight: 400, color: t.onSurface, margin: '8px 0 20px', letterSpacing: '-0.02em' }}>
                The visible record.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {recent.map(p => (
                    <div key={p.weekNumber} style={{
                        background: t.surfaceContainerLow, borderRadius: 12,
                        border: `1px solid ${t.outlineVariant}`, overflow: 'hidden',
                    }}>
                        <div style={{ padding: '8px 12px', fontFamily: t.body, fontSize: 11, fontWeight: 600, color: t.onSurfaceVariant, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Week {p.weekNumber}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                            {(['front', 'side', 'back'] as const).map(angle => (
                                <div key={angle} style={{
                                    aspectRatio: '1 / 1', background: t.surfaceContainerHighest,
                                    backgroundImage: p[angle] ? `url(${p[angle]})` : undefined,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: t.body, fontSize: 9, color: t.onSurfaceMuted, letterSpacing: '0.08em', textTransform: 'uppercase',
                                }}>
                                    {!p[angle] && angle.charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// CompareToggle — keeps the heavy CheckInCompare UI out of the initial render.
// Click to expand; click again to collapse. Saves vertical space + reduces
// the chart/photo work on every profile mount.
function CompareToggle({ weeks }: { weeks: Week[] }) {
    const [open, setOpen] = useState(false);
    const { t: tx } = useLanguage();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="bzt-press"
                style={{
                    width: '100%', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: t.body, fontSize: 13, fontWeight: 600,
                    color: t.onSurface, background: t.surfaceContainerLow,
                    border: `1px solid ${open ? t.primary : t.outline}`, borderRadius: 14, cursor: 'pointer',
                    transition: 'border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = t.primary; }}
                onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = t.outline; }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: t.body, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.onSurfaceVariant }}>
                        {tx('compareCheckIns')}
                    </span>
                </span>
                <span style={{
                    fontFamily: t.body, fontSize: 18, color: t.primary,
                    transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>＋</span>
            </button>
            {open && (
                <div className="bzt-rise-in">
                    <CheckInCompare weeks={weeks} />
                </div>
            )}
        </div>
    );
}

export const ProgressPanel = () => {
    const { user } = useAuth();
    const { clients, getClientWeeks } = useData();
    const { logs, addLog } = useSelfLogs();
    const { t: t_ } = useLanguage(); // `t_` because `t` is already the BZT token map above

    const sortedByDate = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);

    const weightHistory = useMemo(
        () => sortedByDate
            .filter(l => typeof l.weight === 'number')
            .map(l => ({ label: l.date.slice(5), weight: l.weight as number })),
        [sortedByDate]
    );

    const metricsHistory = useMemo(
        () => sortedByDate
            .filter(l => l.metrics && (l.metrics.strength || l.metrics.energy || l.metrics.hunger || l.metrics.cardioCalories))
            .map(l => ({
                date: l.date.slice(5),
                strength: l.metrics?.strength ?? 0,
                energy: l.metrics?.energy ?? 0,
                hunger: l.metrics?.hunger ?? 0,
                cardio: Math.round((l.metrics?.cardioCalories ?? 0) / 10),
            })),
        [sortedByDate]
    );

    // Real values: prefer the user's own baseline + target.
    // Falls back to first weekly log for start, and "no goal" for target if unset.
    const startWeight = user?.currentWeightKg ?? weightHistory[0]?.weight ?? 0;
    const goalWeight = user?.targetWeightKg ?? 0;

    const latestMeas = useMemo(() => [...sortedByDate].reverse().find(l => l.measurements)?.measurements, [sortedByDate]);
    const baselineMeas = useMemo(() => sortedByDate.find(l => l.measurements)?.measurements, [sortedByDate]);

    // Real activity score + streak from the user doc
    const xp = user?.activityScore ?? 0;
    const level = levelFromScore(xp);
    const xpPct = levelProgress(xp);
    const currentStreak = user?.streak?.current ?? 0;
    const bestStreak = user?.streak?.best ?? 0;

    const client = clients.find(c => c.userId === user?.id);
    const clientWeeks = useMemo(
        () => client ? getClientWeeks(client.id) : [],
        [client, getClientWeeks]
    );
    const weekPhotos = useMemo(
        () => clientWeeks
            .filter(w => w.photos && (w.photos.front || w.photos.side || w.photos.back))
            .map(w => ({
                weekNumber: w.weekNumber,
                front: w.photos?.front,
                side: w.photos?.side,
                back: w.photos?.back,
            })),
        [clientWeeks]
    );

    const handleMeasUpdate = async (m: Meas) => {
        await addLog({ date: todayISO(), measurements: m });
    };

    // Community weekly check-in: rolling 7-day window from the last submission,
    // NOT Monday-reset. User submits → row becomes locked → next available 7
    // full days after submittedAt. Doc id = the actual submission date so each
    // entry maps cleanly to one calendar day.
    //
    // Locking is server-enforced via firestore.rules (resource.data.locked == true
    // blocks update + delete). The "available again at" gate below is purely a UX
    // hint — submitting before nextAvailableAt would still succeed in Firestore;
    // we just don't render the form.
    const isCommunity = user?.role === 'community';
    const todayKey = todayISO();
    const weeklyLogs = useMemo(
        () => sortedByDate.filter(l => l.period === 'weekly').sort((a, b) => b.date.localeCompare(a.date)),
        [sortedByDate]
    );
    const lastWeeklyLog = weeklyLogs[0];
    const lastSubmittedDate = lastWeeklyLog?.date ?? null;

    // Next available = lastSubmittedDate + 7 days. If no prior log, available now.
    const nextAvailableAt = useMemo(() => {
        if (!lastSubmittedDate) return null;
        const d = new Date(lastSubmittedDate);
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    }, [lastSubmittedDate]);

    const isWeeklyLocked = !!nextAvailableAt && nextAvailableAt > todayKey;
    const todaysWeeklyLog = lastWeeklyLog && lastWeeklyLog.date === todayKey ? lastWeeklyLog : undefined;

    const handleWeeklyCheckIn = async (p: {
        weight: number; notes: string;
        metrics: { strength: number; hunger: number; energy: number; cardioCalories: number };
    }) => {
        // Persist with today's date as the doc id. Each weekly entry is its own
        // document — no overwrite of prior weeks. `weekStart` is kept for charts
        // that group by week boundary. `metrics` powers the MetricsChart trend.
        await addLog({
            date: todayKey,
            weight: p.weight,
            notes: p.notes || undefined,
            metrics: p.metrics,
            period: 'weekly',
            weekStart: weekStartISO(),
            locked: true,
        });
    };

    return (
        <>
            <style>{`
                input.progress-panel-slider {
                    -webkit-appearance: none; appearance: none;
                    height: 4px; border-radius: 999px; outline: none; cursor: pointer;
                }
                input.progress-panel-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 18px; height: 18px; border-radius: 50%;
                    background: ${goldGradient}; border: 2px solid ${t.surface};
                    box-shadow: 0 2px 8px rgba(230, 195, 100, 0.4);
                    cursor: pointer; transition: transform 0.15s ease;
                }
                input.progress-panel-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
                input.progress-panel-slider::-moz-range-thumb {
                    width: 18px; height: 18px; border-radius: 50%;
                    background: ${t.primary}; border: 2px solid ${t.surface};
                    box-shadow: 0 2px 8px rgba(230, 195, 100, 0.4); cursor: pointer;
                }
                @media (max-width: 980px) {
                    .progress-panel-two-col { grid-template-columns: 1fr !important; }
                }
                @keyframes bzt-fade-in {
                    from { opacity: 0; transform: translateY(4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div style={{ fontFamily: t.body, color: t.onSurface, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Single switchable card — replaces the prior 3 stacked metric tiles.
                    Slides through Streak / Level / Logs. Tap arrows, dots, or swipe. */}
                <StatusCarousel
                    slides={[
                        { label: t_('currentStreakLabel'), value: currentStreak, unit: t_('daysUnit'), sub: `${t_('bestPrefix')} ${bestStreak} ${t_('daysUnit')}` },
                        { label: t_('levelLabel'),         value: level,                          sub: `${xp} ${t_('xpUnit')} · ${xpPct}% ${t_('xpToNext')}` },
                        { label: t_('logsLabel'),          value: logs.length,                    sub: t_('allTimeLabel') },
                    ]}
                />

                {/* Check-in + measurements.
                    Community: weekly check-in card (weight + notes, server-locked).
                    Client: daily strength/hunger/energy sliders are NOT shown here —
                    that flow lives in /checkin (their existing weekly coaching path).
                    Only the body-measurements card remains for clients on profile. */}
                <div className="progress-panel-two-col" style={{
                    display: 'grid', gap: 24,
                    gridTemplateColumns: isCommunity ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
                }}>
                    {isCommunity && (
                        <WeeklyCheckIn
                            existingLog={todaysWeeklyLog ? {
                                weight: todaysWeeklyLog.weight,
                                notes: todaysWeeklyLog.notes,
                                locked: todaysWeeklyLog.locked,
                                metrics: todaysWeeklyLog.metrics,
                            } : undefined}
                            isWindowLocked={isWeeklyLocked}
                            lastSubmittedDate={lastSubmittedDate}
                            nextAvailableAt={nextAvailableAt}
                            onSave={handleWeeklyCheckIn}
                        />
                    )}
                    <BodyMeasurementsCard current={latestMeas} baseline={baselineMeas} onUpdate={handleMeasUpdate} />
                </div>

                {/* Weight chart */}
                <WeightChart data={weightHistory} startWeight={startWeight} goalWeight={goalWeight} />

                {/* Metrics chart */}
                {metricsHistory.length > 0 && <MetricsChart data={metricsHistory} />}

                {/* Photos (coaching clients only) */}
                <PhotoGallery photos={weekPhotos} />

                {/* Week comparison (coaching clients only) — collapsed by default
                    so the profile doesn't render the heavy compare UI on every load. */}
                {clientWeeks.length >= 2 && (
                    <CompareToggle weeks={clientWeeks} />
                )}
            </div>
        </>
    );
};
