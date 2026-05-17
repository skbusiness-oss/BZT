/**
 * useAssignedDiet — read the signed-in user's currently-assigned diet plan.
 *
 * Live subscription to `userDiets/{user.id}` mirroring the workout-side
 * `useActiveProgram` shape. Returns the assigned plan id, the snapshot
 * (the structural fields needed for cards: name, kcal, macros, mealsPerDay,
 * pdfUrl), and a loading flag.
 *
 * Used by surfaces that need to know "does this user have an active plan,
 * and which one":
 *   - TodayDietCard (deep-link from dashboard)
 *   - Diets.tsx (active-plan hero)
 *   - PlanDetail.tsx (replace-confirm banner)
 *   - DietWizard Step 4 (replace-confirm banner)
 *
 * Coach surfaces that read a *different* user's userDiets doc (e.g.
 * CoachReview reading the client's plan) keep using their ad-hoc
 * onSnapshot — this hook is scoped to the signed-in user.
 */
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import type { UserDiet } from '../types';

interface UseAssignedDietReturn {
    /** Plan id from `userDiets/{uid}.dietId`. Undefined if no plan assigned yet. */
    assignedDietId: string | undefined;
    /** Snapshot of the plan at assignment time. Insulates the UI from later catalog edits. */
    snapshot: UserDiet['snapshot'] | undefined;
    loading: boolean;
}

export function useAssignedDiet(): UseAssignedDietReturn {
    const { user } = useAuth();
    const [assignedDietId, setAssignedDietId] = useState<string | undefined>(undefined);
    const [snapshot, setSnapshot] = useState<UserDiet['snapshot'] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setAssignedDietId(undefined);
            setSnapshot(undefined);
            setLoading(false);
            return;
        }
        const ref = doc(db, 'userDiets', user.id);
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const data = snap.data() as UserDiet;
                setAssignedDietId(data.dietId);
                setSnapshot(data.snapshot);
            } else {
                setAssignedDietId(undefined);
                setSnapshot(undefined);
            }
            setLoading(false);
        }, (err) => {
            console.warn('[useAssignedDiet] subscription failed:', err);
            setLoading(false);
        });
        return unsub;
    }, [user]);

    return { assignedDietId, snapshot, loading };
}
