// Exercise Name Replacement Script
// Run this in Node to apply all replacements from Claude2626 Section 8

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');

// Files to process
const files = [
    'trainingPrograms.ts',
    'upperLowerPrograms.ts', 
    'pplPrograms.ts',
    'broSplitPrograms.ts',
    'strengthPrograms.ts',
    'hiitCardioPrograms.ts',
];

// Replacement map — ORDER MATTERS (longer/more specific first)
// Only replace inside ex('...') first argument strings
const replacements = [
    // Compound names first (longer strings before shorter substrings)
    ["'Rowing Machine Chest Supported'", "'Chest-Supported Machine Row'"],
    ["'Rowing Machine'", "'Chest-Supported Machine Row'"],
    ["'DB Straight Leg Deadlift'", "'Dumbbell Romanian Deadlift'"],
    ["'Dumbbell SLDL'", "'Dumbbell Romanian Deadlift'"],
    ["'DB SLDL'", "'Dumbbell Romanian Deadlift'"],
    ["'Crusifixed Triceps'", "'Cable Overhead Tricep Extension'"],
    ["'High Rows'", "'Seated High Cable Row'"],
    ["'Cable Lat Pulldown'", "'Wide Grip Lat Pulldown'"],
    ["'Wide Grip Pull Down'", "'Wide Grip Lat Pulldown'"],
    ["'Wide Grip Pulldown'", "'Wide Grip Lat Pulldown'"],
    ["'Lat Pull Down'", "'Wide Grip Lat Pulldown'"],
    ["'Lat Pulldown'", "'Wide Grip Lat Pulldown'"],
    ["'Cable Pulldown'", "'Wide Grip Lat Pulldown'"],
    ["'Wide Pulldown'", "'Wide Grip Lat Pulldown'"],
    ["'Abs Circuit'", "'Core Circuit (Plank / Crunch / Leg Raise)'"],
    ["'Abs Training'", "'Core Circuit (Ab Wheel / Decline Crunch)'"],
    ["'ABS Circuit'", "'Core Circuit (Plank / Crunch / Leg Raise)'"],
    ["'ABS'", "'Core Circuit (Plank / Crunch / Leg Raise)'"],
    ["'Overhead Press Barbell'", "'Barbell Overhead Press'"],
    ["'Shoulder Press Barbell'", "'Barbell Overhead Press'"],
    ["'Overhead Press Heavy'", "'Barbell Overhead Press'"],
    ["'Seated Military Press'", "'Seated Barbell Military Press'"],
    ["'Military Press'", "'Barbell Overhead Press'"],
    ["'Barbell OHP'", "'Barbell Overhead Press'"],
    ["'Seated OHP'", "'Barbell Overhead Press'"],
    ["'OHP'", "'Barbell Overhead Press'"],
    ["'DB Lateral Raise Drop Set'", "'Dumbbell Lateral Raise Drop Set'"],
    ["'DB Lateral Raises'", "'Dumbbell Lateral Raises'"],
    ["'DB Lateral Raise'", "'Dumbbell Lateral Raises'"],
    ["'Side Lateral Raises'", "'Dumbbell Lateral Raises'"],
    ["'Side Lateral Dumbbells'", "'Dumbbell Lateral Raises'"],
    ["'Side Lateral'", "'Dumbbell Lateral Raises'"],
    ["'Cable Lateral Raise'", "'Dumbbell Lateral Raises'"],
    ["'Lateral Raise'", "'Dumbbell Lateral Raises'"],
    ["'Bent-Over Lateral Raise'", "'Bent-Over Dumbbell Lateral Raise'"],
    ["'Bent-Over Lateral'", "'Bent-Over Dumbbell Lateral Raise'"],
    ["'Bent Over Lateral Raises'", "'Bent-Over Dumbbell Lateral Raise'"],
    ["'Chest-Supported Row'", "'Chest-Supported Dumbbell Row'"],
    ["'Chest Supported Row'", "'Chest-Supported Dumbbell Row'"],
    ["'Chest-Supported DB Row'", "'Chest-Supported Dumbbell Row'"],
    ["'DB Chest Press'", "'Dumbbell Chest Press'"],
    ["'Flat DB Press'", "'Flat Dumbbell Bench Press'"],
    ["'Flat DB Bench Press'", "'Flat Dumbbell Bench Press'"],
    ["'Incline DB Press'", "'Incline Dumbbell Press'"],
    ["'DB Press'", "'Dumbbell Chest Press'"],  // fallback
    ["'Decline DB Press'", "'Decline Dumbbell Press'"],
    ["'Decline Dumbbell'", "'Decline Dumbbell Press'"],
    ["'Flat Bench Press'", "'Flat Barbell Bench Press'"],
    ["'Flat Bench'", "'Flat Barbell Bench Press'"],
    ["'Bench Press'", "'Flat Barbell Bench Press'"],
    ["'Incline Bench'", "'Incline Barbell Bench Press'"],
    ["'Incline Barbell Press'", "'Incline Barbell Bench Press'"],
    ["'Flat Machine'", "'Flat Chest Press Machine'"],
    ["'Flat Chest Machine'", "'Flat Chest Press Machine'"],
    ["'Incline Hammer Strength'", "'Incline Hammer Strength Press'"],
    ["'Incline Hammer'", "'Incline Hammer Strength Press'"],
    ["'DB Shoulder Press'", "'Seated Dumbbell Shoulder Press'"],
    ["'Seated DB Press'", "'Seated Dumbbell Shoulder Press'"],
    ["'DB Shoulder Press'", "'Seated Dumbbell Shoulder Press'"],
    ["'Overhead Press'", "'Barbell Overhead Press'"],
    ["'EZ Bar Curl Heavy'", "'EZ Bar Bicep Curl'"],
    ["'EZ Curl Heavy'", "'EZ Bar Bicep Curl'"],
    ["'EZ Bar Curl'", "'EZ Bar Bicep Curl'"],
    ["'EZ Curl'", "'EZ Bar Bicep Curl'"],
    ["'EZ Curls'", "'EZ Bar Bicep Curl'"],
    ["'EZ Reverse Curl'", "'EZ Bar Reverse Curl'"],
    ["'Scott Curls'", "'Barbell Preacher Curl'"],
    ["'Concentration Curls'", "'Dumbbell Concentration Curl'"],
    ["'Donkey Calf'", "'Donkey Calf Raise'"],
    ["'Seated Calf'", "'Seated Calf Raise'"],
    ["'Calf Raise Heavy'", "'Standing Calf Raise'"],
    ["'Calf Raises'", "'Standing Calf Raise'"],
    ["'Calf Raise'", "'Standing Calf Raise'"],
    ["'Standing Calf'", "'Standing Calf Raise'"],
    ["'Calf'", "'Standing Calf Raise'"],
    ["'Abductor Machine'", "'Hip Abductor Machine'"],
    ["'Adductor Machine'", "'Hip Adductor Machine'"],
    ["'Abductor'", "'Hip Abductor Machine'"],
    ["'Adductor'", "'Hip Adductor Machine'"],
    ["'Shrugs Heavy'", "'Barbell Shrugs'"],
    ["'Barbell Shrugs Heavy'", "'Barbell Shrugs'"],
    ["'Shrugs'", "'Barbell Shrugs'"],
    ["'Close Grip Bench'", "'Close Grip Barbell Bench Press'"],
    ["'Skull Crushers'", "'EZ Bar Skull Crushers'"],
    ["'Kick Backs'", "'Dumbbell Tricep Kickback'"],
    ["'Kickbacks'", "'Dumbbell Tricep Kickback'"],
    ["'Weighted Triceps Dips'", "'Weighted Parallel Bar Dips'"],
    ["'Triceps Dips Weighted'", "'Weighted Parallel Bar Dips'"],
    ["'Weighted Dips'", "'Weighted Parallel Bar Dips'"],
    ["'Dips Weighted'", "'Weighted Parallel Bar Dips'"],
    ["'Triceps Dips'", "'Parallel Bar Dips'"],
    ["'Dips'", "'Parallel Bar Dips'"],
    ["'Overhead Triceps Extension'", "'Overhead Dumbbell Tricep Extension'"],
    ["'Overhead Triceps Heavy'", "'Overhead Dumbbell Tricep Extension'"],
    ["'Overhead Triceps'", "'Overhead Dumbbell Tricep Extension'"],
    ["'Cable Triceps Pushdowns'", "'Cable Tricep Pushdown'"],
    ["'Triceps Pushdown'", "'Cable Tricep Pushdown'"],
    ["'Push Press'", "'Barbell Push Press'"],
    ["'Power Clean (light)'", "'Barbell Power Clean (Light)'"],
    ["'Power Clean'", "'Barbell Power Clean'"],
    ["'Good Morning'", "'Barbell Good Morning'"],
    ["'Face Pull'", "'Cable Face Pull'"],
    ["'Upright Row Heavy'", "'Barbell Upright Row'"],
    ["'Upright Row'", "'Barbell Upright Row'"],
    ["'Hip Thrust'", "'Barbell Hip Thrust'"],
    ["'Pause Squat'", "'Barbell Pause Squat'"],
    ["'Box Squat'", "'Barbell Box Squat'"],
    ["'Front Squat'", "'Barbell Front Squat'"],
    ["'Barbell Squat'", "'Barbell Back Squat'"],
    ["'Back Squat'", "'Barbell Back Squat'"],
    ["'Smith Squat'", "'Smith Machine Squat'"],
    ["'Hack Squat Machine'", "'Hack Squat Machine'"],
    ["'Hack Squat'", "'Hack Squat Machine'"],
    ["'Leg Press Heavy'", "'Leg Press'"],
    ["'Single Leg Press'", "'Single Leg Press Machine'"],
    ["'Barbell Row Heavy'", "'Barbell Bent-Over Row'"],
    ["'Barbell Row'", "'Barbell Bent-Over Row'"],
    ["'Cable Pull-Over'", "'Cable Pullover'"],
    ["'Pull-Overs'", "'Dumbbell Pullover'"],
    ["'Deadlift Variation'", "'Romanian Deadlift'"],
    ["'Romanian Deadlift Heavy'", "'Romanian Deadlift'"],
    ["'Rack Pull Heavy'", "'Rack Pull'"],
    ["'Chin Ups Weighted'", "'Weighted Chin-Up'"],
    ["'Chin Ups'", "'Chin-Up (Max Reps)'"],
    ["'Chin-Ups Max'", "'Chin-Up (Max Reps)'"],
    ["'DB Fly'", "'Dumbbell Chest Fly'"],
    ["'Push-Up Drop Set'", "'Max Effort Push-Up Set'"],
    ["'Push-Up Burnout'", "'Max Effort Push-Up Set'"],
    ["'Treadmill Intervals'", "'Treadmill HIIT'"],
    ["'HIIT Bike'", "'Bike HIIT Intervals'"],
    ["'Bike HIIT'", "'Bike HIIT Intervals'"],
    ["'Easy Bike/Walk'", "'Low Intensity Cardio Warm-Up'"],
    ["'Zone 2 Steady State'", "'Zone 2 Steady State Cardio'"],
    ["'Moderate Steady State'", "'Moderate Steady State Cardio'"],
    ["'Light Cardio'", "'Low Intensity Steady State Cardio'"],
    ["'Moderate Cardio'", "'Moderate Steady State Cardio'"],
    ["'Sustained Zone 2-3 Cardio'", "'Zone 2-3 Sustained Cardio'"],
    ["'Row Machine'", "'Rowing Machine Cardio'"],
    ["'Hamstring Curl'", "'Lying Leg Curl'"],
    ["'Reverse Butterfly'", "'Reverse Pec Deck (Rear Delt)'"],
    ["'Pec Dec'", "'Pec Deck Fly'"],
    ["'Cable Fly Standing'", "'Standing Cable Chest Fly'"],
    ["'Cable Flys Standing'", "'Standing Cable Chest Fly'"],
    ["'Cable Fly'", "'Cable Chest Fly'"],
    ["'Cable Flys'", "'Cable Chest Fly'"],
    ["'Cable Row'", "'Seated Cable Row'"],
    ["'Barbell Shoulder Press'", "'Barbell Overhead Press'"],
    ["'SLDL'", "'Romanian Deadlift'"],
    ["'RDL'", "'Romanian Deadlift'"],
    ["'Stiff Leg Deadlift'", "'Romanian Deadlift'"],
    ["'Shoulder Press'", "'Barbell Overhead Press'"],
];

let totalChanges = 0;

for (const file of files) {
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileChanges = 0;
    
    for (const [from, to] of replacements) {
        if (from === to) continue; // Skip no-ops
        
        // Only replace within ex('...' context - the first arg
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
            content = content.replace(regex, to);
            fileChanges += matches.length;
        }
    }
    
    if (fileChanges > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`${file}: ${fileChanges} replacements`);
        totalChanges += fileChanges;
    } else {
        console.log(`${file}: no changes needed`);
    }
}

console.log(`\nTotal: ${totalChanges} replacements across ${files.length} files`);
