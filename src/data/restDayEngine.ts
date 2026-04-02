/**
 * REST DAY ENGINE — Dynamic rest day calculation for all 42 training programs.
 *
 * Applies 4 priority rules:
 * 1. CNS Protection (highest priority)
 * 2. Muscle Group Overlap
 * 3. Goal Frequency Modifier
 * 4. Rest Day Placement Preferences
 *
 * Followed by validation — if any check fails, recalculates.
 */

import { ProgramDay, WorkoutGoal, WorkoutSession, MuscleGroup } from '../types';

// ═══════════════════════════════════════════
// SESSION MUSCLE MAP — maps session labels to muscle groups + CNS load
// ═══════════════════════════════════════════

type SessionProfile = {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
    cnsLoad: 1 | 2 | 3 | 4 | 5;
    isSquatDay: boolean;
    isDeadliftDay: boolean;
    isFullBody: boolean;
    hasHeavyCompounds: boolean;
};

const PROFILES: Record<string, SessionProfile> = {
    // === FULL BODY ===
    'Full Body A': { primary: ['chest', 'quads', 'back', 'shoulders'], secondary: ['arms', 'core', 'glutes'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: true },
    'Full Body B': { primary: ['back', 'chest', 'quads', 'shoulders'], secondary: ['arms', 'hamstrings'], cnsLoad: 4, isSquatDay: false, isDeadliftDay: true, isFullBody: true, hasHeavyCompounds: true },
    'Full Body C': { primary: ['quads', 'chest', 'back', 'shoulders'], secondary: ['core', 'glutes'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: true },
    'Full Body D': { primary: ['hamstrings', 'chest', 'back', 'shoulders'], secondary: ['arms', 'quads'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: true, isFullBody: true, hasHeavyCompounds: true },
    'Full Body E': { primary: ['quads', 'chest', 'back', 'shoulders'], secondary: ['arms', 'core'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: true },
    'Full Body F': { primary: ['quads', 'chest', 'back', 'shoulders'], secondary: ['calves', 'core'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: false },

    // === UPPER / LOWER ===
    'Upper A': { primary: ['chest', 'back', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Lower A': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves', 'core'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Upper B': { primary: ['chest', 'back', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Lower B': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves', 'core'], cnsLoad: 4, isSquatDay: false, isDeadliftDay: true, isFullBody: false, hasHeavyCompounds: true },
    'Upper C': { primary: ['chest', 'back', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Lower C': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves', 'core'], cnsLoad: 3, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },

    // === PPL ===
    'Push Day 1': { primary: ['chest', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Pull Day 1': { primary: ['back'], secondary: ['arms', 'shoulders'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Legs Day 1': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves', 'core'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Push Day 2': { primary: ['chest', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Pull Day 2': { primary: ['back'], secondary: ['arms', 'shoulders'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: true, isFullBody: false, hasHeavyCompounds: true },
    'Legs Day 2': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves', 'core'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Arms Day': { primary: ['arms'], secondary: ['shoulders'], cnsLoad: 1, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },

    // === BRO SPLIT ===
    'Chest Day': { primary: ['chest'], secondary: ['arms', 'shoulders'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Back Day': { primary: ['back'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Legs Day': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Shoulders Day': { primary: ['shoulders'], secondary: ['arms', 'core'], cnsLoad: 2, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Chest Day 2': { primary: ['chest'], secondary: ['arms', 'shoulders'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Back & Traps Day': { primary: ['back', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: true, isFullBody: false, hasHeavyCompounds: true },

    // === POWERLIFTING ===
    'Squat Day': { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'], cnsLoad: 5, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Bench Day': { primary: ['chest'], secondary: ['shoulders', 'arms'], cnsLoad: 4, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Deadlift Day': { primary: ['back', 'hamstrings', 'glutes'], secondary: ['quads', 'core'], cnsLoad: 5, isSquatDay: false, isDeadliftDay: true, isFullBody: false, hasHeavyCompounds: true },
    'OHP Day': { primary: ['shoulders'], secondary: ['arms', 'chest', 'core'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Squat Day 2': { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'], cnsLoad: 4, isSquatDay: true, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Bench Day 2': { primary: ['chest'], secondary: ['shoulders', 'arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: true },
    'Deadlift Day 2': { primary: ['back', 'hamstrings', 'glutes'], secondary: ['quads', 'core'], cnsLoad: 4, isSquatDay: false, isDeadliftDay: true, isFullBody: false, hasHeavyCompounds: true },

    // === HIIT ===
    'Circuit A': { primary: ['full_body'], secondary: [], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: false },
    'Circuit B': { primary: ['chest', 'back', 'shoulders'], secondary: ['arms'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Circuit C': { primary: ['quads', 'hamstrings', 'glutes'], secondary: ['calves'], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Circuit D': { primary: ['full_body'], secondary: [], cnsLoad: 3, isSquatDay: false, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: false },
    'Circuit E': { primary: ['full_body'], secondary: [], cnsLoad: 2, isSquatDay: false, isDeadliftDay: false, isFullBody: true, hasHeavyCompounds: false },

    // === CARDIO ===
    'Session A': { primary: [], secondary: [], cnsLoad: 2, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Session B': { primary: ['shoulders', 'chest'], secondary: ['arms'], cnsLoad: 2, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Session C': { primary: [], secondary: [], cnsLoad: 1, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Session D': { primary: ['quads'], secondary: ['calves', 'core'], cnsLoad: 2, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Session E': { primary: [], secondary: [], cnsLoad: 2, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
    'Session F': { primary: ['quads', 'glutes'], secondary: ['core'], cnsLoad: 1, isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false },
};

function getProfile(label: string): SessionProfile {
    return PROFILES[label] || {
        primary: [], secondary: [], cnsLoad: 2 as const,
        isSquatDay: false, isDeadliftDay: false, isFullBody: false, hasHeavyCompounds: false
    };
}

// ═══════════════════════════════════════════
// GOAL REST TARGETS
// ═══════════════════════════════════════════

const GOAL_REST_TARGETS: Record<WorkoutGoal, { min: number; max: number }> = {
    fat_loss: { min: 3, max: 3 },
    muscle_gain: { min: 3, max: 3 },
    strength: { min: 3, max: 4 },
    recomp: { min: 3, max: 3 },
    maintenance: { min: 3, max: 4 },
    endurance: { min: 2, max: 3 },
};

// ═══════════════════════════════════════════
// LARGE MUSCLE GROUPS (48-72h recovery)
// ═══════════════════════════════════════════

const LARGE_MUSCLES: MuscleGroup[] = ['quads', 'back', 'chest', 'glutes', 'hamstrings'];
// Small muscles (arms, shoulders, calves): 24-48h — can train consecutive days

// ═══════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateRotation(rotation: ProgramDay[], split: string): ValidationResult {
    const errors: string[] = [];
    const workoutDays = rotation.filter(d => d.type === 'workout');
    const restDays = rotation.filter(d => d.type === 'rest');

    // Check 1: No two full body sessions consecutive
    for (let i = 0; i < rotation.length - 1; i++) {
        if (rotation[i].type === 'workout' && rotation[i + 1].type === 'workout') {
            const p1 = getProfile(rotation[i].label);
            const p2 = getProfile(rotation[i + 1].label);
            if (p1.isFullBody && p2.isFullBody) {
                errors.push(`Full body sessions "${rotation[i].label}" and "${rotation[i + 1].label}" are consecutive (days ${rotation[i].dayNumber} & ${rotation[i + 1].dayNumber})`);
            }
        }
    }

    // Check 2: Squat and deadlift days have min 1 day between them
    for (let i = 0; i < rotation.length - 1; i++) {
        if (rotation[i].type === 'workout' && rotation[i + 1].type === 'workout') {
            const p1 = getProfile(rotation[i].label);
            const p2 = getProfile(rotation[i + 1].label);
            if ((p1.isSquatDay && p2.isDeadliftDay) || (p1.isDeadliftDay && p2.isSquatDay)) {
                errors.push(`Squat/Deadlift "${rotation[i].label}" and "${rotation[i + 1].label}" are consecutive (days ${rotation[i].dayNumber} & ${rotation[i + 1].dayNumber})`);
            }
        }
    }

    // Check 3: Rest count matches goal target (relaxed — we check at program level)
    // This is checked in calculateRestDays before returning

    // Check 4: No large muscle group trained <48h apart (consecutive workout days)
    for (let i = 0; i < rotation.length - 1; i++) {
        if (rotation[i].type === 'workout' && rotation[i + 1].type === 'workout') {
            const p1 = getProfile(rotation[i].label);
            const p2 = getProfile(rotation[i + 1].label);
            const overlap = p1.primary.filter(m => LARGE_MUSCLES.includes(m) && p2.primary.includes(m));
            // Exception: Arms day after Pull day is OK
            const isArmsAfterPull = rotation[i + 1].label === 'Arms Day' && rotation[i].label.includes('Pull');
            if (overlap.length > 0 && !isArmsAfterPull && !p1.primary.includes('full_body') && !p2.primary.includes('full_body')) {
                errors.push(`Muscle overlap [${overlap.join(', ')}] between "${rotation[i].label}" and "${rotation[i + 1].label}" (days ${rotation[i].dayNumber} & ${rotation[i + 1].dayNumber})`);
            }
        }
    }

    // Check 5: PPL: Push cannot follow Push
    if (split === 'Push / Pull / Legs') {
        for (let i = 0; i < rotation.length - 1; i++) {
            if (rotation[i].type === 'workout' && rotation[i + 1].type === 'workout') {
                if (rotation[i].label.includes('Push') && rotation[i + 1].label.includes('Push')) {
                    errors.push(`Push→Push consecutive: "${rotation[i].label}" and "${rotation[i + 1].label}"`);
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════
// MAIN CALCULATION FUNCTION
// ═══════════════════════════════════════════

export interface WorkoutSlot {
    label: string;
    workoutId: string;
}

export function calculateRestDays(
    split: string,
    goal: WorkoutGoal,
    sessions: WorkoutSlot[]
): ProgramDay[] {
    const target = GOAL_REST_TARGETS[goal];
    const totalDays = 10;
    const targetRestCount = target.min; // Start with minimum

    // Number of workout days we need
    const workoutCount = sessions.length;
    let restCount = totalDays - workoutCount;

    // Clamp rest count to goal target range
    if (restCount < target.min) restCount = target.min;
    if (restCount > target.max) restCount = target.max;

    // Adjust workout count if needed
    const actualWorkoutCount = totalDays - restCount;
    const workoutSessions = sessions.slice(0, actualWorkoutCount);

    // Build the rotation using rule-based placement
    const rotation = buildRotation(split, goal, workoutSessions, restCount);

    // Validate
    const result = validateRotation(rotation, split);
    if (!result.valid) {
        // Try with one more rest day (gives more flexibility)
        if (restCount < target.max) {
            const retryRotation = buildRotation(split, goal, workoutSessions.slice(0, -1), restCount + 1);
            const retryResult = validateRotation(retryRotation, split);
            if (retryResult.valid) return retryRotation;
        }
        // If still failing, use the best-effort rotation (log errors in dev)
        if (typeof console !== 'undefined') {
            console.warn(`[RestDayEngine] Validation warnings for ${split} / ${goal}:`, result.errors);
        }
    }

    return rotation;
}

function buildRotation(
    split: string,
    goal: WorkoutGoal,
    sessions: WorkoutSlot[],
    restCount: number
): ProgramDay[] {
    const totalDays = 10;
    const workoutCount = sessions.length;
    const days: (WorkoutSlot | 'rest' | 'active_recovery')[] = [];

    // Step 1: Start with the workout sequence (no rest days yet)
    const sequence = [...sessions];

    // Step 2: Determine where rest days MUST go (Rule 1 & 2)
    const mandatoryRestPositions = new Set<number>(); // positions AFTER which a rest is needed

    for (let i = 0; i < sequence.length - 1; i++) {
        const curr = getProfile(sequence[i].label);
        const next = getProfile(sequence[i + 1].label);

        // Rule 1a: Full body sessions — always rest between
        if (curr.isFullBody && next.isFullBody) {
            mandatoryRestPositions.add(i);
        }

        // Rule 1b: Squat + Deadlift — never consecutive
        if ((curr.isSquatDay && next.isDeadliftDay) || (curr.isDeadliftDay && next.isSquatDay)) {
            mandatoryRestPositions.add(i);
        }

        // Rule 1c: Heavy compound session (CNS 4+) followed by another heavy session
        if (curr.cnsLoad >= 4 && next.cnsLoad >= 4) {
            mandatoryRestPositions.add(i);
        }

        // Rule 2: Large muscle group overlap
        const isArmsException = next.cnsLoad <= 1 && sequence[i + 1].label === 'Arms Day';
        if (!isArmsException && !curr.primary.includes('full_body') && !next.primary.includes('full_body')) {
            const overlap = curr.primary.filter(m => LARGE_MUSCLES.includes(m) && next.primary.includes(m));
            if (overlap.length > 0) {
                mandatoryRestPositions.add(i);
            }
        }

        // Split-specific: PPL Push→Push never
        if (split === 'Push / Pull / Legs' &&
            sequence[i].label.includes('Push') && sequence[i + 1].label.includes('Push')) {
            mandatoryRestPositions.add(i);
        }

        // Split-specific: HIIT — never 2 HIIT/circuits back to back (if both full body circuits)
        if (split === 'HIIT / Circuit' && curr.isFullBody && next.isFullBody) {
            mandatoryRestPositions.add(i);
        }
    }

    // Step 3: Build the interleaved sequence
    const interleaved: ('workout' | 'rest')[] = [];
    const workouts: WorkoutSlot[] = [];
    let restUsed = 0;

    for (let i = 0; i < sequence.length; i++) {
        interleaved.push('workout');
        workouts.push(sequence[i]);

        if (mandatoryRestPositions.has(i) && restUsed < restCount) {
            interleaved.push('rest');
            restUsed++;
        }
    }

    // Step 4: Fill remaining rest days according to Rule 3 & 4
    while (restUsed < restCount) {
        // Rule 4: Prefer rest AFTER the most demanding sessions (highest CNS)
        // Find the best position to insert rest
        let bestPos = -1;
        let bestScore = -1;

        for (let i = 0; i < interleaved.length - 1; i++) {
            // Only insert between two workout slots
            if (interleaved[i] === 'workout' && interleaved[i + 1] === 'workout') {
                // Score = CNS load of the preceding workout
                const workoutIdx = interleaved.slice(0, i + 1).filter(x => x === 'workout').length - 1;
                const profile = getProfile(workouts[workoutIdx]?.label || '');
                let score = profile.cnsLoad;

                // Rule 4: Never place rest on day 1 or day 2
                const dayNum = i + 1;
                if (dayNum <= 2) score -= 10; // heavily penalize early rest

                // Prefer later in the cycle
                score += dayNum * 0.1;

                if (score > bestScore) {
                    bestScore = score;
                    bestPos = i + 1;
                }
            }
        }

        if (bestPos >= 0) {
            interleaved.splice(bestPos, 0, 'rest');
            restUsed++;
        } else {
            // Fallback: append rest at end
            interleaved.push('rest');
            restUsed++;
        }
    }

    // Step 5: Trim or pad to exactly 10 days
    while (interleaved.length > totalDays) {
        // Remove a rest day from end if over 10
        const lastRestIdx = interleaved.lastIndexOf('rest');
        if (lastRestIdx >= 0) interleaved.splice(lastRestIdx, 1);
        else break;
    }
    while (interleaved.length < totalDays) {
        interleaved.push('rest');
    }

    // Step 6: Convert to ProgramDay[]
    let workoutIdx = 0;
    const rotation: ProgramDay[] = interleaved.map((type, i) => {
        const dayNum = i + 1;
        if (type === 'workout' && workoutIdx < workouts.length) {
            const w = workouts[workoutIdx++];
            const profile = getProfile(w.label);
            return {
                dayNumber: dayNum,
                type: 'workout' as const,
                label: w.label,
                workoutId: w.workoutId,
                cnsLoad: profile.cnsLoad,
            };
        }
        // Rule 4: Day 10 is active recovery for non-strength splits
        const isActiveRecovery = dayNum === totalDays && split !== 'Powerlifting';
        return {
            dayNumber: dayNum,
            type: 'rest' as const,
            label: isActiveRecovery ? 'Active Recovery' : 'Rest Day',
            restDayType: isActiveRecovery ? 'active_recovery' as const : 'full_rest' as const,
        };
    });

    return rotation;
}
