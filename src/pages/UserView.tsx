import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { SelfTrackingPanel } from '../components/dashboard/SelfTrackingPanel';
import { ClientInfoPanel } from '../components/checkin/ClientInfoPanel';
import { CheckInCompare } from '../components/checkin/CheckInCompare';
import { ArrowLeft, Loader2, Eye, Info, GitCompareArrows, Calendar, Shield, Award, User } from 'lucide-react';
import type { Role } from '../types';
import clsx from 'clsx';

interface ViewedUser {
    id: string;
    displayName: string;
    email: string;
    role: Role;
}

const LEVEL_BADGE: Record<string, { emoji: string; color: string }> = {
    beginner: { emoji: '🟢', color: 'emerald' },
    intermediate: { emoji: '🟡', color: 'yellow' },
    pro_competitions: { emoji: '🔴', color: 'red' },
};

/**
 * Coach-only read-only view of a user's profile, check-in data, and self-tracking.
 * Route: /users/:userId/view
 */
export const UserView = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { t: tStrict } = useLanguage();
    const t = tStrict as unknown as (k: string) => string | undefined;
    const { clients, getClientWeeks } = useData();

    const [target, setTarget] = useState<ViewedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showCompare, setShowCompare] = useState(false);

    // Find the client record (if this user is a coaching client)
    const client = useMemo(
        () => clients.find(c => c.userId === userId),
        [clients, userId]
    );
    const weeks = client ? getClientWeeks(client.id) : [];

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'users', userId));
                if (!snap.exists()) {
                    setNotFound(true);
                } else {
                    const d = snap.data();
                    setTarget({
                        id: userId,
                        displayName: d.displayName ?? d.email ?? 'User',
                        email: d.email ?? '',
                        role: d.role as Role,
                    });
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (notFound || !target) {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center text-on-surface/50 font-body">
                <p>{t('userNotFound') || 'User not found.'}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-[10px] font-label font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors">
                    {t('back') || 'Back'}
                </button>
            </div>
        );
    }

    const lv = client?.fitnessLevel ? LEVEL_BADGE[client.fitnessLevel] : null;
    const catColor = client?.category === 'cutting' ? 'orange'
        : client?.category === 'bulking' ? 'blue'
        : client?.category === 'pro' ? 'purple'
        : client?.category === 'health' ? 'teal'
        : 'slate';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface/50 hover:text-on-surface text-[10px] font-label font-bold uppercase tracking-widest transition-colors">
                    <ArrowLeft size={16} /> {t('back') || 'Back'}
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/20 bg-primary/10 text-primary text-[10px] font-label font-bold uppercase tracking-widest">
                    <Eye size={14} /> {t('readOnlyView') || 'Read-only view'}
                </div>
            </div>

            {/* Profile card */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 ghost-border shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-3xl font-headline font-bold text-primary shadow-inner border border-outline-variant/30">
                            {target.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">{target.displayName}</h1>
                            <p className="text-sm font-body text-on-surface/50">{target.email}</p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className="inline-flex items-center text-[10px] uppercase tracking-widest font-label font-bold px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/30 text-on-surface/60">
                                    {target.role}
                                </span>
                                {client && (
                                    <>
                                        <span className={clsx('px-2.5 py-1 rounded-md text-[10px] font-label font-bold uppercase tracking-widest border border-outline-variant/30', `bg-${catColor}-500/10 text-${catColor}-400`)}>
                                            {client.category}
                                        </span>
                                        {lv && (
                                            <span className={clsx(`px-2.5 py-1 rounded-md text-[10px] font-label font-bold uppercase tracking-widest border border-outline-variant/30 bg-${lv.color}-500/5 text-${lv.color}-400 flex items-center gap-1.5`)}>
                                                {lv.emoji} {t(client.fitnessLevel as any) ?? client.fitnessLevel}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40">
                                            {t('week') ?? 'Week'} {client.currentWeek}/{client.programLength}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {client && (
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={() => setShowInfo(true)}
                                className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors"
                                title={t('info') ?? 'Info'}
                            >
                                <Info size={18} />
                            </button>
                            {weeks.length >= 2 && (
                                <button
                                    onClick={() => setShowCompare(!showCompare)}
                                    className={clsx(
                                        'p-3 rounded-xl border transition-colors',
                                        showCompare 
                                            ? 'bg-primary/10 text-primary border-primary/30' 
                                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                                    )}
                                    title={t('compareCheckIns') ?? 'Compare'}
                                >
                                    <GitCompareArrows size={18} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Client stats summary — only for coaching clients */}
            {client && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-on-surface/40 mb-2 font-label uppercase tracking-widest text-[10px] font-bold">
                            <Calendar size={14} className="text-primary" />
                            <span>{t('week') ?? 'Week'}</span>
                        </div>
                        <div className="text-2xl font-headline font-bold text-on-surface">
                            {client.currentWeek} <span className="text-on-surface/40 text-base font-normal">/ {client.programLength}</span>
                        </div>
                    </div>
                    <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-on-surface/40 mb-2 font-label uppercase tracking-widest text-[10px] font-bold">
                            <Shield size={14} className="text-primary" />
                            <span>{t('accessLevel') ?? 'Access'}</span>
                        </div>
                        <div className="text-2xl font-headline font-bold text-on-surface capitalize">
                            {client.accessLevel ?? 'client'}
                        </div>
                    </div>
                    <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-on-surface/40 mb-2 font-label uppercase tracking-widest text-[10px] font-bold">
                            <Award size={14} className="text-primary" />
                            <span>{t('fitnessLevel') ?? 'Level'}</span>
                        </div>
                        <div className="text-2xl font-headline font-bold text-on-surface">
                            {lv?.emoji} {t(client.fitnessLevel as any) ?? client.fitnessLevel ?? '--'}
                        </div>
                    </div>
                    <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-on-surface/40 mb-2 font-label uppercase tracking-widest text-[10px] font-bold">
                            <User size={14} className="text-primary" />
                            <span>{t('status') ?? 'Status'}</span>
                        </div>
                        <div className={clsx('text-xl font-headline font-bold', client.needsReview ? 'text-primary' : 'text-emerald-400')}>
                            {client.needsReview ? (t('needsReview') ?? 'Needs review') : (t('onTrack') ?? 'On track')}
                        </div>
                    </div>
                </div>
            )}

            {/* Compare check-ins (toggled) */}
            {showCompare && weeks.length >= 2 && (
                <CheckInCompare weeks={weeks} />
            )}

            {/* Self-tracking data */}
            <SelfTrackingPanel targetUserId={userId} />

            {/* Client Info Modal */}
            {showInfo && client && (
                <ClientInfoPanel client={client} weeks={weeks} onClose={() => setShowInfo(false)} />
            )}
        </div>
    );
};
