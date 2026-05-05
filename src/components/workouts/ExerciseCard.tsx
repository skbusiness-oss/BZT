// ============================================================
// ExerciseCard.tsx
// Shows one exercise with its ExerciseDB animated GIF, target
// muscle, equipment, sets × reps, rest, and notes.
// Renders a skeleton while the GIF loads and falls back to a
// Dumbbell placeholder when the exercise is not in ExerciseDB.
// ============================================================

import { useState, useEffect } from 'react';
import { Exercise } from '../../types';
import { getExerciseByName, ExerciseDetail } from '../../lib/exerciseService';
import { Dumbbell, Timer } from 'lucide-react';
import clsx from 'clsx';

interface ExerciseCardProps {
    exercise: Exercise;
    index: number;
}

export const ExerciseCard = ({ exercise, index }: ExerciseCardProps) => {
    const [status, setStatus] = useState<'loading' | 'done' | 'miss'>('loading');
    const [detail, setDetail] = useState<ExerciseDetail | null>(null);
    const [imgReady, setImgReady] = useState(false);

    useEffect(() => {
        let alive = true;
        setStatus('loading');
        setDetail(null);
        setImgReady(false);

        getExerciseByName(exercise.name).then(d => {
            if (!alive) return;
            setDetail(d);
            setStatus(d ? 'done' : 'miss');
        });

        return () => { alive = false; };
    }, [exercise.name]);

    return (
        <div className="flex gap-3 p-3 rounded-xl bg-surface-container/25 border border-white/[0.04] hover:border-white/[0.07] transition-colors">

            {/* ── GIF tile ─────────────────────────────────── */}
            <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-surface-container/60 flex items-center justify-center">
                {/* Skeleton pulse */}
                {status === 'loading' && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-container to-surface-container-high" />
                )}

                {/* Animated GIF */}
                {status === 'done' && detail?.gifUrl && (
                    <>
                        {!imgReady && (
                            <div className="absolute inset-0 animate-pulse bg-surface-container-high/50" />
                        )}
                        <img
                            src={detail.gifUrl}
                            alt={exercise.name}
                            className={clsx(
                                'w-full h-full object-cover transition-opacity duration-300',
                                imgReady ? 'opacity-100' : 'opacity-0'
                            )}
                            onLoad={() => setImgReady(true)}
                            onError={() => setImgReady(true)}
                            loading="lazy"
                            decoding="async"
                        />
                    </>
                )}

                {/* Fallback icon */}
                {status === 'miss' && (
                    <Dumbbell className="text-on-surface-variant/40" size={24} />
                )}

                {/* Number badge */}
                <span className="absolute top-1 left-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-surface-container-low/80 flex items-center justify-center text-[9px] font-bold text-on-surface-variant">
                    {index + 1}
                </span>
            </div>

            {/* ── Text content ──────────────────────────────── */}
            <div className="flex-1 min-w-0 py-0.5">

                {/* Name + sets × reps */}
                <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-on-surface text-sm leading-snug capitalize line-clamp-2">
                        {exercise.name}
                    </span>
                    <span className="flex items-center gap-0.5 shrink-0 mt-px">
                        <span className="text-primary font-bold text-sm">{exercise.sets}</span>
                        <span className="text-on-surface-variant/60 text-xs mx-0.5">×</span>
                        <span className="text-on-surface text-sm font-medium">{exercise.reps}</span>
                    </span>
                </div>

                {/* Tag skeletons while loading */}
                {status === 'loading' && (
                    <div className="flex gap-1.5 mt-1.5">
                        <div className="h-[18px] w-14 rounded-full animate-pulse bg-surface-container-high/50" />
                        <div className="h-[18px] w-10 rounded-full animate-pulse bg-surface-container-high/50" />
                    </div>
                )}

                {/* Muscle + equipment tags */}
                {status === 'done' && detail && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {detail.targetMuscle && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15 text-primary text-[10px] font-medium capitalize">
                                {detail.targetMuscle}
                            </span>
                        )}
                        {detail.equipment && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container-high/60 text-on-surface/70 text-[10px] font-medium capitalize">
                                {detail.equipment}
                            </span>
                        )}
                    </div>
                )}

                {/* Rest time + notes */}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant/60 flex-wrap">
                    <span className="flex items-center gap-0.5">
                        <Timer size={10} className="shrink-0" /> {exercise.restSeconds}s rest
                    </span>
                    {exercise.notes && (
                        <span className={clsx(
                            'italic truncate',
                            exercise.notes.toLowerCase().includes('rest pause') && 'text-amber-400 not-italic font-semibold'
                        )}>
                            {exercise.notes}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
