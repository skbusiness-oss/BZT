import { Workout, Exercise } from '../types';

function ex(name: string, sets: number, reps: string, rest = 120, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}
let _id = 600;
function w(name: string, desc: string, cat: string, goal: Workout['goal'], mins: number, exercises: Exercise[]): Workout {
    return { id: `hc${_id++}`, name, description: desc, category: cat, goal, estimatedMinutes: mins, exercises, createdAt: '2026-01-01' };
}
const HI = 'HIIT / Circuit';
const CA = 'Cardio-Focused';

// ═══════ HIIT PROGRAMS (31-36) ═══════

const P31: Workout[] = [
    w('CIRCUIT A — FAT LOSS HIIT', 'Full body HIIT fat burn.', HI, 'fat_loss', 45, [
        ex('Burpee', 4, '40s Work / 20s Rest', 20), ex('Jump Squat', 4, '40s', 20),
        ex('Mountain Climbers', 4, '40s', 20), ex('High Knees', 4, '40s', 20),
        ex('Plank to Push-Up', 4, '40s', 20), ex('DB Thruster', 4, '40s', 20),
        ex('Battle Ropes', 4, '40s', 20), ex('Box Jump', 4, '40s', 20),
        ex('Kettlebell Swing', 4, '40s', 20), ex('Sprint Intervals', 5, '200m', 90),
    ]),
    w('CIRCUIT B — UPPER BODY HIIT', 'Upper HIIT circuit.', HI, 'fat_loss', 50, [
        ex('Push-Ups Max', 5, '45s', 15), ex('DB Row', 5, '45s Each', 15),
        ex('DB Shoulder Press', 5, '45s', 15), ex('Chin-Ups Max', 5, '45s', 15),
        ex('Battle Ropes', 5, '45s', 15), ex('Triceps Dips', 5, '45s', 15),
        ex('EZ Curl', 5, '45s', 15), ex('Treadmill Intervals', 1, '15 Min', 0, '1:1 Ratio'),
    ]),
    w('CIRCUIT C — LOWER BODY HIIT', 'Lower HIIT circuit.', HI, 'fat_loss', 45, [
        ex('Jump Squat', 5, '45s', 15), ex('Lunge Jump', 5, '45s', 15),
        ex('Kettlebell Swing', 5, '45s', 15), ex('Box Jump', 5, '45s', 15),
        ex('Skater Jumps', 5, '45s', 15), ex('Wall Sit Max', 5, '45s', 15),
        ex('Jump Rope', 5, '45s', 15), ex('Stairmaster', 1, '15 Mins', 0, 'Finisher'),
    ]),
    w('CIRCUIT D — TOTAL BODY FAT BURN', 'Total body circuit.', HI, 'fat_loss', 50, [
        ex('Goblet Squat', 6, '15', 60), ex('Push-Up', 6, '15', 0),
        ex('DB Row', 6, '15 Each', 0), ex('Thruster', 6, '12', 0),
        ex('Burpee', 6, '10', 0), ex('Mountain Climber', 6, '20', 0),
        ex('Battle Ropes', 6, '30s', 60, 'Rest 60s between rounds'),
    ]),
    w('CIRCUIT E — TABATA FAT LOSS', 'Tabata protocol.', HI, 'fat_loss', 35, [
        ex('Burpees — Tabata', 8, '20s ON / 10s OFF', 60), ex('Jump Squats — Tabata', 8, '20s ON / 10s OFF', 60),
        ex('Push-Ups — Tabata', 8, '20s ON / 10s OFF', 60), ex('Mountain Climbers — Tabata', 8, '20s ON / 10s OFF', 60),
        ex('High Knees — Tabata', 8, '20s ON / 10s OFF', 60), ex('Cool Down Stretch', 1, '10 Mins', 0),
    ]),
];

const P32: Workout[] = [
    w('CIRCUIT A — MUSCLE GAIN HIIT', 'Compound HIIT for muscle.', HI, 'muscle_gain', 50, [
        ex('Barbell Squat', 5, '10', 90), ex('Bench Press', 5, '10', 90),
        ex('Barbell Row', 5, '10', 90), ex('Overhead Press', 5, '8', 90),
        ex('Dips', 5, 'Until Failure', 90, 'REST PAUSE on last set'),
    ]),
    w('CIRCUIT B — MUSCLE GAIN HIIT', 'Upper HIIT for muscle.', HI, 'muscle_gain', 50, [
        ex('Incline DB Press', 4, '12', 90), ex('Cable Row', 4, '12', 90),
        ex('DB Shoulder Press', 4, '12', 90), ex('Lat Pulldown', 4, '12', 90),
        ex('Cable Fly', 4, '15', 60, 'REST PAUSE last'), ex('EZ Curl', 4, '12', 60),
    ]),
    w('CIRCUIT C — MUSCLE GAIN HIIT', 'Lower HIIT for muscle.', HI, 'muscle_gain', 50, [
        ex('Leg Press', 5, '12', 90, 'REST PAUSE last'), ex('RDL', 4, '10', 90),
        ex('Leg Extension', 4, '12', 60, 'REST PAUSE'), ex('Leg Curl', 4, '12', 60, 'REST PAUSE'),
        ex('Calf Raise', 5, '15', 60, 'REST PAUSE'), ex('Hip Thrust', 4, '12', 60),
    ]),
    w('CIRCUIT D — MUSCLE GAIN HIIT', 'Push HIIT for muscle.', HI, 'muscle_gain', 45, [
        ex('Flat Bench Press', 4, '10', 90), ex('Incline Hammer Strength', 4, '12', 90),
        ex('Seated Military Press', 4, '10', 90), ex('Side Lateral', 4, '15', 60),
        ex('Triceps Pushdown', 4, '12', 60), ex('Dips', 3, 'Until Failure', 90),
    ]),
    w('CIRCUIT E — MUSCLE GAIN HIIT', 'Pull HIIT for muscle.', HI, 'muscle_gain', 45, [
        ex('Barbell Row', 4, '10', 90), ex('Wide Pulldown', 4, '12', 90),
        ex('T-Bar Row', 4, '10', 90), ex('Reverse Butterfly', 4, '15', 60),
        ex('EZ Curl', 4, '10', 60), ex('Shrugs', 4, '12', 60, 'REST PAUSE'),
    ]),
];

const P33: Workout[] = [
    w('CIRCUIT A — STRENGTH HIIT', 'Heavy barbell complex.', HI, 'strength', 55, [
        ex('Back Squat', 4, '5 @80%', 180), ex('Bench Press', 4, '5 @80%', 180),
        ex('Barbell Row', 4, '5 @80%', 120), ex('Overhead Press', 3, '5', 120),
        ex('Deadlift', 3, '3 @85%', 240),
    ]),
    w('CIRCUIT B — STRENGTH HIIT', 'Upper strength circuit.', HI, 'strength', 50, [
        ex('Incline Bench', 4, '5-6', 180), ex('Weighted Chin-Up', 4, '5', 180),
        ex('Close Grip Bench', 3, '6', 120), ex('Barbell Row', 3, '5-6', 120),
        ex('EZ Curl Heavy', 3, '6-8', 90),
    ]),
    w('CIRCUIT C — STRENGTH HIIT', 'Lower strength circuit.', HI, 'strength', 55, [
        ex('Front Squat', 4, '4-5', 180), ex('Conventional Deadlift', 4, '3', 240),
        ex('Hack Squat', 3, '6-8', 120), ex('Good Morning', 3, '5', 120),
        ex('Nordic Hamstring Curl', 3, '5', 120),
    ]),
    w('CIRCUIT D — STRENGTH HIIT', 'Power circuit.', HI, 'strength', 50, [
        ex('Push Press', 4, '3', 180), ex('Power Clean', 4, '3', 180),
        ex('Box Squat', 4, '3', 180), ex('Weighted Dips', 3, '5', 120),
        ex('Farmer\'s Walk', 3, '40m', 90),
    ]),
    w('CIRCUIT E — STRENGTH HIIT', 'Peaking circuit.', HI, 'strength', 45, [
        ex('Back Squat', 3, '2-3 @90%', 300), ex('Bench Press', 3, '2-3 @90%', 300),
        ex('Deadlift', 3, '2 @92%', 300), ex('Overhead Press', 3, '3 @85%', 240),
    ]),
];

const P34: Workout[] = [
    w('CIRCUIT A — RECOMP HIIT', 'Paired compound circuit.', HI, 'recomp', 55, [
        ex('Back Squat', 4, 'S1×5, S2×10', 90), ex('Bench Press', 4, 'S1×5, S2×10', 90),
        ex('Barbell Row', 4, 'S1×5, S2×10', 90), ex('OHP', 3, 'S1×5, S2×10', 90),
        ex('Leg Curl', 3, '10-12', 60, 'REST PAUSE'), ex('Cable Fly', 3, '12-15', 60),
    ]),
    w('CIRCUIT B — RECOMP HIIT', 'Upper recomp circuit.', HI, 'recomp', 50, [
        ex('Incline DB Press', 4, 'S1×6, S2×12', 90), ex('Cable Row', 4, '10-12', 90),
        ex('DB Shoulder Press', 3, '8-12', 90), ex('Lat Pulldown', 3, '10-12', 90),
        ex('EZ Curl', 3, '10-12', 60), ex('Triceps Pushdown', 3, '12', 60),
    ]),
    w('CIRCUIT C — RECOMP HIIT', 'Lower recomp circuit.', HI, 'recomp', 50, [
        ex('Hack Squat', 4, 'S1×6, S2×12', 90), ex('RDL', 4, 'S1×5, S2×10', 90),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Leg Curl', 3, '12-15', 60, 'REST PAUSE'),
        ex('Calf Raise', 4, '15', 60), ex('Hip Thrust', 3, '12', 60),
    ]),
    w('CIRCUIT D — RECOMP HIIT', 'Push recomp circuit.', HI, 'recomp', 45, [
        ex('Flat Bench', 4, '8-12', 90), ex('Incline Hammer', 3, '10-12', 90),
        ex('Military Press', 3, '8-10', 90), ex('Side Lateral', 4, '15', 60),
        ex('Dips', 3, 'Until Failure', 60),
    ]),
    w('CIRCUIT E — RECOMP HIIT', 'Pull recomp circuit.', HI, 'recomp', 45, [
        ex('T-Bar Row', 4, '8-10', 90), ex('Wide Pulldown', 4, '10-12', 90),
        ex('Reverse Butterfly', 3, '15', 60), ex('Shrugs', 3, '12', 60, 'REST PAUSE'),
        ex('EZ Curl', 3, '10-12', 60),
    ]),
];

const P35: Workout[] = [
    w('CIRCUIT A — MAINTENANCE HIIT', 'Balanced circuit.', HI, 'maintenance', 40, [
        ex('Goblet Squat', 3, '12-15', 120), ex('Push-Up', 3, '12-15', 0),
        ex('DB Row', 3, '12 Each', 0), ex('DB Press', 3, '12', 0),
        ex('Lateral Raise', 3, '15', 0), ex('Plank', 3, '45s', 120),
    ]),
    w('CIRCUIT B — MAINTENANCE HIIT', 'Upper maintenance circuit.', HI, 'maintenance', 35, [
        ex('DB Chest Press', 3, '12', 90), ex('Cable Row', 3, '12', 90),
        ex('DB Shoulder Press', 3, '12', 90), ex('Lat Pulldown', 3, '12', 90),
        ex('EZ Curl', 3, '12', 60), ex('Triceps Pushdown', 3, '12', 60),
    ]),
    w('CIRCUIT C — MAINTENANCE HIIT', 'Lower maintenance circuit.', HI, 'maintenance', 35, [
        ex('Leg Press', 3, '12', 90), ex('Leg Extension', 3, '12', 60),
        ex('Leg Curl', 3, '12', 60), ex('Calf Raise', 3, '15', 60),
        ex('Hip Thrust', 3, '12', 60), ex('Abs Circuit', 3, 'Circuit', 30),
    ]),
    w('CIRCUIT D — MAINTENANCE HIIT', 'Full body maintenance.', HI, 'maintenance', 35, [
        ex('Barbell Squat', 3, '10', 90), ex('Bench Press', 3, '10', 90),
        ex('Barbell Row', 3, '10', 90), ex('OHP', 3, '10', 90),
    ]),
    w('CIRCUIT E — MAINTENANCE HIIT', 'Light circuit.', HI, 'maintenance', 30, [
        ex('DB Squat', 3, '12', 90), ex('Push-Up', 3, 'Max', 30),
        ex('DB Row', 3, '12 Each', 90), ex('Lateral Raise', 3, '15', 60),
        ex('Plank', 3, '30s', 30),
    ]),
];

const P36: Workout[] = [
    w('CIRCUIT A — ENDURANCE HIIT', 'AMRaP endurance.', HI, 'endurance', 50, [
        ex('Squat', 6, '15', 15), ex('Push-Up', 6, '15', 0),
        ex('DB Row', 6, '15 Each', 0), ex('Thruster', 6, '12', 0),
        ex('Burpee', 6, '10', 0), ex('Mountain Climber', 6, '20', 60, '15s rest between exercises'),
    ]),
    w('CIRCUIT B — ENDURANCE HIIT', 'Upper endurance circuit.', HI, 'endurance', 50, [
        ex('Push-Ups Max', 5, '45s', 15), ex('DB Row', 5, '45s Each', 15),
        ex('DB Press Timed', 5, '45s', 15), ex('Pulldown', 5, '45s', 15),
        ex('Cable Fly', 5, '45s', 15), ex('Curl + Triceps SS', 5, '45s', 15),
    ]),
    w('CIRCUIT C — ENDURANCE HIIT', 'Lower endurance circuit.', HI, 'endurance', 50, [
        ex('Jump Squat', 5, '45s', 15), ex('Walking Lunge', 5, '45s', 15),
        ex('Step-Up', 5, '45s', 15), ex('Wall Sit', 5, '45s', 15),
        ex('Calf Raise', 5, '45s', 15), ex('Squat Jump', 5, '45s', 15),
    ]),
    w('CIRCUIT D — ENDURANCE HIIT', 'Full body AMRaP.', HI, 'endurance', 45, [
        ex('Goblet Squat', 5, '20', 15), ex('Push-Up', 5, 'Max', 15),
        ex('DB Row', 5, '15 Each', 15), ex('Shoulder Press', 5, '15', 15),
        ex('Burpee', 5, '10', 15), ex('Jump Rope', 5, '60s', 15),
    ]),
    w('CIRCUIT E — ENDURANCE HIIT', 'Finisher circuit.', HI, 'endurance', 45, [
        ex('Battle Ropes', 5, '30s', 15), ex('Mountain Climbers', 5, '30s', 15),
        ex('High Knees', 5, '30s', 15), ex('Box Jump', 5, '30s', 15),
        ex('Kettlebell Swing', 5, '30s', 15), ex('Sled Push', 5, '30s', 60),
    ]),
];

// ═══════ CARDIO PROGRAMS (37-42) ═══════

const P37: Workout[] = [
    w('CARDIO A — FAT LOSS', 'HIIT treadmill intervals.', CA, 'fat_loss', 45, [
        ex('Warm-Up Walk', 1, '5 Min @ 3.5 mph', 0), ex('Sprint Interval', 15, '1 Min @ 8-10 mph', 0),
        ex('Recovery Walk', 15, '1.5 Min @ 4-5 mph', 0), ex('Cool Down Walk', 1, '5 Min', 0),
    ]),
    w('CARDIO B — FAT LOSS', 'Bike HIIT + light weights.', CA, 'fat_loss', 50, [
        ex('Bike: Sprint / Easy', 1, '20 Min 30s/90s', 0), ex('DB Shoulder Press', 3, '20', 30),
        ex('DB Lateral Raise', 3, '25', 30), ex('Push-Ups', 3, 'Max', 30),
        ex('Cable Fly', 3, '20', 30), ex('Triceps Pushdown', 3, '20', 30),
        ex('Core Circuit', 1, '10 Mins', 0),
    ]),
    w('CARDIO C — FAT LOSS', 'Steady-state cardio.', CA, 'fat_loss', 60, [
        ex('Steady State Cardio', 1, '60 Min @ 65% HR', 0, '130-145 BPM'),
        ex('Intensity Burst', 6, '1 Min High Every 10 Min', 0),
    ]),
    w('CARDIO D — FAT LOSS', 'Stairmaster + legs.', CA, 'fat_loss', 50, [
        ex('Stairmaster Intervals', 1, '25 Min', 0), ex('Leg Extension', 3, '25', 30),
        ex('Leg Curl', 3, '25', 30), ex('Hip Thrust', 3, '20', 30),
        ex('Calf Raise', 5, '25', 30), ex('Core Circuit', 4, '20 Reps Each', 15),
    ]),
    w('CARDIO E — FAT LOSS', 'Rowing machine session.', CA, 'fat_loss', 45, [
        ex('Row Warm Up', 1, '5 Min Moderate', 0), ex('Row High Effort', 1, '15 Min', 0),
        ex('Row Recovery', 1, '10 Min Moderate', 0), ex('Row Sprint Finale', 1, '10 Min', 0),
        ex('Row Cool Down', 1, '5 Min', 0),
    ]),
    w('CARDIO F — FAT LOSS', 'Incline walk + bodyweight.', CA, 'fat_loss', 50, [
        ex('Incline Treadmill', 1, '30 Min @ 12% 3.5mph', 0), ex('Walking Lunges', 5, '30 Steps', 30),
        ex('Goblet Squat', 3, '20', 30), ex('Bicycle Crunch', 4, '25', 15),
        ex('Plank Variations', 3, '45s Each', 15, '3 types'),
    ]),
];

const P38: Workout[] = [
    w('CARDIO A — MUSCLE GAIN', 'Zone 2 + Push.', CA, 'muscle_gain', 55, [
        ex('Zone 2 Cardio Warm-Up', 1, '20 Min Easy', 0), ex('Incline DB Press', 4, '8-12', 120),
        ex('Cable Fly', 3, '12-15', 60), ex('Seated Military Press', 4, '8-10', 120),
        ex('Side Lateral', 4, '12-15', 60), ex('Triceps Pushdown', 3, '12', 60),
    ]),
    w('CARDIO B — MUSCLE GAIN', 'Zone 2 + Pull.', CA, 'muscle_gain', 55, [
        ex('Zone 2 Cardio Warm-Up', 1, '20 Min Easy', 0), ex('Barbell Row', 4, '8-10', 120),
        ex('Lat Pulldown', 4, '10-12', 90), ex('Cable Row', 3, '12', 90),
        ex('Reverse Butterfly', 3, '15', 60), ex('EZ Curl', 3, '10-12', 60),
    ]),
    w('CARDIO C — MUSCLE GAIN', 'Zone 2 + Legs.', CA, 'muscle_gain', 55, [
        ex('Zone 2 Cardio Warm-Up', 1, '20 Min Easy', 0), ex('Leg Press', 4, '10-12', 120),
        ex('Leg Extension', 3, '12', 60, 'REST PAUSE'), ex('Leg Curl', 3, '12', 60, 'REST PAUSE'),
        ex('Calf Raise', 4, '15', 60), ex('Hip Thrust', 3, '12', 60),
    ]),
    w('CARDIO D — MUSCLE GAIN', 'Zone 2 + Upper.', CA, 'muscle_gain', 55, [
        ex('Zone 2 Cardio Warm-Up', 1, '20 Min Easy', 0), ex('Flat Bench', 4, '8-12', 120),
        ex('T-Bar Row', 4, '8-10', 120), ex('DB Shoulder Press', 3, '10-12', 90),
        ex('Pec Dec', 3, '12-15', 60), ex('Shrugs', 3, '12', 60),
    ]),
    w('CARDIO E — MUSCLE GAIN', 'Zone 2 + Push B.', CA, 'muscle_gain', 50, [
        ex('Zone 2 Cardio Warm-Up', 1, '20 Min Easy', 0), ex('Incline Hammer', 4, '10-12', 90),
        ex('Cable Fly Standing', 3, '12-15', 60), ex('Overhead Press', 3, '10', 90),
        ex('Concentration Curls', 3, '12', 60), ex('Dips', 3, 'Until Failure', 60),
    ]),
    w('CARDIO F — MUSCLE GAIN', 'Zone 2 + Pull B.', CA, 'muscle_gain', 50, [
        ex('Zone 2 Cardio Warm-Up', 1, '20 Min Easy', 0), ex('Wide Pulldown', 4, '10-12', 90),
        ex('Chest-Supported Row', 3, '12', 90), ex('Bent-Over Lateral', 3, '15', 60),
        ex('Hammer Curls', 3, '12', 60), ex('Hyperextensions', 3, 'Until Failure', 60),
    ]),
];

const P39: Workout[] = [
    w('CARDIO A — STRENGTH', 'Easy bike + squat.', CA, 'strength', 50, [
        ex('Easy Bike/Walk', 1, '15 Min', 0), ex('Back Squat', 5, '5 @80%', 240),
        ex('Front Squat', 3, '5', 180), ex('Leg Press', 2, '8', 90),
    ]),
    w('CARDIO B — STRENGTH', 'Easy bike + bench.', CA, 'strength', 45, [
        ex('Easy Bike/Walk', 1, '15 Min', 0), ex('Bench Press', 5, '5 @80%', 240),
        ex('Close Grip Bench', 3, '6', 120), ex('Incline DB Press', 3, '6-8', 90),
    ]),
    w('CARDIO C — STRENGTH', 'Easy bike + deadlift.', CA, 'strength', 50, [
        ex('Easy Bike/Walk', 1, '15 Min', 0), ex('Deadlift', 4, '3 @85%', 300),
        ex('Barbell Row', 3, '5', 120), ex('Good Morning', 3, '5', 90),
    ]),
    w('CARDIO D — STRENGTH', 'Zone 2 recovery.', CA, 'strength', 40, [
        ex('Zone 2 Steady State', 1, '30-40 Min', 0, 'Recovery only'),
    ]),
    w('CARDIO E — STRENGTH', 'Easy bike + OHP.', CA, 'strength', 45, [
        ex('Easy Bike/Walk', 1, '15 Min', 0), ex('Overhead Press', 5, '5 @80%', 240),
        ex('Seated DB Press', 3, '5-6', 120), ex('Side Lateral', 3, '12', 60),
    ]),
    w('CARDIO F — STRENGTH', 'Zone 2 recovery B.', CA, 'strength', 40, [
        ex('Zone 2 Steady State', 1, '30-40 Min', 0, 'Recovery only'),
        ex('Mobility Work', 1, '15 Min', 0),
    ]),
];

const P40: Workout[] = [
    w('CARDIO A — RECOMP', 'HIIT + Push recomp.', CA, 'recomp', 55, [
        ex('HIIT Intervals', 1, '20 Min 30s/60s', 0), ex('Incline DB Press', 4, 'S1×6, S2×12', 90),
        ex('Cable Fly', 3, '12-15', 60), ex('Seated Press', 3, 'S1×6, S2×12', 90),
        ex('Side Lateral', 4, '15', 60),
    ]),
    w('CARDIO B — RECOMP', 'HIIT + Pull recomp.', CA, 'recomp', 55, [
        ex('HIIT Intervals', 1, '20 Min 30s/60s', 0), ex('Barbell Row', 4, 'S1×6, S2×12', 90),
        ex('Lat Pulldown', 3, '10-12', 90), ex('Cable Row', 3, '12', 60),
        ex('EZ Curl', 3, '10-12', 60), ex('Shrugs', 3, '12', 60),
    ]),
    w('CARDIO C — RECOMP', 'HIIT + Legs recomp.', CA, 'recomp', 55, [
        ex('HIIT Intervals', 1, '20 Min 30s/60s', 0), ex('Hack Squat', 4, 'S1×6, S2×12', 90),
        ex('Leg Extension', 3, '12-15', 60, 'REST PAUSE'), ex('Leg Curl', 3, '12', 60, 'REST PAUSE'),
        ex('Calf Raise', 4, '15', 60), ex('Hip Thrust', 3, '12', 60),
    ]),
    w('CARDIO D — RECOMP', 'HIIT + Upper recomp.', CA, 'recomp', 50, [
        ex('HIIT Intervals', 1, '20 Min 30s/60s', 0), ex('Flat Bench', 4, 'S1×5, S2×10', 90),
        ex('T-Bar Row', 3, '8-10', 90), ex('Pec Dec', 3, '12-15', 60),
        ex('Reverse Butterfly', 3, '15', 60),
    ]),
    w('CARDIO E — RECOMP', 'HIIT + Push B recomp.', CA, 'recomp', 50, [
        ex('HIIT Intervals', 1, '20 Min 30s/60s', 0), ex('Incline Hammer', 4, '8-12', 90),
        ex('Cable Fly Standing', 3, '12-15', 60), ex('DB Shoulder Press', 3, '10-12', 60),
        ex('Triceps Pushdown', 3, '12', 60),
    ]),
    w('CARDIO F — RECOMP', 'HIIT + Pull B recomp.', CA, 'recomp', 50, [
        ex('HIIT Intervals', 1, '20 Min 30s/60s', 0), ex('Wide Pulldown', 4, '10-12', 90),
        ex('Chest-Supported Row', 3, '12', 60), ex('Bent-Over Lateral', 3, '15', 60),
        ex('Concentration Curls', 3, '12', 60),
    ]),
];

const P41: Workout[] = [
    w('CARDIO A — MAINTENANCE', 'Steady state.', CA, 'maintenance', 40, [
        ex('Moderate Steady State', 1, '30-40 Min', 0, 'Conversational pace'),
    ]),
    w('CARDIO B — MAINTENANCE', 'Steady + light.', CA, 'maintenance', 45, [
        ex('Moderate Steady State', 1, '30 Min', 0), ex('Push-Ups', 3, '12', 60),
        ex('DB Row', 3, '12 Each', 60), ex('Plank', 3, '30s', 30),
    ]),
    w('CARDIO C — MAINTENANCE', 'Steady state B.', CA, 'maintenance', 40, [
        ex('Moderate Steady State', 1, '30-40 Min', 0, 'Comfortable pace'),
    ]),
    w('CARDIO D — MAINTENANCE', 'Walk + light legs.', CA, 'maintenance', 45, [
        ex('Moderate Cardio', 1, '30 Min', 0), ex('Goblet Squat', 3, '12', 60),
        ex('Leg Extension', 3, '12', 60), ex('Calf Raise', 3, '15', 30),
    ]),
    w('CARDIO E — MAINTENANCE', 'Steady state C.', CA, 'maintenance', 35, [
        ex('Moderate Steady State', 1, '30 Min', 0, 'Conversational pace'),
    ]),
    w('CARDIO F — MAINTENANCE', 'Light active.', CA, 'maintenance', 40, [
        ex('Light Cardio', 1, '30 Min', 0), ex('Mobility Work', 1, '10 Min', 0),
    ]),
];

const P42: Workout[] = [
    w('CARDIO A — ENDURANCE', 'Long Zone 2-3.', CA, 'endurance', 75, [
        ex('Sustained Zone 2-3 Cardio', 1, '60-90 Min', 0, 'Progressive distance'),
    ]),
    w('CARDIO B — ENDURANCE', 'Interval LT.', CA, 'endurance', 60, [
        ex('Warm-Up', 1, '10 Min Easy', 0), ex('Lactate Threshold Intervals', 8, '4 Min Hard / 2 Min Easy', 0),
        ex('Cool Down', 1, '10 Min', 0),
    ]),
    w('CARDIO C — ENDURANCE', 'Long Zone 2.', CA, 'endurance', 70, [
        ex('Zone 2 Sustained', 1, '60-75 Min', 0, 'Track total distance'),
    ]),
    w('CARDIO D — ENDURANCE', 'Tempo run.', CA, 'endurance', 55, [
        ex('Warm-Up', 1, '10 Min', 0), ex('Tempo Effort', 1, '30 Min @ Zone 3', 0),
        ex('Cool Down', 1, '10 Min', 0), ex('Stretch', 1, '5 Min', 0),
    ]),
    w('CARDIO E — ENDURANCE', 'Progressive intervals.', CA, 'endurance', 65, [
        ex('Progressive Intervals', 1, '50 Min', 0, '5 Min increments increasing pace'),
        ex('Cool Down', 1, '10 Min', 0), ex('Foam Roll', 1, '5 Min', 0),
    ]),
    w('CARDIO F — ENDURANCE', 'Long distance.', CA, 'endurance', 90, [
        ex('Long Distance Sustained', 1, '75-90 Min', 0, 'Zone 2 sustained, track weekly distance'),
    ]),
];

export const HIIT_PROGRAMS: Workout[] = [...P31, ...P32, ...P33, ...P34, ...P35, ...P36];
export const CARDIO_PROGRAMS: Workout[] = [...P37, ...P38, ...P39, ...P40, ...P41, ...P42];
