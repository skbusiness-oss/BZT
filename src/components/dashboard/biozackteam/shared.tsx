/**
 * BioZackTeam dashboard primitives + shared cards.
 * Used by both the community dashboard and the coaching-client dashboard so
 * the layouts stay visually consistent.
 *
 * Tokens are CSS variable references — they flip with the theme.
 */
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { levelFromScore, levelProgress } from '../../../lib/activityScore';
import { useLanguage } from '../../../context/LanguageContext';
import type { Course, UserCourseProgress, Post, UserActiveProgram, ProgramDay } from '../../../types';

// ─── Theme-aware tokens (read CSS vars so they flip with the theme) ──────
export const t = {
    surface: 'rgb(var(--surface))',
    surfaceContainerLow: 'rgb(var(--surface-container-low))',
    surfaceContainer: 'rgb(var(--surface-container))',
    surfaceContainerHigh: 'rgb(var(--surface-container-high))',
    surfaceContainerHighest: 'rgb(var(--surface-container-highest))',
    surfaceBright: 'rgb(var(--surface-bright))',
    primary: 'rgb(var(--primary))',
    primaryContainer: 'rgb(var(--primary-container))',
    onPrimaryFixed: 'rgb(var(--on-primary))',
    onSurface: 'rgb(var(--on-surface))',
    onSurfaceVariant: 'rgb(var(--on-surface-variant))',
    onSurfaceMuted: 'rgb(var(--outline))',
    outline: 'rgb(var(--primary) / 0.15)',
    outlineHover: 'rgb(var(--primary) / 0.50)',
    outlineVariant: 'rgb(var(--outline-variant) / 0.4)',
    gold: 'rgb(var(--primary))',
    cyan: '#7fc8d8',
    coral: '#e89b7a',
    violet: '#b39ddb',
    display: '"Manrope", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
};
export const goldGradient = `linear-gradient(135deg, ${t.primary} 0%, ${t.primaryContainer} 100%)`;

// ─── Primitives ─────────────────────────────────────────────────────────
export function Card({ children, variant = 'default', style = {}, onClick }: {
    children: React.ReactNode; variant?: 'default' | 'glass' | 'bright'; style?: React.CSSProperties; onClick?: () => void;
}) {
    const variants: Record<string, React.CSSProperties> = {
        default: { background: t.surfaceContainer, border: 'none' },
        glass: {
            background: `rgb(var(--surface-container-highest) / 0.6)`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
        },
        bright: { background: t.surfaceBright, border: `1px solid ${t.outline}` },
    };
    return (
        <div
            onClick={onClick}
            style={{ borderRadius: 20, padding: '2rem', cursor: onClick ? 'pointer' : undefined, ...variants[variant], ...style }}
        >
            {children}
        </div>
    );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontFamily: t.body, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: t.onSurfaceVariant,
        }}>{children}</div>
    );
}

export function MetricCard({ label, value, unit, sub, hero }: {
    label: string; value: string | number; unit?: string; sub?: string; hero?: boolean;
}) {
    return (
        <Card variant={hero ? 'glass' : 'default'}>
            <Eyebrow>{label}</Eyebrow>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                    fontFamily: t.display, fontSize: hero ? 52 : 40, fontWeight: 300,
                    lineHeight: 1, letterSpacing: '-0.03em',
                    color: hero ? t.primary : t.onSurface,
                }}>{value}</span>
                {unit && <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurfaceVariant }}>{unit}</span>}
            </div>
            {sub && <div style={{ marginTop: 10, fontFamily: t.body, fontSize: 12, color: t.onSurfaceVariant }}>{sub}</div>}
        </Card>
    );
}

// ─── Continue Academy ───────────────────────────────────────────────────
// iOS-style hero: course cover image as the background, dark gradient overlay,
// eyebrow + title + progress overlaid. Falls back to a gold gradient when no
// cover is set.
export function ContinueAcademyCard({ courses, userProgress, onNavigate }: {
    courses: Course[];
    userProgress: Record<string, UserCourseProgress>;
    onNavigate: (path: string) => void;
}) {
    const { t: tx } = useLanguage();
    const published = courses.filter(c => c.isPublished && !c.archived);
    const inProgress = published.find(c => {
        const prog = userProgress[c.id];
        const done = prog?.completedLessonIds?.length ?? 0;
        return (c.lessonCount ?? 0) > 0 && done > 0 && done < (c.lessonCount ?? 0);
    });
    const next = inProgress ?? published.find(c => (c.lessonCount ?? 0) > 0);

    if (!next) return (
        <div
            onClick={() => onNavigate('/library')}
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Layered background: classroom photo, goal-tinted gradient, dark fade for legibility. */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/courses-hero.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, rgb(var(--primary) / 0.18), rgb(var(--surface-container)))`,
                opacity: 0.55, mixBlendMode: 'multiply',
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.82) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220 }}>
                <div style={{
                    fontFamily: t.body, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: '#e6c364', marginBottom: 6,
                }}>
                    {tx('academyEyebrow')}
                </div>
                <h2 style={{
                    fontFamily: t.display, fontSize: 22, fontWeight: 600,
                    color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                    textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}>
                    {tx('academyEmptyTitle')}
                </h2>
                <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 14px' }}>
                    {tx('academyEmptySub')}
                </p>
                <span style={{
                    alignSelf: 'flex-start',
                    padding: '8px 18px', borderRadius: 999,
                    background: goldGradient, color: t.onPrimaryFixed,
                    fontFamily: t.body, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>{tx('browseAcademyCta')}</span>
            </div>
        </div>
    );

    const prog = userProgress[next.id];
    const done = prog?.completedLessonIds?.length ?? 0;
    const total = next.lessonCount ?? 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isNew = done === 0;
    const cover = next.coverImageUrl;

    return (
        <div
            onClick={() => onNavigate('/library')}
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            <div
                style={{
                    position: 'absolute', inset: 0,
                    // Course-specific cover takes priority. Falls back to the
                    // generic courses photo so the card never feels flat even
                    // when a coach hasn't set a cover yet.
                    background: cover
                        ? `url(${cover}) center/cover no-repeat`
                        : `url(/courses-hero.jpg) center/cover no-repeat`,
                }}
            />
            <div
                style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                }}
            />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220 }}>
                <div style={{
                    fontFamily: t.body, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: '#e6c364', marginBottom: 6,
                }}>
                    {isNew ? tx('startLearning') : tx('continueLearning')}
                </div>
                <h2 style={{
                    fontFamily: t.display, fontSize: 22, fontWeight: 600,
                    color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                    textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}>{next.title}</h2>
                <p style={{
                    fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)',
                    margin: '0 0 14px',
                }}>
                    {done} / {total} {tx('lessonsUnit')}{!isNew ? ` · ${pct}% ${tx('completeLabel')}` : ''}
                </p>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 999, marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: goldGradient, borderRadius: 999, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{
                    alignSelf: 'flex-start',
                    padding: '8px 18px', borderRadius: 999,
                    background: goldGradient, color: t.onPrimaryFixed,
                    fontFamily: t.body, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>{isNew ? tx('startCourseCta') : tx('continueCta')}</span>
            </div>
        </div>
    );
}

// ─── Today's Workout ────────────────────────────────────────────────────
// iOS-style hero card. Background is a colored gradient themed by goal
// (energy / strength / recovery). Day badge in the top-right.
const GOAL_GRADIENT: Record<string, string> = {
    fat_loss:   'linear-gradient(135deg, #ff6b6b 0%, #c92e2e 100%)',
    muscle_gain:'linear-gradient(135deg, #4dabf7 0%, #1864ab 100%)',
    strength:   'linear-gradient(135deg, #845ef7 0%, #5f3dc4 100%)',
    recomp:     'linear-gradient(135deg, #38d9a9 0%, #099268 100%)',
    endurance:  'linear-gradient(135deg, #ffa94d 0%, #d9480f 100%)',
    maintenance:'linear-gradient(135deg, #748ffc 0%, #364fc7 100%)',
    rest:       'linear-gradient(135deg, #495057 0%, #212529 100%)',
};

export function TodayWorkoutCard({ activeProgram, getTodaysDay, todaysDayNumber, onNavigate }: {
    activeProgram: UserActiveProgram | null;
    getTodaysDay: () => ProgramDay | null;
    todaysDayNumber: number;
    onNavigate: (path: string) => void;
}) {
    const { t: tx } = useLanguage();
    const today = getTodaysDay();
    const isRest = today?.type === 'rest';

    if (!activeProgram) return (
        <div
            onClick={() => onNavigate('/workouts')}
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 180, padding: '24px 24px 28px',
                background: 'linear-gradient(135deg, rgb(var(--surface-container-high)) 0%, rgb(var(--surface-container-highest)) 100%)',
                border: `1px solid ${t.outline}`,
            }}
        >
            <Eyebrow>{tx('todaysTraining')}</Eyebrow>
            <h2 style={{ fontFamily: t.display, fontSize: 24, fontWeight: 400, color: t.onSurface, margin: '8px 0 8px', letterSpacing: '-0.02em' }}>
                {tx('noProgramYet')}
            </h2>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.onSurfaceVariant, marginBottom: 16 }}>
                {tx('chooseProgramSub')}
            </p>
            <span style={{
                display: 'inline-block', padding: '8px 18px', borderRadius: 999,
                background: goldGradient, color: t.onPrimaryFixed,
                fontFamily: t.body, fontSize: 12, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{tx('browseProgramsCta')}</span>
        </div>
    );

    const goal = (activeProgram as { programGoal?: string }).programGoal;
    const heroBg = isRest ? GOAL_GRADIENT.rest : (GOAL_GRADIENT[goal ?? ''] ?? GOAL_GRADIENT.muscle_gain);

    // Deep-link to today's day if a program is active and not a rest day.
    // Rest days: stay on the program overview so user can see the full week.
    const targetPath = isRest ? '/workouts' : `/workouts/day/${todaysDayNumber}`;

    return (
        <div
            onClick={() => onNavigate(targetPath)}
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Layered background:
                1. Hero photo (only on training days — rest days stay on the muted gradient).
                2. Goal-themed gradient as a tinted overlay (multiply blend) so the
                   photo still reads through but the card keeps its goal color.
                3. Bottom darkening gradient for text legibility. */}
            {!isRest && (
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(/workout-hero.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }} />
            )}
            <div style={{
                position: 'absolute', inset: 0,
                background: heroBg,
                opacity: isRest ? 1 : 0.55,
                mixBlendMode: isRest ? 'normal' : 'multiply',
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.82) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                        fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.82)',
                    }}>{tx('todaysTraining')}</div>
                    {!isRest && (
                        <div style={{
                            padding: '6px 14px', borderRadius: 999,
                            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                            color: '#fff', fontFamily: t.body, fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                        }}>
                            {tx('dayLabel')} {todaysDayNumber}
                        </div>
                    )}
                </div>
                <div>
                    <h2 style={{
                        fontFamily: t.display, fontSize: 26, fontWeight: 600,
                        color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                        textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                    }}>
                        {isRest ? tx('restDayLabel') : (today?.label ?? activeProgram.programName)}
                    </h2>
                    <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 14px' }}>
                        {isRest
                            ? tx('recoveryTagline')
                            : `${activeProgram.programName} · ${tx('cycleLabel')} ${activeProgram.currentCycle}`}
                    </p>
                    {!isRest && (
                        <span style={{
                            display: 'inline-block',
                            padding: '8px 18px', borderRadius: 999,
                            background: goldGradient, color: t.onPrimaryFixed,
                            fontFamily: t.body, fontSize: 12, fontWeight: 600,
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>{tx('startWorkoutCta')}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Community Activity ─────────────────────────────────────────────────
export function CommunityActivityCard({ posts, onNavigate }: {
    posts: Post[];
    onNavigate: (path: string) => void;
}) {
    const { t: tx } = useLanguage();
    if (posts.length === 0) return null;

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <Eyebrow>{tx('communityEyebrow')}</Eyebrow>
                    <h2 style={{ fontFamily: t.display, fontSize: 22, fontWeight: 400, color: t.onSurface, margin: '8px 0 0', letterSpacing: '-0.02em' }}>
                        {tx('whatsHappening')}
                    </h2>
                </div>
                <button onClick={() => onNavigate('/community')} style={{
                    padding: '8px 16px', borderRadius: 999, border: `1px solid ${t.outline}`, background: 'transparent',
                    color: t.onSurfaceVariant, fontFamily: t.body, fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                }}>{tx('seeAllCta')}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {posts.map(post => (
                    <div key={post.id} style={{
                        padding: '14px 16px', background: t.surfaceContainerLow, borderRadius: 14,
                        border: `1px solid ${t.outlineVariant}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: t.surfaceContainerHighest,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                fontFamily: t.display, fontSize: 11, fontWeight: 600, color: t.primary,
                            }}>
                                {post.authorName.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.onSurface }}>
                                {post.authorName}
                            </span>
                            {post.authorRole === 'coach' && (
                                <span style={{ fontFamily: t.body, fontSize: 11, color: t.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{tx('coachLabel')}</span>
                            )}
                        </div>
                        <p style={{ fontFamily: t.body, fontSize: 13, color: t.onSurfaceVariant, lineHeight: 1.55, margin: 0 }}>
                            {post.content.slice(0, 120)}{post.content.length > 120 ? '…' : ''}
                        </p>
                        {(post.likes?.length ?? 0) > 0 && (
                            <div style={{ marginTop: 8, fontFamily: t.body, fontSize: 11, color: t.onSurfaceMuted }}>
                                ❤ {post.likes.length}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ─── Your Standing — private rank widget. Shows ONLY this user's rank.
// Non-interactive for everyone except coaches (coaches get a "See board" CTA
// because they alone can see all roles in one place).
export function YourStandingCard({ uid, score, isCoach, onNavigate }: {
    uid: string | undefined;
    score: number;
    isCoach?: boolean;
    onNavigate: (path: string) => void;
}) {
    const { t: tx } = useLanguage();
    const [rank, setRank] = useState<number | null>(null);

    useEffect(() => {
        if (!uid) return;
        const q = query(collection(db, 'publicProfiles'), orderBy('activityScore', 'desc'), limit(100));
        const unsub = onSnapshot(q, (snap) => {
            const ids = snap.docs.map(d => d.id);
            const idx = ids.indexOf(uid);
            setRank(idx >= 0 ? idx + 1 : null);
        }, () => { /* ignore */ });
        return unsub;
    }, [uid]);

    const level = levelFromScore(score);
    const xpPct = levelProgress(score);
    const rankLabel = rank ? `#${rank}` : (score > 0 ? '100+' : '—');
    const subLabel = rank
        ? tx('top100Label')
        : score > 0 ? tx('climbingTheRanks') : tx('logActivityToStart');

    return (
        <Card
            variant="bright"
            onClick={isCoach ? () => onNavigate('/leaderboard') : undefined}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Eyebrow>{tx('yourStanding')}</Eyebrow>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
                        <span style={{
                            fontFamily: t.display, fontSize: 44, fontWeight: 300,
                            lineHeight: 1, color: t.primary, letterSpacing: '-0.03em',
                        }}>{rankLabel}</span>
                        <span style={{ fontFamily: t.body, fontSize: 13, color: t.onSurfaceVariant }}>
                            {subLabel}
                        </span>
                    </div>
                    <p style={{ fontFamily: t.body, fontSize: 12, color: t.onSurfaceVariant, marginTop: 14, marginBottom: 0 }}>
                        {tx('levelLabel')} {level} · {score.toLocaleString()} {tx('xpUnit')}
                    </p>
                    <div style={{ marginTop: 8, height: 4, background: t.surfaceContainerHighest, borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: goldGradient, borderRadius: 999, width: `${xpPct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                </div>
                {isCoach && (
                    <span style={{
                        padding: '8px 14px', borderRadius: 999, border: `1px solid ${t.outline}`,
                        color: t.primary, fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{tx('seeBoardCta')}</span>
                )}
            </div>
        </Card>
    );
}

// ─── Progress CTA — points users to /profile for the data dump ─────────
export function ProgressCTA({ onNavigate }: { onNavigate: (path: string) => void }) {
    const { t: tx } = useLanguage();
    return (
        <Card variant="bright">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Eyebrow>{tx('progressEyebrow')}</Eyebrow>
                    <h2 style={{ fontFamily: t.display, fontSize: 22, fontWeight: 400, color: t.onSurface, margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                        {tx('chartsMeasurementsPhotos')}
                    </h2>
                    <p style={{ fontFamily: t.body, fontSize: 13, color: t.onSurfaceVariant, margin: 0 }}>
                        {tx('progressDesc')}
                    </p>
                </div>
                <button onClick={() => onNavigate('/profile')} style={{
                    padding: '10px 24px', borderRadius: 999, border: 'none', background: goldGradient,
                    color: t.onPrimaryFixed, fontFamily: t.body, fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{tx('viewProgressCta')}</button>
            </div>
        </Card>
    );
}
