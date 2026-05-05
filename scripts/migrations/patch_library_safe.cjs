const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'data', 'exerciseLibrary.ts');
let content = fs.readFileSync(file, 'utf-8');

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

let injectString = '';

entriesToInjectArr.forEach(([name, nameAr, gifId, muscle, muscleAr]) => {
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

if (injectString.trim().length > 0) {
    const splitStr = '};\n\n    // ── Aliases:';
    if(content.includes('};\n\n    // ── Aliases:')) {
         content = content.replace('};\n\n    // ── Aliases:', injectString + '\n};\n\n    // ── Aliases:');
    } else {
         content = content.replace(/};\s*\n\s*\/\/\s*── Aliases:/, injectString + '\n};\n\n    // ── Aliases:');
    }
    fs.writeFileSync(file, content, 'utf-8');
}
console.log('Injected newly missing files');
