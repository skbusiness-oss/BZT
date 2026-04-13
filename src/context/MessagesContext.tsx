import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import {
  collection, doc,
  onSnapshot, query, where,
  addDoc, updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Message } from '../types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

export interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (senderId: string, receiverId: string, senderName: string, text: string) => Promise<void>;
  markMessagesRead: (userId: string, otherUserId: string) => Promise<void>;
  getConversation: (userId1: string, userId2: string) => Message[];
  getUnreadCount: (userId: string) => number;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsubs: (() => void)[] = [];
    let listenersReady = 0;
    const checkReady = () => { if (++listenersReady >= 2) setLoading(false); };

    const sortMessages = (msgs: Message[]) =>
      msgs.sort((a, b) => ((a.timestamp as unknown as { seconds: number })?.seconds || 0) - ((b.timestamp as unknown as { seconds: number })?.seconds || 0));

    const msgsAsSender = query(collection(db, 'messages'), where('senderId', '==', user.id));
    const msgsAsReceiver = query(collection(db, 'messages'), where('receiverId', '==', user.id));

    unsubs.push(onSnapshot(msgsAsSender, (snap) => {
      const sent = snap.docs.map((d) => docToObj<Message>(d));
      setMessages((prev) => {
        const received = prev.filter((m) => m.receiverId === user.id);
        return sortMessages([...received, ...sent]);
      });
      checkReady();
    }));

    unsubs.push(onSnapshot(msgsAsReceiver, (snap) => {
      const received = snap.docs.map((d) => docToObj<Message>(d));
      setMessages((prev) => {
        const sent = prev.filter((m) => m.senderId === user.id);
        return sortMessages([...sent, ...received]);
      });
      checkReady();
    }));

    return () => unsubs.forEach((u) => u());
  }, [user?.id]);

  const sendMessage = async (senderId: string, receiverId: string, senderName: string, text: string) => {
    await addDoc(collection(db, 'messages'), {
      senderId, receiverId, senderName, text,
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
      .sort((a, b) => new Date(a.timestamp as unknown as string).getTime() - new Date(b.timestamp as unknown as string).getTime()),
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
