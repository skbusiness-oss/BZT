const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'data', 'exerciseLibrary.ts');
let content = fs.readFileSync(file, 'utf-8');

const newAliases = {
    'Decline Dumbbell Press': 'Decline Dumbbell Press', // Needs entry
    'Push-Ups': 'Push-Up',
    'Push-Up': 'Push-Up',
    'Push-Ups Max': 'Push-Up',
    'Max Effort Push-Up Set': 'Push-Up',
    'Push-Up Timed': 'Push-Up',
    'Push-Up Superset': 'Push-Up',
    'Barbell Upright Row': 'Barbell Upright Row', // Needs entry
    'Cable Face Pull': 'Cable Face Pull', // Needs entry
    'Cable Reverse Curl': 'Cable Reverse Curl', // Needs entry
    'Flat Chest Press Machine': 'Flat Chest Press Machine', // Needs entry
    'Standing Cable Chest Fly': 'Cable Chest Fly', // Alias to Cable Chest Fly
    'Reverse Pec Deck (Rear Delt)': 'Reverse Pec Deck (Rear Delt)', // Already in there? wait, verify.
    'Weighted Parallel Bar Dips': 'Parallel Bar Dips',
    'Weighted Dip': 'Parallel Bar Dips',
    'Hip Adductor Machine': 'Hip Adductor Machine',
    'Adductor + Abductor': 'Hip Adductor Machine',
    'Hip Abductor Machine': 'Hip Abductor Machine',
    'Preacher Curl': 'Barbell Preacher Curl',
    'EZ Bar Skull Crushers': 'Overhead Dumbbell Tricep Extension', // Can alias for now
    'EZ Bar Reverse Curl': 'Cable Reverse Curl',
    'Dumbbell Pullover': 'Dumbbell Pullover', // Needs entry
    'Dumbbell Chest Fly': 'Dumbbell Chest Fly', // Needs entry
    'Weighted Chin-Up': 'Pull-Ups',
    'Chin-Up (Max Reps)': 'Pull-Ups',
    'Chin-Ups': 'Pull-Ups',
    'Assisted Pull-Up': 'Pull-Ups',
    'Barbell Good Morning': 'Barbell Good Morning', // Needs entry
    'Barbell Pause Squat': 'Barbell Back Squat', // Alias
    'Nordic Hamstring Curl': 'Nordic Hamstring Curl', // Needs entry
    'Board Press': 'Flat Barbell Bench Press',
    'Weighted Pull-Up': 'Pull-Ups',
    'Rack Pull': 'Conventional Deadlift',
    'Dumbbell Chest Press': 'Flat Dumbbell Press',
    'Decline DB': 'Decline Dumbbell Press',
    'Burpee': 'Burpees',
    'Burpees': 'Burpees', // Needs entry
    'Burpees — Tabata': 'Burpees',
    'Jump Squat': 'Jump Squat',// Needs entry
    'Jump Squats — Tabata': 'Jump Squat',
    'Squat Jump': 'Jump Squat',
    'Mountain Climbers': 'Mountain Climbers', // Needs entry
    'Mountain Climbers — Tabata': 'Mountain Climbers',
    'Mountain Climber': 'Mountain Climbers',
    'High Knees': 'High Knees', // Needs cardio entry
    'High Knees — Tabata': 'High Knees',
    'Plank to Push-Up': 'Plank', // Alias to plank
    'DB Thruster': 'Thrusters', // Needs entry
    'Thruster': 'Thrusters',
    'Box Jump': 'Box Jumps', // Needs entry
    'Box Jumps': 'Box Jumps',
    'Kettlebell Swing': 'Kettlebell Swing', // Needs entry
    'Lunge Jump': 'Lunge Jumps', // Needs entry
    'Skater Jumps': 'Skater Jumps', // Needs cardio
    'Wall Sit Max': 'Wall Sit', // Needs cardio
    'Wall Sit': 'Wall Sit',
    'Goblet Squat': 'Goblet Squat', // Needs entry
    'Barbell Hip Thrust': 'Barbell Hip Thrust', // Needs entry
    'Seated Barbell Military Press': 'Barbell Overhead Press',
    'Barbell Front Squat': 'Front Squat', // Verify alias
    'Barbell Push Press': 'Barbell Overhead Press', // Alias
    'Barbell Power Clean': 'Barbell Power Clean', // Needs entry
    'Barbell Power Clean (Light)': 'Barbell Power Clean',
    'Barbell Box Squat': 'Barbell Back Squat', // Alias
    'Farmer\\': 'Farmers Walk', // Needs entry
    'DB Squat': 'Goblet Squat',
    'DB Squat Timed': 'Goblet Squat',
    'DB Press Timed': 'Seated Dumbbell Shoulder Press',
    'Curl + Triceps SS': 'EZ Bar Bicep Curl', // Alias
    'Step-Up': 'Box Step-Up', 
    'Box Step-Up': 'Box Step-Up', // Needs entry
    'Sled Push': 'Sled Push', // Needs entry
    'Sled Push/Pull': 'Sled Push',
    'Warm-Up Walk': 'Low Intensity Cardio Warm-Up', // Cardio
    'Recovery Walk': 'Low Intensity Cardio Warm-Up',
    'Cool Down Walk': 'Low Intensity Cardio Warm-Up',
    'Cool Down Stretch': 'Low Intensity Cardio Warm-Up',
    'Mobility Work': 'Low Intensity Cardio Warm-Up',
    'Warm-Up': 'Low Intensity Cardio Warm-Up',
    'Stretch': 'Low Intensity Cardio Warm-Up',
    'Cool Down': 'Low Intensity Cardio Warm-Up',
    'Sprint Interval': 'Sprint Intervals', // Cardio
    'Bike: Sprint / Easy': 'Bike HIIT Intervals', // Cardio
    'Bike Cardio': 'Bike HIIT Intervals', // Cardio
    'Bike': 'Bike HIIT Intervals',
    'Core Circuit': 'Core Circuit (Plank / Crunch / Leg Raise)', // Cardio
    'Steady State Cardio': 'Moderate Steady State Cardio', // Cardio
    'Intensity Burst': 'Sprint Intervals', // Cardio
    'Stairmaster Intervals': 'Stairmaster', // Cardio
    'Row Warm Up': 'Rowing Machine Cardio', // Cardio
    'Row High Effort': 'Rowing Machine Cardio', // Cardio
    'Row Recovery': 'Rowing Machine Cardio', // Cardio
    'Row Sprint Finale': 'Rowing Machine Cardio', // Cardio
    'Row Cool Down': 'Rowing Machine Cardio', // Cardio
    'Incline Treadmill': 'Treadmill Incline Walk',
    'Treadmill Incline Walk': 'Treadmill Incline Walk', // Cardio
    'Bicycle Crunch': 'Bicycle Crunch', // Needs entry
    'Plank Variations': 'Plank', // Alias
    'Plank Hold': 'Plank',
    'Zone 2 Cardio Warm-Up': 'Zone 2 Steady State Cardio', // Cardio
    'HIIT Intervals': 'Treadmill HIIT', // Cardio
    'Lactate Threshold Intervals': 'Sprint Intervals', // Cardio
    'Zone 2 Sustained': 'Zone 2 Steady State Cardio', // Cardio
    'Tempo Effort': 'Zone 2-3 Sustained Cardio', // Cardio
    'Progressive Intervals': 'Sprint Intervals', // Cardio
    'Foam Roll': 'Foam Rolling', // Cardio
    'Foam Rolling': 'Foam Rolling',
    'Long Distance Sustained': 'Low Intensity Steady State Cardio', // Cardio
    'Seated High Cable Row': 'Seated Cable Row',
    'Chest-Supported Machine Row': 'Seated Cable Row', // close enough
    'Cable Pullover': 'Cable Pullover', // Needs entry
    'Biceps Machine': 'Barbell Preacher Curl',
    'Cable Overhead Tricep Extension': 'Overhead Dumbbell Tricep Extension',
    'Dumbbell Tricep Kickback': 'Dumbbell Tricep Kickback', // Needs entry
    'Lying Leg Curl': 'Leg Curl', // Alias
    'Smith Machine Squat': 'Barbell Back Squat',
    'Dumbbell Romanian Deadlift': 'Romanian Deadlift', // Alias
    'Seated Calf Raise': 'Seated Calf Raise', // Needs entry
    'Donkey Calf Raise': 'Standing Calf Raise', // close enough
    'Hyperextensions Max': 'Hyperextensions', // Needs entry
    'Pause Bench': 'Flat Barbell Bench Press',
    'Band Pull-Apart': 'Band Pull-Apart', // Needs entry
    'Safety Bar Squat': 'Barbell Back Squat',
    'Single Leg Press Machine': 'Leg Press',
    'Floor Press': 'Flat Barbell Bench Press',
    'Triceps Lockout': 'Cable Tricep Pushdown',
    'Band Pushdown': 'Cable Tricep Pushdown',
    'Sumo Deadlift': 'Sumo Deadlift', // Needs entry
    'Hex Bar Deadlift': 'Hex Bar Deadlift', // Needs entry
    'Bulgarian Split Squat': 'Bulgarian Split Squat', // Needs entry
    'Treadmill HIIT Intervals': 'Treadmill HIIT', 
    'Wide Grip Pull-Down': 'Wide Grip Lat Pulldown', // Alias
    'DB Arnold Press': 'Arnold Press', // Needs entry
    'Arnold Press': 'Arnold Press',
    'Triceps Rope Pushdown': 'Cable Tricep Pushdown',
    'Dumbbell Lateral Raise Drop Set': 'Dumbbell Lateral Raises',
    'DB Side Lateral': 'Dumbbell Lateral Raises',
    'Lateral Raise + Lunge + Crunch': 'Dumbbell Lateral Raises',
    'Incline Chest Machine': 'Incline Hammer Strength Press',
    'Cable Crunch': 'Cable Crunch', // Needs entry
    'Reverse Crunch': 'Reverse Crunch', // Needs entry
    'Seated DB Shoulder Press': 'Seated Dumbbell Shoulder Press', // Alias
    'Smith Machine Incline Press': 'Incline Barbell Bench Press', // Alias
    'Reverse Grip Pulldown': 'Wide Grip Lat Pulldown', // Alias
    'Heavy DB Row': 'Chest-Supported Dumbbell Row', // Alias
    'Core Stability': 'Plank', // Alias
    'DB Shrugs': 'Barbell Shrugs', // Alias
    'Chest Machine': 'Flat Chest Press Machine', // Alias
    'Bodyweight Lunges': 'Dumbbell Walking Lunge', // Alias
    'Plank Circuit': 'Core Circuit (Plank / Crunch / Leg Raise)', // Alias
    'Seated Row Machine': 'Seated Cable Row', // Alias
    'Push-Up Timed': 'Push-Up',
    'DB Row Timed': 'Chest-Supported Dumbbell Row',
    'EMOM: Squat+Push-Up+Row': 'Push-Up', // Cannot represent complex
    'Band Pulldown': 'Wide Grip Lat Pulldown',
    'Barbell Complex: Squat+Row+Press': 'Barbell Back Squat',
    'AMRaP Circuit': 'Core Circuit (Plank / Crunch / Leg Raise)',
    'Squat + Push-Up + DB Row': 'Barbell Back Squat',
    'Jump Rope Between Rounds': 'Jump Rope',
    'Overhead Press DB': 'Seated Dumbbell Shoulder Press',
    'Bodyweight Squat': 'Barbell Back Squat',
    'Timed Circuit: DB Press': 'Seated Dumbbell Shoulder Press',
    'Timed Circuit: DB Row': 'Chest-Supported Dumbbell Row',
    'Timed Circuit: Shoulder Press': 'Seated Dumbbell Shoulder Press',
    'Timed Circuit: Pulldown': 'Wide Grip Lat Pulldown',
    'Timed Circuit: Cable Fly': 'Cable Chest Fly',
    'Timed Circuit: Lateral Raise': 'Dumbbell Lateral Raises',
    'Timed Circuit: Curl': 'Hammer Curls',
    'Timed Circuit: Triceps': 'Cable Tricep Pushdown',
    'Timed: Squat': 'Barbell Back Squat',
    'Timed: Lunge': 'Dumbbell Walking Lunge',
    'Timed: Hip Thrust': 'Barbell Hip Thrust',
    'Timed: Step-Up': 'Box Step-Up',
    'Timed: Calf Raise': 'Standing Calf Raise',
    'Timed: Leg Extension': 'Leg Extension',
    'Timed: Leg Curl': 'Leg Curl',
    'Timed: Jump Squat + Wall Sit': 'Jump Squat'
};

const entriesToInjectArr = [
    // Lifts
    ['Decline Dumbbell Press', 'ضغط دمبلز مائل للأسفل', 'Dumbbell_Decline_Bench_Press', 'Chest', 'الصدر'],
    ['Push-Up', 'ضغط بوش أب', 'Push-Up', 'Chest', 'الصدر'],
    ['Barbell Upright Row', 'سحب عمودي بالبار', 'Upright_Barbell_Row', 'Shoulders', 'الأكتاف'],
    ['Cable Face Pull', 'سحب وجه بالكيبل', 'Face_Pull', 'Rear Delts', 'الدالية الخلفية'],
    ['Barbell Preacher Curl', 'كيرل بايسبس على الحصان', 'Z_Bar_Preacher_Curl', 'Biceps', 'البايسبس'],
    ['Dumbbell Concentration Curl', 'كيرل بايسبس تركيز بالدمبل', 'Concentration_Curls', 'Biceps', 'البايسبس'],
    ['Cable Reverse Curl', 'كيرل عكسي بالكيبل', 'Cable_Reverse_Curl', 'Forearms', 'الساعدين'],
    ['Flat Chest Press Machine', 'جهاز ضغط صدر مستوي', 'Machine_Bench_Press', 'Chest', 'الصدر'],
    ['Hip Adductor Machine', 'جهاز ضم الفخذين', 'Lever_Seated_Hip_Adduction', 'Adductors', 'الضامة'],
    ['Dumbbell Pullover', 'بولوفر دمبل', 'Straight-Arm_Dumbbell_Pullover', 'Chest', 'الصدر'],
    ['Dumbbell Chest Fly', 'التفتيح بالدمبلز للصدر', 'Dumbbell_Flyes', 'Chest', 'الصدر'],
    ['Barbell Good Morning', 'تمرين صباح الخير بالبار', 'Good_Morning', 'Lower Back', 'أسفل الظهر'],
    ['Nordic Hamstring Curl', 'كيرل فخذ خلفي نورديك', 'Lying_Leg_Curls', 'Hamstrings', 'الفخذ الخلفي'],
    ['Kettlebell Swing', 'أرجحة الكيتل بيل', 'Kettlebell_Swing', 'Glutes', 'الأرداف'],
    ['Goblet Squat', 'سكوات جوبلت', 'Goblet_Squat', 'Quadriceps', 'الفخذ الأمامي'],
    ['Barbell Hip Thrust', 'رفع حوض بالبار', 'Barbell_Hip_Thrust', 'Glutes', 'الأرداف'],
    ['Barbell Power Clean', 'باور كلين بالبار', 'Power_Clean', 'Full Body', 'الجسم كامل'],
    ['Farmers Walk', 'مشي المزارع', 'Farmers_Walk', 'Full Body', 'الجسم كامل'],
    ['Box Step-Up', 'صعود الصندوق', 'Dumbbell_Step_ups', 'Quadriceps', 'الفخذ الأمامي'],
    ['Cable Pullover', 'بولوفر كيبل', 'Cable_Pullover', 'Lats', 'المجنص'],
    ['Dumbbell Tricep Kickback', 'كيك باك تراي دمبل', 'Tricep_Dumbbell_Kickback', 'Triceps', 'التراي'],
    ['Seated Calf Raise', 'سمانة جالس', 'Seated_Calf_Raise', 'Calves', 'السمانة'],
    ['Hyperextensions', 'تمديد الظهر', 'Hyperextensions', 'Lower Back', 'أسفل الظهر'],
    ['Band Pull-Apart', 'باند بول أبارت', 'Band_Pull_Apart', 'Rear Delts', 'الدالية الخلفية'],
    ['Sumo Deadlift', 'ديدلفت سومو', 'Sumo_Deadlift', 'Glutes', 'الأرداف'],
    ['Hex Bar Deadlift', 'ديدلفت بالهيكس بار', 'Trap_Bar_Deadlift', 'Hamstrings', 'الفخذ الخلفي'],
    ['Bulgarian Split Squat', 'سكوات بلغاري', 'Bulgarian_Split_Squat', 'Quadriceps', 'الفخذ الأمامي'],
    ['Arnold Press', 'ضغط أرنولد', 'Arnold_Dumbbell_Press', 'Shoulders', 'الأكتاف'],
    ['Cable Crunch', 'كابل كرانش للبطن', 'Cable_Crunch', 'Core', 'البطن'],
    ['Reverse Crunch', 'كرانش عكسي', 'Reverse_Crunch', 'Core', 'البطن'],
    ['Bicycle Crunch', 'دراجه هوائية للبطن', 'Air_Bikes', 'Core', 'البطن'],
];

const cardioToInject = [
    ['Treadmill Incline Walk', 'مشي مائل على السير'],
    ['High Knees', 'ركبتين عاليا'],
    ['Skater Jumps', 'قفزات المتزلج'],
    ['Wall Sit', 'جلوس الحائط'],
    ['Sled Push', 'دفع المزلقة'],
    ['Foam Rolling', 'رول فوم'],
    ['Burpees', 'بيربي'],
    ['Mountain Climbers', 'متسلق الجبال'],
    ['Jump Squat', 'قفز سكوات'],
    ['Thrusters', 'ثراسترز'],
    ['Box Jumps', 'قفز الصندوق']
];

/* Generate the string code to inject into exerciseLibrary.ts */
let injectString = '';

entriesToInjectArr.forEach(([name, nameAr, gifId, muscle, muscleAr]) => {
    // Only inject if not currently in the file
    if (!content.includes(`'${name}': ex({`)) {
        injectString += `
    '${name}': ex({
        name: '${name}', nameAr: '${nameAr}', gifId: '${gifId}',
        primary: ['${muscle}'], primaryAr: ['${muscleAr}'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),`;
    }
});

cardioToInject.forEach(([name, nameAr]) => {
    if (!content.includes(`'${name}': cardio(`)) {
        injectString += `
    '${name}': cardio('${name}', '${nameAr}', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),`;
    }
});

// We inject it right before `// ── Aliases:`
const targetStr = `// ── Aliases: common name variations mapped to canonical entries ─────`;
content = content.replace(targetStr, `    // ── INJECTED PENDING REVIEW ──` + injectString + `\n\n` + targetStr);

// Overwrite the ALIASES object
let aliasLines = [];
let insideAlias = false;
const formattedAliases = Object.entries(newAliases).map(([k,v]) => `    '${k.toLowerCase()}': '${v}',`).join('\n');

const regexAliasObj = /(const ALIASES: Record<string, string> = \{)([\s\S]*?)(\};)/;
content = content.replace(regexAliasObj, `$1\n${formattedAliases}\n$3`);

fs.writeFileSync(file, content, 'utf-8');
console.log('Done injecting new exercises and aliasing.');
