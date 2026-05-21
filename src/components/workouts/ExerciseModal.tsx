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
import { X, Dumbbell, AlertTriangle, Wrench, Play, Lightbulb, ListOrdered } from 'lucide-react';

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
            <>
                <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-40 animate-in fade-in duration-200" onClick={onClose} />
                <div
                    className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] bg-surface-container-highest/95 backdrop-blur-2xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out animate-in slide-in-from-bottom-full"
                    onClick={e => e.stopPropagation()}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    <div className="w-full flex justify-center py-4 shrink-0">
                        <div className="w-12 h-1.5 bg-on-surface/20 rounded-full" />
                    </div>
                    
                    <button onClick={onClose} className="absolute top-4 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container/50 text-on-surface hover:bg-surface-bright transition-colors z-10" style={{ [isRTL ? 'left' : 'right']: '1.5rem', [isRTL ? 'right' : 'left']: 'auto' }}>
                        <X size={20} />
                    </button>

                    <div className="flex-1 overflow-y-auto pb-12 px-6">
                        <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-6">{exerciseName}</h2>
                        {remoteGif ? (
                            <div className="w-full aspect-video rounded-xl ghost-border bg-surface-container-lowest relative overflow-hidden mb-6">
                                <img
                                    src={remoteGif}
                                    alt={exerciseName}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 border-2 border-primary/30 rounded-xl pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-12 text-center bg-surface-container-low rounded-xl ghost-border mb-6">
                                <Dumbbell className="text-on-surface/30 mb-4" size={48} />
                                <p className="text-on-surface/60 text-lg font-body">
                                    {isAr ? 'تفاصيل هذا التمرين قريباً' : 'Exercise details coming soon'}
                                </p>
                            </div>
                        )}
                        {remoteInstructions.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-headline font-bold flex items-center gap-3">
                                    <ListOrdered size={20} className="text-primary" />
                                    {isAr ? 'الخطوات' : 'Execution Steps'}
                                </h3>
                                <div className="space-y-4">
                                    {remoteInstructions.map((step, i) => (
                                        <div key={i} className="flex gap-4 items-start group">
                                            <div className="flex-none w-8 h-8 rounded-full bg-surface-container-highest border border-primary/40 flex items-center justify-center text-primary font-headline font-bold text-sm">{i + 1}</div>
                                            <p className="text-on-surface/80 leading-relaxed font-body pt-1">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>
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
        <>
            {/* Modal Backdrop */}
            <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm z-40 animate-in fade-in duration-200" onClick={onClose} />
            
            {/* Bottom Sheet Modal */}
            <div
                className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] bg-surface-container-highest/95 backdrop-blur-2xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out animate-in slide-in-from-bottom-full"
                onClick={e => e.stopPropagation()}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* Grab Handle */}
                <div className="w-full flex justify-center py-4 shrink-0">
                    <div className="w-12 h-1.5 bg-on-surface/20 rounded-full" />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pb-12 px-6 no-scrollbar">
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-4 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container/50 text-on-surface hover:bg-surface-bright transition-colors z-10" style={{ [isRTL ? 'left' : 'right']: '1.5rem', [isRTL ? 'right' : 'left']: 'auto' }}>
                        <X size={20} />
                    </button>

                    {/* Media Player Section */}
                    <div className="relative group mt-2 mb-8">
                        <div className="aspect-video w-full overflow-hidden rounded-xl ghost-border bg-surface-container-lowest relative">
                            {exerciseDetail.videoId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${exerciseDetail.videoId}?autoplay=1&mute=1&loop=1&playlist=${exerciseDetail.videoId}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                                    className="w-full h-full opacity-90"
                                    style={{ border: 'none' }}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                    title={exerciseDetail.canonicalName}
                                />
                            ) : (() => {
                                const src = (!imgError && exerciseDetail.gifUrl) || remoteGif;
                                return src;
                            })() ? (
                                <>
                                    <img
                                        src={(!imgError && exerciseDetail.gifUrl) || remoteGif || ''}
                                        alt={name}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover opacity-80"
                                        onError={() => setImgError(true)}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg opacity-80">
                                            <Play size={32} className="text-on-primary fill-current ml-1" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Dumbbell className="text-on-surface/30" size={64} />
                                </div>
                            )}
                            {/* Gold Frame Overlay */}
                            <div className="absolute inset-0 border-2 border-primary/30 rounded-xl pointer-events-none" />
                        </div>
                    </div>

                    {/* Title & Metadata */}
                    <div className="mb-10">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {primaryMuscles.map((m, i) => (
                                <span key={`p-${i}`} className="px-4 py-1.5 rounded-full bg-surface-container-highest text-primary font-label text-[11px] font-bold uppercase tracking-widest border border-primary/10">
                                    {m}
                                </span>
                            ))}
                            {secondaryMuscles.map((m, i) => (
                                <span key={`s-${i}`} className="px-4 py-1.5 rounded-full bg-surface-container-highest text-on-surface/60 font-label text-[11px] font-bold uppercase tracking-widest border border-outline-variant/30">
                                    {m}
                                </span>
                            ))}
                            {equipment && (
                                <span className="px-4 py-1.5 rounded-full bg-surface-container-highest text-on-surface/60 font-label text-[11px] font-bold uppercase tracking-widest border border-outline-variant/30 flex items-center gap-1.5">
                                    <Wrench size={12} /> {equipment}
                                </span>
                            )}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight leading-tight">{name}</h2>
                    </div>

                    {/* Instructions Section */}
                    {instructions.length > 0 && (
                        <div className="mb-10">
                            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-3">
                                <ListOrdered size={24} className="text-primary" />
                                {isAr ? 'الخطوات' : 'Execution Steps'}
                            </h3>
                            <div className="space-y-6">
                                {instructions.map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start group">
                                        <div className="flex-none w-8 h-8 rounded-full bg-surface-container-highest border border-primary/40 flex items-center justify-center text-primary font-headline font-bold text-sm">{i + 1}</div>
                                        <p className="text-on-surface/80 leading-relaxed font-body pt-1">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Coach Tips Section */}
                    {tips.length > 0 && (
                        <div className="p-6 bg-surface-container rounded-xl border-l-4 border-primary relative overflow-hidden mb-8">
                            <div className="absolute top-0 right-0 p-4 opacity-10" style={{ [isRTL ? 'left' : 'right']: 0, [isRTL ? 'right' : 'auto']: 'auto' }}>
                                <Lightbulb size={64} />
                            </div>
                            <h4 className="text-primary font-headline font-bold text-lg mb-2 uppercase tracking-wide">
                                {isAr ? 'نصائح المدرب' : "Coach Zack's Insights"}
                            </h4>
                            <div className="space-y-3 relative z-10">
                                {tips.map((tip, i) => (
                                    <p key={i} className="text-on-surface/90 leading-relaxed font-body italic">"{tip}"</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Common Mistakes */}
                    {mistakes.length > 0 && (
                        <div className="p-6 bg-red-900/10 rounded-xl border-l-4 border-red-500 relative overflow-hidden mb-12">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <AlertTriangle size={64} />
                            </div>
                            <h4 className="text-red-400 font-headline font-bold text-lg mb-2 uppercase tracking-wide">
                                {isAr ? 'أخطاء شائعة' : 'Common Mistakes to Avoid'}
                            </h4>
                            <ul className="space-y-2 relative z-10">
                                {mistakes.map((m, i) => (
                                    <li key={i} className="flex gap-3 text-on-surface/80 leading-relaxed font-body">
                                        <span className="text-red-500 mt-1 shrink-0"><X size={16} /></span>
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {/* Sticky Bottom CTA */}
                    <div className="sticky bottom-0 left-0 w-full pt-4 bg-gradient-to-t from-surface-container-highest via-surface-container-highest/80 to-transparent pb-4">
                        <button onClick={onClose} className="w-full py-4 rounded-full text-[12px] uppercase tracking-widest text-on-primary font-bold bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                            {isAr ? 'فهمت' : 'Got it'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
