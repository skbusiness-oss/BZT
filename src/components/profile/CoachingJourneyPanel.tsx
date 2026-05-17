/**
 * CoachingJourneyPanel — Profile tab content for coaching clients.
 *
 * Replaces the generic ProgressPanel for users on a coaching program.
 * Where ProgressPanel is utility-shaped (charts + measurement entry),
 * this panel is *narrative* — built around the things only coaching
 * clients have:
 *
 *   1. A baseline week-0 photo and a finite N-week program.
 *   2. Weekly check-ins with photos + weight + coach feedback.
 *   3. A real human coach who writes back.
 *
 * Layout (top-to-bottom):
 *   • Hero — week N of M, baseline → current photo split, total Δkg
 *   • Identity strip — category · fitness level · start month · length
 *   • Letter from your coach — most recent reviewed feedback, framed
 *   • Transformation reel — horizontal scroll of weeks with photo + Δ
 *   • The Numbers — 4-up (weeks active · Δkg · check-ins · streak)
 *
 * Empty states are explicit rather than blank: "Your transformation
 * starts here" vs an empty card; "Your coach hasn't written yet" vs a
 * silent absence. A new client at Week 0 still sees a meaningful page.
 */
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { levelFromScore } from '../../lib/activityScore';
import type { Week, DayEntry } from '../../types';
import { Sparkles, ArrowRight, Calendar, Camera, MessageCircle, TrendingDown, TrendingUp } from 'lucide-react';

// ─── Theme tokens (read CSS vars so they flip with the theme) ──────────
const t = {
    surface: 'rgb(var(--surface))',
    surfaceContainer: 'rgb(var(--surface-container))',
    surfaceContainerLow: 'rgb(var(--surface-container-low))',
    surfaceContainerLowest: 'rgb(var(--surface-container-lowest))',
    surfaceContainerHigh: 'rgb(var(--surface-container-high))',
    primary: 'rgb(var(--primary))',
    primaryContainer: 'rgb(var(--primary-container))',
    onPrimary: 'rgb(var(--on-primary))',
    onSurface: 'rgb(var(--on-surface))',
    onSurfaceVariant: 'rgb(var(--on-surface-variant))',
    outline: 'rgb(var(--primary) / 0.18)',
    outlineVariant: 'rgb(var(--outline-variant) / 0.30)',
    display: '"Manrope", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
};

// ─── Helpers ────────────────────────────────────────────────────────────
function lastWeightOfWeek(week: Week | undefined): number | null {
    if (!week) return null;
    const entries: DayEntry[] = week.dailyEntries ?? [];
    for (let i = entries.length - 1; i >= 0; i--) {
        const w = entries[i]?.weight;
        if (typeof w === 'number' && w > 0) return w;
    }
    return null;
}

function frontPhotoOfWeek(week: Week | undefined): string | undefined {
    if (!week?.photos) return undefined;
    return week.photos.front ?? week.photos.side ?? week.photos.back ?? week.photos.face;
}

function startMonth(iso: string | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// ─── Panel ──────────────────────────────────────────────────────────────
export const CoachingJourneyPanel = () => {
    const { user } = useAuth();
    const { clients, getClientWeeks } = useData();
    const { t: tx, lang } = useLanguage();

    const client = clients.find(c => c.userId === user?.id);
    const weeks = useMemo<Week[]>(
        () => (client ? getClientWeeks(client.id) : []).sort((a, b) => a.weekNumber - b.weekNumber),
        [client, getClientWeeks],
    );

    // Baseline = week 0 (intake) when present, otherwise the earliest week.
    const baselineWeek = useMemo<Week | undefined>(() => weeks.find(w => w.weekNumber === 0) ?? weeks[0], [weeks]);
    // Reviewed weeks = the user's history — the only ones with coach feedback.
    const reviewedWeeks = useMemo(() => weeks.filter(w => w.status === 'reviewed' || w.status === 'locked'), [weeks]);
    // Latest reviewed week powers the "Letter from your coach" card.
    const latestReviewed = reviewedWeeks[reviewedWeeks.length - 1];

    const currentWeekNum = client?.currentWeek ?? 0;
    const programLength = client?.programLength ?? 0;

    const baselineWeight = lastWeightOfWeek(baselineWeek);
    const currentWeight =
        lastWeightOfWeek(reviewedWeeks[reviewedWeeks.length - 1]) ??
        lastWeightOfWeek(weeks[weeks.length - 1]) ??
        baselineWeight;
    const totalDelta =
        baselineWeight != null && currentWeight != null ? currentWeight - baselineWeight : null;

    const baselinePhoto = frontPhotoOfWeek(baselineWeek);
    const currentPhoto = frontPhotoOfWeek(reviewedWeeks[reviewedWeeks.length - 1] ?? weeks[weeks.length - 1]);

    const checkInsReviewed = reviewedWeeks.length;
    const weeksActive = new Set(reviewedWeeks.map(w => w.weekNumber)).size;
    const xp = user?.activityScore ?? 0;
    const level = levelFromScore(xp);
    const currentStreak = user?.streak?.current ?? 0;

    // Identity strip values
    const startedAt = startMonth(client?.intakeData?.submittedAt);
    const fitnessLevelKey = client?.fitnessLevel === 'pro_competitions' ? 'proCompetitions' : (client?.fitnessLevel ?? '');
    const categoryKey = client?.category ?? '';

    if (!client) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontFamily: t.body, color: t.onSurface }}>
            {/* ── Hero ───────────────────────────────────────────────── */}
            <Hero
                weekNumber={currentWeekNum}
                programLength={programLength}
                checkInsReviewed={checkInsReviewed}
                baselinePhoto={baselinePhoto}
                currentPhoto={currentPhoto}
                baselineWeight={baselineWeight}
                currentWeight={currentWeight}
                totalDelta={totalDelta}
                tx={tx}
            />

            {/* ── Identity strip ────────────────────────────────────── */}
            <IdentityStrip
                category={categoryKey}
                fitnessLevelKey={fitnessLevelKey}
                startedAt={startedAt}
                programLength={programLength}
                tx={tx}
            />

            {/* ── Letter from your coach ────────────────────────────── */}
            <CoachLetter latest={latestReviewed} tx={tx} lang={lang} />

            {/* ── Transformation reel ───────────────────────────────── */}
            <TransformationReel weeks={weeks} reviewedWeeks={reviewedWeeks} baselineWeight={baselineWeight} tx={tx} />

            {/* ── The Numbers ───────────────────────────────────────── */}
            <NumbersGrid
                weeksActive={weeksActive}
                checkInsReviewed={checkInsReviewed}
                totalDelta={totalDelta}
                level={level}
                streak={currentStreak}
                tx={tx}
            />
        </div>
    );
};

// ─── Hero ───────────────────────────────────────────────────────────────
function Hero({
    weekNumber, programLength, checkInsReviewed,
    baselinePhoto, currentPhoto,
    baselineWeight, currentWeight, totalDelta,
    tx,
}: {
    weekNumber: number; programLength: number; checkInsReviewed: number;
    baselinePhoto?: string; currentPhoto?: string;
    baselineWeight: number | null; currentWeight: number | null; totalDelta: number | null;
    tx: (k: string) => string;
}) {
    const losing = totalDelta != null && totalDelta < 0;
    const gaining = totalDelta != null && totalDelta > 0;
    const deltaColor = losing ? '#7fc8d8' /* cyan */ : gaining ? '#e89b7a' /* coral */ : t.primary;
    const DeltaIcon = losing ? TrendingDown : TrendingUp;

    return (
        <section
            className="bzt-rise-in"
            style={{
                position: 'relative', borderRadius: 24, overflow: 'hidden',
                border: `1px solid ${t.outline}`,
            }}
        >
            {/* Staircase-to-light photo backdrop — week-by-week climb. */}
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/coaching-journey.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.92) 100%)',
            }} />
            <div className="bzt-halo-drift" aria-hidden style={{
                position: 'absolute', top: -60, right: -40, width: 220, height: 220,
                borderRadius: '50%', background: `radial-gradient(circle, rgb(var(--primary) / 0.20), transparent 70%)`,
                pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', padding: '28px 28px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Sparkles size={14} style={{ color: '#e6c364' }} />
                    <span style={{
                        fontFamily: t.body, fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.22em', textTransform: 'uppercase', color: '#e6c364',
                    }}>
                        {tx('myJourneyEyebrow')}
                    </span>
                </div>
                <h2 style={{
                    fontFamily: t.display, fontWeight: 800,
                    fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                    letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 10px',
                    color: '#fff', textShadow: '0 2px 14px rgba(0,0,0,0.55)',
                }}>
                    {programLength > 0
                        ? `${tx('weekLabel')} ${weekNumber} ${tx('ofLabel')} ${programLength}`
                        : tx('myJourneyEyebrow')}
                </h2>
                <p style={{
                    fontFamily: t.body, fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.6,
                }}>
                    {checkInsReviewed > 0
                        ? `${checkInsReviewed} ${checkInsReviewed === 1 ? tx('checkInReviewedSingular') : tx('checkInReviewedPlural')}`
                        : tx('journeyEmptyHint')}
                </p>
            </div>

            {/* Photo split */}
            <div style={{ position: 'relative', padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center' }}>
                    <PhotoTile
                        photo={baselinePhoto}
                        eyebrow={tx('baselineLabel')}
                        weight={baselineWeight}
                    />
                    <ArrowRight size={20} style={{ color: t.primary, opacity: 0.6 }} />
                    <PhotoTile
                        photo={currentPhoto}
                        eyebrow={tx('nowLabel')}
                        weight={currentWeight}
                    />
                </div>
                {totalDelta != null && (
                    <div style={{
                        alignSelf: 'center',
                        display: 'inline-flex', alignItems: 'baseline', gap: 8,
                        padding: '10px 18px', borderRadius: 999,
                        background: `${deltaColor}26`,
                        border: `1px solid ${deltaColor}66`,
                        backdropFilter: 'blur(8px)',
                    }}>
                        <DeltaIcon size={16} style={{ color: deltaColor, transform: 'translateY(2px)' }} />
                        <span style={{
                            fontFamily: t.display, fontSize: 22, fontWeight: 800,
                            color: '#fff', letterSpacing: '-0.02em', lineHeight: 1,
                            textShadow: `0 1px 6px ${deltaColor}88`,
                        }}>
                            {totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(1)}<span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4 }}>kg</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                            {tx('totalLabel')}
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}

function PhotoTile({ photo, eyebrow, weight }: { photo?: string; eyebrow: string; weight: number | null }) {
    // PhotoTile is rendered inside the Hero section, which now has a dark
    // photo backdrop. Text colors are tuned for that dark surface.
    return (
        <div>
            <div
                style={{
                    aspectRatio: '3 / 4', borderRadius: 16, overflow: 'hidden',
                    background: photo
                        ? `url(${photo}) center/cover no-repeat`
                        : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    position: 'relative',
                }}
            >
                {!photo && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: 8, color: 'rgba(255,255,255,0.55)',
                    }}>
                        <Camera size={22} />
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                            {eyebrow}
                        </span>
                    </div>
                )}
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e6c364' }}>
                    {eyebrow}
                </span>
                <span style={{ fontFamily: t.display, fontSize: 16, fontWeight: 700, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                    {weight != null ? `${weight.toFixed(1)} kg` : '—'}
                </span>
            </div>
        </div>
    );
}

// ─── Identity strip ─────────────────────────────────────────────────────
function IdentityStrip({
    category, fitnessLevelKey, startedAt, programLength, tx,
}: {
    category: string; fitnessLevelKey: string; startedAt: string | null; programLength: number;
    tx: (k: string) => string;
}) {
    const items: { icon: React.ReactNode; label: string }[] = [];
    if (category)         items.push({ icon: <Sparkles size={12} />,  label: tx(category) });
    if (fitnessLevelKey)  items.push({ icon: <ArrowRight size={12} />, label: tx(fitnessLevelKey) });
    if (startedAt)        items.push({ icon: <Calendar size={12} />,  label: `${tx('startedLabel')} ${startedAt}` });
    if (programLength)    items.push({ icon: <Calendar size={12} />,  label: `${programLength} ${tx('weeksUnit')}` });

    if (items.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((item, i) => (
                <span
                    key={i}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 999,
                        background: t.surfaceContainerLow,
                        border: `1px solid ${t.outlineVariant}`,
                        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                        color: t.onSurfaceVariant, textTransform: 'capitalize',
                    }}
                >
                    <span style={{ color: t.primary, display: 'inline-flex' }}>{item.icon}</span>
                    {item.label}
                </span>
            ))}
        </div>
    );
}

// ─── Letter from your coach ─────────────────────────────────────────────
function CoachLetter({ latest, tx, lang }: { latest: Week | undefined; tx: (k: string) => string; lang: string }) {
    const feedback = latest?.coachFeedback;
    const empty = !feedback || feedback.trim().length === 0;

    return (
        <section style={{
            position: 'relative', borderRadius: 20, padding: '28px 28px 32px',
            background: `linear-gradient(180deg, rgb(var(--primary) / 0.08), rgb(var(--primary-container) / 0.03))`,
            border: `1px solid ${t.outline}`,
            overflow: 'hidden',
        }}>
            {/* Big quote glyph in the corner — purely decorative */}
            <span aria-hidden style={{
                position: 'absolute',
                [lang === 'ar' ? 'right' : 'left']: 18,
                top: 4,
                fontFamily: t.display, fontSize: 80, lineHeight: 1, fontWeight: 800,
                color: t.primary, opacity: 0.18, pointerEvents: 'none',
            }}>“</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, position: 'relative' }}>
                <MessageCircle size={14} style={{ color: t.primary }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.primary }}>
                    {tx('coachLetterEyebrow')}
                </span>
                {!empty && latest && (
                    <span style={{ marginInlineStart: 'auto', fontSize: 11, color: t.onSurfaceVariant, fontWeight: 500 }}>
                        {tx('weekLabel')} {latest.weekNumber}
                    </span>
                )}
            </div>

            {empty ? (
                <p style={{
                    fontFamily: t.display, fontStyle: 'italic',
                    fontSize: 16, lineHeight: 1.6, color: t.onSurfaceVariant, margin: 0,
                }}>
                    {tx('coachLetterEmpty')}
                </p>
            ) : (
                <p style={{
                    fontFamily: t.display, fontStyle: 'italic', fontWeight: 500,
                    fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.7,
                    color: t.onSurface, margin: 0, whiteSpace: 'pre-wrap',
                }}>
                    {feedback}
                </p>
            )}
        </section>
    );
}

// ─── Transformation reel ────────────────────────────────────────────────
function TransformationReel({
    weeks, reviewedWeeks, baselineWeight, tx,
}: {
    weeks: Week[]; reviewedWeeks: Week[]; baselineWeight: number | null;
    tx: (k: string) => string;
}) {
    const showable = weeks.filter(w => frontPhotoOfWeek(w) || lastWeightOfWeek(w) != null);
    if (showable.length === 0) {
        return (
            <section style={{
                borderRadius: 20, padding: 32,
                background: t.surfaceContainerLow, border: `1px solid ${t.outlineVariant}`,
                textAlign: 'center',
            }}>
                <Camera size={28} style={{ color: t.onSurfaceVariant, marginBottom: 12 }} />
                <h3 style={{ fontFamily: t.display, fontSize: 18, fontWeight: 700, color: t.onSurface, margin: '0 0 6px' }}>
                    {tx('reelEmptyTitle')}
                </h3>
                <p style={{ fontSize: 13, color: t.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
                    {tx('reelEmptyBody')}
                </p>
            </section>
        );
    }

    return (
        <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Sparkles size={14} style={{ color: t.primary }} />
                <h3 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.primary, margin: 0 }}>
                    {tx('transformationReelEyebrow')}
                </h3>
                <span style={{ marginInlineStart: 'auto', fontSize: 11, color: t.onSurfaceVariant }}>
                    {reviewedWeeks.length}/{weeks.length} {tx('reviewedShort')}
                </span>
            </div>
            <div style={{
                display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6,
                scrollSnapType: 'x mandatory',
            }}>
                {showable.map(w => {
                    const photo = frontPhotoOfWeek(w);
                    const weight = lastWeightOfWeek(w);
                    const delta = weight != null && baselineWeight != null ? weight - baselineWeight : null;
                    const reviewed = w.status === 'reviewed' || w.status === 'locked';
                    return (
                        <article
                            key={w.id}
                            style={{
                                flex: '0 0 220px', scrollSnapAlign: 'start',
                                borderRadius: 16, overflow: 'hidden',
                                background: t.surfaceContainerLow,
                                border: `1px solid ${reviewed ? t.outline : t.outlineVariant}`,
                                opacity: reviewed ? 1 : 0.85,
                            }}
                        >
                            <div style={{
                                aspectRatio: '3 / 4',
                                background: photo ? `url(${photo}) center/cover no-repeat` : t.surfaceContainerHigh,
                                position: 'relative',
                            }}>
                                <span style={{
                                    position: 'absolute', top: 10, left: 10,
                                    padding: '4px 10px', borderRadius: 999,
                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                                    textTransform: 'uppercase', color: '#fff',
                                }}>
                                    {tx('weekLabel')} {w.weekNumber}
                                </span>
                                {!reviewed && (
                                    <span style={{
                                        position: 'absolute', top: 10, right: 10,
                                        padding: '3px 9px', borderRadius: 999,
                                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                                        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                                        textTransform: 'uppercase', color: '#fff',
                                    }}>
                                        {tx(w.status === 'submitted' ? 'submittedShort' : 'pendingShort')}
                                    </span>
                                )}
                                {!photo && (
                                    <div style={{
                                        position: 'absolute', inset: 0, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: t.onSurfaceVariant,
                                    }}>
                                        <Camera size={24} />
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '12px 14px 14px' }}>
                                <div style={{ fontFamily: t.display, fontSize: 18, fontWeight: 700, color: t.onSurface, lineHeight: 1.1 }}>
                                    {weight != null ? `${weight.toFixed(1)} kg` : '—'}
                                </div>
                                {delta != null && (
                                    <div style={{
                                        marginTop: 4, fontSize: 11, fontWeight: 600,
                                        color: delta < 0 ? '#7fc8d8' : delta > 0 ? '#e89b7a' : t.onSurfaceVariant,
                                    }}>
                                        {delta === 0
                                            ? tx('baselineLabel')
                                            : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg ${tx('vsBaselineShort')}`}
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

// ─── The Numbers ────────────────────────────────────────────────────────
function NumbersGrid({
    weeksActive, checkInsReviewed, totalDelta, level, streak, tx,
}: {
    weeksActive: number; checkInsReviewed: number; totalDelta: number | null;
    level: number; streak: number;
    tx: (k: string) => string;
}) {
    return (
        <section>
            <h3 style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                color: t.primary, margin: '0 0 14px',
            }}>
                {tx('theNumbersEyebrow')}
            </h3>
            <div style={{
                display: 'grid', gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            }}>
                <Stat
                    label={tx('weeksActiveLabel')}
                    value={String(weeksActive)}
                    accent
                />
                <Stat
                    label={tx('totalChangeLabel')}
                    value={totalDelta != null ? `${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(1)} kg` : '—'}
                />
                <Stat
                    label={tx('checkInsReviewedLabel')}
                    value={String(checkInsReviewed)}
                />
                <Stat
                    label={tx('levelLabel')}
                    value={`L${level}`}
                    sub={`${tx('currentStreakLabel')} ${streak}`}
                />
            </div>
        </section>
    );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
    return (
        <div style={{
            borderRadius: 16, padding: 18,
            background: accent
                ? `linear-gradient(135deg, rgb(var(--primary) / 0.12), rgb(var(--primary-container) / 0.04))`
                : t.surfaceContainerLow,
            border: `1px solid ${accent ? t.outline : t.outlineVariant}`,
        }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.onSurfaceVariant }}>
                {label}
            </div>
            <div style={{
                fontFamily: t.display, fontSize: 26, fontWeight: 800, lineHeight: 1.1,
                color: accent ? t.primary : t.onSurface, marginTop: 8, letterSpacing: '-0.02em',
            }}>
                {value}
            </div>
            {sub && (
                <div style={{ marginTop: 6, fontSize: 11, color: t.onSurfaceVariant }}>{sub}</div>
            )}
        </div>
    );
}
