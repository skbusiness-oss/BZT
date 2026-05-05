import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { levelFromScore } from '../lib/activityScore';
import { Trophy, Flame, Medal } from 'lucide-react';

type Tab = 'all' | 'community' | 'coaching';

interface Entry {
    uid: string;
    name: string;
    role: string;
    activityScore: number;
    streak: number;
}

export const Leaderboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const isCoach = user?.role === 'coach' || user?.role === 'admin';
    const [tab, setTab] = useState<Tab>('all');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const base = collection(db, 'publicProfiles');
        const filtered = tab === 'all'
            ? query(base, orderBy('activityScore', 'desc'), limit(50))
            : tab === 'coaching'
                ? query(base, where('role', '==', 'client'), orderBy('activityScore', 'desc'), limit(50))
                : query(base, where('role', '==', 'community'), orderBy('activityScore', 'desc'), limit(50));

        const unsub = onSnapshot(filtered, (snap) => {
            setEntries(snap.docs.map(d => {
                const data = d.data();
                return {
                    uid: d.id,
                    name: data.name ?? 'Athlete',
                    role: data.role ?? 'community',
                    activityScore: typeof data.activityScore === 'number' ? data.activityScore : 0,
                    streak: data.streak?.current ?? 0,
                };
            }).filter(e => e.activityScore > 0));
            setLoading(false);
        }, () => setLoading(false));

        return unsub;
    }, [tab]);

    const meIndex = entries.findIndex(e => e.uid === user?.id);
    const tabs: { value: Tab; labelKey: 'leaderboardTabAll' | 'leaderboardTabCommunity' | 'leaderboardTabCoaching' }[] = [
        { value: 'all', labelKey: 'leaderboardTabAll' },
        { value: 'community', labelKey: 'leaderboardTabCommunity' },
        { value: 'coaching', labelKey: 'leaderboardTabCoaching' },
    ];

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <header className="mb-8">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('leaderboardEyebrow')}
                </span>
                <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter">
                    {t('leaderboardTitle')}<span className="text-primary">.</span>
                </h1>
                <p className="text-on-surface-variant text-sm mt-3">
                    {t('leaderboardSubtitle')}
                </p>
            </header>

            {/* Role-split tabs — coaches only. Regular users see one combined list. */}
            {isCoach && (
                <div className="flex gap-2 mb-6">
                    {tabs.map(({ value, labelKey }) => (
                        <button
                            key={value}
                            onClick={() => setTab(value)}
                            className={
                                'px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ' +
                                (tab === value
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/30')
                            }
                        >
                            {t(labelKey)}
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="text-center py-12 text-on-surface-variant">{t('loadingEllipsis')}</div>
            )}

            {!loading && entries.length === 0 && (
                <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                    <Trophy size={32} className="text-on-surface-variant mx-auto mb-4" />
                    <p className="text-on-surface-variant text-sm">{t('noScoresYet')}</p>
                </div>
            )}

            {!loading && entries.length > 0 && (
                <ol className="space-y-2">
                    {entries.map((e, i) => {
                        const isMe = e.uid === user?.id;
                        const rank = i + 1;
                        return (
                            <li
                                key={e.uid}
                                className={
                                    'flex items-center gap-4 p-4 rounded-2xl border transition-colors ' +
                                    (isMe
                                        ? 'bg-primary/10 border-primary/40'
                                        : 'bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/40')
                                }
                            >
                                <div className={
                                    'w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm shrink-0 ' +
                                    (rank === 1 ? 'bg-primary text-on-primary'
                                        : rank === 2 ? 'bg-on-surface-variant/30 text-on-surface'
                                            : rank === 3 ? 'bg-primary-container/40 text-on-surface'
                                                : 'bg-surface-container text-on-surface-variant')
                                }>
                                    {rank <= 3 ? <Medal size={16} /> : rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-on-surface truncate">{e.name}</p>
                                        {isMe && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('youLabel')}</span>
                                        )}
                                        {e.role === 'client' && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('coachingTag')}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant">
                                        {t('levelLabel')} {levelFromScore(e.activityScore)} · {e.activityScore.toLocaleString()} {t('xpUnit')}
                                    </p>
                                </div>
                                {e.streak > 0 && (
                                    <div className="flex items-center gap-1.5 text-primary text-sm font-bold">
                                        <Flame size={14} />
                                        {e.streak}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}

            {meIndex < 0 && user && !loading && entries.length > 0 && (
                <p className="text-center text-on-surface-variant text-xs mt-6">
                    {t('notOnBoardYet')}
                </p>
            )}
        </div>
    );
};
