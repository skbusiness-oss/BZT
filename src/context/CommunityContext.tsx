import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query,
  addDoc, updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { awardXp, XP_SOURCE } from '../lib/activityScore';
import { useAuth } from './AuthContext';
import { Post, Comment } from '../types';
import { rateLimits, validateText } from '../lib/validation';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

export interface CommunityContextType {
  posts: Post[];
  loading: boolean;
  addPost: (authorId: string, authorName: string, authorRole: string, content: string) => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, authorId: string, authorName: string, content: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Load posts WITHOUT eagerly loading all comments (lazy-load instead)
    const unsub = onSnapshot(
      query(collection(db, 'posts')),
      (snap) => {
        const loaded = snap.docs.map((d) => {
          const post = docToObj<Post>(d);
          // Preserve already-loaded comments if we have them
          const existing = posts.find((p) => p.id === post.id);
          if (existing?.comments?.length) {
            post.comments = existing.comments;
          } else {
            post.comments = [];
          }
          return post;
        });
        setPosts(loaded.sort((a, b) =>
          ((b.timestamp as unknown as { seconds: number })?.seconds || 0) -
          ((a.timestamp as unknown as { seconds: number })?.seconds || 0)
        ));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.id]);

  // Lazy-load comments for a specific post
  const loadComments = useCallback(async (postId: string) => {
    const commentsSnap = await getDocs(collection(db, 'posts', postId, 'comments'));
    const comments = commentsSnap.docs
      .map((c) => docToObj<Comment>(c))
      .sort((a, b) =>
        ((a.timestamp as unknown as { seconds: number })?.seconds || 0) -
        ((b.timestamp as unknown as { seconds: number })?.seconds || 0)
      );

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments } : p))
    );
  }, []);

  const addPost = async (authorId: string, authorName: string, authorRole: string, content: string) => {
    // Rate limit: 5 posts per 10 minutes
    if (!rateLimits.post(authorId)) {
      throw new Error('You are posting too frequently. Please wait a few minutes.');
    }
    const err = validateText(content, { min: 1, max: 5000 });
    if (err) throw new Error(err);

    const ref = await addDoc(collection(db, 'posts'), {
      authorId, authorName, authorRole,
      content: content.trim(),
      timestamp: serverTimestamp(),
      likes: [],
      commentCount: 0,
    });
    // Idempotent — one POST award per post id.
    await awardXp(authorId, XP_SOURCE.POST, ref.id);
  };

  const likePost = async (postId: string, userId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.likes.includes(userId);
    await updateDoc(doc(db, 'posts', postId), {
      likes: liked ? post.likes.filter((id) => id !== userId) : [...post.likes, userId],
    });
  };

  const addComment = async (postId: string, authorId: string, authorName: string, content: string) => {
    // Rate limit: 20 comments per 10 minutes
    if (!rateLimits.comment(authorId)) {
      throw new Error('You are commenting too frequently. Please wait a moment.');
    }
    const err = validateText(content, { min: 1, max: 1000 });
    if (err) throw new Error(err);

    const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId, authorName,
      content: content.trim(),
      timestamp: serverTimestamp(),
    });
    // commentCount is maintained server-side by the onCommentCreated trigger
    // (functions/src/maintainCommentCount.ts) — clients can no longer write
    // it (the firestore.rules posts.update rule rejects non-author writes
    // outside of the precise like-toggle path). The post's onSnapshot picks
    // up the new count within ~1s.
    await loadComments(postId);
    // Idempotent — one COMMENT award per comment id.
    await awardXp(authorId, XP_SOURCE.COMMENT, `${postId}/${commentRef.id}`);
  };

  return (
    <CommunityContext.Provider value={{ posts, loading, addPost, likePost, addComment, loadComments }}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
};
