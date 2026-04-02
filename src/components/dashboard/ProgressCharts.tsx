import { Week } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
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
    const { t } = useLanguage();

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
            <div className="clay-card p-6 text-center">
                <Activity className="mx-auto text-navy-400 mb-3" size={32} />
                <p className="text-navy-300">Complete a few weeks to see your progress charts here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Weight Trend */}
            {weightData.length >= 1 && (
                <div className="clay-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
                            <TrendingUp className="text-gold-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Weight Trend</h3>
                            <p className="text-navy-300 text-sm">Weekly minimum weight (kg)</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={weightData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="week" tick={{ fill: '#8899bb', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#8899bb', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(10,13,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                                labelStyle={{ color: '#ffd740' }}
                            />
                            <Line type="monotone" dataKey="weight" stroke="#ffd740" strokeWidth={3} dot={{ fill: '#ffd740', r: 5, strokeWidth: 0 }} activeDot={{ r: 7, fill: '#ffd740' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Macro Adherence */}
            {macroData.length >= 1 && (
                <div className="clay-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-navy-400/15 flex items-center justify-center">
                            <Activity className="text-navy-300" size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Macro Adherence</h3>
                            <p className="text-navy-300 text-sm">Avg daily macros vs targets</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={macroData}>
                            <defs>
                                <linearGradient id="carbGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="week" tick={{ fill: '#8899bb', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                            <YAxis tick={{ fill: '#8899bb', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(10,13,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }}
                                labelStyle={{ color: '#ffd740' }}
                            />
                            <Legend wrapperStyle={{ color: '#8899bb', fontSize: 12 }} />
                            <Area type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#60a5fa" fill="url(#carbGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#f97316" fill="url(#proteinGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="fats" name="Fats (g)" stroke="#a78bfa" fill="url(#fatGrad)" strokeWidth={2} />
                            <Line type="monotone" dataKey="targetCarbs" name="Target C" stroke="#60a5fa" strokeDasharray="5 3" strokeWidth={1} dot={false} />
                            <Line type="monotone" dataKey="targetProtein" name="Target P" stroke="#f97316" strokeDasharray="5 3" strokeWidth={1} dot={false} />
                            <Line type="monotone" dataKey="targetFats" name="Target F" stroke="#a78bfa" strokeDasharray="5 3" strokeWidth={1} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};
