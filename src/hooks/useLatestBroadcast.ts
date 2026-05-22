/**
 * useLatestBroadcast — subscribe to the single most-recent broadcast
 * that's visible to the current user's role. Returns null while the
 * snapshot hasn't landed and when no broadcast exists.
 *
 * Reads broadcasts/ ordered by createdAt desc, limit 1, with a
 * client-side role-audience filter applied after the snapshot lands.
 * (Audience filter is client-side rather than via Firestore where()
 * because we want a single query that works for all roles — pushing
 * the filter into the query would require N separate listeners for
 * the four audience values.)
 *
 * Used by:
 *   - ClientDashboard CommunityActivityCard
 *   - CommunityBioZackTeam CommunityActivityCard
 *
 * Both surfaces want the same single "what's new from Coach Zaki"
 * snippet so the hook is the obvious shared dependency.
 */
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Broadcast, BroadcastAudience } from '../types';

function visibleFor(role: string | undefined): Set<BroadcastAudience> {
    if (role === 'coach' || role === 'admin') return new Set(['all', 'community', 'coaching', 'both']);
    if (role === 'client') return new Set(['all', 'coaching', 'both']);
    if (role === 'community') return new Set(['all', 'community', 'both']);
    return new Set(['all']);
}

export function useLatestBroadcast(userRole: string | undefined): Broadcast | null {
    const [latest, setLatest] = useState<Broadcast | null>(null);

    useEffect(() => {
        // Pull the last 5 so even if a few aren't in the user's audience
        // we still find one. Five is far more than needed in practice
        // (coach sends a handful per week, most are 'all' or 'both')
        // but cheap and avoids the empty-state edge case where the very
        // newest broadcast is targeted at the OTHER role.
        const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(5));
        const unsub = onSnapshot(q,
            (snap) => {
                const allowed = visibleFor(userRole);
                const visible = snap.docs
                    .map((d) => ({ id: d.id, ...(d.data() as Omit<Broadcast, 'id'>) }))
                    .find((b) => allowed.has(b.audience));
                setLatest(visible ?? null);
            },
            () => setLatest(null)
        );
        return unsub;
    }, [userRole]);

    return latest;
}
