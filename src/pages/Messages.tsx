import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const Messages = () => {
    const { user } = useAuth();
    const { clients, messages, sendMessage, markMessagesRead, getConversation } = useData();
    const { t } = useLanguage();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [text, setText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isCoach = user?.role === 'coach' || user?.role === 'admin';

    // For client role — resolve their assigned coach
    const [coachId, setCoachId] = useState<string | null>(null);
    const clientDoc = clients.find(c => c.userId === user?.id);

    useEffect(() => {
        if (!isCoach && user) {
            // Prefer the coachId stored on the client document
            if (clientDoc?.coachId) {
                setCoachId(clientDoc.coachId);
            } else {
                // Fallback: query for any user with role 'coach' or 'admin'
                const q = query(collection(db, 'users'), where('role', 'in', ['coach', 'admin']), limit(1));
                getDocs(q).then(snap => {
                    if (!snap.empty) setCoachId(snap.docs[0].id);
                });
            }
        }
    }, [isCoach, user, clientDoc?.coachId]);

    // Auto-select conversation for client
    useEffect(() => {
        if (!isCoach && user && coachId) {
            setSelectedUserId(coachId);
            markMessagesRead(user.id, coachId);
        }
    }, [isCoach, user, coachId]);

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

    // If client and coach hasn't been found yet
    if (!isCoach && !coachId) return (
        <div className="flex items-center justify-center h-64 text-on-surface/50 font-body">
            <MessageSquare className="mr-3 opacity-30" size={24} />
            {t('lookingForCoach')}
        </div>
    );

    // Conversation contacts
    const contacts = isCoach
        ? clients.map(c => {
            const unread = messages.filter(m => m.senderId === c.userId && m.receiverId === user.id && !m.read).length;
            const lastMsg = [...messages].filter(m =>
                (m.senderId === user.id && m.receiverId === c.userId) || (m.senderId === c.userId && m.receiverId === user.id)
            ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            return { userId: c.userId, name: c.name, unread, lastMsg, category: c.category };
        }).sort((a, b) => {
            if (a.unread !== b.unread) return b.unread - a.unread;
            const aTime = a.lastMsg ? new Date(a.lastMsg.timestamp).getTime() : 0;
            const bTime = b.lastMsg ? new Date(b.lastMsg.timestamp).getTime() : 0;
            return bTime - aTime;
        })
        : [];

    const conversation = selectedUserId ? getConversation(user.id, selectedUserId) : [];

    const handleSend = () => {
        if (!text.trim() || !selectedUserId) return;
        sendMessage(user.id, selectedUserId, user.name, text.trim());
        setText('');
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const selectedName = isCoach
        ? contacts.find(c => c.userId === selectedUserId)?.name ?? 'Unknown'
        : t('yourCoach');

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] gap-0 md:gap-6 animate-in fade-in duration-500 max-w-6xl mx-auto w-full pt-4 pb-20 md:pb-4">

            {/* Contact List (Coach only, or hidden when chat is selected on mobile) */}
            {isCoach && (
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
                                            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold uppercase tracking-widest flex items-center justify-center shrink-0">
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
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder={t('typeMessage')}
                                    className="flex-1 bg-surface-container-lowest rounded-full px-6 py-4 text-sm font-body text-on-surface placeholder-on-surface/30 border-none outline-none focus:ring-1 focus:ring-primary/30"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!text.trim()}
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
