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
import { tPlanName } from '../../../lib/dietTranslations';
import { coverUrl } from '../../../data/diets/covers';
import type { Course, Lesson, UserCourseProgress, Post, UserActiveProgram, ProgramDay, DietProfile } from '../../../types';

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

// Pill paddings — two values, snapped to the 4/8/12/16/20 spacing scale.
// Previously this file had 7 different ad-hoc pill paddings (8px 18px,
// 8px 16px, 6px 14px, 6px 12px, 5px 11px, 14px 16px, 2rem) which made
// otherwise-identical pills appear subtly different across dashboard
// tiles. Two constants cover every pill in the app:
//   - pillPadSm  — small chips (week numbers, status tags, week-strip days)
//   - pillPad    — default CTA / inline-action pill
export const pillPadSm = '6px 12px';
export const pillPad = '8px 16px';

// ─── Primitives ─────────────────────────────────────────────────────────
export function Card({ children, variant = 'default', style = {}, onClick, className }: {
    children: React.ReactNode;
    variant?: 'default' | 'glass' | 'bright';
    style?: React.CSSProperties;
    onClick?: () => void;
    className?: string;
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
            className={className}
            style={{ borderRadius: 20, padding: '1.5rem', cursor: onClick ? 'pointer' : undefined, ...variants[variant], ...style }}
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

// ─── PurposeLine ───────────────────────────────────────────────────────
// Small italic caption that sits under each card's title to say in
// plain English what the card is FOR. Founder direction: every card
// should explain itself at a glance — the eyebrow tells you what it
// IS, this line tells you what tapping it WILL DO.
//
// Two tones:
//   - 'dark'  → for cards with a photo background (white-ish italic
//               readable against the dark overlay).
//   - 'light' → for cards on the regular surface (uses theme tokens).
function PurposeLine({ children, tone = 'dark' }: {
    children: string;
    tone?: 'dark' | 'light';
}) {
    return (
        <p style={{
            fontFamily: t.body, fontSize: 11.5, fontWeight: 500, fontStyle: 'italic',
            color: tone === 'dark' ? 'rgba(255,255,255,0.72)' : t.onSurfaceVariant,
            margin: '0 0 10px', lineHeight: 1.45,
        }}>
            {children}
        </p>
    );
}

// ─── DashboardChapter ───────────────────────────────────────────────────
// Big "chapter" intro shown above each dashboard section. Replaces the
// older small "Step 1 / Today / one-liner" header treatment which the
// founder flagged as undersized and easy to skim past.
//
// Visual language
//   - A large gradient-gold numeral (01 / 02 / 03) sits left as the
//     primary visual anchor — the user immediately reads "Chapter 1".
//   - A thin gold hairline rule extends across the row, signalling
//     "this is a fresh section, not just another card."
//   - The title is full Manrope extrabold at ~30px so it reads as a
//     proper heading, not a label.
//   - The subtitle uses 15px body so it's legible on phones without
//     having to lean in.
//   - The whole block fades-and-rises on mount with a staggered delay
//     keyed off `index` so chapters introduce themselves sequentially
//     instead of all popping in at once.
//
// Accessibility: the numeral is `aria-hidden` so screen readers
// announce the title and subtitle in natural order. The `<h2>` keeps
// the proper landmark hierarchy.
//
// Reused by both ClientDashboard and CommunityBioZackTeam so the
// "step" framing reads consistently across audiences.
export function DashboardChapter({ index, title, subtitle }: {
    /** 1-based chapter number — drives the big "01" / "02" numeral. */
    index: number;
    title: string;
    subtitle: string;
}) {
    const numeral = String(index).padStart(2, '0');
    return (
        <div
            className="bzt-rise-in"
            style={{
                margin: '4px 0 18px',
                animationDelay: `${(index - 1) * 80}ms`,
            }}
        >
            {/* Top row: chapter eyebrow + gold hairline. The hairline
                tapers from gold on the left to transparent on the
                right so it reads as an "in progress" stroke rather
                than a hard divider. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{
                    fontFamily: t.body, fontSize: 10, fontWeight: 800,
                    letterSpacing: '0.32em', textTransform: 'uppercase',
                    color: t.primary,
                }}>
                    Chapter {numeral}
                </span>
                <span aria-hidden style={{
                    flex: 1, height: 1,
                    background: `linear-gradient(90deg, ${t.primary} 0%, rgb(var(--primary) / 0) 100%)`,
                }} />
            </div>

            {/* Title row: huge gradient numeral + title block. The
                numeral is a non-semantic decoration (aria-hidden) so
                AT readers hear "Today" first, not "zero one Today". */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <span
                    aria-hidden
                    style={{
                        fontFamily: t.display, fontWeight: 800,
                        fontSize: 72, lineHeight: 0.85, letterSpacing: '-0.04em',
                        background: goldGradient,
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        flexShrink: 0,
                    }}
                >
                    {numeral}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{
                        fontFamily: t.display, fontSize: 30, fontWeight: 800,
                        color: t.onSurface, margin: 0,
                        letterSpacing: '-0.02em', lineHeight: 1.05,
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        fontFamily: t.body, fontSize: 15, lineHeight: 1.55,
                        color: t.onSurfaceVariant,
                        margin: '6px 0 0',
                        maxWidth: 520,
                    }}>
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Continue Academy ───────────────────────────────────────────────────
// iOS-style hero: course cover image as the background, dark gradient overlay,
// eyebrow + title + progress overlaid. Falls back to a gold gradient when no
// cover is set.
export function ContinueAcademyCard({ courses, userProgress, lessons, loadLessons, onNavigate }: {
    courses: Course[];
    userProgress: Record<string, UserCourseProgress>;
    /** Lessons keyed by courseId — from AcademyContext. Optional so older
     *  callers don't have to plumb it; without it we fall back to the
     *  course-level cover. */
    lessons?: Record<string, Lesson[]>;
    /** Pre-load lessons for the in-progress course so we can grab the next
     *  lesson's thumbnail. Optional for the same reason as above. */
    loadLessons?: (courseId: string, force?: boolean) => Promise<void>;
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

    // Trigger lesson load for the in-progress course so we get the next
    // lesson's thumbnail on the card. Only fires once per course id; the
    // AcademyContext's loadLessons is idempotent (cached by courseId).
    useEffect(() => {
        if (next?.id && loadLessons && !lessons?.[next.id]) {
            void loadLessons(next.id);
        }
    }, [next?.id, lessons, loadLessons]);

    if (!next) return (
        <div
            onClick={() => onNavigate('/library')}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Layered background: editorial study photo, goal-tinted gradient, dark fade for legibility. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/continue-learning.jpg)',
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
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}>
                    {tx('academyEmptyTitle')}
                </h2>
                <PurposeLine>Bite-sized lessons from coach Zaki — structured by level.</PurposeLine>
                <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 14px' }}>
                    {tx('academyEmptySub')}
                </p>
                <span style={{
                    alignSelf: 'flex-start',
                    padding: pillPad, borderRadius: 999,
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

    // card backdrop — visually anchors the card to "where you stopped"
    return (
        <div
            onClick={() => onNavigate('/library')}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            <div
                className="bzt-hero-photo"
                style={{
                    position: 'absolute', inset: 0,
                    background: `url(/dashboard-covers/continue-learning.jpg) center/cover no-repeat`,
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
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}>{next.title}</h2>
                <PurposeLine>
                    {isNew ? 'Start the next required course in your path.' : 'Pick up where you left off in the curriculum.'}
                </PurposeLine>
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
                    padding: pillPad, borderRadius: 999,
                    background: goldGradient, color: t.onPrimaryFixed,
                    fontFamily: t.body, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>{isNew ? tx('startCourseCta') : tx('continueCta')}</span>
            </div>
        </div>
    );
}

// ─── Today's Workout ────────────────────────────────────────────────────
// iOS-style hero card. Background = per-goal AI-generated cover photo +
// goal-themed gradient overlay (multiply blend) + bottom darken for legibility.
const GOAL_GRADIENT: Record<string, string> = {
    fat_loss:   'linear-gradient(135deg, #ff6b6b 0%, #c92e2e 100%)',
    muscle_gain:'linear-gradient(135deg, #4dabf7 0%, #1864ab 100%)',
    strength:   'linear-gradient(135deg, #845ef7 0%, #5f3dc4 100%)',
    recomp:     'linear-gradient(135deg, #38d9a9 0%, #099268 100%)',
    endurance:  'linear-gradient(135deg, #ffa94d 0%, #d9480f 100%)',
    maintenance:'linear-gradient(135deg, #748ffc 0%, #364fc7 100%)',
    rest:       'linear-gradient(135deg, #495057 0%, #212529 100%)',
};
// Per-goal hero photo. Generated by Gemini Flash, served from /public/.
// Missing goal falls back to the legacy single hero so nothing ever blanks.
const GOAL_COVER: Record<string, string> = {
    fat_loss:    '/workout-covers/goal-fat-loss.jpg',
    muscle_gain: '/workout-covers/goal-muscle-gain.jpg',
    strength:    '/workout-covers/goal-strength.jpg',
    recomp:      '/workout-covers/goal-recomp.jpg',
    endurance:   '/workout-covers/goal-endurance.jpg',
    maintenance: '/workout-covers/goal-maintenance.jpg',
    rest:        '/workout-covers/goal-rest.jpg',
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
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Empty-rack hero photo — gym-waiting vibe. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/empty-workout.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
            }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220 }}>
                <div style={{
                    fontFamily: t.body, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: '#e6c364', marginBottom: 6,
                }}>{tx('todaysTraining')}</div>
                <h2 style={{
                    fontFamily: t.display, fontSize: 22, fontWeight: 600,
                    color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}>{tx('noProgramYet')}</h2>
                <PurposeLine>Browse 10-day rotations and pick the one matching your goal.</PurposeLine>
                <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 14px' }}>
                    {tx('chooseProgramSub')}
                </p>
                <span style={{
                    alignSelf: 'flex-start',
                    padding: pillPad, borderRadius: 999,
                    background: goldGradient, color: t.onPrimaryFixed,
                    fontFamily: t.body, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>{tx('browseProgramsCta')}</span>
            </div>
        </div>
    );

    const goal = (activeProgram as { programGoal?: string }).programGoal;
    const heroBg = isRest ? GOAL_GRADIENT.rest : (GOAL_GRADIENT[goal ?? ''] ?? GOAL_GRADIENT.muscle_gain);
    // Rest days get the dedicated rest cover (empty gym / sauna), training
    // days get the goal-matched photo. Fallback to the legacy hero if a new
    // goal id ever shows up that we haven't generated a cover for.
    const heroCover = isRest
        ? GOAL_COVER.rest
        : (GOAL_COVER[goal ?? ''] ?? '/workout-hero.jpg');

    // Deep-link to today's day if a program is active and not a rest day.
    // Rest days: stay on the program overview so user can see the full week.
    const targetPath = isRest ? '/workouts' : `/workouts/day/${todaysDayNumber}`;

    // card backdrop — visually anchors the card to "where you stopped"
    return (
        <div
            onClick={() => onNavigate(targetPath)}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Layered background:
                1. Per-goal hero photo (rest days get the dedicated rest cover).
                   `.bzt-hero-photo` scales subtly when the parent card is hovered.
                2. Goal-themed gradient as a tinted overlay (multiply blend) so the
                   photo still reads through but the card keeps its goal color.
                3. Bottom darkening gradient for text legibility. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${heroCover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: heroBg,
                opacity: 0.55,
                mixBlendMode: 'multiply',
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
                            padding: pillPadSm, borderRadius: 999,
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
                        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                    }}>
                        {isRest ? tx('restDayLabel') : (today?.label ?? activeProgram.programName)}
                    </h2>
                    <PurposeLine>
                        {isRest
                            ? 'No lifts today — let the body rebuild what you trained.'
                            : 'Open today’s session to follow exercises, sets, and rest.'}
                    </PurposeLine>
                    <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 14px' }}>
                        {isRest
                            ? tx('recoveryTagline')
                            : `${activeProgram.programName} · ${tx('cycleLabel')} ${activeProgram.currentCycle}`}
                    </p>
                    {!isRest && (
                        <span style={{
                            display: 'inline-block',
                            padding: pillPad, borderRadius: 999,
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

// ─── Today's Diet ───────────────────────────────────────────────────────
// Sibling of TodayWorkoutCard. Three states:
//   - assignedDietId set       → prefer the assigned plan; deep-link to its
//                                 detail page (`/diets/plan/:id`) on click
//   - dietProfile only         → user ran the calculator but hasn't picked a
//                                 plan yet; show their targets, click goes
//                                 to `/diets` so they can pick
//   - neither                  → empty state; "Start my plan" → `/diets`
export function TodayDietCard({
    dietProfile, assignedSnapshot, assignedDietId, onNavigate,
}: {
    dietProfile: DietProfile | undefined;
    assignedSnapshot?: { name: string; calories: number; mealsPerDay: number; macros: { protein: number; carbs: number; fat: number } };
    assignedDietId?: string;
    onNavigate: (path: string) => void;
}) {
    const { t: tx, lang } = useLanguage();

    const planTarget = assignedDietId ? `/diets/plan/${assignedDietId}` : '/diets';

    // ── Empty state — no profile, no assignment ────────────────────────
    if (!dietProfile && !assignedDietId) return (
        <div
            onClick={() => onNavigate('/diets')}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Empty-plate photo backdrop — fresh-start vibe. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/empty-diet.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220 }}>
                <div style={{
                    fontFamily: t.body, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: '#e6c364', marginBottom: 6,
                }}>
                    {tx('dietsEyebrow') ?? 'Nutrition'}
                </div>
                <h2 style={{
                    fontFamily: t.display, fontSize: 22, fontWeight: 600,
                    color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}>{tx('startMyPlan') ?? 'Start my plan'}</h2>
                <PurposeLine>Quick calculator that picks the right calorie tier and macro split for you.</PurposeLine>
                <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 14px' }}>
                    {tx('dietCalculateBlurb') ?? 'Sex, age, weight, height, activity, goal. We do the math, match the plan.'}
                </p>
                <span style={{
                    alignSelf: 'flex-start',
                    padding: pillPad, borderRadius: 999,
                    background: goldGradient, color: t.onPrimaryFixed,
                    fontFamily: t.body, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>{tx('startCalculator') ?? 'Start'}</span>
            </div>
        </div>
    );

    // ── Populated state — assigned plan takes priority over profile-only ─
    const headlineKcal = assignedSnapshot?.calories ?? dietProfile?.targetCalories ?? 0;
    const headlineProtein = assignedSnapshot?.macros.protein ?? dietProfile?.targetProtein ?? 0;
    const headlineCarbs   = assignedSnapshot?.macros.carbs   ?? dietProfile?.targetCarbs   ?? 0;
    const headlineFat     = assignedSnapshot?.macros.fat     ?? dietProfile?.targetFat     ?? 0;
    const headlineMeals   = assignedSnapshot?.mealsPerDay   ?? dietProfile?.mealsPerDay   ?? 3;
    const ctaLabel = assignedDietId
        ? (tx('openMyDiet') ?? 'Open my diet')
        : (tx('viewMyPlan') ?? 'View my plan');

    // card backdrop — visually anchors the card to "where you stopped"
    return (
        <div
            onClick={() => onNavigate(planTarget)}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Tier cover photo backdrop. Falls back to the primary gradient
                if the JPEG hasn't been generated yet (handled by background
                shorthand: the linear-gradient layer remains visible). */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `url(${coverUrl(headlineKcal)}) center/cover no-repeat, linear-gradient(135deg, rgb(var(--primary) / 0.36) 0%, rgb(var(--primary-container) / 0.18) 100%)`,
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{
                        fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: '#e6c364',
                    }}>
                        {tx('todaysNutrition') ?? 'Today’s nutrition'}
                    </div>
                    {assignedDietId && (
                        <span style={{
                            padding: pillPadSm, borderRadius: 999,
                            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                            color: '#fff', fontFamily: t.body, fontSize: 10, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.16em', whiteSpace: 'nowrap',
                        }}>
                            {tx('myPlanLabel') ?? 'My plan'}
                        </span>
                    )}
                </div>
                <div>
                    {assignedSnapshot?.name && (
                        <div style={{
                            fontFamily: t.display, fontSize: 18, fontWeight: 600,
                            color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em',
                            marginBottom: 6, textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                        }}>
                            {tPlanName(assignedSnapshot.name, lang, tx('mealsWord'))}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{
                            fontFamily: t.display, fontSize: 36, fontWeight: 700,
                            color: '#fff', letterSpacing: '-0.02em',
                            textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                        }}>{headlineKcal}</span>
                        <span style={{ fontFamily: t.body, fontSize: 13, color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                            kcal
                        </span>
                    </div>
                    <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '0 0 4px' }}>
                        {headlineProtein}P · {headlineCarbs}C · {headlineFat}F · {headlineMeals} {tx('mealsPerDay') ?? 'meals'}
                    </p>
                    <PurposeLine>Open your meal plan to see today’s macros, food keys, and the day-by-day split.</PurposeLine>
                    <span style={{
                        display: 'inline-block',
                        padding: pillPad, borderRadius: 999,
                        background: goldGradient, color: t.onPrimaryFixed,
                        fontFamily: t.body, fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>{ctaLabel}</span>
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
        <div
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Header band — coaching-journey photo (people-themed) drives the
                community card visual identity. Sits above the post list at
                144px height so it reads as a hero strip without crowding
                the content. */}
            <div
                style={{
                    position: 'relative', height: 144, overflow: 'hidden',
                }}
            >
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(/dashboard-covers/coaching-journey.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                }} />
                <div style={{
                    position: 'absolute', inset: 0, padding: 24,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
                }}>
                    <div>
                        <span style={{
                            fontFamily: t.body, fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.16em', textTransform: 'uppercase',
                            color: '#e6c364', display: 'block', marginBottom: 6,
                        }}>{tx('communityEyebrow')}</span>
                        <h2 style={{
                            fontFamily: t.display, fontSize: 22, fontWeight: 600,
                            color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                            textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                        }}>{tx('whatsHappening')}</h2>
                        <PurposeLine>What the rest of the team posted this week.</PurposeLine>
                    </div>
                    <button onClick={() => onNavigate('/community')} style={{
                        padding: pillPad, borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.30)',
                        background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)',
                        color: '#fff', fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                        whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{tx('seeAllCta')}</button>
                </div>
            </div>
            <div style={{
                background: t.surfaceContainer, padding: '1.5rem 2rem 2rem',
            }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {posts.map(post => {
                    // Tombstone substitution — deleteUser writes empty
                    // authorId + sentinel '[deleted]' name on posts whose
                    // author was deleted. Show the localized "Deleted user"
                    // label and a neutral avatar instead of the sentinel.
                    const isTombstoned = !post.authorId || post.authorName === '[deleted]';
                    const displayName = isTombstoned ? tx('deletedUserLabel') : post.authorName;
                    const initials = isTombstoned
                        ? '—'
                        : (post.authorName.slice(0, 2).toUpperCase() || '··');
                    return (
                    <div key={post.id} style={{
                        padding: '14px 16px', background: t.surfaceContainerLow, borderRadius: 14,
                        border: `1px solid ${t.outlineVariant}`,
                        opacity: isTombstoned ? 0.7 : 1,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: t.surfaceContainerHighest,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                fontFamily: t.display, fontSize: 11, fontWeight: 600,
                                color: isTombstoned ? t.onSurfaceMuted : t.primary,
                                fontStyle: isTombstoned ? 'italic' : 'normal',
                            }}>
                                {initials}
                            </div>
                            <span
                                style={{
                                    fontFamily: t.body, fontSize: 13, fontWeight: 600,
                                    color: isTombstoned ? t.onSurfaceMuted : t.onSurface,
                                    fontStyle: isTombstoned ? 'italic' : 'normal',
                                }}
                            >
                                {displayName}
                            </span>
                            {!isTombstoned && post.authorRole === 'coach' && (
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
                    );
                })}
            </div>
            </div>
        </div>
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
        <div
            onClick={isCoach ? () => onNavigate('/leaderboard') : undefined}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden',
                cursor: isCoach ? 'pointer' : 'default', minHeight: 200, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Brass-medal photo backdrop. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/tile-your-standing.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            {/* Bottom-darken scrim for legibility. */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)',
            }} />
            <div style={{ position: 'relative', zIndex: 1, padding: 24, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                        fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.16em', textTransform: 'uppercase', color: '#e6c364',
                    }}>{tx('yourStanding')}</div>
                    {isCoach && (
                        <span style={{
                            padding: pillPadSm, borderRadius: 999,
                            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                            color: '#fff', fontFamily: t.body, fontSize: 10, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap',
                        }}>{tx('seeBoardCta')}</span>
                    )}
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                        <span style={{
                            fontFamily: t.display, fontSize: 48, fontWeight: 300,
                            lineHeight: 1, color: '#fff', letterSpacing: '-0.03em',
                            textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                        }}>{rankLabel}</span>
                        <span style={{ fontFamily: t.body, fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
                            {subLabel}
                        </span>
                    </div>
                    <p style={{ fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: '10px 0 0' }}>
                        {tx('levelLabel')} {level} · {score.toLocaleString()} {tx('xpUnit')}
                    </p>
                    <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: goldGradient, borderRadius: 999, width: `${xpPct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Week Status Panel ─────────────────────────────────────────────────
// Replaces the old 3 metric cards (streak/level/logs) + standalone Standing
// card. Single premium surface that combines:
//   - 7-day calendar strip (Mon-Sun, today highlighted, dot on logged days)
//   - Streak ring (conic-gradient "half" ring, big number in center)
//   - Level + XP progress bar
//   - Logs count + private rank ("#23 of 500")
//
// Animation: width transition on the XP bar; entrance fade handled by parent.
// Mobile: ring + level stack vertically below the calendar at <600px.
//
// Rank source: queries top-100 from `publicProfiles` (same as YourStandingCard).
// Total community size queried separately for the "of 500" denominator.
function dayKey(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function weekDates(today: Date = new Date()): Date[] {
    // Mon = 0, Sun = 6. Returns the 7 dates of the current Mon-Sun week.
    const dow = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

export function WeekStatusPanel({
    uid, score, currentStreak, bestStreak, logCount, loggedDates, isCoach, onNavigate,
}: {
    uid: string | undefined;
    score: number;
    currentStreak: number;
    bestStreak: number;
    logCount: number;
    loggedDates: Set<string>;
    isCoach?: boolean;
    onNavigate: (path: string) => void;
}) {
    const { t: tx } = useLanguage();
    const [rank, setRank] = useState<number | null>(null);
    const [totalRanked, setTotalRanked] = useState<number | null>(null);

    useEffect(() => {
        if (!uid) return;
        // Top 100 — same source as the leaderboard. Larger queries cost more
        // reads; if community grows past 1k we'd switch to a server function.
        const q = query(collection(db, 'publicProfiles'), orderBy('activityScore', 'desc'), limit(100));
        const unsub = onSnapshot(q, (snap) => {
            const ids = snap.docs.map(d => d.id);
            const idx = ids.indexOf(uid);
            setRank(idx >= 0 ? idx + 1 : null);
            setTotalRanked(snap.size);
        }, () => { /* ignore — rank is informational */ });
        return unsub;
    }, [uid]);

    const level = levelFromScore(score);
    const xpPct = levelProgress(score);
    const days = weekDates();
    const todayKey = dayKey(new Date());

    // Streak ring math: cap at 30 days for the visual, full number stays in label.
    const ringPct = Math.min(100, (currentStreak / Math.max(30, bestStreak || 1)) * 100);
    // Streak ring — animated angle fill on mount.
    // The conic-gradient angle is set as a CSS custom property; a one-shot
    // CSS keyframe ramps it from 0deg to the target on mount, then transitions
    // smoothly on subsequent value changes.
    const ringStyle: React.CSSProperties & { ['--bzt-ring-angle']?: string } = {
        width: 88, height: 88, borderRadius: '50%', position: 'relative',
        '--bzt-ring-angle': `${ringPct * 3.6}deg`,
        background: `conic-gradient(${t.primary} var(--bzt-ring-angle), rgb(var(--surface-container-highest)) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'background 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: 'bzt-ring-fill 1.1s cubic-bezier(0.16, 1, 0.3, 1) both',
    };

    const rankLabel = rank
        ? (totalRanked && totalRanked > rank ? `#${rank} ${tx('ofLabel') || 'of'} ${totalRanked}+` : `#${rank}`)
        : (score > 0 ? '100+' : '—');

    return (
        <Card variant="bright" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            {/* Ambient backdrop — habit-tracker journal photo at low opacity
                so the calendar/streak/standing data on top stays readable.
                Acts as visual identity, not a hero. */}
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/tile-week-status.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.14,
                pointerEvents: 'none',
            }} />
            {/* Surface tint on top so the data overlays don't fight the photo. */}
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, rgb(var(--surface-bright) / 0.78), rgb(var(--surface-container-low) / 0.92))`,
                pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
            {/* ── Calendar strip ─────────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                padding: '20px 24px',
                borderBottom: `1px solid ${t.outline}`,
                gap: 8,
            }}>
                {days.map((d, i) => {
                    const k = dayKey(d);
                    const isToday = k === todayKey;
                    const hasLog = loggedDates.has(k);
                    const dayLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
                    return (
                        <div
                            key={k}
                            className="bzt-rise-in"
                            style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 6,
                                animationDelay: `${i * 35}ms`,
                            }}
                        >
                            <span style={{
                                fontFamily: t.body, fontSize: 10, fontWeight: 600,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: t.onSurfaceMuted,
                            }}>{dayLabel}</span>
                            <div
                                className={isToday ? 'bzt-pulse-soft' : ''}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isToday ? goldGradient : 'transparent',
                                    border: isToday ? 'none' : `1px solid ${t.outline}`,
                                    color: isToday ? t.onPrimaryFixed : t.onSurfaceVariant,
                                    fontFamily: t.display, fontSize: 13, fontWeight: 600,
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            >
                                {d.getDate()}
                            </div>
                            <div style={{
                                width: hasLog ? 5 : 4, height: hasLog ? 5 : 4, borderRadius: '50%',
                                background: hasLog ? t.primary : 'transparent',
                                boxShadow: hasLog ? `0 0 6px rgb(var(--primary) / 0.55)` : 'none',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            }} />
                        </div>
                    );
                })}
            </div>

            {/* ── Combined status ────────────────────────────────── */}
            <div style={{
                padding: '24px',
                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
                {/* Streak ring */}
                <div style={ringStyle}>
                    <div style={{
                        position: 'absolute', inset: 4, borderRadius: '50%',
                        background: t.surfaceBright,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontFamily: t.display, fontSize: 28, fontWeight: 600, color: t.onSurface, lineHeight: 1 }}>
                            {currentStreak}
                        </span>
                        <span style={{ fontFamily: t.body, fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.onSurfaceMuted }}>
                            {tx('daysUnit')}
                        </span>
                    </div>
                </div>

                {/* Level + XP + meta */}
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <div>
                            <div style={{
                                fontFamily: t.body, fontSize: 11, fontWeight: 600,
                                letterSpacing: '0.16em', textTransform: 'uppercase', color: t.onSurfaceMuted,
                            }}>
                                {tx('levelLabel')}
                            </div>
                            <div style={{
                                fontFamily: t.display, fontSize: 22, fontWeight: 600, color: t.onSurface,
                                lineHeight: 1.1, letterSpacing: '-0.02em',
                            }}>
                                {level}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                fontFamily: t.body, fontSize: 11, fontWeight: 600,
                                letterSpacing: '0.16em', textTransform: 'uppercase', color: t.onSurfaceMuted,
                            }}>
                                {tx('yourStanding')}
                            </div>
                            <div
                                onClick={isCoach ? () => onNavigate('/leaderboard') : undefined}
                                style={{
                                    fontFamily: t.display, fontSize: 22, fontWeight: 600, color: t.primary,
                                    lineHeight: 1.1, letterSpacing: '-0.02em',
                                    cursor: isCoach ? 'pointer' : 'default',
                                }}
                            >
                                {rankLabel}
                            </div>
                        </div>
                    </div>

                    {/* XP progress bar */}
                    <div style={{
                        marginTop: 10, height: 6, background: t.surfaceContainerHighest,
                        borderRadius: 999, overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 999, width: `${xpPct}%`,
                            background: goldGradient,
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }} />
                    </div>

                    <div style={{
                        marginTop: 10, fontFamily: t.body, fontSize: 12,
                        color: t.onSurfaceVariant,
                        display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                    }}>
                        <span>{score.toLocaleString()} {tx('xpUnit')} · {xpPct}% {tx('xpToNext')}</span>
                        <span>{logCount} {tx('logsLabel')} · {tx('bestPrefix')} {bestStreak} {tx('daysUnit')}</span>
                    </div>
                </div>
            </div>
            </div>
        </Card>
    );
}

// ─── Progress CTA — points users to /profile for the data dump ─────────
// Now ships with a mini sparkline visual so it reads as "progress over time"
// instead of "yet another card." Sparkline data is optional — if no weight
// history is passed, the card falls back to a static gradient pill.
export function ProgressCTA({ onNavigate, weightHistory }: {
    onNavigate: (path: string) => void;
    weightHistory?: number[]; // ordered oldest → newest, ≥ 2 points required to render the line
}) {
    const { t: tx } = useLanguage();
    const points = (weightHistory ?? []).filter(n => typeof n === 'number' && n > 0);
    const hasLine = points.length >= 2;

    return (
        <div
            onClick={() => onNavigate('/update')}
            className="bzt-hero-card"
            style={{
                position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                minHeight: 220, padding: 0,
                border: `1px solid ${t.outline}`, boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Photo backdrop — notebook + tape measure + scale, evokes
                tracking. Replaces the sparkline preview that was here. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/dashboard-covers/tile-progress.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
            {/* Bottom-darkening scrim for text legibility. */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
            }} />

            {/* Bottom-anchored content — one line of copy + CTA. The photo
                does the storytelling that the inside-rows list used to. */}
            <div style={{
                position: 'relative', zIndex: 1, padding: 24,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                minHeight: 220,
            }}>
                <div style={{
                    fontFamily: t.body, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: '#e6c364', marginBottom: 6,
                }}>
                    {tx('progressEyebrow')}
                </div>
                <h2 style={{
                    fontFamily: t.display, fontSize: 22, fontWeight: 600,
                    color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}>
                    {tx('viewProgressCta')}
                </h2>
                <PurposeLine>Your weight trend, photos, and measurements over time.</PurposeLine>
                <p style={{
                    fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)',
                    margin: '0 0 14px',
                }}>
                    {hasLine
                        ? `${points.length} ${tx('logsLabel')?.toLowerCase() ?? 'logs'}`
                        : (tx('progressEmptyHint') ?? 'Log your first weight to see your trend take shape.')}
                </p>
                <span style={{
                    alignSelf: 'flex-start',
                    padding: pillPad, borderRadius: 999,
                    background: goldGradient, color: t.onPrimaryFixed,
                    fontFamily: t.body, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>{tx('openMyProgress') ?? 'Open my progress'}</span>
            </div>
        </div>
    );
}
