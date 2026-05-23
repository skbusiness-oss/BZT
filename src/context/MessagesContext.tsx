import {
  createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
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
import { compressImageIfNeeded } from '../lib/imageCompression';
import { tsToMillis } from '../lib/firestoreTime';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

function docToObj<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

export interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (senderId: string, receiverId: string, senderName: string, text: string, imageFile?: File | null, replyTo?: Message['replyTo']) => Promise<void>;
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

  // ── Foreground notification fallback ────────────────────────────────
  // When a new incoming message lands in the Firestore listener and the
  // user is NOT actively viewing the messages page, fire a local
  // Notification directly. This is a defense-in-depth path that
  // bypasses FCM entirely — so when the Cloud Function's FCM call fails
  // (mismatched-credential / IAM denial / stale tokens), the user still
  // gets a popup if they have the app open in a tab.
  //
  // What this does NOT cover:
  //   - App fully closed → still depends on FCM (only the SW can wake)
  //   - Permission denied → silently skip (no popup ever)
  //   - On /messages page already → suppress (live thread already paints)
  //
  // Anti-replay design (the critical bit):
  //   The earlier version had a "first-snapshot guard" — it populated
  //   the seen-id set on the first effect run and assumed historical
  //   messages were thereby silenced. That was wrong: the listener
  //   hydrates asynchronously, so the first effect run could fire
  //   with messages=[] (seen-set empty), and THEN the listener would
  //   land 50 historical messages → all 50 looked "fresh" and replayed
  //   as notifications on every page refresh.
  //
  //   Fix: TWO gates layered.
  //     a) `loading` from MessagesContext stays true until BOTH per-user
  //        listeners are ready (staff listener also flips it false on
  //        first snapshot). We don't notify at all while loading=true,
  //        and we mark hydrationCompletedAtRef the moment loading
  //        flips false. This silences all messages loaded during
  //        initial hydration.
  //     b) Recency window: only notify if `timestamp` is within the
  //        last 60 seconds. This handles the edge case where a stale
  //        snapshot delta arrives after hydration (a reconnect refill,
  //        a queue replay) — historical messages have old timestamps
  //        and get filtered. Genuine new messages from "right now"
  //        have current timestamps and fire normally.
  //
  //   The seen-id set still exists as a third layer to dedup repeat
  //   snapshot fires of the SAME message id (e.g., pending → server-
  //   stamped write of the same doc), with per-message tag at the OS
  //   level as a fourth safety net.
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const hydrationCompletedAtRef = useRef<number | null>(null);
  const prevLoadingRef = useRef<boolean>(true);
  useEffect(() => {
    // Reset on user change or sign-out.
    if (!currentUserId) {
      seenMessageIdsRef.current = new Set();
      hydrationCompletedAtRef.current = null;
      prevLoadingRef.current = true;
      return;
    }

    // Track the loading→ready transition. The first time loading flips
    // from true to false, hydration just finished — snapshot the
    // current message IDs into seen and stamp the wall clock. Don't
    // fire notifications on this transition.
    if (prevLoadingRef.current && !loading) {
      seenMessageIdsRef.current = new Set(messages.map((m) => m.id));
      hydrationCompletedAtRef.current = Date.now();
      prevLoadingRef.current = false;
      return;
    }
    prevLoadingRef.current = loading;

    // Never notify while still hydrating. The transition handler above
    // will populate the seen set as soon as hydration completes.
    if (loading || hydrationCompletedAtRef.current === null) return;

    const seen = seenMessageIdsRef.current;
    const fresh = messages.filter((m) => !seen.has(m.id));
    if (fresh.length === 0) return;
    fresh.forEach((m) => seen.add(m.id));

    // Only notify for messages INTO this user (not their own sends).
    const now = Date.now();
    const incoming = fresh.filter((m) => {
      if (m.receiverId !== currentUserId) return false;
      if (m.senderId === currentUserId) return false;
      // Recency filter: skip anything older than 60 seconds. Catches
      // the case where a reconnect / cache refill lands a batch of
      // already-read or already-seen messages that bypassed the
      // hydration gate (e.g., the user has the tab open during a
      // network blip and Firestore replays on recovery).
      const ts = tsToMillis(m.timestamp);
      if (!ts) return false;
      if (now - ts > 60_000) return false;
      return true;
    });
    if (incoming.length === 0) return;

    // Permission gate.
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    // Suppress if user is already on /messages — the live thread is
    // already rendering, no popup needed.
    try {
      if (window.location.pathname.startsWith('/messages')) return;
    } catch {
      // SSR / worker context — proceed.
    }

    // SW path for consistent click handling; page-level fallback if SW
    // isn't registered yet.
    const showLocal = async () => {
      let swRegistration: ServiceWorkerRegistration | undefined;
      try {
        if ('serviceWorker' in navigator) {
          swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').catch(() => undefined);
        }
      } catch {
        // ignore
      }
      for (const m of incoming) {
        const title = `New message from ${m.senderName || 'Coach'}`;
        const body = m.text
          ? (m.text.length > 140 ? m.text.slice(0, 137) + '...' : m.text)
          : (m.imageUrl ? 'Sent you a photo.' : 'Sent you a message.');
        const url = `/messages?to=${m.senderId}`;
        const options: NotificationOptions = {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: m.id,
          data: { url },
        };
        try {
          if (swRegistration && 'showNotification' in swRegistration) {
            await swRegistration.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        } catch {
          // Some browsers throw if too many notifications stack quickly.
        }
      }
    };
    void showLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentUserId, loading]);

  // FCM and the service worker own BACKGROUND notifications (app closed).
  // The effect above handles foreground delivery as a defense-in-depth
  // fallback so users see new messages even when FCM is failing.
  const sendMessage = async (senderId: string, receiverId: string, senderName: string, text: string, imageFile?: File | null, replyTo?: Message['replyTo']) => {
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
      // Compress phone-camera originals to a reasonable max edge before
      // upload. Cuts a typical 6MB iPhone photo to ~300KB and saves
      // the receiver an equivalent download. Bypasses if the file is
      // already small or in a format the canvas can't decode (e.g.,
      // HEIC on Chrome) — see src/lib/imageCompression.ts.
      const uploadFile = await compressImageIfNeeded(imageFile);
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'image/heif': 'heif',
      };
      const ext = mimeToExt[uploadFile.type] ?? 'jpg';
      const path = `chat-images/${senderId}/to/${receiverId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const snapshot = await uploadBytes(ref(storage, path), uploadFile, { contentType: uploadFile.type || `image/${ext}` });
      imagePayload = {
        imageUrl: await getDownloadURL(snapshot.ref),
        imagePath: path,
        imageName: imageFile.name, // keep the user-facing name
        imageType: uploadFile.type,
        imageSize: uploadFile.size,
      };
    }

    await addDoc(collection(db, 'messages'), {
      senderId, receiverId, senderName,
      text: trimmed,
      ...imagePayload,
      // Only attach `replyTo` if the user actually picked a message
      // to quote — Firestore can't store `undefined`, and writing
      // null on every send wastes a field. The Message type marks it
      // optional, so consumers handle absence cleanly.
      ...(replyTo ? { replyTo } : {}),
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
