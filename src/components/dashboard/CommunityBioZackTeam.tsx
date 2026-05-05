import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSelfLogs } from '../../hooks/useSelfLogs';
import { useActiveProgram } from '../../hooks/useActiveProgram';
import { useAcademy } from '../../context/AcademyContext';
import { useCommunity } from '../../context/CommunityContext';
import { levelFromScore, levelProgress } from '../../lib/activityScore';
import {
    t, goldGradient,
    Eyebrow, MetricCard,
    ContinueAcademyCard, TodayWorkoutCard, CommunityActivityCard, ProgressCTA, YourStandingCard,
} from './biozackteam/shared';

// ─── Header (community variant — weight delta tagline) ──────────────────
function Header({ name, initials, currentWeight, startWeight, goalWeight }: {
    name: string; initials: string; currentWeight: number; startWeight: number; goalWeight: number;
}) {
    const { t: tx } = useLanguage();
    const delta = (startWeight - currentWeight).toFixed(1);
    const pct = goalWeight !== startWeight
        ? Math.round(((startWeight - currentWeight) / (startWeight - goalWeight)) * 100)
        : 0;
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 24, marginBottom: 40, paddingLeft: 12,
        }}>
            <div style={{ maxWidth: 700 }}>
                <Eyebrow>{tx('biozackTeamSelfTracked')}</Eyebrow>
                <h1 style={{
                    fontFamily: t.display, fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.03em',
                    color: t.onSurface, margin: '12px 0 0',
                }}>
                    {tx('welcomeBack')},{' '}
                    <span style={{
                        fontWeight: 600, background: goldGradient,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>{name}</span>
                </h1>
                <p style={{ fontFamily: t.body, fontSize: 14, color: t.onSurfaceVariant, marginTop: 10, letterSpacing: '0.01em' }}>
                    {startWeight > 0 ? `${delta} ${tx('kgUnit')} · ${pct}% ${tx('toGoalLabel')}` : tx('logFirstWeight')}
                </p>
            </div>
            <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: t.surfaceContainerHighest, border: `1px solid ${t.outline}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.display, fontSize: 18, fontWeight: 500,
                color: t.primary, letterSpacing: '0.04em',
            }}>{initials}</div>
        </div>
    );
}

// ═══ MAIN ═══════════════════════════════════════════════════════════════
export const CommunityBioZackTeam = () => {
    const { user } = useAuth();
    const { t: tx } = useLanguage();
    const navigate = useNavigate();
    const { logs } = useSelfLogs();
    const { activeProgram, getTodaysDay, todaysDayNumber } = useActiveProgram();
    const { courses, userProgress } = useAcademy();
    const { posts } = useCommunity();

    const sortedByDate = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);

    const weightHistory = useMemo(
        () => sortedByDate
            .filter(l => typeof l.weight === 'number')
            .map(l => ({ weight: l.weight as number })),
        [sortedByDate]
    );

    const startWeight = weightHistory[0]?.weight ?? 0;
    const currentWeight = weightHistory[weightHistory.length - 1]?.weight ?? 0;
    const goalWeight = startWeight > 0 ? Math.round(startWeight * 0.9) : 0;

    // Real activity score + streak from the user doc (lib/activityScore.ts)
    const xp = user?.activityScore ?? 0;
    const level = levelFromScore(xp);
    const xpPct = levelProgress(xp);
    const currentStreak = user?.streak?.current ?? 0;
    const bestStreak = user?.streak?.best ?? 0;

    const name = user?.name?.split(' ')[0] ?? tx('athleteFallback');
    const initials = (user?.name ?? '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'ME';

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

            {/* 2. Stats row */}
            <div style={{
                display: 'grid', gap: 16, marginBottom: 32,
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}>
                <MetricCard label={tx('currentStreakLabel')} value={currentStreak} unit={tx('daysUnit')} sub={`${tx('bestPrefix')} ${bestStreak} ${tx('daysUnit')}`} hero />
                <MetricCard label={tx('levelLabel')} value={level} sub={`${xp} ${tx('xpUnit')} · ${xpPct}% ${tx('xpToNext')}`} />
                <MetricCard label={tx('logsLabel')} value={logs.length} sub={tx('allTimeLabel')} />
            </div>

            {/* 3. Continue Academy */}
            <div style={{ marginBottom: 24 }}>
                <ContinueAcademyCard courses={courses} userProgress={userProgress} onNavigate={navigate} />
            </div>

            {/* 4. Today's Workout */}
            <div style={{ marginBottom: 24 }}>
                <TodayWorkoutCard
                    activeProgram={activeProgram}
                    getTodaysDay={getTodaysDay}
                    todaysDayNumber={todaysDayNumber}
                    onNavigate={navigate}
                />
            </div>

            {/* 5. Your Standing (private rank widget) */}
            <div style={{ marginBottom: 24 }}>
                <YourStandingCard
                    uid={user?.id}
                    score={xp}
                    isCoach={user?.role === 'coach' || user?.role === 'admin'}
                    onNavigate={navigate}
                />
            </div>

            {/* 6. Community Activity */}
            <div style={{ marginBottom: 32 }}>
                <CommunityActivityCard posts={posts.slice(0, 3)} onNavigate={navigate} />
            </div>

            {/* 7. Progress CTA */}
            <ProgressCTA onNavigate={navigate} />
        </div>
    );
};
