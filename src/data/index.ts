// BIOZAKC Complete Training Encyclopedia
// 42 Programs × 7 Splits × 6 Goals = ~264 Individual Workouts

import { Workout } from '../types';
import { FULL_BODY_PROGRAMS } from './trainingPrograms';
import { UPPER_LOWER_PROGRAMS } from './upperLowerPrograms';
import { PPL_PROGRAMS } from './pplPrograms';
import { BRO_SPLIT_PROGRAMS } from './broSplitPrograms';
import { STRENGTH_PROGRAMS } from './strengthPrograms';
import { HIIT_PROGRAMS, CARDIO_PROGRAMS } from './hiitCardioPrograms';
import { STRETCHING_PROGRAMS } from './stretchingPrograms';
export { ALL_PROGRAMS } from './programData';

export const ALL_TRAINING_PROGRAMS: Workout[] = [
    ...FULL_BODY_PROGRAMS,
    ...UPPER_LOWER_PROGRAMS,
    ...PPL_PROGRAMS,
    ...BRO_SPLIT_PROGRAMS,
    ...STRENGTH_PROGRAMS,
    ...HIIT_PROGRAMS,
    ...CARDIO_PROGRAMS,
    ...STRETCHING_PROGRAMS,
];

