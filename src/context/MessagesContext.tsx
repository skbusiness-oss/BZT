import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where,
  addDoc, updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Message } from '../types';
import { rateLimits, validateImageFile, validateText } from '../lib/validation';
import { tsToMillis } from '../lib/firestoreTime';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

export interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (senderId: string, receiverId: string, senderName: string, text: string, imageFile?: File | null) => Promise<void>;
  markMessagesRead: (userId: string, otherUserId: string) => Promise<void>;
  getConversation: (userId1: string, userId2: string) => Message[];
  getUnreadCount: (userId: string) => number;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubs: (() => void)[] = [];

    const sortMessages = (msgs: Message[]) =>
      msgs.sort((a, b) => tsToMillis(a.timestamp) - tsToMillis(b.timestamp));

    const HARDCODED_COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3';
    const isStaff = user?.role === 'coach'
                 || user?.role === 'admin'
                 || currentUserId === HARDCODED_COACH_UID;

    if (isStaff) {
      unsubs.push(onSnapshot(
        collection(db, 'messages'),
        (snap) => {
          setMessages(sortMessages(snap.docs.map((d) => docToObj<Message>(d))));
          setLoading(false);
        },
        (err) => {
          // eslint-disable-next-line no-console
          console.error('[MessagesContext] allMessages listener failed:', (err as { code?: string })?.code ?? '(no code)', err);
          setMessages([]);
          setLoading(false);
        }
      ));
      return () => unsubs.forEach((u) => u());
    }

    let listenersReady = 0;
    const checkReady = () => { if (++listenersReady >= 2) setLoading(false); };

    const msgsAsSender = query(collection(db, 'messages'), where('senderId', '==', currentUserId));
    const msgsAsReceiver = query(collection(db, 'messages'), where('receiverId', '==', currentUserId));

    unsubs.push(onSnapshot(
      msgsAsSender,
      (snap) => {
        const sent = snap.docs.map((d) => docToObj<Message>(d));
        setMessages((prev) => {
          const received = prev.filter((m) => m.receiverId === currentUserId);
          return sortMessages([...received, ...sent]);
        });
        checkReady();
      },
      // Previously silent: a permission-denied here left `messages`
      // empty with zero console output, so the coach "saw no messages"
      // with no way to diagnose. Now logged with the Firestore error
      // code so it's actionable from DevTools.
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[MessagesContext] msgsAsSender listener failed:', (err as { code?: string })?.code ?? '(no code)', err);
        checkReady();
      }
    ));

    unsubs.push(onSnapshot(
      msgsAsReceiver,
      (snap) => {
        const received = snap.docs.map((d) => docToObj<Message>(d));
        setMessages((prev) => {
          const sent = prev.filter((m) => m.senderId === currentUserId);
          return sortMessages([...sent, ...received]);
        });
        checkReady();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[MessagesContext] msgsAsReceiver listener failed:', (err as { code?: string })?.code ?? '(no code)', err);
        checkReady();
      }
    ));

    return () => unsubs.forEach((u) => u());
  }, [currentUserId, user?.role]);

  // FCM and the service worker own background notifications. This
  // context only writes messages and unread state, so historical
  // messages do not replay as local browser notifications on hydration.
  const sendMessage = async (senderId: string, receiverId: string, senderName: string, text: string, imageFile?: File | null) => {
    // Client-side rate limit: 10 messages/minute
    if (!rateLimits.message(senderId)) {
      throw new Error('You are sending messages too fast. Please wait a moment.');
    }
    const trimmed = text.trim();
    const hasImage = !!imageFile;
    const err = validateText(trimmed, { min: hasImage ? 0 : 1, max: 2000 });
    if (err) throw new Error(err);

    let imagePayload: Partial<Message> = {};
    if (imageFile) {
      const imageErr = validateImageFile(imageFile);
      if (imageErr) throw new Error(imageErr);
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'image/heif': 'heif',
      };
      const ext = mimeToExt[imageFile.type] ?? 'jpg';
      const path = `chat-images/${senderId}/to/${receiverId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const snapshot = await uploadBytes(ref(storage, path), imageFile, { contentType: imageFile.type || `image/${ext}` });
      imagePayload = {
        imageUrl: await getDownloadURL(snapshot.ref),
        imagePath: path,
        imageName: imageFile.name,
        imageType: imageFile.type,
        imageSize: imageFile.size,
      };
    }

    await addDoc(collection(db, 'messages'), {
      senderId, receiverId, senderName,
      text: trimmed,
      ...imagePayload,
      timestamp: serverTimestamp(),
      read: false,
    });
  };

  const markMessagesRead = useCallback(async (userId: string, otherUserId: string) => {
    const unread = messages.filter((m) => m.receiverId === userId && m.senderId === otherUserId && !m.read);
    await Promise.all(unread.map((m) => updateDoc(doc(db, 'messages', m.id), { read: true })));
  }, [messages]);

  const getConversation = useCallback((userId1: string, userId2: string): Message[] =>
    messages
      .filter((m) => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1))
      .sort((a, b) => tsToMillis(a.timestamp) - tsToMillis(b.timestamp)),
    [messages]
  );

  const getUnreadCount = useCallback((userId: string): number =>
    messages.filter((m) => m.receiverId === userId && !m.read).length,
    [messages]
  );

  return (
    <MessagesContext.Provider value={{ messages, loading, sendMessage, markMessagesRead, getConversation, getUnreadCount }}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
};
