import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSelfLogs } from '../../hooks/useSelfLogs';
import { useWeeklyCheckIns } from '../../hooks/useWeeklyCheckIns';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import { useAcademy } from '../../context/AcademyContext';
import { useCommunity } from '../../context/CommunityContext';
import { useAssignedDiet } from '../../hooks/useAssignedDiet';
import {
    t, goldGradient,
    WeekStatusPanel,
    ContinueAcademyCard, TodayWorkoutCard, TodayDietCard, CommunityActivityCard, ProgressCTA,
    DashboardChapter,
} from './biozackteam/shared';
import { CalendarCheck, Flame } from 'lucide-react';

// ─── Header (community variant — time-of-day greeting + weight progress chip) ──
function getGreetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'goodMorning';
    if (hour < 18) return 'goodAfternoon';
    return 'goodEvening';
}

function todayDisplay(lang: string) {
    return new Date().toLocaleDateString(lang === 'ar' ? 'ar' : undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

function Header({ name, initials, currentWeight, startWeight, goalWeight }: {
    name: string; initials: string; currentWeight: number; startWeight: number; goalWeight: number;
}) {
    const { t: tx, lang } = useLanguage();
    const delta = (startWeight - currentWeight).toFixed(1);
    const isLosing = startWeight > 0 && goalWeight > 0 && goalWeight < startWeight;
    const pct = goalWeight !== startWeight
        ? Math.round(((startWeight - currentWeight) / (startWeight - goalWeight)) * 100)
        : 0;
    const greeting = tx(getGreetingKey());
    const today = todayDisplay(lang);

    return (
        <div
            className="bzt-rise-in"
            style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 24, marginBottom: 40, paddingLeft: 4,
            }}
        >
            <div style={{ maxWidth: 720, minWidth: 0, flex: 1 }}>
                {/* Eyebrow — date with thin accent line, sets the editorial tone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span
                        aria-hidden
                        style={{
                            display: 'block', width: 24, height: 1,
                            background: `linear-gradient(90deg, ${t.primary}, transparent)`,
                        }}
                    />
                    <span style={{
                        fontFamily: t.body, fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: t.onSurfaceVariant,
                    }}>
                        {today}
                    </span>
                </div>

                {/* The greeting — clean two-line block. Greeting in surface color,
                    name as the single gradient-text element on this surface. */}
                <h1 style={{
                    fontFamily: t.display,
                    fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                    fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.035em',
                    color: t.onSurface, margin: 0,
                }}>
                    <span style={{ display: 'block', fontWeight: 300 }}>{greeting},</span>
                    <span
                        style={{
                            fontWeight: 600,
                            background: goldGradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            display: 'inline-block',
                        }}
                    >
                        {name}
                    </span>
                </h1>

                {/* Status — a tighter chip instead of plain text. Shows weight
                    delta + % to goal when there's data, otherwise a quiet
                    "log first weight" prompt. */}
                <div style={{ marginTop: 18 }}>
                    {startWeight > 0 ? (
                        <div
                            className="bzt-rise-in"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 12,
                                padding: '8px 14px 8px 12px', borderRadius: 999,
                                background: t.surfaceContainerLow,
                                border: `1px solid ${t.outline}`,
                                animationDelay: '180ms',
                            }}
                        >
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: isLosing ? '#10b981' : t.primary,
                                boxShadow: `0 0 8px ${isLosing ? 'rgb(16 185 129 / 0.6)' : 'rgb(var(--primary) / 0.55)'}`,
                            }} />
                            <span style={{
                                fontFamily: t.body, fontSize: 13, fontWeight: 600,
                                color: t.onSurface,
                            }}>
                                {isLosing ? '−' : '+'}{Math.abs(parseFloat(delta))} {tx('kgUnit')}
                            </span>
                            <span style={{
                                width: 1, height: 14, background: t.outline,
                            }} />
                            <span style={{
                                fontFamily: t.body, fontSize: 13, fontWeight: 500,
                                color: t.onSurfaceVariant,
                            }}>
                                <span style={{ color: t.primary, fontWeight: 700 }}>{pct}%</span>{' '}
                                {tx('toGoalLabel')}
                            </span>
                        </div>
                    ) : (
                        <p style={{
                            fontFamily: t.body, fontSize: 14, color: t.onSurfaceVariant,
                            margin: 0, letterSpacing: '0.01em',
                        }}>
                            {tx('logFirstWeight')}
                        </p>
                    )}
                </div>
            </div>

            {/* Avatar — slightly bigger, ringed in primary on hover */}
            <div
                className="bzt-rise-in"
                style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: t.surfaceContainerHighest,
                    border: `1px solid ${t.outline}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: t.display, fontSize: 20, fontWeight: 600,
                    color: t.primary, letterSpacing: '0.04em',
                    flexShrink: 0,
                    boxShadow: `0 8px 24px rgb(0 0 0 / 0.20), inset 0 0 0 1px rgb(var(--primary) / 0.08)`,
                    animationDelay: '80ms',
                }}
            >{initials}</div>
        </div>
    );
}

// ═══ MAIN ═══════════════════════════════════════════════════════════════
function WeeklyUpdateReminderCard({ locked, lastDate, nextDate, onNavigate }: {
    locked: boolean;
    lastDate?: string | null;
    nextDate?: string | null;
    onNavigate: (path: string) => void;
}) {
    const { t: tx } = useLanguage();
    const fmt = (iso?: string | null) =>
        iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

    return (
        <button
            type="button"
            onClick={() => onNavigate('/update')}
            className="bzt-rise-in"
            style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: 18,
                borderRadius: 18,
                background: locked ? t.surfaceContainerLow : 'rgb(var(--primary) / 0.10)',
                border: `1px solid ${locked ? t.outline : 'rgb(var(--primary) / 0.35)'}`,
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: locked ? t.surfaceContainerHighest : goldGradient,
                    color: locked ? t.primary : t.onPrimaryFixed,
                    flexShrink: 0,
                }}>
                    {locked ? <CalendarCheck size={20} /> : <Flame size={20} />}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{
                        fontFamily: t.body,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: locked ? t.onSurfaceVariant : t.primary,
                    }}>
                        Weekly update
                    </div>
                    <div style={{
                        marginTop: 4,
                        fontFamily: t.display,
                        fontSize: 18,
                        fontWeight: 600,
                        color: t.onSurface,
                        letterSpacing: '-0.01em',
                    }}>
                        {locked ? `Logged ${fmt(lastDate)}` : 'Log weight, signals, and cardio'}
                    </div>
                    <p style={{ margin: '4px 0 0', fontFamily: t.body, fontSize: 12, color: t.onSurfaceVariant }}>
                        {locked ? `Next update opens ${fmt(nextDate)}` : 'Takes one minute and updates your charts.'}
                    </p>
                </div>
            </div>
            <span style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: 999,
                background: locked ? t.surfaceContainerHighest : goldGradient,
                color: locked ? t.onSurfaceVariant : t.onPrimaryFixed,
                fontFamily: t.body,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
            }}>
                {locked ? tx('view') : 'Log cardio'}
            </span>
        </button>
    );
}

export const CommunityBioZackTeam = () => {
    const { user } = useAuth();
    const { t: tx } = useLanguage();
    const navigate = useNavigate();
    const { logs } = useSelfLogs();
    const { weighIns } = useWeeklyCheckIns();
    const { activeProgram, getTodaysDay, todaysDayNumber } = useActiveProgram();
    const { assignedDietId, snapshot: assignedDietSnapshot } = useAssignedDiet();
    const { courses, userProgress, lessons, loadLessons } = useAcademy();
    const { posts } = useCommunity();

    const sortedByDate = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);

    const weightHistory = useMemo(
        () => sortedByDate
            .filter(l => typeof l.weight === 'number')
            .map(l => ({ weight: l.weight as number })),
        [sortedByDate]
    );

    // `users/{uid}.startWeightKg` is the immovable anchor (set once at
    // onboarding, never re-written). `users/{uid}.currentWeightKg` is
    // mirrored on every weekly check-in via `useWeeklyCheckIns.submit()`,
    // so it tracks the most recent weigh-in. Both legacy/historical
    // accounts (no `startWeightKg` yet) fall back to the first logged
    // weight, then the onboarding value — the one-shot migration in
    // ProgressPanel will heal these on next mount.
    const startWeight = user?.startWeightKg ?? weightHistory[0]?.weight ?? user?.currentWeightKg ?? 0;
    const currentWeight = weightHistory[weightHistory.length - 1]?.weight ?? user?.currentWeightKg ?? 0;
    const goalWeight = user?.targetWeightKg ?? 0;

    // Real activity score + streak from the user doc (lib/activityScore.ts)
    const xp = user?.activityScore ?? 0;
    const currentStreak = user?.streak?.current ?? 0;
    const bestStreak = user?.streak?.best ?? 0;

    // Set of YYYY-MM-DD dates where the user logged something — feeds the
    // calendar strip's "logged" dot indicator.
    const loggedDates = useMemo(
        () => new Set(logs.map(l => l.date).filter(Boolean) as string[]),
        [logs]
    );

    const name = user?.name?.split(' ')[0] ?? tx('athleteFallback');
    const initials = (user?.name ?? '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'ME';
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastWeeklyDate = useMemo(
        () => [...weighIns].map(w => w.date).sort((a, b) => b.localeCompare(a))[0] ?? null,
        [weighIns]
    );
    const nextWeeklyDate = useMemo(() => {
        if (!lastWeeklyDate) return null;
        const d = new Date(lastWeeklyDate);
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    }, [lastWeeklyDate]);
    const updateLocked = !!nextWeeklyDate && nextWeeklyDate > todayKey;

    return (
        <div style={{ fontFamily: t.body, color: t.onSurface, padding: '8px 0 40px' }}>
            {/* 1. Welcome */}
            <Header
                name={name}
                initials={initials}
                currentWeight={currentWeight}
                startWeight={startWeight}
                goalWeight={goalWeight}
            />

            {/* Weekly-update reminder — stays at the top because it's
                a TIMING notice, not a routine card. */}
            <div style={{ marginBottom: 24 }}>
                <WeeklyUpdateReminderCard
                    locked={updateLocked}
                    lastDate={lastWeeklyDate}
                    nextDate={nextWeeklyDate}
                    onNavigate={navigate}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 1 — TODAY'S ACTIONS
                The training + nutrition the user does today.
            ════════════════════════════════════════════════ */}
            <DashboardChapter
                index={1}
                title="Today"
                subtitle="What to do right now — train, eat, repeat."
            />

            <div style={{ marginBottom: 16 }}>
                <TodayWorkoutCard
                    activeProgram={activeProgram}
                    getTodaysDay={getTodaysDay}
                    todaysDayNumber={todaysDayNumber}
                    onNavigate={navigate}
                />
            </div>

            <div style={{ marginBottom: 32 }}>
                <TodayDietCard
                    dietProfile={user?.dietProfile}
                    assignedDietId={assignedDietId}
                    assignedSnapshot={assignedDietSnapshot}
                    onNavigate={navigate}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 2 — YOUR PROGRESS
                Streak, weight trend, where you rank.
            ════════════════════════════════════════════════ */}
            <DashboardChapter
                index={2}
                title="Your progress"
                subtitle="Streak, weight trend, and where you rank — your numbers at a glance."
            />

            <div style={{ marginBottom: 16 }}>
                <WeekStatusPanel
                    uid={user?.id}
                    score={xp}
                    currentStreak={currentStreak}
                    bestStreak={bestStreak}
                    logCount={logs.length}
                    loggedDates={loggedDates}
                    isCoach={user?.role === 'coach' || user?.role === 'admin'}
                    onNavigate={navigate}
                />
            </div>

            <div style={{ marginBottom: 32 }}>
                <ProgressCTA
                    onNavigate={navigate}
                    weightHistory={weightHistory.map(w => w.weight)}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 3 — GROW & CONNECT
                Education + the community feed, last so they
                don't distract from the user's own program first.
            ════════════════════════════════════════════════ */}
            <DashboardChapter
                index={3}
                title="Grow & connect"
                subtitle="Keep learning and see what the rest of the team is doing this week."
            />

            <div style={{ marginBottom: 16 }}>
                <ContinueAcademyCard courses={courses} userProgress={userProgress} lessons={lessons} loadLessons={loadLessons} onNavigate={navigate} />
            </div>

            <CommunityActivityCard posts={posts.slice(0, 3)} onNavigate={navigate} />
        </div>
    );
};

// ─── Section header ────────────────────────────────────────────────
// Groups the dashboard cards into a few clear buckets so the user
// reads the page as "do this now → see your progress → grow." Each
// header carries a one-line subtitle that names the section's purpose
// in plain English — founder direction is that the dashboard should
// explain itself at a glance, not require pattern-matching across
// half-anonymous tiles.
// DashboardSectionHeader — moved to shared.tsx as `DashboardChapter`.
// See the comment in shared.tsx for the redesign rationale (founder
// asked for a bigger, more "chapter intro" treatment).
