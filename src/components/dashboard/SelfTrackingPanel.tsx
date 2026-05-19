import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSelfLogs, BodyMeasurements } from '../../hooks/useSelfLogs';
import { useWeeklyCheckIns } from '../../hooks/useWeeklyCheckIns';
import {
    Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Line, Bar, Legend,
} from 'recharts';
import { Scale, Ruler, Plus, Trash2, Loader2 } from 'lucide-react';

interface Props {
    /** When provided (and not equal to current user), panel renders read-only for coach view-as. */
    targetUserId?: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const SelfTrackingPanel = ({ targetUserId }: Props) => {
    const { t: tStrict } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;
    const { logs, loading, addLog, deleteLog, isOwner } = useSelfLogs(targetUserId);
    // Weekly check-in data — weight + wellbeing scales + cardio kcal.
    // Same uid as the self-log hook (defaults to current user when not
    // overridden). Coach views pass the targetUserId; the hook returns
    // empty arrays for users who never did a weekly check-in.
    const { weighIns, metrics } = useWeeklyCheckIns(targetUserId);

    const [showForm, setShowForm] = useState(false);
    const [date, setDate] = useState(todayISO());
    const [weight, setWeight] = useState('');
    const [measurements, setMeasurements] = useState<BodyMeasurements>({});
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Merged chart series. We have THREE data sources keyed by date:
     *   - self-logs (ad-hoc weigh-ins)
     *   - weighIns (weekly check-in canonical weight)
     *   - metrics  (weekly check-in scales + cardio kcal)
     *
     * Strategy: weight prefers weighIns (more reliable, weekly cadence)
     * and falls back to self-logs for dates where only an ad-hoc weight
     * exists. The scales/cardio come from metrics. Result is a sparse
     * row per date — Recharts handles `undefined` cells by gapping the
     * line (`connectNulls` keeps it continuous for the scale lines).
     */
    const chartData = useMemo(() => {
        const byDate = new Map<string, {
            date: string;
            weight?: number;
            strength?: number;
            hunger?: number;
            energy?: number;
            cardio?: number;
        }>();
        const upsert = (date: string) => {
            const k = date;
            if (!byDate.has(k)) byDate.set(k, { date });
            return byDate.get(k)!;
        };

        for (const l of logs) {
            if (typeof l.weight === 'number') upsert(l.date).weight = l.weight;
        }
        for (const w of weighIns) {
            // Weekly weighIn takes precedence over an ad-hoc selfLog on
            // the same date — the user is more likely to weigh deliberately
            // on a check-in day, so trust that number.
            upsert(w.date).weight = w.weight;
        }
        for (const m of metrics) {
            const row = upsert(m.date);
            if (typeof m.strength === 'number') row.strength = m.strength;
            if (typeof m.hunger === 'number') row.hunger = m.hunger;
            if (typeof m.energy === 'number') row.energy = m.energy;
            if (typeof m.cardioCalories === 'number') row.cardio = m.cardioCalories;
        }

        return [...byDate.values()]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(r => ({ ...r, date: r.date.slice(5) })); // MM-DD x-axis
    }, [logs, weighIns, metrics]);

    const latest = logs.length > 0 ? logs[logs.length - 1] : null;

    const setMeas = (key: keyof BodyMeasurements, v: string) => {
        const num = v === '' ? undefined : parseFloat(v);
        setMeasurements(prev => {
            const next = { ...prev };
            if (num === undefined || Number.isNaN(num)) delete next[key];
            else next[key] = num;
            return next;
        });
    };

    const handleSubmit = async () => {
        setError(null);
        const w = weight === '' ? undefined : parseFloat(weight);
        if (w !== undefined && (Number.isNaN(w) || w <= 0 || w > 500)) {
            setError(t('invalidWeight') || 'Invalid weight');
            return;
        }
        const hasMeasurement = Object.keys(measurements).length > 0;
        if (w === undefined && !hasMeasurement && !notes) {
            setError(t('logRequiresField') || 'Enter at least a weight or measurement.');
            return;
        }
        setSubmitting(true);
        try {
            await addLog({ date, weight: w, measurements: hasMeasurement ? measurements : undefined, notes: notes || undefined });
            setShowForm(false);
            setWeight(''); setMeasurements({}); setNotes(''); setDate(todayISO());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-surface-container-low rounded-2xl p-6 flex justify-center text-on-surface/50 border border-outline-variant/30 ghost-border">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Hero summary — one unified frame */}
            <div
                className="bg-surface-container-low rounded-2xl p-8 relative overflow-hidden border border-outline-variant/30 ghost-border shadow-xl"
                style={{ background: 'linear-gradient(145deg, rgba(20,25,35,0.4), rgba(10,12,20,0.9))' }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    {/* Left: latest weight (hero) */}
                    <div>
                        <div className="text-on-surface/40 text-[10px] tracking-widest uppercase font-label font-bold mb-3 flex items-center gap-2">
                            <Scale size={14} className="text-primary" /> {t('latestWeight') || 'Latest Weight'}
                        </div>
                        <div className="text-6xl font-headline font-extrabold text-primary leading-none tracking-tighter">
                            {latest?.weight ?? '--'}
                            <span className="text-xl font-headline text-on-surface/40 font-bold ml-2">kg</span>
                        </div>
                        {latest?.date && (
                            <div className="text-xs font-body text-on-surface/50 mt-3">{latest.date}</div>
                        )}
                    </div>

                    {/* Right: inline stat row */}
                    <div className="grid grid-cols-3 gap-6 text-center md:text-right bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/30">
                        <div>
                            <div className="text-[10px] text-on-surface/40 tracking-widest uppercase font-label font-bold mb-1">
                                {t('logsCount') || 'Logs'}
                            </div>
                            <div className="text-2xl font-headline font-bold text-on-surface">{logs.length}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-on-surface/40 tracking-widest uppercase font-label font-bold mb-1 flex items-center gap-1 justify-center md:justify-end">
                                <Ruler size={12} className="text-primary/70" /> {t('measurements') || 'Measurements'}
                            </div>
                            <div className="text-2xl font-headline font-bold text-on-surface">
                                {latest?.measurements ? Object.keys(latest.measurements).length : 0}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-on-surface/40 tracking-widest uppercase font-label font-bold mb-1">
                                {t('lastUpdated') || 'Updated'}
                            </div>
                            <div className="text-sm font-body text-on-surface mt-2 truncate">
                                {latest?.date ?? '--'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart — coach overview. Weight + wellbeing sliders share a
                single x-axis with TWO y-axes:
                  - left  : weight (kg)
                  - right : 1-10 scales (strength, hunger, energy)
                A second mini bar chart underneath shows cardio kcal,
                aligned by date so the coach can correlate cardio output
                with weight movement at a glance. */}
            {chartData.length >= 2 && (
                <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 ghost-border shadow-xl">
                    <h3 className="text-on-surface font-headline font-bold text-xl mb-1">
                        {t('progressOverview') || 'Progress overview'}
                    </h3>
                    <p className="text-xs text-on-surface/50 font-body mb-4">
                        {t('progressOverviewSub') || 'Weight (kg) + weekly wellbeing scales (1–10).'}
                    </p>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="selfWeightFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgb(var(--primary) / 0.3)" />
                                        <stop offset="100%" stopColor="rgb(var(--primary) / 0)" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgb(var(--outline-variant) / 0.4)" vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="date" stroke="rgb(var(--outline) / 0.4)" tick={{ fontSize: 10, fill: 'rgb(var(--on-surface-variant))' }} tickLine={false} axisLine={false} />
                                <YAxis
                                    yAxisId="weight"
                                    domain={['dataMin - 1', 'dataMax + 1']}
                                    stroke="rgb(var(--outline) / 0.4)"
                                    tick={{ fontSize: 10, fill: 'rgb(var(--on-surface-variant))' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    label={{ value: 'kg', position: 'insideTopLeft', fontSize: 10, fill: 'rgb(var(--on-surface-variant))' }}
                                />
                                <YAxis
                                    yAxisId="scale"
                                    orientation="right"
                                    domain={[0, 10]}
                                    ticks={[0, 2, 4, 6, 8, 10]}
                                    stroke="rgb(var(--outline) / 0.4)"
                                    tick={{ fontSize: 10, fill: 'rgb(var(--on-surface-variant))' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={30}
                                />
                                <Tooltip contentStyle={{ background: 'rgb(var(--surface-bright) / 0.95)', border: '1px solid rgb(var(--primary) / 0.15)', borderRadius: 12, fontSize: 12, color: 'rgb(var(--on-surface))', fontFamily: 'Inter, sans-serif' }} labelStyle={{ color: 'rgb(var(--primary))', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
                                <Area
                                    yAxisId="weight"
                                    type="monotone"
                                    dataKey="weight"
                                    name={t('weight') || 'Weight'}
                                    stroke="rgb(var(--primary))"
                                    strokeWidth={3}
                                    fill="url(#selfWeightFill)"
                                    dot={{ r: 4, fill: 'rgb(var(--primary))', stroke: 'rgb(var(--surface))', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: 'rgb(var(--primary))', stroke: 'rgb(var(--on-surface))', strokeWidth: 2 }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="scale"
                                    type="monotone"
                                    dataKey="strength"
                                    name={t('strength') || 'Strength'}
                                    stroke="#34d399"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#34d399' }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="scale"
                                    type="monotone"
                                    dataKey="hunger"
                                    name={t('hunger') || 'Hunger'}
                                    stroke="#f87171"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#f87171' }}
                                    connectNulls
                                />
                                <Line
                                    yAxisId="scale"
                                    type="monotone"
                                    dataKey="energy"
                                    name={t('energy') || 'Energy'}
                                    stroke="#60a5fa"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#60a5fa' }}
                                    connectNulls
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Cardio kcal — own scale; rendered as a thin bar
                        strip below the main chart so the coach can read
                        weight ↔ cardio output correlation by aligning the
                        x-axes visually. Hidden when no cardio data exists. */}
                    {chartData.some(d => typeof d.cardio === 'number') && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/20">
                            <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 mb-2">
                                🔥 {t('cardioCalories') || 'Cardio calories'} (kcal)
                            </div>
                            <div style={{ width: '100%', height: 80 }}>
                                <ResponsiveContainer>
                                    <ComposedChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid stroke="rgb(var(--outline-variant) / 0.3)" vertical={false} strokeDasharray="3 3" />
                                        <XAxis dataKey="date" stroke="rgb(var(--outline) / 0.3)" tick={{ fontSize: 9, fill: 'rgb(var(--on-surface-variant))' }} tickLine={false} axisLine={false} />
                                        <YAxis stroke="rgb(var(--outline) / 0.3)" tick={{ fontSize: 9, fill: 'rgb(var(--on-surface-variant))' }} tickLine={false} axisLine={false} width={36} />
                                        <Tooltip contentStyle={{ background: 'rgb(var(--surface-bright) / 0.95)', border: '1px solid rgb(var(--primary) / 0.15)', borderRadius: 8, fontSize: 11, color: 'rgb(var(--on-surface))' }} />
                                        <Bar dataKey="cardio" name={t('cardioCalories') || 'Cardio kcal'} fill="rgb(var(--primary) / 0.6)" radius={[3, 3, 0, 0]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add log button (owner only) */}
            {isOwner && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> {t('logToday') || 'Log Today'}
                </button>
            )}

            {/* Entry form */}
            {isOwner && showForm && (
                <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 ghost-border space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                        <h3 className="text-on-surface font-headline font-bold text-xl">{t('newLog') || 'New Log'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 hover:text-on-surface transition-colors">
                            {t('cancel') || 'Cancel'}
                        </button>
                    </div>
                    {error && (
                        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm font-body">{error}</div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('date') || 'Date'}</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('weightKg') || 'Weight (kg)'}</label>
                            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75.0" className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-3">
                            {t('measurementsCm') || 'Measurements (cm)'}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/30">
                            {(['chest', 'waist', 'hips', 'arms', 'thighs', 'neck'] as const).map(key => (
                                <div key={key}>
                                    <label className="block text-[10px] font-label font-bold uppercase tracking-wider text-on-surface/40 mb-1.5">{t(key) || key}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={measurements[key] ?? ''}
                                        onChange={e => setMeas(key, e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/30 outline-none focus:border-primary/50 rounded-lg py-2 px-3 text-sm font-body text-on-surface transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">{t('notes') || 'Notes'}</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-3 px-4 text-sm font-body text-on-surface transition-colors h-24 resize-none" placeholder="How do you feel?" />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : (t('save') || 'Save')}
                    </button>
                </div>
            )}

            {/* Recent logs list */}
            {logs.length > 0 && (
                <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 ghost-border">
                    <h3 className="text-on-surface font-headline font-bold text-xl mb-4">{t('recentLogs') || 'Recent Logs'}</h3>
                    <ul className="space-y-3">
                        {[...logs].reverse().slice(0, 10).map(log => (
                            <li key={log.id} className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl p-4 flex items-center justify-between transition-colors hover:border-primary/30">
                                <div className="flex-1">
                                    <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60">{log.date}</div>
                                    <div className="text-sm font-body text-on-surface mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                        {log.weight !== undefined && <span className="font-bold text-primary">⚖️ {log.weight} kg</span>}
                                        {log.measurements && Object.entries(log.measurements).map(([k, v]) => (
                                            <span key={k} className="text-on-surface/70 capitalize">{k}: <span className="text-on-surface font-medium">{v}cm</span></span>
                                        ))}
                                    </div>
                                    {log.notes && <div className="text-xs font-body text-on-surface/50 mt-2 italic border-l-2 border-primary/30 pl-2">"{log.notes}"</div>}
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => deleteLog(log.id)}
                                        className="text-on-surface/30 hover:text-red-400 p-2 ml-4 transition-colors rounded-lg hover:bg-red-500/10"
                                        aria-label="Delete log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Empty state */}
            {logs.length === 0 && (
                <div className="bg-surface-container-low rounded-2xl p-10 text-center border border-outline-variant/30 border-dashed">
                    <Scale className="mx-auto text-on-surface/20 mb-4" size={40} />
                    <p className="text-on-surface/50 text-sm font-body">
                        {isOwner
                            ? (t('noLogsYet') || 'No logs yet — tap "Log Today" to start tracking.')
                            : (t('noLogsViewing') || 'This member has no logs yet.')}
                    </p>
                </div>
            )}
        </div>
    );
};
