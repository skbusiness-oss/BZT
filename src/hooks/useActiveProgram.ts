/**
 * useActiveProgram — Save/load/complete program tracking.
 *
 * Uses localStorage first (key: activeProgram_{userId})
 * with Firestore mirror for persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { UserActiveProgram, ProgramDay } from '../types';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { awardXp, XP_SOURCE } from '../lib/activityScore';

interface UseActiveProgramReturn {
    activeProgram: UserActiveProgram | null;
    loading: boolean;
    save: (program: UserActiveProgram) => Promise<void>;
    completeDay: (dayNumber: number) => Promise<void>;
    deleteProgram: () => Promise<void>;
    todaysDayNumber: number;
    getTodaysDay: () => ProgramDay | null;
    canDelete: boolean;
}

function getStorageKey(userId: string): string {
    return `activeProgram_${userId}`;
}

export function useActiveProgram(): UseActiveProgramReturn {
    const { user } = useAuth();
    const [activeProgram, setActiveProgram] = useState<UserActiveProgram | null>(null);
    const [loading, setLoading] = useState(true);

    // Live subscription so coach-assigned programs land on the client's
    // dashboard immediately. localStorage is used only as a warm-start cache.
    useEffect(() => {
        if (!user) {
            setActiveProgram(null);
            setLoading(false);
            return;
        }

        // Warm-start from localStorage so the UI doesn't flash empty.
        const key = getStorageKey(user.id);
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                setActiveProgram(JSON.parse(stored) as UserActiveProgram);
            } catch { /* ignore */ }
        }

        const docRef = doc(db, 'userPrograms', user.id);
        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data() as UserActiveProgram;
                setActiveProgram(data);
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                setActiveProgram(null);
                localStorage.removeItem(key);
            }
            setLoading(false);
        }, (err) => {
            console.warn('[useActiveProgram] Firestore subscription failed:', err);
            setLoading(false);
        });

        return unsub;
    }, [user]);

    // Save to localStorage + Firestore
    const save = useCallback(async (program: UserActiveProgram) => {
        if (!user) return;

        const key = getStorageKey(user.id);
        localStorage.setItem(key, JSON.stringify(program));
        setActiveProgram(program);

        // Mirror to Firestore
        try {
            await setDoc(doc(db, 'userPrograms', user.id), {
                ...program,
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            console.warn('[useActiveProgram] Firestore write failed:', err);
        }
    }, [user]);

    // Complete a day
    const completeDay = useCallback(async (dayNumber: number) => {
        if (!user || !activeProgram) return;

        const alreadyCompleted = activeProgram.completedDays.includes(dayNumber);
        if (alreadyCompleted) return;

        const newCompletedDays = [...activeProgram.completedDays, dayNumber].sort((a, b) => a - b);

        // Check if cycle is complete (all 10 days done)
        const totalDays = activeProgram.rotation.length;
        const allDaysCompleted = newCompletedDays.length >= totalDays;

        let updatedProgram: UserActiveProgram;

        if (allDaysCompleted) {
            // Cycle complete — increment cycle, reset completed days
            updatedProgram = {
                ...activeProgram,
                currentCycle: activeProgram.currentCycle + 1,
                completedDays: [],
            };
        } else {
            updatedProgram = {
                ...activeProgram,
                completedDays: newCompletedDays,
            };
        }

        await save(updatedProgram);
        // Idempotent — one WORKOUT_DAY award per (programId, cycle, day).
        await awardXp(
            user.id,
            XP_SOURCE.WORKOUT_DAY,
            `${activeProgram.programId}-c${activeProgram.currentCycle}-d${dayNumber}`,
        );
    }, [user, activeProgram, save]);

    // Delete program
    const deleteProgram = useCallback(async () => {
        if (!user) return;
        if (activeProgram?.assignedByCoach) return; // Cannot delete coach-assigned

        const key = getStorageKey(user.id);
        localStorage.removeItem(key);
        setActiveProgram(null);

        try {
            await deleteDoc(doc(db, 'userPrograms', user.id));
        } catch (err) {
            console.warn('[useActiveProgram] Firestore delete failed:', err);
        }
    }, [user, activeProgram]);

    // Calculate today's day number (next uncompleted day)
    const todaysDayNumber = (() => {
        if (!activeProgram) return 1;
        const completed = new Set(activeProgram.completedDays);
        for (let i = 1; i <= activeProgram.rotation.length; i++) {
            if (!completed.has(i)) return i;
        }
        return 1; // All done, start from 1 (next cycle)
    })();

    // Get today's day data
    const getTodaysDay = useCallback((): ProgramDay | null => {
        if (!activeProgram) return null;
        return activeProgram.rotation.find(d => d.dayNumber === todaysDayNumber) ?? null;
    }, [activeProgram, todaysDayNumber]);

    const canDelete = !activeProgram?.assignedByCoach;

    return {
        activeProgram,
        loading,
        save,
        completeDay,
        deleteProgram,
        todaysDayNumber,
        getTodaysDay,
        canDelete,
    };
}
