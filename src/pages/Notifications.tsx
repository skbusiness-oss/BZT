/**
 * Notifications — the user-facing inbox for coach broadcasts.
 *
 * Listens to broadcasts/ in real-time. Filters client-side to the
 * subset visible to this user (community sees 'all' + 'community' +
 * 'both'; client sees 'all' + 'coaching' + 'both'; coach sees all).
 *
 * Mark-as-read: on mount, writes serverTimestamp to
 * users/{uid}.lastBroadcastReadAt. The bell icon in the Layout top
 * bar reads that same field to compute its unread badge count.
 *
 * Deep-linked from notification taps (the SW's notificationclick
 * handler navigates to /notifications) so a tap from the lock screen
 * lands here with the unread badge cleared.
 */
import { useEffect, useMemo, useState } from 'react';
import {
    collection, query, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, Users } from 'lucide-react';
import type { Broadcast, BroadcastAudience } from '../types';

const visibleFor = (role: string | undefined): BroadcastAudience[] => {
    if (role === 'coach' || role === 'admin') return ['all', 'community', 'coaching', 'both'];
    if (role === 'client') return ['all', 'coaching', 'both'];
    if (role === 'community') return ['all', 'community', 'both'];
    return ['all'];
};

export const Notifications = () => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const [rows, setRows] = useState<Broadcast[]>([]);

    // Real-time broadcasts feed.
    useEffect(() => {
        const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(50));
        const unsub = onSnapshot(q,
            (snap) => {
                setRows(snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<Broadcast, 'id'>),
                })));
            },
            (err) => {
                // eslint-disable-next-line no-console
                console.warn('[notifications] snapshot error:', err);
            }
        );
        return unsub;
    }, []);

    // Mark all read on mount. Stamping serverTimestamp on
    // users/{uid}.lastBroadcastReadAt clears the bell icon's badge in
    // Layout because that listener compares the field to each
    // broadcast's createdAt.
    useEffect(() => {
        if (!user) return;
        updateDoc(doc(db, 'users', user.id), {
            lastBroadcastReadAt: serverTimestamp(),
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[notifications] mark-read failed:', err);
        });
    }, [user]);

    const visible = useMemo(() => {
        const allowed = new Set(visibleFor(user?.role));
        return rows.filter((r) => allowed.has(r.audience));
    }, [rows, user?.role]);

    const audienceLabel = (a: BroadcastAudience): string => {
        if (a === 'community') return t('notificationsAudienceCommunity');
        if (a === 'coaching')  return t('notificationsAudienceCoaching');
        return t('notificationsAudienceAll');
    };

    const formatTime = (ts: unknown): string => {
        const d = ts instanceof Date
            ? ts
            : (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function')
                ? (ts as { toDate: () => Date }).toDate()
                : (typeof ts === 'string' ? new Date(ts) : null);
        if (!d || isNaN(d.getTime())) return '—';
        const locale = isRTL ? 'ar-EG' : 'en-US';
        return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) +
            '، ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('navNotifications')}
                </span>
                <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter mb-3">
                    {t('notificationsPageTitle')}
                </h1>
                <p className="text-on-surface/60 font-body text-sm md:text-base leading-relaxed">
                    {t('notificationsPageSub')}
                </p>
            </header>

            {visible.length === 0 ? (
                <div
                    className="rounded-3xl p-10 text-center"
                    style={{
                        background: 'rgb(var(--surface-container-low) / 0.65)',
                        border: '1px solid rgb(var(--outline-variant) / 0.30)',
                    }}
                >
                    <Bell size={32} className="mx-auto mb-3 text-on-surface/30" />
                    <p className="text-on-surface/60 font-body text-sm max-w-md mx-auto">
                        {t('notificationsEmpty')}
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {visible.map((b) => (
                        <li
                            key={b.id}
                            className="rounded-2xl p-5 border"
                            style={{
                                background: 'rgb(var(--surface-container-low) / 0.75)',
                                borderColor: 'rgb(var(--outline-variant) / 0.30)',
                            }}
                        >
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-8 h-8 rounded-full flex items-center justify-center font-headline font-bold text-[12px] shrink-0"
                                        style={{
                                            background: 'rgb(var(--primary) / 0.18)',
                                            color: 'rgb(var(--primary))',
                                            border: '1px solid rgb(var(--primary) / 0.30)',
                                        }}
                                    >
                                        {(b.senderName || 'C').slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="font-headline font-bold text-on-surface text-[14px]">
                                        {b.senderName || t('dashCoachName')}
                                    </span>
                                </span>
                                <span className="text-[11px] font-body text-on-surface/45 shrink-0">
                                    {formatTime(b.createdAt)}
                                </span>
                            </div>
                            <p className="font-body text-[14.5px] text-on-surface/85 leading-relaxed whitespace-pre-wrap mb-3">
                                {b.body}
                            </p>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-primary">
                                <Users size={11} /> {audienceLabel(b.audience)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
