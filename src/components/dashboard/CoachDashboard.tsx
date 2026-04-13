import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Users, AlertCircle, TrendingUp, CheckCircle2, ChevronRight, Search, UserPlus } from 'lucide-react';
import { AddClientModal } from '../shared/AddClientModal';

export const CoachDashboard = () => {
    const { clients } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);
    const [dashSearch, setDashSearch] = useState('');

    const totalClients = clients.length;
    const pendingReviews = clients.filter(c => c.needsReview).length;
    const cuttingClients = clients.filter(c => c.category === 'cutting').length;
    const bulkingClients = clients.filter(c => c.category === 'bulking').length;
    const proClients = clients.filter(c => c.category === 'pro').length;
    const healthClients = clients.filter(c => c.category === 'health').length;

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(dashSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(dashSearch.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('coachDashTitle')}</h1>
                    <p className="text-navy-200">{t('coachDashSubtitle')}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-5 py-2.5 flex items-center gap-2"
                >
                    <UserPlus size={18} /> {t('addNewClient')}
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="clay-card-sm p-4">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <Users size={18} />
                        <span className="text-sm">{t('totalClients')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalClients}</div>
                </div>

                <div className="clay-card-sm p-4">
                    <div className="flex items-center gap-2 text-gold-400 mb-2">
                        <AlertCircle size={18} />
                        <span className="text-sm">{t('needsReview')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{pendingReviews}</div>
                </div>

                <div className="clay-card-sm p-4">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <TrendingUp size={18} />
                        <span className="text-sm">{t('cutting')} / {t('bulking')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{cuttingClients} <span className="text-navy-300 text-lg font-normal">/</span> {bulkingClients}</div>
                </div>

                <div className="clay-card-sm p-4">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <TrendingUp size={18} />
                        <span className="text-sm">{t('pro')} / {t('health')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{proClients} <span className="text-navy-300 text-lg font-normal">/</span> {healthClients}</div>
                </div>
            </div>

            {/* Pending Reviews Section */}
            {pendingReviews > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                        <h3 className="text-lg font-bold text-gold-400">{t('actionRequired')} ({pendingReviews})</h3>
                    </div>

                    <div className="grid gap-4">
                        {clients.filter(c => c.needsReview).map(client => (
                            <div key={client.id} className="clay-card-sm p-4 flex items-center justify-between border-gold-500/20 hover:border-gold-500/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gold-500/10 text-gold-400 flex items-center justify-center font-bold">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{client.name}</h4>
                                        <p className="text-sm text-navy-300">{t('week')} {client.currentWeek} {t('checkInSubmittedLabel')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/clients/${client.id}/review`)}
                                    className="clay-button bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 px-4 py-2 text-sm"
                                >
                                    {t('reviewCheckIn')}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Client List Preview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{t('recentClients')}</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={dashSearch}
                            onChange={e => setDashSearch(e.target.value)}
                            className="clay-input py-2 pl-9 pr-4 text-sm w-full"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredClients.map(client => (
                        <button
                            key={client.id}
                            onClick={() => navigate(`/clients/${client.id}/review`)}
                            className="w-full clay-card-sm p-4 flex items-center justify-between group hover:border-gold-500/20 transition-all cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${client.category === 'cutting' ? 'bg-orange-500/10 text-orange-400' :
                                    client.category === 'bulking' ? 'bg-blue-500/10 text-blue-400' :
                                        client.category === 'pro' ? 'bg-purple-500/10 text-purple-400' :
                                            'bg-teal-500/10 text-teal-400'
                                    }`}>
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-medium text-white group-hover:text-gold-400 transition-colors">{client.name}</h4>
                                    <p className="text-xs text-navy-300 capitalize">{client.category} • Week {client.currentWeek}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {client.needsReview ? (
                                    <span className="text-xs font-medium text-gold-400 bg-gold-500/10 px-2 py-1 rounded">{t('needsReview')}</span>
                                ) : (
                                    <span className="text-xs font-medium text-navy-300 bg-navy-500/10 px-2 py-1 rounded flex items-center gap-1">
                                        <CheckCircle2 size={12} /> {t('onTrack')}
                                    </span>
                                )}
                                <ChevronRight className="text-navy-400 group-hover:text-white transition-colors" size={18} />
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
        </div>
    );
};
