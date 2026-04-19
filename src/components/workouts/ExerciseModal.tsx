/**
 * ExerciseModal — Slides up from bottom showing exercise details.
 *
 * Displays: GIF, muscle groups, instructions, tips, common mistakes.
 * Language auto-detected from LanguageContext.
 * Graceful fallback if no exercise data found.
 */

import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ExerciseDetail } from '../../types';
import { getExerciseByName } from '../../lib/exerciseService';
import { X, AlertCircle, Dumbbell, Target, BookOpen, AlertTriangle, Wrench } from 'lucide-react';

interface ExerciseModalProps {
    exerciseName: string;
    exerciseDetail: ExerciseDetail | null;
    onClose: () => void;
}

export const ExerciseModal = ({ exerciseName, exerciseDetail, onClose }: ExerciseModalProps) => {
    const { lang, isRTL } = useLanguage();
    const isAr = lang === 'ar';
    const [imgError, setImgError] = useState(false);
    const [remoteGif, setRemoteGif] = useState<string | null>(null);
    const [remoteInstructions, setRemoteInstructions] = useState<string[]>([]);

    // Fetch from ExerciseDB as fallback when the local library has no GIF
    // or no detail entry at all.
    useEffect(() => {
        const hasLocalGif = !!exerciseDetail?.gifUrl;
        if (hasLocalGif) { setRemoteGif(null); setRemoteInstructions([]); return; }
        let alive = true;
        getExerciseByName(exerciseName).then(d => {
            if (!alive || !d) return;
            setRemoteGif(d.gifUrl || null);
            setRemoteInstructions(d.instructions || []);
        });
        return () => { alive = false; };
    }, [exerciseName, exerciseDetail?.gifUrl]);

    // Fallback: no data found
    if (!exerciseDetail) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
                <div
                    className="bg-navy-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
                    onClick={e => e.stopPropagation()}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{exerciseName}</h2>
                            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                        {remoteGif ? (
                            <div className="w-full aspect-video bg-navy-950 rounded-2xl overflow-hidden mb-4">
                                <img src={remoteGif} alt={exerciseName} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-12 text-center">
                                <Dumbbell className="text-navy-500 mb-4" size={48} />
                                <p className="text-navy-300 text-lg font-medium">
                                    {isAr ? 'تفاصيل هذا التمرين قريباً' : 'Exercise details coming soon'}
                                </p>
                                <p className="text-navy-500 text-sm mt-2">
                                    {isAr ? 'اسأل مدربك إذا احتجت تعليمات' : 'Ask your coach if you need instructions'}
                                </p>
                            </div>
                        )}
                        {remoteInstructions.length > 0 && (
                            <ol className="space-y-2 ps-1 mt-2">
                                {remoteInstructions.map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-navy-200">
                                        <span className="text-blue-400 font-bold shrink-0 w-5 text-center">{i + 1}</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const name = isAr ? exerciseDetail.canonicalNameAr : exerciseDetail.canonicalName;
    const primaryMuscles = isAr ? exerciseDetail.muscles.primaryAr : exerciseDetail.muscles.primary;
    const secondaryMuscles = isAr ? exerciseDetail.muscles.secondaryAr : exerciseDetail.muscles.secondary;
    const instructions = isAr ? exerciseDetail.instructionsAr : exerciseDetail.instructions;
    const tips = isAr ? exerciseDetail.tipsAr : exerciseDetail.tips;
    const mistakes = isAr ? exerciseDetail.commonMistakesAr : exerciseDetail.commonMistakes;
    const equipment = isAr ? exerciseDetail.equipmentAr : exerciseDetail.equipment;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-navy-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300"
                onClick={e => e.stopPropagation()}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* GIF / Image (local first, ExerciseDB fallback) */}
                {(() => {
                    const src = (!imgError && exerciseDetail.gifUrl) || remoteGif;
                    return src;
                })() ? (
                    <div className="w-full aspect-video bg-navy-950 rounded-t-3xl overflow-hidden">
                        <img
                            src={(!imgError && exerciseDetail.gifUrl) || remoteGif || ''}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-navy-950 rounded-t-3xl flex items-center justify-center">
                        <Dumbbell className="text-navy-700" size={64} />
                    </div>
                )}

                <div className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex-1">{name}</h2>
                        <button onClick={onClose} className="text-white/40 hover:text-white p-1 ms-3">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Equipment */}
                    {equipment && (
                        <div className="flex items-center gap-2 text-navy-300">
                            <Wrench size={16} className="text-gold-400 shrink-0" />
                            <span className="text-sm">{equipment}</span>
                        </div>
                    )}

                    {/* Muscle Groups */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Target size={16} className="text-orange-400 shrink-0" />
                            <span className="text-xs font-bold uppercase text-orange-400 tracking-wider">
                                {isAr ? 'العضلات المستهدفة' : 'Target Muscles'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {primaryMuscles.map((m, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 text-xs font-medium">
                                    {m}
                                </span>
                            ))}
                            {secondaryMuscles.map((m, i) => (
                                <span key={`s-${i}`} className="px-3 py-1 rounded-full bg-white/5 text-navy-300 text-xs font-medium">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    {instructions.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} className="text-blue-400 shrink-0" />
                                <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">
                                    {isAr ? 'الخطوات' : 'Instructions'}
                                </span>
                            </div>
                            <ol className="space-y-2 ps-1">
                                {instructions.map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-navy-200">
                                        <span className="text-blue-400 font-bold shrink-0 w-5 text-center">{i + 1}</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Tips */}
                    {tips.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="text-emerald-400 shrink-0" />
                                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                                    {isAr ? 'نصائح المدرب' : 'Coach Tips'}
                                </span>
                            </div>
                            <ul className="space-y-1.5">
                                {tips.map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-navy-200">
                                        <span className="text-emerald-400 mt-0.5">•</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Common Mistakes */}
                    {mistakes.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                                <span className="text-xs font-bold uppercase text-red-400 tracking-wider">
                                    {isAr ? 'أخطاء شائعة' : 'Common Mistakes'}
                                </span>
                            </div>
                            <ul className="space-y-1.5">
                                {mistakes.map((m, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-red-300/80">
                                        <span className="text-red-400 mt-0.5">✗</span>
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
