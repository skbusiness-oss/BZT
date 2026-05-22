import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, X,
    Edit2, Trash2,
    ArrowRight, ArrowLeft,
    Tv2, Tag, Settings2, GraduationCap,
    BookOpen, Award, Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { CourseCard } from '../components/academy/CourseCard';
import { CourseDetail } from '../components/academy/CourseDetail';
import { ManageCourseModal } from '../components/academy/ManageCourseModal';
import { ManageLessonModal } from '../components/academy/ManageLessonModal';
import { useAcademy } from '../context/AcademyContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Course, Lesson, LessonResource, LibraryCategory } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
// 'videos' (legacy flat-video archive) was removed per founder direction —
// University surfaces academy + lives + topics only. The /videos
// Firestore collection stays (read-only) for back-compat with any
// historical references; the UI no longer exposes it.
type MainTab = 'academy' | 'lives' | 'topics' | 'manage';
// Academy levels arranged as a sequential learning ladder, plus a
// "topics" bucket for off-path content. Mirrors the 4-card collection
// pattern the reference UI uses — user picks one and drills in.
type AcademyLevel = 'beginner' | 'intermediate' | 'advanced' | 'topics';
type LessonFormData = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
    resources?: LessonResource[];
};

// ─────────────────────────────────────────────────────────────────────────────

export const VideoLibrary = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    // Legacy /videos collection access was removed from this page with the
    // Video Archive deletion. The collection still exists in Firestore for
    // any back-compat callers but the University surface no longer reads
    // or writes it.
    useData();
    const {
        courses, libraryCategories, lessons, lessonContent, lessonProgress, userProgress, loading: academyLoading,
        loadLessons, loadLessonContent, createCourse, updateCourse, archiveCourse, moveCourse, duplicateCourse,
        createLesson, updateLesson, archiveLesson, moveLesson,
        createCategory, updateCategory, archiveCategory,
        getLessonResourceUrl, markLessonStarted, markLessonComplete,
    } = useAcademy();

    const isCoach = user?.role === 'coach' || user?.role === 'admin';

    // ── Navigation state ──────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<MainTab>('academy');
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [topicFilter, setTopicFilter] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    // Academy level drill-down — null = show the 4 collection cards,
    // else show the course grid for that level. Reset whenever the
    // user leaves the academy tab so re-entering lands on the cards
    // rather than the previously-opened level.
    const [activeLevel, setActiveLevel] = useState<AcademyLevel | null>(null);

    // ── Modal state ───────────────────────────────────────────────────────────
    const [courseModal, setCourseModal] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null });
    const [lessonModal, setLessonModal] = useState<{ open: boolean; lesson: Lesson | null; courseId: string }>({ open: false, lesson: null, courseId: '' });
    const [newCatName, setNewCatName] = useState('');
    const [editingCat, setEditingCat] = useState<LibraryCategory | null>(null);
    const [editingCatName, setEditingCatName] = useState('');

    // ── Derived data ──────────────────────────────────────────────────────────
    const academyCourses = useMemo(() =>
        courses.filter(c => c.courseType === 'academy').sort((a, b) => a.order - b.order),
        [courses]);

    const liveCourses = useMemo(() =>
        courses.filter(c => c.courseType === 'recorded_live').sort((a, b) => a.order - b.order),
        [courses]);

    const topicCourses = useMemo(() => {
        let list = courses;
        if (topicFilter) list = list.filter(c => c.categoryIds.includes(topicFilter));
        if (search) list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
        return list.sort((a, b) => a.order - b.order);
    }, [courses, topicFilter, search]);

    // ── Academy ladder grouping ────────────────────────────────────────
    // The new collection-card UX groups courses into four ordered
    // buckets. "Topics" is anything OFF the structured Zero-to-Hero
    // path — optional academy courses, live sessions, anything that's
    // not part of the linear beginner→advanced progression.
    const academyByLevel = useMemo(() => {
        const beginner = academyCourses.filter(c => c.level === 'beginner' && c.isRequired);
        const intermediate = academyCourses.filter(c => c.level === 'intermediate' && c.isRequired);
        const advanced = academyCourses.filter(c => c.level === 'advanced' && c.isRequired);
        const requiredIds = new Set([...beginner, ...intermediate, ...advanced].map(c => c.id));
        // Topics = everything not in the linear ladder. Includes
        // optional academy courses AND live sessions in one pool so
        // the user has a single off-path landing.
        const topics = courses
            .filter(c => !requiredIds.has(c.id))
            .sort((a, b) => a.order - b.order);
        return { beginner, intermediate, advanced, topics };
    }, [academyCourses, courses]);

    const activeCourse = activeCourseId ? courses.find(c => c.id === activeCourseId) ?? null : null;
    const activeLessons = activeCourseId ? (lessons[activeCourseId] ?? []) : [];
    const activeProgress = activeCourseId ? userProgress[activeCourseId] : undefined;
    const lessonsLoading = activeCourseId ? !lessons[activeCourseId] : false;

    // Continue Learning: first required academy course with incomplete lessons
    const continueLearning = useMemo(() => {
        for (const course of academyCourses.filter(c => c.isRequired && c.isPublished)) {
            const progress = userProgress[course.id];
            const completedIds = new Set(progress?.completedLessonIds ?? []);
            const cl = lessons[course.id] ?? [];
            const required = cl.filter(l => l.isRequired && !l.archived);
            const hasIncomplete = required.some(l => !completedIds.has(l.id)) || cl.length === 0;
            if (hasIncomplete) {
                const nextLesson = required.find(l => !completedIds.has(l.id)) ?? null;
                return { course, nextLesson };
            }
        }
        return null;
    }, [academyCourses, userProgress, lessons]);

    // Load lessons when a course is opened
    useEffect(() => {
        if (activeCourseId) loadLessons(activeCourseId);
    }, [activeCourseId, loadLessons, user?.role]);

    // Pre-load first required academy course for Continue Learning banner
    useEffect(() => {
        const first = academyCourses.find(c => c.isRequired && c.isPublished);
        if (first) loadLessons(first.id);
    }, [academyCourses, loadLessons]);

    // ── Access control ────────────────────────────────────────────────────────
    // Mirrors `canPlayCourse()` in firestore.rules. Community sees the card
    // but the rules block lessonContent reads; the UI shows the lock badge
    // and "Upgrade to unlock" CTA via CourseCard's existing canAccess prop.
    const canAccessCourse = (course: Course) => {
        if (isCoach) return true;
        if (!course.isPublished) return false;
        if (course.accessTier === 'community') return true;
        if (course.accessTier === 'client') return user?.role === 'client';
        return false;
    };

    const canAccessLesson = (lesson: Lesson, course: Course) => {
        if (isCoach) return true;
        if (lesson.isPreview && course.isPublished) return true;
        if (!canAccessCourse(course)) return false;
        if (!lesson.isRequired) return true;
        if ((lesson.order ?? 1) <= 1) return true;
        if (!lesson.prerequisiteLessonId) return false;
        return lessonProgress[`${user?.id}_${course.id}_${lesson.prerequisiteLessonId}`]?.status === 'completed';
    };

    // Card click router: paid roles + coaches open the course detail;
    // community users on a locked card route to /pricing so the lock is
    // a conversion surface, not a dead end.
    const handleCourseSelect = (course: Course) => {
        if (canAccessCourse(course)) {
            setActiveCourseId(course.id);
        } else {
            navigate('/pricing');
        }
    };

    // ── Course CRUD handlers ──────────────────────────────────────────────────
    const openCreateCourse = () => setCourseModal({ open: true, course: null });
    const openEditCourse = (course: Course) => setCourseModal({ open: true, course });
    const closeCourseModal = () => setCourseModal({ open: false, course: null });

    const handleSaveCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
        if (courseModal.course) {
            await updateCourse(courseModal.course.id, data);
        } else {
            await createCourse(data);
        }
        closeCourseModal();
    };

    const handleArchiveCourse = async (courseId: string) => {
        if (window.confirm('Archive this course? It will be hidden from all students.')) {
            await archiveCourse(courseId);
            if (activeCourseId === courseId) setActiveCourseId(null);
        }
    };

    const handleTogglePublish = async (course: Course) => {
        await updateCourse(course.id, { isPublished: !course.isPublished });
    };

    // Track which course is mid-clone so we can disable the button + render
    // a busy state in the card. Cleared after the new course id is back.
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const handleDuplicateCourse = async (course: Course) => {
        if (duplicatingId) return; // serialize — one clone at a time
        setDuplicatingId(course.id);
        try {
            await duplicateCourse(course.id);
        } catch (err) {
            console.error('Failed to duplicate course:', err);
            window.alert('Failed to duplicate course. See console for details.');
        } finally {
            setDuplicatingId(null);
        }
    };

    // ── Lesson CRUD handlers ──────────────────────────────────────────────────
    const openAddLesson = (courseId: string) => setLessonModal({ open: true, lesson: null, courseId });
    const openEditLesson = (lesson: Lesson, courseId: string) => {
        void loadLessonContent(courseId, lesson.id);
        setLessonModal({ open: true, lesson, courseId });
    };
    const closeLessonModal = () => setLessonModal({ open: false, lesson: null, courseId: '' });

    const handleSaveLesson = async (data: LessonFormData) => {
        if (lessonModal.lesson) {
            await updateLesson(lessonModal.courseId, lessonModal.lesson.id, data);
        } else {
            await createLesson(lessonModal.courseId, data);
        }
        closeLessonModal();
    };

    const handleOpenLesson = async (course: Course, lessonId: string) => {
        const lesson = (lessons[course.id] ?? []).find(l => l.id === lessonId);
        if (!lesson || !canAccessLesson(lesson, course)) return false;
        await loadLessonContent(course.id, lessonId);
        await markLessonStarted(course.id, lessonId);
        return true;
    };

    const handleArchiveLesson = async (courseId: string, lessonId: string) => {
        if (window.confirm('Archive this lesson? Students will no longer see it.')) {
            await archiveLesson(courseId, lessonId);
        }
    };

    // ── Category CRUD handlers ────────────────────────────────────────────────
    const handleSaveCategory = async () => {
        if (!newCatName.trim()) return;
        await createCategory(newCatName.trim());
        setNewCatName('');
    };

    const handleRenameCategory = async (cat: LibraryCategory) => {
        if (editingCatName.trim() && editingCatName.trim() !== cat.name) {
            await updateCategory(cat.id, { name: editingCatName.trim() });
        }
        setEditingCat(null);
    };

    const handleArchiveCategory = async (cat: LibraryCategory) => {
        if (window.confirm(`Archive category "${cat.name}"?`)) {
            await archiveCategory(cat.id);
        }
    };

    // Legacy video CRUD handlers were removed alongside the Video
    // Archive tab + modals.

    // ── Helpers ───────────────────────────────────────────────────────────────
    const maxCourseOrder = courses.length > 0 ? Math.max(...courses.map(c => c.order)) : 0;
    const nextLessonOrder = activeCourseId
        ? (lessons[activeCourseId]?.length ? Math.max(...lessons[activeCourseId].map(l => l.order)) + 1 : 1)
        : 1;

    const TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
        { id: 'academy', label: t('tabAcademyPath'),   icon: <GraduationCap size={15} /> },
        { id: 'lives',   label: t('tabLiveSessions'),  icon: <Tv2 size={15} /> },
        { id: 'topics',  label: t('tabTopics'),        icon: <Tag size={15} /> },
        ...(isCoach ? [{ id: 'manage' as MainTab, label: t('tabManage'), icon: <Settings2 size={15} /> }] : []),
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="animate-in fade-in duration-500 pb-32">

            {/* ── Editorial Header ─────────────────────────────────────────── */}
            <section className="mb-10">
                <span className="text-primary font-headline font-bold text-sm tracking-[0.3em] uppercase mb-3 block">
                    {t('zeroToHeroEyebrow')}
                </span>
                <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter leading-none text-on-surface mb-5">
                    {t('academyTitle')}<span className="text-primary-container">.</span>
                </h1>
                <p className="text-on-surface-variant font-body leading-relaxed max-w-xl mb-8">
                    {t('academyHeaderBlurb')}
                </p>

                {/* Tab bar */}
                <div className="flex items-center gap-1 bg-surface-container-low rounded-full p-2 w-fit mb-8 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setActiveCourseId(null); setActiveLevel(null); }}
                            className={clsx(
                                'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest font-headline transition-all duration-300 whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'gold-gradient text-on-primary-fixed shadow-lg shadow-primary/20'
                                    : 'text-on-surface-variant hover:text-primary',
                            )}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>

                {/* Search — Topics tab only */}
                {activeTab === 'topics' && (
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative group bg-surface-container rounded-full pl-9 pr-1 py-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" size={14} />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-transparent border-0 outline-none focus:ring-0 py-1.5 pr-3 text-xs font-body text-on-surface placeholder:text-on-surface-variant/50 w-48"
                            />
                            <div className="absolute bottom-0 left-6 right-6 h-px bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left shadow-[0_0_8px_rgba(230,195,100,0.5)]" />
                        </div>
                    </div>
                )}
            </section>

            {activeCourse && (
                <CourseDetail
                    course={activeCourse}
                    categories={libraryCategories}
                    lessons={activeLessons}
                    lessonContent={lessonContent}
                    lessonProgress={lessonProgress}
                    progress={activeProgress}
                    loading={lessonsLoading}
                    isManaging={activeTab === 'manage'}
                    canAccessLesson={(l) => canAccessLesson(l, activeCourse)}
                    onBack={() => setActiveCourseId(null)}
                    onOpenLesson={(lessonId) => handleOpenLesson(activeCourse, lessonId)}
                    onMarkComplete={(lessonId) => markLessonComplete(activeCourse.id, lessonId)}
                    onGetResourceUrl={getLessonResourceUrl}
                    onAddLesson={() => openAddLesson(activeCourse.id)}
                    onEditLesson={(l) => openEditLesson(l, activeCourse.id)}
                    onArchiveLesson={(id) => handleArchiveLesson(activeCourse.id, id)}
                    onMoveLessonUp={(id) => moveLesson(activeCourse.id, id, 'up')}
                    onMoveLessonDown={(id) => moveLesson(activeCourse.id, id, 'down')}
                />
            )}

            {/* ── Academy Path Tab ─────────────────────────────────────────── */}
            {!activeCourse && activeTab === 'academy' && (
                <div className="space-y-12">
                    {/* Continue Learning banner — only on the landing
                        card-grid view. Once the user drills into a level
                        the banner would just be redundant noise above the
                        course grid. */}
                    {continueLearning && !activeLevel && (
                        <div
                            className="bzt-hero-card relative overflow-hidden rounded-2xl"
                            style={{
                                minHeight: 220,
                                border: '1px solid rgb(var(--outline-variant) / 0.30)',
                                boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
                            }}
                        >
                            <div
                                className="bzt-hero-photo"
                                style={{
                                    position: 'absolute', inset: 0,
                                    backgroundImage: 'url(/dashboard-covers/continue-learning.jpg)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                                }}
                            />
                            <div className="relative p-7 md:p-8 flex flex-col md:flex-row gap-6 md:items-end justify-between min-h-[220px]">
                                <div className="flex-1">
                                    <span
                                        className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] block mb-2"
                                        style={{ color: '#e6c364' }}
                                    >
                                        {t('continueLearningEyebrow')}
                                    </span>
                                    <h2
                                        className="text-2xl md:text-[28px] font-headline font-extrabold mb-2 leading-tight"
                                        style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                                    >
                                        {continueLearning.course.title}
                                    </h2>
                                    {continueLearning.nextLesson && (
                                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                                            {t('continueNextLabel')}: <span style={{ color: '#fff', fontWeight: 500 }}>{continueLearning.nextLesson.title}</span>
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setActiveCourseId(continueLearning.course.id)}
                                    className="gold-gradient text-on-primary-fixed px-8 py-3.5 rounded-full font-label text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shrink-0 shadow-lg shadow-primary/30 active:scale-95 transition-all self-start md:self-end"
                                >
                                    {t('continueCta')} <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Landing: 4 numbered collection cards ───────────
                        Communicates the linear progression: start with 1
                        Beginner, finish all topics inside, then move to 2,
                        then 3. Card 4 (Topics) is the off-path bucket. */}
                    {!activeLevel && (
                        <>
                            <div>
                                <h2 className="text-xl font-headline font-extrabold text-on-surface mb-1">{t('universityCollections')}</h2>
                                <p className="text-on-surface-variant text-sm font-body mb-6">
                                    {t('universityFollowOrder')}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <LevelCollectionCard
                                        index={1}
                                        title={t('universityBeginner')}
                                        subtitle={`${academyByLevel.beginner.length} ${academyByLevel.beginner.length === 1 ? t('universityCourseSingular') : t('universityCoursePlural')} · ${t('universityBeginnerTag')}`}
                                        accentColor="rgb(16 185 129)"   /* emerald */
                                        accentTint="rgb(16 185 129 / 0.10)"
                                        icon={<GraduationCap size={22} />}
                                        coverUrl="/university/level-beginner.jpg"
                                        onClick={() => setActiveLevel('beginner')}
                                        disabled={academyByLevel.beginner.length === 0}
                                    />
                                    <LevelCollectionCard
                                        index={2}
                                        title={t('universityIntermediate')}
                                        subtitle={`${academyByLevel.intermediate.length} ${academyByLevel.intermediate.length === 1 ? t('universityCourseSingular') : t('universityCoursePlural')} · ${t('universityIntermediateTag')}`}
                                        accentColor="rgb(245 158 11)"   /* amber */
                                        accentTint="rgb(245 158 11 / 0.10)"
                                        icon={<BookOpen size={22} />}
                                        coverUrl="/university/level-intermediate.jpg"
                                        onClick={() => setActiveLevel('intermediate')}
                                        disabled={academyByLevel.intermediate.length === 0}
                                    />
                                    <LevelCollectionCard
                                        index={3}
                                        title={t('universityAdvanced')}
                                        subtitle={`${academyByLevel.advanced.length} ${academyByLevel.advanced.length === 1 ? t('universityCourseSingular') : t('universityCoursePlural')} · ${t('universityAdvancedTag')}`}
                                        accentColor="rgb(244 63 94)"    /* rose */
                                        accentTint="rgb(244 63 94 / 0.10)"
                                        icon={<Award size={22} />}
                                        coverUrl="/university/level-advanced.jpg"
                                        onClick={() => setActiveLevel('advanced')}
                                        disabled={academyByLevel.advanced.length === 0}
                                    />
                                    <LevelCollectionCard
                                        index={4}
                                        title={t('universityTopics')}
                                        subtitle={`${academyByLevel.topics.length} ${academyByLevel.topics.length === 1 ? t('universityCourseSingular') : t('universityCoursePlural')} · ${t('universityTopicsTag')}`}
                                        accentColor="rgb(168 85 247)"   /* violet */
                                        accentTint="rgb(168 85 247 / 0.10)"
                                        icon={<Sparkles size={22} />}
                                        onClick={() => setActiveLevel('topics')}
                                        disabled={academyByLevel.topics.length === 0}
                                    />
                                </div>
                            </div>

                            {academyCourses.length === 0 && !academyLoading && (
                                <div className="glass-card rounded-2xl p-16 text-center text-on-surface/40">
                                    <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-body">
                                        {t('noAcademyCoursesYet')}{isCoach && ` ${t('noAcademyCoursesCoachHint')}`}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Drill-down: courses inside the selected level ─── */}
                    {activeLevel && (() => {
                        const group = academyByLevel[activeLevel];
                        const titleMap: Record<AcademyLevel, string> = {
                            beginner: 'Beginner',
                            intermediate: 'Intermediate',
                            advanced: 'Advanced',
                            topics: 'Topics',
                        };
                        return (
                            <div>
                                <button
                                    onClick={() => setActiveLevel(null)}
                                    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 text-[10px] font-label font-bold uppercase tracking-widest"
                                >
                                    <ArrowLeft size={14} /> Back to collections
                                </button>
                                <div className="flex items-baseline gap-3 mb-6">
                                    <h2 className="text-2xl font-headline font-extrabold text-on-surface">{titleMap[activeLevel]}</h2>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                        {group.length} {group.length === 1 ? 'course' : 'courses'}
                                    </span>
                                </div>
                                {group.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-16 text-center text-on-surface/40">
                                        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-body">
                                            No courses in this collection yet.{isCoach && ` Add one from the Manage tab.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {group.map(course => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                categories={libraryCategories}
                                                progress={userProgress[course.id]}
                                                lessonCount={course.lessonCount ?? lessons[course.id]?.length ?? 0}
                                                canAccess={canAccessCourse(course)}
                                                onSelect={() => handleCourseSelect(course)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ── Live Sessions Tab ────────────────────────────────────────── */}
            {!activeCourse && activeTab === 'lives' && (
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-on-surface-variant text-sm">Recorded live sessions — browse and watch at your own pace.</p>
                        {isCoach && (
                            <button
                                onClick={openCreateCourse}
                                className="gold-gradient w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 active:scale-90 transition-all"
                                title="Add live session"
                            ><Plus size={18} className="text-on-primary-fixed" /></button>
                        )}
                    </div>
                    {liveCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {liveCourses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    categories={libraryCategories}
                                    progress={userProgress[course.id]}
                                    lessonCount={course.lessonCount ?? lessons[course.id]?.length ?? 0}
                                    canAccess={canAccessCourse(course)}
                                    onSelect={() => handleCourseSelect(course)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-16 text-center text-on-surface/40">
                            <Tv2 size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-body">No recorded sessions yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Topics Tab ──────────────────────────────────────────────── */}
            {!activeCourse && activeTab === 'topics' && (
                <div>
                    {/* Category chip row */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
                        <button
                            onClick={() => setTopicFilter(null)}
                            className={clsx(
                                'px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300',
                                !topicFilter ? 'gold-gradient text-on-primary-fixed shadow-md' : 'bg-surface-container-highest text-on-surface-variant hover:text-primary',
                            )}
                        >All</button>
                        {libraryCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setTopicFilter(topicFilter === cat.id ? null : cat.id)}
                                className={clsx(
                                    'px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300',
                                    topicFilter === cat.id ? 'gold-gradient text-on-primary-fixed shadow-md' : 'bg-surface-container-highest text-on-surface-variant hover:text-primary',
                                )}
                            >
                                {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
                            </button>
                        ))}
                    </div>

                    {topicCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topicCourses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    categories={libraryCategories}
                                    progress={userProgress[course.id]}
                                    lessonCount={course.lessonCount ?? lessons[course.id]?.length ?? 0}
                                    canAccess={canAccessCourse(course)}
                                    onSelect={() => handleCourseSelect(course)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-16 text-center text-on-surface/40">
                            <Tag size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-body">{search ? `No courses match "${search}"` : 'No courses in this topic.'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Manage Tab (coach only) ──────────────────────────────────── */}
            {!activeCourse && activeTab === 'manage' && isCoach && (
                <div className="space-y-10">
                    {/* Create course button */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-headline font-extrabold text-on-surface">Course Management</h2>
                            <p className="text-xs text-on-surface-variant mt-1">Use ↑↓ arrows to reorder. Unpublished courses are only visible to coaches.</p>
                        </div>
                        <button
                            onClick={openCreateCourse}
                            className="gold-gradient text-on-primary-fixed px-6 py-3 rounded-full font-label text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        ><Plus size={16} /> New Course</button>
                    </div>

                    {/* Course list */}
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course, idx) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    categories={libraryCategories}
                                    progress={userProgress[course.id]}
                                    lessonCount={course.lessonCount ?? lessons[course.id]?.length}
                                    isManaging
                                    isFirst={idx === 0}
                                    isLast={idx === courses.length - 1}
                                    canAccess
                                    onSelect={() => handleCourseSelect(course)}
                                    onMoveUp={() => moveCourse(course.id, 'up')}
                                    onMoveDown={() => moveCourse(course.id, 'down')}
                                    onEdit={() => openEditCourse(course)}
                                    onArchive={() => handleArchiveCourse(course.id)}
                                    onTogglePublish={() => handleTogglePublish(course)}
                                    onDuplicate={() => handleDuplicateCourse(course)}
                                    duplicateBusy={duplicatingId === course.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-12 text-center text-on-surface/40">
                            <GraduationCap size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-body">No courses yet. Click "New Course" to create the first one.</p>
                        </div>
                    )}

                    {/* Category management */}
                    <div className="glass-card rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-headline font-extrabold text-on-surface">Topics / Categories</h2>
                                <p className="text-xs text-on-surface-variant mt-1">Used to tag courses and power the Topics browse view.</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            {libraryCategories.map(cat => (
                                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                                    {editingCat?.id === cat.id ? (
                                        <>
                                            <input
                                                value={editingCatName}
                                                onChange={e => setEditingCatName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRenameCategory(cat); if (e.key === 'Escape') setEditingCat(null); }}
                                                className="flex-1 bg-transparent border-b border-primary/50 outline-none text-sm font-body text-on-surface py-0.5"
                                                autoFocus
                                            />
                                            <button onClick={() => handleRenameCategory(cat)} className="text-primary text-[10px] font-bold uppercase tracking-widest">Save</button>
                                            <button onClick={() => setEditingCat(null)} className="text-on-surface/40 hover:text-on-surface transition-colors"><X size={14} /></button>
                                        </>
                                    ) : (
                                        <>
                                            {cat.icon && <span className="text-base">{cat.icon}</span>}
                                            <span className="flex-1 text-sm font-body text-on-surface">{cat.name}</span>
                                            <button onClick={() => { setEditingCat(cat); setEditingCatName(cat.name); }} className="min-w-9 min-h-9 p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-highest/50 transition-colors flex items-center justify-center" aria-label="Edit category"><Edit2 size={14} /></button>
                                            <button onClick={() => handleArchiveCategory(cat)} className="min-w-9 min-h-9 p-2 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center" aria-label="Archive category"><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            ))}
                            {libraryCategories.length === 0 && (
                                <p className="text-xs text-on-surface/30 font-body py-4 text-center">No categories yet.</p>
                            )}
                        </div>

                        <div className="flex gap-3 border-t border-outline-variant/20 pt-5">
                            <input
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveCategory(); }}
                                placeholder="e.g. Nutrition, Hormones, Recovery…"
                                className="flex-1 bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl px-4 py-3 text-sm font-body text-on-surface transition-colors"
                            />
                            <button
                                onClick={handleSaveCategory}
                                disabled={!newCatName.trim()}
                                className="gold-gradient w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none active:scale-90 transition-all"
                            ><Plus size={18} className="text-on-primary-fixed" /></button>
                        </div>
                    </div>

                </div>
            )}

            {/* ── Academy CRUD Modals ───────────────────────────────────────── */}
            {courseModal.open && (
                <ManageCourseModal
                    course={courseModal.course}
                    categories={libraryCategories}
                    maxOrder={maxCourseOrder}
                    onSave={handleSaveCourse}
                    onClose={closeCourseModal}
                />
            )}

            {lessonModal.open && (
                <ManageLessonModal
                    lesson={lessonModal.lesson}
                    courseId={lessonModal.courseId}
                    nextOrder={nextLessonOrder}
                    onSave={handleSaveLesson}
                    onClose={closeLessonModal}
                />
            )}

        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────
// LevelCollectionCard — one of the 4 ordered cards on the academy
// landing. Two visual modes:
//
//   1. Photo-backdrop mode (preferred for the 3 main levels) — a
//      full-bleed branded thumbnail with a bottom-dark gradient so the
//      title, level pill, and arrow stay legible regardless of cover
//      brightness. Same pattern as BigCalorieBandCard on Diets, so
//      the cross-app card language stays consistent.
//
//   2. Tinted-icon mode (fallback, used for Topics) — the original
//      treatment with a tinted background, big number badge, and soft
//      icon. Used when no `coverUrl` is supplied.
//
// Disabled state (count = 0) renders the card muted so the user knows
// nothing's there yet without it looking like a layout bug.
// ─────────────────────────────────────────────────────────────────────
function LevelCollectionCard({
    index,
    title,
    subtitle,
    accentColor,
    accentTint,
    icon,
    onClick,
    disabled,
    coverUrl,
}: {
    index: number;
    title: string;
    subtitle: string;
    /** Solid color for the number badge + outline accents. */
    accentColor: string;
    /** Translucent tint for the card background fill (fallback mode). */
    accentTint: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    /** Optional branded photo for the card backdrop. When set, the
        card flips to photo-backdrop mode (full-bleed image + bottom
        darken). When omitted, falls back to the tinted-icon style. */
    coverUrl?: string;
}) {
    // Translated labels for the "Level N" pill and "Open" CTA.
    // Numerals stay LTR even in Arabic so a future "Level 10" doesn't
    // get reordered to "01".
    const { t: tr } = useLanguage();
    // Photo-backdrop mode — branded thumbnail with dark legibility
    // gradient anchored to the bottom-left text block.
    if (coverUrl) {
        return (
            <button
                type="button"
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                className="group relative overflow-hidden rounded-2xl text-left transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    aspectRatio: '16 / 10',
                    border: `1px solid ${accentColor.replace(')', ' / 0.35)')}`,
                    boxShadow: '0 14px 32px rgba(0,0,0,0.30)',
                }}
            >
                {/* Photo backdrop — slight zoom on hover so the card
                    feels alive without being noisy. */}
                <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{
                        backgroundImage: `url(${coverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                {/* Bottom darken — heavier near the text so the title,
                    level pill, and subtitle read cleanly against any
                    cover. Top edge stays mostly clear so the branded
                    artwork remains visible. */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.78) 80%, rgba(0,0,0,0.92) 100%)',
                    }}
                />

                {/* Top-right level pill — anchors the ordering without
                    fighting the artwork. */}
                <span
                    className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-label font-extrabold uppercase tracking-[0.22em]"
                    style={{
                        background: 'rgba(0,0,0,0.55)',
                        color: accentColor,
                        border: `1px solid ${accentColor.replace(')', ' / 0.45)')}`,
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                    }}
                >
                    <span dir="ltr">{tr('universityLevelLabel')} {index}</span>
                </span>

                {/* Title + meta — bottom-left, full white over the
                    dark gradient. */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <h3
                        className="font-headline font-extrabold text-2xl md:text-[26px] leading-none tracking-tight"
                        style={{ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
                    >
                        {title}
                    </h3>
                    <p
                        className="text-xs font-body mt-2"
                        style={{ color: 'rgb(255 255 255 / 0.82)' }}
                    >
                        {subtitle}
                    </p>
                    {!disabled && (
                        <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-label font-extrabold uppercase tracking-widest mt-3"
                            style={{ color: accentColor }}
                        >
                            {tr('universityOpenLabel')} <ArrowRight size={12} />
                        </span>
                    )}
                </div>
            </button>
        );
    }

    // Tinted-icon fallback — used when no branded cover is available
    // (e.g. the off-path Topics tile).
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className="relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
                background: `linear-gradient(135deg, ${accentTint}, rgb(255 255 255 / 0.02) 90%)`,
                border: `1px solid ${accentColor.replace(')', ' / 0.30)')}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
            }}
        >
            {/* Decorative big number — anchors the "follow the order"
                message visually. Pushed to the corner so it doesn't
                fight the title. */}
            <span
                aria-hidden
                className="absolute -top-3 -right-2 font-display font-extrabold leading-none select-none pointer-events-none"
                style={{
                    fontSize: '8rem',
                    color: accentColor,
                    opacity: 0.10,
                    letterSpacing: '-0.05em',
                }}
            >
                {index}
            </span>

            <div className="relative flex flex-col gap-5 min-h-[120px]">
                <div className="flex items-start justify-between gap-3">
                    <span
                        className="font-label text-[10px] font-bold uppercase tracking-[0.3em]"
                        style={{ color: accentColor }}
                    >
                        Level {index}
                    </span>
                    <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                            background: accentTint,
                            color: accentColor,
                            border: `1px solid ${accentColor.replace(')', ' / 0.25)')}`,
                        }}
                    >
                        {icon}
                    </span>
                </div>
                <div>
                    <h3 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-on-surface-variant font-body mt-1">{subtitle}</p>
                </div>
                {!disabled && (
                    <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-label font-bold uppercase tracking-widest mt-auto"
                        style={{ color: accentColor }}
                    >
                        {tr('universityOpenLabel')} <ArrowRight size={12} />
                    </span>
                )}
            </div>
        </button>
    );
}
