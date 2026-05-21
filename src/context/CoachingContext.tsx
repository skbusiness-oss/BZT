import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where,
  setDoc, updateDoc, deleteDoc, addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../lib/firebase';
import { useAuth } from './AuthContext';

// `setUserRole` Cloud Function — sets a custom Auth claim AND mirrors the
// role to Firestore. Used when the coach flips a user's accessLevel.
const callSetUserRole = httpsCallable<
  { targetUid: string; role: 'community' | 'client' | 'coach' | 'admin' },
  { ok: boolean }
>(functions, 'setUserRole');
import { Client, Week, MacroTarget, MacroTargets } from '../types';
import { validateImageFile } from '../lib/validation';
import { compressImageIfNeeded } from '../lib/imageCompression';
import { reportError } from '../lib/reportError';
import { DEFAULT_TARGETS } from '../lib/constants';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  const data = snap.data();
  if (data.role === 'coaching') data.role = 'client';
  if (data.accessLevel === 'coaching') data.accessLevel = 'client';
  return { id: snap.id, ...data } as T;
}

const calculateCals = (m: MacroTarget) => (m.carbs * 4) + (m.protein * 4) + (m.fats * 9);

function moderateFromTargets(targets: { highCarb: MacroTarget; lowCarb: MacroTarget }): MacroTarget {
  const avg = {
    carbs: Math.round((targets.highCarb.carbs + targets.lowCarb.carbs) / 2),
    protein: Math.round((targets.highCarb.protein + targets.lowCarb.protein) / 2),
    fats: Math.round((targets.highCarb.fats + targets.lowCarb.fats) / 2),
    calories: 0,
  };
  avg.calories = calculateCals(avg);
  return avg;
}

function normalizeTargets(targets: MacroTargets): MacroTargets {
  return {
    mode: targets.mode ?? 'cycling',
    highCarb: targets.highCarb,
    lowCarb: targets.lowCarb,
    moderateCarb: targets.moderateCarb ?? moderateFromTargets(targets),
    cardio: targets.cardio ?? 0,
  };
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
    newTargets: MacroTargets
  ) => Promise<void>;
  completeOnboarding: (clientId: string, initialData: Record<string, string>, photos?: { front?: string; side?: string; back?: string }) => Promise<void>;
  createProgram: (
    clientId: string,
    initialTargets: MacroTargets
  ) => Promise<void>;
  advanceWeek: (clientId: string, reviewedWeekNum: number) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>, uid: string) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  uploadPhoto: (file: File, userId: string, weekNumber: number) => Promise<string>;
  extendProgram: (clientId: string, additionalWeeks: number, targets: MacroTargets) => Promise<void>;
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

    unsubs.push(onSnapshot(
      clientsQuery,
      (snap) => {
        setClients(snap.docs.map((d) => docToObj<Client>(d)));
        checkReady();
      },
      (err) => {
        reportError('CoachingContext.clients', err);
        checkReady();
      }
    ));

    const weeksQuery = isCoach
      ? collection(db, 'checkIns')
      : query(collection(db, 'checkIns'), where('clientId', '==', user.id));

    unsubs.push(onSnapshot(
      weeksQuery,
      (snap) => {
        setWeeks(snap.docs.map((d) => docToObj<Week>(d)));
        checkReady();
      },
      (err) => {
        reportError('CoachingContext.weeks', err);
        checkReady();
      }
    ));

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

    // When the coach changes accessLevel, mirror it onto the user's auth claim
    // (via Cloud Function) so:
    //   1. Storage rules (which read `request.auth.token.role`) start
    //      enforcing the new role.
    //   2. The user's existing tokens are revoked — they re-authenticate
    //      and pick up the new role within ~5s.
    //   3. The Firestore mirror happens server-side, atomic with the claim.
    if (updates.accessLevel) {
      const client = clients.find(c => c.id === clientId);
      const userId = client?.userId;
      if (userId) {
        const newRole = updates.accessLevel === 'community' ? 'community' : 'client';
        try {
          await callSetUserRole({ targetUid: userId, role: newRole });
        } catch (e) {
          // Non-fatal: client doc was updated even if claim write fails. The
          // coach can retry by toggling accessLevel back and forth.
          reportError('CoachingContext.syncRoleClaim', e);
        }
      }
    }
  };

  const cascadeTargets = async (
    clientId: string,
    startWeekNum: number,
    newTargets: MacroTargets
  ) => {
    const targets = normalizeTargets(newTargets);
    const affected = weeks.filter((w) => w.clientId === clientId && w.weekNumber >= startWeekNum);
    await Promise.all(
      affected.map((w) => updateDoc(doc(db, 'checkIns', w.id), { activeTargets: targets, updatedAt: serverTimestamp() }))
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

  const completeOnboarding = async (clientId: string, initialData: Record<string, string>, photos?: { front?: string; side?: string; back?: string }) => {
    const weekRef = doc(db, 'checkIns', `${clientId}-w0`);
    // Build photos object from uploaded URLs (filter out empty strings)
    const weekPhotos: Record<string, string> = {};
    if (photos?.front) weekPhotos.front = photos.front;
    if (photos?.side) weekPhotos.side = photos.side;
    if (photos?.back) weekPhotos.back = photos.back;

    await setDoc(weekRef, {
      clientId,
      userId: clients.find((c) => c.id === clientId)?.userId || null,
      weekNumber: 0,
      status: 'submitted',
      activeTargets: normalizeTargets(DEFAULT_TARGETS),
      dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
      coachFeedback: '',
      photos: weekPhotos,
      createdAt: serverTimestamp(),
    });

    // Build the update object — include new profile fields at top-level for querying/filtering
    const clientUpdate: Record<string, unknown> = {
      isOnboarding: false,
      intakeData: { ...initialData, submittedAt: new Date().toISOString() },
      currentWeek: 0,
      needsReview: true,
      updatedAt: serverTimestamp(),
    };

    // Persist birthdate, gender, fitnessLevel, phone as top-level
    // fields on the client doc so coach queries / lists can sort and
    // display without unpacking intakeData on every read.
    if (initialData.birthdate) clientUpdate.birthdate = initialData.birthdate;
    if (initialData.gender) clientUpdate.gender = initialData.gender;
    if (initialData.fitnessLevel) clientUpdate.fitnessLevel = initialData.fitnessLevel;
    if (initialData.phone) clientUpdate.phone = initialData.phone;

    await updateDoc(doc(db, 'clients', clientId), clientUpdate);
  };

  const createProgram = async (
    clientId: string,
    initialTargets: MacroTargets
  ) => {
    const client = clients.find((c) => c.id === clientId);
    const programLength = client?.programLength || 12;
    const firstWeekTargets = normalizeTargets(initialTargets);
    const defaultTargets = normalizeTargets(DEFAULT_TARGETS);
    const weekWrites = Array.from({ length: programLength }, (_, i) => {
      const weekNum = i + 1;
      return setDoc(doc(db, 'checkIns', `${clientId}-w${weekNum}`), {
        clientId,
        userId: client?.userId || null,
        weekNumber: weekNum,
        status: 'pending',
        activeTargets: weekNum === 1 ? firstWeekTargets : defaultTargets,
        dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
        coachFeedback: '',
        photos: {},
        createdAt: serverTimestamp(),
      });
    });
    await Promise.all([
      ...weekWrites,
      updateDoc(doc(db, 'clients', clientId), { currentWeek: 1, needsReview: false, updatedAt: serverTimestamp() }),
    ]);
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
    // Capture the user's auth uid before we drop the client doc
    const client = clients.find(c => c.id === clientId);
    const userId = client?.userId;

    await deleteDoc(doc(db, 'clients', clientId));
    const clientWeeks = weeks.filter((w) => w.clientId === clientId);
    await Promise.all(clientWeeks.map((w) => deleteDoc(doc(db, 'checkIns', w.id))));

    if (userId) {
      // Audit log — who deleted whom, and when
      try {
        await setDoc(doc(db, 'deletionLogs', userId), {
          deletedUserId: userId,
          deletedClientId: clientId,
          clientName: client?.name || 'unknown',
          clientEmail: client?.email || 'unknown',
          deletedBy: user?.id || 'unknown',
          deletedByEmail: user?.email || 'unknown',
          reason: 'coach_removed',
          deletedAt: serverTimestamp(),
        });
      } catch (e) {
        reportError('CoachingContext.writeDeletionLog', e);
      }
      // Clear any active program assignment
      try {
        await deleteDoc(doc(db, 'userPrograms', userId));
      } catch {
        // ok if it didn't exist
      }
    }

    // Audit log: who deleted whom, when. Keeps a coach-readable trail.
    try {
      await addDoc(collection(db, 'auditLog'), {
        action: 'delete_client',
        clientId,
        targetUserId: userId ?? null,
        targetName: client?.name ?? null,
        targetEmail: client?.email ?? null,
        actorUid: user?.id ?? null,
        actorName: user?.name ?? null,
        weeksDeleted: clientWeeks.length,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      reportError('CoachingContext.writeAuditLog', e);
    }
  };

  const uploadPhoto = async (file: File, userId: string, weekNumber: number): Promise<string> => {
    const err = validateImageFile(file);
    if (err) throw new Error(err);
    // Progress photos from phones are typically 6-12 MB at 4000+ px
    // wide. We display them at 200-400 px in cards and full-screen
    // in lightboxes — neither needs that resolution. Compress to a
    // 1600 px max edge JPEG before upload: 90%+ size cut, no visible
    // quality loss, faster upload + faster download for coach review.
    const uploadFile = await compressImageIfNeeded(file);

    // Use the browser-reported MIME type for the extension, not the filename,
    // to prevent extension spoofing (e.g. evil.exe renamed to photo.jpg).
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif',
    };
    const ext = mimeToExt[uploadFile.type] ?? 'jpg';
    const path = `check-ins/${userId}/week${weekNumber}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    // Force the contentType. iOS Safari can send `application/octet-stream`
    // for files picked from Files app, and our storage rule denies that.
    const snapshot = await uploadBytes(storageRef, uploadFile, { contentType: uploadFile.type || `image/${ext}` });
    return getDownloadURL(snapshot.ref);
  };

  const extendProgram = async (
    clientId: string,
    additionalWeeks: number,
    targets: MacroTargets
  ) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const currentLength = client.programLength;
    const newLength = currentLength + additionalWeeks;
    const nextTargets = normalizeTargets(targets);

    const weekWrites = Array.from({ length: additionalWeeks }, (_, i) => {
      const weekNum = currentLength + i + 1;
      return setDoc(doc(db, 'checkIns', `${clientId}-w${weekNum}`), {
        clientId,
        userId: client.userId || null,
        weekNumber: weekNum,
        status: 'pending',
        activeTargets: nextTargets,
        dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
        coachFeedback: '',
        photos: {},
        createdAt: serverTimestamp(),
      });
    });

    await Promise.all([
      ...weekWrites,
      updateDoc(doc(db, 'clients', clientId), {
        programLength: newLength,
        updatedAt: serverTimestamp(),
      }),
    ]);
  };

  return (
    <CoachingContext.Provider value={{
      clients, weeks, loading,
      getClientWeeks, updateWeek, updateClient, cascadeTargets,
      completeOnboarding, createProgram, advanceWeek,
      addClient, removeClient, uploadPhoto, extendProgram,
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
