import { Week } from '../../types';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area,
    Legend,
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface ProgressChartsProps {
    weeks: Week[];
}

export const ProgressCharts = ({ weeks }: ProgressChartsProps) => {
    // Weight trend data — only weeks with minWeight data
    const weightData = weeks
        .filter(w => w.minWeight && (w.status === 'locked' || w.status === 'reviewed'))
        .map(w => ({
            week: `W${w.weekNumber}`,
            weight: w.minWeight,
        }));

    // Macro adherence — average daily macros vs targets
    const macroData = weeks
        .filter(w => (w.status === 'locked' || w.status === 'reviewed') && w.dailyEntries.some(e => e.carbs || e.protein || e.fats))
        .map(w => {
            const filled = w.dailyEntries.filter(e => e.carbs || e.protein || e.fats);
            const count = filled.length || 1;
            const avgCarbs = Math.round(filled.reduce((s, e) => s + (e.carbs || 0), 0) / count);
            const avgProtein = Math.round(filled.reduce((s, e) => s + (e.protein || 0), 0) / count);
            const avgFats = Math.round(filled.reduce((s, e) => s + (e.fats || 0), 0) / count);
            const targetCarbs = Math.round((w.activeTargets.highCarb.carbs + w.activeTargets.lowCarb.carbs) / 2);
            const targetProtein = w.activeTargets.highCarb.protein;
            const targetFats = Math.round((w.activeTargets.highCarb.fats + w.activeTargets.lowCarb.fats) / 2);

            return {
                week: `W${w.weekNumber}`,
                carbs: avgCarbs,
                protein: avgProtein,
                fats: avgFats,
                targetCarbs,
                targetProtein,
                targetFats,
            };
        });

    if (weightData.length === 0 && macroData.length === 0) {
        return (
            <div className="bg-surface-container-low p-8 text-center rounded-2xl ghost-border">
                <Activity className="mx-auto text-on-surface/20 mb-4" size={40} />
                <p className="text-on-surface/50 font-body text-sm">Complete a few weeks to see your progress charts here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Weight Trend */}
            {weightData.length >= 1 && (
                <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl ghost-border">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <TrendingUp className="text-primary" size={24} />
                        </div>
                        <div>
                            <h3 className="text-on-surface font-headline font-extrabold text-2xl tracking-tight mb-1">Weight Trend</h3>
                            <p className="text-on-surface/60 font-body text-sm">Weekly minimum weight (kg)</p>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <LineChart data={weightData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--outline-variant) / 0.4)" vertical={false} />
                                <XAxis dataKey="week" tick={{ fill: 'rgb(var(--on-surface-variant))', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'rgb(var(--on-surface-variant))', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dx={-10} width={40} />
                                <Tooltip
                                    contentStyle={{ background: 'rgb(var(--surface-bright) / 0.95)', border: '1px solid rgb(var(--primary) / 0.15)', borderRadius: '16px', color: 'rgb(var(--on-surface))', fontFamily: 'Inter', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    labelStyle={{ color: 'rgb(var(--primary))', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                                />
                                <Line type="monotone" dataKey="weight" stroke="rgb(var(--primary))" strokeWidth={3} dot={{ fill: 'rgb(var(--primary))', r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))' }} activeDot={{ r: 8, fill: 'rgb(var(--on-surface))', stroke: 'rgb(var(--primary))', strokeWidth: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Macro Adherence */}
            {macroData.length >= 1 && (
                <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl ghost-border">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/30">
                            <Activity className="text-on-surface/50" size={24} />
                        </div>
                        <div>
                            <h3 className="text-on-surface font-headline font-extrabold text-2xl tracking-tight mb-1">Macro Adherence</h3>
                            <p className="text-on-surface/60 font-body text-sm">Avg daily macros vs targets</p>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={macroData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="carbGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--outline-variant) / 0.4)" vertical={false} />
                                <XAxis dataKey="week" tick={{ fill: 'rgb(var(--on-surface-variant))', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: 'rgb(var(--on-surface-variant))', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dx={-10} width={40} />
                                <Tooltip
                                    contentStyle={{ background: 'rgb(var(--surface-bright) / 0.95)', border: '1px solid rgb(var(--primary) / 0.15)', borderRadius: '16px', color: 'rgb(var(--on-surface))', fontFamily: 'Inter', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    labelStyle={{ color: 'rgb(var(--primary))', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                                />
                                <Legend wrapperStyle={{ color: 'rgb(var(--on-surface-variant))', fontSize: 11, fontFamily: 'Inter', paddingTop: '20px' }} iconType="circle" />
                                <Area type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#60a5fa" fill="url(#carbGrad)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#f97316" fill="url(#proteinGrad)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="fats" name="Fats (g)" stroke="#a78bfa" fill="url(#fatGrad)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="targetCarbs" name="Target C" stroke="#60a5fa" strokeDasharray="5 5" strokeWidth={1.5} dot={false} activeDot={false} opacity={0.5} />
                                <Line type="monotone" dataKey="targetProtein" name="Target P" stroke="#f97316" strokeDasharray="5 5" strokeWidth={1.5} dot={false} activeDot={false} opacity={0.5} />
                                <Line type="monotone" dataKey="targetFats" name="Target F" stroke="#a78bfa" strokeDasharray="5 5" strokeWidth={1.5} dot={false} activeDot={false} opacity={0.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
