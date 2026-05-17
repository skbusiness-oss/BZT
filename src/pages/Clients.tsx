import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useCommunityMembers, CommunityMember } from '../hooks/useCommunityMembers';
import { functions } from '../lib/firebase';

// `deleteUser` Cloud Function — fully revokes the user (Auth + Firestore + audit).
const callDeleteUser = httpsCallable<
    { targetUid: string; reason?: string },
    { ok: boolean; deletedClientIds: string[] }
>(functions, 'deleteUser');
import {
    Search, ChevronRight, CheckCircle2, AlertCircle, Plus, X, Trash2, UserCog,
    Shield, Users, Award, AlertTriangle, Eye, Ban, Apple,
} from 'lucide-react';
import clsx from 'clsx';
import { Category, Client, FitnessLevel } from '../types';
import { AddClientModal } from '../components/shared/AddClientModal';
import { AssignDietPicker } from '../components/diets/AssignDietPicker';

const CLIENT_CATEGORIES: { value: Category; color: string }[] = [
    { value: 'cutting', color: 'orange' },
    { value: 'bulking', color: 'blue' },
    { value: 'pro', color: 'purple' },
    { value: 'health', color: 'teal' },
];

const LEVEL_OPTIONS: { value: FitnessLevel; label_key: string; emoji: string; color: string }[] = [
    { value: 'beginner', label_key: 'beginner', emoji: '🟢', color: 'emerald' },
    { value: 'intermediate', label_key: 'intermediate', emoji: '🟡', color: 'yellow' },
    { value: 'pro_competitions', label_key: 'proCompetitions', emoji: '🔴', color: 'red' },
];

type Tab = 'coaching' | 'community';

export const Clients = () => {
    const { clients, removeClient, updateClient } = useData();
    const { members: communityMembers, loading: membersLoading } = useCommunityMembers();
    const { t: tStrict } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;
    const navigate = useNavigate();

    const [tab, setTab] = useState<Tab>('coaching');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
    const [levelFilter, setLevelFilter] = useState<'all' | FitnessLevel>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    /** Either a coaching Client or a community member — both have userId. */
    const [dietTarget, setDietTarget] = useState<{ userId: string; name: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
    const [confirmDeleteMember, setConfirmDeleteMember] = useState<CommunityMember | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Coaching tab: only show clients whose accessLevel is 'client' (or unset)
    const coachingClients = useMemo(
        () => clients.filter(c => (c.accessLevel ?? 'client') === 'client'),
        [clients]
    );

    const filteredCoaching = useMemo(() => {
        const q = search.toLowerCase();
        return coachingClients.filter(c => {
            const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
            const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
            const matchesLevel = levelFilter === 'all' || c.fitnessLevel === levelFilter;
            return matchesSearch && matchesCategory && matchesLevel;
        });
    }, [coachingClients, search, categoryFilter, levelFilter]);

    const filteredCommunity = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return communityMembers;
        return communityMembers.filter(m =>
            m.displayName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        );
    }, [communityMembers, search]);

    const categoryCounts = useMemo(() => {
        const counts: Record<Category | 'all', number> = {
            all: coachingClients.length,
            cutting: 0, bulking: 0, pro: 0, health: 0,
        };
        coachingClients.forEach(c => { counts[c.category] = (counts[c.category] ?? 0) + 1; });
        return counts;
    }, [coachingClients]);

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            // Full revocation: Auth + Firestore + audit log via Cloud Function.
            // Falls back to Firestore-only cascade for legacy clients without a userId.
            if (confirmDelete.userId) {
                await callDeleteUser({
                    targetUid: confirmDelete.userId,
                    reason: 'coach_removed_coaching_client',
                });
            } else {
                await removeClient(confirmDelete.id);
            }
            setConfirmDelete(null);
        } catch (e: any) {
            console.error('Failed to delete coaching client:', e);
            setDeleteError(e?.message ?? 'Delete failed. Check the browser console.');
        } finally {
            setDeleting(false);
        }
    };

    const handleChangeCategory = (client: Client, newCategory: Category) => {
        updateClient(client.id, { category: newCategory });
        setShowRoleModal(false);
        setSelectedClient(null);
    };

    const getCategoryLabel = (value: Category) => t(value as string) ?? value;
    const getCategoryColor = (category: Category) =>
        CLIENT_CATEGORIES.find(c => c.value === category)?.color ?? 'slate';

    // ── Delete community member ─────────────────────────────────────────────
    // Calls the `deleteUser` Cloud Function which:
    //   1. Deletes the Firebase Auth user (every token they hold becomes invalid).
    //   2. Cascades all Firestore data (users/, clients/, checkIns/, etc).
    //   3. Writes the audit log.
    // The previous client-side flow only flipped `disabled: true`, which left
    // the "still has app access via PWA bookmark" loophole.
    const handleDeleteMember = async () => {
        if (!confirmDeleteMember) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const uid = confirmDeleteMember.id;
            await callDeleteUser({
                targetUid: uid,
                reason: 'coach_removed_community',
            });
            setConfirmDeleteMember(null);
        } catch (e: any) {
            console.error('Failed to delete community member:', e);
            setDeleteError(e?.message ?? 'Delete failed. Check the browser console.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">{t('managementEyebrow') ?? 'Management'}</span>
                    <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                        {t('clientsTitle')}<span className="text-primary-container">.</span>
                    </h1>
                    <p className="text-on-surface/60 mt-4 font-body leading-relaxed max-w-xl">{t('clientsSubtitle')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={18} />
                        <input
                            type="text"
                            placeholder={t('searchClients')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl pl-11 pr-4 py-3 text-sm font-body text-on-surface placeholder-on-surface/30 w-full sm:w-64 transition-colors"
                        />
                    </div>
                    {tab === 'coaching' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 flex items-center justify-center gap-2 text-on-primary font-bold font-label text-[10px] uppercase tracking-widest rounded-xl bg-gradient-to-r from-primary to-primary-container shadow-[0_10px_30px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Plus size={16} /> {t('addClient')}
                        </button>
                    )}
                </div>
            </div>

            {/* Top-level Tabs */}
            <div className="flex gap-4 border-b border-outline-variant/30">
                <TabButton
                    active={tab === 'coaching'}
                    onClick={() => setTab('coaching')}
                    label={t('coachingClientsTab') ?? 'Coaching Clients'}
                    count={coachingClients.length}
                />
                <TabButton
                    active={tab === 'community'}
                    onClick={() => setTab('community')}
                    label={t('communityTab') ?? 'Community'}
                    count={communityMembers.length}
                />
            </div>

            {/* ─── COACHING TAB ─────────────────────────────────────────── */}
            {tab === 'coaching' && (
                <>
                    {/* Category counts row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CLIENT_CATEGORIES.map(cat => {
                            const count = categoryCounts[cat.value] ?? 0;
                            const isActive = categoryFilter === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => setCategoryFilter(isActive ? 'all' : cat.value)}
                                    className={clsx(
                                        'p-5 rounded-2xl transition-all text-left bg-surface-container-low border ghost-border',
                                        isActive ? `bg-${cat.color}-500/10 border-${cat.color}-500/30` : 'border-outline-variant/30 hover:border-primary/30'
                                    )}
                                >
                                    <div className={clsx('text-[10px] font-label font-bold uppercase tracking-widest mb-2', isActive ? `text-${cat.color}-400` : 'text-on-surface/40')}>
                                        {getCategoryLabel(cat.value)}
                                    </div>
                                    <div className="font-headline font-extrabold text-3xl text-on-surface">{count}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter chips: All / Cut / Bulk / Pro / Health */}
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                        <Chip
                            active={categoryFilter === 'all'}
                            onClick={() => setCategoryFilter('all')}
                            label={`${t('allClients') ?? 'All'} (${categoryCounts.all})`}
                        />
                        {CLIENT_CATEGORIES.map(cat => (
                            <Chip
                                key={cat.value}
                                active={categoryFilter === cat.value}
                                onClick={() => setCategoryFilter(cat.value)}
                                label={`${getCategoryLabel(cat.value)} (${categoryCounts[cat.value] ?? 0})`}
                            />
                        ))}
                    </div>

                    {/* Level filter */}
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                        <Chip
                            active={levelFilter === 'all'}
                            onClick={() => setLevelFilter('all')}
                            label={t('allLevels') ?? 'All levels'}
                            icon={<Award size={14} />}
                        />
                        {LEVEL_OPTIONS.map(lv => (
                            <Chip
                                key={lv.value}
                                active={levelFilter === lv.value}
                                onClick={() => setLevelFilter(levelFilter === lv.value ? 'all' : lv.value)}
                                label={`${lv.emoji} ${t(lv.label_key) ?? lv.label_key}`}
                            />
                        ))}
                    </div>

                    {/* List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredCoaching.map(client => {
                            const catColor = getCategoryColor(client.category);
                            const lv = LEVEL_OPTIONS.find(l => l.value === client.fitnessLevel);
                            return (
                                <div key={client.id} className="bg-surface-container-low rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-outline-variant/30 ghost-border transition-colors">
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className={clsx(
                                            'w-14 h-14 rounded-full flex items-center justify-center font-headline font-bold text-xl',
                                            `bg-${catColor}-500/10 text-${catColor}-400`
                                        )}>
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-headline font-bold text-on-surface text-xl mb-1">{client.name}</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 flex-wrap">
                                                <span className={clsx('px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/30', `text-${catColor}-400`)}>
                                                    {getCategoryLabel(client.category)}
                                                </span>
                                                {lv && (
                                                    <span className={clsx(`px-2.5 py-1 rounded-md border border-outline-variant/30 bg-${lv.color}-500/5 text-${lv.color}-400 flex items-center gap-1.5`)}>
                                                        {lv.emoji} {t(lv.label_key) ?? lv.label_key}
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>{t('week')} {client.currentWeek}</span>
                                                {client.isOnboarding && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-primary">{t('onboarding')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                        {client.needsReview ? (
                                            <div className="flex items-center gap-2 text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-[10px] font-label font-bold uppercase tracking-widest">
                                                <AlertCircle size={14} /> {t('needsReview')}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-[10px] font-label font-bold uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> {t('onTrack')}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDietTarget({ userId: client.userId, name: client.name })}
                                                className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-outline-variant/30"
                                                title={t('assignDiet') ?? 'Assign diet'}
                                            >
                                                <Apple size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedClient(client); setShowRoleModal(true); }}
                                                className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-outline-variant/30"
                                                title={t('manageClient') ?? 'Manage'}
                                            >
                                                <UserCog size={18} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(client)}
                                                className="p-3 rounded-xl bg-surface-container hover:bg-red-500/10 hover:text-red-400 text-on-surface/50 transition-colors border border-outline-variant/30"
                                                title={t('removeClient') ?? 'Remove'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/clients/${client.id}/review`)}
                                                className="px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface flex items-center gap-2 group transition-colors"
                                            >
                                                {t('view')} <ChevronRight size={16} className="text-on-surface/40 group-hover:text-primary transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredCoaching.length === 0 && (
                            <div className="text-center py-20 text-on-surface/40 font-body">
                                {t('noClientsFound') ?? 'No clients match these filters.'}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ─── COMMUNITY TAB ────────────────────────────────────────── */}
            {tab === 'community' && (
                <div className="grid grid-cols-1 gap-4">
                    {membersLoading && (
                        <div className="text-center py-12 text-on-surface/40 font-body">{t('loading') ?? 'Loading…'}</div>
                    )}
                    {!membersLoading && filteredCommunity.length === 0 && (
                        <div className="text-center py-20 text-on-surface/40 font-body">
                            {t('noCommunityMembers') ?? 'No community members yet.'}
                        </div>
                    )}
                    {filteredCommunity.map(member => (
                        <div
                            key={member.id}
                            className="bg-surface-container-low rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-outline-variant/30 ghost-border transition-colors"
                        >
                            <div className="flex items-center gap-5 w-full md:w-auto">
                                <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-headline font-bold text-xl">
                                    {(member.displayName ?? member.email).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-headline font-bold text-on-surface text-xl mb-1">{member.displayName}</h3>
                                    <div className="flex items-center gap-3 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40 flex-wrap">
                                        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            👥 {t('communityAccessLabel') ?? 'Community'}
                                        </span>
                                        <span className="normal-case tracking-normal">{member.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDietTarget({ userId: member.id, name: member.displayName ?? member.email })}
                                    className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-outline-variant/30"
                                    title={t('assignDiet') ?? 'Assign diet'}
                                >
                                    <Apple size={18} />
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteMember(member)}
                                    className="p-3 rounded-xl bg-surface-container hover:bg-red-500/10 hover:text-red-400 text-on-surface/50 transition-colors border border-outline-variant/30"
                                    title={t('removeMember') ?? 'Remove'}
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => navigate(`/users/${member.id}/view`)}
                                    className="px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface flex items-center gap-2 group transition-colors"
                                >
                                    <Eye size={16} /> {t('view') ?? 'View'}
                                    <ChevronRight size={16} className="text-on-surface/40 group-hover:text-primary transition-colors" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── MODALS ───────────────────────────────────────────────── */}
            {dietTarget && (
                <AssignDietPicker
                    clientUserId={dietTarget.userId}
                    clientName={dietTarget.name}
                    onClose={() => setDietTarget(null)}
                />
            )}
            {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} showProgramLength />}

            {/* Manage Client Modal (existing) */}
            {showRoleModal && selectedClient && (
                <div className="fixed inset-0 bg-surface/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-surface-container-high p-8 rounded-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200 ghost-border shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-headline font-bold text-on-surface">{t('manageClient') ?? 'Manage'}</h2>
                            <button onClick={() => { setShowRoleModal(false); setSelectedClient(null); }} className="text-on-surface/50 hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-container-highest">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-6">
                            {t('clientLabelText') ?? 'Client'} <strong className="text-on-surface">{selectedClient.name}</strong>
                        </p>
                        <div className="mb-8">
                            <h3 className="text-[10px] font-label font-bold uppercase text-on-surface/40 tracking-widest mb-3 flex items-center gap-2">
                                <Shield size={14} className="text-primary" /> {t('accessLevel') ?? 'Access level'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => updateClient(selectedClient.id, { accessLevel: 'client' })}
                                    className={clsx(
                                        'p-4 rounded-xl text-center transition-all border',
                                        (selectedClient.accessLevel || 'client') === 'client'
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface/50 hover:bg-surface-container'
                                    )}
                                >
                                    <Shield size={20} className="mx-auto mb-2" />
                                    <div className="text-[10px] font-label font-bold uppercase tracking-widest">{t('coachingAccessLabel') ?? 'Coaching'}</div>
                                    <div className="text-xs font-body text-on-surface/40 mt-1">{t('coachingAccessDesc') ?? ''}</div>
                                </button>
                                <button
                                    onClick={() => updateClient(selectedClient.id, { accessLevel: 'community' })}
                                    className={clsx(
                                        'p-4 rounded-xl text-center transition-all border',
                                        selectedClient.accessLevel === 'community'
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface/50 hover:bg-surface-container'
                                    )}
                                >
                                    <Users size={20} className="mx-auto mb-2" />
                                    <div className="text-[10px] font-label font-bold uppercase tracking-widest">{t('communityAccessLabel') ?? 'Community'}</div>
                                    <div className="text-xs font-body text-on-surface/40 mt-1">{t('communityAccessDesc') ?? ''}</div>
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-label font-bold uppercase text-on-surface/40 tracking-widest mb-3">
                                {t('programCategory') ?? 'Program category'}
                            </h3>
                            <div className="space-y-2">
                                {CLIENT_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => handleChangeCategory(selectedClient, cat.value)}
                                        className={clsx(
                                            'w-full p-4 rounded-xl text-left flex items-center justify-between transition-all border text-sm font-body',
                                            selectedClient.category === cat.value
                                                ? `bg-${cat.color}-500/15 border-${cat.color}-500/40 text-on-surface`
                                                : 'bg-surface-container-lowest text-on-surface/60 border-outline-variant/30 hover:bg-surface-container'
                                        )}
                                    >
                                        <span className="font-bold">{getCategoryLabel(cat.value)}</span>
                                        {selectedClient.category === cat.value && (
                                            <CheckCircle2 className={`text-${cat.color}-400`} size={18} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowRoleModal(false); setSelectedClient(null); }}
                            className="w-full mt-8 px-6 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all"
                        >
                            {t('done') ?? 'Done'}
                        </button>
                    </div>
                </div>
            )}

                {/* Hard-delete Confirmation Modal — BioZackTeam red, requires explicit ack */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                    <div
                        className="p-8 rounded-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 border border-red-500/30 shadow-2xl"
                        style={{ background: 'linear-gradient(145deg, rgba(40,10,10,0.9), rgba(20,5,5,0.95))' }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/20">
                                <AlertTriangle className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-headline font-bold text-on-surface">{t('deleteClientTitle') ?? 'Delete client?'}</h2>
                                <p className="text-[10px] font-label font-bold uppercase tracking-widest text-red-400 mt-1">
                                    {t('deletePermanent') ?? 'This is permanent.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-5 mb-6 space-y-1">
                            <div className="text-on-surface font-headline font-bold text-lg">{confirmDelete.name}</div>
                            <div className="text-sm font-body text-on-surface/60">{confirmDelete.email}</div>
                        </div>

                        <ul className="text-sm font-body text-on-surface/70 space-y-3 mb-6 ps-1">
                            <li className="flex gap-3"><span className="text-red-400 font-bold">•</span> {t('deleteRevokesAccess') ?? 'Revokes web app access immediately.'}</li>
                            <li className="flex gap-3"><span className="text-red-400 font-bold">•</span> {t('deleteRemovesData') ?? 'Removes their client record and all weekly check-ins.'}</li>
                            <li className="flex gap-3"><span className="text-red-400 font-bold">•</span> {t('deleteAuditNote') ?? 'Logged in the coach audit trail.'}</li>
                        </ul>

                        {deleteError && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-body flex items-start gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span className="break-words">{deleteError}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                                disabled={deleting}
                                className="flex-1 px-6 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all"
                            >
                                {t('cancel') ?? 'Cancel'}
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="flex-1 px-6 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-red-600 hover:bg-red-500 border border-red-500 disabled:opacity-60 transition-all shadow-[0_5px_15px_rgba(220,38,38,0.3)]"
                            >
                                {deleting ? (t('deleting') ?? 'Deleting…') : (t('confirmDelete') ?? 'Delete forever')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Community Member Confirmation Modal */}
            {confirmDeleteMember && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                    <div
                        className="p-8 rounded-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 border border-red-500/30 shadow-2xl"
                        style={{ background: 'linear-gradient(145deg, rgba(40,10,10,0.9), rgba(20,5,5,0.95))' }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/20">
                                <Ban className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-headline font-bold text-on-surface">{t('removeMemberTitle') ?? 'Remove member?'}</h2>
                                <p className="text-[10px] font-label font-bold uppercase tracking-widest text-red-400 mt-1">
                                    {t('deletePermanent') ?? 'This is permanent.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-5 mb-6 space-y-1">
                            <div className="text-on-surface font-headline font-bold text-lg">{confirmDeleteMember.displayName}</div>
                            <div className="text-sm font-body text-on-surface/60">{confirmDeleteMember.email}</div>
                        </div>

                        <ul className="text-sm font-body text-on-surface/70 space-y-3 mb-6 ps-1">
                            <li className="flex gap-3"><span className="text-red-400 font-bold">•</span> {t('deleteRevokesAccess') ?? 'Revokes web app access immediately.'}</li>
                            <li className="flex gap-3"><span className="text-red-400 font-bold">•</span> {t('deleteBansFromPlatform') ?? 'Blocks them from signing in again.'}</li>
                            <li className="flex gap-3"><span className="text-red-400 font-bold">•</span> {t('deleteAuditNote') ?? 'Logged in the coach audit trail.'}</li>
                        </ul>

                        {deleteError && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-body flex items-start gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span className="break-words">{deleteError}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setConfirmDeleteMember(null); setDeleteError(null); }}
                                disabled={deleting}
                                className="flex-1 px-6 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all"
                            >
                                {t('cancel') ?? 'Cancel'}
                            </button>
                            <button
                                onClick={handleDeleteMember}
                                disabled={deleting}
                                className="flex-1 px-6 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-red-600 hover:bg-red-500 border border-red-500 disabled:opacity-60 transition-all shadow-[0_5px_15px_rgba(220,38,38,0.3)]"
                            >
                                {deleting ? (t('deleting') ?? 'Removing…') : (t('confirmRemove') ?? 'Remove forever')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Local primitives ───────────────────────────────────────────────
function TabButton({ active, onClick, label, count }: {
    active: boolean; onClick: () => void; label: string; count: number;
}) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'relative px-6 py-4 text-[10px] font-label font-bold uppercase tracking-widest transition-colors flex items-center gap-2',
                active ? 'text-primary' : 'text-on-surface/50 hover:text-on-surface'
            )}
        >
            <span>{label}</span>
            <span className={clsx(
                'text-[9px] px-2 py-0.5 rounded-md font-bold',
                active ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container text-on-surface/40'
            )}>{count}</span>
            {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-container shadow-[0_0_10px_rgba(230,195,100,0.5)]" />
            )}
        </button>
    );
}

function Chip({ active, onClick, label, icon }: {
    active: boolean; onClick: () => void; label: string; icon?: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'px-5 py-2.5 rounded-full text-[10px] font-label font-bold uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-1.5',
                active
                    ? 'bg-primary text-on-primary border-primary shadow-[0_5px_15px_rgba(230,195,100,0.2)]'
                    : 'bg-surface-container-lowest text-on-surface/60 border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
            )}
        >
            {icon}{label}
        </button>
    );
}
