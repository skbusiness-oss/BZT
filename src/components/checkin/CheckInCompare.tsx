/**
 * CheckInCompare — pick two weeks, see metrics + deltas + photos side-by-side.
 * BioZackTeam-styled. Used by coach in CoachReview, also embeddable in a client view.
 */
import { useState, useMemo } from 'react';
import { Week } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, Camera, GitCompareArrows } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    weeks: Week[];   // any subset; component filters to those with usable data
}

interface Metric {
    key: 'weight' | 'strength' | 'energy' | 'hunger' | 'cardio';
    label: string;
    unit: string;
    /** When higher value is the "good" outcome (cardio, strength, energy). For weight we negate. */
    higherIsBetter: boolean;
    get: (w: Week) => number | undefined;
}

export const CheckInCompare = ({ weeks }: Props) => {
    const { t: tStrict } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;

    // Only weeks that actually have something worth comparing
    const comparable = useMemo(
        () => weeks
            .filter(w => w.weekNumber > 0 && (
                w.minWeight || w.strengthScale || w.energyScale || w.hungerScale || w.cardioCalories || w.photos
            ))
            .sort((a, b) => a.weekNumber - b.weekNumber),
        [weeks]
    );

    // Default selection: first vs latest
    const [aWeekNum, setAWeekNum] = useState<number | null>(comparable[0]?.weekNumber ?? null);
    const [bWeekNum, setBWeekNum] = useState<number | null>(comparable[comparable.length - 1]?.weekNumber ?? null);
    const a = comparable.find(w => w.weekNumber === aWeekNum);
    const b = comparable.find(w => w.weekNumber === bWeekNum);

    if (comparable.length < 2) {
        return (
            <div className="clay-card p-6 text-center text-on-surface/70">
                <GitCompareArrows className="mx-auto text-on-surface-variant/60 mb-3" size={28} />
                <p className="text-sm">{t('compareNeedsTwo') ?? 'Need at least two weeks of check-in data to compare.'}</p>
            </div>
        );
    }

    const metrics: Metric[] = [
        { key: 'weight', label: t('weight') ?? 'Weight', unit: 'kg', higherIsBetter: false, get: w => w.minWeight },
        { key: 'strength', label: t('strengthScale') ?? 'Strength', unit: '/10', higherIsBetter: true, get: w => w.strengthScale },
        { key: 'energy', label: t('energyScale') ?? 'Energy', unit: '/10', higherIsBetter: true, get: w => w.energyScale },
        { key: 'hunger', label: t('hungerScale') ?? 'Hunger', unit: '/10', higherIsBetter: false, get: w => w.hungerScale },
        { key: 'cardio', label: t('cardioCalories') ?? 'Cardio', unit: 'cal', higherIsBetter: true, get: w => w.cardioCalories },
    ];

    return (
        <div className="clay-card p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <GitCompareArrows className="text-primary" size={20} />
                </div>
                <div>
                    <h3 className="text-on-surface font-bold text-lg">{t('compareCheckIns') ?? 'Compare check-ins'}</h3>
                    <p className="text-on-surface/70 text-sm">{t('compareSubtitle') ?? 'Pick two weeks to see deltas and photos side by side.'}</p>
                </div>
            </div>

            {/* Week pickers */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <WeekPicker
                    label={t('weekA') ?? 'Week A'}
                    weeks={comparable}
                    value={aWeekNum}
                    onChange={setAWeekNum}
                />
                <ArrowRight className="text-on-surface-variant" size={20} />
                <WeekPicker
                    label={t('weekB') ?? 'Week B'}
                    weeks={comparable}
                    value={bWeekNum}
                    onChange={setBWeekNum}
                />
            </div>

            {a && b && a.weekNumber !== b.weekNumber && (
                <>
                    {/* Metrics table */}
                    <div className="space-y-2">
                        {metrics.map(m => {
                            const va = m.get(a);
                            const vb = m.get(b);
                            const delta = (va !== undefined && vb !== undefined) ? vb - va : null;
                            const isGood = delta !== null && (
                                (m.higherIsBetter && delta > 0) ||
                                (!m.higherIsBetter && delta < 0)
                            );
                            const color = delta === null || delta === 0
                                ? 'text-on-surface-variant'
                                : (isGood ? 'text-emerald-400' : 'text-red-400');
                            const arrow = delta === null ? '–' : (delta === 0 ? '–' : (delta > 0 ? '↑' : '↓'));

                            return (
                                <div key={m.key} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 clay-inset rounded-lg px-4 py-3">
                                    <div className="text-right">
                                        <div className="text-xs text-on-surface-variant uppercase tracking-wider">{m.label}</div>
                                        <div className="text-lg font-bold text-on-surface">
                                            {va ?? '--'}<span className="text-xs text-on-surface-variant ms-1">{m.unit}</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-on-surface-variant/60" />
                                    <div className="text-left">
                                        <div className="text-xs text-on-surface-variant uppercase tracking-wider opacity-0">.</div>
                                        <div className="text-lg font-bold text-on-surface">
                                            {vb ?? '--'}<span className="text-xs text-on-surface-variant ms-1">{m.unit}</span>
                                        </div>
                                    </div>
                                    <div className={clsx('text-sm font-bold tabular-nums min-w-[64px] text-right', color)}>
                                        {arrow} {delta !== null ? Math.abs(delta).toFixed(m.unit === 'kg' ? 1 : 0) : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Photo compare */}
                    {(a.photos || b.photos) && (
                        <div>
                            <h4 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-3 flex items-center gap-2">
                                <Camera size={14} className="text-primary" /> {t('photos') ?? 'Photos'}
                            </h4>
                            <div className="space-y-3">
                                {(['front', 'side', 'back'] as const).map(angle => {
                                    const pa = a.photos?.[angle];
                                    const pb = b.photos?.[angle];
                                    if (!pa && !pb) return null;
                                    return (
                                        <div key={angle} className="grid grid-cols-2 gap-3">
                                            <PhotoCell label={`W${a.weekNumber} · ${angle}`} src={pa} />
                                            <PhotoCell label={`W${b.weekNumber} · ${angle}`} src={pb} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {a && b && a.weekNumber === b.weekNumber && (
                <div className="text-center text-on-surface-variant text-sm py-4">
                    {t('pickDifferentWeeks') ?? 'Pick two different weeks.'}
                </div>
            )}
        </div>
    );
};

function WeekPicker({ label, weeks, value, onChange }: {
    label: string; weeks: Week[]; value: number | null; onChange: (n: number) => void;
}) {
    return (
        <div>
            <div className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">{label}</div>
            <select
                value={value ?? ''}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full clay-input p-2.5 text-sm"
            >
                {weeks.map(w => (
                    <option key={w.id} value={w.weekNumber} style={{ background: 'rgb(var(--surface-container))' }}>
                        Week {w.weekNumber}{w.minWeight ? ` · ${w.minWeight} kg` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}

function PhotoCell({ label, src }: { label: string; src?: string }) {
    return (
        <div className="aspect-[3/4] rounded-xl overflow-hidden relative clay-inset">
            {src ? (
                <img src={src} alt={label} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/60 text-xs">
                    no photo
                </div>
            )}
            <div className="absolute top-1 left-1 px-2 py-0.5 rounded bg-black/60 text-[10px] text-on-surface">{label}</div>
        </div>
    );
}
