import {
    createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
} from 'react';
import {
    collection, doc, addDoc, setDoc, updateDoc,
    onSnapshot, query, where, writeBatch, serverTimestamp,
    orderBy, deleteField,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { awardXp, XP_SOURCE } from '../lib/activityScore';
import { useAuth } from './AuthContext';
import {
    Course,
    Lesson,
    LessonContent,
    LessonResource,
    LibraryCategory,
    UserCourseProgress,
    UserLessonProgress,
} from '../types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
    return { id: snap.id, ...snap.data() } as T;
}

type LessonWriteData = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
    resources?: LessonResource[];
};

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export interface AcademyContextType {
    courses: Course[];
    libraryCategories: LibraryCategory[];
    lessons: Record<string, Lesson[]>;
    lessonContent: Record<string, LessonContent>;
    lessonProgress: Record<string, UserLessonProgress>;
    userProgress: Record<string, UserCourseProgress>;
    loading: boolean;

    // Course CRUD
    createCourse: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<string>;
    updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
    archiveCourse: (courseId: string) => Promise<void>;
    moveCourse: (courseId: string, direction: 'up' | 'down') => Promise<void>;

    // Lesson CRUD
    loadLessons: (courseId: string, force?: boolean) => Promise<void>;
    loadLessonContent: (courseId: string, lessonId: string, force?: boolean) => Promise<void>;
    createLesson: (courseId: string, data: LessonWriteData) => Promise<void>;
    updateLesson: (courseId: string, lessonId: string, updates: Partial<LessonWriteData>) => Promise<void>;
    archiveLesson: (courseId: string, lessonId: string) => Promise<void>;
    moveLesson: (courseId: string, lessonId: string, direction: 'up' | 'down') => Promise<void>;
    uploadLessonResource: (courseId: string, lessonId: string, file: File) => Promise<LessonResource>;
    getLessonResourceUrl: (resource: LessonResource) => Promise<string>;

    // Category CRUD
    createCategory: (name: string, icon?: string) => Promise<void>;
    updateCategory: (categoryId: string, updates: Partial<LibraryCategory>) => Promise<void>;
    archiveCategory: (categoryId: string) => Promise<void>;

    // Progress
    markLessonStarted: (courseId: string, lessonId: string) => Promise<void>;
    markLessonComplete: (courseId: string, lessonId: string) => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const isCoach = user?.role === 'coach' || user?.role === 'admin';

    const [courses, setCourses] = useState<Course[]>([]);
    const [libraryCategories, setLibraryCategories] = useState<LibraryCategory[]>([]);
    const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
    const [lessonContent, setLessonContent] = useState<Record<string, LessonContent>>({});
    const [lessonProgress, setLessonProgress] = useState<Record<string, UserLessonProgress>>({});
    const [userProgress, setUserProgress] = useState<Record<string, UserCourseProgress>>({});
    const [loading, setLoading] = useState(true);

    // Stable ref so loadLessons closure never goes stale
    const lessonsRef = useRef(lessons);
    const lessonUnsubsRef = useRef<Record<string, () => void>>({});
    const lessonContentUnsubsRef = useRef<Record<string, () => void>>({});
    const lessonProgressRef = useRef(lessonProgress);
    useEffect(() => { lessonsRef.current = lessons; }, [lessons]);
    useEffect(() => { lessonProgressRef.current = lessonProgress; }, [lessonProgress]);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        const unsubs: (() => void)[] = [];
        let ready = 0;
        const total = 3;
        const checkReady = () => { if (++ready >= total) setLoading(false); };

        // Courses — coaches see all, others see only published
        const coursesQ = isCoach
            ? collection(db, 'courses')
            : user.role === 'client'
                ? query(collection(db, 'courses'), where('isPublished', '==', true), where('accessTier', 'in', ['community', 'client']))
                : query(collection(db, 'courses'), where('isPublished', '==', true), where('accessTier', '==', 'community'));

        unsubs.push(onSnapshot(coursesQ, snap => {
            const all = snap.docs.map(d => docToObj<Course>(d));
            setCourses(all.filter(c => !c.archived).sort((a, b) => a.order - b.order));
            checkReady();
        }));

        // Library categories
        unsubs.push(onSnapshot(collection(db, 'libraryCategories'), snap => {
            const all = snap.docs.map(d => docToObj<LibraryCategory>(d));
            setLibraryCategories(all.filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name)));
            checkReady();
        }));

        // User's own lesson progress. Course progress is derived locally.
        unsubs.push(onSnapshot(
            query(collection(db, 'userLessonProgress'), where('userId', '==', user.id)),
            snap => {
                const lessonMap: Record<string, UserLessonProgress> = {};
                const courseMap: Record<string, UserCourseProgress> = {};
                snap.docs.forEach(d => {
                    const p = docToObj<UserLessonProgress>(d);
                    lessonMap[p.id] = p;
                    const existing = courseMap[p.courseId] ?? {
                        userId: p.userId,
                        courseId: p.courseId,
                        completedLessonIds: [],
                        updatedAt: p.updatedAt,
                    };
                    if (p.status === 'completed') {
                        existing.completedLessonIds = [...new Set([...existing.completedLessonIds, p.lessonId])];
                        existing.lastLessonId = p.lessonId;
                    }
                    existing.updatedAt = p.updatedAt;
                    courseMap[p.courseId] = existing;
                });
                setLessonProgress(lessonMap);
                setUserProgress(courseMap);
                checkReady();
            }
        ));

        return () => {
            unsubs.forEach(u => u());
            Object.values(lessonUnsubsRef.current).forEach(u => u());
            Object.values(lessonContentUnsubsRef.current).forEach(u => u());
            lessonUnsubsRef.current = {};
            lessonContentUnsubsRef.current = {};
        };
    }, [user?.id, user?.role, isCoach]);

    // ── Lessons ──────────────────────────────────────────────────────────────

    const splitLessonData = (data: Partial<LessonWriteData>) => {
        const {
            videoUrl,
            platform,
            resources,
            ...metadata
        } = data;

        return {
            metadata: stripUndefined(metadata),
            content: {
                videoUrl,
                platform,
                resources,
            },
        };
    };

    const getActiveLessons = (courseId: string) =>
        [...(lessonsRef.current[courseId] ?? [])].filter(l => !l.archived).sort((a, b) => a.order - b.order);

    const syncCourseStats = async (courseId: string, nextLessons: Lesson[]) => {
        const active = nextLessons.filter(l => !l.archived);
        await updateDoc(doc(db, 'courses', courseId), {
            lessonCount: active.length,
            requiredLessonCount: active.filter(l => l.isRequired).length,
            totalDurationMinutes: active.reduce((total, l) => total + (l.durationMinutes ?? 0), 0),
            updatedAt: serverTimestamp(),
        });
    };

    const syncLessonPrerequisites = async (courseId: string, nextLessons: Lesson[]) => {
        const active = nextLessons.filter(l => !l.archived).sort((a, b) => a.order - b.order);
        const batch = writeBatch(db);
        let previousRequiredId: string | null = null;
        let changed = false;

        active.forEach(lesson => {
            const nextPrerequisite = lesson.isRequired ? previousRequiredId : null;
            if ((lesson.prerequisiteLessonId ?? null) !== nextPrerequisite) {
                batch.update(doc(db, 'courses', courseId, 'lessons', lesson.id), {
                    prerequisiteLessonId: nextPrerequisite ?? deleteField(),
                    videoUrl: deleteField(),
                    platform: deleteField(),
                    resources: deleteField(),
                    updatedAt: serverTimestamp(),
                });
                changed = true;
            }
            if (lesson.isRequired) previousRequiredId = lesson.id;
        });

        if (changed) await batch.commit();
    };

    const syncLessonDerivedData = async (courseId: string, nextLessons: Lesson[]) => {
        await syncCourseStats(courseId, nextLessons);
        await syncLessonPrerequisites(courseId, nextLessons);
    };

    const loadLessons = useCallback(async (courseId: string, force = false) => {
        if (lessonUnsubsRef.current[courseId] && !force) return;

        if (lessonUnsubsRef.current[courseId]) {
            lessonUnsubsRef.current[courseId]();
            delete lessonUnsubsRef.current[courseId];
        }

        await new Promise<void>((resolve, reject) => {
            let firstSnapshot = true;
            const unsub = onSnapshot(
                query(collection(db, 'courses', courseId, 'lessons'), orderBy('order')),
                snap => {
                    const loaded = snap.docs.map(d => docToObj<Lesson>(d)).filter(l => !l.archived);
                    setLessons(prev => ({ ...prev, [courseId]: loaded }));
                    if (firstSnapshot) {
                        firstSnapshot = false;
                        resolve();
                    }
                },
                error => {
                    if (firstSnapshot) reject(error);
                    else console.error('Lesson listener failed:', error);
                }
            );
            lessonUnsubsRef.current[courseId] = unsub;
        });
    }, []);

    const loadLessonContent = useCallback(async (courseId: string, lessonId: string, force = false) => {
        const key = `${courseId}_${lessonId}`;
        if (lessonContentUnsubsRef.current[key] && !force) return;

        if (lessonContentUnsubsRef.current[key]) {
            lessonContentUnsubsRef.current[key]();
            delete lessonContentUnsubsRef.current[key];
        }

        await new Promise<void>((resolve, reject) => {
            let firstSnapshot = true;
            const unsub = onSnapshot(
                doc(db, 'courses', courseId, 'lessonContent', lessonId),
                snap => {
                    if (snap.exists()) {
                        setLessonContent(prev => ({
                            ...prev,
                            [key]: { id: snap.id, ...snap.data() } as LessonContent,
                        }));
                    } else {
                        setLessonContent(prev => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                        });
                    }
                    if (firstSnapshot) {
                        firstSnapshot = false;
                        resolve();
                    }
                },
                error => {
                    if (firstSnapshot) reject(error);
                    else console.error('Lesson content listener failed:', error);
                }
            );
            lessonContentUnsubsRef.current[key] = unsub;
        });
    }, []);

    const createLesson = async (courseId: string, data: LessonWriteData) => {
        const { metadata, content } = splitLessonData(data);
        const hasContent = Boolean(content.videoUrl || (content.resources && content.resources.length > 0));
        const ref = await addDoc(collection(db, 'courses', courseId, 'lessons'), {
            ...metadata,
            hasContent,
            createdBy: user?.id ?? '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        if (hasContent) {
            await setDoc(doc(db, 'courses', courseId, 'lessonContent', ref.id), {
                id: ref.id,
                lessonId: ref.id,
                courseId,
                videoUrl: content.videoUrl ?? '',
                platform: content.platform ?? 'youtube',
                resources: content.resources ?? [],
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
        const nextLessons = [...getActiveLessons(courseId), { id: ref.id, ...metadata, hasContent } as Lesson];
        await syncLessonDerivedData(courseId, nextLessons);
        await loadLessons(courseId, true);
    };

    const updateLesson = async (courseId: string, lessonId: string, updates: Partial<LessonWriteData>) => {
        const { metadata, content } = splitLessonData(updates);
        const contentWasProvided = 'videoUrl' in updates || 'platform' in updates || 'resources' in updates;
        const hasContent = contentWasProvided
            ? Boolean(content.videoUrl || (content.resources && content.resources.length > 0))
            : undefined;

        await updateDoc(doc(db, 'courses', courseId, 'lessons', lessonId), {
            ...metadata,
            ...(hasContent === undefined ? {} : { hasContent }),
            videoUrl: deleteField(),
            platform: deleteField(),
            resources: deleteField(),
            updatedAt: serverTimestamp(),
        });
        if (contentWasProvided) {
            await setDoc(doc(db, 'courses', courseId, 'lessonContent', lessonId), {
                id: lessonId,
                lessonId,
                courseId,
                videoUrl: content.videoUrl ?? '',
                platform: content.platform ?? 'youtube',
                resources: content.resources ?? [],
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
        const nextLessons = getActiveLessons(courseId).map(l =>
            l.id === lessonId
                ? ({ ...l, ...metadata, ...(hasContent === undefined ? {} : { hasContent }) } as Lesson)
                : l
        );
        await syncLessonDerivedData(courseId, nextLessons);
        await loadLessons(courseId, true);
    };

    const archiveLesson = async (courseId: string, lessonId: string) => {
        await updateDoc(doc(db, 'courses', courseId, 'lessons', lessonId), {
            archived: true,
            updatedAt: serverTimestamp(),
        });
        const nextLessons = getActiveLessons(courseId).filter(l => l.id !== lessonId);
        await syncLessonDerivedData(courseId, nextLessons);
        await loadLessons(courseId, true);
    };

    const moveLesson = async (courseId: string, lessonId: string, direction: 'up' | 'down') => {
        const sorted = [...(lessonsRef.current[courseId] ?? [])].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(l => l.id === lessonId);
        if (direction === 'up' && idx <= 0) return;
        if (direction === 'down' && idx >= sorted.length - 1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        const batch = writeBatch(db);
        batch.update(doc(db, 'courses', courseId, 'lessons', sorted[idx].id), { order: sorted[swapIdx].order, updatedAt: serverTimestamp() });
        batch.update(doc(db, 'courses', courseId, 'lessons', sorted[swapIdx].id), { order: sorted[idx].order, updatedAt: serverTimestamp() });
        await batch.commit();
        const nextLessons = sorted.map(l => {
            if (l.id === sorted[idx].id) return { ...l, order: sorted[swapIdx].order };
            if (l.id === sorted[swapIdx].id) return { ...l, order: sorted[idx].order };
            return l;
        });
        await syncLessonDerivedData(courseId, nextLessons);
        await loadLessons(courseId, true);
    };

    // ── Courses ───────────────────────────────────────────────────────────────

    const createCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
        const ref = await addDoc(collection(db, 'courses'), {
            ...data,
            lessonCount: data.lessonCount ?? 0,
            requiredLessonCount: data.requiredLessonCount ?? 0,
            totalDurationMinutes: data.totalDurationMinutes ?? 0,
            createdBy: user?.id ?? '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    };

    const updateCourse = async (courseId: string, updates: Partial<Course>) => {
        await updateDoc(doc(db, 'courses', courseId), { ...updates, updatedAt: serverTimestamp() });
    };

    const archiveCourse = async (courseId: string) => {
        await updateDoc(doc(db, 'courses', courseId), { archived: true, updatedAt: serverTimestamp() });
    };

    const moveCourse = async (courseId: string, direction: 'up' | 'down') => {
        const sorted = [...courses].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex(c => c.id === courseId);
        if (direction === 'up' && idx <= 0) return;
        if (direction === 'down' && idx >= sorted.length - 1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        const batch = writeBatch(db);
        batch.update(doc(db, 'courses', sorted[idx].id), { order: sorted[swapIdx].order, updatedAt: serverTimestamp() });
        batch.update(doc(db, 'courses', sorted[swapIdx].id), { order: sorted[idx].order, updatedAt: serverTimestamp() });
        await batch.commit();
    };

    // ── Categories ────────────────────────────────────────────────────────────

    const createCategory = async (name: string, icon?: string) => {
        await addDoc(collection(db, 'libraryCategories'), {
            name,
            icon: icon ?? '',
            createdBy: user?.id ?? '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            archived: false,
        });
    };

    const updateCategory = async (categoryId: string, updates: Partial<LibraryCategory>) => {
        await updateDoc(doc(db, 'libraryCategories', categoryId), { ...updates, updatedAt: serverTimestamp() });
    };

    const archiveCategory = async (categoryId: string) => {
        await updateDoc(doc(db, 'libraryCategories', categoryId), { archived: true, updatedAt: serverTimestamp() });
    };

    const uploadLessonResource = async (courseId: string, lessonId: string, file: File): Promise<LessonResource> => {
        if (!file.name.toLowerCase().endsWith('.pdf')) throw new Error('Only PDF resources are supported.');
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `course-resources/${courseId}/${lessonId}/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
        return { name: file.name, path };
    };

    const getLessonResourceUrl = async (resource: LessonResource): Promise<string> => {
        if (resource.url) return resource.url;
        if (!resource.path) throw new Error('Missing resource path.');
        return getDownloadURL(ref(storage, resource.path));
    };

    // ── Progress ──────────────────────────────────────────────────────────────

    const canAccessCourse = (course: Course) => {
        if (isCoach) return true;
        if (!course.isPublished) return false;
        if (course.accessTier === 'community') return true;
        if (course.accessTier === 'client') return user?.role === 'client';
        return false;
    };

    const canAccessLesson = (course: Course, lesson: Lesson) => {
        if (isCoach) return true;
        if (lesson.isPreview && course.isPublished) return true;
        if (!canAccessCourse(course)) return false;
        if (!lesson.isRequired) return true;
        if ((lesson.order ?? 1) <= 1) return true;
        if (!lesson.prerequisiteLessonId) return false;
        const prerequisiteId = `${user?.id}_${course.id}_${lesson.prerequisiteLessonId}`;
        return lessonProgressRef.current[prerequisiteId]?.status === 'completed';
    };

    const progressDocId = (courseId: string, lessonId: string) => `${user?.id}_${courseId}_${lessonId}`;

    const markLessonStarted = async (courseId: string, lessonId: string) => {
        if (!user) return;

        const course = courses.find(c => c.id === courseId);
        const courseLessons = lessonsRef.current[courseId] ?? [];
        const lesson = courseLessons.find(l => l.id === lessonId && !l.archived);
        if (!course || !lesson || !canAccessLesson(course, lesson)) return;

        const id = progressDocId(courseId, lessonId);
        const existing = lessonProgressRef.current[id];
        if (existing?.status === 'completed') return;

        await setDoc(doc(db, 'userLessonProgress', id), {
            id,
            userId: user.id,
            courseId,
            lessonId,
            status: existing?.status ?? 'started',
            startedAt: existing?.startedAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const markLessonComplete = async (courseId: string, lessonId: string) => {
        if (!user) return;

        const course = courses.find(c => c.id === courseId);
        const courseLessons = lessonsRef.current[courseId] ?? [];
        const lesson = courseLessons.find(l => l.id === lessonId && !l.archived);
        if (!course || !lesson || !canAccessLesson(course, lesson)) return;

        const id = progressDocId(courseId, lessonId);
        const existing = lessonProgressRef.current[id];
        const wasAlreadyComplete = existing?.status === 'completed';
        await setDoc(doc(db, 'userLessonProgress', id), {
            id,
            userId: user.id,
            courseId,
            lessonId,
            status: 'completed',
            startedAt: existing?.startedAt ?? serverTimestamp(),
            completedAt: existing?.completedAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
        // Idempotent — one LESSON_COMPLETE award per lesson per user.
        if (!wasAlreadyComplete) {
            await awardXp(user.id, XP_SOURCE.LESSON_COMPLETE, `${courseId}/${lessonId}`);
        }
    };

    return (
        <AcademyContext.Provider value={{
            courses, libraryCategories, lessons, lessonContent, lessonProgress, userProgress, loading,
            createCourse, updateCourse, archiveCourse, moveCourse,
            loadLessons, loadLessonContent, createLesson, updateLesson, archiveLesson, moveLesson,
            uploadLessonResource, getLessonResourceUrl,
            createCategory, updateCategory, archiveCategory,
            markLessonStarted, markLessonComplete,
        }}>
            {children}
        </AcademyContext.Provider>
    );
};

export const useAcademy = () => {
    const ctx = useContext(AcademyContext);
    if (!ctx) throw new Error('useAcademy must be used within AcademyProvider');
    return ctx;
};
