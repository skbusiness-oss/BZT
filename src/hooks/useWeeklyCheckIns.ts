import { useEffect, useState, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { awardXp, XP_SOURCE } from '../lib/activityScore';
import { useAuth } from '../context/AuthContext';

/**
 * Weekly weigh-in + metrics check-in.
 *
 * Data model:
 *   - `users/{uid}/weighIns/{date}` — weight + week metadata.
 *   - `users/{uid}/metrics/{date}` — subjective + cardio metrics.
 *   - `users/{uid}/selfLogs/{date}` — kept as a sidecar marker for the
 *     existing `awardXp` Cloud Function (source: 'SELF_LOG'). Once the
 *     function is updated to read from `weighIns`, this can be dropped.
 *   - `users/{uid}.currentWeightKg` — mirrored on every submit so anything
 *     reading the user doc (Profile row, diet wizard, dashboard) reflects
 *     the latest weight.
 *
 * Everything is written in a single `writeBatch`, so a submit is atomic —
 * the user can never end up with a weigh-in without metrics (or vice
 * versa). `locked: true` on create is paired with the Firestore rule
 * `resource.data.locked != true`, making the lock server-enforced.
 *
 * Cadence: 7-day rolling window from the most recent submission date.
 * Lock detection here is *defense-in-depth*; the rules above are the
 * source of truth.
 */

export interface WeighInEntry {
    date: string;          // doc id = YYYY-MM-DD
    weight: number;
    weekStart?: string;
    locked?: boolean;
    createdAt?: unknown;
}

export interface MetricsEntry {
    date: string;
    strength?: number;
    hunger?: number;
    energy?: number;
    cardioCalories?: number;
    notes?: string;
    weekStart?: string;
    locked?: boolean;
    createdAt?: unknown;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const weekStartISO = () => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
};

export function useWeeklyCheckIns(targetUserId?: string) {
    const { user } = useAuth();
    const uid = targetUserId ?? user?.id;
    const isOwner = !!user && uid === user.id;

    const [weighIns, setWeighIns] = useState<WeighInEntry[]>([]);
    const [metrics, setMetrics] = useState<MetricsEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setWeighIns([]);
            setMetrics([]);
            setLoading(false);
            return;
        }
        const wQ = query(
            collection(db, 'users', uid, 'weighIns'),
            orderBy('createdAt', 'asc')
        );
        const mQ = query(
            collection(db, 'users', uid, 'metrics'),
            orderBy('createdAt', 'asc')
        );
        let gotWeighIns = false;
        let gotMetrics = false;
        const markReady = () => {
            if (gotWeighIns && gotMetrics) setLoading(false);
        };
        const unsubW = onSnapshot(wQ, (snap) => {
            setWeighIns(snap.docs.map(d => ({ date: d.id, ...(d.data() as Omit<WeighInEntry, 'date'>) })));
            gotWeighIns = true;
            markReady();
        }, (err) => {
            // Previously silent. A failing query left `weighIns` empty and
            // the chart fell into its empty state with no console
            // explanation. Now we surface the Firestore error code so a
            // rules/index/network failure is immediately visible.
            // eslint-disable-next-line no-console
            console.error('[useWeeklyCheckIns] weighIns listener failed:', (err as { code?: string })?.code ?? '(no code)', err);
            gotWeighIns = true;
            markReady();
        });
        const unsubM = onSnapshot(mQ, (snap) => {
            setMetrics(snap.docs.map(d => ({ date: d.id, ...(d.data() as Omit<MetricsEntry, 'date'>) })));
            gotMetrics = true;
            markReady();
        }, (err) => {
            // Same as above — surface the error instead of silently empty.
            // eslint-disable-next-line no-console
            console.error('[useWeeklyCheckIns] metrics listener failed:', (err as { code?: string })?.code ?? '(no code)', err);
            gotMetrics = true;
            markReady();
        });
        return () => { unsubW(); unsubM(); };
    }, [uid]);

    /**
     * Submit a weekly check-in: weight + all subjective metrics in one go.
     * Atomic via Firestore writeBatch — both docs land or neither does.
     */
    const submit = useCallback(async (input: {
        weight: number;
        strength: number;
        hunger: number;
        energy: number;
        cardioCalories: number;
        notes?: string;
    }) => {
        if (!isOwner || !uid) throw new Error('Read-only: cannot write for another user.');
        const date = todayISO();
        const weekStart = weekStartISO();
        const ts = serverTimestamp();

        // Canonical writes go in a writeBatch — atomic. The legacy
        // `selfLogs` sidecar is intentionally NOT in this batch because a
        // stale locked doc from a prior app version (the old combined
        // schema) would cause the UPDATE rule to reject — and an atomic
        // batch fails as a whole, which would also wipe out the new
        // weighIn + metrics writes. The sidecar is best-effort, written
        // after the batch lands.
        const batch = writeBatch(db);

        batch.set(doc(db, 'users', uid, 'weighIns', date), {
            weight: input.weight,
            weekStart,
            locked: true,
            createdAt: ts,
        });

        const metricsPayload: Record<string, unknown> = {
            strength: input.strength,
            hunger: input.hunger,
            energy: input.energy,
            cardioCalories: input.cardioCalories,
            weekStart,
            locked: true,
            createdAt: ts,
        };
        if (input.notes) metricsPayload.notes = input.notes;
        batch.set(doc(db, 'users', uid, 'metrics', date), metricsPayload);

        // Mirror the latest weight onto the user doc so Profile.tsx,
        // CommunityBioZackTeam, and the diet wizard all reflect the latest
        // weigh-in without a fresh user-doc refetch.
        batch.update(doc(db, 'users', uid), {
            currentWeightKg: input.weight,
            updatedAt: ts,
        });

        // Log everything we're about to write so a future permission-denied
        // is easy to triage. Remove once the schema is settled.
        // eslint-disable-next-line no-console
        console.log('[useWeeklyCheckIns] batch.commit start', {
            uid, date, weekStart,
            weight: input.weight,
            metrics: {
                strength: input.strength, hunger: input.hunger,
                energy: input.energy, cardioCalories: input.cardioCalories,
            },
        });
        try {
            await batch.commit();
            // eslint-disable-next-line no-console
            console.log('[useWeeklyCheckIns] batch.commit OK');
        } catch (err) {
            const code = (err as { code?: string })?.code ?? '(no code)';
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error('[useWeeklyCheckIns] batch.commit FAILED', code, msg, err);
            throw err;
        }

        // Sidecar selfLogs marker — for legacy chart fallback + so the
        // existing `awardXp` Cloud Function (source: SELF_LOG) finds an
        // existing doc to verify against. Best-effort: a stale locked doc
        // from the old combined schema will reject under the UPDATE rule
        // (`resource.data.locked != true`); that's fine because the doc
        // already EXISTS, which is all the XP function needs.
        setDoc(doc(db, 'users', uid, 'selfLogs', date), {
            date,
            weight: input.weight,
            period: 'weekly',
            weekStart,
            locked: true,
            createdAt: ts,
            updatedAt: ts,
        }, { merge: true }).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[useWeeklyCheckIns] selfLogs sidecar skipped:', err);
        });

        // Idempotent — one SELF_LOG award per (uid, date). Doesn't depend
        // on the sidecar succeeding above; the doc need only exist.
        await awardXp(uid, XP_SOURCE.SELF_LOG, date);
    }, [isOwner, uid]);

    return { weighIns, metrics, loading, submit, isOwner };
}
