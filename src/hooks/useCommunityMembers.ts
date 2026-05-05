import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface CommunityMember {
    id: string;
    displayName: string;
    email: string;
    disabled?: boolean;
    createdAt?: unknown;
}

/**
 * Lists all community members. Coach-only — Firestore rules deny non-coaches.
 * Filters out disabled accounts client-side.
 */
export function useCommunityMembers() {
    const { isCoach } = useAuth();
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isCoach) { setMembers([]); setLoading(false); return; }

        const q = query(collection(db, 'users'), where('role', '==', 'community'));
        const unsub = onSnapshot(q, (snap) => {
            const rows: CommunityMember[] = snap.docs
                .map(d => ({ id: d.id, ...(d.data() as Omit<CommunityMember, 'id'>) }))
                .filter(m => !m.disabled);
            setMembers(rows);
            setLoading(false);
        }, () => setLoading(false));
        return unsub;
    }, [isCoach]);

    return { members, loading };
}
