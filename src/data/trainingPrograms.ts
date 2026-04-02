import { Workout, Exercise } from '../types';

// Helper to create exercise objects compactly
function ex(name: string, sets: number, reps: string, rest = 120, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}

let _id = 100;
function w(name: string, desc: string, cat: string, goal: Workout['goal'], mins: number, exercises: Exercise[]): Workout {
    return { id: `tp${_id++}`, name, description: desc, category: cat, goal, estimatedMinutes: mins, exercises, createdAt: '2026-01-01' };
}

const FB = 'Full Body';
const UL = 'Upper / Lower';
const PPL = 'Push / Pull / Legs';
const BRO = 'Bro Split';
const PL = 'Powerlifting';
const HIIT = 'HIIT / Circuit';
const CARDIO = 'Cardio-Focused';

// ═══════════════════════════════════════════
// SPLIT 1: FULL BODY
// ═══════════════════════════════════════════

// PROGRAM 1 — Full Body | Fat Loss
const P1: Workout[] = [
    w('FULL BODY A — FAT LOSS: METABOLIC BURN', 'High-intensity metabolic conditioning.', FB, 'fat_loss', 55, [
        ex('Barbell Squat', 4, '12-15', 90), ex('Dumbbell Romanian Deadlift', 3, '12', 90),
        ex('Push-Up Superset w/ DB Row', 3, '15', 60), ex('Dumbbell Shoulder Press', 3, '12-15', 90),
        ex('Cable Lat Pulldown', 3, '15', 90), ex('Kettlebell Swing', 4, '20', 60),
        ex('Mountain Climbers', 3, '30 Secs', 30), ex('Plank Hold', 3, '45 Secs', 30),
        ex('Jump Rope', 1, '5 Minutes', 0, 'Finisher'),
    ]),
    w('FULL BODY B — FAT LOSS: CIRCUIT STYLE', 'Circuit-style fat burning.', FB, 'fat_loss', 55, [
        ex('Hex Bar Deadlift', 4, '12', 90), ex('Incline DB Press', 3, '12-15', 90),
        ex('Goblet Squat', 3, '15-20', 60), ex('Seated Cable Row', 3, '15', 90),
        ex('DB Lateral Raises', 3, '15-20', 60), ex('Bulgarian Split Squat', 3, '12 Each', 90),
        ex('Dips', 3, 'Until Failure', 90), ex('Bicycle Crunch', 3, '20', 30),
        ex('Treadmill HIIT Intervals', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('FULL BODY C — FAT LOSS: STRENGTH CIRCUIT', 'Strength-based circuit.', FB, 'fat_loss', 55, [
        ex('Front Squat', 4, '10', 120), ex('Barbell Bench Press', 4, '10-12', 120),
        ex('Barbell Row', 4, '10', 120), ex('Overhead Press', 3, '10-12', 90),
        ex('Hip Thrust', 3, '15', 90), ex('Face Pull', 3, '15', 60),
        ex('Hanging Leg Raise', 3, '15', 60), ex('Farmer\'s Walk', 3, '40m', 90),
    ]),
    w('FULL BODY D — FAT LOSS: DENSITY BLOCK', 'High-density training block.', FB, 'fat_loss', 55, [
        ex('Romanian Deadlift', 4, '12', 90), ex('Cable Chest Fly', 3, '15', 60),
        ex('Hack Squat Machine', 3, '15', 90), ex('Wide Grip Pull-Down', 3, '12-15', 90),
        ex('DB Arnold Press', 3, '12', 90), ex('Walking Lunges', 3, '20 Steps', 60),
        ex('Triceps Rope Pushdown', 3, '15', 60), ex('EZ Bar Curl', 3, '15', 60),
        ex('Battle Ropes', 3, '30 Secs', 30, 'Finisher'),
    ]),
    w('FULL BODY E — FAT LOSS: POWER BURN', 'Power-based fat burning.', FB, 'fat_loss', 55, [
        ex('Power Clean (light)', 4, '8', 120), ex('Flat Bench Press', 3, '10-12', 120),
        ex('Barbell Back Squat', 3, '10', 120), ex('T-Bar Row', 3, '10-12', 120),
        ex('DB Lateral Raise Drop Set', 3, 'Drop Set', 60), ex('Leg Press', 3, '15', 90),
        ex('Overhead Triceps Extension', 3, '15', 60), ex('Hammer Curls', 3, '15', 60),
        ex('Box Jumps', 3, '10', 60),
    ]),
    w('FULL BODY F — FAT LOSS: HIGH REP FINISH', 'High-rep metabolic finisher.', FB, 'fat_loss', 55, [
        ex('Smith Machine Squat', 4, '15-20', 90), ex('Incline Chest Machine', 3, '15-20', 90),
        ex('Chest-Supported DB Row', 3, '15', 90), ex('DB Side Lateral', 4, '20', 60),
        ex('Leg Extension', 3, '15-20', 60, 'REST PAUSE'), ex('Leg Curl', 3, '15-20', 60, 'REST PAUSE'),
        ex('Cable Crunch', 4, '20', 30), ex('Reverse Crunch', 3, '15', 30),
        ex('Stairmaster', 1, '15 Min', 0, 'Finisher'),
    ]),
];

// PROGRAM 2 — Full Body | Muscle Gain
const P2: Workout[] = [
    w('FULL BODY A — HYPERTROPHY: PUSH EMPHASIS', 'Progressive overload full body hypertrophy.', FB, 'muscle_gain', 65, [
        ex('Barbell Back Squat', 4, '6-10', 180, 'REST PAUSE'), ex('Incline Dumbbell Press', 4, '8-12', 120),
        ex('Romanian Deadlift', 3, '8-10', 120), ex('Seated DB Shoulder Press', 4, '8-12', 120),
        ex('Cable Lat Pulldown', 3, '10-12', 90), ex('Cable Fly', 3, '12-15', 60, 'REST PAUSE'),
        ex('DB Lateral Raises', 4, '12-15', 60), ex('EZ Bar Curl', 3, '10-12', 60),
        ex('Overhead Triceps Extension', 3, '10-12', 60),
    ]),
    w('FULL BODY B — HYPERTROPHY: PULL EMPHASIS', 'Pull-focused hypertrophy.', FB, 'muscle_gain', 65, [
        ex('Conventional Deadlift', 4, '5-8', 180), ex('Barbell Row', 4, '8-10', 120),
        ex('Flat DB Bench Press', 4, '8-12', 120), ex('Cable Pull-Over', 3, '12-15', 90),
        ex('Bulgarian Split Squat', 3, '10 Each', 90), ex('Reverse Butterfly', 3, '12-15', 60),
        ex('Upright Row', 3, '10-12', 90), ex('Concentration Curls', 4, '12', 60),
        ex('Triceps Dips', 3, 'Until Failure', 90),
    ]),
    w('FULL BODY C — HYPERTROPHY: LEG EMPHASIS', 'Leg-focused hypertrophy.', FB, 'muscle_gain', 65, [
        ex('Hack Squat', 4, '8-12', 120, 'REST PAUSE'), ex('Leg Press', 3, '10-15', 120),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Lying Leg Curl', 3, '12-15', 60, 'REST PAUSE'),
        ex('Incline Hammer Strength Press', 4, '8-12', 120), ex('Chest-Supported Row', 3, '10-12', 90),
        ex('Seated Military Press', 3, '8-10', 120), ex('Standing Calf Raise', 5, '12-15', 60, 'REST PAUSE'),
    ]),
    w('FULL BODY D — HYPERTROPHY: UPPER EMPHASIS', 'Upper body hypertrophy focus.', FB, 'muscle_gain', 65, [
        ex('Smith Machine Incline Press', 4, '8-12', 120), ex('Pec Dec', 3, '12-15', 60, 'REST PAUSE'),
        ex('Seated Cable Row', 4, '8-12', 120), ex('Wide Grip Pulldown', 3, '10-12', 90),
        ex('Barbell Shoulder Press', 4, '6-10', 120), ex('Shrugs', 3, '10-15', 90, 'REST PAUSE'),
        ex('Goblet Squat', 3, '10-12', 90), ex('DB Straight Leg Deadlift', 3, '10-12', 90),
        ex('Abs Circuit', 4, '2 Sets Each', 30, '4 exercises'),
    ]),
    w('FULL BODY E — HYPERTROPHY: POWER + VOLUME', 'Power and volume combo.', FB, 'muscle_gain', 65, [
        ex('Front Squat', 4, '6-8', 180), ex('Close Grip Bench', 4, '8-10', 120),
        ex('T-Bar Row', 4, '8-10', 120), ex('DB Lateral Raise', 4, '12-15', 60),
        ex('Leg Press', 3, '10-15', 90, 'REST PAUSE'), ex('Stiff Leg Deadlift', 3, '10', 120),
        ex('Scott Curls', 3, '10-12', 60), ex('Skull Crushers', 3, '10-12', 60),
        ex('Cable Crunch', 3, '15-20', 30),
    ]),
    w('FULL BODY F — HYPERTROPHY: MAX PUMP', 'Maximum pump session.', FB, 'muscle_gain', 65, [
        ex('Leg Press', 5, '10-15', 120, 'DROP SET LAST'), ex('Decline DB Press', 4, '10-12', 90),
        ex('Cable Fly Standing', 4, '12-15', 60), ex('Reverse Grip Pulldown', 3, '12', 90),
        ex('Bent-Over Lateral Raise', 4, '15', 60), ex('Adductor Machine', 3, '15', 60),
        ex('Donkey Calf Raise', 4, '15', 60), ex('Hammer Curls', 3, '12', 60),
        ex('Triceps Pushdown', 3, '12', 60),
    ]),
];

// PROGRAM 3 — Full Body | Strength
const P3: Workout[] = [
    w('FULL BODY A — STRENGTH: HEAVY DAY', 'Low rep heavy compound strength.', FB, 'strength', 70, [
        ex('Back Squat', 5, '5 @85%', 240), ex('Bench Press', 5, '5 @85%', 240),
        ex('Barbell Row', 5, '5 @80%', 180), ex('Overhead Press', 3, '5', 180),
        ex('Romanian Deadlift', 3, '5 Heavy', 180), ex('Weighted Chin-Up', 3, '5', 180),
        ex('Pause Squat', 2, '3', 180), ex('Face Pull', 3, '12', 60, 'Recovery'),
    ]),
    w('FULL BODY B — STRENGTH: VOLUME DAY', 'Volume-based strength.', FB, 'strength', 70, [
        ex('Deadlift', 4, '3-5 @88%', 240), ex('Incline Bench Press', 4, '6-8', 180),
        ex('Barbell Row', 4, '6', 180), ex('Front Squat', 3, '5', 180),
        ex('Overhead Press', 3, '6-8', 180), ex('Lat Pulldown', 3, '8 Heavy', 120),
        ex('DB Lateral Raise', 3, '15', 60), ex('Triceps Dips Weighted', 3, '8', 120),
    ]),
    w('FULL BODY C — STRENGTH: MAX EFFORT', 'Max effort singles and triples.', FB, 'strength', 75, [
        ex('Back Squat', 4, '1RM → 3×3 @90%', 300), ex('Bench Press', 4, '1RM → 3×3 @90%', 300),
        ex('Conventional Deadlift', 4, '1RM → 3×2 @92%', 300), ex('Overhead Press', 4, '4', 180),
        ex('Heavy DB Row', 3, '5 Each', 120), ex('Weighted Pull-Up', 3, '5', 180),
        ex('Box Squat', 2, '3', 180),
    ]),
    w('FULL BODY D — STRENGTH: ACCESSORY DAY', 'Accessory work for strength.', FB, 'strength', 65, [
        ex('Romanian Deadlift', 4, '5 Heavy', 180), ex('Close Grip Bench', 4, '6', 180),
        ex('T-Bar Row', 4, '6-8', 120), ex('Seated Military Press', 4, '5-6', 180),
        ex('Hack Squat', 3, '8 Heavy', 120), ex('Barbell Shrugs', 4, '8 Heavy', 120),
        ex('Skull Crushers', 3, '8', 90), ex('EZ Bar Curl', 3, '8', 90),
    ]),
    w('FULL BODY E — STRENGTH: PEAKING', 'Peaking phase for PRs.', FB, 'strength', 60, [
        ex('Back Squat', 6, '2-3 @92-95%', 300), ex('Bench Press', 6, '2-3 @92-95%', 300),
        ex('Deadlift', 4, '2 @95%', 300), ex('Overhead Press', 3, '3 @90%', 240),
        ex('Pause Bench', 2, '2', 240), ex('Good Morning', 3, '5', 120, 'Back Health'),
    ]),
    w('FULL BODY F — STRENGTH: DELOAD', 'Deload / technique day.', FB, 'strength', 50, [
        ex('Back Squat', 3, '5 @60%', 120, 'PERFECT FORM'), ex('Bench Press', 3, '5 @60%', 120),
        ex('Deadlift', 3, '3 @60%', 120), ex('Overhead Press', 3, '8 @50%', 90),
        ex('Barbell Row', 3, '8 @60%', 90), ex('Mobility Work', 1, '20 Minutes', 0),
        ex('Core Stability', 3, '3 Sets', 60, '3 exercises'),
    ]),
];

// PROGRAM 4 — Full Body | Recomposition
const P4: Workout[] = [
    w('FULL BODY A — RECOMP: STRENGTH + VOLUME', 'Dual-set strength and volume.', FB, 'recomp', 60, [
        ex('Back Squat', 4, 'S1×5@80%, S2×12@65%', 150), ex('Incline DB Press', 4, 'S1×6@80%, S2×12@65%', 150),
        ex('Barbell Row', 4, 'S1×6, S2×12', 150), ex('Overhead Press', 3, 'S1×6, S2×12', 150),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Cable Lat Pulldown', 3, '10-12', 90),
        ex('DB Lateral Raise', 3, '15', 60), ex('Plank', 3, '45 Secs', 30),
    ]),
    w('FULL BODY B — RECOMP: METABOLIC + STRENGTH', 'Metabolic and strength.', FB, 'recomp', 60, [
        ex('Conventional Deadlift', 4, 'S1×4, S2×10', 150), ex('Flat Bench Press', 4, 'S1×5, S2×12', 150),
        ex('Cable Row', 3, '10-12', 90), ex('Bulgarian Split Squat', 3, '10 Each', 90),
        ex('Pec Dec', 3, '12-15', 60, 'REST PAUSE'), ex('Reverse Butterfly', 3, '12-15', 60),
        ex('Standing Calf Raise', 4, '15', 60), ex('Mountain Climbers', 3, '30 Secs', 30),
    ]),
    w('FULL BODY C — RECOMP: UPPER STRENGTH', 'Upper body strength focus.', FB, 'recomp', 60, [
        ex('Seated Military Press', 4, 'S1×6, S2×12', 150), ex('Weighted Chin-Up', 4, 'S1×6, S2×10', 150),
        ex('DB Lateral Raise', 4, '15-20', 60), ex('Chest-Supported Row', 3, '10-12', 90),
        ex('Hack Squat', 3, '10-12', 90, 'REST PAUSE'), ex('Leg Curl', 3, '12-15', 60, 'REST PAUSE'),
        ex('EZ Curl', 3, '10-12', 60), ex('Triceps Dips', 3, 'Until Failure', 90),
    ]),
    w('FULL BODY D — RECOMP: LOWER STRENGTH', 'Lower body strength focus.', FB, 'recomp', 60, [
        ex('Hack Squat', 4, 'S1×6, S2×12', 150), ex('Romanian Deadlift', 4, 'S1×6, S2×12', 150),
        ex('Leg Press', 3, '12-15', 90, 'REST PAUSE'), ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'),
        ex('Walking Lunges', 3, '20 Steps', 60), ex('Seated Calf', 4, '15', 60),
        ex('Cable Crunch', 4, '15-20', 30), ex('Hip Thrust', 3, '12', 90),
    ]),
    w('FULL BODY E — RECOMP: FULL COMPOUND', 'Full compound movements.', FB, 'recomp', 60, [
        ex('Front Squat', 4, 'S1×5, S2×10', 150), ex('Incline Hammer Strength', 4, '8-12', 120),
        ex('T-Bar Row', 4, '8-10', 120), ex('Seated OHP', 3, '8-10', 120),
        ex('Cable Pull-Over', 3, '12-15', 60), ex('DB Shrugs', 3, '12-15', 60, 'REST PAUSE'),
        ex('Concentration Curls', 3, '12', 60), ex('Overhead Triceps', 3, '12', 60),
    ]),
    w('FULL BODY F — RECOMP: HIGH REP METABOLIC', 'High rep metabolic finisher.', FB, 'recomp', 55, [
        ex('Goblet Squat', 4, '15-20', 60), ex('Decline DB Press', 3, '15', 60),
        ex('Cable Fly', 3, '15-20', 60, 'REST PAUSE'), ex('Bent-Over Lateral', 4, '15-20', 60),
        ex('Adductor + Abductor', 3, '15 Each', 60), ex('Donkey Calf Raise', 4, '15', 60),
        ex('Hammer Curls', 3, '15', 60), ex('Triceps Pushdown', 3, '15', 60),
        ex('Bike HIIT', 1, '10 Mins', 0, 'Finisher'),
    ]),
];

// PROGRAM 5 — Full Body | Maintenance
const P5: Workout[] = [
    w('FULL BODY A — MAINTENANCE: BALANCED', 'Balanced maintenance session.', FB, 'maintenance', 50, [
        ex('Barbell Squat', 3, '8-10', 120), ex('Bench Press', 3, '8-10', 120),
        ex('Barbell Row', 3, '8-10', 120), ex('Overhead Press', 3, '10', 90),
        ex('Leg Extension', 2, '12', 60), ex('Leg Curl', 2, '12', 60),
        ex('Cable Lateral Raise', 2, '15', 60), ex('Abs Circuit', 3, '2 Sets', 30),
    ]),
    w('FULL BODY B — MAINTENANCE: PUSH FOCUS', 'Push-focused maintenance.', FB, 'maintenance', 50, [
        ex('Incline DB Press', 3, '10-12', 90), ex('Hack Squat', 3, '10-12', 90),
        ex('Lat Pulldown', 3, '10-12', 90), ex('DB Shoulder Press', 3, '10-12', 90),
        ex('DB Lateral Raise', 3, '15', 60), ex('Triceps Pushdown', 3, '12-15', 60),
        ex('EZ Curl', 3, '12', 60), ex('Plank', 2, '45 Secs', 30),
    ]),
    w('FULL BODY C — MAINTENANCE: PULL FOCUS', 'Pull-focused maintenance.', FB, 'maintenance', 50, [
        ex('Deadlift', 3, '6-8', 180), ex('T-Bar Row', 3, '10', 90),
        ex('Flat DB Press', 3, '10-12', 90), ex('Wide Pulldown', 3, '10-12', 90),
        ex('Seated Cable Row', 3, '12', 90), ex('Reverse Butterfly', 3, '15', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Calf Raises', 3, '15', 60),
    ]),
    w('FULL BODY D — MAINTENANCE: LEG FOCUS', 'Leg-focused maintenance.', FB, 'maintenance', 50, [
        ex('Leg Press', 3, '12-15', 90), ex('Romanian Deadlift', 3, '10-12', 90),
        ex('Walking Lunges', 3, '20 Steps', 60), ex('Leg Extension', 3, '15', 60),
        ex('Leg Curl', 3, '12', 60), ex('Adductor', 2, '15', 60),
        ex('Seated Calf', 3, '15', 60), ex('Cable Crunch', 3, '15', 30),
    ]),
    w('FULL BODY E — MAINTENANCE: COMPOUND', 'Compound maintenance.', FB, 'maintenance', 50, [
        ex('Front Squat', 3, '8-10', 120), ex('Incline Bench', 3, '10-12', 90),
        ex('Cable Row', 3, '10-12', 90), ex('DB Shoulder Press', 3, '10-12', 90),
        ex('Pec Dec', 2, '12-15', 60), ex('Shrugs', 3, '12-15', 60),
        ex('Close Grip Bench', 3, '10-12', 90), ex('Scott Curls', 3, '10-12', 60),
    ]),
    w('FULL BODY F — MAINTENANCE: ACTIVE', 'Active maintenance session.', FB, 'maintenance', 45, [
        ex('Goblet Squat', 3, '12', 90), ex('Chest Machine', 3, '12', 90),
        ex('Chest-Supported Row', 3, '12', 90), ex('DB Lateral Raise', 3, '15', 60),
        ex('Hip Thrust', 3, '15', 60), ex('Hanging Leg Raise', 3, '12', 60),
        ex('Triceps Dips', 2, 'Until Failure', 90), ex('Chin-Ups', 2, 'Until Failure', 90),
    ]),
];

// PROGRAM 6 — Full Body | Endurance
const P6: Workout[] = [
    w('FULL BODY A — ENDURANCE: CIRCUIT POWER', 'Circuit power endurance.', FB, 'endurance', 55, [
        ex('Barbell Squat', 4, '20-25 @40-50%', 60), ex('Push-Ups', 4, 'Until Failure', 30),
        ex('DB Row', 4, '20 Each', 30), ex('DB Shoulder Press', 4, '20', 30),
        ex('Bodyweight Lunges', 3, '30 Steps', 30), ex('Battle Ropes', 4, '30 Secs', 30),
        ex('Burpees', 4, '15', 30), ex('Jump Rope', 5, '1 Minute', 15),
        ex('Plank Circuit', 3, '45 Secs Each', 15, '3 variations'),
    ]),
    w('FULL BODY B — ENDURANCE: AEROBIC BASE', 'Aerobic base building.', FB, 'endurance', 60, [
        ex('Goblet Squat', 5, '20', 45), ex('Band Pull-Apart', 4, '25', 30),
        ex('DB Lateral Raise', 4, '20-25', 30), ex('Seated Row Machine', 4, '20', 45),
        ex('Leg Press', 3, '25-30', 45), ex('Triceps Pushdown', 4, '20', 30),
        ex('EZ Curl', 4, '20', 30), ex('Calf Raise', 5, '25', 30),
        ex('Steady State Cardio', 1, '20 Mins', 0),
    ]),
    w('FULL BODY C — ENDURANCE: TIMED SETS', 'Timed-set endurance.', FB, 'endurance', 55, [
        ex('DB Squat Timed', 4, '45 Secs', 15), ex('Push-Up Timed', 4, '45 Secs', 15),
        ex('DB Row Timed', 4, '45 Secs Each', 15), ex('DB Press Timed', 4, '45 Secs', 15),
        ex('Jump Squat', 3, '30 Secs', 15), ex('Mountain Climbers', 4, '30 Secs', 15),
        ex('Box Step-Up', 3, '30 Secs Each', 15), ex('Bicycle Crunch', 3, '30 Secs', 15),
        ex('Rowing Machine', 1, '15-20 Min', 0, 'Moderate'),
    ]),
    w('FULL BODY D — ENDURANCE: DENSITY TRAINING', 'Density-based endurance.', FB, 'endurance', 60, [
        ex('EMOM: Squat+Push-Up+Row', 1, '20 Min EMOM', 0, '10 reps each'), ex('Leg Extension', 4, '25', 30, 'Short rest'),
        ex('Leg Curl', 4, '25', 30, 'Short rest'), ex('Cable Lateral Raise', 4, '20', 30),
        ex('Cable Fly', 3, '20-25', 30), ex('Band Pulldown', 4, '25', 30),
        ex('Core Circuit', 5, '20', 15, '5 exercises'), ex('Stairmaster', 1, '15 Mins', 0),
    ]),
    w('FULL BODY E — ENDURANCE: LACTATE THRESHOLD', 'Lactate threshold training.', FB, 'endurance', 60, [
        ex('Barbell Complex: Squat+Row+Press', 5, '5 Rounds', 90), ex('Walking Lunges', 5, '30 Steps', 30),
        ex('DB Lateral Raise', 5, '20-25', 30), ex('Incline DB Press', 4, '15-20', 45),
        ex('Lat Pulldown', 4, '15-20', 45), ex('Hip Thrust', 4, '20', 45),
        ex('Calf Raise', 5, '25', 30), ex('Sled Push/Pull', 5, '5 Rounds', 90),
    ]),
    w('FULL BODY F — ENDURANCE: LONG CIRCUIT', 'Long AMRaP circuit.', FB, 'endurance', 60, [
        ex('AMRaP Circuit', 1, '45 Min', 0, 'As Many Rounds As Possible'),
        ex('Squat + Push-Up + DB Row', 1, '15 Each', 0, 'Per round'),
        ex('Lateral Raise + Lunge + Crunch', 1, '15-20 Each', 0, 'Per round'),
        ex('Jump Rope Between Rounds', 1, '60 Secs', 0), ex('Cool Down Stretch', 1, '10 Mins', 0),
        ex('Foam Rolling', 1, '5 Mins', 0),
    ]),
];

export const FULL_BODY_PROGRAMS: Workout[] = [...P1, ...P2, ...P3, ...P4, ...P5, ...P6];
