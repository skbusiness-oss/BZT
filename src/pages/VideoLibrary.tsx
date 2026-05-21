import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lock, Search, Plus, X,
    Link2, CheckCircle2, AlertCircle, Edit2, Trash2, FileText,
    Download, Loader2, ArrowRight,
    Tv2, Tag, Settings2, GraduationCap,
    PlayCircle,
} from 'lucide-react';
import clsx from 'clsx';
import VideoPlayer from '../components/VideoPlayer';
import { CourseCard } from '../components/academy/CourseCard';
import { CourseDetail } from '../components/academy/CourseDetail';
import { ManageCourseModal } from '../components/academy/ManageCourseModal';
import { ManageLessonModal } from '../components/academy/ManageLessonModal';
import { useAcademy } from '../context/AcademyContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { buildEmbedUrl } from '../lib/videoUtils';
import type { Course, Lesson, LessonResource, LibraryCategory } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
type MainTab = 'academy' | 'lives' | 'topics' | 'videos' | 'manage';
type LessonFormData = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
    resources?: LessonResource[];
};

// ─────────────────────────────────────────────────────────────────────────────

export const VideoLibrary = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const {
        videos, categories, addVideo, updateVideo, removeVideo,
        addCategory, uploadVideoPdf,
    } = useData();
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
    const [videoCategoryFilter, setVideoCategoryFilter] = useState('All');
    const [search, setSearch] = useState('');

    // ── Modal state ───────────────────────────────────────────────────────────
    const [courseModal, setCourseModal] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null });
    const [lessonModal, setLessonModal] = useState<{ open: boolean; lesson: Lesson | null; courseId: string }>({ open: false, lesson: null, courseId: '' });
    const [newCatName, setNewCatName] = useState('');
    const [editingCat, setEditingCat] = useState<LibraryCategory | null>(null);
    const [editingCatName, setEditingCatName] = useState('');

    // ── Legacy video modal state ──────────────────────────────────────────────
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newLegacyCategory, setNewLegacyCategory] = useState('');
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [rawInput, setRawInput] = useState('');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [pdfFiles, setPdfFiles] = useState<{ name: string; url: string }[]>([]);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [activeVideo, setActiveVideo] = useState<typeof videos[number] | null>(null);

    const [newVideo, setNewVideo] = useState({
        title: '', category: '', videoUrl: '', platform: 'youtube' as 'youtube' | 'vimeo',
        thumbnailUrl: '', description: '', isLocked: false, level: '' as '' | 'beginner' | 'intermediate' | 'advanced',
    });

    // ── Derived data ──────────────────────────────────────────────────────────
    const academyCourses = useMemo(() =>
        courses.filter(c => c.courseType === 'academy').sort((a, b) => a.order - b.order),
        [courses]);

    const liveCourses = useMemo(() =>
        courses.filter(c => c.courseType === 'recorded_live').sort((a, b) => a.order - b.order),
        [courses]);

    const allCourses = useMemo(() =>
        courses.filter(c => c.courseType !== 'recorded_live').sort((a, b) => a.order - b.order),
        [courses]);

    const topicCourses = useMemo(() => {
        let list = courses;
        if (topicFilter) list = list.filter(c => c.categoryIds.includes(topicFilter));
        if (search) list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
        return list.sort((a, b) => a.order - b.order);
    }, [courses, topicFilter, search]);

    const visibleVideos = useMemo(() =>
        videos.filter(video => isCoach || !video.isLocked || user?.role === 'client'),
        [isCoach, user?.role, videos]
    );

    const filteredVideos = useMemo(() =>
        visibleVideos.filter(video => {
            const matchCategory = videoCategoryFilter === 'All' || video.category === videoCategoryFilter;
            const query = search.trim().toLowerCase();
            const matchSearch = !query ||
                video.title.toLowerCase().includes(query) ||
                (video.description ?? '').toLowerCase().includes(query) ||
                video.category.toLowerCase().includes(query);
            return matchCategory && matchSearch;
        }),
        [search, videoCategoryFilter, visibleVideos]
    );
    const videoCategories = useMemo(() =>
        Array.from(new Set([...categories, ...visibleVideos.map(video => video.category).filter(Boolean)])).sort(),
        [categories, visibleVideos]
    );

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

    // ── Legacy video handlers (unchanged) ─────────────────────────────────────
    const parsedLegacy = buildEmbedUrl(rawInput);

    const handleUrlInput = (value: string) => {
        setRawInput(value);
        const result = buildEmbedUrl(value);
        setNewVideo(v => result
            ? { ...v, videoUrl: result.embedUrl, platform: result.platform }
            : { ...v, videoUrl: '', platform: 'youtube' });
    };

    const handleAddVideo = async () => {
        if (!newVideo.title || !newVideo.category || !newVideo.videoUrl) return;
        setSaveError(null);
        try {
            const { level, ...rest } = newVideo;
            const videoData = { ...rest, pdfFiles, ...(level ? { level } : {}) };
            if (editingVideoId) await updateVideo(editingVideoId, videoData);
            else await addVideo(videoData);
            setNewVideo({ title: '', category: '', videoUrl: '', platform: 'youtube', thumbnailUrl: '', description: '', isLocked: false, level: '' });
            setRawInput(''); setPdfFiles([]); setEditingVideoId(null); setSaveError(null); setShowAddModal(false);
        } catch (err: any) {
            const code = err?.code ?? '';
            setSaveError(code === 'permission-denied' || code === 'PERMISSION_DENIED'
                ? 'Permission denied — check your Firestore rules.'
                : err?.message ?? 'Failed to save.');
        }
    };

    const handlePdfUpload = async (file: File) => {
        setSaveError(null);
        if (!file.name.toLowerCase().endsWith('.pdf')) { setSaveError('Please select a PDF.'); return; }
        if (file.size > 50 * 1024 * 1024) { setSaveError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max is 50 MB.`); return; }
        if (!editingVideoId) {
            setSaveError('Save the video first, then edit it to attach PDFs.');
            return;
        }
        setUploadingPdf(true);
        try {
            const result = await uploadVideoPdf(file, editingVideoId);
            setPdfFiles(prev => [...prev, result]);
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('PDF upload failed:', err);
            const msg = err?.code === 'storage/unauthorized'
                ? 'Permission denied. Only coaches can upload PDFs.'
                : err?.code === 'storage/canceled'
                    ? 'Upload was canceled.'
                    : err?.code === 'storage/retry-limit-exceeded'
                        ? 'Network too slow — retry on a stronger connection.'
                        : err?.message ?? 'PDF upload failed.';
            setSaveError(msg);
        }
        finally { setUploadingPdf(false); }
    };

    const handleEditClick = (video: typeof videos[number], e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingVideoId(video.id);
        setNewVideo({ title: video.title, category: video.category, videoUrl: video.videoUrl || '', platform: video.platform || 'youtube', thumbnailUrl: video.thumbnailUrl || '', description: video.description || '', isLocked: video.isLocked || false, level: (video.level || '') as '' | 'beginner' | 'intermediate' | 'advanced' });
        setPdfFiles(video.pdfFiles || []);
        setRawInput(video.videoUrl || '');
        setShowAddModal(true);
    };

    const handleDeleteClick = async (video: typeof videos[number], e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Delete "${video.title}"?`)) await removeVideo(video.id);
    };

    const getPlayUrl = (video: typeof videos[number]) => {
        if (!video.videoUrl) return '';
        const result = buildEmbedUrl(video.videoUrl);
        return result ? result.embedUrl : video.videoUrl;
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const maxCourseOrder = courses.length > 0 ? Math.max(...courses.map(c => c.order)) : 0;
    const nextLessonOrder = activeCourseId
        ? (lessons[activeCourseId]?.length ? Math.max(...lessons[activeCourseId].map(l => l.order)) + 1 : 1)
        : 1;

    const TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
        { id: 'academy', label: 'Academy Path', icon: <GraduationCap size={15} /> },
        { id: 'lives', label: 'Live Sessions', icon: <Tv2 size={15} /> },
        { id: 'topics', label: 'Topics', icon: <Tag size={15} /> },
        { id: 'videos', label: 'Video Archive', icon: <PlayCircle size={15} /> },
        ...(isCoach ? [{ id: 'manage' as MainTab, label: 'Manage', icon: <Settings2 size={15} /> }] : []),
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
                            onClick={() => { setActiveTab(tab.id); setActiveCourseId(null); }}
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
                {(activeTab === 'topics' || activeTab === 'videos') && (
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative group bg-surface-container rounded-full pl-9 pr-1 py-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" size={14} />
                            <input
                                type="text"
                                placeholder={activeTab === 'videos' ? 'Search videos...' : 'Search courses...'}
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
                    {/* Continue Learning banner — hero photo treatment matching
                        the dashboard's start-learning surface so the visual
                        identity carries across the app. */}
                    {continueLearning && (
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
                                    backgroundImage: 'url(/dashboard-covers/continue-learning.png)',
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
                                        Continue Learning
                                    </span>
                                    <h2
                                        className="text-2xl md:text-[28px] font-headline font-extrabold mb-2 leading-tight"
                                        style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                                    >
                                        {continueLearning.course.title}
                                    </h2>
                                    {continueLearning.nextLesson && (
                                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.82)' }}>
                                            Next: <span style={{ color: '#fff', fontWeight: 500 }}>{continueLearning.nextLesson.title}</span>
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setActiveCourseId(continueLearning.course.id)}
                                    className="gold-gradient text-on-primary-fixed px-8 py-3.5 rounded-full font-label text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shrink-0 shadow-lg shadow-primary/30 active:scale-95 transition-all self-start md:self-end"
                                >
                                    Continue <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Required path */}
                    {['beginner', 'intermediate', 'advanced'].map(lvl => {
                        const group = academyCourses.filter(c => c.level === lvl && c.isRequired);
                        if (group.length === 0) return null;
                        return (
                            <div key={lvl}>
                                <div className="flex items-baseline gap-3 mb-6">
                                    <h2 className="text-xl font-headline font-extrabold capitalize text-on-surface">{lvl}</h2>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{group.length} courses</span>
                                </div>
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
                            </div>
                        );
                    })}

                    {/* Optional bonus content in academy */}
                    {(() => {
                        const bonus = allCourses.filter(c => !c.isRequired);
                        if (bonus.length === 0) return null;
                        return (
                            <details>
                                <summary className="cursor-pointer list-none text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-6">
                                    {t('bonusContent')} ({bonus.length})
                                </summary>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                    {bonus.map(course => (
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
                            </details>
                        );
                    })()}

                    {academyCourses.length === 0 && !academyLoading && (
                        <div className="glass-card rounded-2xl p-16 text-center text-on-surface/40">
                            <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-body">
                                {t('noAcademyCoursesYet')}{isCoach && ` ${t('noAcademyCoursesCoachHint')}`}
                            </p>
                        </div>
                    )}
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
            {!activeCourse && activeTab === 'videos' && (
                <div className="space-y-8">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['All', ...videoCategories].map(category => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setVideoCategoryFilter(category)}
                                className={clsx(
                                    'px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300',
                                    videoCategoryFilter === category
                                        ? 'gold-gradient text-on-primary-fixed shadow-md'
                                        : 'bg-surface-container-highest text-on-surface-variant hover:text-primary',
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {filteredVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVideos.map(video => (
                                <button
                                    key={video.id}
                                    type="button"
                                    onClick={() => setActiveVideo(video)}
                                    className="group text-left rounded-2xl bg-surface-container-low overflow-hidden ghost-border hover:bg-surface-container transition-colors"
                                >
                                    <div className="relative aspect-video bg-surface-container-lowest">
                                        <img
                                            src={video.thumbnailUrl || 'https://placehold.co/640x360/1a1f2f/e6c364?text=VIDEO'}
                                            alt={video.title}
                                            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                        <div className="absolute left-4 bottom-4 w-11 h-11 rounded-full gold-gradient flex items-center justify-center text-on-primary-fixed shadow-lg">
                                            <PlayCircle size={22} />
                                        </div>
                                        {video.isLocked && (
                                            <div className="absolute right-4 top-4 px-3 py-1.5 rounded-full bg-surface/80 text-primary text-[10px] font-label font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                <Lock size={12} /> Coaching
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest">
                                                {video.category}
                                            </span>
                                            {video.level && (
                                                <span className="px-2.5 py-1 rounded-lg bg-surface-container-highest text-on-surface/55 text-[10px] font-label font-bold uppercase tracking-widest">
                                                    {video.level}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-headline font-extrabold text-xl text-on-surface tracking-tight group-hover:text-primary transition-colors">
                                            {video.title}
                                        </h3>
                                        {video.description && (
                                            <p className="text-sm font-body text-on-surface/55 mt-2 line-clamp-2">
                                                {video.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-16 text-center text-on-surface/40">
                            <PlayCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-body">
                                {search ? `No videos match "${search}"` : 'No uploaded videos yet.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

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

                    {/* Legacy video archive management */}
                    <details className="group">
                        <summary className="cursor-pointer list-none text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                            Legacy Video Archive (CRUD)
                        </summary>
                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => { setNewVideo({ title: '', category: '', videoUrl: '', platform: 'youtube', thumbnailUrl: '', description: '', isLocked: false, level: '' }); setRawInput(''); setEditingVideoId(null); setSaveError(null); setShowAddModal(true); }}
                                className="gold-gradient w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-lg shadow-primary/20"
                            ><Plus size={18} className="text-on-primary-fixed" /></button>
                            {categories.map(cat => (
                                <span key={cat} className="px-3 py-1.5 rounded-full bg-surface-container text-xs text-on-surface-variant border border-outline-variant/30">{cat}</span>
                            ))}
                            <button onClick={() => setShowCategoryModal(true)} className="text-xs text-on-surface-variant hover:text-primary transition-colors underline underline-offset-2">+ Tag</button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {videos.map(video => (
                                <div key={video.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                                    <img src={video.thumbnailUrl || `https://placehold.co/80x45/1a1f2f/e6c364?text=VID`} alt={video.title} className="w-20 h-11 rounded-lg object-cover shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-body font-medium text-on-surface truncate">{video.title}</p>
                                        <p className="text-[10px] text-on-surface-variant">{video.category}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={e => handleEditClick(video, e)} className="min-w-9 min-h-9 p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-highest/50 transition-colors flex items-center justify-center" aria-label="Edit video"><Edit2 size={14} /></button>
                                        <button onClick={e => handleDeleteClick(video, e)} className="min-w-9 min-h-9 p-2 rounded-lg text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center" aria-label="Delete video"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </details>
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

            {/* ── Legacy Add Video Modal ────────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-surface/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                    <div className="bg-surface-container-high p-8 rounded-2xl max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ghost-border shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-headline font-bold text-on-surface">{editingVideoId ? 'Edit Video' : 'Add Video'}</h2>
                            <button onClick={() => { setShowAddModal(false); setRawInput(''); setEditingVideoId(null); setSaveError(null); }} className="text-on-surface/50 hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2"><Link2 size={13} /> YouTube or Vimeo link *</label>
                                <textarea value={rawInput} onChange={e => handleUrlInput(e.target.value)} placeholder="Paste URL or <iframe> embed code" rows={3} className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-4 resize-none text-sm font-mono text-on-surface transition-colors" autoFocus />
                                {rawInput.trim() && (
                                    <div className={clsx('mt-2 flex items-center gap-2 text-xs font-body px-3 py-2.5 rounded-lg border', parsedLegacy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                                        {parsedLegacy ? <><CheckCircle2 size={14} /> {parsedLegacy.platform} detected</> : <><AlertCircle size={14} /> Unrecognised link</>}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Title *</label>
                                    <input value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm text-on-surface transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Category *</label>
                                    <select value={newVideo.category} onChange={e => setNewVideo({ ...newVideo, category: e.target.value })} className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm text-on-surface transition-colors appearance-none">
                                        <option value="">Select</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Description</label>
                                <textarea value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} rows={2} className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm text-on-surface resize-none transition-colors" />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                                <input type="checkbox" id="isLocked" checked={newVideo.isLocked} onChange={e => setNewVideo({ ...newVideo, isLocked: e.target.checked })} className="w-4 h-4 rounded" />
                                <label htmlFor="isLocked" className="text-sm font-body text-on-surface/80 flex items-center cursor-pointer"><Lock size={13} className="inline mr-2 text-on-surface/50" />Lock for coaching clients only</label>
                            </div>
                            {/* PDF upload */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-3"><FileText size={13} /> PDFs</label>
                                {pdfFiles.map((pdf, i) => (
                                    <div key={i} className="flex items-center gap-3 mb-2 bg-surface-container-lowest border border-outline-variant/30 px-4 py-3 rounded-xl">
                                        <FileText size={16} className="text-primary shrink-0" />
                                        <span className="text-sm font-body text-on-surface truncate flex-1">{pdf.name}</span>
                                        <button onClick={() => setPdfFiles(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 transition-colors"><X size={15} /></button>
                                    </div>
                                ))}
                                <label className={clsx('flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-dashed text-sm font-bold tracking-wide transition-all', uploadingPdf ? 'opacity-60 cursor-wait border-outline-variant/30 text-on-surface/50' : 'cursor-pointer border-outline-variant/50 hover:border-primary/50 hover:text-primary text-on-surface/60 hover:bg-primary/5')}>
                                    {uploadingPdf ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Plus size={16} /> Add PDF</>}
                                    <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={uploadingPdf} onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ''; }} />
                                </label>
                            </div>
                        </div>
                        {saveError && (
                            <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />{saveError}
                            </div>
                        )}
                        <div className="flex gap-3 mt-7">
                            <button onClick={() => { setShowAddModal(false); setRawInput(''); setEditingVideoId(null); setSaveError(null); setPdfFiles([]); }} className="flex-1 px-5 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all">Cancel</button>
                            <button onClick={handleAddVideo} disabled={!newVideo.title || !newVideo.category || !newVideo.videoUrl} className="flex-1 px-5 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest gold-gradient text-on-primary-fixed disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                {editingVideoId ? 'Update Video' : 'Save Video'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Legacy Category Modal ─────────────────────────────────────── */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-surface/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                    <div className="bg-surface-container-high p-8 max-w-sm w-full mx-4 rounded-2xl animate-in zoom-in-95 duration-200 ghost-border shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-headline font-bold text-on-surface">Add Category</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-on-surface/50 hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors"><X size={20} /></button>
                        </div>
                        <input type="text" value={newLegacyCategory} onChange={e => setNewLegacyCategory(e.target.value)} placeholder="e.g. Recovery" className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm text-on-surface transition-colors" />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 px-5 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container border border-outline-variant/30 transition-all">Cancel</button>
                            <button onClick={() => { if (newLegacyCategory.trim()) { addCategory(newLegacyCategory.trim()); setNewLegacyCategory(''); setShowCategoryModal(false); } }} disabled={!newLegacyCategory.trim()} className="flex-1 px-5 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest gold-gradient text-on-primary-fixed disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all">Add</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Legacy Video Player ───────────────────────────────────────── */}
            {activeVideo && (
                <div className="fixed inset-0 bg-surface/95 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
                    <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 flex items-center gap-2 text-on-surface/50 hover:text-on-surface transition-colors bg-surface-container-low p-2 pr-4 rounded-full border border-outline-variant/30">
                        <X size={20} className="bg-surface-container-highest p-1 rounded-full" />
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest">Close</span>
                    </button>
                    <div className="w-full max-w-5xl animate-in zoom-in-95 duration-300">
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30">
                            <VideoPlayer url={getPlayUrl(activeVideo)} />
                        </div>
                        <div className="mt-6 text-center">
                            <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-2">{activeVideo.title}</h2>
                            {activeVideo.pdfFiles && activeVideo.pdfFiles.length > 0 && (
                                <div className="mt-6 text-left bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 max-w-2xl mx-auto">
                                    <h3 className="text-[10px] font-label font-bold text-primary mb-3 uppercase tracking-widest flex items-center gap-2"><FileText size={14} />Resources</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {activeVideo.pdfFiles.map((pdf, i) => (
                                            <a key={i} href={pdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 hover:border-primary/40 transition-colors group">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary text-primary transition-colors"><FileText size={16} /></div>
                                                <span className="flex-1 text-sm font-body font-medium text-on-surface truncate">{pdf.name}</span>
                                                <Download size={16} className="text-on-surface/30 group-hover:text-primary transition-colors" />
                                            </a>
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
