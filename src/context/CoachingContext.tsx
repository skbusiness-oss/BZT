import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where,
  setDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Client, Week, MacroTarget } from '../types';
import { DEFAULT_TARGETS } from '../lib/constants';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

export interface CoachingContextType {
  clients: Client[];
  weeks: Week[];
  loading: boolean;
  getClientWeeks: (clientId: string) => Week[];
  updateWeek: (weekId: string, updates: Partial<Week>) => Promise<void>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
  cascadeTargets: (
    clientId: string,
    startWeekNum: number,
    newTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => Promise<void>;
  completeOnboarding: (clientId: string, initialData: Record<string, string>) => Promise<void>;
  createProgram: (
    clientId: string,
    initialTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => Promise<void>;
  advanceWeek: (clientId: string, reviewedWeekNum: number) => Promise<void>;
  assignWorkout: (weekId: string, workoutId: string) => Promise<void>;
  unassignWorkout: (weekId: string, workoutId: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>, uid: string) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  uploadPhoto: (file: File, userId: string, weekNumber: number) => Promise<string>;
}

const CoachingContext = createContext<CoachingContextType | undefined>(undefined);

export const CoachingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [clients, setClients] = useState<Client[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsubs: (() => void)[] = [];
    let listenersReady = 0;
    const totalListeners = 2;
    const checkReady = () => { if (++listenersReady >= totalListeners) setLoading(false); };

    const clientsQuery = isCoach
      ? collection(db, 'clients')
      : query(collection(db, 'clients'), where('userId', '==', user.id));

    unsubs.push(onSnapshot(clientsQuery, (snap) => {
      setClients(snap.docs.map((d) => docToObj<Client>(d)));
      checkReady();
    }));

    const weeksQuery = isCoach
      ? collection(db, 'checkIns')
      : query(collection(db, 'checkIns'), where('clientId', '==', user.id));

    unsubs.push(onSnapshot(weeksQuery, (snap) => {
      setWeeks(snap.docs.map((d) => docToObj<Week>(d)));
      checkReady();
    }));

    return () => unsubs.forEach((u) => u());
  }, [user?.id, isCoach]);

  const getClientWeeks = useCallback(
    (clientId: string) =>
      weeks.filter((w) => w.clientId === clientId).sort((a, b) => a.weekNumber - b.weekNumber),
    [weeks]
  );

  const updateWeek = async (weekId: string, updates: Partial<Week>) => {
    await updateDoc(doc(db, 'checkIns', weekId), { ...updates, updatedAt: serverTimestamp() });
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    await updateDoc(doc(db, 'clients', clientId), { ...updates, updatedAt: serverTimestamp() });
  };

  const cascadeTargets = async (
    clientId: string,
    startWeekNum: number,
    newTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => {
    const affected = weeks.filter((w) => w.clientId === clientId && w.weekNumber >= startWeekNum);
    await Promise.all(
      affected.map((w) => updateDoc(doc(db, 'checkIns', w.id), { activeTargets: newTargets, updatedAt: serverTimestamp() }))
    );
  };

  const advanceWeek = async (clientId: string, reviewedWeekNum: number) => {
    const toReview = weeks.find((w) => w.clientId === clientId && w.weekNumber === reviewedWeekNum);
    const toUnlock = weeks.find((w) => w.clientId === clientId && w.weekNumber === reviewedWeekNum + 1);
    const client = clients.find((c) => c.id === clientId);
    const ops: Promise<unknown>[] = [];
    if (toReview) ops.push(updateDoc(doc(db, 'checkIns', toReview.id), { status: 'locked', updatedAt: serverTimestamp() }));
    if (toUnlock && toUnlock.status !== 'locked') ops.push(updateDoc(doc(db, 'checkIns', toUnlock.id), { status: 'pending', updatedAt: serverTimestamp() }));
    if (client && client.currentWeek === reviewedWeekNum) {
      ops.push(updateDoc(doc(db, 'clients', clientId), {
        currentWeek: Math.min(reviewedWeekNum + 1, client.programLength),
        needsReview: false,
        updatedAt: serverTimestamp(),
      }));
    }
    await Promise.all(ops);
  };

  const completeOnboarding = async (clientId: string, initialData: Record<string, string>) => {
    const weekRef = doc(db, 'checkIns', `${clientId}-w0`);
    await setDoc(weekRef, {
      clientId,
      userId: clients.find((c) => c.id === clientId)?.userId || null,
      weekNumber: 0,
      status: 'submitted',
      activeTargets: { ...DEFAULT_TARGETS },
      dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
      coachFeedback: '',
      photos: [],
      assignedWorkoutIds: [],
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'clients', clientId), {
      isOnboarding: false,
      intakeData: { ...initialData, submittedAt: new Date().toISOString() },
      currentWeek: 0,
      needsReview: true,
      updatedAt: serverTimestamp(),
    });
  };

  const createProgram = async (
    clientId: string,
    initialTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => {
    const client = clients.find((c) => c.id === clientId);
    const programLength = client?.programLength || 12;
    const weekWrites = Array.from({ length: programLength }, (_, i) => {
      const weekNum = i + 1;
      return setDoc(doc(db, 'checkIns', `${clientId}-w${weekNum}`), {
        clientId,
        userId: client?.userId || null,
        weekNumber: weekNum,
        status: 'pending',
        activeTargets: weekNum === 1 ? initialTargets : { ...DEFAULT_TARGETS },
        dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
        coachFeedback: '',
        photos: [],
        assignedWorkoutIds: [],
        createdAt: serverTimestamp(),
      });
    });
    await Promise.all([
      ...weekWrites,
      updateDoc(doc(db, 'clients', clientId), { currentWeek: 1, needsReview: false, updatedAt: serverTimestamp() }),
    ]);
  };

  const assignWorkout = async (weekId: string, workoutId: string) => {
    const week = weeks.find((w) => w.id === weekId);
    if (!week) return;
    const existing = week.assignedWorkoutIds || [];
    if (existing.includes(workoutId)) return;
    await updateDoc(doc(db, 'checkIns', weekId), { assignedWorkoutIds: [...existing, workoutId], updatedAt: serverTimestamp() });
  };

  const unassignWorkout = async (weekId: string, workoutId: string) => {
    const week = weeks.find((w) => w.id === weekId);
    if (!week) return;
    await updateDoc(doc(db, 'checkIns', weekId), {
      assignedWorkoutIds: (week.assignedWorkoutIds || []).filter((id) => id !== workoutId),
      updatedAt: serverTimestamp(),
    });
  };

  const addClient = async (client: Omit<Client, 'id'>, uid: string) => {
    await setDoc(doc(db, 'clients', uid), {
      ...client,
      userId: uid,
      coachId: user?.id || null,
      createdAt: serverTimestamp(),
    });
  };

  const removeClient = async (clientId: string) => {
    await deleteDoc(doc(db, 'clients', clientId));
    const clientWeeks = weeks.filter((w) => w.clientId === clientId);
    await Promise.all(clientWeeks.map((w) => deleteDoc(doc(db, 'checkIns', w.id))));
  };

  const uploadPhoto = async (file: File, userId: string, weekNumber: number): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `check-ins/${userId}/week${weekNumber}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  return (
    <CoachingContext.Provider value={{
      clients, weeks, loading,
      getClientWeeks, updateWeek, updateClient, cascadeTargets,
      completeOnboarding, createProgram, advanceWeek,
      assignWorkout, unassignWorkout,
      addClient, removeClient, uploadPhoto,
    }}>
      {children}
    </CoachingContext.Provider>
  );
};

export const useCoaching = () => {
  const ctx = useContext(CoachingContext);
  if (!ctx) throw new Error('useCoaching must be used within CoachingProvider');
  return ctx;
};
