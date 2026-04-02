import { Workout, Exercise } from '../types';

function ex(name: string, sets: number, reps: string, rest = 120, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}
let _id = 300;
function w(name: string, desc: string, goal: Workout['goal'], mins: number, exercises: Exercise[]): Workout {
    return { id: `ppl${_id++}`, name, description: desc, category: 'Push / Pull / Legs', goal, estimatedMinutes: mins, exercises, createdAt: '2026-01-01' };
}

// PROGRAM 13 — PPL | Fat Loss
const P13: Workout[] = [
    w('PUSH DAY 1 — FAT LOSS', 'Push fat loss.', 'fat_loss', 55, [
        ex('Incline DB Press', 4, '12', 90), ex('Flat Bench Press', 3, '12-15', 90),
        ex('Seated Military Press', 4, '12', 90), ex('Upright Row', 3, '12-15', 90),
        ex('Cable Flys', 3, '15', 60, 'REST PAUSE'), ex('Side Lateral Raises', 4, '15-20', 60),
        ex('Dips', 3, 'Until Failure', 90), ex('Cable Triceps Pushdowns', 3, '15', 60),
        ex('Overhead Triceps Extension', 3, '15', 60), ex('Abs Circuit', 4, '2 Sets Each', 30),
    ]),
    w('PULL DAY 1 — FAT LOSS', 'Pull fat loss.', 'fat_loss', 55, [
        ex('High Rows', 4, '12', 90), ex('Rowing Machine Chest Supported', 3, '12', 60, 'REST PAUSE'),
        ex('Barbell Row', 4, '12', 90), ex('Chin Ups', 3, 'Until Failure', 90),
        ex('Cable Pull-Over', 3, '15', 60), ex('Reverse Butterfly', 3, '15', 60),
        ex('EZ Curls', 3, '12', 60), ex('Biceps Machine', 3, '12', 60, 'REST PAUSE'),
        ex('Cable Triceps Pushdowns', 3, '15', 60), ex('Shrugs', 3, '12', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY 1 — FAT LOSS', 'Legs fat loss.', 'fat_loss', 55, [
        ex('Leg Press', 3, '12-15', 60, 'REST PAUSE'), ex('Hack Squat', 4, '12', 90),
        ex('Leg Extension', 3, '15', 60, 'REST PAUSE'), ex('Deadlift', 4, '10', 120),
        ex('Leg Curl', 3, '15', 60, 'REST PAUSE'), ex('Abductor', 3, '15', 60),
        ex('Standing Calf', 5, '15', 60, 'REST PAUSE'), ex('Treadmill HIIT', 1, '15 Mins', 0),
    ]),
    w('PUSH DAY 2 — FAT LOSS', 'Push fat loss B.', 'fat_loss', 55, [
        ex('Incline Hammer Strength', 4, '12', 90), ex('Flat Chest Machine', 3, '12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell', 3, '12', 90), ex('Cable Flys Standing', 3, '15', 60),
        ex('Pec Dec', 3, '15', 60, 'REST PAUSE'), ex('Shoulder Press Barbell', 4, '12', 90),
        ex('Side Lateral Dumbbells', 4, '15', 60), ex('Crusifixed Triceps', 3, '12', 60),
        ex('Kick Backs', 3, '12', 60),
    ]),
    w('PULL DAY 2 — FAT LOSS', 'Pull fat loss B.', 'fat_loss', 55, [
        ex('Lat Pull Down', 3, '12', 60, 'REST PAUSE'), ex('Wide Grip Pull Down', 3, '12', 90),
        ex('T-Bar Row', 4, '10-12', 90), ex('Cable Row', 4, '12', 90),
        ex('Bent Over Lateral Raises', 5, '15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Shrugs', 3, '12', 60), ex('Abs Training', 1, '20 Mins', 0),
    ]),
    w('LEGS DAY 2 — FAT LOSS', 'Legs fat loss B.', 'fat_loss', 55, [
        ex('Lying Leg Curl', 3, '12-15', 60), ex('Smith Machine Squat', 4, '12', 90),
        ex('Hack Squat', 2, '12', 60, 'REST PAUSE'), ex('Leg Extension', 3, '15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max Steps', 60), ex('Dumbbell SLDL', 3, '12', 90),
        ex('Adductor', 3, '15', 60), ex('Seated Calf', 3, '15', 60),
        ex('Donkey Calf', 3, '15', 60),
    ]),
    w('ARMS DAY — FAT LOSS', 'Arms fat loss.', 'fat_loss', 50, [
        ex('Close Grip Bench', 3, '12', 90), ex('Overhead Triceps', 3, '12', 60),
        ex('Triceps Pushdown', 3, '12', 60), ex('Scott Curls', 3, '12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Concentration Curls', 5, '12', 60),
        ex('Abs Training', 4, 'Circuit', 30), ex('Jump Rope', 1, '10 Mins', 0, 'Finisher'),
    ]),
];

// PROGRAM 14 — PPL | Muscle Gain
const P14: Workout[] = [
    w('PUSH DAY 1 — MUSCLE GAIN', 'Push hypertrophy.', 'muscle_gain', 60, [
        ex('Incline DB Press', 4, '5-9 + 10-15', 120, 'REST PAUSE on S2'), ex('Flat Bench Press', 4, '6-10', 180),
        ex('Seated Military Press', 4, '6-10', 120), ex('Upright Row', 3, '10-12', 90),
        ex('Cable Flys', 3, '12-15', 60, 'REST PAUSE'), ex('Side Lateral Raises', 4, '12-15', 60),
        ex('Dips', 3, 'Until Failure', 90), ex('Overhead Triceps Extension', 3, '10-12', 60, 'REST PAUSE'),
        ex('Cable Triceps Pushdowns', 3, '10-12', 60),
    ]),
    w('PULL DAY 1 — MUSCLE GAIN', 'Pull hypertrophy.', 'muscle_gain', 60, [
        ex('High Rows', 4, '6-10', 120), ex('Rowing Machine', 3, '8-12', 60, 'REST PAUSE'),
        ex('Barbell Row', 4, '6-8', 120), ex('Chin Ups Weighted', 3, 'Until Failure', 90),
        ex('Cable Pull-Over', 3, '12-15', 60), ex('Reverse Butterfly', 3, '12-15', 60),
        ex('EZ Curls', 4, '10-12', 60), ex('Biceps Machine', 3, '10-12', 60, 'REST PAUSE'),
        ex('Shrugs', 3, '10-15', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY 1 — MUSCLE GAIN', 'Legs hypertrophy.', 'muscle_gain', 60, [
        ex('Leg Press', 3, '8-15', 90, 'REST PAUSE'), ex('Hack Squat', 4, '8-12', 120),
        ex('Leg Extension', 3, '10-15', 60, 'REST PAUSE'), ex('Deadlift', 4, '5-6 Heavy', 180),
        ex('Leg Curl', 3, '10-15', 60, 'REST PAUSE'), ex('Abductor Machine', 3, '12', 60),
        ex('Standing Calf', 5, '12-15', 60, 'REST PAUSE'),
    ]),
    w('PUSH DAY 2 — MUSCLE GAIN', 'Push hypertrophy B.', 'muscle_gain', 60, [
        ex('Incline Hammer Strength', 4, '8-12', 120), ex('Flat Chest Machine', 3, '8-12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell', 3, '10-12', 90), ex('Cable Flys Standing', 3, '12-15', 60),
        ex('Pec Dec', 3, '12-15', 60, 'REST PAUSE'), ex('Shoulder Press Barbell', 4, '6-10', 120),
        ex('Side Lateral Dumbbells', 4, '12-15', 60), ex('Crusifixed Triceps', 3, '10-12', 60),
        ex('Kick Backs', 3, '12', 60),
    ]),
    w('PULL DAY 2 — MUSCLE GAIN', 'Pull hypertrophy B.', 'muscle_gain', 55, [
        ex('Lat Pull Down', 3, '8-10', 60, 'REST PAUSE'), ex('Wide Grip Pull Down', 3, '10-12', 90),
        ex('T-Bar Row', 4, '8-10', 120), ex('Cable Row', 4, '10-12', 90),
        ex('Bent Over Lateral Raises', 5, '12-15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Shrugs', 3, '10-15', 60), ex('Abs Training', 4, 'Circuit', 30),
    ]),
    w('LEGS DAY 2 — MUSCLE GAIN', 'Legs hypertrophy B.', 'muscle_gain', 60, [
        ex('Lying Leg Curl', 3, '10-15', 60), ex('Smith Machine Squat', 4, '8-12', 120),
        ex('Hack Squat', 2, '8-12', 90, 'REST PAUSE'), ex('Leg Extension', 3, '10-15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max Steps', 60), ex('Dumbbell SLDL', 3, '10', 90),
        ex('Adductor', 3, '12-15', 60), ex('Seated Calf', 4, '12-15', 60, 'REST PAUSE'),
        ex('Donkey Calf', 3, '12-15', 60, 'REST PAUSE'),
    ]),
    w('ARMS DAY — MUSCLE GAIN', 'Arms hypertrophy.', 'muscle_gain', 55, [
        ex('Close Grip Bench', 3, '10-12', 90), ex('Overhead Triceps', 3, '10-12', 60, 'REST PAUSE'),
        ex('Triceps Pushdown', 3, '10-12', 60), ex('Scott Curls', 3, '10-12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Concentration Curls', 5, '12', 60),
        ex('Cable Reverse Curl', 3, '12', 60), ex('Abs Training', 4, 'Circuit', 30),
    ]),
];

// PROGRAM 15 — PPL | Strength
const P15: Workout[] = [
    w('PUSH DAY 1 — STRENGTH', 'Push strength.', 'strength', 65, [
        ex('Flat Bench Press', 5, '3-5 @85%', 240), ex('Incline DB Press', 4, '6-8', 120),
        ex('Seated Military Press', 5, '4-5', 180), ex('Upright Row', 3, '8', 90),
        ex('Cable Flys', 3, '12', 60, 'Pump'), ex('Weighted Dips', 4, '5-8', 120),
        ex('Skull Crushers', 4, '6-8', 90),
    ]),
    w('PULL DAY 1 — STRENGTH', 'Pull strength.', 'strength', 60, [
        ex('Barbell Row', 5, '4-5 @82%', 180), ex('Weighted Chin-Up', 5, '4-6', 180),
        ex('Chest Supported Row', 3, '6-8', 120), ex('Deadlift Variation', 4, '4-5', 180),
        ex('EZ Curls', 4, '8', 60), ex('Shrugs Heavy', 4, '8', 90),
    ]),
    w('LEGS DAY 1 — STRENGTH', 'Legs strength.', 'strength', 70, [
        ex('Back Squat', 5, '3-5 @85-88%', 300), ex('Conventional Deadlift', 4, '3-4', 240),
        ex('Pause Squat', 3, '3', 180), ex('Leg Press Heavy', 3, '8', 120),
        ex('Leg Curl', 3, '8', 90), ex('Standing Calf', 3, '12', 60),
    ]),
    w('PUSH DAY 2 — STRENGTH', 'Push strength B.', 'strength', 60, [
        ex('Incline Bench', 4, '3-5', 240), ex('Overhead Press Heavy', 5, '4-5', 180),
        ex('Close Grip Bench', 4, '5-6', 120), ex('DB Shoulder Press', 3, '6-8', 120),
        ex('Triceps Dips Weighted', 3, '6-8', 120), ex('Face Pull', 3, '15', 60, 'Health'),
    ]),
    w('PULL DAY 2 — STRENGTH', 'Pull strength B.', 'strength', 60, [
        ex('Deadlift', 4, '2-3 @90-92%', 300), ex('T-Bar Row', 4, '5-6', 120),
        ex('Wide Grip Pulldown', 4, '6-8', 120), ex('Barbell Shrugs Heavy', 4, '6', 90),
        ex('Hyperextensions', 3, '8', 60), ex('Barbell Curl', 4, '6-8', 60),
    ]),
    w('LEGS DAY 2 — STRENGTH', 'Legs strength B.', 'strength', 65, [
        ex('Front Squat', 4, '4-5', 240), ex('Romanian Deadlift Heavy', 4, '5', 180),
        ex('Hack Squat', 3, '6-8 Heavy', 120), ex('Nordic Hamstring Curl', 3, '5', 120),
        ex('Good Morning', 3, '6', 120), ex('Calf Raise Heavy', 3, '10', 60),
    ]),
    w('ARMS DAY — STRENGTH', 'Arms strength.', 'strength', 50, [
        ex('Close Grip Bench', 4, '6 Heavy', 120), ex('Overhead Triceps Heavy', 4, '8', 90),
        ex('EZ Curl Heavy', 4, '6-8', 90), ex('Hammer Curls', 3, '8', 60),
        ex('Barbell Preacher Curl', 4, '6-8', 90), ex('Triceps Pushdown', 3, '12', 60, 'Pump'),
    ]),
];

// PROGRAM 16 — PPL | Recomp
const P16: Workout[] = [
    w('PUSH DAY 1 — RECOMP', 'Push recomp.', 'recomp', 60, [
        ex('Incline DB Press', 4, 'S1×6@80%, S2×12@65%', 150), ex('Flat Bench Press', 4, 'S1×6, S2×12', 150),
        ex('Seated Military Press', 4, 'S1×6, S2×12', 150), ex('Upright Row', 3, '10-12', 90),
        ex('Cable Flys', 3, '12-15', 60, 'REST PAUSE'), ex('Side Lateral Raises', 4, '12-15', 60),
        ex('Dips', 3, 'Until Failure', 90), ex('Overhead Triceps', 3, '10-12', 60, 'REST PAUSE'),
    ]),
    w('PULL DAY 1 — RECOMP', 'Pull recomp.', 'recomp', 55, [
        ex('High Rows', 4, '8-10', 90), ex('Rowing Machine', 3, '10-12', 60, 'REST PAUSE'),
        ex('Barbell Row', 4, '6-10', 120), ex('Chin Ups', 3, 'Until Failure', 90),
        ex('Cable Pull-Over', 3, '12', 60), ex('Reverse Butterfly', 3, '12-15', 60),
        ex('EZ Curls', 3, '10-12', 60), ex('Biceps Machine', 3, '12', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY 1 — RECOMP', 'Legs recomp.', 'recomp', 55, [
        ex('Leg Press', 3, '10-15', 60, 'REST PAUSE'), ex('Hack Squat', 4, '10-12', 90),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Deadlift', 4, '6-8', 120),
        ex('Leg Curl', 3, '12-15', 60, 'REST PAUSE'), ex('Abductor', 3, '12', 60),
        ex('Standing Calf', 5, '15', 60, 'REST PAUSE'),
    ]),
    w('PUSH DAY 2 — RECOMP', 'Push recomp B.', 'recomp', 55, [
        ex('Incline Hammer Strength', 4, '8-12', 120), ex('Flat Chest Machine', 3, '10-12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell', 3, '10-12', 90), ex('Cable Flys Standing', 3, '12-15', 60),
        ex('Pec Dec', 3, '12-15', 60, 'REST PAUSE'), ex('Shoulder Press Barbell', 4, '6-10', 120),
        ex('Side Lateral Dumbbells', 4, '12-15', 60), ex('Crusifixed Triceps', 3, '12', 60),
        ex('Kick Backs', 3, '12', 60),
    ]),
    w('PULL DAY 2 — RECOMP', 'Pull recomp B.', 'recomp', 55, [
        ex('Lat Pull Down', 3, '10-12', 60, 'REST PAUSE'), ex('Wide Grip Pull Down', 3, '10-12', 90),
        ex('T-Bar Row', 4, '8-10', 90), ex('Cable Row', 4, '10-12', 90),
        ex('Bent Over Lateral Raises', 5, '12-15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Shrugs', 3, '10-15', 60, 'REST PAUSE'), ex('Abs Training', 1, '20 Mins', 0),
    ]),
    w('LEGS DAY 2 — RECOMP', 'Legs recomp B.', 'recomp', 55, [
        ex('Lying Leg Curl', 3, '10-15', 60), ex('Smith Machine Squat', 4, '10-12', 90),
        ex('Hack Squat', 2, '10-12', 60, 'REST PAUSE'), ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max Steps', 60), ex('DB Straight Leg Deadlift', 3, '10', 90),
        ex('Adductor', 3, '12', 60), ex('Seated Calf', 3, '15', 60), ex('Donkey Calf', 3, '15', 60),
    ]),
    w('ARMS DAY — RECOMP', 'Arms recomp.', 'recomp', 50, [
        ex('Close Grip Bench', 3, '12', 90), ex('Overhead Triceps', 3, '12', 60),
        ex('Triceps Pushdown', 3, '12', 60), ex('Scott Curls', 3, '12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Concentration Curls', 5, '12', 60),
        ex('Abs Training', 4, 'Circuit', 30),
    ]),
];

// PROGRAM 17 — PPL | Maintenance
const P17: Workout[] = [
    w('PUSH DAY 1 — MAINTENANCE', 'Push maintenance.', 'maintenance', 45, [
        ex('Incline DB Press', 3, '10-12', 90), ex('Flat Bench Press', 3, '10-12', 90),
        ex('Seated Military Press', 3, '10', 90), ex('Cable Flys', 2, '12-15', 60),
        ex('Side Lateral Raises', 3, '15', 60), ex('Dips', 2, 'Until Failure', 90),
        ex('Cable Triceps Pushdowns', 3, '12', 60), ex('Overhead Triceps', 3, '12', 60),
    ]),
    w('PULL DAY 1 — MAINTENANCE', 'Pull maintenance.', 'maintenance', 45, [
        ex('High Rows', 3, '10-12', 90), ex('Barbell Row', 3, '10', 90),
        ex('Chin Ups', 3, 'Until Failure', 90), ex('Cable Pull-Over', 3, '12', 60),
        ex('Reverse Butterfly', 3, '12-15', 60), ex('EZ Curls', 3, '12', 60),
        ex('Shrugs', 3, '12', 60),
    ]),
    w('LEGS DAY 1 — MAINTENANCE', 'Legs maintenance.', 'maintenance', 45, [
        ex('Leg Press', 3, '12-15', 90), ex('Hack Squat', 3, '12', 90),
        ex('Leg Extension', 3, '12', 60), ex('Leg Curl', 3, '12', 60),
        ex('Standing Calf', 4, '15', 60), ex('Abs Circuit', 3, '2 Sets', 30),
    ]),
    w('PUSH DAY 2 — MAINTENANCE', 'Push maintenance B.', 'maintenance', 45, [
        ex('Incline Hammer Strength', 3, '10-12', 90), ex('Flat Chest Machine', 3, '12', 90),
        ex('Shoulder Press Barbell', 3, '10-12', 90), ex('Side Lateral Dumbbells', 3, '15', 60),
        ex('Pec Dec', 2, '12-15', 60), ex('Triceps Pushdown', 3, '12', 60),
        ex('Kickbacks', 2, '12', 60),
    ]),
    w('PULL DAY 2 — MAINTENANCE', 'Pull maintenance B.', 'maintenance', 40, [
        ex('Lat Pull Down', 3, '12', 90), ex('T-Bar Row', 3, '10', 90),
        ex('Cable Row', 3, '10-12', 90), ex('Bent-Over Lateral', 3, '15', 60),
        ex('Shrugs', 3, '12', 60), ex('Hyperextensions', 2, 'Until Failure', 60),
    ]),
    w('LEGS DAY 2 — MAINTENANCE', 'Legs maintenance B.', 'maintenance', 40, [
        ex('Smith Machine Squat', 3, '12', 90), ex('Lying Leg Curl', 3, '12', 60),
        ex('Leg Extension', 3, '12', 60), ex('Walking Lunges', 3, '20 Steps', 60),
        ex('Calf Raise', 3, '15', 60), ex('Hip Thrust', 3, '12', 90),
    ]),
    w('ARMS DAY — MAINTENANCE', 'Arms maintenance.', 'maintenance', 35, [
        ex('Close Grip Bench', 3, '12', 90), ex('Triceps Pushdown', 3, '12', 60),
        ex('Scott Curls', 3, '12', 60), ex('Hammer Curls', 3, '12', 60),
        ex('Concentration Curls', 3, '12', 60), ex('Abs Training', 3, 'Circuit', 30),
    ]),
];

// PROGRAM 18 — PPL | Endurance
const P18: Workout[] = [
    w('PUSH DAY 1 — ENDURANCE', 'Push endurance.', 'endurance', 55, [
        ex('Incline DB Press', 4, '20', 45), ex('Flat Bench Press', 4, '20', 45),
        ex('Seated Military Press', 4, '20', 45), ex('Cable Flys', 4, '20-25', 30),
        ex('Side Lateral', 5, '20-25', 30), ex('Dips', 4, 'Until Failure', 30),
        ex('Triceps Pushdown', 4, '20', 30), ex('Overhead Triceps', 4, '20', 30),
        ex('Push-Up Superset', 3, 'Max', 30),
    ]),
    w('PULL DAY 1 — ENDURANCE', 'Pull endurance.', 'endurance', 55, [
        ex('High Rows', 4, '20', 45), ex('Barbell Row', 4, '20', 45),
        ex('Chin Ups', 4, 'Until Failure', 45), ex('Cable Pull-Over', 4, '20', 30),
        ex('Reverse Butterfly', 5, '20-25', 30), ex('EZ Curls', 4, '20', 30),
        ex('Biceps Machine', 4, '20', 30), ex('Shrugs', 4, '20', 30),
    ]),
    w('LEGS DAY 1 — ENDURANCE', 'Legs endurance.', 'endurance', 55, [
        ex('Leg Press', 4, '25-30', 45), ex('Hack Squat', 4, '20', 45),
        ex('Leg Extension', 4, '25', 30), ex('Leg Curl', 4, '25', 30),
        ex('Walking Lunges', 5, '30 Steps', 30), ex('Standing Calf', 5, '25', 30),
        ex('Bike Cardio', 1, '15 Mins', 0),
    ]),
    w('PUSH DAY 2 — ENDURANCE', 'Push endurance B.', 'endurance', 50, [
        ex('Incline Hammer', 4, '20', 45), ex('Flat Chest Machine', 4, '20', 45),
        ex('Shoulder Press', 4, '20', 45), ex('Side Lateral', 5, '20', 30),
        ex('Cable Fly Standing', 4, '20-25', 30), ex('Triceps Pushdown', 4, '20', 30),
        ex('Kickbacks', 3, 'Max', 30),
    ]),
    w('PULL DAY 2 — ENDURANCE', 'Pull endurance B.', 'endurance', 50, [
        ex('Lat Pull Down', 4, '20', 45), ex('T-Bar Row', 4, '20', 45),
        ex('Cable Row', 4, '20', 45), ex('Bent-Over Lateral', 5, '20', 30),
        ex('Hyperextensions Max', 3, 'Until Failure', 30), ex('Shrugs', 4, '20', 30),
        ex('ABS Circuit', 1, '20 Mins', 0),
    ]),
    w('LEGS DAY 2 — ENDURANCE', 'Legs endurance B.', 'endurance', 55, [
        ex('Smith Squat', 4, '20', 45), ex('Lying Leg Curl', 4, '20', 30),
        ex('Leg Extension', 4, '25', 30), ex('Lunges', 4, '30 Steps', 30),
        ex('DB SLDL', 4, '20', 30), ex('Adductor', 3, '20', 30),
        ex('Donkey Calf', 5, '25', 30), ex('Stairmaster', 1, '15 Mins', 0),
    ]),
    w('ARMS DAY — ENDURANCE', 'Arms endurance.', 'endurance', 55, [
        ex('Close Grip Bench', 4, '20', 45), ex('Overhead Triceps', 4, '20', 30),
        ex('Triceps Pushdown', 4, '20', 30), ex('Scott Curls', 4, '20', 30),
        ex('Hammer Curls', 4, '20', 30), ex('Concentration Curls', 5, '20', 30),
        ex('ABS', 4, '20 Reps Each', 15), ex('Jump Rope', 1, '10 Mins', 0, 'Finisher'),
    ]),
];

export const PPL_PROGRAMS: Workout[] = [...P13, ...P14, ...P15, ...P16, ...P17, ...P18];
