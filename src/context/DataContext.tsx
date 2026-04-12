// DataContext.tsx
// Full replacement — localStorage → Firestore
// Same function signatures as before so no other components need to change

import {
  createContext, useContext, useState, useEffect, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where, orderBy,
  addDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Client, Week, MacroTarget, Video, Workout, Message, Post, Comment } from '../types';
import { ALL_TRAINING_PROGRAMS } from '../data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataContextType {
  clients: Client[];
  weeks: Week[];
  videos: Video[];
  categories: string[];
  workouts: Workout[];
  workoutCategories: string[];
  messages: Message[];
  posts: Post[];
  loading: boolean;

  getClientWeeks: (clientId: string) => Week[];
  updateWeek: (weekId: string, updates: Partial<Week>) => Promise<void>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
  cascadeTargets: (
    clientId: string,
    startWeekNum: number,
    newTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => Promise<void>;
  completeOnboarding: (clientId: string, initialData: any) => Promise<void>;
  createProgram: (
    clientId: string,
    initialTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => Promise<void>;
  advanceWeek: (clientId: string, reviewedWeekNum: number) => Promise<void>;
  assignWorkout: (weekId: string, workoutId: string) => Promise<void>;
  unassignWorkout: (weekId: string, workoutId: string) => Promise<void>;
  addVideo: (video: Omit<Video, 'id'>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>, uid: string) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => Promise<void>;
  removeWorkout: (workoutId: string) => Promise<void>;
  addWorkoutCategory: (category: string) => Promise<void>;
  uploadPhoto: (file: File, userId: string, weekNumber: number) => Promise<string>;

  // Messaging
  sendMessage: (senderId: string, receiverId: string, senderName: string, text: string) => Promise<void>;
  markMessagesRead: (userId: string, otherUserId: string) => Promise<void>;
  getConversation: (userId1: string, userId2: string) => Message[];
  getUnreadCount: (userId: string) => number;

  // Community
  addPost: (authorId: string, authorName: string, authorRole: string, content: string) => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, authorId: string, authorName: string, content: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_TARGETS = {
  highCarb: { carbs: 300, protein: 180, fats: 60, calories: 2400 },
  lowCarb:  { carbs: 150, protein: 180, fats: 80,  calories: 2000 },
};

const INITIAL_VIDEO_CATEGORIES = ['Nutrition', 'Training', 'Coaching', 'Mindset'];
const INITIAL_WORKOUT_CATEGORIES = [
  'Full Body', 'Upper / Lower', 'Push / Pull / Legs',
  'Bro Split', 'Powerlifting', 'HIIT / Circuit', 'Cardio-Focused',
];

// Convert Firestore doc to plain object, preserving id
function docToObj<T>(snap: any): T {
  return { id: snap.id, ...snap.data() } as T;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  const [clients, setClients] = useState<Client[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_VIDEO_CATEGORIES);
  const [workoutCategories, setWorkoutCategories] = useState<string[]>(INITIAL_WORKOUT_CATEGORIES);
  const [customWorkouts, setCustomWorkouts] = useState<Workout[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Merge static workout programs + coach's custom ones
  const workouts: Workout[] = [...ALL_TRAINING_PROGRAMS, ...customWorkouts];

  // ── Real-time Firestore listeners ──────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];

    // ── clients: coach sees all, client sees only their own ──
    const clientsQuery = isCoach
      ? collection(db, 'clients')
      : query(collection(db, 'clients'), where('userId', '==', user.id));

    unsubs.push(
      onSnapshot(clientsQuery, (snap) => {
        setClients(snap.docs.map((d) => docToObj<Client>(d)));
      })
    );

    // ── weeks: coach sees all, client sees only their own ──
    // For clients: we look up their clientId from the clients collection first
    // For coach: listen to all weeks
    const weeksQuery = isCoach
      ? collection(db, 'weeks')
      : query(collection(db, 'weeks'), where('userId', '==', user.id));

    unsubs.push(
      onSnapshot(weeksQuery, (snap) => {
        setWeeks(snap.docs.map((d) => docToObj<Week>(d)));
      })
    );

    // ── videos: all logged-in users see unlocked; VIP + coach see all ──
    const videosQuery =
      isCoach || user.role === 'coaching'
        ? query(collection(db, 'videos'))
        : query(collection(db, 'videos'), where('isLocked', '==', false));

    unsubs.push(
      onSnapshot(videosQuery, (snap) => {
        const parsed = snap.docs.map((d) => docToObj<Video>(d));
        setVideos(parsed.sort((a, b) => a.title.localeCompare(b.title)));
      })
    );

    // ── settings (categories) ──
    unsubs.push(
      onSnapshot(doc(db, 'settings', 'videoCategories'), (snap) => {
        if (snap.exists()) setCategories(snap.data().categories ?? INITIAL_VIDEO_CATEGORIES);
      })
    );

    unsubs.push(
      onSnapshot(doc(db, 'settings', 'workoutCategories'), (snap) => {
        if (snap.exists()) setWorkoutCategories(snap.data().categories ?? INITIAL_WORKOUT_CATEGORIES);
      })
    );

    // ── custom workouts (coach-created only) ──
    unsubs.push(
      onSnapshot(collection(db, 'workouts'), (snap) => {
        setCustomWorkouts(snap.docs.map((d) => docToObj<Workout>(d)));
      })
    );

    // ── messages: only messages involving the current user ──
    const msgsAsSender = query(
      collection(db, 'messages'),
      where('senderId', '==', user.id)
    );
    const msgsAsReceiver = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.id)
    );

    const sortMessages = (msgs: Message[]) => 
      msgs.sort((a, b) => ((a.timestamp as any)?.seconds || 0) - ((b.timestamp as any)?.seconds || 0));

    unsubs.push(
      onSnapshot(msgsAsSender, (snap) => {
        const sent = snap.docs.map((d) => docToObj<Message>(d));
        setMessages((prev) => {
          const received = prev.filter((m) => m.receiverId === user.id);
          return sortMessages([...received, ...sent]);
        });
      })
    );

    unsubs.push(
      onSnapshot(msgsAsReceiver, (snap) => {
        const received = snap.docs.map((d) => docToObj<Message>(d));
        setMessages((prev) => {
          const sent = prev.filter((m) => m.senderId === user.id);
          return sortMessages([...sent, ...received]);
        });
      })
    );

    // ── community posts (with async race guard) ──
    let postsGeneration = 0;
    unsubs.push(
      onSnapshot(
        query(collection(db, 'posts')),
        async (snap) => {
          const myGen = ++postsGeneration;
          const postsWithComments = await Promise.all(
            snap.docs.map(async (d) => {
              const post = docToObj<Post>(d);
              const commentsSnap = await getDocs(
                query(collection(db, 'posts', d.id, 'comments'))
              );
              post.comments = commentsSnap.docs.map((c) => docToObj<Comment>(c))
                .sort((a, b) => ((a.timestamp as any)?.seconds || 0) - ((b.timestamp as any)?.seconds || 0));
              return post;
            })
          );
          // Only apply if no newer snapshot has fired while we were loading
          if (myGen === postsGeneration) {
            setPosts(postsWithComments.sort((a, b) => ((b.timestamp as any)?.seconds || 0) - ((a.timestamp as any)?.seconds || 0)));
          }
        }
      )
    );

    setLoading(false);

    return () => unsubs.forEach((u) => u());
  }, [user?.id, isCoach]);

  // ─── Derived helpers ──────────────────────────────────────────────────────

  const getClientWeeks = (clientId: string) =>
    weeks
      .filter((w) => w.clientId === clientId)
      .sort((a, b) => a.weekNumber - b.weekNumber);

  // ─── Writes ───────────────────────────────────────────────────────────────

  const updateWeek = async (weekId: string, updates: Partial<Week>) => {
    await updateDoc(doc(db, 'weeks', weekId), { ...updates, updatedAt: serverTimestamp() });
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    await updateDoc(doc(db, 'clients', clientId), { ...updates, updatedAt: serverTimestamp() });
  };

  const cascadeTargets = async (
    clientId: string,
    startWeekNum: number,
    newTargets: { highCarb: MacroTarget; lowCarb: MacroTarget }
  ) => {
    const affected = weeks.filter(
      (w) => w.clientId === clientId && w.weekNumber >= startWeekNum
    );
    await Promise.all(
      affected.map((w) =>
        updateDoc(doc(db, 'weeks', w.id), { activeTargets: newTargets, updatedAt: serverTimestamp() })
      )
    );
  };

  const advanceWeek = async (clientId: string, reviewedWeekNum: number) => {
    const toReview = weeks.find(
      (w) => w.clientId === clientId && w.weekNumber === reviewedWeekNum
    );
    const toUnlock = weeks.find(
      (w) => w.clientId === clientId && w.weekNumber === reviewedWeekNum + 1
    );
    const client = clients.find((c) => c.id === clientId);

    const ops: Promise<any>[] = [];

    if (toReview) {
      ops.push(updateDoc(doc(db, 'weeks', toReview.id), { status: 'locked', updatedAt: serverTimestamp() }));
    }
    if (toUnlock && toUnlock.status !== 'locked') {
      ops.push(updateDoc(doc(db, 'weeks', toUnlock.id), { status: 'pending', updatedAt: serverTimestamp() }));
    }
    if (client && client.currentWeek === reviewedWeekNum) {
      ops.push(
        updateDoc(doc(db, 'clients', clientId), {
          currentWeek: Math.min(reviewedWeekNum + 1, client.programLength),
          needsReview: false,
          updatedAt: serverTimestamp(),
        })
      );
    }

    await Promise.all(ops);
  };

  const completeOnboarding = async (clientId: string, initialData: any) => {
    const weekRef = doc(db, 'weeks', `${clientId}-w0`);
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
      return setDoc(doc(db, 'weeks', `${clientId}-w${weekNum}`), {
        clientId,
        userId: client?.userId || null,
        weekNumber: weekNum,
        status: weekNum === 1 ? 'pending' : 'pending',
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
      updateDoc(doc(db, 'clients', clientId), {
        currentWeek: 1,
        needsReview: false,
        updatedAt: serverTimestamp(),
      }),
    ]);
  };

  const assignWorkout = async (weekId: string, workoutId: string) => {
    const week = weeks.find((w) => w.id === weekId);
    if (!week) return;
    const existing = week.assignedWorkoutIds || [];
    if (existing.includes(workoutId)) return;
    await updateDoc(doc(db, 'weeks', weekId), {
      assignedWorkoutIds: [...existing, workoutId],
      updatedAt: serverTimestamp(),
    });
  };

  const unassignWorkout = async (weekId: string, workoutId: string) => {
    const week = weeks.find((w) => w.id === weekId);
    if (!week) return;
    await updateDoc(doc(db, 'weeks', weekId), {
      assignedWorkoutIds: (week.assignedWorkoutIds || []).filter((id) => id !== workoutId),
      updatedAt: serverTimestamp(),
    });
  };

  // ── Videos ────────────────────────────────────────────────────────────────

  const addVideo = async (video: Omit<Video, 'id'>) => {
    await addDoc(collection(db, 'videos'), {
      ...video,
      createdAt: serverTimestamp(),
    });
  };

  const addCategory = async (category: string) => {
    if (categories.includes(category)) return;
    const updated = [...categories, category];
    await setDoc(
      doc(db, 'settings', 'videoCategories'),
      { categories: updated, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  // ── Clients ───────────────────────────────────────────────────────────────

  // uid = the Firebase Auth uid of the new client (returned by createUserAccount)
  const addClient = async (client: Omit<Client, 'id'>, uid: string) => {
    // Use the uid as the Firestore document ID so clients/{uid} matches users/{uid}
    await setDoc(doc(db, 'clients', uid), {
      ...client,
      userId: uid,
      createdAt: serverTimestamp(),
    });
  };

  const removeClient = async (clientId: string) => {
    // Delete client doc
    await deleteDoc(doc(db, 'clients', clientId));
    // Delete all their week docs
    const clientWeeks = weeks.filter((w) => w.clientId === clientId);
    await Promise.all(clientWeeks.map((w) => deleteDoc(doc(db, 'weeks', w.id))));
  };

  // ── Workouts ──────────────────────────────────────────────────────────────

  const addWorkout = async (workout: Omit<Workout, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'workouts'), {
      ...workout,
      createdAt: serverTimestamp(),
    });
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
    await setDoc(
      doc(db, 'settings', 'workoutCategories'),
      { categories: updated, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  // ── Photo upload to Firebase Storage ─────────────────────────────────────

  const uploadPhoto = async (file: File, userId: string, weekNumber: number): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `checkIns/${userId}/week${weekNumber}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  // ── Messaging ─────────────────────────────────────────────────────────────

  const sendMessage = async (
    senderId: string,
    receiverId: string,
    senderName: string,
    text: string
  ) => {
    await addDoc(collection(db, 'messages'), {
      senderId,
      receiverId,
      senderName,
      text,
      timestamp: serverTimestamp(),
      read: false,
    });
  };

  const markMessagesRead = async (userId: string, otherUserId: string) => {
    const unread = messages.filter(
      (m) => m.receiverId === userId && m.senderId === otherUserId && !m.read
    );
    await Promise.all(
      unread.map((m) => updateDoc(doc(db, 'messages', m.id), { read: true }))
    );
  };

  const getConversation = (userId1: string, userId2: string): Message[] =>
    messages
      .filter(
        (m) =>
          (m.senderId === userId1 && m.receiverId === userId2) ||
          (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime()
      );

  const getUnreadCount = (userId: string): number =>
    messages.filter((m) => m.receiverId === userId && !m.read).length;

  // ── Community ─────────────────────────────────────────────────────────────

  const addPost = async (
    authorId: string,
    authorName: string,
    authorRole: string,
    content: string
  ) => {
    await addDoc(collection(db, 'posts'), {
      authorId,
      authorName,
      authorRole,
      content,
      timestamp: serverTimestamp(),
      likes: [],
      commentCount: 0,
    });
  };

  const likePost = async (postId: string, userId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.likes.includes(userId);
    await updateDoc(doc(db, 'posts', postId), {
      likes: liked
        ? post.likes.filter((id) => id !== userId)
        : [...post.likes, userId],
    });
  };

  const addComment = async (
    postId: string,
    authorId: string,
    authorName: string,
    content: string
  ) => {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId,
      authorName,
      content,
      timestamp: serverTimestamp(),
    });
    // Increment comment count on the post
    const post = posts.find((p) => p.id === postId);
    if (post) {
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: (post.commentCount ?? post.comments?.length ?? 0) + 1,
      });
    }
  };

  // ─── Context value ────────────────────────────────────────────────────────

  return (
    <DataContext.Provider
      value={{
        clients, weeks, videos, categories,
        workouts, workoutCategories,
        messages, posts, loading,
        getClientWeeks,
        updateWeek, updateClient, cascadeTargets,
        completeOnboarding, createProgram, advanceWeek,
        assignWorkout, unassignWorkout,
        addVideo, addCategory,
        addClient, removeClient,
        addWorkout, updateWorkout, removeWorkout, addWorkoutCategory,
        uploadPhoto,
        sendMessage, markMessagesRead, getConversation, getUnreadCount,
        addPost, likePost, addComment,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
