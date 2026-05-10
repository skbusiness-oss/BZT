import clsx from 'clsx';
import { BookOpen, ChevronUp, ChevronDown, Edit2, Trash2, Eye, EyeOff, Lock, Copy } from 'lucide-react';
import { Course, LibraryCategory, UserCourseProgress } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
    course: Course;
    categories: LibraryCategory[];
    progress?: UserCourseProgress;
    lessonCount?: number;
    isManaging?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    canAccess: boolean;
    onSelect: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onEdit?: () => void;
    onArchive?: () => void;
    onTogglePublish?: () => void;
    /** Deep-copy this course to a new draft. Optional so non-managing
     *  surfaces (or older callers) don't have to pass it. */
    onDuplicate?: () => void;
    /** Disable the duplicate button while a clone is in flight. */
    duplicateBusy?: boolean;
}

// Falls back to a neutral surface-container style when `course.level` is
// missing or unrecognized — without this, the badge renders class=""
// which collapses to a transparent pill (looks broken). (§1.7.5)
const LEVEL_COLOR: Record<string, string> = {
    beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
};
const LEVEL_COLOR_FALLBACK = 'text-on-surface-variant bg-surface-container-highest border-outline-variant/30';

const TYPE_LABEL: Record<string, string> = {
    academy: 'Core Curriculum',
    recorded_live: 'Live Session',
    bonus: 'Bonus',
};
const TYPE_LABEL_FALLBACK = 'Course';

export const CourseCard = ({
    course, categories, progress, lessonCount = 0,
    isManaging, isFirst, isLast, canAccess,
    onSelect, onMoveUp, onMoveDown, onEdit, onArchive, onTogglePublish,
    onDuplicate, duplicateBusy,
}: Props) => {
    const { t } = useLanguage();
    const completedCount = progress?.completedLessonIds.length ?? 0;
    const pct = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
    const isComplete = lessonCount > 0 && completedCount >= lessonCount;
    const catNames = categories
        .filter(c => course.categoryIds.includes(c.id))
        .map(c => c.name)
        .slice(0, 2);
    // Locked teaser state — visible to non-managing audiences, but the card
    // is non-interactive (cover + title only, no entry into the course).
    // Coaches in manage mode keep full access via the "Lessons" button.
    const isLockedTeaser = !!course.isLocked && !isManaging;
    const interactable = canAccess && !isManaging && !isLockedTeaser;

    return (
        <div className={clsx(
            'glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-500',
            interactable ? 'hover:-translate-y-2 cursor-pointer' : '',
            !canAccess && 'opacity-70',
            !course.isPublished && isManaging && 'border border-dashed border-outline-variant/40',
        )}>
            {/* Thumbnail */}
            <div
                className="relative h-48 overflow-hidden"
                onClick={() => interactable ? onSelect() : undefined}
            >
                {course.coverImageUrl ? (
                    <img
                        src={course.coverImageUrl}
                        alt={course.title}
                        className={clsx(
                            'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105',
                            !canAccess && 'grayscale opacity-50',
                        )}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent" />

                {/* Level badge — top left */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={clsx(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                        LEVEL_COLOR[course.level] ?? LEVEL_COLOR_FALLBACK,
                    )}>
                        {course.level ?? 'unset'}
                    </span>
                    {!course.isPublished && isManaging && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest/80 text-on-surface-variant border border-outline-variant/30 backdrop-blur">
                            Draft
                        </span>
                    )}
                    {isComplete && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-400/20 text-emerald-400 border border-emerald-400/30">
                            Complete
                        </span>
                    )}
                </div>

                {/* Type badge + lock pill — top right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isLockedTeaser && (
                        <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur text-[10px] font-bold uppercase tracking-widest"
                            style={{
                                background: 'rgb(var(--primary) / 0.20)',
                                color: 'rgb(var(--primary))',
                                border: '1px solid rgb(var(--primary) / 0.35)',
                            }}
                            title="Locked — coming soon"
                        >
                            <Lock size={11} strokeWidth={2.5} /> Locked
                        </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest/80 backdrop-blur text-on-surface text-[10px] font-bold uppercase tracking-widest">
                        {TYPE_LABEL[course.courseType] ?? TYPE_LABEL_FALLBACK}
                    </span>
                </div>

                {/* Lock overlay for inaccessible courses */}
                {!canAccess && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest/80 backdrop-blur flex items-center justify-center">
                            <Lock size={20} className="text-on-surface/50" />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {catNames.map(n => (
                        <span key={n} className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            {n}
                        </span>
                    ))}
                    {catNames.length === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {TYPE_LABEL[course.courseType] ?? TYPE_LABEL_FALLBACK}
                        </span>
                    )}
                </div>

                <h3
                    className={clsx(
                        'text-xl font-headline font-extrabold mb-2 leading-tight transition-colors',
                        interactable && 'group-hover:text-primary',
                    )}
                    onClick={() => interactable ? onSelect() : undefined}
                >
                    {course.title}
                </h3>
                <p className="text-on-surface-variant text-sm font-body line-clamp-2 leading-relaxed mb-5">
                    {course.description}
                </p>

                {/* Progress bar */}
                {canAccess && lessonCount > 0 && (
                    <div className="mt-auto">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Progress</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                {completedCount}/{lessonCount}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span className="flex items-center gap-1"><BookOpen size={12} />{lessonCount} Lessons</span>
                    {!canAccess && <span className="text-on-surface/40 flex items-center gap-1"><Lock size={12} />{t('upgradeToUnlock')}</span>}
                </div>

                {/* Manage controls */}
                {isManaging && (
                    <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-outline-variant/20">
                        <button
                            onClick={() => onSelect()}
                            className="px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-container text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                            <BookOpen size={12} /> Lessons
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                            title="Edit course"
                        ><Edit2 size={14} /></button>
                        <button
                            onClick={onTogglePublish}
                            className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-amber-400 transition-colors"
                            title={course.isPublished ? 'Unpublish' : 'Publish'}
                        >
                            {course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {onDuplicate && (
                            <button
                                onClick={onDuplicate}
                                disabled={duplicateBusy}
                                className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Duplicate course"
                            ><Copy size={14} /></button>
                        )}
                        <button
                            onClick={onArchive}
                            className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-red-400 transition-colors"
                            title="Archive course"
                        ><Trash2 size={14} /></button>
                        <div className="ms-auto flex gap-1">
                            <button
                                onClick={onMoveUp}
                                disabled={isFirst}
                                className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-25 transition-colors"
                            ><ChevronUp size={14} /></button>
                            <button
                                onClick={onMoveDown}
                                disabled={isLast}
                                className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-25 transition-colors"
                            ><ChevronDown size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
