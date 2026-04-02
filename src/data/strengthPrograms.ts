import { Workout, Exercise } from '../types';

function ex(name: string, sets: number, reps: string, rest = 120, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}
let _id = 500;
function w(name: string, desc: string, cat: string, goal: Workout['goal'], mins: number, exercises: Exercise[]): Workout {
    return { id: `str${_id++}`, name, description: desc, category: cat, goal, estimatedMinutes: mins, exercises, createdAt: '2026-01-01' };
}
const PL = 'Powerlifting';

// PROGRAM 25 — Strength | Fat Loss
const P25: Workout[] = [
    w('SQUAT DAY — FAT LOSS', 'Squat fat loss.', PL, 'fat_loss', 60, [
        ex('Back Squat', 5, '5 @80%', 180), ex('Front Squat', 3, '5', 120),
        ex('Leg Press', 3, '12', 60, 'Metabolic'), ex('Leg Extension', 3, '15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, '20', 60), ex('Standing Calf', 3, '15', 60),
        ex('HIIT Bike', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('BENCH DAY — FAT LOSS', 'Bench fat loss.', PL, 'fat_loss', 55, [
        ex('Flat Bench Press', 5, '5 @80%', 180), ex('Incline DB Press', 3, '10-12', 90),
        ex('Cable Fly', 3, '15', 60), ex('Triceps Pushdown', 3, '15', 60),
        ex('Skull Crushers', 3, '10', 60), ex('Face Pull', 3, '15', 60),
        ex('Jump Rope', 1, '10 Mins', 0),
    ]),
    w('DEADLIFT DAY — FAT LOSS', 'Deadlift fat loss.', PL, 'fat_loss', 55, [
        ex('Conventional Deadlift', 5, '3 @85%', 240), ex('Romanian Deadlift', 3, '10', 90),
        ex('Barbell Row', 3, '10', 90), ex('Leg Curl', 3, '12', 60, 'REST PAUSE'),
        ex('Good Morning', 3, '8', 90), ex('Farmer\'s Walk', 3, '3 Rounds', 60),
    ]),
    w('OHP DAY — FAT LOSS', 'OHP fat loss.', PL, 'fat_loss', 55, [
        ex('Overhead Press', 5, '5 @80%', 180), ex('DB Shoulder Press', 3, '12', 90),
        ex('Side Lateral', 4, '15-20', 60), ex('Upright Row', 3, '12', 90),
        ex('Bent-Over Lateral', 4, '15', 60), ex('Battle Ropes', 3, '30 Secs', 30),
    ]),
    w('SQUAT DAY 2 — FAT LOSS', 'Squat fat loss B.', PL, 'fat_loss', 55, [
        ex('Back Squat', 4, '4 @85%', 240), ex('Pause Squat', 3, '3 @70%', 180),
        ex('Hack Squat', 3, '12', 90), ex('Leg Curl', 3, '12', 60, 'REST PAUSE'),
        ex('Abductor', 3, '15', 60), ex('Calf Raise', 4, '15', 60),
    ]),
    w('BENCH DAY 2 — FAT LOSS', 'Bench fat loss B.', PL, 'fat_loss', 50, [
        ex('Bench Press', 4, '4 @85%', 240), ex('Close Grip Bench', 3, '8', 90),
        ex('Pec Dec', 3, '12-15', 60), ex('Overhead Triceps', 3, '12', 60),
        ex('EZ Curl', 3, '12', 60), ex('Hammer Curls', 3, '12', 60),
    ]),
    w('DEADLIFT DAY 2 — FAT LOSS', 'Deadlift fat loss B.', PL, 'fat_loss', 50, [
        ex('Deadlift', 4, '3 @88%', 240), ex('Rack Pull', 3, '3', 180),
        ex('T-Bar Row', 3, '10', 90), ex('Hyperextensions', 3, 'Max', 60),
        ex('DB SLDL', 3, '12', 90), ex('Shrugs', 4, '12', 60),
    ]),
];

// PROGRAM 26 — Strength | Muscle Gain (Powerbuilding)
const P26: Workout[] = [
    w('SQUAT DAY — MUSCLE GAIN', 'Squat powerbuilding.', PL, 'muscle_gain', 65, [
        ex('Back Squat', 5, '5 @80% + Backoff 3×10', 180), ex('Front Squat', 3, '6-8', 120),
        ex('Leg Press', 3, '10-15', 90, 'REST PAUSE'), ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'),
        ex('Romanian Deadlift', 3, '10', 90), ex('Standing Calf', 4, '15', 60, 'REST PAUSE'),
    ]),
    w('BENCH DAY — MUSCLE GAIN', 'Bench powerbuilding.', PL, 'muscle_gain', 60, [
        ex('Flat Bench', 5, '5 @80% + Backoff 3×10', 180), ex('Incline DB Press', 4, '8-12', 120),
        ex('Cable Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Overhead Triceps', 3, '10-12', 60, 'REST PAUSE'),
        ex('Skull Crushers', 3, '8-10', 90), ex('EZ Curl', 3, '10', 60),
    ]),
    w('DEADLIFT DAY — MUSCLE GAIN', 'Deadlift powerbuilding.', PL, 'muscle_gain', 60, [
        ex('Deadlift', 5, '3 @82-85%', 240), ex('Barbell Row', 4, '8', 120),
        ex('Chest-Supported Row', 3, '10-12', 60, 'REST PAUSE'), ex('Leg Curl', 3, '10-12', 60, 'REST PAUSE'),
        ex('Good Morning', 3, '8', 90), ex('Shrugs', 3, '10-12', 60),
    ]),
    w('OHP DAY — MUSCLE GAIN', 'OHP powerbuilding.', PL, 'muscle_gain', 55, [
        ex('Overhead Press', 5, '5 @80%', 180), ex('DB Press', 4, '8-12', 120),
        ex('Side Lateral', 4, '12-15', 60, 'REST PAUSE'), ex('Bent-Over Lateral', 4, '12-15', 60),
        ex('Upright Row', 3, '10', 90), ex('Shrugs', 3, '12', 60, 'REST PAUSE'),
    ]),
    w('SQUAT DAY 2 — MUSCLE GAIN', 'Squat powerbuilding B.', PL, 'muscle_gain', 60, [
        ex('Back Squat', 4, '3 @87-90%', 240), ex('Hack Squat', 3, '10-12', 90, 'REST PAUSE'),
        ex('Leg Press', 3, '10-12', 90), ex('Leg Curl', 3, '10-12', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max', 60), ex('Donkey Calf', 4, '15', 60, 'REST PAUSE'),
    ]),
    w('BENCH DAY 2 — MUSCLE GAIN', 'Bench powerbuilding B.', PL, 'muscle_gain', 55, [
        ex('Bench Press', 4, '3 @87%', 240), ex('Close Grip Bench', 4, '8-10', 90),
        ex('Incline Hammer', 3, '10-12', 90, 'REST PAUSE'), ex('Triceps Pushdown', 3, '12', 60),
        ex('Scott Curls', 3, '10', 60), ex('Hammer Curls', 3, '12', 60),
    ]),
    w('DEADLIFT DAY 2 — MUSCLE GAIN', 'Deadlift powerbuilding B.', PL, 'muscle_gain', 55, [
        ex('Deadlift', 4, '2-3 @88-90%', 300), ex('T-Bar Row', 4, '8', 120),
        ex('Wide Pulldown', 4, '10', 90), ex('Hyperextensions', 3, 'Max', 60),
        ex('DB SLDL', 3, '12', 90), ex('Barbell Shrugs', 4, '8 Heavy', 90),
    ]),
];

// PROGRAM 27 — Strength | Pure Strength
const P27: Workout[] = [
    w('SQUAT DAY — PURE STRENGTH', 'Pure squat strength.', PL, 'strength', 70, [
        ex('Back Squat', 5, '3-5 @85-90%', 300), ex('Pause Squat', 3, '3 @70%', 180),
        ex('Box Squat', 3, '3 @75%', 180), ex('Good Morning', 3, '5', 120),
        ex('Leg Press', 2, '8', 90, 'Recovery'), ex('Calf Raise', 2, '10', 60),
    ]),
    w('BENCH DAY — PURE STRENGTH', 'Pure bench strength.', PL, 'strength', 65, [
        ex('Flat Bench', 5, '3-5 @85-90%', 300), ex('Close Grip Bench', 4, '5-6', 120),
        ex('Pause Bench', 3, '3 @75%', 180), ex('Skull Crushers', 3, '8', 90),
        ex('Barbell Row', 3, '8', 90, 'Balance'), ex('Face Pull', 3, '15', 60),
    ]),
    w('DEADLIFT DAY — PURE STRENGTH', 'Pure deadlift strength.', PL, 'strength', 70, [
        ex('Conventional Deadlift', 5, '2-4 @87-92%', 300), ex('Rack Pull', 3, '3 @90%', 240),
        ex('Romanian Deadlift', 3, '5', 120), ex('Barbell Row', 3, '5', 120),
        ex('Good Morning', 3, '5', 120), ex('Hamstring Curl', 2, '10', 60),
    ]),
    w('OHP DAY — PURE STRENGTH', 'Pure OHP strength.', PL, 'strength', 55, [
        ex('Overhead Press', 5, '3-5 @85%', 240), ex('Push Press', 3, '3', 180, 'Power'),
        ex('Seated DB Press', 3, '5-6', 120), ex('Weighted Dip', 3, '5', 120),
        ex('Upright Row', 3, '8', 90), ex('Band Pull-Apart', 3, '20', 30),
    ]),
    w('SQUAT DAY 2 — PURE STRENGTH', 'Squat peaking.', PL, 'strength', 65, [
        ex('Back Squat', 4, '2-3 @90-92%', 300), ex('Front Squat', 3, '3-4', 180),
        ex('Safety Bar Squat', 3, '5', 180), ex('Box Squat', 2, '2 @80%', 180),
        ex('Single Leg Press', 2, '8 Each', 90),
    ]),
    w('BENCH DAY 2 — PURE STRENGTH', 'Bench peaking.', PL, 'strength', 55, [
        ex('Bench Press', 4, '2-3 @90-92%', 300), ex('Floor Press', 3, '3', 180),
        ex('Incline Bench', 3, '5-6', 120), ex('Triceps Lockout', 3, '3', 120),
        ex('Band Pushdown', 3, '20', 30),
    ]),
    w('DEADLIFT DAY 2 — PURE STRENGTH', 'Deadlift peaking.', PL, 'strength', 60, [
        ex('Deadlift', 3, '1-2 @93-95%', 300), ex('Sumo Deadlift', 3, '3', 180, 'Variation'),
        ex('Rack Pull Heavy', 3, '2', 240), ex('Barbell Row', 3, '5-6', 120),
        ex('Hyperextensions', 3, 'Max', 60), ex('Leg Curl', 2, '10', 60),
    ]),
];

// PROGRAMS 28-30 — Strength | Recomp/Maintenance/Endurance (template-based)
const P28: Workout[] = [
    w('SQUAT DAY — RECOMP', 'Squat recomp.', PL, 'recomp', 60, [
        ex('Back Squat', 5, 'S1×5, S2×10-12', 150), ex('Front Squat', 3, '6-8', 120),
        ex('Leg Press', 3, '10-12', 60, 'REST PAUSE'), ex('Leg Extension', 3, '10-12', 60, 'REST PAUSE'),
        ex('RDL', 3, '10', 90), ex('Calf Raise', 4, '15', 60),
    ]),
    w('BENCH DAY — RECOMP', 'Bench recomp.', PL, 'recomp', 55, [
        ex('Bench Press', 5, 'S1×5, S2×10', 150), ex('Incline DB Press', 3, '8-12', 90),
        ex('Cable Fly', 3, '10-12', 60, 'REST PAUSE'), ex('Triceps Pushdown', 3, '12', 60),
        ex('Skull Crushers', 3, '10', 60), ex('EZ Curl', 3, '10-12', 60),
    ]),
    w('DEADLIFT DAY — RECOMP', 'Deadlift recomp.', PL, 'recomp', 55, [
        ex('Deadlift', 5, 'S1×3, S2×8', 180), ex('Barbell Row', 4, '8-10', 90),
        ex('Chest-Supported Row', 3, '10-12', 60, 'REST PAUSE'), ex('Leg Curl', 3, '10-12', 60, 'REST PAUSE'),
        ex('Good Morning', 3, '8', 90), ex('Shrugs', 3, '12', 60),
    ]),
    w('OHP DAY — RECOMP', 'OHP recomp.', PL, 'recomp', 55, [
        ex('Overhead Press', 5, 'S1×5, S2×10', 150), ex('DB Press', 3, '8-12', 90),
        ex('Side Lateral', 4, '12-15', 60, 'REST PAUSE'), ex('Bent-Over Lateral', 3, '15', 60),
        ex('Upright Row', 3, '10-12', 90), ex('Shrugs', 3, '12', 60, 'REST PAUSE'),
    ]),
    w('SQUAT DAY 2 — RECOMP', 'Squat recomp B.', PL, 'recomp', 55, [
        ex('Back Squat', 4, '3-5 @85%', 240), ex('Hack Squat', 3, '10-12', 60, 'REST PAUSE'),
        ex('Leg Curl', 3, '10-12', 60, 'REST PAUSE'), ex('Walking Lunges', 3, 'Max', 60),
        ex('Calf Raise', 4, '15', 60),
    ]),
    w('BENCH DAY 2 — RECOMP', 'Bench recomp B.', PL, 'recomp', 50, [
        ex('Bench Press', 4, '3-5 @85%', 240), ex('Close Grip Bench', 3, '8-10', 90),
        ex('Incline Hammer', 3, '10-12', 60, 'REST PAUSE'), ex('Triceps Pushdown', 3, '12', 60),
        ex('Scott Curls', 3, '10-12', 60),
    ]),
    w('DEADLIFT DAY 2 — RECOMP', 'Deadlift recomp B.', PL, 'recomp', 55, [
        ex('Deadlift', 4, '2-3 @88%', 300), ex('T-Bar Row', 4, '8-10', 90),
        ex('Wide Pulldown', 3, '10-12', 90), ex('Hyperextensions', 3, 'Max', 60),
        ex('Shrugs', 4, '10-12', 60),
    ]),
];

const P29: Workout[] = [
    w('SQUAT DAY — MAINTENANCE', 'Squat maintenance.', PL, 'maintenance', 45, [
        ex('Back Squat', 4, '5 @75-77%', 180), ex('Leg Press', 3, '10-12', 90),
        ex('Leg Extension', 2, '12', 60), ex('Leg Curl', 2, '12', 60),
        ex('Calf Raise', 3, '15', 60),
    ]),
    w('BENCH DAY — MAINTENANCE', 'Bench maintenance.', PL, 'maintenance', 40, [
        ex('Bench Press', 4, '5 @75-77%', 180), ex('Incline DB Press', 2, '10-12', 90),
        ex('Cable Fly', 2, '12', 60), ex('Triceps Pushdown', 2, '12', 60),
        ex('EZ Curl', 2, '12', 60),
    ]),
    w('DEADLIFT DAY — MAINTENANCE', 'Deadlift maintenance.', PL, 'maintenance', 40, [
        ex('Deadlift', 3, '5 @75-77%', 180), ex('Barbell Row', 3, '10', 90),
        ex('Leg Curl', 2, '12', 60), ex('Good Morning', 2, '8', 90),
        ex('Shrugs', 3, '12', 60),
    ]),
    w('OHP DAY — MAINTENANCE', 'OHP maintenance.', PL, 'maintenance', 35, [
        ex('Overhead Press', 4, '5 @75-77%', 180), ex('DB Press', 2, '10-12', 90),
        ex('Side Lateral', 3, '15', 60), ex('Face Pull', 3, '15', 60),
    ]),
    w('SQUAT DAY 2 — MAINTENANCE', 'Squat maintenance B.', PL, 'maintenance', 40, [
        ex('Back Squat', 3, '5 @75%', 180), ex('Hack Squat', 2, '10-12', 90),
        ex('Leg Curl', 2, '12', 60), ex('Calf Raise', 3, '15', 60),
    ]),
    w('BENCH DAY 2 — MAINTENANCE', 'Bench maintenance B.', PL, 'maintenance', 35, [
        ex('Bench Press', 3, '5 @75%', 180), ex('Close Grip Bench', 2, '10-12', 90),
        ex('Pec Dec', 2, '12', 60), ex('Overhead Triceps', 2, '12', 60),
    ]),
    w('DEADLIFT DAY 2 — MAINTENANCE', 'Deadlift maintenance B.', PL, 'maintenance', 35, [
        ex('Deadlift', 3, '5 @75%', 180), ex('T-Bar Row', 2, '10', 90),
        ex('Hyperextensions', 2, 'Max', 60), ex('Shrugs', 3, '12', 60),
    ]),
];

const P30: Workout[] = [
    w('SQUAT DAY — ENDURANCE', 'Squat endurance.', PL, 'endurance', 55, [
        ex('Back Squat', 4, '15-20 @50-60%', 75), ex('Leg Press', 4, '20', 60),
        ex('Leg Extension', 4, '20', 30), ex('Walking Lunges', 3, '30 Steps', 30),
        ex('Calf Raise', 5, '25', 30), ex('Bike Cardio', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('BENCH DAY — ENDURANCE', 'Bench endurance.', PL, 'endurance', 50, [
        ex('Bench Press', 4, '15-20 @50-60%', 75), ex('Incline DB Press', 4, '20', 45),
        ex('Cable Fly', 4, '20', 30), ex('Triceps Pushdown', 4, '20', 30),
        ex('EZ Curl', 4, '20', 30), ex('Treadmill Intervals', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('DEADLIFT DAY — ENDURANCE', 'Deadlift endurance.', PL, 'endurance', 50, [
        ex('Deadlift', 4, '15-20 @50-60%', 75), ex('Barbell Row', 4, '20', 45),
        ex('Leg Curl', 4, '20', 30), ex('Good Morning', 3, '15', 45),
        ex('Shrugs', 4, '20', 30), ex('Row Machine', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('OHP DAY — ENDURANCE', 'OHP endurance.', PL, 'endurance', 50, [
        ex('Overhead Press', 4, '15-20 @50-60%', 75), ex('DB Press', 4, '20', 45),
        ex('Side Lateral', 5, '20-25', 30), ex('Bent-Over Lateral', 4, '20', 30),
        ex('Face Pull', 4, '25', 30), ex('Stairmaster', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('SQUAT DAY 2 — ENDURANCE', 'Squat endurance B.', PL, 'endurance', 55, [
        ex('Back Squat', 4, '15-20 @55%', 60), ex('Hack Squat', 3, '20', 45),
        ex('Leg Extension', 4, '25', 30), ex('Leg Curl', 4, '20', 30),
        ex('Calf Raise', 5, '25', 30), ex('Jump Rope', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('BENCH DAY 2 — ENDURANCE', 'Bench endurance B.', PL, 'endurance', 50, [
        ex('Bench Press', 4, '15-20 @55%', 60), ex('Close Grip Bench', 3, '20', 45),
        ex('Pec Dec', 4, '20', 30), ex('Overhead Triceps', 4, '20', 30),
        ex('Hammer Curls', 4, '20', 30), ex('Bike', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('DEADLIFT DAY 2 — ENDURANCE', 'Deadlift endurance B.', PL, 'endurance', 50, [
        ex('Deadlift', 4, '15-20 @55%', 60), ex('T-Bar Row', 4, '20', 45),
        ex('Wide Pulldown', 4, '20', 30), ex('Hyperextensions', 3, 'Max', 30),
        ex('DB SLDL', 4, '20', 30), ex('Battle Ropes', 1, '15 Mins', 0, 'Finisher'),
    ]),
];

export const STRENGTH_PROGRAMS: Workout[] = [...P25, ...P26, ...P27, ...P28, ...P29, ...P30];
