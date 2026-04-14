import {
  createContext, useContext, useState, useEffect, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where,
  addDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Video, Workout } from '../types';
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
  workouts: Workout[];
  workoutCategories: string[];
  loading: boolean;
  addVideo: (video: Omit<Video, 'id'>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => Promise<void>;
  removeWorkout: (workoutId: string) => Promise<void>;
  addWorkoutCategory: (category: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_VIDEO_CATEGORIES);
  const [workoutCategories, setWorkoutCategories] = useState<string[]>(INITIAL_WORKOUT_CATEGORIES);
  const [customWorkouts, setCustomWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const workouts: Workout[] = [...ALL_TRAINING_PROGRAMS, ...customWorkouts];

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsubs: (() => void)[] = [];
    let listenersReady = 0;
    const totalListeners = 4;
    const checkReady = () => { if (++listenersReady >= totalListeners) setLoading(false); };

    const videosQuery = isCoach || user.role === 'client'
      ? query(collection(db, 'courses'))
      : query(collection(db, 'courses'), where('isLocked', '==', false));

    unsubs.push(onSnapshot(videosQuery, (snap) => {
      const parsed = snap.docs.map((d) => docToObj<Video>(d));
      setVideos(parsed.sort((a, b) => a.title.localeCompare(b.title)));
      checkReady();
    }));

    unsubs.push(onSnapshot(doc(db, 'settings', 'videoCategories'), (snap) => {
      if (snap.exists()) setCategories(snap.data().categories ?? INITIAL_VIDEO_CATEGORIES);
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
    await addDoc(collection(db, 'courses'), { ...video, createdAt: serverTimestamp() });
  };

  const addCategory = async (category: string) => {
    if (categories.includes(category)) return;
    const updated = [...categories, category];
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

  return (
    <MediaContext.Provider value={{
      videos, categories, workouts, workoutCategories, loading,
      addVideo, addCategory, addWorkout, updateWorkout, removeWorkout, addWorkoutCategory,
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
