import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, ChevronRight, CheckCircle2, AlertCircle, Plus, X, Trash2, UserCog, Shield, Users } from 'lucide-react';
import clsx from 'clsx';
import { Category, Client } from '../types';

const CLIENT_CATEGORIES: { value: Category; label: string; color: string }[] = [
    { value: 'cutting', label: 'Cutting', color: 'orange' },
    { value: 'bulking', label: 'Bulking', color: 'blue' },
    { value: 'pro', label: 'Pro', color: 'purple' },
    { value: 'health', label: 'Health', color: 'teal' }
];

export const Clients = () => {
    const { clients, addClient, removeClient, updateClient } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        category: 'cutting' as Category,
        programLength: 12
    });

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleAddClient = () => {
        if (newClient.name && newClient.email) {
            addClient({
                userId: `u${Date.now()}`,
                name: newClient.name,
                email: newClient.email,
                category: newClient.category,
                currentWeek: 0,
                programLength: newClient.programLength,
                needsReview: false,
                isOnboarding: true
            });
            setNewClient({ name: '', email: '', category: 'cutting', programLength: 12 });
            setShowAddModal(false);
        }
    };

    const handleDeleteClient = (clientId: string) => {
        removeClient(clientId);
        setConfirmDelete(null);
    };

    const handleChangeCategory = (client: Client, newCategory: Category) => {
        updateClient(client.id, { category: newCategory });
        setShowRoleModal(false);
        setSelectedClient(null);
    };

    const getCategoryColor = (category: Category) => {
        const cat = CLIENT_CATEGORIES.find(c => c.value === category);
        return cat?.color || 'slate';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('clientsTitle')}</h1>
                    <p className="text-navy-200">{t('clientsSubtitle')}</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('searchClients')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="clay-input py-2 pl-10 pr-4 w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-4 py-2 flex items-center gap-2"
                    >
                        <Plus size={18} /> {t('addClient')}
                    </button>
                </div>
            </div>

            {/* Category Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CLIENT_CATEGORIES.map(cat => {
                    const count = clients.filter(c => c.category === cat.value).length;
                    const isActive = categoryFilter === cat.value;
                    return (
                        <button
                            key={cat.value}
                            onClick={() => setCategoryFilter(isActive ? 'all' : cat.value)}
                            className={clsx(
                                "p-4 rounded-xl transition-all text-left",
                                isActive
                                    ? `clay-card-sm bg-${cat.color}-500/15 border-${cat.color}-500/40`
                                    : "clay-card-sm hover:border-white/[0.08]"
                            )}
                        >
                            <div className={clsx("text-sm font-medium mb-1", isActive ? `text-${cat.color}-400` : "text-navy-200")}>
                                {cat.label}
                            </div>
                            <div className="text-2xl font-bold text-white">{count}</div>
                        </button>
                    );
                })}
            </div>

            {/* Filter Row */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        categoryFilter === 'all'
                            ? "bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950"
                            : "clay-card-sm text-navy-200 hover:text-white"
                    )}
                >
                    All Clients ({clients.length})
                </button>
                {CLIENT_CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setCategoryFilter(cat.value)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            categoryFilter === cat.value
                                ? `bg-${cat.color}-500 text-white`
                                : "clay-card-sm text-navy-200 hover:text-white"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Client List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredClients.map(client => {
                    const catColor = getCategoryColor(client.category);
                    return (
                        <div key={client.id} className="clay-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/[0.08] transition-colors">

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                                    `bg-${catColor}-500/10 text-${catColor}-400`
                                )}>
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{client.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-navy-300">
                                        <span className={clsx("capitalize px-2 py-0.5 rounded text-xs font-medium", `bg-${catColor}-500/10 text-${catColor}-400`)}>
                                            {client.category}
                                        </span>
                                        <span className={clsx("px-2 py-0.5 rounded text-xs font-medium",
                                            (client.accessLevel || 'coaching') === 'coaching'
                                                ? "bg-gold-500/10 text-gold-400"
                                                : "bg-indigo-500/10 text-indigo-400"
                                        )}>
                                            {(client.accessLevel || 'coaching') === 'coaching' ? '🏋️ Coaching' : '👥 Community'}
                                        </span>
                                        <span>•</span>
                                        <span>Week {client.currentWeek}</span>
                                        {client.isOnboarding && (
                                            <>
                                                <span>•</span>
                                                <span className="text-gold-400">Onboarding</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">

                                {/* Status Badge */}
                                {client.needsReview ? (
                                    <div className="flex items-center gap-2 text-gold-400 bg-gold-500/10 px-4 py-2 rounded-full text-sm font-medium">
                                        <AlertCircle size={16} /> Needs Review
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-navy-300 bg-navy-500/10 px-4 py-2 rounded-full text-sm font-medium">
                                        <CheckCircle2 size={16} /> On Track
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setShowRoleModal(true);
                                        }}
                                        className="clay-button bg-navy-800 hover:bg-navy-700 text-white p-2"
                                        title="Change Category"
                                    >
                                        <UserCog size={18} />
                                    </button>

                                    {confirmDelete === client.id ? (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleDeleteClient(client.id)}
                                                className="clay-button bg-red-600 hover:bg-red-500 text-white px-3 py-2 text-sm"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="clay-button bg-navy-700 hover:bg-navy-600 text-white px-3 py-2 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete(client.id)}
                                            className="clay-button bg-navy-800 hover:bg-red-600/20 hover:text-red-400 text-navy-300 p-2"
                                            title="Remove Client"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => navigate(`/clients/${client.id}/review`)}
                                        className="clay-button bg-navy-800 hover:bg-navy-700 text-white px-4 py-2 flex items-center gap-2 group"
                                    >
                                        View <ChevronRight size={16} className="text-navy-400 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    );
                })}

                {filteredClients.length === 0 && (
                    <div className="text-center py-20 text-navy-400">
                        No clients found matching your criteria
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add New Client</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-navy-300 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Client Name *</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full clay-input p-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                    placeholder="john@example.com"
                                    className="w-full clay-input p-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Category *</label>
                                <select
                                    value={newClient.category}
                                    onChange={e => setNewClient({ ...newClient, category: e.target.value as Category })}
                                    className="w-full clay-input p-3"
                                >
                                    {CLIENT_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">Program Length (weeks)</label>
                                <select
                                    value={newClient.programLength}
                                    onChange={e => setNewClient({ ...newClient, programLength: parseInt(e.target.value) })}
                                    className="w-full clay-input p-3"
                                >
                                    <option value={8}>8 Weeks</option>
                                    <option value={12}>12 Weeks</option>
                                    <option value={16}>16 Weeks</option>
                                    <option value={24}>24 Weeks</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddClient}
                                disabled={!newClient.name || !newClient.email}
                                className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3"
                            >
                                Add Client
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Category Modal */}
            {showRoleModal && selectedClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="clay-card p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Manage Client</h2>
                            <button onClick={() => { setShowRoleModal(false); setSelectedClient(null); }} className="text-navy-300 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-navy-200 mb-2">
                            Client: <strong className="text-white">{selectedClient.name}</strong>
                        </p>

                        {/* Access Level Section */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase text-navy-400 tracking-wider mb-3 flex items-center gap-2">
                                <Shield size={14} className="text-gold-400" /> Access Level
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateClient(selectedClient.id, { accessLevel: 'coaching' })}
                                    className={clsx(
                                        "p-3 rounded-xl text-center transition-all border",
                                        (selectedClient.accessLevel || 'coaching') === 'coaching'
                                            ? "bg-gold-500/15 border-gold-500/40 text-gold-400"
                                            : "clay-card-sm border-transparent text-navy-300 hover:border-white/[0.06]"
                                    )}
                                >
                                    <Shield size={20} className="mx-auto mb-1" />
                                    <div className="text-sm font-bold">Coaching</div>
                                    <div className="text-[10px] text-navy-400 mt-0.5">Full access + check-ins</div>
                                </button>
                                <button
                                    onClick={() => updateClient(selectedClient.id, { accessLevel: 'community' })}
                                    className={clsx(
                                        "p-3 rounded-xl text-center transition-all border",
                                        selectedClient.accessLevel === 'community'
                                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400"
                                            : "clay-card-sm border-transparent text-navy-300 hover:border-white/[0.06]"
                                    )}
                                >
                                    <Users size={20} className="mx-auto mb-1" />
                                    <div className="text-sm font-bold">Community</div>
                                    <div className="text-[10px] text-navy-400 mt-0.5">Videos + community only</div>
                                </button>
                            </div>
                        </div>

                        {/* Program Category Section */}
                        <div>
                            <h3 className="text-xs font-bold uppercase text-navy-400 tracking-wider mb-3">
                                Program Category
                            </h3>
                            <div className="space-y-2">
                                {CLIENT_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => handleChangeCategory(selectedClient, cat.value)}
                                        className={clsx(
                                            "w-full p-3 rounded-lg text-left flex items-center justify-between transition-all",
                                            selectedClient.category === cat.value
                                                ? `bg-${cat.color}-500/15 border border-${cat.color}-500/40 text-white`
                                                : "clay-card-sm text-navy-200 border border-transparent hover:border-white/[0.06]"
                                        )}
                                    >
                                        <span className="font-medium">{cat.label}</span>
                                        {selectedClient.category === cat.value && (
                                            <CheckCircle2 className={`text-${cat.color}-400`} size={18} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => { setShowRoleModal(false); setSelectedClient(null); }}
                            className="w-full mt-4 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
