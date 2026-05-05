import {
  createContext, useContext, useState, useEffect, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where,
  addDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';
import { LibraryTag, Video, Workout } from '../types';
import { ALL_TRAINING_PROGRAMS } from '../data';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

const INITIAL_VIDEO_CATEGORIES = ['Nutrition', 'Training', 'Coaching', 'Mindset'];
const INITIAL_WORKOUT_CATEGORIES = [
  'Full Body', 'Upper / Lower', 'Push / Pull / Legs',
  'Bro Split', 'Powerlifting', 'HIIT / Circuit', 'Cardio-Focused',
];

export interface MediaContextType {
  videos: Video[];
  categories: string[];
  libraryTags: LibraryTag[];
  workouts: Workout[];
  workoutCategories: string[];
  loading: boolean;
  addVideo: (video: Omit<Video, 'id'>) => Promise<void>;
  updateVideo: (videoId: string, updates: Partial<Video>) => Promise<void>;
  removeVideo: (videoId: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => Promise<void>;
  removeWorkout: (workoutId: string) => Promise<void>;
  addWorkoutCategory: (category: string) => Promise<void>;
  uploadVideoPdf: (file: File, videoId: string) => Promise<{ name: string; url: string }>;
  removeVideoPdf: (videoId: string, pdfUrl: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [videos, setVideos] = useState<Video[]>([]);
  const [libraryTags, setLibraryTags] = useState<LibraryTag[]>([]);
  const [settingsCategories, setSettingsCategories] = useState<string[]>(INITIAL_VIDEO_CATEGORIES);
  const [workoutCategories, setWorkoutCategories] = useState<string[]>(INITIAL_WORKOUT_CATEGORIES);
  const [customWorkouts, setCustomWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const workouts: Workout[] = [...ALL_TRAINING_PROGRAMS, ...customWorkouts];
  const categories = libraryTags.length > 0
    ? [...libraryTags.map(t => t.name)].sort()
    : settingsCategories;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsubs: (() => void)[] = [];
    let listenersReady = 0;
    const totalListeners = 5;
    const checkReady = () => { if (++listenersReady >= totalListeners) setLoading(false); };

    const videosQuery = isCoach || user.role === 'client'
      ? query(collection(db, 'videos'))
      : query(collection(db, 'videos'), where('isLocked', '==', false));

    unsubs.push(onSnapshot(videosQuery, (snap) => {
      const parsed = snap.docs.map((d) => docToObj<Video>(d));
      setVideos(parsed.sort((a, b) => a.title.localeCompare(b.title)));
      checkReady();
    }));

    unsubs.push(onSnapshot(collection(db, 'libraryTags'), (snap) => {
      setLibraryTags(snap.docs.map((d) => docToObj<LibraryTag>(d)));
      checkReady();
    }));

    unsubs.push(onSnapshot(doc(db, 'settings', 'videoCategories'), (snap) => {
      if (snap.exists()) setSettingsCategories(snap.data().categories ?? INITIAL_VIDEO_CATEGORIES);
      checkReady();
    }));

    unsubs.push(onSnapshot(doc(db, 'settings', 'workoutCategories'), (snap) => {
      if (snap.exists()) setWorkoutCategories(snap.data().categories ?? INITIAL_WORKOUT_CATEGORIES);
      checkReady();
    }));

    unsubs.push(onSnapshot(collection(db, 'workouts'), (snap) => {
      setCustomWorkouts(snap.docs.map((d) => docToObj<Workout>(d)));
      checkReady();
    }));

    return () => unsubs.forEach((u) => u());
  }, [user?.id, isCoach]);

  const addVideo = async (video: Omit<Video, 'id'>) => {
    await addDoc(collection(db, 'videos'), { ...video, createdAt: serverTimestamp() });
  };

  const updateVideo = async (videoId: string, updates: Partial<Video>) => {
    await updateDoc(doc(db, 'videos', videoId), { ...updates, updatedAt: serverTimestamp() });
  };

  const removeVideo = async (videoId: string) => {
    await deleteDoc(doc(db, 'videos', videoId));
  };

  const addCategory = async (category: string) => {
    if (categories.includes(category)) return;
    await addDoc(collection(db, 'libraryTags'), {
      name: category,
      createdBy: user?.id ?? '',
      createdAt: serverTimestamp(),
    });
    const updated = [...settingsCategories, category];
    await setDoc(doc(db, 'settings', 'videoCategories'), { categories: updated, updatedAt: serverTimestamp() }, { merge: true });
  };

  const renameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const tag = libraryTags.find(t => t.name === oldName);
    if (tag) {
      await updateDoc(doc(db, 'libraryTags', tag.id), { name: newName.trim(), updatedAt: serverTimestamp() });
    }
    const updated = settingsCategories.map(c => c === oldName ? newName.trim() : c);
    await setDoc(doc(db, 'settings', 'videoCategories'), { categories: updated, updatedAt: serverTimestamp() }, { merge: true });
    const affected = videos.filter(v => v.category === oldName);
    await Promise.all(affected.map(v => updateDoc(doc(db, 'videos', v.id), { category: newName.trim(), updatedAt: serverTimestamp() })));
  };

  const removeCategory = async (category: string) => {
    const tag = libraryTags.find(t => t.name === category);
    if (tag) {
      await deleteDoc(doc(db, 'libraryTags', tag.id));
    }
    const updated = settingsCategories.filter(c => c !== category);
    await setDoc(doc(db, 'settings', 'videoCategories'), { categories: updated, updatedAt: serverTimestamp() }, { merge: true });
  };

  const addWorkout = async (workout: Omit<Workout, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'workouts'), { ...workout, createdAt: serverTimestamp() });
  };

  const updateWorkout = async (workoutId: string, updates: Partial<Workout>) => {
    await updateDoc(doc(db, 'workouts', workoutId), { ...updates, updatedAt: serverTimestamp() });
  };

  const removeWorkout = async (workoutId: string) => {
    await deleteDoc(doc(db, 'workouts', workoutId));
  };

  const addWorkoutCategory = async (category: string) => {
    if (workoutCategories.includes(category)) return;
    const updated = [...workoutCategories, category];
    await setDoc(doc(db, 'settings', 'workoutCategories'), { categories: updated, updatedAt: serverTimestamp() }, { merge: true });
  };

  const uploadVideoPdf = async (file: File, videoId: string): Promise<{ name: string; url: string }> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `video-pdfs/${videoId}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    // Force the contentType. iOS Safari can send `application/octet-stream`
    // for files picked from the Files app, and our storage rule denies that.
    const snapshot = await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
    const url = await getDownloadURL(snapshot.ref);
    return { name: file.name, url };
  };

  const removeVideoPdf = async (videoId: string, pdfUrl: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    const updated = (video.pdfFiles || []).filter(p => p.url !== pdfUrl);
    await updateDoc(doc(db, 'videos', videoId), { pdfFiles: updated, updatedAt: serverTimestamp() });
  };

  return (
    <MediaContext.Provider value={{
      videos, categories, libraryTags, workouts, workoutCategories, loading,
      addVideo, updateVideo, removeVideo, addCategory, renameCategory, removeCategory, addWorkout, updateWorkout, removeWorkout, addWorkoutCategory,
      uploadVideoPdf, removeVideoPdf,
    }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be used within MediaProvider');
  return ctx;
};
