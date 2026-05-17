import { useEffect, useState, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { awardXp, XP_SOURCE } from '../lib/activityScore';
import { useAuth } from '../context/AuthContext';

export interface BodyMeasurements {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
    neck?: number;
}

interface DailyMetrics {
    strength?: number;       // 1-10
    hunger?: number;         // 1-10
    energy?: number;         // 1-10
    cardioCalories?: number; // 0-2000
}

interface SelfLog {
    id: string;          // normally date/weekStart (YYYY-MM-DD)
    date: string;        // YYYY-MM-DD
    weight?: number;     // kg
    measurements?: BodyMeasurements;
    metrics?: DailyMetrics;
    notes?: string;
    period?: 'daily' | 'weekly';
    weekStart?: string;
    weekIndex?: number;
    locked?: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

/**
 * Self-tracked weight & body measurements for a user.
 *
 * - `targetUserId` defaults to the signed-in user (own logs).
 * - When a coach passes another user's id, the hook is read-only —
 *   `addLog`/`deleteLog` will reject. Firestore rules also enforce this.
 */
export function useSelfLogs(targetUserId?: string) {
    const { user } = useAuth();
    const uid = targetUserId ?? user?.id;
    const isOwner = !!user && uid === user.id;

    const [logs, setLogs] = useState<SelfLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLogs([]);
            setLoading(false);
            return;
        }
        const q = query(
            collection(db, 'users', uid, 'selfLogs'),
            orderBy('date', 'asc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setLogs(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SelfLog, 'id'>) })));
            setLoading(false);
        }, (err) => {
            // Previously this callback was silent. A failing query (rules,
            // index, network) would leave `logs` empty and the chart would
            // render its empty state with no explanation. Surfacing the
            // error tells us exactly which gate is closed.
            // eslint-disable-next-line no-console
            console.error('[useSelfLogs] listener failed:', (err as { code?: string })?.code ?? '(no code)', err);
            setLoading(false);
        });
        return unsub;
    }, [uid]);

    const addLog = useCallback(async (input: Omit<SelfLog, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isOwner || !uid) throw new Error('Read-only: cannot write logs for another user.');
        if (!input.date) throw new Error('date is required');
        const ref = doc(db, 'users', uid, 'selfLogs', input.date);
        // Strip undefined to satisfy hasOnly() rule
        const payload: Record<string, unknown> = {
            date: input.date,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        if (input.weight !== undefined) payload.weight = input.weight;
        if (input.measurements) payload.measurements = input.measurements;
        if (input.metrics) payload.metrics = input.metrics;
        if (input.notes) payload.notes = input.notes;
        if (input.period) payload.period = input.period;
        if (input.weekStart) payload.weekStart = input.weekStart;
        if (input.weekIndex !== undefined) payload.weekIndex = input.weekIndex;
        if (input.locked !== undefined) payload.locked = input.locked;
        await setDoc(ref, payload, { merge: true });
        // Idempotent — one SELF_LOG award per (uid, date).
        await awardXp(uid, XP_SOURCE.SELF_LOG, input.date);
    }, [isOwner, uid]);

    const deleteLog = useCallback(async (logId: string) => {
        if (!isOwner || !uid) throw new Error('Read-only: cannot delete logs for another user.');
        await deleteDoc(doc(db, 'users', uid, 'selfLogs', logId));
    }, [isOwner, uid]);

    return { logs, loading, addLog, deleteLog, isOwner };
}
