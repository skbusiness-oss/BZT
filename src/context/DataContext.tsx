import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Week, MacroTarget, Video, Workout, Message, Post, Comment } from '../types';
import { ALL_TRAINING_PROGRAMS } from '../data';

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
    updateWeek: (weekId: string, updates: Partial<Week>) => void;
    updateClient: (clientId: string, updates: Partial<Client>) => void;
    cascadeTargets: (clientId: string, startWeekNum: number, newTargets: { highCarb: MacroTarget, lowCarb: MacroTarget }) => void;
    completeOnboarding: (clientId: string, initialData: any) => void;
    createProgram: (clientId: string, initialTargets: { highCarb: MacroTarget, lowCarb: MacroTarget }) => void;
    advanceWeek: (clientId: string, reviewedWeekNum: number) => void;
    assignWorkout: (weekId: string, workoutId: string) => void;
    unassignWorkout: (weekId: string, workoutId: string) => void;
    addVideo: (video: Omit<Video, 'id'>) => void;
    addCategory: (category: string) => void;
    addClient: (client: Omit<Client, 'id'>) => void;
    removeClient: (clientId: string) => void;
    addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => void;
    updateWorkout: (workoutId: string, updates: Partial<Workout>) => void;
    removeWorkout: (workoutId: string) => void;
    addWorkoutCategory: (category: string) => void;
    // Messaging
    sendMessage: (senderId: string, receiverId: string, senderName: string, text: string) => void;
    markMessagesRead: (userId: string, otherUserId: string) => void;
    getConversation: (userId1: string, userId2: string) => Message[];
    getUnreadCount: (userId: string) => number;
    // Community
    addPost: (authorId: string, authorName: string, authorRole: string, content: string) => void;
    likePost: (postId: string, userId: string) => void;
    addComment: (postId: string, authorId: string, authorName: string, content: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- MOCK DATA ---

const INITIAL_CLIENTS: Client[] = [
    { id: 'c1', userId: 'u2-client', name: 'John Doe', email: 'john@example.com', category: 'cutting', currentWeek: 3, programLength: 12, needsReview: false },
    { id: 'c2', userId: 'u4-sarah', name: 'Sarah Kim', email: 'sarah@example.com', category: 'bulking', currentWeek: 6, programLength: 12, needsReview: true },
    { id: 'c3', userId: 'u5-new', name: 'New Client', email: 'new@example.com', category: 'health', currentWeek: 0, programLength: 12, needsReview: false, isOnboarding: true },
    { id: 'c4', userId: 'u6-pro', name: 'Mike Pro', email: 'mike@example.com', category: 'pro', currentWeek: 8, programLength: 16, needsReview: false },
];

const MOCK_VIDEOS: Video[] = [
    { id: 'v1', title: 'Nutrition Fundamentals', category: 'Nutrition', thumbnailUrl: 'https://placehold.co/600x400/10b981/ffffff?text=Nutrition', isLocked: false, description: 'Master the fundamentals of nutrition.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', platform: 'youtube' },
    { id: 'v2', title: 'Progressive Overload', category: 'Training', thumbnailUrl: 'https://placehold.co/600x400/3b82f6/ffffff?text=Training', isLocked: false, description: 'Learn how to progressively overload for gains.', videoUrl: 'https://vimeo.com/123456', platform: 'vimeo' },
    { id: 'v3', title: 'Advanced Macro Cycling', category: 'Nutrition', thumbnailUrl: 'https://placehold.co/600x400/8b5cf6/ffffff?text=Advanced', isLocked: true, description: 'Advanced techniques for macro cycling.' },
    { id: 'v4', title: 'Coach Secrets', category: 'Coaching', thumbnailUrl: 'https://placehold.co/600x400/f43f5e/ffffff?text=Secrets', isLocked: true, description: 'Insider tips from top coaches.' },
];

const INITIAL_CATEGORIES = ['Nutrition', 'Training', 'Coaching', 'Mindset'];
const INITIAL_WORKOUT_CATEGORIES = ['Full Body', 'Upper / Lower', 'Push / Pull / Legs', 'Bro Split', 'Powerlifting', 'HIIT / Circuit', 'Cardio-Focused'];

const MOCK_WORKOUTS: Workout[] = ALL_TRAINING_PROGRAMS;

const DEFAULT_TARGETS = {
    highCarb: { carbs: 300, protein: 180, fats: 60, calories: 2400 },
    lowCarb: { carbs: 150, protein: 180, fats: 80, calories: 2000 },
};

const generateWeeksForClient = (clientId: string, length: number = 12, includeWeek0: boolean = false): Week[] => {
    const weeks: Week[] = [];
    if (includeWeek0) {
        weeks.push({
            id: `${clientId}-w0`,
            clientId,
            weekNumber: 0,
            status: 'submitted' as Week['status'],
            activeTargets: { ...DEFAULT_TARGETS },
            dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
        });
    }
    for (let i = 0; i < length; i++) {
        weeks.push({
            id: `${clientId}-w${i + 1}`,
            clientId,
            weekNumber: i + 1,
            status: i === 2 ? 'pending' : (i < 2 ? 'locked' : 'pending') as Week['status'],
            activeTargets: { ...DEFAULT_TARGETS },
            dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
            minWeight: i < 2 ? 85 - i : undefined,
        });
    }
    return weeks;
};

const INITIAL_WEEKS: Week[] = [
    ...generateWeeksForClient('c1'),
    ...generateWeeksForClient('c2'),
];

const MOCK_MESSAGES: Message[] = [
    { id: 'm1', senderId: 'u1-coach', receiverId: 'u2-client', senderName: 'Coach Zack', text: 'Hey John, great work this week! Keep pushing.', timestamp: '2026-02-20T10:00:00Z', read: true },
    { id: 'm2', senderId: 'u2-client', receiverId: 'u1-coach', senderName: 'John Doe', text: 'Thanks Coach! Feeling stronger every week.', timestamp: '2026-02-20T10:05:00Z', read: true },
    { id: 'm3', senderId: 'u1-coach', receiverId: 'u4-sarah', senderName: 'Coach Zack', text: 'Sarah, don\'t forget your low-carb day is tomorrow!', timestamp: '2026-02-22T14:00:00Z', read: false },
];

const MOCK_POSTS: Post[] = [
    {
        id: 'p1', authorId: 'u1-coach', authorName: 'Coach Zack', authorRole: 'coach',
        content: '💪 New video dropping this week on advanced carb cycling strategies. Stay tuned!',
        timestamp: '2026-02-23T09:00:00Z', likes: ['u3-community', 'u2-client'], comments: [
            { id: 'cm1', authorId: 'u3-community', authorName: 'Alex Community', content: 'Can\'t wait! 🔥', timestamp: '2026-02-23T09:15:00Z' }
        ]
    },
    {
        id: 'p2', authorId: 'u3-community', authorName: 'Alex Community', authorRole: 'community',
        content: 'Just finished watching the Progressive Overload video. Game changer! 🏋️‍♂️',
        timestamp: '2026-02-22T16:30:00Z', likes: ['u1-coach'], comments: []
    },
];

// --- localStorage helpers ---
const LS_KEYS = {
    clients: 'biozack_clients',
    weeks: 'biozack_weeks',
    videos: 'biozack_videos',
    categories: 'biozack_categories',
    workouts: 'biozack_workouts',
    workoutCategories: 'biozack_workout_categories',
    messages: 'biozack_messages',
    posts: 'biozack_posts',
};

function loadFromLS<T>(key: string, fallback: T): T {
    try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return fallback;
}

function saveToLS(key: string, data: any) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [clients, setClients] = useState<Client[]>(() => loadFromLS(LS_KEYS.clients, INITIAL_CLIENTS));
    const [weeks, setWeeks] = useState<Week[]>(() => loadFromLS(LS_KEYS.weeks, INITIAL_WEEKS));
    const [videos, setVideos] = useState<Video[]>(() => loadFromLS(LS_KEYS.videos, MOCK_VIDEOS));
    const [categories, setCategories] = useState<string[]>(() => loadFromLS(LS_KEYS.categories, INITIAL_CATEGORIES));
    const [workouts, setWorkouts] = useState<Workout[]>(() => {
        const stored = loadFromLS<Workout[]>(LS_KEYS.workouts, []);
        const userCreated = stored.filter(w => !w.id.startsWith('tp') && !w.id.startsWith('ul') && !w.id.startsWith('ppl') && !w.id.startsWith('bro') && !w.id.startsWith('str') && !w.id.startsWith('hc'));
        return [...MOCK_WORKOUTS, ...userCreated];
    });
    const [workoutCategories, setWorkoutCategories] = useState<string[]>(() => loadFromLS(LS_KEYS.workoutCategories, INITIAL_WORKOUT_CATEGORIES));
    const [messages, setMessages] = useState<Message[]>(() => loadFromLS(LS_KEYS.messages, MOCK_MESSAGES));
    const [posts, setPosts] = useState<Post[]>(() => loadFromLS(LS_KEYS.posts, MOCK_POSTS));
    const loading = false; // No async loading with localStorage

    // Persist
    useEffect(() => { saveToLS(LS_KEYS.clients, clients); }, [clients]);
    useEffect(() => { saveToLS(LS_KEYS.weeks, weeks); }, [weeks]);
    useEffect(() => { saveToLS(LS_KEYS.videos, videos); }, [videos]);
    useEffect(() => { saveToLS(LS_KEYS.categories, categories); }, [categories]);
    useEffect(() => { saveToLS(LS_KEYS.workouts, workouts); }, [workouts]);
    useEffect(() => { saveToLS(LS_KEYS.workoutCategories, workoutCategories); }, [workoutCategories]);
    useEffect(() => { saveToLS(LS_KEYS.messages, messages); }, [messages]);
    useEffect(() => { saveToLS(LS_KEYS.posts, posts); }, [posts]);

    const getClientWeeks = (clientId: string) => weeks.filter(w => w.clientId === clientId).sort((a, b) => a.weekNumber - b.weekNumber);

    const updateWeek = (weekId: string, updates: Partial<Week>) => {
        setWeeks(prev => prev.map(w => w.id === weekId ? { ...w, ...updates } : w));
    };

    const updateClient = (clientId: string, updates: Partial<Client>) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    };

    const cascadeTargets = (clientId: string, startWeekNum: number, newTargets: { highCarb: MacroTarget, lowCarb: MacroTarget }) => {
        setWeeks(prev => prev.map(w => (w.clientId === clientId && w.weekNumber >= startWeekNum) ? { ...w, activeTargets: newTargets } : w));
    };

    const advanceWeek = (clientId: string, reviewedWeekNum: number) => {
        setWeeks(prev => prev.map(w => {
            if (w.clientId === clientId && w.weekNumber === reviewedWeekNum) return { ...w, status: 'locked' as const };
            if (w.clientId === clientId && w.weekNumber === reviewedWeekNum + 1 && w.status !== 'locked') return { ...w, status: 'pending' as const };
            return w;
        }));
        setClients(prev => prev.map(c => (c.id === clientId && c.currentWeek === reviewedWeekNum)
            ? { ...c, currentWeek: Math.min(reviewedWeekNum + 1, c.programLength), needsReview: false }
            : c
        ));
    };

    const assignWorkout = (weekId: string, workoutId: string) => {
        setWeeks(prev => prev.map(w => {
            if (w.id === weekId) {
                const existing = w.assignedWorkoutIds || [];
                if (!existing.includes(workoutId)) return { ...w, assignedWorkoutIds: [...existing, workoutId] };
            }
            return w;
        }));
    };

    const unassignWorkout = (weekId: string, workoutId: string) => {
        setWeeks(prev => prev.map(w => {
            if (w.id === weekId) return { ...w, assignedWorkoutIds: (w.assignedWorkoutIds || []).filter(id => id !== workoutId) };
            return w;
        }));
    };

    const completeOnboarding = (clientId: string, initialData: any) => {
        const week0: Week = {
            id: `${clientId}-w0`,
            clientId,
            weekNumber: 0,
            status: 'submitted',
            activeTargets: { ...DEFAULT_TARGETS },
            dailyEntries: Array.from({ length: 7 }, () => ({ date: '' })),
            coachFeedback: '',
        };
        setWeeks(prev => {
            const without = prev.filter(w => !(w.clientId === clientId && w.weekNumber === 0));
            return [...without, week0];
        });
        updateClient(clientId, { isOnboarding: false, intakeData: { ...initialData, submittedAt: new Date().toISOString() }, currentWeek: 0, needsReview: true });
    };

    const createProgram = (clientId: string, initialTargets: { highCarb: MacroTarget, lowCarb: MacroTarget }) => {
        const client = clients.find(c => c.id === clientId);
        const programLength = client?.programLength || 12;
        const newWeeks = generateWeeksForClient(clientId, programLength);
        newWeeks[0].activeTargets = initialTargets;
        newWeeks[0].status = 'pending';
        setWeeks(prev => [...prev, ...newWeeks]);
        updateClient(clientId, { currentWeek: 1, needsReview: false });
    };

    const addVideo = (video: Omit<Video, 'id'>) => setVideos(prev => [...prev, { ...video, id: `v${Date.now()}` }]);
    const addCategory = (category: string) => { if (!categories.includes(category)) setCategories(prev => [...prev, category]); };
    const addClient = (client: Omit<Client, 'id'>) => setClients(prev => [...prev, { ...client, id: `c${Date.now()}` }]);
    const removeClient = (clientId: string) => { setClients(prev => prev.filter(c => c.id !== clientId)); setWeeks(prev => prev.filter(w => w.clientId !== clientId)); };

    const addWorkout = (workout: Omit<Workout, 'id' | 'createdAt'>) => setWorkouts(prev => [...prev, { ...workout, id: `w${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }]);
    const updateWorkout = (workoutId: string, updates: Partial<Workout>) => setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, ...updates } : w));
    const removeWorkout = (workoutId: string) => setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    const addWorkoutCategory = (category: string) => { if (!workoutCategories.includes(category)) setWorkoutCategories(prev => [...prev, category]); };

    // --- Messaging ---
    const sendMessage = (senderId: string, receiverId: string, senderName: string, text: string) => {
        const msg: Message = { id: `msg${Date.now()}`, senderId, receiverId, senderName, text, timestamp: new Date().toISOString(), read: false };
        setMessages(prev => [...prev, msg]);
    };

    const markMessagesRead = (userId: string, otherUserId: string) => {
        setMessages(prev => prev.map(m => (m.receiverId === userId && m.senderId === otherUserId && !m.read) ? { ...m, read: true } : m));
    };

    const getConversation = (userId1: string, userId2: string) => {
        return messages
            .filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };

    const getUnreadCount = (userId: string) => messages.filter(m => m.receiverId === userId && !m.read).length;

    // --- Community ---
    const addPost = (authorId: string, authorName: string, authorRole: string, content: string) => {
        const post: Post = { id: `post${Date.now()}`, authorId, authorName, authorRole: authorRole as any, content, timestamp: new Date().toISOString(), likes: [], comments: [] };
        setPosts(prev => [post, ...prev]);
    };

    const likePost = (postId: string, userId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const liked = p.likes.includes(userId);
                return { ...p, likes: liked ? p.likes.filter(id => id !== userId) : [...p.likes, userId] };
            }
            return p;
        }));
    };

    const addComment = (postId: string, authorId: string, authorName: string, content: string) => {
        const comment: Comment = { id: `cm${Date.now()}`, authorId, authorName, content, timestamp: new Date().toISOString() };
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
    };

    return (
        <DataContext.Provider value={{
            clients, weeks, videos, categories, workouts, workoutCategories, messages, posts, loading,
            getClientWeeks, updateWeek, updateClient, cascadeTargets,
            completeOnboarding, createProgram, advanceWeek,
            assignWorkout, unassignWorkout,
            addVideo, addCategory, addClient, removeClient,
            addWorkout, updateWorkout, removeWorkout, addWorkoutCategory,
            sendMessage, markMessagesRead, getConversation, getUnreadCount,
            addPost, likePost, addComment,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
