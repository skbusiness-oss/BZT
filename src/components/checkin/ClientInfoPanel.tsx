/**
 * ClientInfoPanel — premium modal with full client profile.
 * Sections: Streak & Score, Personal Info, Membership, Workout Days,
 * Latest Check-in, Activity Reports chart, Photos.
 * Triggered from CoachReview's "Info" button. BioZackTeam-styled.
 */
import { useMemo } from 'react';
import { Client, Week } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
    X, User, Target, Calendar, Scale, Flame, Activity, Shield, Zap,
    TrendingUp, Camera, Crown, BarChart3, Clock, CreditCard,
    CheckCircle2, XCircle, Mail, Phone,
} from 'lucide-react';

interface Props {
    client: Client;
    weeks: Week[];
    onClose: () => void;
}

const ageFromBirthdate = (iso?: string): number | null => {
    if (!iso) return null;
    const birth = new Date(iso);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export const ClientInfoPanel = ({ client, weeks, onClose }: Props) => {
    const { t: tStrict } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;

    const age = ageFromBirthdate(client.birthdate);

    // ── Derived data ───────────────────────────────────────────────────────
    const activeWeeks = useMemo(
        () => weeks.filter(w => w.weekNumber > 0).sort((a, b) => a.weekNumber - b.weekNumber),
        [weeks]
    );

    const latestActiveWeek = useMemo(
        () => [...activeWeeks]
            .reverse()
            .find(w => w.minWeight || w.hungerScale || w.energyScale || w.strengthScale || w.cardioCalories || w.photos),
        [activeWeeks]
    );

    const week0 = weeks.find(w => w.weekNumber === 0);
    const startWeight = parseFloat(client.intakeData?.startingWeight || '0') || 0;
    const currentWeight = latestActiveWeek?.minWeight ?? startWeight;
    const weightDelta = startWeight ? (startWeight - currentWeight) : 0;

    // Submitted check-ins count
    const submittedWeeks = activeWeeks.filter(w => w.status === 'submitted' || w.status === 'reviewed' || w.status === 'locked');

    // Streak: consecutive submitted weeks from the latest backwards
    const streak = useMemo(() => {
        let count = 0;
        for (let i = activeWeeks.length - 1; i >= 0; i--) {
            const s = activeWeeks[i].status;
            if (s === 'submitted' || s === 'reviewed' || s === 'locked') {
                count++;
            } else {
                break;
            }
        }
        return count;
    }, [activeWeeks]);

    // Membership duration
    const memberSince = client.intakeData?.submittedAt ? new Date(client.intakeData.submittedAt) : null;
    const memberDays = memberSince ? Math.floor((Date.now() - memberSince.getTime()) / 86_400_000) : 0;
    const memberWeeksCount = Math.floor(memberDays / 7);

    // Progress % through program
    const progressPct = client.programLength > 0 ? Math.round((client.currentWeek / client.programLength) * 100) : 0;

    // Activity data for mini chart (weekly check-in submission — bar chart)
    const activityData = useMemo(() => {
        return activeWeeks.map(w => ({
            week: w.weekNumber,
            submitted: w.status === 'submitted' || w.status === 'reviewed' || w.status === 'locked',
            weight: w.minWeight ?? 0,
            strength: w.strengthScale ?? 0,
            energy: w.energyScale ?? 0,
        }));
    }, [activeWeeks]);

    // Photos
    const photoMap: Record<'front' | 'side' | 'back', string | undefined> = {
        front: latestActiveWeek?.photos?.front || week0?.photos?.front || client.intakeData?.frontPhoto,
        side: latestActiveWeek?.photos?.side || week0?.photos?.side || client.intakeData?.sidePhoto,
        back: latestActiveWeek?.photos?.back || week0?.photos?.back || client.intakeData?.backPhoto,
    };
    const hasPhotos = Object.values(photoMap).some(Boolean);

    // Max bar height for chart
    const maxWeight = Math.max(...activityData.map(d => d.weight), 1);

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="clay-card w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
                style={{ background: 'linear-gradient(145deg, rgba(14,19,56,0.6), rgba(6,8,20,0.96))' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 sticky top-0 z-10" style={{ background: 'linear-gradient(180deg, rgba(14,19,56,0.95), rgba(14,19,56,0.7))' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">{client.name}</h2>
                            <p className="text-xs text-on-surface/70 uppercase tracking-wider">
                                {t('clientInfo') ?? 'Client info'} · {t('week') ?? 'Week'} {client.currentWeek}/{client.programLength}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-on-surface/70 hover:text-on-surface p-1">
                        <X size={22} />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-6">

                    {/* ═══ STREAK & SCORE ═══ */}
                    <section>
                        <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                            <Crown size={14} className="text-primary" /> {t('streakAndScore') ?? 'Streak & Score'}
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="clay-inset p-4 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                                <div className="text-3xl font-black text-primary relative">{streak}</div>
                                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1 relative">
                                    🔥 {t('weekStreak') ?? 'Week streak'}
                                </div>
                            </div>
                            <div className="clay-inset p-4 text-center">
                                <div className="text-3xl font-black text-cyan-400">{submittedWeeks.length}</div>
                                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                                    ✅ {t('checkInsSubmitted') ?? 'Check-ins'}
                                </div>
                            </div>
                            <div className="clay-inset p-4 text-center">
                                <div className="text-3xl font-black text-emerald-400">{progressPct}%</div>
                                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                                    📊 {t('programProgress') ?? 'Progress'}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ═══ PERSONAL INFO ═══ */}
                    <section>
                        <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                            <User size={14} className="text-primary" /> {t('personalInfo') ?? 'Personal Info'}
                        </h3>
                        {/* Contact row — tap-to-call/email so coach can reach
                            the client during the review session itself. */}
                        {(client.email || client.phone) && (
                            <div className="clay-inset p-3 mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                                {client.email && (
                                    <a
                                        href={`mailto:${client.email}`}
                                        className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
                                        title={client.email}
                                    >
                                        <Mail size={14} className="text-primary shrink-0" />
                                        <span className="truncate max-w-[260px]">{client.email}</span>
                                    </a>
                                )}
                                {client.phone && (
                                    <a
                                        href={`tel:${client.phone}`}
                                        className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
                                        dir="ltr"
                                    >
                                        <Phone size={14} className="text-primary shrink-0" />
                                        <span>{client.phone}</span>
                                    </a>
                                )}
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <Stat label={t('age') ?? 'Age'} value={age !== null ? `${age}` : '--'} />
                            <Stat
                                label={t('gender') ?? 'Gender'}
                                value={client.gender ? `${client.gender === 'male' ? '♂' : '♀'} ${t(client.gender) ?? client.gender}` : '--'}
                            />
                            <Stat label={t('height') ?? 'Height'} value={client.intakeData?.height ? `${client.intakeData.height} cm` : '--'} />
                            <Stat label={t('startingWeight') ?? 'Start'} value={startWeight ? `${startWeight} kg` : '--'} />
                            <Stat
                                label={t('currentWeight') ?? 'Current'}
                                value={currentWeight ? `${currentWeight} kg` : '--'}
                                accent
                            />
                            <Stat
                                label={t('totalChange') ?? 'Δ'}
                                value={weightDelta ? `${weightDelta > 0 ? '-' : '+'}${Math.abs(weightDelta).toFixed(1)} kg` : '--'}
                                positive={weightDelta > 0}
                            />
                        </div>
                        {client.intakeData?.injuries && (
                            <div className="mt-3 clay-inset p-3 text-sm text-on-surface">
                                <span className="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">⚠️ {t('injuries') ?? 'Injuries / Notes'}</span>
                                {client.intakeData.injuries}
                            </div>
                        )}
                    </section>

                    {/* ═══ MEMBERSHIP INFO ═══ */}
                    <section>
                        <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard size={14} className="text-primary" /> {t('membership') ?? 'Membership'}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="clay-inset p-3">
                                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Shield size={11} /> {t('planTier') ?? 'Tier'}
                                </div>
                                <div className="text-base font-bold text-on-surface capitalize">
                                    {(client.accessLevel ?? 'client') === 'client' ? `🏋️ Coaching` : `👥 Community`}
                                </div>
                            </div>
                            <div className="clay-inset p-3">
                                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Target size={11} /> {t('category') ?? 'Category'}
                                </div>
                                <div className="text-base font-bold text-on-surface capitalize">{client.category}</div>
                            </div>
                            <div className="clay-inset p-3">
                                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Calendar size={11} /> {t('memberSince') ?? 'Member since'}
                                </div>
                                <div className="text-base font-bold text-on-surface">
                                    {memberSince ? memberSince.toLocaleDateString() : '--'}
                                </div>
                            </div>
                            <div className="clay-inset p-3">
                                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Clock size={11} /> {t('duration') ?? 'Duration'}
                                </div>
                                <div className="text-base font-bold text-on-surface">
                                    {memberWeeksCount > 0 ? `${memberWeeksCount} wk` : `${memberDays}d`}
                                </div>
                            </div>
                        </div>
                        {/* Program bar */}
                        <div className="mt-3 clay-inset p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">{t('programProgress') ?? 'Program progress'}</span>
                                <span className="text-sm font-bold text-primary">{client.currentWeek}/{client.programLength}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progressPct}%`,
                                        background: 'linear-gradient(90deg, #ffd740, #f59e0b)',
                                    }}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ═══ LATEST CHECK-IN ═══ */}
                    {latestActiveWeek && (
                        <section>
                            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                                <Activity size={14} className="text-primary" /> {t('latestCheckIn') ?? 'Latest check-in'}
                                <span className="text-on-surface-variant normal-case font-normal">· {t('week')} {latestActiveWeek.weekNumber}</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <ScaleStat icon={<Scale size={14} />} label={t('weight') ?? 'Weight'} value={latestActiveWeek.minWeight ? `${latestActiveWeek.minWeight} kg` : '--'} color="text-primary" />
                                <ScaleStat icon={<Shield size={14} />} label={t('strengthScale') ?? 'Strength'} value={latestActiveWeek.strengthScale ? `${latestActiveWeek.strengthScale}/10` : '--'} color="text-cyan-400" />
                                <ScaleStat icon={<Zap size={14} />} label={t('energyScale') ?? 'Energy'} value={latestActiveWeek.energyScale ? `${latestActiveWeek.energyScale}/10` : '--'} color="text-yellow-400" />
                                <ScaleStat icon={<Flame size={14} />} label={t('cardioCalories') ?? 'Cardio'} value={latestActiveWeek.cardioCalories ? `${latestActiveWeek.cardioCalories}` : '--'} color="text-orange-400" />
                            </div>
                        </section>
                    )}

                    {/* ═══ MY REPORTS — Activity Chart ═══ */}
                    {activityData.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                                <BarChart3 size={14} className="text-primary" /> {t('myReports') ?? 'My Reports'}
                            </h3>

                            {/* Weight trend chart */}
                            <div className="clay-inset p-4 rounded-xl">
                                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-3">
                                    {t('weightOverTime') ?? 'Weight over time (kg)'}
                                </div>
                                <div className="flex items-end gap-1 h-24">
                                    {activityData.map(d => {
                                        const h = d.weight > 0 ? Math.max((d.weight / maxWeight) * 100, 8) : 4;
                                        return (
                                            <div key={d.week} className="flex-1 flex flex-col items-center gap-1" title={`W${d.week}: ${d.weight || '--'} kg`}>
                                                <div
                                                    className="w-full rounded-t transition-all duration-300"
                                                    style={{
                                                        height: `${h}%`,
                                                        background: d.weight > 0
                                                            ? 'linear-gradient(180deg, #ffd740, #f59e0b)'
                                                            : 'rgba(255,255,255,0.05)',
                                                        minHeight: 3,
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-1 mt-1">
                                    {activityData.map(d => (
                                        <div key={d.week} className="flex-1 text-center text-[8px] text-on-surface-variant/60">{d.week}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Check-in submission timeline */}
                            <div className="clay-inset p-4 rounded-xl mt-3">
                                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-3">
                                    {t('checkInTimeline') ?? 'Check-in submission timeline'}
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {activityData.map(d => (
                                        <div
                                            key={d.week}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                                            style={{
                                                background: d.submitted
                                                    ? 'rgba(52, 211, 153, 0.1)'
                                                    : 'rgba(255, 255, 255, 0.03)',
                                            }}
                                        >
                                            {d.submitted
                                                ? <CheckCircle2 size={12} className="text-emerald-400" />
                                                : <XCircle size={12} className="text-on-surface-variant/40" />
                                            }
                                            <span className={d.submitted ? 'text-emerald-300' : 'text-on-surface-variant/40'}>
                                                W{d.week}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strength + Energy mini sparklines */}
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <MiniSparkline
                                    label={t('strengthScale') ?? 'Strength'}
                                    data={activityData.map(d => d.strength)}
                                    color="#22d3ee"
                                    icon={<Shield size={12} />}
                                />
                                <MiniSparkline
                                    label={t('energyScale') ?? 'Energy'}
                                    data={activityData.map(d => d.energy)}
                                    color="#facc15"
                                    icon={<Zap size={12} />}
                                />
                            </div>
                        </section>
                    )}

                    {/* ═══ PHOTOS ═══ */}
                    {hasPhotos && (
                        <section>
                            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                                <Camera size={14} className="text-primary" /> {t('photos') ?? 'Photos'}
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {(['front', 'side', 'back'] as const).map(angle => (
                                    photoMap[angle] ? (
                                        <div key={angle} className="aspect-[3/4] rounded-xl overflow-hidden relative">
                                            <img src={photoMap[angle]} alt={angle} className="w-full h-full object-cover" />
                                            <div className="absolute top-1 left-1 px-2 py-0.5 rounded bg-black/60 text-xs text-on-surface capitalize">{angle}</div>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Quick summary line */}
                    {weightDelta > 0 && (
                        <div className="clay-inset p-3 rounded-lg flex items-center gap-2 text-emerald-400">
                            <TrendingUp size={16} />
                            <span className="text-sm font-medium">
                                {t('downSinceStart')?.replace('{kg}', weightDelta.toFixed(1)) ?? `Down ${weightDelta.toFixed(1)} kg since start.`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function Stat({ label, value, accent, positive }: { label: string; value: string; accent?: boolean; positive?: boolean }) {
    return (
        <div className="clay-inset p-3">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">{label}</div>
            <div className={
                accent ? 'text-lg font-bold text-primary'
                : positive ? 'text-lg font-bold text-emerald-400'
                : 'text-lg font-bold text-on-surface'
            }>{value}</div>
        </div>
    );
}

function ScaleStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="clay-inset p-3">
            <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-1 ${color}`}>
                {icon} {label}
            </div>
            <div className="text-lg font-bold text-on-surface">{value}</div>
        </div>
    );
}

function MiniSparkline({ label, data, color, icon }: { label: string; data: number[]; color: string; icon: React.ReactNode }) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
        const y = 100 - (v / max) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="clay-inset p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2" style={{ color }}>
                {icon} {label}
            </div>
            <svg viewBox="0 0 100 50" className="w-full h-8" preserveAspectRatio="none">
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                {data.map((v, i) => {
                    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                    const y = 100 - (v / max) * 80 - 10;
                    return v > 0 ? (
                        <circle key={i} cx={x} cy={y} r="2" fill={color} />
                    ) : null;
                })}
            </svg>
            <div className="flex justify-between text-[8px] text-on-surface-variant/60 mt-1">
                <span>W1</span>
                <span>W{data.length}</span>
            </div>
        </div>
    );
}
