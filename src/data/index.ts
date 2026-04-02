// BIOZAKC Complete Training Encyclopedia
// 42 Programs × 7 Splits × 6 Goals = ~264 Individual Workouts

import { Workout } from '../types';
import { FULL_BODY_PROGRAMS } from './trainingPrograms';
import { UPPER_LOWER_PROGRAMS } from './upperLowerPrograms';
import { PPL_PROGRAMS } from './pplPrograms';
import { BRO_SPLIT_PROGRAMS } from './broSplitPrograms';
import { STRENGTH_PROGRAMS } from './strengthPrograms';
import { HIIT_PROGRAMS, CARDIO_PROGRAMS } from './hiitCardioPrograms';
export { ALL_PROGRAMS } from './programData';

export const ALL_TRAINING_PROGRAMS: Workout[] = [
    ...FULL_BODY_PROGRAMS,
    ...UPPER_LOWER_PROGRAMS,
    ...PPL_PROGRAMS,
    ...BRO_SPLIT_PROGRAMS,
    ...STRENGTH_PROGRAMS,
    ...HIIT_PROGRAMS,
    ...CARDIO_PROGRAMS,
];

// Global rules that apply to all programs
export const GLOBAL_TRAINING_RULES = {
    warmUp: 'Proper full body warm up + one light warm-up set before each exercise',
    restBetween: '90–180 seconds between sets until fully recovered',
    restPause: 'On the 2nd set of marked exercises — hold 3 seconds at peak contraction on every rep',
    setsScheme: 'Set 1 = 5–9 reps @ 80% max (strength) | Set 2 = 10–15 reps @ 60% max (hypertrophy)',
    progress: 'Track every weight and rep — beat the previous session every time',
    rotation: '10-day cycle — repeat indefinitely',
};
