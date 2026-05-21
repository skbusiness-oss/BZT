import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, MessageSquare, ArrowLeft, ImagePlus, X, Loader2 } from 'lucide-react';
import { tsToDate, tsToMillis } from '../lib/firestoreTime';

export const Messages = () => {
    const { user } = useAuth();
    // getConversation intentionally NOT destructured here — we use a
    // staff-aware local filter (conversationBetween) so a client viewing
    // "Coach Zaki" also sees their pre-fix admin history, and so the
    // coach sees every message involving the selected client regardless
    // of which staff UID was the recipient.
    const { clients, messages, sendMessage, markMessagesRead } = useData();
    const { t, isRTL } = useLanguage();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hardcoded coach UID also forces isCoach=true as a defensive anchor
    // so Coach Zaki sees the coach inbox even if the role lookup is stale.
    const HARDCODED_COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3';
    const isCoach = user?.role === 'coach'
                 || user?.role === 'admin'
                 || user?.id === HARDCODED_COACH_UID;
    const userId = user?.id;

    // ── Sole-coach routing ──────────────────────────────────────────────
    // For the single-coach launch (Coach Zaki, medzakc90@gmail.com), every
    // client / community message is addressed to him directly. Previously
    // this lookup queried publicProfiles for `role in [coach, admin]` and
    // built a multi-tile contact list — that surfaced the admin as a
    // selectable recipient AND auto-selected admin when the publicProfiles
    // sort didn't put coach first. New design: hardcode the coach UID,
    // skip the lookup entirely, never show admin as a target.
    //
    // Why hardcoded vs config: this is a launch-day fix for a single-
    // coach product. When a second coach joins, replace the constant
    // with a server-driven team list (probably a `teams/default` doc
    // with allow-read for signed-in users).
    const COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3';
    const LEGACY_ADMIN_UID = 'ITc4VlP0PNeNUetjNxpEyGJOpW32';
    const COACH_NAME = 'Coach Zaki';
    // Treated as a single staff identity for thread aggregation. New
    // sends always go to COACH_UID; LEGACY_ADMIN_UID stays in the set so
    // clients can scroll back through pre-fix admin history. Coach Zaki's
    // staff inbox can also see that history directly.
    const STAFF_UIDS = useMemo(() => new Set<string>([COACH_UID, LEGACY_ADMIN_UID]), []);
    const isStaffUid = (uid: string) => STAFF_UIDS.has(uid);
    interface TeamMember { uid: string; name: string; role: 'coach' | 'admin' }
    const [teamMembers] = useState<TeamMember[]>([
        { uid: COACH_UID, name: COACH_NAME, role: 'coach' },
    ]);

    // Local thread filter, replacing the context's getConversation.
    // - Coach view: show every message where the OTHER party is `otherId`,
    //   including legacy admin-addressed history from the staff inbox.
    // - Client view (other === COACH_UID): show every message between the
    //   client and any staff member (coach or legacy admin).
    // - Default: original pairwise filter.
    const conversationBetween = useMemo(() => (selfId: string, otherId: string) => {
        if (isCoach) {
            return messages
                .filter(message => message.senderId === otherId || message.receiverId === otherId)
                .sort((a, b) => tsToMillis(a.timestamp) - tsToMillis(b.timestamp));
        }
        if (isStaffUid(otherId)) {
            return messages
                .filter(message =>
                    (message.senderId === selfId && isStaffUid(message.receiverId))
                    || (isStaffUid(message.senderId) && message.receiverId === selfId)
                )
                .sort((a, b) => tsToMillis(a.timestamp) - tsToMillis(b.timestamp));
        }
        return messages
            .filter(message =>
                (message.senderId === selfId && message.receiverId === otherId)
                || (message.senderId === otherId && message.receiverId === selfId)
            )
            .sort((a, b) => tsToMillis(a.timestamp) - tsToMillis(b.timestamp));
    // STAFF_UIDS is referenced via isStaffUid; intentionally omitted from
    // deps because the set is constructed in this component and stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, isCoach]);

    const counterpartIds = useMemo(() => {
        if (!userId) return [];
        const ids = new Set<string>();
        if (isCoach) {
            // Coach sees the staff inbox, so every non-staff party becomes
            // a counterpart even when the old staff side was the admin UID.
            messages.forEach(message => {
                if (message.senderId !== userId && !isStaffUid(message.senderId)) ids.add(message.senderId);
                if (message.receiverId !== userId && !isStaffUid(message.receiverId)) ids.add(message.receiverId);
            });
        } else {
            // Client / community: collapse any staff UID to COACH_UID so
            // the contact list shows ONE "Coach Zaki" tile even if the
            // user historically chatted with the admin too.
            messages.forEach(message => {
                if (message.senderId === userId) {
                    ids.add(isStaffUid(message.receiverId) ? COACH_UID : message.receiverId);
                }
                if (message.receiverId === userId) {
                    ids.add(isStaffUid(message.senderId) ? COACH_UID : message.senderId);
                }
            });
        }
        return Array.from(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, userId, isCoach]);

    const markThreadRead = useCallback((selfId: string, otherId: string) => {
        const senderIds = !isCoach && STAFF_UIDS.has(otherId)
            ? Array.from(STAFF_UIDS)
            : [otherId];
        senderIds.forEach(senderId => {
            void markMessagesRead(selfId, senderId);
        });
    }, [isCoach, markMessagesRead, STAFF_UIDS]);

    const latestCounterpartId = useMemo(() => {
        if (!userId) return null;
        const latest = [...messages]
            .filter(message => message.senderId === userId || message.receiverId === userId)
            .sort((a, b) => tsToMillis(b.timestamp) - tsToMillis(a.timestamp))[0];
        if (!latest) return null;
        const other = latest.senderId === userId ? latest.receiverId : latest.senderId;
        // Non-coach: collapse legacy admin → coach so we don't auto-select
        // a thread keyed on the admin UID (which then sends new replies
        // there instead of to the coach).
        if (!isCoach && isStaffUid(other)) return COACH_UID;
        return other;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, userId, isCoach]);


    // Auto-select the coach for non-coach roles. clientDoc.coachId is
    // intentionally IGNORED here — historical docs may have it set to
    // the admin's uid (residue from the broken team-lookup era) and
    // honoring that would re-route messages away from the coach again.
    useEffect(() => {
        if (isCoach || !user || selectedUserId) return;
        const targetId = latestCounterpartId ?? COACH_UID;
        setSelectedUserId(targetId);
        markThreadRead(user.id, targetId);
    }, [isCoach, user, selectedUserId, latestCounterpartId, markThreadRead]);
    // Reference clientDoc to keep the type-checker quiet about an unused
    // computed value (kept because it's read by other features that may
    // need it; pulling it from useData here also warms the cache).

    // Deep-link support: `/messages?to=<userId>` pre-selects a conversation.
    // Used by the "Message client" button on CoachReview so a coach can jump
    // from a weekly review straight into the existing thread (no duplicate
    // threads — `getConversation(user.id, otherUserId)` finds the messages
    // either party already sent regardless of who initiated).
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const to = searchParams.get('to');
        if (to && isCoach) {
            setSelectedUserId(to);
        }
    }, [searchParams, isCoach]);

    // Scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUserId]);

    // Mark messages read when conversation is opened
    useEffect(() => {
        if (user && selectedUserId) {
            markThreadRead(user.id, selectedUserId);
        }
    }, [selectedUserId, user, messages.length, markThreadRead]);

    useEffect(() => {
        if (!selectedImage) {
            setImagePreview(null);
            return;
        }
        const nextPreview = URL.createObjectURL(selectedImage);
        setImagePreview(nextPreview);
        return () => URL.revokeObjectURL(nextPreview);
    }, [selectedImage]);

    // Conversation contacts.
    //   - Coach/admin: one contact per coaching client.
    //   - Client/community: one Coach Zaki contact.
    //     Legacy admin history is folded into that same tile, but new
    //     sends never target admin.
    const contacts = useMemo(() => {
        if (!user) return [];

        // Coach view: a contact tile for client X aggregates every message
        // involving X, regardless of which staff UID was on the other side.
        // Client view: the "Coach Zaki" tile aggregates every message
        // between the client and any staff member (COACH_UID or
        // LEGACY_ADMIN_UID).
        const matchesContact = (message: typeof messages[number], contactUid: string) => {
            if (isCoach) {
                return message.senderId === contactUid || message.receiverId === contactUid;
            }
            if (isStaffUid(contactUid)) {
                return (message.senderId === user.id && isStaffUid(message.receiverId))
                    || (isStaffUid(message.senderId) && message.receiverId === user.id);
            }
            return (message.senderId === user.id && message.receiverId === contactUid)
                || (message.senderId === contactUid && message.receiverId === user.id);
        };

        const lastMessageWith = (otherId: string) => [...messages]
            .filter(message => matchesContact(message, otherId))
            .sort((a, b) => tsToMillis(b.timestamp) - tsToMillis(a.timestamp))[0];

        // Unread is intentionally only counted when the CURRENT user is
        // the receiver — the receiver is the only party who can flip
        // `read` per the firestore rule, so any other count would be
        // forever-stuck. For coaches, this means messages still
        // addressed to LEGACY_ADMIN_UID won't show an unread badge until
        // consolidateMessagesToCoach runs, but they DO render in the
        // thread (see conversationBetween above).
        const unreadFrom = (otherId: string) => {
            if (isCoach) {
                return messages.filter(message =>
                    message.senderId === otherId
                    && message.receiverId === user.id
                    && !message.read
                ).length;
            }
            if (isStaffUid(otherId)) {
                return messages.filter(message =>
                    isStaffUid(message.senderId)
                    && message.receiverId === user.id
                    && !message.read
                ).length;
            }
            return messages.filter(message =>
                message.senderId === otherId
                && message.receiverId === user.id
                && !message.read
            ).length;
        };

        const sortContacts = <T extends { unread: number; lastMsg?: typeof messages[number] }>(items: T[]) =>
            items.sort((a, b) => {
                if (a.unread !== b.unread) return b.unread - a.unread;
                return tsToMillis(b.lastMsg?.timestamp) - tsToMillis(a.lastMsg?.timestamp);
            });

        if (isCoach) {
            const clientIds = new Set(clients.map(client => client.userId));
            const clientContacts = clients.map(client => ({
                userId: client.userId,
                name: client.name,
                unread: unreadFrom(client.userId),
                lastMsg: lastMessageWith(client.userId),
                category: client.category,
            }));
            const messageOnlyContacts = counterpartIds
                .filter(id => id !== user.id && !clientIds.has(id))
                .map(id => ({
                    userId: id,
                    name: 'Member',
                    unread: unreadFrom(id),
                    lastMsg: lastMessageWith(id),
                    category: 'message thread',
                }));

            return sortContacts([...clientContacts, ...messageOnlyContacts]);
        }

        const teamIds = new Set(teamMembers.map(member => member.uid));
        const teamContacts = teamMembers.map(member => ({
            userId: member.uid,
            name: member.name,
            unread: unreadFrom(member.uid),
            lastMsg: lastMessageWith(member.uid),
            category: member.role,
        }));
        const historicalContacts = counterpartIds
            // Skip the legacy admin UID — it was already collapsed into
            // COACH_UID by counterpartIds, so a separate tile would be a
            // duplicate of the team-member tile.
            .filter(id => !teamIds.has(id) && !isStaffUid(id))
            .map(id => ({
                userId: id,
                name: 'Coach / Support',
                unread: unreadFrom(id),
                lastMsg: lastMessageWith(id),
                category: 'coach',
            }));

        return sortContacts([...teamContacts, ...historicalContacts]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clients, counterpartIds, isCoach, messages, teamMembers, user]);

    if (!user) return null;

    const conversation = selectedUserId ? conversationBetween(user.id, selectedUserId) : [];

    const handleImageChange = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setSendError('Please choose an image file.');
            return;
        }
        setSendError(null);
        setSelectedImage(file);
    };

    const handleSend = async () => {
        if ((!text.trim() && !selectedImage) || !selectedUserId || sending) return;
        const body = text.trim();
        setSending(true);
        setSendError(null);
        try {
            await sendMessage(user.id, selectedUserId, user.name, body, selectedImage);
            setText('');
            setSelectedImage(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            const code = (err as { code?: string })?.code ?? '(no code)';
            const msg = err instanceof Error ? err.message : 'Failed to send.';
            setSendError(`[${code}] ${msg}`);
            // eslint-disable-next-line no-console
            console.error('[Messages.handleSend] failed:', code, err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts: unknown) => {
        // Firestore returns Timestamp objects from serverTimestamp() writes.
        // Pending writes appear as null on the writer's local snapshot
        // briefly — show a dash until the server stamp lands.
        // Locale matches the active language so Arabic users see Arabic
        // month names and Arabic-Indic digits in the timestamp row.
        const d = tsToDate(ts);
        if (!d) return '—';
        const locale = isRTL ? 'ar-EG' : 'en-US';
        return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + '، ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    // Resolve the displayed name from the contact list. Falls back to the
    // legacy "Your coach" label only when the contact list lookup misses.
    const selectedName = contacts.find(c => c.userId === selectedUserId)?.name
        ?? (isCoach ? 'Unknown' : t('yourCoach'));

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] gap-0 md:gap-6 animate-in fade-in duration-500 max-w-6xl mx-auto w-full pt-4 pb-20 md:pb-4">

            {/* Contact List.
                - Coach/admin: one tile per coaching client.
                - Client/community: one Coach Zaki tile. Legacy admin
                  history is visible in that thread; new messages go to
                  Coach Zaki only.
                Hidden on mobile when a conversation is already open so
                the chat takes the full screen. */}
            {contacts.length > 0 && (
                <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0 bg-surface-container-low rounded-2xl ghost-border overflow-hidden`}>
                    <div className="p-6 bg-surface-container/50 border-b border-outline-variant/30">
                        <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">{t('inbox')}</span>
                        <h2 className="text-2xl font-headline font-extrabold text-on-surface flex items-center gap-3">
                            <MessageSquare size={20} className="text-primary" />
                            {t('navMessages')}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {contacts.map(c => (
                            <button
                                key={c.userId}
                                onClick={() => setSelectedUserId(c.userId)}
                                className={`w-full flex items-center gap-4 p-5 text-left transition-all hover:bg-surface-container-highest/30 ${selectedUserId === c.userId ? 'bg-primary/5' : ''}`}
                                // Active-thread rail anchors to the "start" edge — left
                                // in English, right in Arabic — so the highlight always
                                // sits where the cursor enters the row.
                                style={isRTL
                                    ? { borderRight: selectedUserId === c.userId ? '3px solid #e6c364' : '3px solid transparent' }
                                    : { borderLeft:  selectedUserId === c.userId ? '3px solid #e6c364' : '3px solid transparent' }}
                            >
                                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-headline font-bold text-lg shrink-0 border border-primary/20">
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-on-surface font-headline font-bold text-sm truncate">{c.name}</span>
                                        {c.unread > 0 && (
                                            <span
                                                className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest flex items-center justify-center shrink-0 bzt-pulse-soft"
                                                style={{ animation: 'bzt-pulse-soft 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite' }}
                                                aria-label={`${c.unread} ${t('msgUnreadAria')}`}
                                            >
                                                {c.unread} {t('msgUnreadBadge')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-on-surface/50 text-xs font-body truncate">
                                        {c.lastMsg ? (c.lastMsg.text || (c.lastMsg.imageUrl ? t('msgPhotoFallback') : '')) : t('noMessagesYet')}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {contacts.length === 0 && (
                            <div className="p-8 text-center text-on-surface/40 font-body text-sm">{t('noClientsYet')}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className={`${!selectedUserId && isCoach ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-surface-container-low rounded-2xl ghost-border overflow-hidden`}>
                {selectedUserId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 flex items-center gap-4 bg-surface-container/50 border-b border-outline-variant/30">
                            {isCoach && (
                                <button
                                    onClick={() => setSelectedUserId(null)}
                                    className="md:hidden text-on-surface/50 hover:text-on-surface transition-colors"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                            )}
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-headline font-bold text-sm border border-primary/20">
                                {selectedName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-on-surface font-headline font-bold text-lg">{selectedName}</h3>
                                <p className="text-primary font-label text-[10px] uppercase tracking-widest font-bold mt-0.5">
                                    {isCoach ? contacts.find(c => c.userId === selectedUserId)?.category ?? '' : t('yourCoach')}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                            {conversation.length === 0 && (
                                <div className="text-center text-on-surface/40 py-16 font-body">
                                    <MessageSquare className="mx-auto mb-4 opacity-30" size={48} />
                                    <p>{t('startConversationMsg')}</p>
                                </div>
                            )}
                            {conversation.map(msg => {
                                const isMine = msg.senderId === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl p-4 ${isMine
                                            ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-br-sm shadow-[0_10px_30px_rgba(230,195,100,0.15)]'
                                            : 'bg-surface-container-high text-on-surface rounded-bl-sm ghost-border'
                                            }`}>
                                            {msg.imageUrl && (
                                                <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="block mb-3">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt={msg.imageName || t('msgChatAttachmentAlt')}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="max-h-72 w-full rounded-xl object-cover"
                                                    />
                                                </a>
                                            )}
                                            {msg.text && (
                                                <p className={`text-sm leading-relaxed font-body ${isMine ? 'font-medium' : ''}`}>{msg.text}</p>
                                            )}
                                            <p className={`text-[10px] font-label uppercase tracking-widest mt-2 font-bold ${isMine ? 'text-on-primary/60' : 'text-on-surface/40'}`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-surface-container/50 border-t border-outline-variant/30">
                            {sendError && (
                                <div
                                    role="alert"
                                    className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] font-body"
                                >
                                    {sendError}
                                </div>
                            )}
                            {imagePreview && (
                                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-3">
                                    <img src={imagePreview} alt="Selected attachment" className="h-16 w-16 rounded-xl object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-headline font-bold text-on-surface">{selectedImage?.name}</p>
                                        <p className="text-[11px] font-body text-on-surface/45">
                                            {selectedImage ? `${(selectedImage.size / 1024 / 1024).toFixed(1)} MB` : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="h-9 w-9 rounded-full bg-surface-container-high text-on-surface/60 hover:text-on-surface flex items-center justify-center"
                                        aria-label={t('msgRemoveImage')}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sending}
                                    className="w-14 h-14 rounded-full bg-surface-container-lowest text-on-surface/60 hover:text-primary hover:bg-surface-container-high flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                                    aria-label={t('msgAttachImage')}
                                >
                                    <ImagePlus size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') void handleSend(); }}
                                    placeholder={t('typeMessage')}
                                    disabled={sending}
                                    className="flex-1 bg-surface-container-lowest rounded-full px-6 py-4 text-sm font-body text-on-surface placeholder-on-surface/30 border-none outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
                                />
                                <button
                                    onClick={() => void handleSend()}
                                    disabled={(!text.trim() && !selectedImage) || sending}
                                    className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(230,195,100,0.3)] active:scale-95 transition-all shrink-0"
                                >
                                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-on-surface/40 bg-surface-container-low/50">
                        <div className="text-center font-body">
                            <MessageSquare className="mx-auto mb-4 opacity-20" size={56} />
                            <p className="text-lg">{t('selectConversation')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
