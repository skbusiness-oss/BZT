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
        ex('Incline Dumbbell Press', 4, '12', 90), ex('Flat Barbell Bench Press', 3, '12-15', 90),
        ex('Seated Barbell Military Press', 4, '12', 90), ex('Barbell Upright Row', 3, '12-15', 90),
        ex('Cable Chest Fly', 3, '15', 60, 'REST PAUSE'), ex('Dumbbell Lateral Raises', 4, '15-20', 60),
        ex('Parallel Bar Dips', 3, 'Until Failure', 90), ex('Cable Tricep Pushdown', 3, '15', 60),
        ex('Overhead Dumbbell Tricep Extension', 3, '15', 60), ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, '2 Sets Each', 30),
    ]),
    w('PULL DAY 1 — FAT LOSS', 'Pull fat loss.', 'fat_loss', 55, [
        ex('Seated High Cable Row', 4, '12', 90), ex('Chest-Supported Machine Row', 3, '12', 60, 'REST PAUSE'),
        ex('Barbell Bent-Over Row', 4, '12', 90), ex('Chin-Up (Max Reps)', 3, 'Until Failure', 90),
        ex('Cable Pullover', 3, '15', 60), ex('Reverse Pec Deck (Rear Delt)', 3, '15', 60),
        ex('EZ Bar Bicep Curl', 3, '12', 60), ex('Biceps Machine', 3, '12', 60, 'REST PAUSE'),
        ex('Cable Tricep Pushdown', 3, '15', 60), ex('Barbell Shrugs', 3, '12', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY 1 — FAT LOSS', 'Legs fat loss.', 'fat_loss', 55, [
        ex('Leg Press', 3, '12-15', 60, 'REST PAUSE'), ex('Hack Squat Machine', 4, '12', 90),
        ex('Leg Extension', 3, '15', 60, 'REST PAUSE'), ex('Deadlift', 4, '10', 120),
        ex('Leg Curl', 3, '15', 60, 'REST PAUSE'), ex('Hip Abductor Machine', 3, '15', 60),
        ex('Standing Calf Raise', 5, '15', 60, 'REST PAUSE'), ex('Treadmill HIIT', 1, '15 Mins', 0),
    ]),
    w('PUSH DAY 2 — FAT LOSS', 'Push fat loss B.', 'fat_loss', 55, [
        ex('Incline Hammer Strength Press', 4, '12', 90), ex('Flat Chest Press Machine', 3, '12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell Press', 3, '12', 90), ex('Standing Cable Chest Fly', 3, '15', 60),
        ex('Pec Deck Fly', 3, '15', 60, 'REST PAUSE'), ex('Barbell Overhead Press', 4, '12', 90),
        ex('Dumbbell Lateral Raises', 4, '15', 60), ex('Cable Overhead Tricep Extension', 3, '12', 60),
        ex('Dumbbell Tricep Kickback', 3, '12', 60),
    ]),
    w('PULL DAY 2 — FAT LOSS', 'Pull fat loss B.', 'fat_loss', 55, [
        ex('Wide Grip Lat Pulldown', 3, '12', 60, 'REST PAUSE'), ex('Wide Grip Lat Pulldown', 3, '12', 90),
        ex('T-Bar Row', 4, '10-12', 90), ex('Seated Cable Row', 4, '12', 90),
        ex('Bent-Over Dumbbell Lateral Raise', 5, '15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Barbell Shrugs', 3, '12', 60), ex('Core Circuit (Ab Wheel / Decline Crunch)', 1, '20 Mins', 0),
    ]),
    w('LEGS DAY 2 — FAT LOSS', 'Legs fat loss B.', 'fat_loss', 55, [
        ex('Lying Leg Curl', 3, '12-15', 60), ex('Smith Machine Squat', 4, '12', 90),
        ex('Hack Squat Machine', 2, '12', 60, 'REST PAUSE'), ex('Leg Extension', 3, '15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max Steps', 60), ex('Dumbbell Romanian Deadlift', 3, '12', 90),
        ex('Hip Adductor Machine', 3, '15', 60), ex('Seated Calf Raise', 3, '15', 60),
        ex('Donkey Calf Raise', 3, '15', 60),
    ]),
    w('ARMS DAY — FAT LOSS', 'Arms fat loss.', 'fat_loss', 50, [
        ex('Close Grip Barbell Bench Press', 3, '12', 90), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
        ex('Cable Tricep Pushdown', 3, '12', 60), ex('Barbell Preacher Curl', 3, '12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Dumbbell Concentration Curl', 5, '12', 60),
        ex('Core Circuit (Ab Wheel / Decline Crunch)', 4, 'Circuit', 30), ex('Jump Rope', 1, '10 Mins', 0, 'Finisher'),
    ]),
];

// PROGRAM 14 — PPL | Muscle Gain
const P14: Workout[] = [
    w('PUSH DAY 1 — MUSCLE GAIN', 'Push hypertrophy.', 'muscle_gain', 60, [
        ex('Incline Dumbbell Press', 4, '5-9 + 10-15', 120, 'REST PAUSE on S2'), ex('Flat Barbell Bench Press', 4, '6-10', 180),
        ex('Seated Barbell Military Press', 4, '6-10', 120), ex('Barbell Upright Row', 3, '10-12', 90),
        ex('Cable Chest Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Dumbbell Lateral Raises', 4, '12-15', 60),
        ex('Parallel Bar Dips', 3, 'Until Failure', 90), ex('Overhead Dumbbell Tricep Extension', 3, '10-12', 60, 'REST PAUSE'),
        ex('Cable Tricep Pushdown', 3, '10-12', 60),
    ]),
    w('PULL DAY 1 — MUSCLE GAIN', 'Pull hypertrophy.', 'muscle_gain', 60, [
        ex('Seated High Cable Row', 4, '6-10', 120), ex('Chest-Supported Machine Row', 3, '8-12', 60, 'REST PAUSE'),
        ex('Barbell Bent-Over Row', 4, '6-8', 120), ex('Weighted Chin-Up', 3, 'Until Failure', 90),
        ex('Cable Pullover', 3, '12-15', 60), ex('Reverse Pec Deck (Rear Delt)', 3, '12-15', 60),
        ex('EZ Bar Bicep Curl', 4, '10-12', 60), ex('Biceps Machine', 3, '10-12', 60, 'REST PAUSE'),
        ex('Barbell Shrugs', 3, '10-15', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY 1 — MUSCLE GAIN', 'Legs hypertrophy.', 'muscle_gain', 60, [
        ex('Leg Press', 3, '8-15', 90, 'REST PAUSE'), ex('Hack Squat Machine', 4, '8-12', 120),
        ex('Leg Extension', 3, '10-15', 60, 'REST PAUSE'), ex('Deadlift', 4, '5-6 Heavy', 180),
        ex('Leg Curl', 3, '10-15', 60, 'REST PAUSE'), ex('Hip Abductor Machine', 3, '12', 60),
        ex('Standing Calf Raise', 5, '12-15', 60, 'REST PAUSE'),
    ]),
    w('PUSH DAY 2 — MUSCLE GAIN', 'Push hypertrophy B.', 'muscle_gain', 60, [
        ex('Incline Hammer Strength Press', 4, '8-12', 120), ex('Flat Chest Press Machine', 3, '8-12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell Press', 3, '10-12', 90), ex('Standing Cable Chest Fly', 3, '12-15', 60),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Barbell Overhead Press', 4, '6-10', 120),
        ex('Dumbbell Lateral Raises', 4, '12-15', 60), ex('Cable Overhead Tricep Extension', 3, '10-12', 60),
        ex('Dumbbell Tricep Kickback', 3, '12', 60),
    ]),
    w('PULL DAY 2 — MUSCLE GAIN', 'Pull hypertrophy B.', 'muscle_gain', 55, [
        ex('Wide Grip Lat Pulldown', 3, '8-10', 60, 'REST PAUSE'), ex('Wide Grip Lat Pulldown', 3, '10-12', 90),
        ex('T-Bar Row', 4, '8-10', 120), ex('Seated Cable Row', 4, '10-12', 90),
        ex('Bent-Over Dumbbell Lateral Raise', 5, '12-15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Barbell Shrugs', 3, '10-15', 60), ex('Core Circuit (Ab Wheel / Decline Crunch)', 4, 'Circuit', 30),
    ]),
    w('LEGS DAY 2 — MUSCLE GAIN', 'Legs hypertrophy B.', 'muscle_gain', 60, [
        ex('Lying Leg Curl', 3, '10-15', 60), ex('Smith Machine Squat', 4, '8-12', 120),
        ex('Hack Squat Machine', 2, '8-12', 90, 'REST PAUSE'), ex('Leg Extension', 3, '10-15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max Steps', 60), ex('Dumbbell Romanian Deadlift', 3, '10', 90),
        ex('Hip Adductor Machine', 3, '12-15', 60), ex('Seated Calf Raise', 4, '12-15', 60, 'REST PAUSE'),
        ex('Donkey Calf Raise', 3, '12-15', 60, 'REST PAUSE'),
    ]),
    w('ARMS DAY — MUSCLE GAIN', 'Arms hypertrophy.', 'muscle_gain', 55, [
        ex('Close Grip Barbell Bench Press', 3, '10-12', 90), ex('Overhead Dumbbell Tricep Extension', 3, '10-12', 60, 'REST PAUSE'),
        ex('Cable Tricep Pushdown', 3, '10-12', 60), ex('Barbell Preacher Curl', 3, '10-12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Dumbbell Concentration Curl', 5, '12', 60),
        ex('Cable Reverse Curl', 3, '12', 60), ex('Core Circuit (Ab Wheel / Decline Crunch)', 4, 'Circuit', 30),
    ]),
];

// PROGRAM 15 — PPL | Strength
const P15: Workout[] = [
    w('PUSH DAY 1 — STRENGTH', 'Push strength.', 'strength', 65, [
        ex('Flat Barbell Bench Press', 5, '3-5 @85%', 240), ex('Incline Dumbbell Press', 4, '6-8', 120),
        ex('Seated Barbell Military Press', 5, '4-5', 180), ex('Barbell Upright Row', 3, '8', 90),
        ex('Cable Chest Fly', 3, '12', 60, 'Pump'), ex('Weighted Parallel Bar Dips', 4, '5-8', 120),
        ex('EZ Bar Skull Crushers', 4, '6-8', 90),
    ]),
    w('PULL DAY 1 — STRENGTH', 'Pull strength.', 'strength', 60, [
        ex('Barbell Bent-Over Row', 5, '4-5 @82%', 180), ex('Weighted Chin-Up', 5, '4-6', 180),
        ex('Chest-Supported Dumbbell Row', 3, '6-8', 120), ex('Romanian Deadlift', 4, '4-5', 180),
        ex('EZ Bar Bicep Curl', 4, '8', 60), ex('Barbell Shrugs', 4, '8', 90),
    ]),
    w('LEGS DAY 1 — STRENGTH', 'Legs strength.', 'strength', 70, [
        ex('Barbell Back Squat', 5, '3-5 @85-88%', 300), ex('Conventional Deadlift', 4, '3-4', 240),
        ex('Barbell Pause Squat', 3, '3', 180), ex('Leg Press', 3, '8', 120),
        ex('Leg Curl', 3, '8', 90), ex('Standing Calf Raise', 3, '12', 60),
    ]),
    w('PUSH DAY 2 — STRENGTH', 'Push strength B.', 'strength', 60, [
        ex('Incline Barbell Bench Press', 4, '3-5', 240), ex('Barbell Overhead Press', 5, '4-5', 180),
        ex('Close Grip Barbell Bench Press', 4, '5-6', 120), ex('Seated Dumbbell Shoulder Press', 3, '6-8', 120),
        ex('Weighted Parallel Bar Dips', 3, '6-8', 120), ex('Cable Face Pull', 3, '15', 60, 'Health'),
    ]),
    w('PULL DAY 2 — STRENGTH', 'Pull strength B.', 'strength', 60, [
        ex('Deadlift', 4, '2-3 @90-92%', 300), ex('T-Bar Row', 4, '5-6', 120),
        ex('Wide Grip Lat Pulldown', 4, '6-8', 120), ex('Barbell Shrugs', 4, '6', 90),
        ex('Hyperextensions', 3, '8', 60), ex('Barbell Curl', 4, '6-8', 60),
    ]),
    w('LEGS DAY 2 — STRENGTH', 'Legs strength B.', 'strength', 65, [
        ex('Barbell Front Squat', 4, '4-5', 240), ex('Romanian Deadlift', 4, '5', 180),
        ex('Hack Squat Machine', 3, '6-8 Heavy', 120), ex('Nordic Hamstring Curl', 3, '5', 120),
        ex('Barbell Good Morning', 3, '6', 120), ex('Standing Calf Raise', 3, '10', 60),
    ]),
    w('ARMS DAY — STRENGTH', 'Arms strength.', 'strength', 50, [
        ex('Close Grip Barbell Bench Press', 4, '6 Heavy', 120), ex('Overhead Dumbbell Tricep Extension', 4, '8', 90),
        ex('EZ Bar Bicep Curl', 4, '6-8', 90), ex('Hammer Curls', 3, '8', 60),
        ex('Barbell Preacher Curl', 4, '6-8', 90), ex('Cable Tricep Pushdown', 3, '12', 60, 'Pump'),
    ]),
];

// PROGRAM 16 — PPL | Recomp
const P16: Workout[] = [
    w('PUSH DAY 1 — RECOMP', 'Push recomp.', 'recomp', 60, [
        ex('Incline Dumbbell Press', 4, 'S1×6@80%, S2×12@65%', 150), ex('Flat Barbell Bench Press', 4, 'S1×6, S2×12', 150),
        ex('Seated Barbell Military Press', 4, 'S1×6, S2×12', 150), ex('Barbell Upright Row', 3, '10-12', 90),
        ex('Cable Chest Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Dumbbell Lateral Raises', 4, '12-15', 60),
        ex('Parallel Bar Dips', 3, 'Until Failure', 90), ex('Overhead Dumbbell Tricep Extension', 3, '10-12', 60, 'REST PAUSE'),
    ]),
    w('PULL DAY 1 — RECOMP', 'Pull recomp.', 'recomp', 55, [
        ex('Seated High Cable Row', 4, '8-10', 90), ex('Chest-Supported Machine Row', 3, '10-12', 60, 'REST PAUSE'),
        ex('Barbell Bent-Over Row', 4, '6-10', 120), ex('Chin-Up (Max Reps)', 3, 'Until Failure', 90),
        ex('Cable Pullover', 3, '12', 60), ex('Reverse Pec Deck (Rear Delt)', 3, '12-15', 60),
        ex('EZ Bar Bicep Curl', 3, '10-12', 60), ex('Biceps Machine', 3, '12', 60, 'REST PAUSE'),
    ]),
    w('LEGS DAY 1 — RECOMP', 'Legs recomp.', 'recomp', 55, [
        ex('Leg Press', 3, '10-15', 60, 'REST PAUSE'), ex('Hack Squat Machine', 4, '10-12', 90),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Deadlift', 4, '6-8', 120),
        ex('Leg Curl', 3, '12-15', 60, 'REST PAUSE'), ex('Hip Abductor Machine', 3, '12', 60),
        ex('Standing Calf Raise', 5, '15', 60, 'REST PAUSE'),
    ]),
    w('PUSH DAY 2 — RECOMP', 'Push recomp B.', 'recomp', 55, [
        ex('Incline Hammer Strength Press', 4, '8-12', 120), ex('Flat Chest Press Machine', 3, '10-12', 60, 'REST PAUSE'),
        ex('Decline Dumbbell Press', 3, '10-12', 90), ex('Standing Cable Chest Fly', 3, '12-15', 60),
        ex('Pec Deck Fly', 3, '12-15', 60, 'REST PAUSE'), ex('Barbell Overhead Press', 4, '6-10', 120),
        ex('Dumbbell Lateral Raises', 4, '12-15', 60), ex('Cable Overhead Tricep Extension', 3, '12', 60),
        ex('Dumbbell Tricep Kickback', 3, '12', 60),
    ]),
    w('PULL DAY 2 — RECOMP', 'Pull recomp B.', 'recomp', 55, [
        ex('Wide Grip Lat Pulldown', 3, '10-12', 60, 'REST PAUSE'), ex('Wide Grip Lat Pulldown', 3, '10-12', 90),
        ex('T-Bar Row', 4, '8-10', 90), ex('Seated Cable Row', 4, '10-12', 90),
        ex('Bent-Over Dumbbell Lateral Raise', 5, '12-15', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
        ex('Barbell Shrugs', 3, '10-15', 60, 'REST PAUSE'), ex('Core Circuit (Ab Wheel / Decline Crunch)', 1, '20 Mins', 0),
    ]),
    w('LEGS DAY 2 — RECOMP', 'Legs recomp B.', 'recomp', 55, [
        ex('Lying Leg Curl', 3, '10-15', 60), ex('Smith Machine Squat', 4, '10-12', 90),
        ex('Hack Squat Machine', 2, '10-12', 60, 'REST PAUSE'), ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, 'Max Steps', 60), ex('Dumbbell Romanian Deadlift', 3, '10', 90),
        ex('Hip Adductor Machine', 3, '12', 60), ex('Seated Calf Raise', 3, '15', 60), ex('Donkey Calf Raise', 3, '15', 60),
    ]),
    w('ARMS DAY — RECOMP', 'Arms recomp.', 'recomp', 50, [
        ex('Close Grip Barbell Bench Press', 3, '12', 90), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
        ex('Cable Tricep Pushdown', 3, '12', 60), ex('Barbell Preacher Curl', 3, '12', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Dumbbell Concentration Curl', 5, '12', 60),
        ex('Core Circuit (Ab Wheel / Decline Crunch)', 4, 'Circuit', 30),
    ]),
];

// PROGRAM 17 — PPL | Maintenance
const P17: Workout[] = [
    w('PUSH DAY 1 — MAINTENANCE', 'Push maintenance.', 'maintenance', 45, [
        ex('Incline Dumbbell Press', 3, '10-12', 90), ex('Flat Barbell Bench Press', 3, '10-12', 90),
        ex('Seated Barbell Military Press', 3, '10', 90), ex('Cable Chest Fly', 2, '12-15', 60),
        ex('Dumbbell Lateral Raises', 3, '15', 60), ex('Parallel Bar Dips', 2, 'Until Failure', 90),
        ex('Cable Tricep Pushdown', 3, '12', 60), ex('Overhead Dumbbell Tricep Extension', 3, '12', 60),
    ]),
    w('PULL DAY 1 — MAINTENANCE', 'Pull maintenance.', 'maintenance', 45, [
        ex('Seated High Cable Row', 3, '10-12', 90), ex('Barbell Bent-Over Row', 3, '10', 90),
        ex('Chin-Up (Max Reps)', 3, 'Until Failure', 90), ex('Cable Pullover', 3, '12', 60),
        ex('Reverse Pec Deck (Rear Delt)', 3, '12-15', 60), ex('EZ Bar Bicep Curl', 3, '12', 60),
        ex('Barbell Shrugs', 3, '12', 60),
    ]),
    w('LEGS DAY 1 — MAINTENANCE', 'Legs maintenance.', 'maintenance', 45, [
        ex('Leg Press', 3, '12-15', 90), ex('Hack Squat Machine', 3, '12', 90),
        ex('Leg Extension', 3, '12', 60), ex('Leg Curl', 3, '12', 60),
        ex('Standing Calf Raise', 4, '15', 60), ex('Core Circuit (Plank / Crunch / Leg Raise)', 3, '2 Sets', 30),
    ]),
    w('PUSH DAY 2 — MAINTENANCE', 'Push maintenance B.', 'maintenance', 45, [
        ex('Incline Hammer Strength Press', 3, '10-12', 90), ex('Flat Chest Press Machine', 3, '12', 90),
        ex('Barbell Overhead Press', 3, '10-12', 90), ex('Dumbbell Lateral Raises', 3, '15', 60),
        ex('Pec Deck Fly', 2, '12-15', 60), ex('Cable Tricep Pushdown', 3, '12', 60),
        ex('Dumbbell Tricep Kickback', 2, '12', 60),
    ]),
    w('PULL DAY 2 — MAINTENANCE', 'Pull maintenance B.', 'maintenance', 40, [
        ex('Wide Grip Lat Pulldown', 3, '12', 90), ex('T-Bar Row', 3, '10', 90),
        ex('Seated Cable Row', 3, '10-12', 90), ex('Bent-Over Dumbbell Lateral Raise', 3, '15', 60),
        ex('Barbell Shrugs', 3, '12', 60), ex('Hyperextensions', 2, 'Until Failure', 60),
    ]),
    w('LEGS DAY 2 — MAINTENANCE', 'Legs maintenance B.', 'maintenance', 40, [
        ex('Smith Machine Squat', 3, '12', 90), ex('Lying Leg Curl', 3, '12', 60),
        ex('Leg Extension', 3, '12', 60), ex('Walking Lunges', 3, '20 Steps', 60),
        ex('Standing Calf Raise', 3, '15', 60), ex('Barbell Hip Thrust', 3, '12', 90),
    ]),
    w('ARMS DAY — MAINTENANCE', 'Arms maintenance.', 'maintenance', 35, [
        ex('Close Grip Barbell Bench Press', 3, '12', 90), ex('Cable Tricep Pushdown', 3, '12', 60),
        ex('Barbell Preacher Curl', 3, '12', 60), ex('Hammer Curls', 3, '12', 60),
        ex('Dumbbell Concentration Curl', 3, '12', 60), ex('Core Circuit (Ab Wheel / Decline Crunch)', 3, 'Circuit', 30),
    ]),
];

// PROGRAM 18 — PPL | Endurance
const P18: Workout[] = [
    w('PUSH DAY 1 — ENDURANCE', 'Push endurance.', 'endurance', 55, [
        ex('Incline Dumbbell Press', 4, '20', 45), ex('Flat Barbell Bench Press', 4, '20', 45),
        ex('Seated Barbell Military Press', 4, '20', 45), ex('Cable Chest Fly', 4, '20-25', 30),
        ex('Dumbbell Lateral Raises', 5, '20-25', 30), ex('Parallel Bar Dips', 4, 'Until Failure', 30),
        ex('Cable Tricep Pushdown', 4, '20', 30), ex('Overhead Dumbbell Tricep Extension', 4, '20', 30),
        ex('Push-Up Superset', 3, 'Max', 30),
    ]),
    w('PULL DAY 1 — ENDURANCE', 'Pull endurance.', 'endurance', 55, [
        ex('Seated High Cable Row', 4, '20', 45), ex('Barbell Bent-Over Row', 4, '20', 45),
        ex('Chin-Up (Max Reps)', 4, 'Until Failure', 45), ex('Cable Pullover', 4, '20', 30),
        ex('Reverse Pec Deck (Rear Delt)', 5, '20-25', 30), ex('EZ Bar Bicep Curl', 4, '20', 30),
        ex('Biceps Machine', 4, '20', 30), ex('Barbell Shrugs', 4, '20', 30),
    ]),
    w('LEGS DAY 1 — ENDURANCE', 'Legs endurance.', 'endurance', 55, [
        ex('Leg Press', 4, '25-30', 45), ex('Hack Squat Machine', 4, '20', 45),
        ex('Leg Extension', 4, '25', 30), ex('Leg Curl', 4, '25', 30),
        ex('Walking Lunges', 5, '30 Steps', 30), ex('Standing Calf Raise', 5, '25', 30),
        ex('Bike Cardio', 1, '15 Mins', 0),
    ]),
    w('PUSH DAY 2 — ENDURANCE', 'Push endurance B.', 'endurance', 50, [
        ex('Incline Hammer Strength Press', 4, '20', 45), ex('Flat Chest Press Machine', 4, '20', 45),
        ex('Barbell Overhead Press', 4, '20', 45), ex('Dumbbell Lateral Raises', 5, '20', 30),
        ex('Standing Cable Chest Fly', 4, '20-25', 30), ex('Cable Tricep Pushdown', 4, '20', 30),
        ex('Dumbbell Tricep Kickback', 3, 'Max', 30),
    ]),
    w('PULL DAY 2 — ENDURANCE', 'Pull endurance B.', 'endurance', 50, [
        ex('Wide Grip Lat Pulldown', 4, '20', 45), ex('T-Bar Row', 4, '20', 45),
        ex('Seated Cable Row', 4, '20', 45), ex('Bent-Over Dumbbell Lateral Raise', 5, '20', 30),
        ex('Hyperextensions Max', 3, 'Until Failure', 30), ex('Barbell Shrugs', 4, '20', 30),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 1, '20 Mins', 0),
    ]),
    w('LEGS DAY 2 — ENDURANCE', 'Legs endurance B.', 'endurance', 55, [
        ex('Smith Machine Squat', 4, '20', 45), ex('Lying Leg Curl', 4, '20', 30),
        ex('Leg Extension', 4, '25', 30), ex('Lunges', 4, '30 Steps', 30),
        ex('Dumbbell Romanian Deadlift', 4, '20', 30), ex('Hip Adductor Machine', 3, '20', 30),
        ex('Donkey Calf Raise', 5, '25', 30), ex('Stairmaster', 1, '15 Mins', 0),
    ]),
    w('ARMS DAY — ENDURANCE', 'Arms endurance.', 'endurance', 55, [
        ex('Close Grip Barbell Bench Press', 4, '20', 45), ex('Overhead Dumbbell Tricep Extension', 4, '20', 30),
        ex('Cable Tricep Pushdown', 4, '20', 30), ex('Barbell Preacher Curl', 4, '20', 30),
        ex('Hammer Curls', 4, '20', 30), ex('Dumbbell Concentration Curl', 5, '20', 30),
        ex('Core Circuit (Plank / Crunch / Leg Raise)', 4, '20 Reps Each', 15), ex('Jump Rope', 1, '10 Mins', 0, 'Finisher'),
    ]),
];

export const PPL_PROGRAMS: Workout[] = [...P13, ...P14, ...P15, ...P16, ...P17, ...P18];
