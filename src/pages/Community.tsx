import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Heart, MessageCircle, Send, Sparkles } from 'lucide-react';

export const Community = () => {
    const { user } = useAuth();
    const { posts, addPost, likePost, addComment } = useData();
    const [newPost, setNewPost] = useState('');
    const [commentText, setCommentText] = useState<Record<string, string>>({});
    const [showComments, setShowComments] = useState<Record<string, boolean>>({});

    if (!user) return null;

    const handlePost = () => {
        if (!newPost.trim()) return;
        addPost(user.id, user.name, user.role, newPost.trim());
        setNewPost('');
    };

    const handleComment = (postId: string) => {
        const text = commentText[postId]?.trim();
        if (!text) return;
        addComment(postId, user.id, user.name, text);
        setCommentText(prev => ({ ...prev, [postId]: '' }));
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffH = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffH < 1) return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}m ago`;
        if (diffH < 24) return `${diffH}h ago`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const roleColor = (role: string) => {
        if (role === 'coach') return 'text-gold-400 bg-gold-500/10';
        if (role === 'coaching') return 'text-navy-300 bg-navy-400/10';
        return 'text-navy-200 bg-navy-400/10';
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="text-gold-400" size={28} />
                    Community
                </h1>
                <p className="text-navy-200 mt-1">Share progress, ask questions, and celebrate wins.</p>
            </div>

            {/* Create Post */}
            <div className="clay-card p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-1">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={newPost}
                            onChange={e => setNewPost(e.target.value)}
                            placeholder="What's on your mind? Share a win, tip, or question..."
                            className="w-full clay-input p-3 h-20 resize-none text-sm placeholder-navy-500"
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handlePost}
                                disabled={!newPost.trim()}
                                className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Send size={14} /> Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-4">
                {posts.map(post => {
                    const isLiked = post.likes.includes(user.id);
                    const commentsOpen = showComments[post.id];

                    return (
                        <div key={post.id} className="clay-card p-5 space-y-4">
                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {post.authorName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{post.authorName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(post.authorRole)}`}>
                                            {post.authorRole === 'coach' ? '🏋️ Coach' : post.authorRole === 'coaching' ? 'Client' : 'Member'}
                                        </span>
                                    </div>
                                    <p className="text-navy-400 text-xs">{formatTime(post.timestamp)}</p>
                                </div>
                            </div>

                            {/* Content */}
                            <p className="text-navy-100 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
                                <button
                                    onClick={() => likePost(post.id, user.id)}
                                    className={`flex items-center gap-2 text-sm transition-all ${isLiked
                                        ? 'text-red-400 font-medium'
                                        : 'text-navy-400 hover:text-red-400'
                                        }`}
                                >
                                    <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                                    {post.likes.length > 0 && post.likes.length}
                                    {post.likes.length === 0 && 'Like'}
                                </button>

                                <button
                                    onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                    className="flex items-center gap-2 text-sm text-navy-400 hover:text-navy-200 transition-colors"
                                >
                                    <MessageCircle size={16} />
                                    {post.comments.length > 0 ? post.comments.length : 'Comment'}
                                </button>
                            </div>

                            {/* Comments */}
                            {commentsOpen && (
                                <div className="space-y-3 pt-2">
                                    {post.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3 ml-2">
                                            <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center text-navy-300 text-xs font-bold shrink-0 mt-0.5">
                                                {comment.authorName.charAt(0)}
                                            </div>
                                            <div className="clay-card-sm px-3 py-2 text-sm flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-medium text-xs">{comment.authorName}</span>
                                                    <span className="text-navy-500 text-xs">{formatTime(comment.timestamp)}</span>
                                                </div>
                                                <p className="text-navy-200">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Comment */}
                                    <div className="flex gap-2 ml-2">
                                        <input
                                            type="text"
                                            value={commentText[post.id] || ''}
                                            onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                                            placeholder="Write a comment..."
                                            className="flex-1 clay-input px-3 py-2 text-sm"
                                        />
                                        <button
                                            onClick={() => handleComment(post.id)}
                                            disabled={!commentText[post.id]?.trim()}
                                            className="clay-button bg-navy-700 text-white px-3 py-2 text-sm disabled:opacity-30"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {posts.length === 0 && (
                    <div className="clay-card p-12 text-center">
                        <Sparkles className="mx-auto text-navy-400 mb-3 opacity-30" size={40} />
                        <p className="text-navy-300">No posts yet. Be the first to share!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
