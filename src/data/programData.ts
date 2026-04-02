/**
 * PROGRAM DATA — 42 Training Programs
 * 
 * Uses calculateRestDays() from the rest day engine to dynamically
 * generate 10-day rotations with intelligent rest day placement.
 */

import { TrainingProgram, WorkoutGoal } from '../types';
import { calculateRestDays, WorkoutSlot } from './restDayEngine';

const GLOBAL_RULES = [
    'Proper full body warm up + one light warm-up set before each exercise',
    '90–180 seconds rest between sets until fully recovered',
    'REST PAUSE: On marked exercises — hold 3 seconds at peak contraction on every rep',
    'Set 1 = 5–9 reps @ 80% max (strength) | Set 2 = 10–15 reps @ 60% max (hypertrophy)',
    'Track every weight and rep — beat the previous session every time',
    '10-day rotation — repeat indefinitely',
];

function prog(id: string, name: string, split: string, goal: WorkoutGoal, desc: string, sessions: WorkoutSlot[]): TrainingProgram {
    const rotation = calculateRestDays(split, goal, sessions);
    return { id, name, split, goal, description: desc, rotation, rules: GLOBAL_RULES };
}

// Helper: create session slots from id base + offset + labels
function slots(labels: string[], idBase: string, idOffset: number): WorkoutSlot[] {
    return labels.map((label, i) => ({ label, workoutId: `${idBase}${idOffset + i}` }));
}

// ═══════════════════════════════════════
// FULL BODY — 6 sessions per cycle
// ═══════════════════════════════════════
const FB_LABELS = ['Full Body A', 'Full Body B', 'Full Body C', 'Full Body D', 'Full Body E', 'Full Body F'];

const FB_PROGRAMS: TrainingProgram[] = [
    prog('prog1', 'Fat Loss — Full Body', 'Full Body', 'fat_loss',
        'Metabolic full body training for maximum calorie burn. High-rep circuits, supersets, and HIIT finishers.',
        slots(FB_LABELS, 'tp', 100)),
    prog('prog2', 'Muscle Gain — Full Body', 'Full Body', 'muscle_gain',
        'Progressive overload full body hypertrophy. Heavy compounds with REST PAUSE intensity techniques.',
        slots(FB_LABELS, 'tp', 106)),
    prog('prog3', 'Strength — Full Body', 'Full Body', 'strength',
        'Low-rep, heavy compound strength program. Peaking cycles with max effort days.',
        slots(FB_LABELS, 'tp', 112)),
    prog('prog4', 'Recomposition — Full Body', 'Full Body', 'recomp',
        'Dual-set strength + volume approach. S1 for strength, S2 for hypertrophy on every compound.',
        slots(FB_LABELS, 'tp', 118)),
    prog('prog5', 'Maintenance — Full Body', 'Full Body', 'maintenance',
        'Moderate volume maintenance training. Stay strong while recovering or dieting.',
        slots(FB_LABELS, 'tp', 124)),
    prog('prog6', 'Endurance — Full Body', 'Full Body', 'endurance',
        'High-rep endurance circuits. Timed sets, AMRaPs, and lactate threshold training.',
        slots(FB_LABELS, 'tp', 130)),
];

// ═══════════════════════════════════════
// UPPER/LOWER — 6 sessions per cycle
// ═══════════════════════════════════════
const UL_LABELS = ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Upper C', 'Lower C'];

const UL_PROGRAMS: TrainingProgram[] = [
    prog('prog7', 'Fat Loss — Upper/Lower', 'Upper / Lower', 'fat_loss',
        'Alternating upper/lower fat loss split. REST PAUSE intensity on isolation moves.',
        slots(UL_LABELS, 'ul', 200)),
    prog('prog8', 'Muscle Gain — Upper/Lower', 'Upper / Lower', 'muscle_gain',
        'Classic upper/lower hypertrophy split. Heavy compounds + REST PAUSE isolation.',
        slots(UL_LABELS, 'ul', 206)),
    prog('prog9', 'Strength — Upper/Lower', 'Upper / Lower', 'strength',
        'Strength-focused upper/lower with percentage-based loading. Peaking through the cycle.',
        slots(UL_LABELS, 'ul', 212)),
    prog('prog10', 'Recomposition — Upper/Lower', 'Upper / Lower', 'recomp',
        'Dual-set recomp upper/lower. Strength sets followed by hypertrophy volume.',
        slots(UL_LABELS, 'ul', 218)),
    prog('prog11', 'Maintenance — Upper/Lower', 'Upper / Lower', 'maintenance',
        'Moderate volume maintenance upper/lower. Preserve muscle with less volume.',
        slots(UL_LABELS, 'ul', 224)),
    prog('prog12', 'Endurance — Upper/Lower', 'Upper / Lower', 'endurance',
        'High-rep endurance upper/lower. Timed circuits and short rest periods.',
        slots(UL_LABELS, 'ul', 230)),
];

// ═══════════════════════════════════════
// PPL — 7 sessions per cycle
// ═══════════════════════════════════════
const PPL_LABELS = ['Push Day 1', 'Pull Day 1', 'Legs Day 1', 'Push Day 2', 'Pull Day 2', 'Legs Day 2', 'Arms Day'];

const PPL_PROGRAMS: TrainingProgram[] = [
    prog('prog13', 'Fat Loss — Push/Pull/Legs', 'Push / Pull / Legs', 'fat_loss',
        'High-volume PPL split for fat loss. REST PAUSE on all isolation, HIIT finishers included.',
        slots(PPL_LABELS, 'ppl', 300)),
    prog('prog14', 'Muscle Gain — Push/Pull/Legs', 'Push / Pull / Legs', 'muscle_gain',
        'Classic PPL hypertrophy. Dual set schemes with REST PAUSE intensity on set 2.',
        slots(PPL_LABELS, 'ppl', 307)),
    prog('prog15', 'Strength — Push/Pull/Legs', 'Push / Pull / Legs', 'strength',
        'Strength-focused PPL with percentage-based loading on main lifts.',
        slots(PPL_LABELS, 'ppl', 314)),
    prog('prog16', 'Recomposition — Push/Pull/Legs', 'Push / Pull / Legs', 'recomp',
        'Dual-set recomp PPL. Strength + hypertrophy sets on every compound lift.',
        slots(PPL_LABELS, 'ppl', 321)),
    prog('prog17', 'Maintenance — Push/Pull/Legs', 'Push / Pull / Legs', 'maintenance',
        'Moderate volume maintenance PPL. Preserve gains with reduced volume.',
        slots(PPL_LABELS, 'ppl', 328)),
    prog('prog18', 'Endurance — Push/Pull/Legs', 'Push / Pull / Legs', 'endurance',
        'High-rep endurance PPL. 20+ reps, short rest, cardio finishers.',
        slots(PPL_LABELS, 'ppl', 335)),
];

// ═══════════════════════════════════════
// BRO SPLIT — 7 sessions per cycle
// ═══════════════════════════════════════
const BRO_LABELS = ['Chest Day', 'Back Day', 'Legs Day', 'Shoulders Day', 'Arms Day', 'Chest Day 2', 'Back & Traps Day'];

const BRO_PROGRAMS: TrainingProgram[] = [
    prog('prog19', 'Fat Loss — Bro Split', 'Bro Split', 'fat_loss',
        'Classic bro split optimized for fat loss. REST PAUSE isolation and abs circuits.',
        slots(BRO_LABELS, 'bro', 400)),
    prog('prog20', 'Muscle Gain — Bro Split', 'Bro Split', 'muscle_gain',
        'High-volume bro split for maximum hypertrophy. REST PAUSE and drop sets.',
        slots(BRO_LABELS, 'bro', 407)),
    prog('prog21', 'Strength — Bro Split', 'Bro Split', 'strength',
        'Strength-focused bro split. Heavy percentage-based loading on each muscle group.',
        slots(BRO_LABELS, 'bro', 414)),
    prog('prog22', 'Recomposition — Bro Split', 'Bro Split', 'recomp',
        'Dual-set bro split for recomposition. Strength + hypertrophy on every session.',
        slots(BRO_LABELS, 'bro', 421)),
    prog('prog23', 'Maintenance — Bro Split', 'Bro Split', 'maintenance',
        'Low-volume bro split maintenance. Preserve size with reduced work.',
        slots(BRO_LABELS, 'bro', 428)),
    prog('prog24', 'Endurance — Bro Split', 'Bro Split', 'endurance',
        'High-rep bro split endurance. 20+ reps, short rests, cardio finishers.',
        slots(BRO_LABELS, 'bro', 435)),
];

// ═══════════════════════════════════════
// POWERLIFTING — 7 sessions per cycle
// ═══════════════════════════════════════
const STR_LABELS = ['Squat Day', 'Bench Day', 'Deadlift Day', 'OHP Day', 'Squat Day 2', 'Bench Day 2', 'Deadlift Day 2'];

const STR_PROGRAMS: TrainingProgram[] = [
    prog('prog25', 'Fat Loss — Powerlifting', 'Powerlifting', 'fat_loss',
        'Powerlifting split for fat loss. Maintain strength while cutting with HIIT finishers.',
        slots(STR_LABELS, 'str', 500)),
    prog('prog26', 'Muscle Gain — Powerlifting (Powerbuilding)', 'Powerlifting', 'muscle_gain',
        'Powerbuilding hybrid. Heavy main lifts + backoff hypertrophy sets with REST PAUSE.',
        slots(STR_LABELS, 'str', 507)),
    prog('prog27', 'Pure Strength — Powerlifting', 'Powerlifting', 'strength',
        'Competition-style powerlifting. Heavy singles, doubles, triples with peaking.',
        slots(STR_LABELS, 'str', 514)),
    prog('prog28', 'Recomposition — Powerlifting', 'Powerlifting', 'recomp',
        'Powerlifting recomp. Dual-set strength + hypertrophy on main lifts.',
        slots(STR_LABELS, 'str', 521)),
    prog('prog29', 'Maintenance — Powerlifting', 'Powerlifting', 'maintenance',
        'Low-volume powerlifting maintenance. Keep strength at ~75-77% training max.',
        slots(STR_LABELS, 'str', 528)),
    prog('prog30', 'Endurance — Powerlifting', 'Powerlifting', 'endurance',
        'High-rep barbell endurance. Main lifts at 50-60% for 15-20 reps with cardio finishers.',
        slots(STR_LABELS, 'str', 535)),
];

// ═══════════════════════════════════════
// HIIT — 5 sessions per cycle
// ═══════════════════════════════════════
const HIIT_LABELS = ['Circuit A', 'Circuit B', 'Circuit C', 'Circuit D', 'Circuit E'];

const HIIT_PROGRAMS_LIST: TrainingProgram[] = [
    prog('prog31', 'Fat Loss — HIIT/Circuit', 'HIIT / Circuit', 'fat_loss',
        'High-intensity interval circuits for maximum fat burn. Tabata, AMRaP, and timed sets.',
        slots(HIIT_LABELS, 'hc', 600)),
    prog('prog32', 'Muscle Gain — HIIT/Circuit', 'HIIT / Circuit', 'muscle_gain',
        'Compound HIIT circuits for muscle gain. Heavy lifts with short rests.',
        slots(HIIT_LABELS, 'hc', 605)),
    prog('prog33', 'Strength — HIIT/Circuit', 'HIIT / Circuit', 'strength',
        'Heavy barbell complexes and power circuits. Low reps, heavy loads.',
        slots(HIIT_LABELS, 'hc', 610)),
    prog('prog34', 'Recomposition — HIIT/Circuit', 'HIIT / Circuit', 'recomp',
        'Paired compound circuits for recomp. Strength + volume in circuit format.',
        slots(HIIT_LABELS, 'hc', 615)),
    prog('prog35', 'Maintenance — HIIT/Circuit', 'HIIT / Circuit', 'maintenance',
        'Balanced maintenance circuits. Moderate intensity, full body coverage.',
        slots(HIIT_LABELS, 'hc', 620)),
    prog('prog36', 'Endurance — HIIT/Circuit', 'HIIT / Circuit', 'endurance',
        'AMRaP and timed endurance circuits. Max rounds, minimal rest.',
        slots(HIIT_LABELS, 'hc', 625)),
];

// ═══════════════════════════════════════
// CARDIO — 6 sessions per cycle
// ═══════════════════════════════════════
const CARDIO_LABELS = ['Session A', 'Session B', 'Session C', 'Session D', 'Session E', 'Session F'];

const CARDIO_PROGRAMS: TrainingProgram[] = [
    prog('prog37', 'Fat Loss — Cardio', 'Cardio-Focused', 'fat_loss',
        'HIIT intervals, stairmaster, and incline walking. Maximum calorie expenditure.',
        slots(CARDIO_LABELS, 'hc', 630)),
    prog('prog38', 'Muscle Gain — Cardio', 'Cardio-Focused', 'muscle_gain',
        'Zone 2 cardio warm-ups paired with targeted muscle group work.',
        slots(CARDIO_LABELS, 'hc', 636)),
    prog('prog39', 'Strength — Cardio', 'Cardio-Focused', 'strength',
        'Easy cardio paired with main strength lifts. Recovery-focused approach.',
        slots(CARDIO_LABELS, 'hc', 642)),
    prog('prog40', 'Recomposition — Cardio', 'Cardio-Focused', 'recomp',
        'HIIT intervals paired with dual-set strength + hypertrophy work.',
        slots(CARDIO_LABELS, 'hc', 648)),
    prog('prog41', 'Maintenance — Cardio', 'Cardio-Focused', 'maintenance',
        'Steady-state cardio at conversational pace. Light bodyweight add-ons.',
        slots(CARDIO_LABELS, 'hc', 654)),
    prog('prog42', 'Endurance — Cardio', 'Cardio-Focused', 'endurance',
        'Long-distance sustained zone 2-3 work. Progressive distance and tempo runs.',
        slots(CARDIO_LABELS, 'hc', 660)),
];

export const ALL_PROGRAMS: TrainingProgram[] = [
    ...FB_PROGRAMS,
    ...UL_PROGRAMS,
    ...PPL_PROGRAMS,
    ...BRO_PROGRAMS,
    ...STR_PROGRAMS,
    ...HIIT_PROGRAMS_LIST,
    ...CARDIO_PROGRAMS,
];
