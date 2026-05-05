import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Users, AlertCircle, TrendingUp, CheckCircle2, ChevronRight, Search, UserPlus } from 'lucide-react';
import { AddClientModal } from '../shared/AddClientModal';
import { FitnessLevel } from '../../types';

const LEVEL_BADGE: Record<string, { emoji: string; key: string; color: string }> = {
    beginner: { emoji: '🟢', key: 'beginner', color: 'emerald' },
    intermediate: { emoji: '🟡', key: 'intermediate', color: 'yellow' },
    pro_competitions: { emoji: '🔴', key: 'proCompetitions', color: 'red' },
};

export const CoachDashboard = () => {
    const { clients } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);
    const [dashSearch, setDashSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<'all' | FitnessLevel>('all');

    const totalClients = clients.length;
    const pendingReviews = clients.filter(c => c.needsReview).length;
    const cuttingClients = clients.filter(c => c.category === 'cutting').length;
    const bulkingClients = clients.filter(c => c.category === 'bulking').length;
    const proClients = clients.filter(c => c.category === 'pro').length;
    const healthClients = clients.filter(c => c.category === 'health').length;

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(dashSearch.toLowerCase()) ||
            c.email.toLowerCase().includes(dashSearch.toLowerCase());
        const matchesLevel = levelFilter === 'all' || c.fitnessLevel === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const levelFilters: { value: 'all' | FitnessLevel; label: string; emoji?: string }[] = [
        { value: 'all', label: t('allLevels') },
        { value: 'beginner', label: t('beginner'), emoji: '🟢' },
        { value: 'intermediate', label: t('intermediate'), emoji: '🟡' },
        { value: 'pro_competitions', label: t('proCompetitions'), emoji: '🔴' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0 max-w-7xl mx-auto">

            {/* Editorial header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">Coach Console</span>
                    <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                        {t('coachDashTitle')}<span className="text-primary-container">.</span>
                    </h1>
                    <p className="text-on-surface/60 mt-4 font-body leading-relaxed max-w-xl">{t('coachDashSubtitle')}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="py-4 px-8 flex items-center justify-center gap-2 text-on-primary font-bold font-label text-[10px] uppercase tracking-widest rounded-full bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <UserPlus size={16} /> {t('addNewClient')}
                </button>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-low p-6 rounded-2xl ghost-border">
                    <div className="flex items-center gap-2 text-on-surface/50 mb-3">
                        <Users size={16} />
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest">{t('totalClients')}</span>
                    </div>
                    <div className="text-4xl font-headline font-extrabold text-on-surface">{totalClients}</div>
                </div>

                <div className="bg-surface-container-low p-6 rounded-2xl ghost-border">
                    <div className="flex items-center gap-2 text-primary mb-3">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest">{t('needsReview')}</span>
                    </div>
                    <div className="text-4xl font-headline font-extrabold text-on-surface">{pendingReviews}</div>
                </div>

                <div className="bg-surface-container-low p-6 rounded-2xl ghost-border">
                    <div className="flex items-center gap-2 text-on-surface/50 mb-3">
                        <TrendingUp size={16} />
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest">{t('cutting')} / {t('bulking')}</span>
                    </div>
                    <div className="text-4xl font-headline font-extrabold text-on-surface">
                        {cuttingClients} <span className="text-on-surface/30 font-light text-2xl">/</span> {bulkingClients}
                    </div>
                </div>

                <div className="bg-surface-container-low p-6 rounded-2xl ghost-border">
                    <div className="flex items-center gap-2 text-on-surface/50 mb-3">
                        <TrendingUp size={16} />
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest">{t('pro')} / {t('health')}</span>
                    </div>
                    <div className="text-4xl font-headline font-extrabold text-on-surface">
                        {proClients} <span className="text-on-surface/30 font-light text-2xl">/</span> {healthClients}
                    </div>
                </div>
            </div>

            {/* Pending Reviews Section */}
            {pendingReviews > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">{t('actionRequired')} · {pendingReviews}</span>
                    </div>

                    <div className="grid gap-3">
                        {clients.filter(c => c.needsReview).map(client => (
                            <div key={client.id} className="bg-surface-container-low p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-primary/20 hover:border-primary/40 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline font-bold text-lg border border-primary/20 shrink-0">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-bold text-on-surface text-lg">{client.name}</h4>
                                        <p className="text-sm font-body text-on-surface/60">{t('week')} {client.currentWeek} {t('checkInSubmittedLabel')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/clients/${client.id}/review`)}
                                    className="px-6 py-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-label font-bold uppercase tracking-widest border border-primary/30 transition-colors w-full sm:w-auto text-center"
                                >
                                    {t('reviewCheckIn')}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Client List Preview */}
            <section className="bg-surface-container-low rounded-2xl p-6 md:p-8 ghost-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/50 block mb-2">Roster</span>
                        <h3 className="text-3xl font-headline font-extrabold text-on-surface">{t('recentClients')}</h3>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={dashSearch}
                            onChange={e => setDashSearch(e.target.value)}
                            className="bg-surface-container-lowest border-none outline-none focus:ring-1 focus:ring-primary/30 rounded-xl pl-11 pr-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30 w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Level Filter Pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
                    {levelFilters.map(lf => (
                        <button
                            key={lf.value}
                            onClick={() => setLevelFilter(lf.value)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-label font-bold uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-2 border ${
                                levelFilter === lf.value
                                    ? 'bg-primary text-on-primary border-primary shadow-[0_5px_15px_rgba(230,195,100,0.2)]'
                                    : 'bg-surface-container-lowest text-on-surface/60 border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
                            }`}
                        >
                            {lf.emoji && <span className="text-sm">{lf.emoji}</span>}
                            {lf.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filteredClients.map(client => {
                        const badge = client.fitnessLevel ? LEVEL_BADGE[client.fitnessLevel] : null;
                        return (
                            <button
                                key={client.id}
                                onClick={() => navigate(`/clients/${client.id}/review`)}
                                className="w-full bg-surface-container-lowest p-4 md:p-5 rounded-xl flex items-center justify-between group hover:bg-surface-container transition-all cursor-pointer text-left border border-outline-variant/30 hover:border-primary/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold text-lg border ${client.category === 'cutting' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        client.category === 'bulking' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            client.category === 'pro' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                        }`}>
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors mb-1">{client.name}</h4>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 capitalize">{client.category} • Week {client.currentWeek}</p>
                                            {badge && (
                                                <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-${badge.color}-500/10 text-${badge.color}-400 flex items-center gap-1.5 border border-${badge.color}-500/20`}>
                                                    {badge.emoji} {t(badge.key as any)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {client.needsReview ? (
                                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30 hidden sm:block">{t('needsReview')}</span>
                                    ) : (
                                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/50 bg-surface-container px-3 py-1.5 rounded-full flex items-center gap-1.5 hidden sm:flex border border-outline-variant/30">
                                            <CheckCircle2 size={12} /> {t('onTrack')}
                                        </span>
                                    )}
                                    <div className="w-8 h-8 rounded-full bg-surface-container group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                        <ChevronRight className="text-on-surface/40 group-hover:text-primary transition-colors" size={18} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {filteredClients.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto text-on-surface/20 mb-4" size={40} />
                            <p className="text-on-surface/50 font-body text-sm">No clients match the filters.</p>
                        </div>
                    )}
                </div>
            </section>

            {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
        </div>
    );
};
