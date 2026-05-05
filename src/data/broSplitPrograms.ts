import { Workout, Exercise } from '../types';

function ex(name: string, sets: number, reps: string, rest = 120, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}
let _id = 400;
function w(name: string, desc: string, goal: Workout['goal'], mins: number, exercises: Exercise[]): Workout {
    return { id: `bro${_id++}`, name, description: desc, category: 'Bro Split', goal, estimatedMinutes: mins, exercises, createdAt: '2026-01-01' };
}

// PROGRAM 19 — Bro Split | Fat Loss
const P19: Workout[] = [
    w('CHEST DAY — FAT LOSS', 'Chest fat loss.', 'fat_loss', 50, [
        ex('Incline Dumbbell Press', 4, '12', 90), ex('Flat Barbell Bench Press', 4, '12', 90),
        ex('Decline Dumbbell Press', 3, '15', 60), ex('Cable Chest Fly', 4, '15', 60, 'REST PAUSE'),
        ex('Pec Deck Fly', 3, '15', 60, 'REST PAUSE'), ex('Parallel Bar Dips', 3, 'Until Failure', 90),
        ex('Max Effort Push-Up Set', 2, 'Max', 30),
    ]),
    w('BACK DAY — FAT LOSS', 'Back fat loss.', 'fat_loss', 50, [
        ex('Barbell Bent-Over Row', 4, '12', 90), ex('Wide Grip Lat Pulldown', 4, '12', 90),
        ex('Chest-Supported Dumbbell Row', 3, '12', 60, 'REST PAUSE'), ex('Seated Cable Row', 3, '15', 90),
        ex('T-Bar Row', 3, '12', 90), ex('Hyperextensions', 3, 'Max', 60),
        ex('Barbell Shrugs', 3, '12', 60),
    ]),
    w('LEGS DAY — FAT LOSS', 'Legs fat loss.', 'fat_loss', 60, [
        ex('Leg Press', 4, '12-15', 60, 'REST PAUSE'), ex('Hack Squat Machine', 4, '12', 90),
        ex('Leg Extension', 3, '15', 60, 'REST PAUSE'), ex('Deadlift', 4, '10', 120),
        ex('Leg Curl', 3, '15', 60, 'REST PAUSE'), ex('Walking Lunges', 3, 'Max Steps', 60),
        ex('Standing Calf Raise', 5, '15', 60, 'REST PAUSE'), ex('Treadmill HIIT', 1, '15 Mins', 0),
    ]),
    w('SHOULDERS DAY — FAT LOSS', 'Shoulders fat loss.', 'fat_loss', 50, [
        ex('Seated Dumbbell Shoulder Press', 4, '12', 90), ex('Barbell Overhead Press', 4, '10-12', 90),
        ex('Dumbbell Lateral Raises', 5, '15-20', 60), ex('Barbell Upright Row', 3, '12', 90),
        ex('Bent-Over Dumbbell Lateral Raise', 4, '15', 60), ex('Cable Face Pull', 3, '15', 60, 'REST PAUSE'),
        ex('Barbell Shrugs', 3, '12', 60),
    ]),
    w('ARMS DAY — FAT LOSS', 'Arms fat loss.', 'fat_loss', 50, [
        ex('Close Grip Barbell Bench Press', 3, '12', 90), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
        ex('Cable Tricep Pushdown', 3, '12', 60), ex('Parallel Bar Dips', 2, 'Until Failure', 90),
        ex('Barbell Preacher Curl', 3, '12', 60), ex('Hammer Curls', 3, '12', 60),
        ex('Dumbbell Concentration Curl', 4, '12', 60), ex('Cable Reverse Curl', 3, '12', 60),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, 'Circuit', 30),
    ]),
    w('CHEST DAY 2 — FAT LOSS', 'Chest fat loss B.', 'fat_loss', 45, [
        ex('Incline Hammer Strength Press', 4, '12', 90), ex('Flat Chest Press Machine', 3, '12', 60, 'REST PAUSE'),
        ex('Standing Cable Chest Fly', 4, '15', 60), ex('Pec Deck Fly', 3, '15', 60, 'REST PAUSE'),
        ex('Decline Dumbbell Press', 3, '12', 90), ex('Max Effort Push-Up Set', 2, 'Max', 30),
    ]),
    w('BACK & TRAPS DAY — FAT LOSS', 'Back & traps fat loss.', 'fat_loss', 55, [
        ex('Deadlift', 4, '8', 180), ex('Wide Grip Lat Pulldown', 4, '12', 90),
        ex('Barbell Bent-Over Row', 3, '10', 90), ex('T-Bar Row', 3, '10', 90),
        ex('Reverse Pec Deck (Rear Delt)', 4, '15', 60), ex('Barbell Shrugs', 4, '12', 60, 'REST PAUSE'),
        ex('Hyperextensions', 3, 'Until Failure', 60),
    ]),
];

// PROGRAM 20 — Bro Split | Muscle Gain
const P20: Workout[] = [
    w('CHEST DAY — MUSCLE GAIN', 'Chest hypertrophy.', 'muscle_gain', 55, [
        ex('Incline Dumbbell Press', 4, '5-9 + 10-15', 120, 'REST PAUSE on S2'), ex('Flat Barbell Bench Press', 4, '6-10', 180),
        ex('Decline Dumbbell Press', 3, '8-12', 90), ex('Cable Chest Fly', 4, '12-15', 60, 'REST PAUSE'),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Weighted Parallel Bar Dips', 3, 'Until Failure', 90),
    ]),
    w('BACK DAY — MUSCLE GAIN', 'Back hypertrophy.', 'muscle_gain', 60, [
        ex('Barbell Bent-Over Row', 5, '6-8', 120), ex('Wide Grip Lat Pulldown', 4, '8-10', 90),
        ex('Chest-Supported Dumbbell Row', 3, '10-12', 60, 'REST PAUSE'), ex('Seated Cable Row', 4, '10-12', 90),
        ex('T-Bar Row', 4, '8-10', 120), ex('Barbell Shrugs', 3, '10-15', 60, 'REST PAUSE'),
        ex('Hyperextensions', 3, 'Max', 60),
    ]),
    w('LEGS DAY — MUSCLE GAIN', 'Legs hypertrophy.', 'muscle_gain', 65, [
        ex('Hack Squat Machine', 4, '8-12', 120, 'REST PAUSE'), ex('Leg Press', 4, '10-15', 90, 'REST PAUSE'),
        ex('Leg Extension', 3, '10-15', 60, 'REST PAUSE'), ex('Deadlift', 5, '4-6', 180),
        ex('Leg Curl', 4, '10-15', 60, 'REST PAUSE'), ex('Walking Lunges', 3, 'Max Steps', 60),
        ex('Standing Calf Raise', 5, '12-15', 60, 'REST PAUSE'), ex('Hip Adductor Machine', 3, '12', 60),
    ]),
    w('SHOULDERS DAY — MUSCLE GAIN', 'Shoulders hypertrophy.', 'muscle_gain', 55, [
        ex('Seated Dumbbell Shoulder Press', 4, '8-12', 120), ex('Barbell Overhead Press', 5, '6-8', 180),
        ex('Dumbbell Lateral Raises', 4, '12-15', 60, 'REST PAUSE'), ex('Barbell Upright Row', 3, '10-12', 90),
        ex('Bent-Over Dumbbell Lateral Raise', 4, '12-15', 60), ex('Barbell Shrugs', 4, '10-12', 60, 'REST PAUSE'),
    ]),
    w('ARMS DAY — MUSCLE GAIN', 'Arms hypertrophy.', 'muscle_gain', 55, [
        ex('Close Grip Barbell Bench Press', 4, '8-10', 90), ex('Overhead Dumbbell Tricep Extension', 4, '10-12', 60, 'REST PAUSE'),
        ex('Cable Tricep Pushdown', 3, '10-12', 60), ex('EZ Bar Skull Crushers', 3, '8-10', 90),
        ex('Barbell Preacher Curl', 4, '8-12', 60), ex('Hammer Curls', 3, '10-12', 60),
        ex('Dumbbell Concentration Curl', 5, '12', 60), ex('EZ Bar Reverse Curl', 3, '12', 60),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, 'Circuit', 30),
    ]),
    w('CHEST DAY 2 — MUSCLE GAIN', 'Chest hypertrophy B.', 'muscle_gain', 55, [
        ex('Incline Hammer Strength Press', 4, '8-12', 120), ex('Flat Chest Press Machine', 3, '8-12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell Press', 3, '10-12', 90), ex('Standing Cable Chest Fly', 4, '12-15', 60, 'REST PAUSE'),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Parallel Bar Dips', 3, 'Until Failure', 90),
    ]),
    w('BACK & TRAPS DAY — MUSCLE GAIN', 'Back & traps hypertrophy.', 'muscle_gain', 60, [
        ex('Deadlift', 5, '4-5', 180), ex('Wide Grip Lat Pulldown', 4, '8-10', 90, 'REST PAUSE'),
        ex('Barbell Bent-Over Row', 4, '6-8', 120), ex('T-Bar Row', 4, '8-10', 120),
        ex('Reverse Pec Deck (Rear Delt)', 4, '12-15', 60), ex('Barbell Shrugs', 4, '10-12', 60, 'REST PAUSE'),
        ex('Dumbbell Pullover', 3, '12', 60),
    ]),
];

// PROGRAM 21 — Bro Split | Strength
const P21: Workout[] = [
    w('CHEST DAY — STRENGTH', 'Chest strength.', 'strength', 55, [
        ex('Flat Barbell Bench Press', 5, '3-5 @85-88%', 240), ex('Incline Barbell Bench Press', 4, '5-6', 180),
        ex('Close Grip Barbell Bench Press', 4, '5-6', 120), ex('Weighted Parallel Bar Dips', 4, '5-8', 120),
        ex('Dumbbell Chest Fly', 3, '10', 60, 'Pec Health'),
    ]),
    w('BACK DAY — STRENGTH', 'Back strength.', 'strength', 60, [
        ex('Barbell Bent-Over Row', 5, '4-5 @82%', 180), ex('Weighted Chin-Up', 5, '4-5', 180),
        ex('T-Bar Row', 4, '5-6', 120), ex('Wide Grip Lat Pulldown', 3, '6-8', 120),
        ex('Barbell Shrugs', 4, '6', 90), ex('Barbell Good Morning', 3, '6', 120),
    ]),
    w('LEGS DAY — STRENGTH', 'Legs strength.', 'strength', 70, [
        ex('Barbell Back Squat', 6, '3-5 @85-90%', 300), ex('Conventional Deadlift', 4, '3-4', 240),
        ex('Barbell Pause Squat', 3, '3', 180), ex('Leg Press', 3, '8', 120),
        ex('Nordic Hamstring Curl', 3, '5', 120), ex('Standing Calf Raise', 3, '10', 60),
    ]),
    w('SHOULDERS DAY — STRENGTH', 'Shoulders strength.', 'strength', 50, [
        ex('Barbell Overhead Press', 5, '3-5 @85%', 240), ex('Seated Dumbbell Shoulder Press', 4, '5-6', 120),
        ex('Dumbbell Lateral Raises', 3, '12', 60, 'Recovery'), ex('Barbell Upright Row', 4, '6', 90),
        ex('Barbell Shrugs', 4, '6-8', 90),
    ]),
    w('ARMS DAY — STRENGTH', 'Arms strength.', 'strength', 50, [
        ex('Close Grip Barbell Bench Press', 5, '5 @82%', 180), ex('Weighted Parallel Bar Dips', 4, '6', 120),
        ex('EZ Bar Bicep Curl', 5, '5-6', 120), ex('Preacher Curl', 4, '6-8', 90),
        ex('EZ Bar Skull Crushers', 4, '6-8', 90), ex('Hammer Curls', 3, '8', 60),
    ]),
    w('CHEST DAY 2 — STRENGTH', 'Chest strength B.', 'strength', 50, [
        ex('Incline Barbell Bench Press', 5, '4-5', 240), ex('Flat Dumbbell Bench Press', 4, '5-6', 120),
        ex('Board Press', 3, '3', 180, 'Lockout'), ex('Pec Deck Fly', 3, '12', 60, 'Pump'),
    ]),
    w('BACK & TRAPS DAY — STRENGTH', 'Back & traps strength.', 'strength', 55, [
        ex('Deadlift', 4, '2-3 @90-92%', 300), ex('Barbell Bent-Over Row', 4, '4-5', 180),
        ex('Weighted Pull-Up', 4, '4-5', 180), ex('Rack Pull', 3, '3', 240),
        ex('Barbell Shrugs', 4, '6', 90),
    ]),
];

// PROGRAM 22 — Bro Split | Recomp
const P22: Workout[] = [
    w('CHEST DAY — RECOMP', 'Chest recomp.', 'recomp', 55, [
        ex('Incline Dumbbell Press', 4, 'S1×6, S2×12', 150), ex('Flat Barbell Bench Press', 4, 'S1×6, S2×12', 150),
        ex('Decline Dumbbell Press', 3, '10-12', 90), ex('Cable Chest Fly', 3, '12-15', 60, 'REST PAUSE'),
        ex('Pec Deck Fly', 3, '12-15', 60), ex('Parallel Bar Dips', 3, 'Until Failure', 90),
    ]),
    w('BACK DAY — RECOMP', 'Back recomp.', 'recomp', 55, [
        ex('Barbell Bent-Over Row', 4, 'S1×6, S2×12', 150), ex('Wide Grip Lat Pulldown', 4, '10-12', 90),
        ex('Chest-Supported Dumbbell Row', 3, '10-12', 60, 'REST PAUSE'), ex('Seated Cable Row', 3, '12', 90),
        ex('T-Bar Row', 3, '10', 90), ex('Barbell Shrugs', 3, '10-15', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY — RECOMP', 'Legs recomp.', 'recomp', 60, [
        ex('Hack Squat Machine', 4, 'S1×6, S2×12', 150), ex('Leg Press', 3, '12-15', 60, 'REST PAUSE'),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Romanian Deadlift', 4, 'S1×5, S2×12', 150),
        ex('Leg Curl', 3, '12-15', 60, 'REST PAUSE'), ex('Walking Lunges', 3, 'Max Steps', 60),
        ex('Standing Calf Raise', 5, '15', 60, 'REST PAUSE'),
    ]),
    w('SHOULDERS DAY — RECOMP', 'Shoulders recomp.', 'recomp', 50, [
        ex('Dumbbell Chest Press', 4, 'S1×6, S2×12', 150), ex('Barbell Overhead Press', 3, 'S1×5, S2×10', 150),
        ex('Dumbbell Lateral Raises', 4, '12-15', 60, 'REST PAUSE'), ex('Bent-Over Dumbbell Lateral Raise', 4, '15', 60),
        ex('Barbell Upright Row', 3, '10-12', 90),
    ]),
    w('ARMS DAY — RECOMP', 'Arms recomp.', 'recomp', 50, [
        ex('Close Grip Barbell Bench Press', 3, '10-12', 90), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
        ex('Cable Tricep Pushdown', 3, '12', 60), ex('Barbell Preacher Curl', 3, '10-12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Dumbbell Concentration Curl', 4, '12', 60),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, 'Circuit', 30),
    ]),
    w('CHEST DAY 2 — RECOMP', 'Chest recomp B.', 'recomp', 50, [
        ex('Incline Hammer Strength Press', 4, '8-12', 120), ex('Flat Chest Press Machine', 3, '10-12', 60, 'REST PAUSE'),
        ex('Standing Cable Chest Fly', 3, '12-15', 60), ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'),
        ex('Decline DB', 3, '10', 90), ex('Push-Ups', 2, 'Max', 30),
    ]),
    w('BACK & TRAPS DAY — RECOMP', 'Back & traps recomp.', 'recomp', 55, [
        ex('Deadlift', 4, 'S1×4, S2×10', 150), ex('Wide Grip Lat Pulldown', 3, '10-12', 60, 'REST PAUSE'),
        ex('T-Bar Row', 4, '8-10', 90), ex('Reverse Pec Deck (Rear Delt)', 4, '15', 60),
        ex('Barbell Shrugs', 4, '10-15', 60, 'REST PAUSE'), ex('Hyperextensions', 3, 'Max', 60),
    ]),
];

// PROGRAM 23 — Bro Split | Maintenance
const P23: Workout[] = [
    w('CHEST — MAINTENANCE', 'Chest maintenance.', 'maintenance', 40, [
        ex('Incline Dumbbell Press', 3, '10-12', 90), ex('Flat Barbell Bench Press', 3, '10-12', 90),
        ex('Cable Chest Fly', 3, '12-15', 60), ex('Pec Deck Fly', 2, '12-15', 60),
        ex('Parallel Bar Dips', 2, 'Until Failure', 90),
    ]),
    w('BACK — MAINTENANCE', 'Back maintenance.', 'maintenance', 40, [
        ex('Barbell Bent-Over Row', 3, '10', 90), ex('Wide Grip Lat Pulldown', 3, '10-12', 90),
        ex('Seated Cable Row', 3, '12', 90), ex('Barbell Shrugs', 3, '12', 60),
        ex('Hyperextensions', 2, 'Until Failure', 60),
    ]),
    w('LEGS — MAINTENANCE', 'Legs maintenance.', 'maintenance', 40, [
        ex('Leg Press', 3, '12-15', 90), ex('Hack Squat Machine', 3, '12', 90),
        ex('Leg Extension', 3, '12', 60), ex('Leg Curl', 3, '12', 60),
        ex('Standing Calf Raise', 3, '15', 60),
    ]),
    w('SHOULDERS — MAINTENANCE', 'Shoulders maintenance.', 'maintenance', 35, [
        ex('Dumbbell Chest Press', 3, '10-12', 90), ex('Dumbbell Lateral Raises', 3, '15', 60),
        ex('Barbell Upright Row', 3, '12', 90), ex('Bent-Over Dumbbell Lateral Raise', 3, '15', 60),
    ]),
    w('ARMS — MAINTENANCE', 'Arms maintenance.', 'maintenance', 35, [
        ex('Close Grip Barbell Bench Press', 3, '12', 90), ex('Cable Tricep Pushdown', 3, '12', 60),
        ex('Barbell Preacher Curl', 3, '12', 60), ex('Hammer Curls', 3, '12', 60),
        ex('Dumbbell Concentration Curl', 3, '12', 60),
    ]),
    w('CHEST 2 — MAINTENANCE', 'Chest maintenance B.', 'maintenance', 35, [
        ex('Incline Hammer Strength Press', 3, '12', 90), ex('Flat Chest Press Machine', 3, '12', 90),
        ex('Pec Deck Fly', 3, '12-15', 60), ex('Push-Ups', 2, 'Max', 30),
    ]),
    w('BACK & TRAPS — MAINTENANCE', 'Back & traps maintenance.', 'maintenance', 40, [
        ex('Deadlift', 3, '6-8', 180), ex('Wide Grip Lat Pulldown', 3, '12', 90),
        ex('T-Bar Row', 3, '10', 90), ex('Reverse Pec Deck (Rear Delt)', 3, '15', 60),
        ex('Barbell Shrugs', 3, '12', 60),
    ]),
];

// PROGRAM 24 — Bro Split | Endurance
const P24: Workout[] = [
    w('CHEST — ENDURANCE', 'Chest endurance.', 'endurance', 45, [
        ex('Incline Dumbbell Press', 4, '20', 45), ex('Flat Barbell Bench Press', 4, '20', 45),
        ex('Cable Chest Fly', 4, '20-25', 30), ex('Pec Deck Fly', 4, '20', 30, 'REST PAUSE'),
        ex('Push-Ups', 4, 'Until Failure', 30), ex('Parallel Bar Dips', 3, 'Until Failure', 30),
    ]),
    w('BACK — ENDURANCE', 'Back endurance.', 'endurance', 50, [
        ex('Barbell Bent-Over Row', 4, '20', 45), ex('Wide Grip Lat Pulldown', 4, '20', 45),
        ex('Seated Cable Row', 4, '20', 45), ex('T-Bar Row', 4, '20', 45),
        ex('Reverse Pec Deck (Rear Delt)', 5, '20', 30), ex('Hyperextensions', 3, 'Max', 30),
        ex('Barbell Shrugs', 4, '20', 30),
    ]),
    w('LEGS — ENDURANCE', 'Legs endurance.', 'endurance', 55, [
        ex('Leg Press', 4, '25', 45), ex('Hack Squat Machine', 4, '20', 45),
        ex('Leg Extension', 4, '25', 30), ex('Leg Curl', 4, '25', 30),
        ex('Walking Lunges', 5, '30 Steps', 30), ex('Standing Calf Raise', 5, '25', 30),
        ex('Stairmaster', 1, '20 Mins', 0),
    ]),
    w('SHOULDERS — ENDURANCE', 'Shoulders endurance.', 'endurance', 45, [
        ex('Dumbbell Chest Press', 4, '20', 45), ex('Dumbbell Lateral Raises', 5, '20-25', 30),
        ex('Barbell Upright Row', 4, '20', 30), ex('Bent-Over Dumbbell Lateral Raise', 5, '20', 30),
        ex('Cable Face Pull', 4, '25', 30), ex('Barbell Shrugs', 4, '20', 30),
    ]),
    w('ARMS — ENDURANCE', 'Arms endurance.', 'endurance', 50, [
        ex('Close Grip Barbell Bench Press', 4, '20', 45), ex('Overhead Dumbbell Tricep Extension', 4, '20', 30),
        ex('Cable Tricep Pushdown', 4, '20', 30), ex('Parallel Bar Dips', 3, 'Until Failure', 30),
        ex('Barbell Preacher Curl', 4, '20', 30), ex('Hammer Curls', 4, '20', 30),
        ex('Dumbbell Concentration Curl', 5, '20', 30), ex('Jump Rope', 1, '10 Mins', 0, 'Finisher'),
    ]),
    w('CHEST 2 — ENDURANCE', 'Chest endurance B.', 'endurance', 40, [
        ex('Incline Hammer Strength Press', 4, '20', 45), ex('Flat Chest Press Machine', 4, '20', 45),
        ex('Standing Cable Chest Fly', 4, '20', 30), ex('Pec Deck Fly', 4, '20', 30),
        ex('Max Effort Push-Up Set', 3, 'Max', 15),
    ]),
    w('BACK & TRAPS — ENDURANCE', 'Back & traps endurance.', 'endurance', 50, [
        ex('Wide Grip Lat Pulldown', 4, '20', 45), ex('T-Bar Row', 4, '20', 45),
        ex('Wide Grip Lat Pulldown', 4, '20', 45), ex('Reverse Pec Deck (Rear Delt)', 5, '20', 30),
        ex('Barbell Shrugs', 4, '20', 30), ex('Core Circuit (Plank / Crunch / Leg Raise)', 1, '20 Mins', 0),
    ]),
];

export const BRO_SPLIT_PROGRAMS: Workout[] = [...P19, ...P20, ...P21, ...P22, ...P23, ...P24];
