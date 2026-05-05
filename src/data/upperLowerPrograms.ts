import { Workout, Exercise } from '../types';

function ex(name: string, sets: number, reps: string, rest = 120, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}
let _id = 200;
function w(name: string, desc: string, cat: string, goal: Workout['goal'], mins: number, exercises: Exercise[]): Workout {
    return { id: `ul${_id++}`, name, description: desc, category: cat, goal, estimatedMinutes: mins, exercises, createdAt: '2026-01-01' };
}
const UL = 'Upper / Lower';

// PROGRAM 7 — Upper/Lower | Fat Loss
const P7: Workout[] = [
    w('UPPER A — FAT LOSS', 'Upper body fat loss.', UL, 'fat_loss', 55, [
        ex('Incline Barbell Bench Press', 4, '12', 90), ex('Barbell Bent-Over Row', 4, '12', 90),
        ex('Seated Dumbbell Shoulder Press', 3, '12-15', 90), ex('Wide Grip Lat Pulldown', 3, '15', 90),
        ex('Cable Chest Fly', 3, '15', 60, 'REST PAUSE'), ex('Bent-Over Dumbbell Lateral Raise', 3, '15', 60),
        ex('Cable Tricep Pushdown', 3, '15', 60), ex('EZ Bar Bicep Curl', 3, '15', 60),
        ex('Battle Ropes', 3, '30s', 30),
    ]),
    w('LOWER A — FAT LOSS', 'Lower body fat loss.', UL, 'fat_loss', 55, [
        ex('Barbell Back Squat', 4, '12', 90), ex('Romanian Deadlift', 4, '12', 90),
        ex('Leg Press', 3, '15', 60, 'REST PAUSE'), ex('Leg Extension', 3, '15', 60, 'REST PAUSE'),
        ex('Leg Curl', 3, '15', 60, 'REST PAUSE'), ex('Walking Lunges', 3, '20 Steps', 60),
        ex('Standing Calf Raise', 4, '15', 60), ex('Treadmill HIIT', 1, '15 Mins', 0),
    ]),
    w('UPPER B — FAT LOSS', 'Upper body fat loss B.', UL, 'fat_loss', 55, [
        ex('Flat Dumbbell Bench Press', 4, '10-12', 90), ex('Chest-Supported Dumbbell Row', 4, '10-12', 90),
        ex('Barbell Overhead Press', 3, '10-12', 90), ex('Wide Grip Lat Pulldown', 3, '12', 90),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Reverse Pec Deck (Rear Delt)', 3, '15', 60),
        ex('Hammer Curls', 3, '15', 60), ex('Parallel Bar Dips', 3, 'Until Failure', 90),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, 'Circuit', 30),
    ]),
    w('LOWER B — FAT LOSS', 'Lower body fat loss B.', UL, 'fat_loss', 55, [
        ex('Hack Squat Machine', 4, '12', 90), ex('Deadlift', 4, '8', 120),
        ex('Leg Extension', 3, '15', 60, 'REST PAUSE'), ex('Lying Leg Curl', 3, '15', 60, 'REST PAUSE'),
        ex('Hip Adductor Machine', 3, '15', 60), ex('Hip Abductor Machine', 3, '15', 60),
        ex('Seated Calf Raise', 4, '15', 60), ex('Bike Intervals', 1, '15 Mins', 0),
    ]),
    w('UPPER C — FAT LOSS', 'Upper body fat loss C.', UL, 'fat_loss', 55, [
        ex('Incline Hammer Strength Press', 4, '12', 90), ex('T-Bar Row', 4, '10-12', 90),
        ex('Seated Dumbbell Shoulder Press', 3, '12-15', 90), ex('Seated Cable Row', 3, '15', 90),
        ex('Standing Cable Chest Fly', 3, '15', 60, 'REST PAUSE'), ex('Barbell Upright Row', 3, '12', 90),
        ex('Barbell Preacher Curl', 3, '12', 60), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
    ]),
    w('LOWER C — FAT LOSS', 'Lower body fat loss C.', UL, 'fat_loss', 50, [
        ex('Smith Machine Squat', 4, '15', 90), ex('Dumbbell Romanian Deadlift', 4, '12', 90),
        ex('Leg Press', 3, '20', 60), ex('Leg Extension', 3, '20', 60, 'REST PAUSE'),
        ex('Barbell Hip Thrust', 3, '15', 90), ex('Donkey Calf Raise', 4, '15', 60),
        ex('Jump Rope', 1, '10 Mins', 0, 'Finisher'),
    ]),
];

// PROGRAM 8 — Upper/Lower | Muscle Gain
const P8: Workout[] = [
    w('UPPER A — MUSCLE GAIN', 'Upper hypertrophy A.', UL, 'muscle_gain', 60, [
        ex('Incline Dumbbell Press', 4, '8-12', 120), ex('Barbell Bent-Over Row', 4, '6-10', 120),
        ex('Seated Barbell Military Press', 4, '8-10', 120), ex('Wide Grip Lat Pulldown', 4, '10-12', 90),
        ex('Cable Chest Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Bent-Over Dumbbell Lateral Raise', 4, '12-15', 60),
        ex('EZ Bar Bicep Curl', 3, '10-12', 60, 'REST PAUSE'), ex('Parallel Bar Dips', 3, 'Until Failure', 90),
    ]),
    w('LOWER A — MUSCLE GAIN', 'Lower hypertrophy A.', UL, 'muscle_gain', 60, [
        ex('Barbell Back Squat', 5, '6-10', 180), ex('Romanian Deadlift', 4, '8-10', 120),
        ex('Leg Press', 3, '10-15', 90, 'REST PAUSE'), ex('Leg Extension', 3, '10-12', 60, 'REST PAUSE'),
        ex('Lying Leg Curl', 3, '10-12', 60, 'REST PAUSE'), ex('Standing Calf Raise', 5, '12-15', 60, 'REST PAUSE'),
    ]),
    w('UPPER B — MUSCLE GAIN', 'Upper hypertrophy B.', UL, 'muscle_gain', 60, [
        ex('Flat Barbell Bench Press', 5, '6-10', 180), ex('Chest-Supported Dumbbell Row', 4, '8-12', 120),
        ex('Overhead Press DB', 4, '8-12', 120), ex('Wide Grip Lat Pulldown', 3, '10-12', 90),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Barbell Upright Row', 3, '10-12', 90),
        ex('Dumbbell Concentration Curl', 4, '12', 60), ex('Overhead Dumbbell Tricep Extension', 3, '10-12', 60, 'REST PAUSE'),
    ]),
    w('LOWER B — MUSCLE GAIN', 'Lower hypertrophy B.', UL, 'muscle_gain', 60, [
        ex('Hack Squat Machine', 4, '8-12', 120, 'REST PAUSE'), ex('Deadlift', 4, '5-6 Heavy', 180),
        ex('Leg Extension', 4, '10-12', 60, 'REST PAUSE'), ex('Leg Curl', 4, '10-12', 60, 'REST PAUSE'),
        ex('Hip Adductor Machine', 3, '12-15', 60), ex('Hip Abductor Machine', 3, '12-15', 60),
        ex('Seated Calf Raise', 5, '12-15', 60, 'REST PAUSE'),
    ]),
    w('UPPER C — MUSCLE GAIN', 'Upper hypertrophy C.', UL, 'muscle_gain', 60, [
        ex('Incline Hammer Strength Press', 4, '8-12', 120), ex('T-Bar Row', 4, '8-10', 120),
        ex('Barbell Overhead Press', 4, '6-10', 120), ex('Cable Pullover', 3, '12-15', 90),
        ex('Reverse Pec Deck (Rear Delt)', 4, '12-15', 60), ex('Barbell Shrugs', 3, '10-15', 60, 'REST PAUSE'),
        ex('Barbell Preacher Curl', 4, '10-12', 60), ex('Close Grip Barbell Bench Press', 4, '10-12', 90),
    ]),
    w('LOWER C — MUSCLE GAIN', 'Lower hypertrophy C.', UL, 'muscle_gain', 60, [
        ex('Smith Machine Squat', 4, '10-12', 120), ex('Dumbbell Romanian Deadlift', 4, '10-12', 90),
        ex('Leg Press', 3, '12-15', 90, 'REST PAUSE'), ex('Walking Lunges', 3, '20 Steps', 60),
        ex('Barbell Hip Thrust', 4, '10-12', 90), ex('Donkey Calf Raise', 5, '12-15', 60),
        ex('Cable Crunch', 4, '15-20', 30),
    ]),
];

// PROGRAM 9 — Upper/Lower | Strength
const P9: Workout[] = [
    w('UPPER A — STRENGTH', 'Upper strength A.', UL, 'strength', 65, [
        ex('Flat Barbell Bench Press', 5, '5 @82-85%', 240), ex('Barbell Bent-Over Row', 5, '5 @80%', 180),
        ex('Barbell Overhead Press', 4, '5', 180), ex('Weighted Chin-Up', 4, '5', 180),
        ex('Incline Dumbbell Press', 3, '6-8', 120), ex('Cable Face Pull', 3, '15', 60, 'Shoulder Health'),
        ex('EZ Bar Bicep Curl', 3, '8', 60), ex('EZ Bar Skull Crushers', 3, '8', 60),
    ]),
    w('LOWER A — STRENGTH', 'Lower strength A.', UL, 'strength', 65, [
        ex('Barbell Back Squat', 5, '5 @85%', 300), ex('Romanian Deadlift', 4, '5 Heavy', 180),
        ex('Barbell Pause Squat', 3, '3 @70%', 180), ex('Leg Press', 3, '8 Heavy', 120),
        ex('Leg Curl', 3, '8', 90), ex('Standing Calf Raise', 3, '12', 60),
    ]),
    w('UPPER B — STRENGTH', 'Upper strength B.', UL, 'strength', 60, [
        ex('Flat Barbell Bench Press', 4, '3 @88-92%', 300), ex('Barbell Bent-Over Row', 4, '4', 180),
        ex('Barbell Overhead Press', 4, '4', 180), ex('Wide Grip Lat Pulldown', 4, '6 Heavy', 120),
        ex('Close Grip Barbell Bench Press', 3, '5', 120), ex('Dumbbell Lateral Raises', 3, '15', 60, 'Recovery'),
    ]),
    w('LOWER B — STRENGTH', 'Lower strength B.', UL, 'strength', 65, [
        ex('Conventional Deadlift', 4, '3-5 @88%', 300), ex('Barbell Front Squat', 4, '4-5', 180),
        ex('Barbell Good Morning', 3, '6', 120), ex('Hack Squat Machine', 3, '5-8 Heavy', 120),
        ex('Leg Extension', 3, '10', 60, 'Knee Health'), ex('Standing Calf Raise', 3, '12', 60),
    ]),
    w('UPPER C — STRENGTH', 'Upper strength C.', UL, 'strength', 55, [
        ex('Flat Barbell Bench Press', 3, '2-3 @92-95%', 300), ex('Barbell Bent-Over Row', 3, '3-4', 180),
        ex('Barbell Overhead Press', 3, '3 @90%', 240), ex('Weighted Pull-Up', 3, '4-5', 180),
        ex('DB Row', 3, '6 Each', 120), ex('Weighted Parallel Bar Dips', 3, '6', 120),
    ]),
    w('LOWER C — STRENGTH', 'Lower strength C.', UL, 'strength', 55, [
        ex('Barbell Back Squat', 3, '2 @93-95%', 300), ex('Deadlift', 3, '2 @93-95%', 300),
        ex('Barbell Box Squat', 3, '3 @75%', 180), ex('Leg Press', 2, '10', 90, 'Recovery'),
        ex('Nordic Hamstring Curl', 3, '5', 120), ex('Mobility Work', 1, '15 Mins', 0),
    ]),
];

// PROGRAM 10 — Upper/Lower | Recomp
const P10: Workout[] = [
    w('UPPER A — RECOMP', 'Upper recomp A.', UL, 'recomp', 60, [
        ex('Incline Dumbbell Press', 4, 'S1×6@80%, S2×12@65%', 150), ex('Barbell Bent-Over Row', 4, 'S1×6, S2×12', 150),
        ex('Seated Press', 3, 'S1×6, S2×12', 150), ex('Wide Grip Lat Pulldown', 3, '10-12', 90),
        ex('Cable Chest Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Dumbbell Lateral Raises', 4, '15', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Cable Tricep Pushdown', 3, '12', 60),
    ]),
    w('LOWER A — RECOMP', 'Lower recomp A.', UL, 'recomp', 55, [
        ex('Barbell Back Squat', 4, 'S1×5, S2×12', 150), ex('Romanian Deadlift', 4, 'S1×5, S2×12', 150),
        ex('Leg Press', 3, '12-15', 60, 'REST PAUSE'), ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'),
        ex('Leg Curl', 3, '12-15', 60, 'REST PAUSE'), ex('Standing Calf Raise', 4, '15', 60),
        ex('Cable Crunch', 3, '15-20', 30),
    ]),
    w('UPPER B — RECOMP', 'Upper recomp B.', UL, 'recomp', 60, [
        ex('Flat Barbell Bench Press', 4, 'S1×5@82%, S2×10@65%', 150), ex('T-Bar Row', 4, 'S1×5, S2×10', 150),
        ex('Barbell Overhead Press', 3, 'S1×5, S2×10', 150), ex('Cable Pullover', 3, '12-15', 60),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Bent-Over Dumbbell Lateral Raise', 3, '15', 60),
        ex('Barbell Preacher Curl', 3, '12', 60), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
    ]),
    w('LOWER B — RECOMP', 'Lower recomp B.', UL, 'recomp', 55, [
        ex('Hack Squat Machine', 4, 'S1×6, S2×12', 150), ex('Deadlift', 4, 'S1×4, S2×10', 150),
        ex('Leg Extension', 3, '15', 60, 'REST PAUSE'), ex('Lying Leg Curl', 3, '12', 60, 'REST PAUSE'),
        ex('Barbell Hip Thrust', 3, '12', 90), ex('Adductor + Abductor', 2, '15 Each', 60),
        ex('Seated Calf Raise', 4, '15', 60),
    ]),
    w('UPPER C — RECOMP', 'Upper recomp C.', UL, 'recomp', 55, [
        ex('Incline Hammer Strength Press', 4, 'S1×6, S2×12', 150), ex('Wide Grip Lat Pulldown', 4, '10-12', 90),
        ex('Seated Dumbbell Shoulder Press', 3, '8-12', 90), ex('Reverse Pec Deck (Rear Delt)', 3, '15', 60),
        ex('Barbell Upright Row', 3, '10-12', 90), ex('Dumbbell Concentration Curl', 3, '12', 60),
        ex('Parallel Bar Dips', 3, 'Until Failure', 90),
    ]),
    w('LOWER C — RECOMP', 'Lower recomp C.', UL, 'recomp', 55, [
        ex('Smith Machine Squat', 4, '12-15', 90), ex('Dumbbell Romanian Deadlift', 4, '12', 90),
        ex('Walking Lunges', 3, '20', 60), ex('Leg Press', 3, '15', 60, 'REST PAUSE'),
        ex('Donkey Calf Raise', 4, '15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, '2 Sets Each', 30),
    ]),
];

// PROGRAM 11 — Upper/Lower | Maintenance
const P11: Workout[] = [
    w('UPPER A — MAINTENANCE', 'Upper maintenance A.', UL, 'maintenance', 50, [
        ex('Incline Dumbbell Press', 3, '10-12', 90), ex('Barbell Bent-Over Row', 3, '10-12', 90),
        ex('Seated Press', 3, '10-12', 90), ex('Wide Grip Lat Pulldown', 3, '10-12', 90),
        ex('Dumbbell Lateral Raises', 3, '15', 60), ex('Pec Deck Fly', 2, '12-15', 60),
        ex('EZ Bar Bicep Curl', 3, '10-12', 60), ex('Cable Tricep Pushdown', 3, '10-12', 60),
    ]),
    w('LOWER A — MAINTENANCE', 'Lower maintenance A.', UL, 'maintenance', 45, [
        ex('Barbell Back Squat', 3, '8-10', 120), ex('Romanian Deadlift', 3, '10-12', 90),
        ex('Leg Press', 3, '12', 90), ex('Leg Extension', 3, '12', 60),
        ex('Leg Curl', 3, '12', 60), ex('Standing Calf Raise', 3, '15', 60),
        ex('Cable Crunch', 2, '15', 30),
    ]),
    w('UPPER B — MAINTENANCE', 'Upper maintenance B.', UL, 'maintenance', 45, [
        ex('Flat Barbell Bench Press', 3, '10-12', 90), ex('T-Bar Row', 3, '10', 90),
        ex('Barbell Overhead Press', 3, '10-12', 90), ex('Seated Cable Row', 3, '12', 90),
        ex('Reverse Pec Deck (Rear Delt)', 3, '15', 60), ex('Hammer Curls', 3, '12', 60),
        ex('Parallel Bar Dips', 2, 'Until Failure', 90),
    ]),
    w('LOWER B — MAINTENANCE', 'Lower maintenance B.', UL, 'maintenance', 45, [
        ex('Hack Squat Machine', 3, '10-12', 90), ex('Deadlift', 3, '6-8', 180),
        ex('Leg Extension', 3, '12', 60), ex('Lying Leg Curl', 3, '12', 60),
        ex('Barbell Hip Thrust', 3, '12', 90), ex('Hip Adductor Machine', 2, '15', 60),
        ex('Seated Calf Raise', 3, '15', 60),
    ]),
    w('UPPER C — MAINTENANCE', 'Upper maintenance C.', UL, 'maintenance', 45, [
        ex('Incline Hammer Strength Press', 3, '10-12', 90), ex('Wide Grip Lat Pulldown', 3, '12', 90),
        ex('Seated Dumbbell Shoulder Press', 3, '12', 90), ex('Bent-Over Dumbbell Lateral Raise', 3, '15', 60),
        ex('Barbell Preacher Curl', 3, '12', 60), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
    ]),
    w('LOWER C — MAINTENANCE', 'Lower maintenance C.', UL, 'maintenance', 40, [
        ex('Walking Lunges', 3, '20', 60), ex('Dumbbell Romanian Deadlift', 3, '12', 90),
        ex('Leg Press', 3, '15', 90), ex('Leg Curl', 3, '12', 60),
        ex('Donkey Calf Raise', 3, '15', 60), ex('Core Circuit', 3, 'Circuit', 30),
    ]),
];

// PROGRAM 12 — Upper/Lower | Endurance
const P12: Workout[] = [
    w('UPPER A — ENDURANCE', 'Upper endurance A.', UL, 'endurance', 55, [
        ex('Dumbbell Chest Press', 4, '20-25', 45), ex('DB Row', 4, '20 Each', 45),
        ex('Seated Dumbbell Shoulder Press', 4, '20', 45), ex('Wide Grip Lat Pulldown', 4, '20', 45),
        ex('Cable Chest Fly', 3, '20-25', 30), ex('Dumbbell Lateral Raises', 4, '20-25', 30),
        ex('EZ Bar Bicep Curl', 4, '20', 30), ex('Cable Tricep Pushdown', 4, '20', 30),
        ex('Rowing Machine Cardio', 1, '10 Mins', 0),
    ]),
    w('LOWER A — ENDURANCE', 'Lower endurance A.', UL, 'endurance', 55, [
        ex('Goblet Squat', 5, '20-25', 45), ex('Walking Lunges', 5, '30 Steps', 30),
        ex('Leg Press', 4, '25', 30), ex('Leg Extension', 4, '25', 30),
        ex('Leg Curl', 4, '25', 30), ex('Standing Calf Raise', 5, '25', 30),
        ex('Bike', 1, '20 Mins', 0, 'Moderate'),
    ]),
    w('UPPER B — ENDURANCE', 'Upper endurance B.', UL, 'endurance', 50, [
        ex('Push-Ups', 4, 'Until Failure', 30), ex('Assisted Pull-Up', 4, '15-20', 45),
        ex('Arnold Press', 4, '20', 30), ex('Seated Cable Row', 4, '20', 30),
        ex('Band Pull-Apart', 4, '25', 15), ex('Hammer Curls', 4, '20', 30),
        ex('Parallel Bar Dips', 3, 'Until Failure', 30), ex('Core Circuit', 5, 'Circuit', 15),
    ]),
    w('LOWER B — ENDURANCE', 'Lower endurance B.', UL, 'endurance', 55, [
        ex('Bodyweight Squat', 5, '30', 30), ex('Step-Up', 4, '20 Each', 30),
        ex('Barbell Hip Thrust', 4, '20', 30), ex('Lying Leg Curl', 4, '25', 30),
        ex('Hip Adductor Machine', 3, '20', 30), ex('Donkey Calf Raise', 4, '25', 30),
        ex('Stairmaster', 1, '15 Mins', 0),
    ]),
    w('UPPER C — ENDURANCE', 'Upper timed circuit.', UL, 'endurance', 50, [
        ex('Timed Circuit: DB Press', 4, '45 Secs', 15), ex('Timed Circuit: DB Row', 4, '45 Secs', 15),
        ex('Timed Circuit: Shoulder Press', 4, '45 Secs', 15), ex('Timed Circuit: Pulldown', 4, '45 Secs', 15),
        ex('Timed Circuit: Cable Fly', 4, '45 Secs', 15), ex('Timed Circuit: Lateral Raise', 4, '45 Secs', 15),
        ex('Timed Circuit: Curl', 4, '45 Secs', 15), ex('Timed Circuit: Triceps', 4, '45 Secs', 15),
    ]),
    w('LOWER C — ENDURANCE', 'Lower timed circuit.', UL, 'endurance', 55, [
        ex('Timed: Squat', 4, '45 Secs', 15), ex('Timed: Lunge', 4, '45 Secs', 15),
        ex('Timed: Hip Thrust', 4, '45 Secs', 15), ex('Timed: Step-Up', 4, '45 Secs', 15),
        ex('Timed: Calf Raise', 4, '45 Secs', 15), ex('Timed: Leg Extension', 4, '45 Secs', 15),
        ex('Timed: Leg Curl', 4, '45 Secs', 15), ex('Timed: Jump Squat + Wall Sit', 4, '45 Secs', 15),
        ex('Treadmill Incline Walk', 1, '20 Min', 0, 'Finisher'),
    ]),
];

export const UPPER_LOWER_PROGRAMS: Workout[] = [...P7, ...P8, ...P9, ...P10, ...P11, ...P12];
