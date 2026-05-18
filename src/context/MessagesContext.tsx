import {
  createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
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
import { rateLimits, validateText } from '../lib/validation';
import { tsToMillis } from '../lib/firestoreTime';
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
      msgs.sort((a, b) => tsToMillis(a.timestamp) - tsToMillis(b.timestamp));

    const msgsAsSender = query(collection(db, 'messages'), where('senderId', '==', user.id));
    const msgsAsReceiver = query(collection(db, 'messages'), where('receiverId', '==', user.id));

    unsubs.push(onSnapshot(
      msgsAsSender,
      (snap) => {
        const sent = snap.docs.map((d) => docToObj<Message>(d));
        setMessages((prev) => {
          const received = prev.filter((m) => m.receiverId === user.id);
          return sortMessages([...received, ...sent]);
        });
        checkReady();
      },
      // Previously silent — a permission-denied here left `messages`
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
          const sent = prev.filter((m) => m.senderId === user.id);
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
  }, [user?.id]);

  // ── Browser notifications on new incoming messages ─────────────────────
  // The sidebar nav already shows an unread count badge (via
  // getUnreadCount), but that requires the user to actually look at the
  // sidebar. A browser Notification fires regardless of which tab/page
  // they're on — even when the app isn't focused. Standard chat UX.
  //
  // We track the previously-seen message IDs in a ref so each render
  // can detect deltas without re-firing for messages already shown.
  // First render is suppressed (the ref starts empty and we populate
  // it without notifying) so historical inbox messages don't all fire
  // on initial sign-in.
  const seenMessageIdsRef = useRef<Set<string> | null>(null);
  const permissionRequestedRef = useRef(false);
  useEffect(() => {
    if (!user) {
      seenMessageIdsRef.current = null;
      return;
    }
    // First pass — record what was already there, do NOT notify.
    if (seenMessageIdsRef.current === null) {
      seenMessageIdsRef.current = new Set(messages.map(m => m.id));
      return;
    }
    // Subsequent passes — find deltas. Only incoming-to-this-user
    // messages count. Outgoing (senderId === self) and previously-seen
    // are skipped.
    const seen = seenMessageIdsRef.current;
    const fresh = messages.filter(
      m => !seen.has(m.id) && m.receiverId === user.id && m.senderId !== user.id,
    );
    fresh.forEach(m => seen.add(m.id));
    // Also catch IDs we may have skipped (e.g., own outbound) so they
    // don't fire on a later flip.
    messages.forEach(m => seen.add(m.id));

    if (fresh.length === 0) return;

    // Lazy permission request — only when there's something to notify
    // about. Avoids the "this site wants to send notifications" prompt
    // on every clean sign-in.
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const tryNotify = (m: Message) => {
      try {
        const title = m.senderName ? `New message from ${m.senderName}` : 'New message';
        new Notification(title, {
          body: m.text.slice(0, 140),
          tag: m.id, // dedup so the same id only fires once
          icon: '/icon-192.png',
        });
      } catch {
        // Notification constructor can throw on iOS Safari, etc.
        // Silent — the sidebar badge is the fallback.
      }
    };

    if (Notification.permission === 'granted') {
      fresh.forEach(tryNotify);
    } else if (Notification.permission === 'default' && !permissionRequestedRef.current) {
      permissionRequestedRef.current = true;
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') fresh.forEach(tryNotify);
      }).catch(() => { /* user dismissed */ });
    }
    // 'denied' — respect the user's choice, no further prompts.
  }, [messages, user]);

  const sendMessage = async (senderId: string, receiverId: string, senderName: string, text: string) => {
    // Client-side rate limit: 10 messages/minute
    if (!rateLimits.message(senderId)) {
      throw new Error('You are sending messages too fast. Please wait a moment.');
    }
    // Validate content before writing
    const err = validateText(text, { min: 1, max: 2000 });
    if (err) throw new Error(err);

    await addDoc(collection(db, 'messages'), {
      senderId, receiverId, senderName,
      text: text.trim(),
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
