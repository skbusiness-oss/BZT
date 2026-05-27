import { useState, useMemo, useRef, useEffect } from 'react';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSelfLogs, BodyMeasurements as Meas } from '../../hooks/useSelfLogs';
import { useWeeklyCheckIns } from '../../hooks/useWeeklyCheckIns';
import { levelFromScore, levelProgress } from '../../lib/activityScore';
import { CheckInCompare } from '../checkin/CheckInCompare';
import type { Week } from '../../types';
import { useNavigate } from 'react-router-dom';
import { CompletionCelebration } from '../shared/CompletionCelebration';

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

// ─── ProgressChart ──────────────────────────────────────────────────────
// Tabbed weekly chart. Founder direction: the previous "everything on one
// chart with two Y-axes + tooltip listing all five metrics" version was
// too noisy to read at a glance. Now there's a tab strip at the top
// (Weight / Strength / Hunger / Energy / Cardio) and the chart renders
// ONE metric at a time — clear axis, clear color, no overlap.
//
// Weight tab: filled area on a reversed weight axis (lower weight is
// visually higher, matches the psychology of "going down" toward goal),
// with Start and Goal reference lines.
// Other tabs: thin coloured line on the 0-10 axis (or 0-2000 for cardio).
//
// Stats panel below still shows weight progress (Start / Current / Goal /
// Progress %) regardless of tab — those are the user's primary objective
// and live in the same card so the chart context doesn't lose them.
function ProgressChart({ data, startWeight, goalWeight, lastSubmittedDate, nextAvailableAt }: {
    /** One row per date. Missing values are null so Recharts breaks the
     *  line instead of drawing a fake zero. Cardio is stored here as
     *  cardioCalories÷10 from the upstream merger; we re-multiply when
     *  the Cardio tab is selected so the y-axis reads in real calories. */
    data: {
        label: string;
        weight: number | null;
        strength: number | null;
        energy: number | null;
        hunger: number | null;
        cardio: number | null;
    }[];
    startWeight: number;
    goalWeight: number;
    lastSubmittedDate?: string | null;
    nextAvailableAt?: string | null;
}) {
    const { t: tx } = useLanguage();
    const todayKey = new Date().toISOString().slice(0, 10);
    const isLocked = !!nextAvailableAt && nextAvailableAt > todayKey;
    const fmtDate = (iso?: string | null) =>
        iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    const [range, setRange] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
    const ranges: ('1M' | '3M' | '6M' | '1Y')[] = ['1M', '3M', '6M', '1Y'];

    type Tab = 'weight' | 'strength' | 'hunger' | 'energy' | 'cardio';
    const [tab, setTab] = useState<Tab>('weight');

    const filtered = useMemo(() => {
        const counts: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
        return data.slice(-counts[range]);
    }, [data, range]);

    // "Current" = the most recent week with a weight reading. Fall back to
    // start so the stat block never reads "--" once they've onboarded.
    const lastWeightRow = [...filtered].reverse().find(r => typeof r.weight === 'number');
    const current = lastWeightRow?.weight ?? startWeight;
    const pct = (goalWeight > 0 && goalWeight !== startWeight && typeof current === 'number')
        ? Math.round(((startWeight - current) / (startWeight - goalWeight)) * 100)
        : 0;

    // Tab metadata — label key, color, y-axis configuration. The chart
    // renders a single one of these at a time based on `tab`. Strength /
    // hunger / energy share the 0-10 right-axis behaviour; weight uses a
    // reversed kg axis; cardio uses a 0-2000 calorie axis (un-scaled so
    // the number is meaningful at a glance, not divided by 10).
    const tabs: { key: Tab; label: string; color: string }[] = [
        { key: 'weight',   label: tx('chartTabWeight'),   color: t.primary },
        { key: 'strength', label: tx('chartTabStrength'), color: t.cyan },
        { key: 'hunger',   label: tx('chartTabHunger'),   color: t.coral },
        { key: 'energy',   label: tx('chartTabEnergy'),   color: t.gold },
        { key: 'cardio',   label: tx('chartTabCardio'),   color: t.violet },
    ];
    const activeTab = tabs.find(x => x.key === tab) ?? tabs[0];

    // Cardio data was stored at /10 scale upstream so it could share an
    // axis with the 0-10 sliders. On the dedicated cardio tab we want
    // real calories on the y-axis, so map it back here.
    const tabData = useMemo(() => {
        if (tab !== 'cardio') return filtered;
        return filtered.map(r => ({ ...r, cardio: r.cardio == null ? null : r.cardio * 10 }));
    }, [filtered, tab]);

    const renderChart = () => {
        if (filtered.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: 40, color: t.onSurfaceMuted, fontFamily: t.body, fontSize: 13 }}>
                    {tx('chartEmpty')}
                </div>
            );
        }
        // Weight tab — filled area on reversed kg axis with start + goal
        // reference lines.
        if (tab === 'weight') {
            return (
                <div style={{ width: '100%', height: 300 }} dir="ltr">
                    <ResponsiveContainer>
                        <ComposedChart data={tabData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
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
                            <Tooltip contentStyle={{ background: t.surfaceBright, border: `1px solid ${t.outline}`, borderRadius: 10, fontFamily: t.body, fontSize: 13, color: t.onSurface }} labelStyle={{ color: t.onSurfaceVariant, fontSize: 11 }} />
                            {startWeight > 0 && (
                                <ReferenceLine y={startWeight} stroke={t.onSurfaceMuted} strokeDasharray="3 6" strokeWidth={1.5}
                                    label={{ value: `${tx('chartRefStart')} ${startWeight}kg`, position: 'insideTopLeft', fontSize: 10, fontFamily: t.body, fill: t.onSurfaceVariant, fontWeight: 600 }} />
                            )}
                            {goalWeight > 0 && (
                                <ReferenceLine y={goalWeight} stroke={t.primary} strokeDasharray="3 6" strokeWidth={1.5}
                                    label={{ value: `${tx('chartRefGoal')} ${goalWeight}kg`, position: 'insideBottomLeft', fontSize: 10, fontFamily: t.body, fill: t.primary, fontWeight: 700 }} />
                            )}
                            <Area
                                type="monotone"
                                dataKey="weight"
                                name={tx('chartSeriesWeight')}
                                stroke="url(#bzWeightStrokeP)"
                                strokeWidth={2.5}
                                fill="url(#bzWeightFillP)"
                                connectNulls
                                dot={{ r: 4, fill: t.primary, stroke: t.surface, strokeWidth: 2 }}
                                activeDot={{ r: 7, fill: t.primary, stroke: t.surface, strokeWidth: 3 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );
        }
        // Subjective metric tab (strength / hunger / energy) — single line
        // on the 0-10 axis. Cardio uses a 0-2000 axis with the same line
        // chart shape so the visual reads consistently across non-weight
        // tabs.
        const isCardio = tab === 'cardio';
        const yDomain: [number, number] = isCardio ? [0, 2000] : [0, 10];
        const seriesName = isCardio ? tx('chartSeriesCardio') : activeTab.label;
        return (
            <div style={{ width: '100%', height: 300 }} dir="ltr">
                <ResponsiveContainer>
                    <ComposedChart data={tabData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                        <CartesianGrid stroke={t.outlineVariant} vertical={false} strokeDasharray="2 6" />
                        <XAxis dataKey="label" stroke={t.onSurfaceMuted} tick={{ fontFamily: t.body, fontSize: 11, fill: t.onSurfaceVariant }} tickLine={false} axisLine={false} />
                        <YAxis domain={yDomain} stroke={t.onSurfaceMuted} tick={{ fontFamily: t.body, fontSize: 11, fill: t.onSurfaceVariant }} tickLine={false} axisLine={false} width={isCardio ? 44 : 32} />
                        <Tooltip contentStyle={{ background: t.surfaceBright, border: `1px solid ${t.outline}`, borderRadius: 10, fontFamily: t.body, fontSize: 13, color: t.onSurface }} labelStyle={{ color: t.onSurfaceVariant, fontSize: 11 }} />
                        <Line
                            type="monotone"
                            dataKey={tab}
                            name={seriesName}
                            stroke={activeTab.color}
                            strokeWidth={2.5}
                            connectNulls
                            dot={{ r: 4, fill: activeTab.color, stroke: t.surface, strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: activeTab.color, stroke: t.surface, strokeWidth: 3 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <Card variant="glass">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                <div>
                    <Eyebrow>{tx('chartEyebrow')}</Eyebrow>
                    <h2 style={{ fontFamily: t.display, fontSize: 24, fontWeight: 400, color: t.onSurface, margin: '8px 0 0', letterSpacing: '-0.02em' }}>
                        {tx('chartHeader')}
                    </h2>
                </div>
                {/* Time-range pills (1M/3M/6M/1Y). Wrapped in dir="ltr" so
                    the order stays consistent regardless of language —
                    these tokens are universal abbreviations. */}
                <div style={{ display: 'flex', gap: 6 }} dir="ltr">
                    {ranges.map(r => <Chip key={r} active={range === r} onClick={() => setRange(r)}>{r}</Chip>)}
                </div>
            </div>

            {/* Metric tabs — one per signal. Founder direction: each
                signal gets its OWN chart, not all overlaid. Tapping a
                tab swaps the chart below to that metric only. Active
                tab gets the metric's brand color so the eye can map
                "this tab = that color" instantly. */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                marginBottom: 16,
            }}>
                {tabs.map(x => {
                    const active = tab === x.key;
                    return (
                        <button
                            key={x.key}
                            type="button"
                            onClick={() => setTab(x.key)}
                            style={{
                                padding: '8px 14px', borderRadius: 999,
                                fontFamily: t.body, fontSize: 12,
                                fontWeight: 600, letterSpacing: '0.04em',
                                cursor: 'pointer',
                                background: active ? `${x.color}1f` : t.surfaceContainerLow,
                                color: active ? x.color : t.onSurfaceVariant,
                                border: active
                                    ? `1.5px solid ${x.color}99`
                                    : `1px solid ${t.outlineVariant}`,
                                transition: 'all 0.15s ease',
                            }}
                            aria-pressed={active}
                        >
                            {x.label}
                        </button>
                    );
                })}
            </div>

            {/* Cadence pill — lives above the chart so it's the same
                "what week is this" anchor across every tab. */}
            {(isLocked || lastSubmittedDate) && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 20, padding: '10px 14px',
                    borderRadius: 999,
                    background: isLocked ? `${t.primary}15` : t.surfaceContainerLow,
                    border: `1px solid ${isLocked ? `${t.primary}55` : t.outline}`,
                    fontFamily: t.body, fontSize: 12,
                }}>
                    <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                        background: isLocked ? t.primary : t.onSurfaceMuted,
                    }} />
                    {isLocked ? (
                        <span style={{ color: t.onSurface }}>
                            {tx('chartLockedLabel')} · {tx('chartLastLogged')} <strong>{fmtDate(lastSubmittedDate)}</strong> · {tx('chartNextAvailable')} <strong style={{ color: t.primary }}>{fmtDate(nextAvailableAt)}</strong>
                        </span>
                    ) : (
                        <span style={{ color: t.onSurfaceVariant }}>
                            {tx('chartLastCheckIn')} <strong style={{ color: t.onSurface }}>{fmtDate(lastSubmittedDate)}</strong> · {tx('chartCanLog')}
                        </span>
                    )}
                </div>
            )}

            {renderChart()}

            {/* Stats: Start · Current · Goal · Progress. Always weight-
                centric because that's the user's primary objective; this
                doesn't change when the chart tab changes. */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginTop: 24, padding: '20px 24px', background: t.surfaceContainerLow, borderRadius: 14,
            }} className="weight-stat-grid">
                <StatBlock label={tx('statStart')}    value={`${startWeight || '--'} kg`} />
                <StatBlock label={tx('statCurrent')}  value={`${current || '--'} kg`} gold />
                <StatBlock label={tx('statGoal')}     value={`${goalWeight || '--'} kg`} />
                <StatBlock label={tx('statProgress')} value={`${pct}%`} />
            </div>
            <style>{`
                @media (min-width: 640px) {
                    .weight-stat-grid {
                        grid-template-columns: repeat(4, 1fr) !important;
                    }
                }
            `}</style>
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
    // Slider track stays LTR explicitly even in Arabic. 1→10 numeric
    // scales are universally read left-to-right (Apple Health, Strava,
    // and every other fitness app do this), and natively-RTL range
    // inputs were producing a confusing "thumb starts on the right but
    // value 1 is shown on the right too" mismatch. The label above
    // still flips correctly via flex's natural RTL behavior.
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500 }}>{label}</span>
                <span dir="ltr" style={{ fontFamily: t.display, fontSize: 16, fontWeight: 500, color: t.primary }}>
                    {value}<span style={{ color: t.onSurfaceMuted, fontWeight: 300 }}> / {max}</span>
                </span>
            </div>
            <div dir="ltr">
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
// Sliders feed the `metrics` payload that ProgressChart below renders
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
    const [error, setError] = useState<string | null>(null);

    // Sync internal form state with the existingLog prop whenever the parent
    // delivers a new log (after a successful submit, the parent's snapshot
    // listener fires → logs update → existingLog points at the freshly-
    // submitted entry). Without this effect the form keeps displaying the
    // typed-but-not-yet-committed values; the locked overlay shows correctly,
    // but the numeric fields would still read as the user typed them rather
    // than as Firestore stored them. Effect intentionally re-runs ONLY when
    // the doc identity changes (date), not on every metric tweak — that
    // would clobber the user's in-progress edits.
    useEffect(() => {
        if (!existingLog) return;
        setWeight(existingLog.weight?.toString() ?? '');
        setNotes(existingLog.notes ?? '');
        setStrength(existingLog.metrics?.strength ?? 7);
        setHunger(existingLog.metrics?.hunger ?? 4);
        setEnergy(existingLog.metrics?.energy ?? 8);
        setCardioCalories(existingLog.metrics?.cardioCalories?.toString() ?? '');
    }, [
        // Re-sync only when the doc identity / lock-state flips, not on
        // every keystroke-driven metrics object change.
        existingLog?.locked,
        existingLog?.weight,
    ]);
    const isLocked = existingLog?.locked === true || isWindowLocked === true;
    const cardioNum = cardioCalories === '' ? 0 : Number(cardioCalories);
    const cardioValid = Number.isFinite(cardioNum) && cardioNum >= 0 && cardioNum <= 2000;
    const valid = Number(weight) > 20 && Number(weight) < 350 && cardioValid;

    const handleSave = async () => {
        if (!valid || isLocked) return;
        setSaving(true);
        setError(null);
        try {
            await onSave({
                weight: Number(weight),
                notes,
                metrics: { strength, hunger, energy, cardioCalories: cardioNum },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            // Surface the raw Firestore error so we can triage what
            // actually failed. The "already locked" mask was hiding the
            // real cause when the bug wasn't the locked-doc rule.
            const code = (err as { code?: string })?.code ?? '(no code)';
            const raw = err instanceof Error ? err.message : 'Failed to save. Try again.';
            setError(`[${code}] ${raw}`);
            // eslint-disable-next-line no-console
            console.error('[WeeklyCheckIn] save failed:', code, err);
        } finally {
            setSaving(false);
        }
    };

    // Human-readable hint for why the button is disabled. The submit button
    // could be unclickable for three different reasons; previously the user
    // had no way to know which one applied. All three strings translated
    // via translation keys so Arabic users see Arabic hints.
    const disabledHint = (() => {
        if (isLocked) return null; // The "This week is logged" header already explains.
        if (weight === '') return tx('updHintEnterWeight');
        const w = Number(weight);
        if (!Number.isFinite(w) || w <= 20 || w >= 350) return tx('updHintWeightRange');
        if (!cardioValid) return tx('updHintCardioRange');
        return null;
    })();

    // Friendly date format for "Last submitted" / "Next available" strings.
    const fmt = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <Card variant="glass">
            <Eyebrow>{tx('weeklyCheckIn')}</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 22, fontWeight: 400, color: t.onSurface, margin: '8px 0 8px', letterSpacing: '-0.02em' }}>
                {isLocked ? tx('updWeeklyHeaderLocked') : tx('updWeeklyHeaderEditable')}
            </h2>
            {isLocked && (
                <div style={{
                    fontFamily: t.body, fontSize: 12, color: t.onSurfaceVariant,
                    marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                    {lastSubmittedDate && (
                        <span>{tx('updLastSubmitted')}: <strong style={{ color: t.onSurface }}>{fmt(lastSubmittedDate)}</strong></span>
                    )}
                    {nextAvailableAt && (
                        <span>{tx('updNextAvailable')}: <strong style={{ color: t.primary }}>{fmt(nextAvailableAt)}</strong></span>
                    )}
                </div>
            )}

            {/* Don't-forget banner — surfaces only in the editable
                (unlocked) state. Names the three fields that users
                report having submitted blank in a hurry: weight,
                cardio, and notes. The fields themselves get a soft
                gold left-border accent below so the eye lands on
                them in the same order the banner lists them. */}
            {!isLocked && (
                <div style={{
                    marginTop: 8, marginBottom: 20,
                    padding: '14px 16px',
                    background: `${t.primary}0d`,   // ~5% gold tint
                    border: `1px solid ${t.primary}33`,
                    borderRadius: 14,
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                    <span
                        aria-hidden
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: 10,
                            background: t.primary, color: t.onPrimaryFixed,
                            fontFamily: t.display, fontSize: 16, fontWeight: 700,
                            flexShrink: 0, lineHeight: 1,
                        }}
                    >
                        !
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: t.body, fontSize: 12, fontWeight: 700,
                            letterSpacing: '0.16em', textTransform: 'uppercase',
                            color: t.primary, marginBottom: 4,
                        }}>
                            {tx('updDontForgetTitle')}
                        </div>
                        <div style={{
                            fontFamily: t.body, fontSize: 13, lineHeight: 1.55,
                            color: t.onSurface,
                        }}>
                            {tx('updDontForgetBody')}
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                marginBottom: 16, marginTop: 16,
                // Soft gold left-rail when editable so the user's eye
                // lands on the three fields named in the banner above.
                paddingLeft: !isLocked ? 14 : 0,
                borderLeft: !isLocked ? `3px solid ${t.primary}` : 'none',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {tx('currentWeightLabel')}
                        {!isLocked && (
                            <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: t.primary, padding: '2px 6px', borderRadius: 999,
                                background: `${t.primary}1f`, lineHeight: 1.4,
                            }}>{tx('updRequiredPill')}</span>
                        )}
                    </span>
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
                ProgressChart below renders a trend across submitted weeks. */}
            <div style={{ marginBottom: 16 }}>
                <ProgressSlider label={tx('strength')} value={strength} onChange={setStrength} disabled={isLocked} />
                <ProgressSlider label={tx('hunger')}   value={hunger}   onChange={setHunger}   disabled={isLocked} />
                <ProgressSlider label={tx('energy')}   value={energy}   onChange={setEnergy}   disabled={isLocked} />
                <div style={{
                    // Same gold left-rail as the weight block when
                    // editable, so the cardio field reads as part of
                    // the "don't forget" cluster.
                    paddingLeft: !isLocked ? 14 : 0,
                    borderLeft: !isLocked ? `3px solid ${t.primary}` : 'none',
                    marginTop: 4,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {tx('cardioCaloriesLabel')}
                            {!isLocked && (
                                <span style={{
                                    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                    color: t.primary, padding: '2px 6px', borderRadius: 999,
                                    background: `${t.primary}1f`, lineHeight: 1.4,
                                }}>{tx('updDontForgetPill')}</span>
                            )}
                        </span>
                        <span style={{ fontFamily: t.body, fontSize: 11, color: t.onSurfaceMuted, letterSpacing: '0.08em' }}>{tx('updCardioRangeHint')}</span>
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

            <div style={{
                marginBottom: 24,
                paddingLeft: !isLocked ? 14 : 0,
                borderLeft: !isLocked ? `3px solid ${t.primary}` : 'none',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurface, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {tx('notesWord')}
                        {!isLocked && (
                            <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: t.primary, padding: '2px 6px', borderRadius: 999,
                                background: `${t.primary}1f`, lineHeight: 1.4,
                            }}>Don&apos;t forget</span>
                        )}
                    </span>
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
                        // Subtle gold border when editable, neutral when
                        // locked — same gold-rail signal as the inputs
                        // above, applied at the textarea level since the
                        // textarea has its own visible border anyway.
                        border: !isLocked
                            ? `1px solid ${t.primary}55`
                            : `1px solid ${t.outlineVariant}`,
                        outline: 'none', resize: 'vertical',
                    }}
                />
            </div>
            {/* Inline hints — explain why the button is unclickable, and
                surface backend errors so failures are never silent. */}
            {disabledHint && !isLocked && (
                <div style={{
                    fontFamily: t.body, fontSize: 12, color: t.onSurfaceVariant,
                    marginBottom: 12, padding: '8px 12px',
                    background: t.surfaceContainerLow, borderRadius: 10,
                    border: `1px solid ${t.outlineVariant}`,
                }}>
                    {disabledHint}
                </div>
            )}
            {error && (
                <div role="alert" style={{
                    fontFamily: t.body, fontSize: 12, color: t.coral,
                    marginBottom: 12, padding: '8px 12px',
                    background: `${t.coral}12`, borderRadius: 10,
                    border: `1px solid ${t.coral}55`,
                }}>
                    {error}
                </div>
            )}
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
                {isLocked ? tx('updBtnLocked') : saved ? tx('updBtnSavedOk') : saving ? tx('updBtnSaving') : tx('updBtnSubmitLockWeek')}
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
    const { t: tx } = useLanguage();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Meas>(current ?? {});
    const [saving, setSaving] = useState(false);

    const rows: { key: keyof Meas; label: string; goodDirection: 'up' | 'down' }[] = [
        { key: 'chest', label: tx('measChest'), goodDirection: 'down' },
        { key: 'waist', label: tx('measWaist'), goodDirection: 'down' },
        { key: 'hips',  label: tx('measHips'),  goodDirection: 'down' },
        { key: 'arms',  label: tx('measArms'),  goodDirection: 'up' },
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
            <Eyebrow>{tx('measEyebrow')}</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 20, fontWeight: 400, color: t.onSurface, margin: '8px 0 24px', letterSpacing: '-0.02em' }}>
                {tx('measHeader')}
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
                {editing ? (saving ? tx('updBtnSaving') : tx('measBtnSave')) : tx('measBtnUpdate')}
            </button>
        </Card>
    );
}

function PhotoGallery({ photos }: { photos: { weekNumber: number; front?: string; side?: string; back?: string }[] }) {
    const { t: tx } = useLanguage();
    if (photos.length === 0) return null;
    const recent = photos.slice(-4).reverse();
    return (
        <Card>
            <Eyebrow>{tx('progressPhotos')}</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 20, fontWeight: 400, color: t.onSurface, margin: '8px 0 20px', letterSpacing: '-0.02em' }}>
                {tx('photosHeader')}
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
    const { weighIns, metrics: metricDocs, submit: submitWeeklyCheckIn } = useWeeklyCheckIns();
    const { t: t_ } = useLanguage(); // `t_` because `t` is already the BZT token map above
    const navigate = useNavigate();

    const sortedByDate = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);

    // ProgressChart consumes a single merged dataset — one row per date,
    // each row has weight + every metric. Missing fields are `null` so
    // Recharts breaks the line cleanly instead of plotting a zero.
    // Sources, in priority order: new `weighIns` / `metrics` collections
    // (canonical), then legacy `selfLogs` entries (historical fallback).
    const progressHistory = useMemo(() => {
        type Row = {
            label: string;
            weight: number | null;
            strength: number | null;
            energy: number | null;
            hunger: number | null;
            cardio: number | null;
        };
        const byDate = new Map<string, Row>();
        const ensure = (date: string): Row => {
            const existing = byDate.get(date);
            if (existing) return existing;
            const row: Row = {
                label: date.slice(5),
                weight: null, strength: null, energy: null, hunger: null, cardio: null,
            };
            byDate.set(date, row);
            return row;
        };
        // Legacy selfLogs — lowest priority, fills in dates that pre-date
        // the new collections.
        for (const l of sortedByDate) {
            if (typeof l.weight === 'number') ensure(l.date).weight = l.weight;
            const m = l.metrics;
            if (m) {
                const row = ensure(l.date);
                if (typeof m.strength === 'number') row.strength = m.strength;
                if (typeof m.energy === 'number') row.energy = m.energy;
                if (typeof m.hunger === 'number') row.hunger = m.hunger;
                if (typeof m.cardioCalories === 'number') row.cardio = Math.round(m.cardioCalories / 10);
            }
        }
        // weighIns — canonical for weight, overwrites legacy on conflict.
        for (const w of weighIns) {
            if (typeof w.weight === 'number') ensure(w.date).weight = w.weight;
        }
        // metrics — canonical for the 1–10 metrics + cardio.
        for (const m of metricDocs) {
            const row = ensure(m.date);
            if (typeof m.strength === 'number') row.strength = m.strength;
            if (typeof m.energy === 'number') row.energy = m.energy;
            if (typeof m.hunger === 'number') row.hunger = m.hunger;
            if (typeof m.cardioCalories === 'number') row.cardio = Math.round(m.cardioCalories / 10);
        }
        return Array.from(byDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, row]) => row);
    }, [sortedByDate, weighIns, metricDocs]);

    // Weight-only view still needed for chart "Start" inference + dashboard
    // backwards compatibility. Derive from progressHistory so there's one
    // source of truth.
    const weightHistory = useMemo(
        () => progressHistory
            .filter(r => typeof r.weight === 'number')
            .map(r => ({ label: r.label, weight: r.weight as number })),
        [progressHistory]
    );

    // Start weight is FIXED: read `users/{uid}.startWeightKg` (set once at
    // baseline-form submit, never overwritten). For older accounts that
    // pre-date this field, fall back to the first logged weight, then to
    // the onboarding `currentWeightKg` value. The one-shot migration below
    // will heal these on next render.
    const startWeight = user?.startWeightKg ?? weightHistory[0]?.weight ?? user?.currentWeightKg ?? 0;
    const goalWeight = user?.targetWeightKg ?? 0;

    // One-shot migration: existing accounts have `currentWeightKg` (the
    // onboarding number) but no `startWeightKg`. Copy it once so subsequent
    // check-ins can safely overwrite `currentWeightKg` without losing the
    // anchor. Idempotent: re-runs are no-ops because the condition fails.
    useEffect(() => {
        if (!user?.id) return;
        if (user.startWeightKg !== undefined) return;
        if (typeof user.currentWeightKg !== 'number') return;
        updateDoc(doc(db, 'users', user.id), {
            startWeightKg: user.currentWeightKg,
            updatedAt: serverTimestamp(),
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[ProgressPanel] startWeightKg migration failed:', err);
        });
    }, [user?.id, user?.startWeightKg, user?.currentWeightKg]);

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

    // Lock window is driven by the new `weighIns` collection first
    // (canonical), then by any locked legacy `selfLogs` row as a safety net
    // for accounts mid-migration. Server-side: Firestore rules on both
    // `weighIns` and `selfLogs` block update/delete when `locked == true`,
    // so this is purely UX — the form mirrors what the rule will accept.
    const sortedWeighIns = useMemo(
        () => [...weighIns].sort((a, b) => b.date.localeCompare(a.date)),
        [weighIns]
    );
    const legacyWeeklyLogs = useMemo(
        () => sortedByDate
            .filter(l => l.period === 'weekly' || l.locked === true)
            .sort((a, b) => b.date.localeCompare(a.date)),
        [sortedByDate]
    );
    const lastWeighIn = sortedWeighIns[0];
    const lastLegacyWeekly = legacyWeeklyLogs[0];
    // Most recent submission across both collections.
    const lastSubmittedDate = (() => {
        const a = lastWeighIn?.date;
        const b = lastLegacyWeekly?.date;
        if (!a) return b ?? null;
        if (!b) return a;
        return a > b ? a : b;
    })();

    // Next available = lastSubmittedDate + 7 days. If no prior log, available now.
    const nextAvailableAt = useMemo(() => {
        if (!lastSubmittedDate) return null;
        const d = new Date(lastSubmittedDate);
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    }, [lastSubmittedDate]);

    // Today's docs across both collections. If either is locked, the form
    // must be locked too — otherwise the user could click submit and hit
    // the server's `locked != true` rule rejection.
    const todaysWeighIn = useMemo(
        () => sortedWeighIns.find(w => w.date === todayKey),
        [sortedWeighIns, todayKey]
    );
    const todaysLegacy = useMemo(
        () => sortedByDate.find(l => l.date === todayKey),
        [sortedByDate, todayKey]
    );
    const isWeeklyLocked = (!!nextAvailableAt && nextAvailableAt > todayKey)
        || todaysWeighIn?.locked === true
        || todaysLegacy?.locked === true;

    // Full-screen celebration takeover after a successful weekly
    // check-in submit. Founder direction: bring back the "Day 3
    // Complete!"-style screen for THIS moment too — a small banner
    // doesn't hit the same dopamine note. Shared component lives
    // in components/shared/CompletionCelebration.
    const [congrats, setCongrats] = useState(false);

    const handleWeeklyCheckIn = async (p: {
        weight: number; notes: string;
        metrics: { strength: number; hunger: number; energy: number; cardioCalories: number };
    }) => {
        // OPTIMISTIC: fire the celebration the instant the user taps
        // Submit. The atomic batch write below typically takes 600-
        // 1800ms on mobile, which felt sluggish when we waited for
        // it before showing the celebration. If the write throws we
        // hide the celebration AND re-raise so the WeeklyCheckIn
        // child's own error banner surfaces the failure.
        setCongrats(true);
        try {
            await submitWeeklyCheckIn({
                weight: p.weight,
                strength: p.metrics.strength,
                hunger: p.metrics.hunger,
                energy: p.metrics.energy,
                cardioCalories: p.metrics.cardioCalories,
                notes: p.notes || undefined,
            });
        } catch (err) {
            setCongrats(false);
            throw err;
        }
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
            {/* Full-screen celebration takeover when the user has just
                submitted a weekly check-in. Replaces the entire
                ProgressPanel content while shown. Matches the
                "Day X Complete!" pattern from WorkoutDayView so all
                three submission moments (workout day, weekly metrics,
                coaching check-in) share the same celebration tone. */}
            {congrats ? (
                <CompletionCelebration
                    title={`🎉 ${t_('progressLogCongratsTitle')}`}
                    subtitle={t_('progressLogCongratsBody')}
                    ctaLabel={t_('celebrationBackToDashboard')}
                    onCta={() => { setCongrats(false); navigate('/'); }}
                    onDismiss={() => setCongrats(false)}
                    dismissLabel={t_('celebrationReviewProgress')}
                />
            ) : (
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
                    {isCommunity && (() => {
                        // Build today's existingLog by merging the two new
                        // collections + the legacy selfLogs row. The form
                        // uses this to pre-populate fields and to render the
                        // locked overlay. None of the three are guaranteed
                        // to exist — handle each independently.
                        const todaysMetric = metricDocs.find(m => m.date === todayKey);
                        const existingLog = (todaysWeighIn || todaysMetric || todaysLegacy) ? {
                            weight: todaysWeighIn?.weight ?? todaysLegacy?.weight,
                            notes: todaysMetric?.notes ?? todaysLegacy?.notes,
                            locked: (todaysWeighIn?.locked ?? todaysMetric?.locked ?? todaysLegacy?.locked) === true,
                            metrics: todaysMetric
                                ? {
                                    strength: todaysMetric.strength,
                                    hunger: todaysMetric.hunger,
                                    energy: todaysMetric.energy,
                                    cardioCalories: todaysMetric.cardioCalories,
                                }
                                : todaysLegacy?.metrics,
                        } : undefined;
                        return (
                            <WeeklyCheckIn
                                existingLog={existingLog}
                                isWindowLocked={isWeeklyLocked}
                                lastSubmittedDate={lastSubmittedDate}
                                nextAvailableAt={nextAvailableAt}
                                onSave={handleWeeklyCheckIn}
                            />
                        );
                    })()}
                    <BodyMeasurementsCard current={latestMeas} baseline={baselineMeas} onUpdate={handleMeasUpdate} />
                </div>

                {/* Single unified chart — weight (left axis) + the four
                    weekly metric lines (right axis 1–10) in one ComposedChart.
                    The previous design split these into two cards; founder
                    direction is to track everything in one view. */}
                <ProgressChart
                    data={progressHistory}
                    startWeight={startWeight}
                    goalWeight={goalWeight}
                    lastSubmittedDate={lastSubmittedDate}
                    nextAvailableAt={nextAvailableAt}
                />

                {/* Photos (coaching clients only) */}
                <PhotoGallery photos={weekPhotos} />

                {/* Week comparison (coaching clients only) — collapsed by default
                    so the profile doesn't render the heavy compare UI on every load. */}
                {clientWeeks.length >= 2 && (
                    <CompareToggle weeks={clientWeeks} />
                )}
            </div>
            )}
        </>
    );
};
