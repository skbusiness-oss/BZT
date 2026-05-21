import clsx from 'clsx';
import {
    Play, Lock, ChevronLeft, BookOpen, Clock, FileText, Download,
    CheckCircle2, ArrowRight, Edit2, Trash2, ChevronUp, ChevronDown, Plus, Loader2,
} from 'lucide-react';
import { Course, Lesson, LessonContent, LessonResource, LibraryCategory, UserCourseProgress, UserLessonProgress } from '../../types';
import VideoPlayer from '../VideoPlayer';
import { useState, useEffect, useRef } from 'react';
import { buildEmbedUrl } from '../../lib/videoUtils';

/**
 * Render a duration in minutes with at most one decimal place. Vimeo's
 * oEmbed returns durations like 13.333… (= 13:20); we want "13.3 min",
 * not "13.333333 min" or a hard-rounded "13 min". Integer durations stay
 * as integers ("12 min", not "12.0 min").
 */
function formatMinutes(min: number | null | undefined): string {
    if (typeof min !== 'number' || !Number.isFinite(min)) return '0';
    const rounded = Math.round(min * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

interface Props {
    course: Course;
    categories: LibraryCategory[];
    lessons: Lesson[];
    lessonContent: Record<string, LessonContent>;
    lessonProgress: Record<string, UserLessonProgress>;
    progress?: UserCourseProgress;
    loading?: boolean;
    isManaging?: boolean;
    canAccessLesson: (lesson: Lesson) => boolean;
    onBack: () => void;
    onOpenLesson: (lessonId: string) => Promise<boolean>;
    onMarkComplete: (lessonId: string) => Promise<void>;
    onGetResourceUrl: (resource: LessonResource) => Promise<string>;
    onAddLesson?: () => void;
    onEditLesson?: (lesson: Lesson) => void;
    onArchiveLesson?: (lessonId: string) => void;
    onMoveLessonUp?: (lessonId: string) => void;
    onMoveLessonDown?: (lessonId: string) => void;
}

export const CourseDetail = ({
    course, categories, lessons, lessonContent, lessonProgress, progress, loading = false,
    isManaging, canAccessLesson,
    onBack, onOpenLesson, onMarkComplete, onGetResourceUrl, onAddLesson, onEditLesson, onArchiveLesson,
    onMoveLessonUp, onMoveLessonDown,
}: Props) => {
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [openingLessonId, setOpeningLessonId] = useState<string | null>(null);
    const [marking, setMarking] = useState(false);
    const [markError, setMarkError] = useState<string | null>(null);

    // Wraps the mark-complete prop so the button gets a loading state and
    // surfaces failures (permission-denied / network) as a user-visible
    // banner. Previously the prop was fire-and-forget — when the rule
    // rejected the write because the user hadn't completed the previous
    // required lesson, the button just did nothing and read as broken.
    const handleMarkComplete = async (lessonId: string): Promise<boolean> => {
        if (marking) return false;
        setMarking(true);
        setMarkError(null);
        try {
            await onMarkComplete(lessonId);
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to mark complete.';
            setMarkError(msg);
            // eslint-disable-next-line no-console
            console.warn('[CourseDetail.markComplete] failed:', err);
            // Clear the banner after a few seconds so it doesn't become
            // visual noise the next time they open a different lesson.
            window.setTimeout(() => setMarkError(null), 5000);
            return false;
        } finally {
            setMarking(false);
        }
    };

    // ── YouTube-style collapsible description for the player overlay ──
    // Collapsed by default; expands on "Show more" click. We measure the
    // paragraph's natural height once per lesson change to decide whether
    // the toggle is needed at all (short descriptions don't get a chip).
    const [descExpanded, setDescExpanded] = useState(false);
    const [descNeedsToggle, setDescNeedsToggle] = useState(false);
    const descRef = useRef<HTMLParagraphElement | null>(null);

    useEffect(() => {
        // New lesson opened — collapse the description and re-measure.
        setDescExpanded(false);
        setDescNeedsToggle(false);
        if (!activeLesson?.description) return;
        // Wait one frame so the line-clamp class applies before we ask
        // for scrollHeight vs clientHeight. +2px tolerance for sub-pixel
        // line-height rounding across browsers.
        const raf = requestAnimationFrame(() => {
            const el = descRef.current;
            if (!el) return;
            setDescNeedsToggle(el.scrollHeight > el.clientHeight + 2);
        });
        return () => cancelAnimationFrame(raf);
    }, [activeLesson?.id, activeLesson?.description]);

    // Defense-in-depth guard: if a non-managing user somehow lands on a
    // locked course's detail page (URL hack, stale state, etc.), bounce
    // them straight back to the grid. The CourseCard click handler is the
    // primary gate; this is the safety net.
    useEffect(() => {
        if (!isManaging && course.isLocked) onBack();
    }, [isManaging, course.isLocked, onBack]);

    const completedIds = new Set(progress?.completedLessonIds ?? []);
    const completedCount = lessons.filter(l => completedIds.has(l.id)).length;
    const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

    const catNames = categories.filter(c => course.categoryIds.includes(c.id)).map(c => c.name);

    const activeLessonIdx = activeLesson ? lessons.findIndex(l => l.id === activeLesson.id) : -1;
    const nextLesson = activeLessonIdx >= 0 && activeLessonIdx < lessons.length - 1
        ? lessons[activeLessonIdx + 1]
        : null;

    const getContent = (lesson: Lesson) => lessonContent[`${course.id}_${lesson.id}`];

    const getResources = (lesson: Lesson) => getContent(lesson)?.resources ?? [];

    const getPlayUrl = (lesson: Lesson) => {
        const raw = getContent(lesson)?.videoUrl ?? lesson.videoUrl ?? '';
        if (!raw) return '';
        const result = buildEmbedUrl(raw);
        return result ? result.embedUrl : raw;
    };

    const openLesson = async (lesson: Lesson) => {
        setOpeningLessonId(lesson.id);
        try {
            const ok = await onOpenLesson(lesson.id);
            if (ok) setActiveLesson(lesson);
        } finally {
            setOpeningLessonId(null);
        }
    };

    const openResource = async (resource: LessonResource) => {
        const url = await onGetResourceUrl(resource);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Back button */}
            <button
                onClick={onBack}
                className="mb-8 inline-flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
                <ChevronLeft size={16} /> Back to Library
            </button>

            {/* Course hero */}
            <div className="glass-card rounded-[2rem] overflow-hidden mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[320px]">
                    <div className="p-8 md:p-10 flex flex-col justify-between">
                        <div>
                            <div className="flex flex-wrap gap-2 mb-5">
                                {catNames.map(n => (
                                    <span key={n} className="inline-flex px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest">
                                        {n}
                                    </span>
                                ))}
                                {course.isRequired && (
                                    <span className="inline-flex px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                                        Required
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight leading-tight text-on-surface mb-4">
                                {course.title}
                            </h2>
                            <p className="text-on-surface-variant leading-relaxed max-w-xl">
                                {course.description}
                            </p>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">Your Progress</span>
                                <span className="text-lg font-headline font-extrabold text-primary">{pct}%</span>
                            </div>
                            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-5">
                                <div className="bg-surface-container-lowest/70 rounded-2xl p-4">
                                    <BookOpen size={18} className="text-primary mb-2" />
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Lessons</p>
                                    <p className="font-headline font-bold text-on-surface">{lessons.length}</p>
                                </div>
                                <div className="bg-surface-container-lowest/70 rounded-2xl p-4">
                                    <CheckCircle2 size={18} className="text-primary mb-2" />
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Done</p>
                                    <p className="font-headline font-bold text-on-surface">{completedCount}</p>
                                </div>
                                <div className="bg-surface-container-lowest/70 rounded-2xl p-4">
                                    <Clock size={18} className="text-primary mb-2" />
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">~Time</p>
                                    <p className="font-headline font-bold text-on-surface">
                                        {formatMinutes(lessons.reduce((t, l) => t + (l.durationMinutes ?? 12), 0))} min
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative min-h-[240px] bg-surface-container-lowest">
                        {course.coverImageUrl ? (
                            // Hero — eager + high priority so it lands
                            // in the first frame of the course-detail
                            // view. Explicit dims reserve layout space.
                            <img
                                src={course.coverImageUrl}
                                alt={course.title}
                                loading="eager"
                                decoding="async"
                                fetchPriority="high"
                                width={1200}
                                height={400}
                                className="absolute inset-0 w-full h-full object-cover opacity-70"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-transparent" />
                    </div>
                </div>
            </div>

            {/* Coach: add lesson */}
            {isManaging && onAddLesson && (
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={onAddLesson}
                        className="gold-gradient text-on-primary-fixed px-6 py-3 rounded-full text-[10px] font-label font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> Add Lesson
                    </button>
                </div>
            )}

            {/* Lesson timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-on-surface-variant">
                    <Loader2 size={32} className="animate-spin" />
                </div>
            ) : (
                <div className="relative pl-8 md:pl-12">
                    <div className="absolute left-3 md:left-5 top-2 bottom-2 w-px bg-outline-variant/30" />
                    <div className="space-y-6">
                        {lessons.map((lesson, idx) => {
                            const unlocked = canAccessLesson(lesson);
                            const watched = completedIds.has(lesson.id);
                            const inProgress = Object.values(lessonProgress).some(p =>
                                p.courseId === course.id && p.lessonId === lesson.id && p.status === 'started'
                            );
                            const resources = getResources(lesson);
                            const isFirst = idx === 0;
                            const isLast = idx === lessons.length - 1;
                            return (
                                <div key={lesson.id} className="relative">
                                    <div className={clsx(
                                        'absolute -left-[2rem] md:-left-[2.55rem] top-7 w-4 h-4 rounded-full border-2 transition-all duration-300',
                                        watched ? 'bg-primary border-primary shadow-[0_0_16px_rgba(230,195,100,0.4)]' : 'bg-surface border-outline-variant'
                                    )} />

                                    <div className={clsx(
                                        'glass-card rounded-2xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 transition-all',
                                        unlocked && !isManaging ? 'hover:-translate-y-0.5 cursor-pointer' : '',
                                        !unlocked && 'opacity-60',
                                    )}
                                        onClick={() => { if (unlocked && !isManaging) void openLesson(lesson); }}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container-lowest">
                                            {lesson.thumbnailUrl ? (
                                                // Lesson list can run long
                                                // (dozens of items); lazy +
                                                // async-decode keeps below-
                                                // viewport entries from
                                                // hammering the network.
                                                <img
                                                    src={lesson.thumbnailUrl}
                                                    alt={lesson.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    width={400}
                                                    height={225}
                                                    className={clsx('w-full h-full object-cover', !unlocked && 'grayscale opacity-50')}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-surface-container-highest" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-surface-container-highest/80 backdrop-blur flex items-center justify-center text-primary">
                                                    {unlocked ? <Play size={18} fill="currentColor" className="ml-0.5" /> : <Lock size={15} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col justify-center">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary">
                                                    Lesson {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                {lesson.isPreview && !unlocked && (
                                                    <span className="text-[10px] font-label font-bold uppercase tracking-widest text-amber-400">Preview</span>
                                                )}
                                                {watched && <span className="text-[10px] font-label font-bold uppercase tracking-widest text-emerald-400">Complete</span>}
                                                {!watched && inProgress && <span className="text-[10px] font-label font-bold uppercase tracking-widest text-sky-400">Started</span>}
                                                {openingLessonId === lesson.id && <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary">Opening...</span>}
                                                {lesson.durationMinutes && (
                                                    <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                                                        <Clock size={10} />{formatMinutes(lesson.durationMinutes)} min
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg md:text-xl font-headline font-extrabold text-on-surface mb-1.5">{lesson.title}</h3>
                                            {lesson.description && (
                                                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{lesson.description}</p>
                                            )}

                                            {/* Resources */}
                                            {resources.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {resources.map((r, i) => (
                                                        <button key={i} type="button" onClick={e => { e.stopPropagation(); void openResource(r); }}
                                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                                                            <FileText size={11} />{r.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Manage controls */}
                                            {isManaging && (
                                                <div className="flex items-center gap-2 mt-4">
                                                    <button onClick={e => { e.stopPropagation(); onEditLesson?.(lesson); }}
                                                        className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary transition-colors"><Edit2 size={13} /></button>
                                                    <button onClick={e => { e.stopPropagation(); onArchiveLesson?.(lesson.id); }}
                                                        className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                                                    <div className="ms-auto flex gap-1">
                                                        <button onClick={e => { e.stopPropagation(); onMoveLessonUp?.(lesson.id); }} disabled={isFirst}
                                                            className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-25 transition-colors"><ChevronUp size={13} /></button>
                                                        <button onClick={e => { e.stopPropagation(); onMoveLessonDown?.(lesson.id); }} disabled={isLast}
                                                            className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-25 transition-colors"><ChevronDown size={13} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {lessons.length === 0 && !loading && (
                            <div className="glass-card rounded-2xl p-12 text-center text-on-surface/40">
                                <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-body">No lessons yet.{isManaging && ' Click "Add Lesson" to get started.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Video Player Modal ──────────────────────────────────────────── */}
            {activeLesson && (
                <div className="fixed inset-0 bg-surface/95 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
                    <button
                        onClick={() => setActiveLesson(null)}
                        className="absolute top-6 right-6 flex items-center gap-2 text-on-surface/50 hover:text-on-surface transition-colors z-10 bg-surface-container-low p-2 pr-4 rounded-full border border-outline-variant/30"
                    >
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest">Close</span>
                    </button>

                    <div className="w-full max-w-5xl animate-in zoom-in-95 duration-300">
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30">
                            <VideoPlayer url={getPlayUrl(activeLesson)} />
                        </div>
                        <div className="mt-6 text-center max-w-3xl mx-auto">
                            <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-2 tracking-tight">{activeLesson.title}</h2>
                            {/* Description — YouTube-style collapsible card.
                                Collapsed shows 2 lines + "Show more"; expanded
                                shows the full text + "Show less". The whole
                                card is clickable when collapsed so a tap on
                                a phone expands without aiming for a small
                                button. The paragraph preserves whitespace
                                (multi-line descriptions render correctly). */}
                            {activeLesson.description && (
                                <div
                                    onClick={() => !descExpanded && descNeedsToggle && setDescExpanded(true)}
                                    className={clsx(
                                        'mt-3 text-left bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 transition-colors',
                                        !descExpanded && descNeedsToggle && 'cursor-pointer hover:bg-surface-container',
                                    )}
                                >
                                    <p
                                        ref={descRef}
                                        className={clsx(
                                            'text-on-surface/70 font-body leading-relaxed text-sm',
                                            !descExpanded && 'line-clamp-2',
                                        )}
                                        style={{ whiteSpace: 'pre-wrap' }}
                                    >
                                        {activeLesson.description}
                                    </p>
                                    {descNeedsToggle && (
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setDescExpanded(v => !v); }}
                                            className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-label font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors"
                                        >
                                            {descExpanded ? <>Show less <ChevronUp size={12} /></> : <>Show more <ChevronDown size={12} /></>}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                                <button
                                    onClick={() => { void handleMarkComplete(activeLesson.id); }}
                                    disabled={marking || completedIds.has(activeLesson.id)}
                                    className={clsx(
                                        'gold-gradient text-on-primary-fixed px-8 py-3 rounded-full font-label text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all',
                                        (marking || completedIds.has(activeLesson.id)) && 'opacity-60 pointer-events-none'
                                    )}
                                >
                                    <CheckCircle2 size={16} />
                                    {marking
                                        ? 'Saving…'
                                        : completedIds.has(activeLesson.id)
                                            ? 'Lesson Complete'
                                            : 'Mark as Complete'}
                                </button>
                                {nextLesson && canAccessLesson(nextLesson) && (
                                    <button
                                        onClick={async () => {
                                            const ok = await handleMarkComplete(activeLesson.id);
                                            // Only advance if the mark succeeded — otherwise
                                            // the user lands on a locked lesson and the back-
                                            // and-forth confuses them.
                                            if (ok) void openLesson(nextLesson);
                                        }}
                                        disabled={marking}
                                        className={clsx(
                                            'px-8 py-3 rounded-full font-label text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 hover:border-primary/60 active:scale-95 transition-all flex items-center gap-2',
                                            marking && 'opacity-60 pointer-events-none'
                                        )}
                                    >
                                        Next Lesson <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Error banner — replaces the silent failure pattern.
                                Auto-clears after 5s (see handleMarkComplete). */}
                            {markError && (
                                <div
                                    role="alert"
                                    className="mt-4 mx-auto max-w-md px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] font-body text-center"
                                >
                                    {markError}
                                </div>
                            )}

                            {/* Resources */}
                            {getResources(activeLesson).length > 0 && (
                                <div className="mt-8 text-left bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
                                    <h3 className="text-[10px] font-label font-bold text-primary mb-3 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Resources
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {getResources(activeLesson).map((r, i) => (
                                            <button key={i} type="button" onClick={() => void openResource(r)}
                                                className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 hover:border-primary/40 transition-colors group">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary text-primary transition-colors">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="flex-1 text-sm font-body font-medium text-on-surface truncate">{r.name}</span>
                                                <Download size={16} className="text-on-surface/30 group-hover:text-primary transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
