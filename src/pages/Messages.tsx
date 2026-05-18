import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { tsToDate, tsToMillis } from '../lib/firestoreTime';

export const Messages = () => {
    const { user } = useAuth();
    const { clients, messages, sendMessage, markMessagesRead, getConversation } = useData();
    const { t } = useLanguage();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isCoach = user?.role === 'coach' || user?.role === 'admin';

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
    const COACH_NAME = 'Coach Zaki';
    interface TeamMember { uid: string; name: string; role: 'coach' | 'admin' }
    const [teamMembers] = useState<TeamMember[]>([
        { uid: COACH_UID, name: COACH_NAME, role: 'coach' },
    ]);
    const clientDoc = clients.find(c => c.userId === user?.id);

    // Auto-select the coach for non-coach roles. clientDoc.coachId is
    // intentionally IGNORED here — historical docs may have it set to
    // the admin's uid (residue from the broken team-lookup era) and
    // honoring that would re-route messages away from the coach again.
    useEffect(() => {
        if (isCoach || !user || selectedUserId) return;
        setSelectedUserId(COACH_UID);
        markMessagesRead(user.id, COACH_UID);
    }, [isCoach, user, selectedUserId, markMessagesRead]);
    // Reference clientDoc to keep the type-checker quiet about an unused
    // computed value (kept because it's read by other features that may
    // need it; pulling it from useData here also warms the cache).
    void clientDoc;

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
            markMessagesRead(user.id, selectedUserId);
        }
    }, [selectedUserId, user, messages.length]);

    if (!user) return null;

    // If client and team hasn't been resolved yet
    if (!isCoach && teamMembers.length === 0) return (
        <div className="flex items-center justify-center h-64 text-on-surface/50 font-body">
            <MessageSquare className="mr-3 opacity-30" size={24} />
            {t('lookingForCoach')}
        </div>
    );

    // Conversation contacts.
    //   - Coach/admin: one contact per coaching client (existing behavior).
    //   - Client/community: one contact per team member (coach + admin)
    //     so they can choose who to message. Previously the contact list
    //     was empty for non-coach users — they were silently auto-routed
    //     to a single arbitrary recipient (the first admin/coach the
    //     `users` query returned), which is what hid Coach Zack and
    //     made messages appear lost.
    const contacts = isCoach
        ? clients.map(c => {
            const unread = messages.filter(m => m.senderId === c.userId && m.receiverId === user.id && !m.read).length;
            const lastMsg = [...messages].filter(m =>
                (m.senderId === user.id && m.receiverId === c.userId) || (m.senderId === c.userId && m.receiverId === user.id)
            ).sort((a, b) => tsToMillis(b.timestamp) - tsToMillis(a.timestamp))[0];
            return { userId: c.userId, name: c.name, unread, lastMsg, category: c.category };
        }).sort((a, b) => {
            if (a.unread !== b.unread) return b.unread - a.unread;
            return tsToMillis(b.lastMsg?.timestamp) - tsToMillis(a.lastMsg?.timestamp);
        })
        : teamMembers.map(m => {
            const unread = messages.filter(x => x.senderId === m.uid && x.receiverId === user.id && !x.read).length;
            const lastMsg = [...messages].filter(x =>
                (x.senderId === user.id && x.receiverId === m.uid) || (x.senderId === m.uid && x.receiverId === user.id)
            ).sort((a, b) => tsToMillis(b.timestamp) - tsToMillis(a.timestamp))[0];
            // `category` is a coach-side concept; reuse the role label so
            // the existing contact-tile renderer (which colors-by-category)
            // doesn't crash on an undefined value.
            return { userId: m.uid, name: m.name, unread, lastMsg, category: m.role as unknown as typeof clients[number]['category'] };
        }).sort((a, b) => {
            if (a.unread !== b.unread) return b.unread - a.unread;
            return tsToMillis(b.lastMsg?.timestamp) - tsToMillis(a.lastMsg?.timestamp);
        });

    const conversation = selectedUserId ? getConversation(user.id, selectedUserId) : [];

    const handleSend = async () => {
        if (!text.trim() || !selectedUserId || sending) return;
        const body = text.trim();
        setSending(true);
        setSendError(null);
        try {
            await sendMessage(user.id, selectedUserId, user.name, body);
            setText('');
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
        const d = tsToDate(ts);
        if (!d) return '—';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Resolve the displayed name from the contact list (which now includes
    // team members for non-coach users too — see contacts derivation
    // above). Falls back to the legacy "Your coach" label only when the
    // contact list lookup misses (e.g., team query still in flight).
    const selectedName = contacts.find(c => c.userId === selectedUserId)?.name
        ?? (isCoach ? 'Unknown' : t('yourCoach'));

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] gap-0 md:gap-6 animate-in fade-in duration-500 max-w-6xl mx-auto w-full pt-4 pb-20 md:pb-4">

            {/* Contact List.
                - Coach/admin: one tile per coaching client.
                - Client/community: one tile per team member (coach + admin).
                  Previously hidden for non-coach users, which forced the
                  auto-select to a single arbitrary recipient. Now visible
                  so the client can choose. The tile renderer below is
                  shared between both modes — the `category` field on each
                  contact carries either a coaching category (orange/blue/
                  purple) for coaches' view, or the team-member role for
                  clients' view.
                Hidden on mobile when a conversation is already open so
                the chat takes the full screen. */}
            {contacts.length > 0 && (
                <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0 bg-surface-container-low rounded-2xl ghost-border overflow-hidden`}>
                    <div className="p-6 bg-surface-container/50 border-b border-outline-variant/30">
                        <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold block mb-2">Inbox</span>
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
                                style={{ borderLeft: selectedUserId === c.userId ? '3px solid #e6c364' : '3px solid transparent' }}
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
                                                aria-label={`${c.unread} unread message${c.unread === 1 ? '' : 's'}`}
                                            >
                                                {c.unread} NEW
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-on-surface/50 text-xs font-body truncate">
                                        {c.lastMsg ? c.lastMsg.text : t('noMessagesYet')}
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
                                            <p className={`text-sm leading-relaxed font-body ${isMine ? 'font-medium' : ''}`}>{msg.text}</p>
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
                            <div className="flex gap-3">
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
                                    disabled={!text.trim() || sending}
                                    className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(230,195,100,0.3)] active:scale-95 transition-all shrink-0"
                                >
                                    <Send size={20} className="ml-1" />
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
