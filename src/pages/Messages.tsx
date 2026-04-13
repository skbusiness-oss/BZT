import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const Messages = () => {
    const { user } = useAuth();
    const { clients, messages, sendMessage, markMessagesRead, getConversation } = useData();
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
        <div className="flex items-center justify-center h-64 text-navy-400">
            <MessageSquare className="mr-3 opacity-30" size={24} />
            Looking for your coach...
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
        : 'Coach Zack';

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] gap-0 md:gap-4 animate-in fade-in duration-500">

            {/* Contact List (Coach only, or hidden when chat is selected on mobile) */}
            {isCoach && (
                <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0 clay-card overflow-hidden`}>
                    <div className="p-4 border-b border-white/[0.04]">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageSquare size={20} className="text-gold-400" />
                            Messages
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {contacts.map(c => (
                            <button
                                key={c.userId}
                                onClick={() => setSelectedUserId(c.userId)}
                                className={`w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-white/[0.02] ${selectedUserId === c.userId ? 'bg-white/[0.04] border-l-2 border-gold-400' : 'border-l-2 border-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-medium truncate">{c.name}</span>
                                        {c.unread > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-gold-500 text-navy-950 text-xs font-bold flex items-center justify-center shrink-0">
                                                {c.unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-navy-400 text-sm truncate">
                                        {c.lastMsg ? c.lastMsg.text : 'No messages yet'}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {contacts.length === 0 && (
                            <div className="p-6 text-center text-navy-400">No clients yet</div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className={`${!selectedUserId && isCoach ? 'hidden md:flex' : 'flex'} flex-col flex-1 clay-card overflow-hidden`}>
                {selectedUserId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                            {isCoach && (
                                <button
                                    onClick={() => setSelectedUserId(null)}
                                    className="md:hidden text-navy-300 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-white font-bold text-sm">
                                {selectedName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{selectedName}</h3>
                                <p className="text-navy-400 text-xs">
                                    {isCoach ? contacts.find(c => c.userId === selectedUserId)?.category ?? '' : 'Your Coach'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {conversation.length === 0 && (
                                <div className="text-center text-navy-400 py-12">
                                    <MessageSquare className="mx-auto mb-3 opacity-30" size={40} />
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            )}
                            {conversation.map(msg => {
                                const isMine = msg.senderId === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMine
                                            ? 'bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/20 text-white rounded-br-md'
                                            : 'clay-card-sm text-navy-100 rounded-bl-md'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <p className={`text-xs mt-1 ${isMine ? 'text-gold-400/60' : 'text-navy-500'}`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/[0.04]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 clay-input px-4 py-3 text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!text.trim()}
                                    className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-4 py-3 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-navy-400">
                        <div className="text-center">
                            <MessageSquare className="mx-auto mb-3 opacity-20" size={48} />
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
