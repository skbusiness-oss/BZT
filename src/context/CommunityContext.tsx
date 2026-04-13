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
import { useAuth } from './AuthContext';
import { Post, Comment } from '../types';
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
    await addDoc(collection(db, 'posts'), {
      authorId, authorName, authorRole, content,
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
      likes: liked ? post.likes.filter((id) => id !== userId) : [...post.likes, userId],
    });
  };

  const addComment = async (postId: string, authorId: string, authorName: string, content: string) => {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      authorId, authorName, content,
      timestamp: serverTimestamp(),
    });
    const post = posts.find((p) => p.id === postId);
    if (post) {
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: (post.commentCount ?? post.comments?.length ?? 0) + 1,
      });
    }
    // Reload comments for this post
    await loadComments(postId);
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
