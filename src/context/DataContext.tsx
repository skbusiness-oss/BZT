// DataContext.tsx
// Thin composition layer — delegates to domain-specific contexts
// Keeps useData() backward-compatible so existing components don't break
// For better performance, components can import useCoaching/useMessages/useCommunity/useMedia directly

import { createContext, useContext, ReactNode } from 'react';
import { CoachingProvider, useCoaching } from './CoachingContext';
import { MessagesProvider, useMessages } from './MessagesContext';
import { CommunityProvider, useCommunity } from './CommunityContext';
import { MediaProvider, useMedia } from './MediaContext';
import { AcademyProvider } from './AcademyContext';
import { Client, LibraryTag, MacroTargets, Message, Post, Video, Week, Workout } from '../types';

// ─── Combined type for backward compatibility ────────────────────────────────

interface DataContextType {
  clients: Client[];
  weeks: Week[];
  videos: Video[];
  categories: string[];
  libraryTags: LibraryTag[];
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
    newTargets: MacroTargets
  ) => Promise<void>;
  completeOnboarding: (clientId: string, initialData: Record<string, string>, photos?: { front?: string; side?: string; back?: string }) => Promise<void>;
  createProgram: (
    clientId: string,
    initialTargets: MacroTargets
  ) => Promise<void>;
  advanceWeek: (clientId: string, reviewedWeekNum: number) => Promise<void>;
  addVideo: (video: Omit<Video, 'id'>) => Promise<void>;
  updateVideo: (videoId: string, updates: Partial<Video>) => Promise<void>;
  removeVideo: (videoId: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>, uid: string) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkout: (workoutId: string, updates: Partial<Workout>) => Promise<void>;
  removeWorkout: (workoutId: string) => Promise<void>;
  addWorkoutCategory: (category: string) => Promise<void>;
  uploadPhoto: (file: File, userId: string, weekNumber: number) => Promise<string>;
  uploadVideoPdf: (file: File, videoId: string) => Promise<{ name: string; url: string }>;
  removeVideoPdf: (videoId: string, pdfUrl: string) => Promise<void>;
  extendProgram: (clientId: string, additionalWeeks: number, targets: MacroTargets) => Promise<void>;

  sendMessage: (senderId: string, receiverId: string, senderName: string, text: string, imageFile?: File | null, replyTo?: Message['replyTo']) => Promise<void>;
  markMessagesRead: (userId: string, otherUserId: string) => Promise<void>;
  getConversation: (userId1: string, userId2: string) => Message[];
  getUnreadCount: (userId: string) => number;

  addPost: (authorId: string, authorName: string, authorRole: string, content: string) => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, authorId: string, authorName: string, content: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Inner component that assembles the combined context from sub-contexts
const DataBridge = ({ children }: { children: ReactNode }) => {
  const coaching = useCoaching();
  const msgs = useMessages();
  const community = useCommunity();
  const media = useMedia();

  const combined: DataContextType = {
    // Coaching
    clients: coaching.clients,
    weeks: coaching.weeks,
    getClientWeeks: coaching.getClientWeeks,
    updateWeek: coaching.updateWeek,
    updateClient: coaching.updateClient,
    cascadeTargets: coaching.cascadeTargets,
    completeOnboarding: coaching.completeOnboarding,
    createProgram: coaching.createProgram,
    advanceWeek: coaching.advanceWeek,
    addClient: coaching.addClient,
    removeClient: coaching.removeClient,
    uploadPhoto: coaching.uploadPhoto,

    // Messages
    messages: msgs.messages,
    sendMessage: msgs.sendMessage,
    markMessagesRead: msgs.markMessagesRead,
    getConversation: msgs.getConversation,
    getUnreadCount: msgs.getUnreadCount,

    // Community
    posts: community.posts,
    addPost: community.addPost,
    likePost: community.likePost,
    addComment: community.addComment,
    loadComments: community.loadComments,

    // Media
    videos: media.videos,
    categories: media.categories,
    libraryTags: media.libraryTags,
    workouts: media.workouts,
    workoutCategories: media.workoutCategories,
    addVideo: media.addVideo,
    updateVideo: media.updateVideo,
    removeVideo: media.removeVideo,
    addCategory: media.addCategory,
    renameCategory: media.renameCategory,
    removeCategory: media.removeCategory,
    addWorkout: media.addWorkout,
    updateWorkout: media.updateWorkout,
    removeWorkout: media.removeWorkout,
    addWorkoutCategory: media.addWorkoutCategory,
    uploadVideoPdf: media.uploadVideoPdf,
    removeVideoPdf: media.removeVideoPdf,

    // Coaching extras
    extendProgram: coaching.extendProgram,

    // Combined loading state
    loading: coaching.loading || msgs.loading || community.loading || media.loading,
  };

  return (
    <DataContext.Provider value={combined}>
      {children}
    </DataContext.Provider>
  );
};

// ─── Provider (wraps all sub-providers) ──────────────────────────────────────

export const DataProvider = ({ children }: { children: ReactNode }) => (
  <CoachingProvider>
    <MessagesProvider>
      <CommunityProvider>
        <MediaProvider>
          <AcademyProvider>
            <DataBridge>{children}</DataBridge>
          </AcademyProvider>
        </MediaProvider>
      </CommunityProvider>
    </MessagesProvider>
  </CoachingProvider>
);

// ─── Hooks ───────────────────────────────────────────────────────────────────
// useData() — backward compatible, pulls from all contexts
// For better performance, use the domain-specific hooks directly:
//   useCoaching(), useMessages(), useCommunity(), useMedia()

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};

// Re-export domain hooks for direct use
export { useCoaching } from './CoachingContext';
export { useMessages } from './MessagesContext';
export { useCommunity } from './CommunityContext';
export { useMedia } from './MediaContext';
