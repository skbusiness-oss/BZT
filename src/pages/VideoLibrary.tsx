import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Play, Lock, Search, Plus, X, Youtube, Video as VideoIcon, Link2, Image } from 'lucide-react';
import clsx from 'clsx';

export const VideoLibrary = () => {
    const { videos, categories, addVideo, addCategory } = useData();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const [newVideo, setNewVideo] = useState({
        title: '',
        category: '',
        videoUrl: '',
        platform: 'youtube' as 'youtube' | 'vimeo',
        thumbnailUrl: '',
        description: '',
        isLocked: false
    });

    const isCoach = user?.role === 'coach';

    const allCategories = ['All', ...categories];

    const filteredVideos = videos.filter(video => {
        const matchesCategory = filter === 'All' || video.category === filter;
        const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const canAccess = (video: any) => {
        if (!video.isLocked) return true;
        if (user?.role === 'community') return false;
        return true;
    };

    const handleAddVideo = () => {
        if (newVideo.title && newVideo.category && newVideo.videoUrl) {
            addVideo(newVideo);
            setNewVideo({ title: '', category: '', videoUrl: '', platform: 'youtube', thumbnailUrl: '', description: '', isLocked: false });
            setShowAddModal(false);
        }
    };

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            addCategory(newCategory.trim());
            setNewCategory('');
            setShowCategoryModal(false);
        }
    };

    const detectPlatform = (url: string) => {
        if (url.includes('vimeo')) return 'vimeo';
        return 'youtube';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('videoLibraryTitle')}</h1>
                    <p className="text-navy-200">{t('videoLibrarySubtitle')}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('searchVideos')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="clay-input py-2 pl-10 pr-4 w-full sm:w-64"
                        />
                    </div>

                    {isCoach && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-4 py-2 flex items-center gap-2"
                            >
                                <Plus size={18} /> {t('addVideo')}
                            </button>
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="clay-button bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 flex items-center gap-2"
                            >
                                <Plus size={16} /> {t('addCategory')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {allCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            filter === cat
                                ? "bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 shadow-clay-sm"
                                : "clay-card-sm text-navy-200 hover:text-white"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map(video => {
                    const unlocked = canAccess(video);

                    return (
                        <div key={video.id} className="group clay-card overflow-hidden hover:border-gold-500/20 transition-all">
                            {/* Thumbnail */}
                            <div className="aspect-video relative overflow-hidden">
                                <img
                                    src={video.thumbnailUrl || `https://placehold.co/600x400/1a237e/7986cb?text=${video.title}`}
                                    alt={video.title}
                                    className={clsx("w-full h-full object-cover transition-transform duration-500 group-hover:scale-105", !unlocked && "grayscale")}
                                />
                                <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-navy-950/0 transition-colors" />

                                {/* Platform Badge */}
                                {video.platform && (
                                    <div className="absolute top-3 right-3">
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-bold flex items-center gap-1",
                                            video.platform === 'youtube' ? "bg-red-600 text-white" : "bg-blue-500 text-white"
                                        )}>
                                            {video.platform === 'youtube' ? <Youtube size={12} /> : <VideoIcon size={12} />}
                                            {video.platform.charAt(0).toUpperCase() + video.platform.slice(1)}
                                        </span>
                                    </div>
                                )}

                                {/* Overlay Icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {unlocked ? (
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 text-navy-950"
                                            style={{ background: 'linear-gradient(135deg, #ffd740, #d4a017)', boxShadow: '0 4px 20px rgba(212,160,23,0.3)' }}>
                                            <Play size={20} fill="currentColor" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-navy-900/90 text-navy-300 flex items-center justify-center shadow-lg backdrop-blur-sm border border-navy-700">
                                            <Lock size={20} />
                                        </div>
                                    )}
                                </div>

                                {/* Category Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className="px-2 py-1 rounded bg-navy-950/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                                        {video.category}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className={clsx("font-bold text-lg mb-1 group-hover:text-gold-400 transition-colors", !unlocked ? "text-navy-400" : "text-white")}>
                                    {video.title}
                                </h3>
                                <p className="text-sm text-navy-300 mb-4 line-clamp-2">
                                    {video.description || `Master the fundamentals of ${video.category.toLowerCase()} with this comprehensive guide.`}
                                </p>

                                <div className="flex items-center justify-between">
                                    {unlocked ? (
                                        <button className="text-sm font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1">
                                            Watch Now <Play size={12} />
                                        </button>
                                    ) : (
                                        <button className="text-xs font-bold text-navy-300 clay-card-sm px-3 py-1.5 flex items-center gap-2 cursor-not-allowed">
                                            <Lock size={12} /> Upgrade to Unlock
                                        </button>
                                    )}
                                    <span className="text-xs text-navy-500">12:34</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Video Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add New Video</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-navy-300 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Video Title *</label>
                                <input
                                    type="text"
                                    value={newVideo.title}
                                    onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                                    placeholder="e.g. Mastering the Deadlift"
                                    className="w-full clay-input p-3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Category *</label>
                                <select
                                    value={newVideo.category}
                                    onChange={e => setNewVideo({ ...newVideo, category: e.target.value })}
                                    className="w-full clay-input p-3"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-navy-200 mb-1 flex items-center gap-2">
                                    <Link2 size={14} /> Video URL (YouTube or Vimeo) *
                                </label>
                                <input
                                    type="url"
                                    value={newVideo.videoUrl}
                                    onChange={e => setNewVideo({
                                        ...newVideo,
                                        videoUrl: e.target.value,
                                        platform: detectPlatform(e.target.value)
                                    })}
                                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                    className="w-full clay-input p-3"
                                />
                                {newVideo.videoUrl && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-navy-400">
                                        Detected platform:
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded font-bold",
                                            newVideo.platform === 'youtube' ? "bg-red-600/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {newVideo.platform}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-navy-200 mb-1 flex items-center gap-2">
                                    <Image size={14} /> Thumbnail URL
                                </label>
                                <input
                                    type="url"
                                    value={newVideo.thumbnailUrl}
                                    onChange={e => setNewVideo({ ...newVideo, thumbnailUrl: e.target.value })}
                                    placeholder="https://example.com/thumbnail.jpg (optional)"
                                    className="w-full clay-input p-3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Description</label>
                                <textarea
                                    value={newVideo.description}
                                    onChange={e => setNewVideo({ ...newVideo, description: e.target.value })}
                                    placeholder="Brief description of the video content..."
                                    rows={3}
                                    className="w-full clay-input p-3 resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isLocked"
                                    checked={newVideo.isLocked}
                                    onChange={e => setNewVideo({ ...newVideo, isLocked: e.target.checked })}
                                    className="w-4 h-4 rounded accent-gold-500"
                                />
                                <label htmlFor="isLocked" className="text-sm text-navy-200">
                                    <Lock size={12} className="inline mr-1" /> Lock for Coaching Clients Only
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddVideo}
                                disabled={!newVideo.title || !newVideo.category || !newVideo.videoUrl}
                                className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3"
                            >
                                Add Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add New Category</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-navy-300 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm text-navy-200 mb-1">Category Name</label>
                            <input
                                type="text"
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                placeholder="e.g. Recovery, Supplements..."
                                className="w-full clay-input p-3"
                            />
                        </div>

                        <div className="mt-4">
                            <p className="text-xs text-navy-400 mb-2">Existing categories:</p>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <span key={cat} className="px-2 py-1 clay-card-sm rounded text-xs text-navy-200">{cat}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategory.trim()}
                                className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3"
                            >
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
