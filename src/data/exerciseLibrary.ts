/**
 * Exercise Library — Maps exercise names to GIF URLs + EN/AR instructions.
 *
 * GIF IDs reference folders in https://github.com/yuhonas/free-exercise-db
 * Path format: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{gifId}/images/0.jpg
 *
 * Cardio protocols (HIIT, Zone 2, circuits) are marked with type: 'cardio_protocol'
 * — the modal renders a simple info card for these instead of GIF+instructions.
 */

import { ExerciseDetail, GifSource } from '../types';

const GIF_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export function getGifUrl(gifId: string): string {
    return `${GIF_BASE}/${gifId}/images/0.jpg`;
}

// ── Compact builder ─────────────────────────────────────────────────────
type ExInput = {
    name: string; nameAr: string;
    gifId?: string; videoUrl?: string; source?: GifSource;
    primary: string[]; primaryAr: string[];
    secondary?: string[]; secondaryAr?: string[];
    steps: string[]; stepsAr: string[];
    tips?: string[]; tipsAr?: string[];
    mistakes?: string[]; mistakesAr?: string[];
    equipment: string; equipmentAr: string;
};
function ex(i: ExInput): ExerciseDetail {
    return {
        canonicalName: i.name,
        canonicalNameAr: i.nameAr,
        gifUrl: i.gifId ? getGifUrl(i.gifId) : (i.videoUrl || ''),
        gifId: i.gifId,
        videoUrl: i.videoUrl,
        gifSource: i.source ?? (i.gifId ? 'free-exercise-db' : (i.videoUrl ? 'workout-cool' : undefined)),
        type: 'lift',
        muscles: {
            primary: i.primary, primaryAr: i.primaryAr,
            secondary: i.secondary ?? [], secondaryAr: i.secondaryAr ?? [],
        },
        instructions: i.steps, instructionsAr: i.stepsAr,
        tips: i.tips ?? [], tipsAr: i.tipsAr ?? [],
        commonMistakes: i.mistakes ?? [], commonMistakesAr: i.mistakesAr ?? [],
        equipment: i.equipment, equipmentAr: i.equipmentAr,
    };
}

// Cardio protocol marker — minimal fields, rendered as info card
function cardio(name: string, nameAr: string, equipment: string, equipmentAr: string, note: string, noteAr: string): ExerciseDetail {
    return {
        canonicalName: name, canonicalNameAr: nameAr,
        gifUrl: '', type: 'cardio_protocol',
        muscles: { primary: ['Cardiovascular System'], primaryAr: ['الجهاز الدوري'], secondary: [], secondaryAr: [] },
        instructions: [note], instructionsAr: [noteAr],
        tips: [], tipsAr: [], commonMistakes: [], commonMistakesAr: [],
        equipment, equipmentAr,
    };
}

const LIBRARY: Record<string, ExerciseDetail> = {
    // ═══ BARBELL COMPOUNDS ═══════════════════════════════════════════
    'Barbell Back Squat': ex({
        name: 'Barbell Back Squat', nameAr: 'سكوات خلفي بالبار', gifId: 'Barbell_Full_Squat',
        primary: ['Quadriceps', 'Glutes'], primaryAr: ['الفخذ الأمامي', 'الأرداف'],
        secondary: ['Hamstrings', 'Core', 'Lower Back'], secondaryAr: ['الفخذ الخلفي', 'البطن', 'أسفل الظهر'],
        steps: ['Place bar across upper back (traps, not neck)', 'Feet shoulder-width, toes slightly out', 'Brace core, take a deep breath', 'Push hips back and down like sitting in a chair', 'Descend until thighs at least parallel', 'Drive through heels to stand'],
        stepsAr: ['ضع البار على أعلى الظهر (الترابيز، ليس الرقبة)', 'قدمان بعرض الأكتاف، الأصابع قليلاً للخارج', 'شد البطن، خذ نفساً عميقاً', 'ادفع الوركين للخلف والأسفل كالجلوس', 'انزل حتى يوازي الفخذ الأرض', 'ادفع من الكعبين للوقوف'],
        tips: ['Keep chest up, core tight', 'Don\'t let knees cave inward', 'Control the descent'],
        tipsAr: ['ارفع الصدر، شد البطن', 'لا تدع الركبتين تنحرف للداخل', 'تحكم في النزول'],
        mistakes: ['Rounding lower back', 'Knees caving in', 'Rising on toes'],
        mistakesAr: ['تقوس أسفل الظهر', 'انحراف الركبتين', 'الارتفاع على الأصابع'],
        equipment: 'Barbell + Squat Rack', equipmentAr: 'بار + رف سكوات',
    }),
    'Front Squat': ex({
        name: 'Front Squat', nameAr: 'سكوات أمامي', gifId: 'Barbell_Front_Squat',
        primary: ['Quadriceps'], primaryAr: ['الفخذ الأمامي'],
        secondary: ['Glutes', 'Core', 'Upper Back'], secondaryAr: ['الأرداف', 'البطن', 'أعلى الظهر'],
        steps: ['Rack bar on front delts, elbows high', 'Feet shoulder-width, toes slightly out', 'Keep torso upright, brace core', 'Descend into a deep squat', 'Drive through midfoot to stand', 'Maintain high elbows throughout'],
        stepsAr: ['ضع البار على الدالية الأمامية، المرفقان مرفوعان', 'قدمان بعرض الأكتاف، الأصابع للخارج قليلاً', 'ابقَ الجذع مستقيماً، شد البطن', 'انزل في سكوات عميق', 'ادفع من وسط القدم للوقوف', 'حافظ على رفع المرفقين طوال الحركة'],
        tips: ['Keep elbows pointed forward', 'Torso must stay upright', 'Wrist flexibility helps'],
        tipsAr: ['وجّه المرفقين للأمام', 'ابقَ الجذع عمودياً', 'مرونة الرسغ مهمة'],
        mistakes: ['Elbows dropping', 'Leaning forward', 'Heels rising'],
        mistakesAr: ['سقوط المرفقين', 'الانحناء للأمام', 'ارتفاع الكعبين'],
        equipment: 'Barbell + Rack', equipmentAr: 'بار + رف',
    }),
    'Flat Barbell Bench Press': ex({
        name: 'Flat Barbell Bench Press', nameAr: 'بنش بريس مستوي بالبار', gifId: 'Barbell_Bench_Press_-_Medium_Grip',
        primary: ['Chest', 'Triceps'], primaryAr: ['الصدر', 'التراي'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Lie flat, eyes under the bar', 'Grip slightly wider than shoulders', 'Unrack, lower to midchest', 'Touch chest lightly — no bounce', 'Press to full lockout', 'Keep shoulder blades retracted'],
        stepsAr: ['استلقِ مسطحاً، العينان تحت البار', 'قبضة أوسع قليلاً من الأكتاف', 'أخرج البار، أنزله لمنتصف الصدر', 'المس الصدر بخفة — بدون ارتداد', 'ادفع حتى الإقفال الكامل', 'حافظ على سحب لوحي الكتف'],
        tips: ['Squeeze shoulder blades together', 'Slight arch in lower back', 'Drive feet into floor'],
        tipsAr: ['اضغط لوحي الكتف', 'تقوس خفيف في أسفل الظهر', 'ادفع القدمين في الأرض'],
        mistakes: ['Bouncing off chest', 'Flaring elbows wide', 'Losing shoulder retraction'],
        mistakesAr: ['ارتداد عن الصدر', 'فتح المرفقين', 'فقد سحب الكتفين'],
        equipment: 'Barbell + Flat Bench + Rack', equipmentAr: 'بار + بنش مستوي + رف',
    }),
    'Incline Barbell Bench Press': ex({
        name: 'Incline Barbell Bench Press', nameAr: 'بنش بريس مائل بالبار', gifId: 'Barbell_Incline_Bench_Press_-_Medium-Grip',
        primary: ['Upper Chest', 'Triceps'], primaryAr: ['أعلى الصدر', 'التراي'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Set bench to 30–45°', 'Eyes under bar, grip wider than shoulders', 'Unrack and lower to upper chest', 'Touch lightly, then press up', 'Lock out with control', 'Keep shoulder blades retracted'],
        stepsAr: ['اضبط البنش 30-45°', 'العينان تحت البار، قبضة أوسع من الأكتاف', 'أخرج البار وأنزله لأعلى الصدر', 'المس بخفة ثم ادفع', 'أقفل بتحكم', 'حافظ على سحب الكتفين'],
        tips: ['Don\'t set bench too steep', 'Drive bar slightly back at lockout'],
        tipsAr: ['لا تضبط البنش شديد الميل', 'ادفع البار للخلف قليلاً عند الإقفال'],
        mistakes: ['Bench too steep (>45°)', 'Short range of motion'],
        mistakesAr: ['بنش شديد الميل (>45°)', 'مدى حركي قصير'],
        equipment: 'Barbell + Incline Bench', equipmentAr: 'بار + بنش مائل',
    }),
    'Close Grip Barbell Bench Press': ex({
        name: 'Close Grip Barbell Bench Press', nameAr: 'بنش بريس قبضة ضيقة', gifId: 'Close-Grip_Barbell_Bench_Press',
        primary: ['Triceps', 'Chest'], primaryAr: ['التراي', 'الصدر'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Lie flat, grip bar shoulder-width', 'Unrack and lower to lower chest', 'Keep elbows tucked close to ribs', 'Touch chest, press straight up', 'Lock out, squeeze triceps'],
        stepsAr: ['استلقِ مسطحاً، قبضة بعرض الأكتاف', 'أخرج البار وأنزله لأسفل الصدر', 'ابقِ المرفقين قريبين من الأضلاع', 'المس الصدر، ادفع للأعلى', 'أقفل واضغط التراي'],
        tips: ['Elbows stay tucked — not flared', 'Don\'t grip too narrow (wrist pain)'],
        tipsAr: ['ابقِ المرفقين ملتصقين — ليس متفتحين', 'لا تضيق القبضة كثيراً (ألم الرسغ)'],
        mistakes: ['Grip too narrow', 'Elbows flaring'],
        mistakesAr: ['قبضة ضيقة جداً', 'فتح المرفقين'],
        equipment: 'Barbell + Flat Bench', equipmentAr: 'بار + بنش مستوي',
    }),
    'Barbell Overhead Press': ex({
        name: 'Barbell Overhead Press', nameAr: 'ضغط علوي بالبار', gifId: 'Standing_Military_Press',
        primary: ['Shoulders', 'Triceps'], primaryAr: ['الأكتاف', 'التراي'],
        secondary: ['Upper Chest', 'Core', 'Traps'], secondaryAr: ['أعلى الصدر', 'البطن', 'الترابيز'],
        steps: ['Stand, feet shoulder-width', 'Bar at shoulder height, grip just wider than shoulders', 'Brace core and glutes', 'Press bar straight overhead', 'Move head back slightly as bar passes', 'Lower with control to shoulders'],
        stepsAr: ['قف، قدمان بعرض الأكتاف', 'البار عند الكتف، قبضة أوسع قليلاً من الأكتاف', 'شد البطن والأرداف', 'ادفع البار للأعلى مباشرة', 'حرك الرأس للخلف قليلاً عند مرور البار', 'أنزل بتحكم للأكتاف'],
        tips: ['Stay vertical — no excessive back lean', 'Full lockout overhead', 'Exhale at the top'],
        tipsAr: ['ابقَ عمودياً — لا تميل كثيراً', 'إقفال كامل للأعلى', 'أخرج الزفير في القمة'],
        mistakes: ['Excessive back lean', 'Not locking out', 'Pressing forward'],
        mistakesAr: ['ميل مفرط للخلف', 'عدم الإقفال', 'الدفع للأمام'],
        equipment: 'Barbell', equipmentAr: 'بار',
    }),
    'Romanian Deadlift': ex({
        name: 'Romanian Deadlift', nameAr: 'ديدلفت روماني', gifId: 'Romanian_Deadlift',
        primary: ['Hamstrings', 'Glutes'], primaryAr: ['الفخذ الخلفي', 'الأرداف'],
        secondary: ['Lower Back', 'Core'], secondaryAr: ['أسفل الظهر', 'البطن'],
        steps: ['Feet hip-width, bar in front of thighs', 'Slight knee bend — keep fixed', 'Hinge at hips, push them straight back', 'Lower bar along legs until deep hamstring stretch', 'Drive hips forward to stand', 'Keep bar close to body'],
        stepsAr: ['قدمان بعرض الوركين، البار أمام الفخذين', 'انحناء خفيف في الركبة — ثابت', 'انحنِ من الوركين، ادفعهما للخلف', 'أنزل البار على الساقين حتى تمدد الفخذ الخلفي', 'ادفع الوركين للأمام للوقوف', 'أبقِ البار قريباً من الجسم'],
        tips: ['Think "push hips back" not "bend forward"', 'Feel it in hamstrings, not lower back'],
        tipsAr: ['فكر "ادفع الوركين للخلف" لا "انحنِ"', 'اشعر بها في الفخذ الخلفي ليس الظهر'],
        mistakes: ['Rounding back', 'Too much knee bend', 'Bar drifting away'],
        mistakesAr: ['تقوس الظهر', 'ثني الركبتين كثيراً', 'ابتعاد البار'],
        equipment: 'Barbell', equipmentAr: 'بار',
    }),
    'Conventional Deadlift': ex({
        name: 'Conventional Deadlift', nameAr: 'ديدلفت تقليدي', gifId: 'Barbell_Deadlift',
        primary: ['Hamstrings', 'Glutes', 'Lower Back'], primaryAr: ['الفخذ الخلفي', 'الأرداف', 'أسفل الظهر'],
        secondary: ['Upper Back', 'Core', 'Traps'], secondaryAr: ['أعلى الظهر', 'البطن', 'الترابيز'],
        steps: ['Bar over midfoot, feet hip-width', 'Grip just outside knees', 'Drop hips, chest up, back flat', 'Take slack out of bar (big breath)', 'Drive through floor, stand with bar close', 'Lock out hips at top'],
        stepsAr: ['البار فوق وسط القدم، قدمان بعرض الوركين', 'قبضة خارج الركبتين مباشرة', 'أنزل الوركين، ارفع الصدر، الظهر مستقيم', 'شد البار (نفس عميق)', 'ادفع الأرض، قف والبار قريب', 'أقفل الوركين في القمة'],
        tips: ['Bar stays against legs', 'Brace core like taking a punch', 'Hinge, don\'t squat'],
        tipsAr: ['البار ملتصق بالساقين', 'شد البطن كأنك ستتلقى لكمة', 'انحناء مفصلي، ليس سكوات'],
        mistakes: ['Back rounding', 'Bar drifting forward', 'Hyperextending at lockout'],
        mistakesAr: ['تقوس الظهر', 'ابتعاد البار', 'فرط التقوس في الإقفال'],
        equipment: 'Barbell', equipmentAr: 'بار',
    }),
    'Barbell Bent-Over Row': ex({
        name: 'Barbell Bent-Over Row', nameAr: 'تجديف بالبار منحني', gifId: 'Bent_Over_Barbell_Row',
        primary: ['Upper Back', 'Lats'], primaryAr: ['أعلى الظهر', 'العضلة العريضة'],
        secondary: ['Biceps', 'Rear Delts', 'Core'], secondaryAr: ['البايسبس', 'الدالية الخلفية', 'البطن'],
        steps: ['Feet shoulder-width, knees slightly bent', 'Hinge at hips to ~45°', 'Grip slightly wider than shoulders', 'Pull bar to lower chest / upper abs', 'Squeeze shoulder blades together', 'Lower with control'],
        stepsAr: ['قدمان بعرض الأكتاف، ركبتان منحنيتان قليلاً', 'انحنِ من الوركين لـ45°', 'قبضة أوسع قليلاً من الأكتاف', 'اسحب البار لأسفل الصدر / أعلى البطن', 'اضغط لوحي الكتف', 'أنزل بتحكم'],
        tips: ['Brace core to protect back', 'Pull with elbows, not hands', 'No momentum'],
        tipsAr: ['شد البطن لحماية الظهر', 'اسحب بالمرفقين لا اليدين', 'بدون زخم'],
        mistakes: ['Excessive momentum', 'Pulling too low', 'Rounding back'],
        mistakesAr: ['زخم مفرط', 'السحب منخفضاً جداً', 'تقوس الظهر'],
        equipment: 'Barbell', equipmentAr: 'بار',
    }),
    'T-Bar Row': ex({
        name: 'T-Bar Row', nameAr: 'تي بار رو', gifId: 'T-Bar_Row_with_Handle',
        primary: ['Upper Back', 'Lats'], primaryAr: ['أعلى الظهر', 'العضلة العريضة'],
        secondary: ['Biceps', 'Rear Delts'], secondaryAr: ['البايسبس', 'الدالية الخلفية'],
        steps: ['Straddle the bar or stand at landmine', 'Hinge hips, chest up, grip V-handle', 'Pull handle to lower chest', 'Squeeze back at the top', 'Lower with control'],
        stepsAr: ['قف فوق البار أو عند الاند ماين', 'انحنِ بالورك، ارفع الصدر، امسك المقبض', 'اسحب المقبض لأسفل الصدر', 'اضغط الظهر في القمة', 'أنزل بتحكم'],
        tips: ['Keep chest proud', 'Drive elbows back, not up'],
        tipsAr: ['حافظ على رفع الصدر', 'ادفع المرفقين للخلف، ليس للأعلى'],
        mistakes: ['Rounding back', 'Short range of motion'],
        mistakesAr: ['تقوس الظهر', 'مدى حركي قصير'],
        equipment: 'T-Bar / Landmine + V-handle', equipmentAr: 'تي بار / لاند ماين + مقبض',
    }),
    'Barbell Shrugs': ex({
        name: 'Barbell Shrugs', nameAr: 'شراقز بالبار', gifId: 'Barbell_Shrug',
        primary: ['Traps'], primaryAr: ['الترابيز'],
        secondary: ['Forearms'], secondaryAr: ['الساعدين'],
        steps: ['Stand upright holding bar with overhand grip', 'Arms straight, relax shoulders', 'Shrug shoulders straight up toward ears', 'Hold the peak for 1 second', 'Lower with control'],
        stepsAr: ['قف مع إمساك البار قبضة علوية', 'الذراعان مستقيمان، استرخِ الأكتاف', 'ارفع الكتفين للأعلى باتجاه الأذنين', 'اثبت في القمة ثانية', 'أنزل بتحكم'],
        tips: ['Straight up, not circular', 'Hold at the top for better activation'],
        tipsAr: ['للأعلى مباشرة، ليس دائرياً', 'اثبت في القمة لتنشيط أفضل'],
        mistakes: ['Rolling shoulders', 'Using too much weight'],
        mistakesAr: ['تدوير الكتفين', 'وزن مفرط'],
        equipment: 'Barbell', equipmentAr: 'بار',
    }),

    // ═══ DUMBBELL EXERCISES ══════════════════════════════════════════
    'Incline Dumbbell Press': ex({
        name: 'Incline Dumbbell Press', nameAr: 'ضغط مائل بالدمبلز', gifId: 'Dumbbell_Bench_Press',
        primary: ['Upper Chest', 'Triceps'], primaryAr: ['أعلى الصدر', 'التراي'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Set bench 30–45°', 'Dumbbells at shoulder level, palms forward', 'Press up until arms extended', 'Lower with control, feel stretch', 'Don\'t slam dumbbells at top'],
        stepsAr: ['اضبط البنش 30-45°', 'الدمبلز عند الكتف، الكفان للأمام', 'ادفع حتى مد الذراعين', 'أنزل بتحكم، اشعر بالتمدد', 'لا تصطدم الدمبلز في القمة'],
        tips: ['Squeeze chest at the top', 'Don\'t drift dumbbells forward'],
        tipsAr: ['اضغط الصدر في القمة', 'لا تدع الدمبلز تنحرف للأمام'],
        mistakes: ['Bench too steep', 'Short ROM'],
        mistakesAr: ['بنش شديد الميل', 'مدى قصير'],
        equipment: 'Dumbbells + Incline Bench', equipmentAr: 'دمبلز + بنش مائل',
    }),
    'Flat Dumbbell Press': ex({
        name: 'Flat Dumbbell Press', nameAr: 'ضغط مستوي بالدمبلز', gifId: 'Dumbbell_Bench_Press',
        primary: ['Chest', 'Triceps'], primaryAr: ['الصدر', 'التراي'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Lie flat, dumbbells at chest', 'Press up, slight arc inward', 'Lock out above chest', 'Lower with control to stretch', 'Keep shoulder blades retracted'],
        stepsAr: ['استلقِ مسطحاً، الدمبلز عند الصدر', 'ادفع للأعلى مع قوس خفيف', 'أقفل فوق الصدر', 'أنزل بتحكم للتمدد', 'حافظ على سحب الكتفين'],
        tips: ['Squeeze at the top', 'Control the negative'],
        tipsAr: ['اضغط في القمة', 'تحكم في النزول'],
        mistakes: ['Elbows flared 90°', 'Bouncing at bottom'],
        mistakesAr: ['فتح المرفقين 90°', 'الارتداد في الأسفل'],
        equipment: 'Dumbbells + Flat Bench', equipmentAr: 'دمبلز + بنش مستوي',
    }),
    'Dumbbell Lateral Raises': ex({
        name: 'Dumbbell Lateral Raises', nameAr: 'رفع جانبي بالدمبلز', gifId: 'Side_Lateral_Raise',
        primary: ['Side Delts'], primaryAr: ['الدالية الجانبية'],
        secondary: ['Traps'], secondaryAr: ['الترابيز'],
        steps: ['Stand, dumbbells at sides', 'Slight elbow bend — keep fixed', 'Raise arms out to parallel with floor', 'Lead with elbows, not hands', 'Lower with control'],
        stepsAr: ['قف، الدمبلز بجانبيك', 'انحناء خفيف في المرفق — ثابت', 'ارفع الذراعين للجانبين حتى يوازيا الأرض', 'قُد بالمرفق لا اليد', 'أنزل بتحكم'],
        tips: ['Light weight — no ego lifting', 'Think "pour water from pitchers"'],
        tipsAr: ['وزن خفيف — لا تغر بالوزن', 'فكر كأنك تسكب ماء'],
        mistakes: ['Too much momentum', 'Shrugging traps'],
        mistakesAr: ['زخم كثير', 'رفع الترابيز'],
        equipment: 'Dumbbells', equipmentAr: 'دمبلز',
    }),
    'Bent-Over Dumbbell Lateral Raise': ex({
        name: 'Bent-Over Dumbbell Lateral Raise', nameAr: 'رفع جانبي منحني', gifId: 'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench',
        primary: ['Rear Delts'], primaryAr: ['الدالية الخلفية'],
        secondary: ['Upper Back'], secondaryAr: ['أعلى الظهر'],
        steps: ['Hinge at hips, torso nearly parallel to floor', 'Dumbbells hanging, slight elbow bend', 'Raise arms out to the sides', 'Squeeze rear delts at the top', 'Lower with control'],
        stepsAr: ['انحنِ بالورك، الجذع شبه موازٍ للأرض', 'الدمبلز معلقان، انحناء خفيف', 'ارفع الذراعين للجانبين', 'اضغط الدالية الخلفية في القمة', 'أنزل بتحكم'],
        tips: ['Very light weight', 'Focus on rear delts, not traps'],
        tipsAr: ['وزن خفيف جداً', 'ركز على الدالية الخلفية لا الترابيز'],
        mistakes: ['Using momentum', 'Standing too upright'],
        mistakesAr: ['استخدام الزخم', 'الوقوف مستقيماً جداً'],
        equipment: 'Dumbbells', equipmentAr: 'دمبلز',
    }),
    'Seated Dumbbell Shoulder Press': ex({
        name: 'Seated Dumbbell Shoulder Press', nameAr: 'ضغط كتف جالس بالدمبلز', gifId: 'Dumbbell_Shoulder_Press',
        primary: ['Shoulders'], primaryAr: ['الأكتاف'],
        secondary: ['Triceps', 'Upper Chest'], secondaryAr: ['التراي', 'أعلى الصدر'],
        steps: ['Sit on upright bench, back supported', 'Dumbbells at shoulder height, palms forward', 'Press up and slightly in', 'Lock out overhead', 'Lower with control'],
        stepsAr: ['اجلس على بنش عمودي، الظهر مسنود', 'الدمبلز عند الكتف، الكفان للأمام', 'ادفع للأعلى وقليلاً للداخل', 'أقفل فوق الرأس', 'أنزل بتحكم'],
        tips: ['Don\'t let dumbbells drift forward', 'Keep core braced'],
        tipsAr: ['لا تدع الدمبلز تنحرف للأمام', 'حافظ على شد البطن'],
        mistakes: ['Arching back', 'Pressing behind head'],
        mistakesAr: ['تقوس الظهر', 'الدفع خلف الرأس'],
        equipment: 'Dumbbells + Upright Bench', equipmentAr: 'دمبلز + بنش عمودي',
    }),
    'Hammer Curls': ex({
        name: 'Hammer Curls', nameAr: 'هامر كيرل', gifId: 'Hammer_Curls',
        primary: ['Biceps', 'Brachialis'], primaryAr: ['البايسبس', 'العضد'],
        secondary: ['Forearms'], secondaryAr: ['الساعدين'],
        steps: ['Stand holding dumbbells, palms facing in', 'Keep elbows pinned at sides', 'Curl up without rotating wrists', 'Squeeze at the top', 'Lower with control'],
        stepsAr: ['قف مع الدمبلز، الكفان للداخل', 'ثبت المرفقين بجانبك', 'ارفع بدون تدوير الرسغ', 'اضغط في القمة', 'أنزل بتحكم'],
        tips: ['Neutral grip throughout', 'No swinging'],
        tipsAr: ['قبضة محايدة طوال الحركة', 'بدون تأرجح'],
        mistakes: ['Swinging the body', 'Moving elbows forward'],
        mistakesAr: ['تأرجح الجسم', 'تحريك المرفقين للأمام'],
        equipment: 'Dumbbells', equipmentAr: 'دمبلز',
    }),
    'Overhead Dumbbell Tricep Extension': ex({
        name: 'Overhead Dumbbell Tricep Extension', nameAr: 'تمديد تراي علوي بالدمبل', gifId: 'Seated_Triceps_Press',
        primary: ['Triceps'], primaryAr: ['التراي'],
        secondary: [], secondaryAr: [],
        steps: ['Hold one dumbbell overhead with both hands', 'Keep elbows close to head', 'Lower dumbbell behind head by bending elbows', 'Extend arms back up', 'Squeeze triceps at the top'],
        stepsAr: ['أمسك دمبل واحد فوق الرأس بكلا اليدين', 'ابقِ المرفقين قريبين من الرأس', 'أنزل الدمبل خلف الرأس بثني المرفقين', 'مد الذراعين للأعلى', 'اضغط التراي في القمة'],
        tips: ['Keep elbows stationary', 'Full range for stretch'],
        tipsAr: ['ثبت المرفقين', 'مدى كامل للتمدد'],
        mistakes: ['Flaring elbows', 'Partial ROM'],
        mistakesAr: ['فتح المرفقين', 'مدى جزئي'],
        equipment: 'Dumbbell', equipmentAr: 'دمبل',
    }),
    'Dumbbell Walking Lunge': ex({
        name: 'Dumbbell Walking Lunge', nameAr: 'لانج مشي بالدمبلز', gifId: 'Dumbbell_Lunges',
        primary: ['Quadriceps', 'Glutes'], primaryAr: ['الفخذ الأمامي', 'الأرداف'],
        secondary: ['Hamstrings', 'Core'], secondaryAr: ['الفخذ الخلفي', 'البطن'],
        steps: ['Hold dumbbells at sides', 'Step forward into a lunge', 'Lower back knee toward floor', 'Drive through front heel to step forward with other leg', 'Continue walking'],
        stepsAr: ['أمسك الدمبلز بجانبيك', 'اخطُ خطوة للأمام في لانج', 'أنزل الركبة الخلفية نحو الأرض', 'ادفع من كعب الأمامي للخطوة بالرجل الأخرى', 'استمر في المشي'],
        tips: ['Upright torso', 'Don\'t let front knee pass toes'],
        tipsAr: ['الجذع مستقيم', 'لا تدع الركبة الأمامية تتجاوز الأصابع'],
        mistakes: ['Short steps', 'Knee collapsing inward'],
        mistakesAr: ['خطوات قصيرة', 'انحراف الركبة للداخل'],
        equipment: 'Dumbbells', equipmentAr: 'دمبلز',
    }),
    'Chest-Supported Dumbbell Row': ex({
        name: 'Chest-Supported Dumbbell Row', nameAr: 'تجديف دمبلز بدعم الصدر', gifId: 'Seated_Bent-Over_Rear_Delt_Raise',
        primary: ['Upper Back', 'Lats'], primaryAr: ['أعلى الظهر', 'العضلة العريضة'],
        secondary: ['Rear Delts', 'Biceps'], secondaryAr: ['الدالية الخلفية', 'البايسبس'],
        steps: ['Lie chest-down on incline bench', 'Hold dumbbells with arms hanging', 'Row dumbbells up to sides of chest', 'Squeeze shoulder blades together', 'Lower with control'],
        stepsAr: ['استلقِ على بنش مائل بصدرك', 'أمسك الدمبلز والذراعان معلقان', 'اسحب الدمبلز لجانبي الصدر', 'اضغط لوحي الكتف', 'أنزل بتحكم'],
        tips: ['Chest stays pressed to bench', 'Control, no momentum'],
        tipsAr: ['الصدر ملتصق بالبنش', 'تحكم، بدون زخم'],
        mistakes: ['Lifting chest off bench', 'Using momentum'],
        mistakesAr: ['رفع الصدر عن البنش', 'استخدام الزخم'],
        equipment: 'Dumbbells + Incline Bench', equipmentAr: 'دمبلز + بنش مائل',
    }),

    // ═══ CABLE EXERCISES ═════════════════════════════════════════════
    'Cable Tricep Pushdown': ex({
        name: 'Cable Tricep Pushdown', nameAr: 'بوش داون تراي كيبل', gifId: 'Triceps_Pushdown',
        primary: ['Triceps'], primaryAr: ['التراي'],
        secondary: ['Forearms'], secondaryAr: ['الساعدين'],
        steps: ['Face cable machine with straight bar or rope', 'Pin elbows at sides', 'Push down to full extension', 'Squeeze triceps at bottom', 'Return with control'],
        stepsAr: ['قف أمام الكيبل مع بار أو حبل', 'ثبت المرفقين بجانبك', 'ادفع للأسفل حتى المد الكامل', 'اضغط التراي في الأسفل', 'ارجع بتحكم'],
        tips: ['Elbows locked at sides', 'No leaning forward'],
        tipsAr: ['ثبت المرفقين', 'لا تميل للأمام'],
        mistakes: ['Moving elbows', 'Using body momentum'],
        mistakesAr: ['تحريك المرفقين', 'زخم الجسم'],
        equipment: 'Cable Machine + Attachment', equipmentAr: 'كيبل + مقبض',
    }),
    'Cable Chest Fly': ex({
        name: 'Cable Chest Fly', nameAr: 'فلاي صدر بالكيبل', gifId: 'Cable_Crossover',
        primary: ['Chest'], primaryAr: ['الصدر'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Set pulleys at shoulder height, hold handles', 'Step forward, slight elbow bend', 'Bring hands together in front of chest', 'Squeeze chest at the middle', 'Return with control, feel stretch'],
        stepsAr: ['اضبط البكرات على ارتفاع الكتف، امسك المقابض', 'اخطُ للأمام، انحناء خفيف في المرفق', 'اجمع اليدين أمام الصدر', 'اضغط الصدر في المنتصف', 'ارجع بتحكم، اشعر بالتمدد'],
        tips: ['Slight elbow bend fixed throughout', 'Feel stretch at the outside'],
        tipsAr: ['انحناء مرفق ثابت', 'اشعر بالتمدد للخارج'],
        mistakes: ['Bending arms too much (turns into press)', 'Using too much weight'],
        mistakesAr: ['ثني الذراعين كثيراً (يتحول لضغط)', 'وزن مفرط'],
        equipment: 'Cable Crossover Station', equipmentAr: 'كيبل كروس أوفر',
    }),
    'Seated Cable Row': ex({
        name: 'Seated Cable Row', nameAr: 'تجديف كيبل جالس', gifId: 'Seated_Cable_Rows',
        primary: ['Upper Back', 'Lats'], primaryAr: ['أعلى الظهر', 'العضلة العريضة'],
        secondary: ['Biceps', 'Rear Delts'], secondaryAr: ['البايسبس', 'الدالية الخلفية'],
        steps: ['Sit at cable row, feet on platform', 'Grip V-handle, slight forward lean at stretch', 'Pull handle to lower abs', 'Squeeze shoulder blades together', 'Return with control, keep chest up'],
        stepsAr: ['اجلس عند جهاز التجديف، القدمان على المنصة', 'امسك المقبض، ميل خفيف للأمام في التمدد', 'اسحب المقبض لأسفل البطن', 'اضغط لوحي الكتف', 'ارجع بتحكم، الصدر مرفوع'],
        tips: ['Don\'t lean back too far', 'Drive elbows back, not up'],
        tipsAr: ['لا تميل للخلف كثيراً', 'ادفع المرفقين للخلف ليس للأعلى'],
        mistakes: ['Rocking torso', 'Rounding lower back'],
        mistakesAr: ['تأرجح الجذع', 'تقوس أسفل الظهر'],
        equipment: 'Cable Row Machine', equipmentAr: 'جهاز تجديف كيبل',
    }),
    'Wide Grip Lat Pulldown': ex({
        name: 'Wide Grip Lat Pulldown', nameAr: 'سحب أمامي قبضة واسعة', gifId: 'Wide-Grip_Lat_Pulldown',
        primary: ['Lats', 'Upper Back'], primaryAr: ['العضلة العريضة', 'أعلى الظهر'],
        secondary: ['Biceps', 'Rear Delts'], secondaryAr: ['البايسبس', 'الدالية الخلفية'],
        steps: ['Sit at lat pulldown, thighs secured', 'Grip bar wider than shoulders, palms forward', 'Lean back slightly, chest up', 'Pull bar to upper chest', 'Squeeze lats, return with control'],
        stepsAr: ['اجلس عند جهاز السحب، الفخذان مثبتان', 'قبضة أوسع من الأكتاف، الكفان للأمام', 'ميل خفيف للخلف، الصدر مرفوع', 'اسحب البار لأعلى الصدر', 'اضغط العضلة العريضة، ارجع بتحكم'],
        tips: ['Lead with elbows down', 'Feel lats working, not biceps'],
        tipsAr: ['قُد بالمرفقين للأسفل', 'اشعر بالعضلة العريضة لا البايسبس'],
        mistakes: ['Leaning back too far', 'Pulling behind the neck'],
        mistakesAr: ['ميل مفرط للخلف', 'السحب خلف الرقبة'],
        equipment: 'Lat Pulldown Machine', equipmentAr: 'جهاز السحب الأمامي',
    }),

    // ═══ MACHINES ════════════════════════════════════════════════════
    'Leg Press': ex({
        name: 'Leg Press', nameAr: 'ليج بريس', gifId: 'Leg_Press',
        primary: ['Quadriceps', 'Glutes'], primaryAr: ['الفخذ الأمامي', 'الأرداف'],
        secondary: ['Hamstrings'], secondaryAr: ['الفخذ الخلفي'],
        steps: ['Sit, back flat against pad', 'Feet shoulder-width on platform', 'Release safety handles', 'Lower platform to ~90° knees', 'Push through heels to extend', 'Don\'t fully lock knees'],
        stepsAr: ['اجلس، الظهر على الوسادة', 'قدمان بعرض الأكتاف على المنصة', 'حرر المقابض', 'أنزل حتى 90° في الركبة', 'ادفع من الكعبين للمد', 'لا تقفل الركبتين بالكامل'],
        tips: ['Higher feet = more glutes/hams', 'Lower feet = more quads'],
        tipsAr: ['القدم أعلى = أرداف وفخذ خلفي', 'القدم أسفل = فخذ أمامي'],
        mistakes: ['Lower back rounding', 'Going too deep'],
        mistakesAr: ['تقوس أسفل الظهر', 'النزول عميقاً'],
        equipment: 'Leg Press Machine', equipmentAr: 'جهاز ليج بريس',
    }),
    'Hack Squat Machine': ex({
        name: 'Hack Squat Machine', nameAr: 'هاك سكوات', gifId: 'Hack_Squat',
        primary: ['Quadriceps'], primaryAr: ['الفخذ الأمامي'],
        secondary: ['Glutes', 'Hamstrings'], secondaryAr: ['الأرداف', 'الفخذ الخلفي'],
        steps: ['Step in, shoulders on pads', 'Feet shoulder-width on platform', 'Release safety handles', 'Lower until thighs at least parallel', 'Drive up through heels'],
        stepsAr: ['ادخل، الأكتاف على الوسائد', 'القدمان بعرض الأكتاف', 'حرر المقابض', 'أنزل حتى يوازي الفخذ الأرض', 'ادفع من الكعبين'],
        tips: ['Back flat on pad', 'Control the descent'],
        tipsAr: ['الظهر على الوسادة', 'تحكم في النزول'],
        mistakes: ['Knees caving', 'Rising on toes'],
        mistakesAr: ['انحراف الركبتين', 'الارتفاع على الأصابع'],
        equipment: 'Hack Squat Machine', equipmentAr: 'جهاز هاك سكوات',
    }),
    'Leg Extension': ex({
        name: 'Leg Extension', nameAr: 'تمديد الفخذ', gifId: 'Leg_Extensions',
        primary: ['Quadriceps'], primaryAr: ['الفخذ الأمامي'],
        secondary: [], secondaryAr: [],
        steps: ['Sit in machine, pad on top of ankles', 'Grip handles, back against pad', 'Extend legs until straight', 'Squeeze quads at the top', 'Lower with control'],
        stepsAr: ['اجلس في الجهاز، الوسادة فوق الكاحلين', 'امسك المقابض، الظهر على الوسادة', 'مد الساقين حتى الاستقامة', 'اضغط الفخذ في القمة', 'أنزل بتحكم'],
        tips: ['Pause at the top', 'Control the negative'],
        tipsAr: ['توقف في القمة', 'تحكم في النزول'],
        mistakes: ['Swinging weight', 'Partial ROM'],
        mistakesAr: ['تأرجح الوزن', 'مدى جزئي'],
        equipment: 'Leg Extension Machine', equipmentAr: 'جهاز تمديد الفخذ',
    }),
    'Leg Curl': ex({
        name: 'Leg Curl', nameAr: 'ليج كيرل', gifId: 'Lying_Leg_Curls',
        primary: ['Hamstrings'], primaryAr: ['الفخذ الخلفي'],
        secondary: ['Calves'], secondaryAr: ['السمانة'],
        steps: ['Lie face-down (or sit), pad above heels', 'Grip handles, body flat', 'Curl legs up, bringing heels to glutes', 'Squeeze hamstrings at top', 'Lower with control'],
        stepsAr: ['استلقِ على البطن (أو اجلس)، الوسادة فوق الكعب', 'امسك المقابض، الجسم مسطح', 'اثنِ الساقين، الكعبان للأرداف', 'اضغط الفخذ الخلفي في القمة', 'أنزل بتحكم'],
        tips: ['Don\'t lift hips', 'Full contraction at top'],
        tipsAr: ['لا ترفع الوركين', 'انقباض كامل في القمة'],
        mistakes: ['Lifting hips off pad', 'Using momentum'],
        mistakesAr: ['رفع الورك', 'استخدام الزخم'],
        equipment: 'Leg Curl Machine', equipmentAr: 'جهاز ليج كيرل',
    }),
    'Standing Calf Raise': ex({
        name: 'Standing Calf Raise', nameAr: 'سمانة واقف', gifId: 'Standing_Calf_Raises',
        primary: ['Calves'], primaryAr: ['السمانة'],
        secondary: [], secondaryAr: [],
        steps: ['Stand on calf raise machine or platform', 'Balls of feet on edge, heels hanging', 'Drop heels for full stretch', 'Rise onto toes as high as possible', 'Squeeze and lower with control'],
        stepsAr: ['قف على جهاز أو منصة', 'أمشاط القدم على الحافة، الكعبان معلقان', 'أنزل الكعبين للتمدد الكامل', 'ارتفع على الأصابع قدر الإمكان', 'اضغط وأنزل بتحكم'],
        tips: ['Full stretch and full contraction', 'Slow tempo works best'],
        tipsAr: ['تمدد كامل وانقباض كامل', 'بطء الحركة أفضل'],
        mistakes: ['Partial ROM', 'Bouncing'],
        mistakesAr: ['مدى جزئي', 'الارتداد'],
        equipment: 'Calf Raise Machine', equipmentAr: 'جهاز السمانة',
    }),
    'Pec Deck Fly': ex({
        name: 'Pec Deck Fly', nameAr: 'بيك داك فلاي', gifId: 'Butterfly',
        primary: ['Chest'], primaryAr: ['الصدر'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Sit, back flat, grip handles', 'Arms bent to match pads', 'Squeeze pads together in front of chest', 'Pause, squeeze chest', 'Return with control'],
        stepsAr: ['اجلس، الظهر على الوسادة، امسك المقابض', 'الذراعان منحنيان لتطابقا الوسائد', 'اضغط الوسائد معاً أمام الصدر', 'توقف، اضغط الصدر', 'ارجع بتحكم'],
        tips: ['Squeeze hard at the middle', 'Feel chest not shoulders'],
        tipsAr: ['اضغط بقوة في المنتصف', 'اشعر بالصدر لا الأكتاف'],
        mistakes: ['Too much weight', 'Short ROM'],
        mistakesAr: ['وزن مفرط', 'مدى قصير'],
        equipment: 'Pec Deck Machine', equipmentAr: 'جهاز بيك داك',
    }),
    'Reverse Pec Deck (Rear Delt)': ex({
        name: 'Reverse Pec Deck (Rear Delt)', nameAr: 'بيك داك عكسي (دالية خلفية)', gifId: 'Reverse_Flyes',
        primary: ['Rear Delts'], primaryAr: ['الدالية الخلفية'],
        secondary: ['Upper Back'], secondaryAr: ['أعلى الظهر'],
        steps: ['Sit facing the pad, grip handles', 'Arms forward at shoulder height', 'Pull handles out and back', 'Squeeze rear delts at the end', 'Return with control'],
        stepsAr: ['اجلس مواجهاً الوسادة، امسك المقابض', 'الذراعان للأمام على ارتفاع الكتف', 'اسحب للخارج والخلف', 'اضغط الدالية الخلفية في النهاية', 'ارجع بتحكم'],
        tips: ['Lead with elbows, not hands', 'Light weight, strict form'],
        tipsAr: ['قُد بالمرفقين لا اليدين', 'وزن خفيف، أداء صارم'],
        mistakes: ['Using biceps to pull', 'Rocking body'],
        mistakesAr: ['استخدام البايسبس', 'تأرجح الجسم'],
        equipment: 'Reverse Pec Deck', equipmentAr: 'جهاز بيك داك عكسي',
    }),
    'Incline Hammer Strength Press': ex({
        name: 'Incline Hammer Strength Press', nameAr: 'ضغط مائل هامر سترينغث', gifId: 'Machine_Bench_Press',
        primary: ['Upper Chest', 'Triceps'], primaryAr: ['أعلى الصدر', 'التراي'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Adjust seat so handles align with upper chest', 'Grip handles, back on pad', 'Press handles forward and slightly up', 'Lock out, squeeze chest', 'Return with control'],
        stepsAr: ['اضبط المقعد لمحاذاة المقابض مع أعلى الصدر', 'امسك المقابض، الظهر على الوسادة', 'ادفع للأمام وقليلاً للأعلى', 'أقفل، اضغط الصدر', 'ارجع بتحكم'],
        tips: ['Keep back on pad', 'Unilateral reps also work well'],
        tipsAr: ['الظهر على الوسادة', 'العمل المنفرد فعّال أيضاً'],
        mistakes: ['Arching off pad', 'Short ROM'],
        mistakesAr: ['تقوس بعيداً عن الوسادة', 'مدى قصير'],
        equipment: 'Hammer Strength Incline Press', equipmentAr: 'هامر سترينغث مائل',
    }),

    // ═══ BODYWEIGHT / EZ-BAR / OTHER ═════════════════════════════════
    'Parallel Bar Dips': ex({
        name: 'Parallel Bar Dips', nameAr: 'ديبس على البار المتوازي', gifId: 'Dips_-_Chest_Version',
        primary: ['Chest', 'Triceps'], primaryAr: ['الصدر', 'التراي'],
        secondary: ['Front Delts'], secondaryAr: ['الدالية الأمامية'],
        steps: ['Grip parallel bars, support body with arms straight', 'Lean slightly forward for chest focus (upright for triceps)', 'Lower body until shoulders below elbows', 'Push up to starting position', 'Lock out at top'],
        stepsAr: ['امسك البارين، الجسم مدعوم والذراعان مستقيمان', 'مل قليلاً للأمام للصدر (مستقيم للتراي)', 'أنزل حتى تصبح الأكتاف تحت المرفقين', 'ادفع للوضع الابتدائي', 'أقفل في القمة'],
        tips: ['Control descent', 'Add weight only when bodyweight is easy'],
        tipsAr: ['تحكم في النزول', 'أضف وزناً فقط عندما يسهل وزن الجسم'],
        mistakes: ['Partial range', 'Shrugging shoulders'],
        mistakesAr: ['مدى جزئي', 'رفع الأكتاف'],
        equipment: 'Parallel Bars (Dip Station)', equipmentAr: 'بار متوازي',
    }),
    'EZ Bar Bicep Curl': ex({
        name: 'EZ Bar Bicep Curl', nameAr: 'كيرل بار زجزاج', gifId: 'EZ-Bar_Curl',
        primary: ['Biceps'], primaryAr: ['البايسبس'],
        secondary: ['Forearms'], secondaryAr: ['الساعدين'],
        steps: ['Feet shoulder-width, arms extended', 'Elbows pinned at sides', 'Curl bar up to shoulder level', 'Squeeze biceps at top', 'Lower with full extension'],
        stepsAr: ['قدمان بعرض الأكتاف، الذراعان ممدودان', 'ثبت المرفقين', 'ارفع البار لمستوى الكتف', 'اضغط البايسبس في القمة', 'أنزل بمد كامل'],
        tips: ['No swinging', 'Full range of motion'],
        tipsAr: ['بدون تأرجح', 'مدى حركي كامل'],
        mistakes: ['Swinging body', 'Partial ROM'],
        mistakesAr: ['تأرجح الجسم', 'مدى جزئي'],
        equipment: 'EZ Bar', equipmentAr: 'بار زجزاج',
    }),
    'Pull-Ups': ex({
        name: 'Pull-Ups', nameAr: 'بول أب', gifId: 'Pullups',
        primary: ['Lats', 'Upper Back'], primaryAr: ['العضلة العريضة', 'أعلى الظهر'],
        secondary: ['Biceps', 'Core'], secondaryAr: ['البايسبس', 'البطن'],
        steps: ['Grip bar slightly wider than shoulders, palms forward', 'Hang with arms fully extended', 'Pull body up until chin over bar', 'Squeeze back at top', 'Lower with control'],
        stepsAr: ['قبضة أوسع قليلاً من الأكتاف، الكفان للأمام', 'تعلق والذراعان ممدودان', 'اسحب الجسم حتى تكون الذقن فوق البار', 'اضغط الظهر في القمة', 'أنزل بتحكم'],
        tips: ['Start from dead hang', 'Use assistance if needed'],
        tipsAr: ['ابدأ من تعليق كامل', 'استخدم دعماً إذا لزم'],
        mistakes: ['Kipping', 'Partial ROM'],
        mistakesAr: ['التأرجح', 'مدى جزئي'],
        equipment: 'Pull-Up Bar', equipmentAr: 'بار التعليق',
    }),
    'Hanging Leg Raise': ex({
        name: 'Hanging Leg Raise', nameAr: 'رفع الأرجل معلقاً', gifId: 'Hanging_Leg_Raise',
        primary: ['Abs', 'Hip Flexors'], primaryAr: ['البطن', 'عضلات الورك'],
        secondary: ['Forearms'], secondaryAr: ['الساعدين'],
        steps: ['Hang from bar, arms straight', 'Brace core, legs straight or slightly bent', 'Raise legs until parallel to floor (or higher)', 'Hold briefly at top', 'Lower with control — no swinging'],
        stepsAr: ['تعلق من البار، الذراعان مستقيمان', 'شد البطن، الساقان مستقيمتان أو منحنيتان قليلاً', 'ارفع الساقين حتى توازيا الأرض (أو أعلى)', 'اثبت لحظة في القمة', 'أنزل بتحكم — بدون تأرجح'],
        tips: ['Control is key', 'Exhale as you lift'],
        tipsAr: ['التحكم هو الأساس', 'أخرج الزفير مع الرفع'],
        mistakes: ['Swinging', 'Using momentum'],
        mistakesAr: ['التأرجح', 'استخدام الزخم'],
        equipment: 'Pull-Up Bar', equipmentAr: 'بار التعليق',
    }),
    'Plank': ex({
        name: 'Plank', nameAr: 'بلانك', gifId: 'Plank',
        primary: ['Core'], primaryAr: ['البطن'],
        secondary: ['Shoulders', 'Glutes'], secondaryAr: ['الأكتاف', 'الأرداف'],
        steps: ['Forearms on floor, elbows under shoulders', 'Body in a straight line, toes on ground', 'Brace core, squeeze glutes', 'Hold position — don\'t sag', 'Breathe normally'],
        stepsAr: ['الساعدان على الأرض، المرفقان تحت الأكتاف', 'الجسم في خط مستقيم، الأصابع على الأرض', 'شد البطن، اضغط الأرداف', 'اثبت — لا تترهل', 'تنفس طبيعياً'],
        tips: ['Quality over duration', 'Squeeze glutes to protect lower back'],
        tipsAr: ['الجودة قبل المدة', 'اضغط الأرداف لحماية الظهر'],
        mistakes: ['Hips sagging', 'Butt too high'],
        mistakesAr: ['هبوط الوركين', 'رفع المؤخرة كثيراً'],
        equipment: 'Bodyweight', equipmentAr: 'وزن الجسم',
    }),

    // ═══ CARDIO PROTOCOLS (type: 'cardio_protocol') ══════════════════
    'Treadmill HIIT': cardio('Treadmill HIIT', 'هيت على الجري الكهربائي', 'Treadmill', 'جري كهربائي',
        'High-intensity intervals: sprint 30 sec at 80–90% effort, walk/jog 60–90 sec. Repeat for 15–20 min total.',
        'فترات مكثفة: جري 30 ث بـ80-90% مجهود، مشي/هرولة 60-90 ث. كرر لـ15-20 دقيقة.'),
    'Bike HIIT Intervals': cardio('Bike HIIT Intervals', 'هيت على الدراجة', 'Stationary Bike', 'دراجة ثابتة',
        'Sprint 20–30 sec all-out, recover 60–90 sec at easy pace. Complete 8–12 rounds.',
        'اندفاع 20-30 ث بأقصى جهد، تعافٍ 60-90 ث بسرعة سهلة. أكمل 8-12 جولة.'),
    'Stairmaster': cardio('Stairmaster', 'ستيرماستر', 'Stairmaster Machine', 'جهاز الدرج',
        'Moderate steady pace for 15–25 min, or use interval settings. Focus on posture — don\'t lean on handles.',
        'وتيرة ثابتة معتدلة 15-25 د، أو استخدم الفترات. ركز على القوام — لا تتكئ على المقابض.'),
    'Zone 2 Steady State Cardio': cardio('Zone 2 Steady State Cardio', 'كارديو منطقة 2 ثابتة', 'Any Cardio Equipment', 'أي جهاز كارديو',
        'Conversational pace: 60–70% max HR for 30–45 min. You can talk in full sentences but not sing.',
        'وتيرة يمكنك التحدث فيها: 60-70% من أقصى نبض لـ30-45 د. يمكنك التحدث بجمل كاملة لكن ليس الغناء.'),
    'Moderate Steady State Cardio': cardio('Moderate Steady State Cardio', 'كارديو معتدل ثابت', 'Any Cardio Equipment', 'أي جهاز كارديو',
        'Sustained moderate effort at 65–75% max HR for 20–30 min.',
        'جهد معتدل مستمر 65-75% من أقصى نبض لـ20-30 د.'),
    'Low Intensity Steady State Cardio': cardio('Low Intensity Steady State Cardio', 'كارديو منخفض الشدة', 'Any Cardio Equipment', 'أي جهاز كارديو',
        'Easy pace, 55–65% max HR for 30–60 min. Recovery-focused cardio.',
        'وتيرة سهلة، 55-65% من أقصى نبض لـ30-60 د. كارديو للاستشفاء.'),
    'Zone 2-3 Sustained Cardio': cardio('Zone 2-3 Sustained Cardio', 'كارديو منطقة 2-3 مستمر', 'Any Cardio Equipment', 'أي جهاز كارديو',
        'Moderate to moderately-high effort: 65–80% max HR for 25–40 min.',
        'جهد معتدل لعالٍ نسبياً: 65-80% من أقصى نبض لـ25-40 د.'),
    'Rowing Machine Cardio': cardio('Rowing Machine Cardio', 'كارديو جهاز التجديف', 'Rowing Machine', 'جهاز التجديف',
        '500m intervals at moderate pace with 1 min rest, or steady row 15–20 min. Drive with legs first, then pull.',
        'فترات 500م بوتيرة معتدلة مع راحة دقيقة، أو تجديف ثابت 15-20 د. ادفع بالساقين أولاً، ثم اسحب.'),
    'Jump Rope': cardio('Jump Rope', 'حبل القفز', 'Jump Rope', 'حبل القفز',
        '60 sec on / 30 sec rest, 8–12 rounds. Mix basic bounces, high knees, and double-unders.',
        '60 ث عمل / 30 ث راحة، 8-12 جولة. امزج قفزات أساسية، ركبتين عالية، ودبل أندر.'),
    'Battle Ropes': cardio('Battle Ropes', 'حبال القتال', 'Battle Ropes', 'حبال ثقيلة',
        '30 sec work / 30 sec rest, 8–10 rounds. Alternate waves, slams, and circles.',
        '30 ث عمل / 30 ث راحة، 8-10 جولات. بدّل بين موجات وضربات ودوائر.'),
    'Sprint Intervals': cardio('Sprint Intervals', 'فترات العدو', 'Track / Open Space / Treadmill', 'مضمار / مساحة مفتوحة / جري كهربائي',
        'All-out sprints 15–30 sec, full recovery 90–120 sec between. 6–10 total sprints.',
        'اندفاعات قصوى 15-30 ث، تعافٍ كامل 90-120 ث بينها. 6-10 اندفاعات.'),
    'Core Circuit (Plank / Crunch / Leg Raise)': cardio('Core Circuit (Plank / Crunch / Leg Raise)', 'دائرة بطن (بلانك/كرانش/رفع أرجل)', 'Mat', 'سجادة',
        '3 rounds: 45s plank + 15 crunches + 12 leg raises. Rest 60s between rounds.',
        '3 جولات: 45ث بلانك + 15 كرانش + 12 رفع أرجل. راحة 60ث بين الجولات.'),
    'Core Circuit (Ab Wheel / Decline Crunch)': cardio('Core Circuit (Ab Wheel / Decline Crunch)', 'دائرة بطن (عجلة/كرانش مائل)', 'Ab Wheel + Decline Bench', 'عجلة بطن + بنش مائل',
        '3 rounds: 10 ab wheel rollouts + 15 decline crunches. Rest 60s between rounds.',
        '3 جولات: 10 عجلة بطن + 15 كرانش مائل. راحة 60ث بين الجولات.'),
    'Low Intensity Cardio Warm-Up': cardio('Low Intensity Cardio Warm-Up', 'إحماء كارديو خفيف', 'Any Cardio Equipment', 'أي جهاز كارديو',
        '5–10 min easy pace to elevate heart rate before lifting. 50–60% max HR.',
        '5-10 د بوتيرة سهلة لرفع النبض قبل الرفع. 50-60% من أقصى نبض.'),

    'Decline Dumbbell Press': ex({
        name: 'Decline Dumbbell Press', nameAr: 'ضغط دمبلز مائل للأسفل', gifId: 'Dumbbell_Decline_Bench_Press',
        primary: ['Chest'], primaryAr: ['الصدر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Push-Up': ex({
        name: 'Push-Up', nameAr: 'ضغط بوش أب', gifId: 'Push-Up',
        primary: ['Chest'], primaryAr: ['الصدر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Barbell Upright Row': ex({
        name: 'Barbell Upright Row', nameAr: 'سحب عمودي بالبار', gifId: 'Upright_Barbell_Row',
        primary: ['Shoulders'], primaryAr: ['الأكتاف'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Cable Face Pull': ex({
        name: 'Cable Face Pull', nameAr: 'سحب وجه بالكيبل', gifId: 'Face_Pull',
        primary: ['Rear Delts'], primaryAr: ['الدالية الخلفية'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Barbell Preacher Curl': ex({
        name: 'Barbell Preacher Curl', nameAr: 'كيرل بايسبس على الحصان', gifId: 'Z_Bar_Preacher_Curl',
        primary: ['Biceps'], primaryAr: ['البايسبس'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Dumbbell Concentration Curl': ex({
        name: 'Dumbbell Concentration Curl', nameAr: 'كيرل بايسبس تركيز بالدمبل', gifId: 'Concentration_Curls',
        primary: ['Biceps'], primaryAr: ['البايسبس'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Cable Reverse Curl': ex({
        name: 'Cable Reverse Curl', nameAr: 'كيرل عكسي بالكيبل', gifId: 'Cable_Reverse_Curl',
        primary: ['Forearms'], primaryAr: ['الساعدين'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Flat Chest Press Machine': ex({
        name: 'Flat Chest Press Machine', nameAr: 'جهاز ضغط صدر مستوي', gifId: 'Machine_Bench_Press',
        primary: ['Chest'], primaryAr: ['الصدر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Hip Adductor Machine': ex({
        name: 'Hip Adductor Machine', nameAr: 'جهاز ضم الفخذين', gifId: 'Lever_Seated_Hip_Adduction',
        primary: ['Adductors'], primaryAr: ['الضامة'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Dumbbell Pullover': ex({
        name: 'Dumbbell Pullover', nameAr: 'بولوفر دمبل', gifId: 'Straight-Arm_Dumbbell_Pullover',
        primary: ['Chest'], primaryAr: ['الصدر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Dumbbell Chest Fly': ex({
        name: 'Dumbbell Chest Fly', nameAr: 'التفتيح بالدمبلز للصدر', gifId: 'Dumbbell_Flyes',
        primary: ['Chest'], primaryAr: ['الصدر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Barbell Good Morning': ex({
        name: 'Barbell Good Morning', nameAr: 'تمرين صباح الخير بالبار', gifId: 'Good_Morning',
        primary: ['Lower Back'], primaryAr: ['أسفل الظهر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Nordic Hamstring Curl': ex({
        name: 'Nordic Hamstring Curl', nameAr: 'كيرل فخذ خلفي نورديك', gifId: 'Lying_Leg_Curls',
        primary: ['Hamstrings'], primaryAr: ['الفخذ الخلفي'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Kettlebell Swing': ex({
        name: 'Kettlebell Swing', nameAr: 'أرجحة الكيتل بيل', gifId: 'Kettlebell_Swing',
        primary: ['Glutes'], primaryAr: ['الأرداف'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Goblet Squat': ex({
        name: 'Goblet Squat', nameAr: 'سكوات جوبلت', gifId: 'Goblet_Squat',
        primary: ['Quadriceps'], primaryAr: ['الفخذ الأمامي'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Barbell Hip Thrust': ex({
        name: 'Barbell Hip Thrust', nameAr: 'رفع حوض بالبار', gifId: 'Barbell_Hip_Thrust',
        primary: ['Glutes'], primaryAr: ['الأرداف'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Barbell Power Clean': ex({
        name: 'Barbell Power Clean', nameAr: 'باور كلين بالبار', gifId: 'Power_Clean',
        primary: ['Full Body'], primaryAr: ['الجسم كامل'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Farmers Walk': ex({
        name: 'Farmers Walk', nameAr: 'مشي المزارع', gifId: 'Farmers_Walk',
        primary: ['Full Body'], primaryAr: ['الجسم كامل'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Box Step-Up': ex({
        name: 'Box Step-Up', nameAr: 'صعود الصندوق', gifId: 'Dumbbell_Step_ups',
        primary: ['Quadriceps'], primaryAr: ['الفخذ الأمامي'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Cable Pullover': ex({
        name: 'Cable Pullover', nameAr: 'بولوفر كيبل', gifId: 'Cable_Pullover',
        primary: ['Lats'], primaryAr: ['المجنص'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Dumbbell Tricep Kickback': ex({
        name: 'Dumbbell Tricep Kickback', nameAr: 'كيك باك تراي دمبل', gifId: 'Tricep_Dumbbell_Kickback',
        primary: ['Triceps'], primaryAr: ['التراي'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Seated Calf Raise': ex({
        name: 'Seated Calf Raise', nameAr: 'سمانة جالس', gifId: 'Seated_Calf_Raise',
        primary: ['Calves'], primaryAr: ['السمانة'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Hyperextensions': ex({
        name: 'Hyperextensions', nameAr: 'تمديد الظهر', gifId: 'Hyperextensions',
        primary: ['Lower Back'], primaryAr: ['أسفل الظهر'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Band Pull-Apart': ex({
        name: 'Band Pull-Apart', nameAr: 'باند بول أبارت', gifId: 'Band_Pull_Apart',
        primary: ['Rear Delts'], primaryAr: ['الدالية الخلفية'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Sumo Deadlift': ex({
        name: 'Sumo Deadlift', nameAr: 'ديدلفت سومو', gifId: 'Sumo_Deadlift',
        primary: ['Glutes'], primaryAr: ['الأرداف'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Hex Bar Deadlift': ex({
        name: 'Hex Bar Deadlift', nameAr: 'ديدلفت بالهيكس بار', gifId: 'Trap_Bar_Deadlift',
        primary: ['Hamstrings'], primaryAr: ['الفخذ الخلفي'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Bulgarian Split Squat': ex({
        name: 'Bulgarian Split Squat', nameAr: 'سكوات بلغاري', gifId: 'Bulgarian_Split_Squat',
        primary: ['Quadriceps'], primaryAr: ['الفخذ الأمامي'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Arnold Press': ex({
        name: 'Arnold Press', nameAr: 'ضغط أرنولد', gifId: 'Arnold_Dumbbell_Press',
        primary: ['Shoulders'], primaryAr: ['الأكتاف'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Cable Crunch': ex({
        name: 'Cable Crunch', nameAr: 'كابل كرانش للبطن', gifId: 'Cable_Crunch',
        primary: ['Core'], primaryAr: ['البطن'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Reverse Crunch': ex({
        name: 'Reverse Crunch', nameAr: 'كرانش عكسي', gifId: 'Reverse_Crunch',
        primary: ['Core'], primaryAr: ['البطن'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Bicycle Crunch': ex({
        name: 'Bicycle Crunch', nameAr: 'دراجه هوائية للبطن', gifId: 'Air_Bikes',
        primary: ['Core'], primaryAr: ['البطن'],
        steps: ['Assume starting position', 'Perform the movement with control', 'Maintain correct form', 'Repeat for desired reps'],
        stepsAr: ['اتخذ وضع البداية', 'قم بالحركة بتحكم', 'حافظ على الشكل الصحيح', 'كرر التكرارات المطلوبة'],
        tips: ['Focus on mind-muscle connection', 'Control the negative'],
        tipsAr: ['ركز على الارتباط العضلي الذهني', 'تحكم في الحركة السلبية'],
        mistakes: ['Using too much weight', 'Poor form'],
        mistakesAr: ['استخدام وزن مفرط', 'شكل سيء'],
        equipment: 'Standard', equipmentAr: 'قياسي',
    }),
    'Treadmill Incline Walk': cardio('Treadmill Incline Walk', 'مشي مائل على السير', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'High Knees': cardio('High Knees', 'ركبتين عاليا', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Skater Jumps': cardio('Skater Jumps', 'قفزات المتزلج', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Wall Sit': cardio('Wall Sit', 'جلوس الحائط', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Sled Push': cardio('Sled Push', 'دفع المزلقة', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Foam Rolling': cardio('Foam Rolling', 'رول فوم', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Burpees': cardio('Burpees', 'بيربي', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Mountain Climbers': cardio('Mountain Climbers', 'متسلق الجبال', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Jump Squat': cardio('Jump Squat', 'قفز سكوات', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Thrusters': cardio('Thrusters', 'ثراسترز', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
    'Box Jumps': cardio('Box Jumps', 'قفز الصندوق', 'Cardio Equipment', 'جهاز كارديو', 'Follow the intensity protocol described in the workout.', 'اتبع بروتوكول الشدة الموضح في التدريب.'),
};

    // ── Aliases: common name variations mapped to canonical entries ─────
const ALIASES: Record<string, string> = {
    'decline dumbbell press': 'Decline Dumbbell Press',
    'push-ups': 'Push-Up',
    'push-up': 'Push-Up',
    'push-ups max': 'Push-Up',
    'max effort push-up set': 'Push-Up',
    'push-up timed': 'Push-Up',
    'push-up superset': 'Push-Up',
    'barbell upright row': 'Barbell Upright Row',
    'cable face pull': 'Cable Face Pull',
    'cable reverse curl': 'Cable Reverse Curl',
    'flat chest press machine': 'Flat Chest Press Machine',
    'standing cable chest fly': 'Cable Chest Fly',
    'reverse pec deck (rear delt)': 'Reverse Pec Deck (Rear Delt)',
    'weighted parallel bar dips': 'Parallel Bar Dips',
    'weighted dip': 'Parallel Bar Dips',
    'hip adductor machine': 'Hip Adductor Machine',
    'adductor + abductor': 'Hip Adductor Machine',
    'hip abductor machine': 'Hip Abductor Machine',
    'preacher curl': 'Barbell Preacher Curl',
    'ez bar skull crushers': 'Overhead Dumbbell Tricep Extension',
    'ez bar reverse curl': 'Cable Reverse Curl',
    'dumbbell pullover': 'Dumbbell Pullover',
    'dumbbell chest fly': 'Dumbbell Chest Fly',
    'weighted chin-up': 'Pull-Ups',
    'chin-up (max reps)': 'Pull-Ups',
    'chin-ups': 'Pull-Ups',
    'assisted pull-up': 'Pull-Ups',
    'barbell good morning': 'Barbell Good Morning',
    'barbell pause squat': 'Barbell Back Squat',
    'nordic hamstring curl': 'Nordic Hamstring Curl',
    'board press': 'Flat Barbell Bench Press',
    'weighted pull-up': 'Pull-Ups',
    'rack pull': 'Conventional Deadlift',
    'dumbbell chest press': 'Flat Dumbbell Press',
    'decline db': 'Decline Dumbbell Press',
    'burpee': 'Burpees',
    'burpees': 'Burpees',
    'burpees — tabata': 'Burpees',
    'jump squat': 'Jump Squat',
    'jump squats — tabata': 'Jump Squat',
    'squat jump': 'Jump Squat',
    'mountain climbers': 'Mountain Climbers',
    'mountain climbers — tabata': 'Mountain Climbers',
    'mountain climber': 'Mountain Climbers',
    'high knees': 'High Knees',
    'high knees — tabata': 'High Knees',
    'plank to push-up': 'Plank',
    'db thruster': 'Thrusters',
    'thruster': 'Thrusters',
    'box jump': 'Box Jumps',
    'box jumps': 'Box Jumps',
    'kettlebell swing': 'Kettlebell Swing',
    'lunge jump': 'Lunge Jumps',
    'skater jumps': 'Skater Jumps',
    'wall sit max': 'Wall Sit',
    'wall sit': 'Wall Sit',
    'goblet squat': 'Goblet Squat',
    'barbell hip thrust': 'Barbell Hip Thrust',
    'seated barbell military press': 'Barbell Overhead Press',
    'barbell front squat': 'Front Squat',
    'barbell push press': 'Barbell Overhead Press',
    'barbell power clean': 'Barbell Power Clean',
    'barbell power clean (light)': 'Barbell Power Clean',
    'barbell box squat': 'Barbell Back Squat',
    'farmer': 'Farmers Walk',
    'db squat': 'Goblet Squat',
    'db squat timed': 'Goblet Squat',
    'db press timed': 'Seated Dumbbell Shoulder Press',
    'curl + triceps ss': 'EZ Bar Bicep Curl',
    'step-up': 'Box Step-Up',
    'box step-up': 'Box Step-Up',
    'sled push': 'Sled Push',
    'sled push/pull': 'Sled Push',
    'warm-up walk': 'Low Intensity Cardio Warm-Up',
    'recovery walk': 'Low Intensity Cardio Warm-Up',
    'cool down walk': 'Low Intensity Cardio Warm-Up',
    'cool down stretch': 'Low Intensity Cardio Warm-Up',
    'mobility work': 'Low Intensity Cardio Warm-Up',
    'warm-up': 'Low Intensity Cardio Warm-Up',
    'stretch': 'Low Intensity Cardio Warm-Up',
    'cool down': 'Low Intensity Cardio Warm-Up',
    'sprint interval': 'Sprint Intervals',
    'bike: sprint / easy': 'Bike HIIT Intervals',
    'bike cardio': 'Bike HIIT Intervals',
    'bike': 'Bike HIIT Intervals',
    'core circuit': 'Core Circuit (Plank / Crunch / Leg Raise)',
    'steady state cardio': 'Moderate Steady State Cardio',
    'intensity burst': 'Sprint Intervals',
    'stairmaster intervals': 'Stairmaster',
    'row warm up': 'Rowing Machine Cardio',
    'row high effort': 'Rowing Machine Cardio',
    'row recovery': 'Rowing Machine Cardio',
    'row sprint finale': 'Rowing Machine Cardio',
    'row cool down': 'Rowing Machine Cardio',
    'incline treadmill': 'Treadmill Incline Walk',
    'treadmill incline walk': 'Treadmill Incline Walk',
    'bicycle crunch': 'Bicycle Crunch',
    'plank variations': 'Plank',
    'plank hold': 'Plank',
    'zone 2 cardio warm-up': 'Zone 2 Steady State Cardio',
    'hiit intervals': 'Treadmill HIIT',
    'lactate threshold intervals': 'Sprint Intervals',
    'zone 2 sustained': 'Zone 2 Steady State Cardio',
    'tempo effort': 'Zone 2-3 Sustained Cardio',
    'progressive intervals': 'Sprint Intervals',
    'foam roll': 'Foam Rolling',
    'foam rolling': 'Foam Rolling',
    'long distance sustained': 'Low Intensity Steady State Cardio',
    'seated high cable row': 'Seated Cable Row',
    'chest-supported machine row': 'Seated Cable Row',
    'cable pullover': 'Cable Pullover',
    'biceps machine': 'Barbell Preacher Curl',
    'cable overhead tricep extension': 'Overhead Dumbbell Tricep Extension',
    'dumbbell tricep kickback': 'Dumbbell Tricep Kickback',
    'lying leg curl': 'Leg Curl',
    'smith machine squat': 'Barbell Back Squat',
    'dumbbell romanian deadlift': 'Romanian Deadlift',
    'seated calf raise': 'Seated Calf Raise',
    'donkey calf raise': 'Standing Calf Raise',
    'hyperextensions max': 'Hyperextensions',
    'pause bench': 'Flat Barbell Bench Press',
    'band pull-apart': 'Band Pull-Apart',
    'safety bar squat': 'Barbell Back Squat',
    'single leg press machine': 'Leg Press',
    'floor press': 'Flat Barbell Bench Press',
    'triceps lockout': 'Cable Tricep Pushdown',
    'band pushdown': 'Cable Tricep Pushdown',
    'sumo deadlift': 'Sumo Deadlift',
    'hex bar deadlift': 'Hex Bar Deadlift',
    'bulgarian split squat': 'Bulgarian Split Squat',
    'treadmill hiit intervals': 'Treadmill HIIT',
    'wide grip pull-down': 'Wide Grip Lat Pulldown',
    'db arnold press': 'Arnold Press',
    'arnold press': 'Arnold Press',
    'triceps rope pushdown': 'Cable Tricep Pushdown',
    'dumbbell lateral raise drop set': 'Dumbbell Lateral Raises',
    'db side lateral': 'Dumbbell Lateral Raises',
    'lateral raise + lunge + crunch': 'Dumbbell Lateral Raises',
    'incline chest machine': 'Incline Hammer Strength Press',
    'cable crunch': 'Cable Crunch',
    'reverse crunch': 'Reverse Crunch',
    'seated db shoulder press': 'Seated Dumbbell Shoulder Press',
    'smith machine incline press': 'Incline Barbell Bench Press',
    'reverse grip pulldown': 'Wide Grip Lat Pulldown',
    'heavy db row': 'Chest-Supported Dumbbell Row',
    'core stability': 'Plank',
    'db shrugs': 'Barbell Shrugs',
    'chest machine': 'Flat Chest Press Machine',
    'bodyweight lunges': 'Dumbbell Walking Lunge',
    'plank circuit': 'Core Circuit (Plank / Crunch / Leg Raise)',
    'seated row machine': 'Seated Cable Row',
    'db row timed': 'Chest-Supported Dumbbell Row',
    'emom: squat+push-up+row': 'Push-Up',
    'band pulldown': 'Wide Grip Lat Pulldown',
    'barbell complex: squat+row+press': 'Barbell Back Squat',
    'amrap circuit': 'Core Circuit (Plank / Crunch / Leg Raise)',
    'squat + push-up + db row': 'Barbell Back Squat',
    'jump rope between rounds': 'Jump Rope',
    'overhead press db': 'Seated Dumbbell Shoulder Press',
    'bodyweight squat': 'Barbell Back Squat',
    'timed circuit: db press': 'Seated Dumbbell Shoulder Press',
    'timed circuit: db row': 'Chest-Supported Dumbbell Row',
    'timed circuit: shoulder press': 'Seated Dumbbell Shoulder Press',
    'timed circuit: pulldown': 'Wide Grip Lat Pulldown',
    'timed circuit: cable fly': 'Cable Chest Fly',
    'timed circuit: lateral raise': 'Dumbbell Lateral Raises',
    'timed circuit: curl': 'Hammer Curls',
    'timed circuit: triceps': 'Cable Tricep Pushdown',
    'timed: squat': 'Barbell Back Squat',
    'timed: lunge': 'Dumbbell Walking Lunge',
    'timed: hip thrust': 'Barbell Hip Thrust',
    'timed: step-up': 'Box Step-Up',
    'timed: calf raise': 'Standing Calf Raise',
    'timed: leg extension': 'Leg Extension',
    'timed: leg curl': 'Leg Curl',
    'timed: jump squat + wall sit': 'Jump Squat',
    'deadlift': 'Conventional Deadlift',
    'walking lunges': 'Dumbbell Walking Lunge',
    'flat dumbbell bench press': 'Flat Dumbbell Press',
    'db row': 'Chest-Supported Dumbbell Row',
    'lunge jump': 'Dumbbell Walking Lunge',
    'farmer\\': 'Farmers Walk',
    'push-ups — tabata': 'Push-Up',
    'squat': 'Barbell Back Squat',
    'pulldown': 'Wide Grip Lat Pulldown',
    'walking lunge': 'Dumbbell Walking Lunge',
    'seated press': 'Seated Dumbbell Shoulder Press',
    'hip abductor machine': 'Hip Adductor Machine',
    'barbell curl': 'EZ Bar Bicep Curl',
    'lunges': 'Dumbbell Walking Lunge',
    'push-up superset w/ db row': 'Push-Up',
    'dumbbell shoulder press': 'Seated Dumbbell Shoulder Press',
    'barbell bench press': 'Flat Barbell Bench Press',
    'incline bench press': 'Incline Barbell Bench Press',
    'bike intervals': 'Bike HIIT Intervals'
};

/**
 * Look up exercise detail by name (case-insensitive, with alias resolution).
 * Returns null if no data is available.
 */
export function getExerciseDetail(name: string): ExerciseDetail | null {
    if (!name) return null;

    // Direct match
    if (LIBRARY[name]) return LIBRARY[name];

    // Case-insensitive on canonical keys
    const lower = name.toLowerCase().trim();
    for (const [key, value] of Object.entries(LIBRARY)) {
        if (key.toLowerCase() === lower) return value;
    }

    // Alias match
    const aliased = ALIASES[lower];
    if (aliased && LIBRARY[aliased]) return LIBRARY[aliased];

    // Strip parenthetical variations: "Exercise Name (variation)" → "Exercise Name"
    const stripped = lower.replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (stripped !== lower) {
        for (const [key, value] of Object.entries(LIBRARY)) {
            if (key.toLowerCase() === stripped) return value;
        }
        if (ALIASES[stripped] && LIBRARY[ALIASES[stripped]]) return LIBRARY[ALIASES[stripped]];
    }

    return null;
}

// ═══ VIDEO MAP (YouTube @fit-distance) ════════════════════════════════
// French-titled videos — movement is universal, EN/AR instructions are
// provided by each LIBRARY entry. Confidence tiers:
//   HIGH   — French title clearly describes the same movement
//   MEDIUM — same movement, different variation (dumbbell vs barbell, etc.)
//   LOW    — related but not exact; verify manually
// Leave undefined for exercises with no channel match — VIDEOS_NEEDED.txt
// tracks the manual-review queue.
const FIT_DISTANCE_VIDEOS: Record<string, string> = {
    'Barbell Back Squat': 'cnYy6JPmXVg',              // Squat avec barre
    'Front Squat': 'Fy0fJFoIov4',                     // Squats avant avec une barre
    'Flat Barbell Bench Press': 'j-cQXHTPLaM',        // Développé couché à la barre
    'Incline Barbell Bench Press': 'p_I49vPwgjM',     // Développé couché incliné avec barre
    'Close Grip Barbell Bench Press': '4P_f4T8qTZQ',  // Développé couché prise serrée
    'Barbell Overhead Press': 'Sadx09VPulo',          // Développé assis pour épaules à la barre (MEDIUM: seated)
    'Romanian Deadlift': 'BJKya_6nFvs',               // Soulevé de terre roumain à la barre
    'Conventional Deadlift': 'DKKILCl2f7A',           // Soulevé de terre à la barre
    'Barbell Bent-Over Row': 'FeA83-UUBao',           // Rowing à la barre en position penchée
    'T-Bar Row': 'hRKyzgiDggA',                       // Rowing à la landmine (MEDIUM: landmine = T-Bar variant)
    'Barbell Shrugs': 'EBNB0kOR0vc',                  // Shrugs à la barre avant
    'Incline Dumbbell Press': 'csSW2-I5XzM',          // Développé couché incliné avec haltères
    'Flat Dumbbell Press': 'FymkWalUino',             // Développé couché avec haltères
    'Dumbbell Lateral Raises': 'hnT7soU3f64',         // Élévations latérales debout avec haltères
    'Bent-Over Dumbbell Lateral Raise': 'M_XTsbsXrkM',// Élévation latérale des deltoïdes postérieurs en position assise
    'Seated Dumbbell Shoulder Press': 'ITVw5Di2sCM',  // Développé militaire assis alterné haltères
    'Hammer Curls': '5dZi0YVhYSg',                    // Curl marteau assis avec haltères
    'Overhead Dumbbell Tricep Extension': 'ieHX45k72LI', // Extension des bras avec haltères au-dessus de la tête
    'Dumbbell Walking Lunge': 'Q2OAQamemSk',          // Fentes marchées avec haltères
    'Chest-Supported Dumbbell Row': 'eCqJzqmvKaY',    // Rowing avec haltères en prise marteau sur banc incliné
    'Cable Tricep Pushdown': 'EHd0NygL5QQ',           // Extensions triceps en prise inversée à la poulie haute (MEDIUM: reverse grip)
    'Cable Chest Fly': 'lbUErGoYl4U',                 // Écartés assis à la poulie
    'Seated Cable Row': 'Ma_1UuJ2yGU',                // Rowing assis unilatéral à la poulie basse (MEDIUM: unilateral)
    'Wide Grip Lat Pulldown': 'tTB2bvHsUdU',          // Tirage vertical prise large
    'Leg Press': 'cPgwS1YFGAk',                       // Presse à cuisse horizontale
    'Hack Squat Machine': '9Yo2VNx5DoY',              // Hack squat pieds écartés
    'Leg Extension': 'qLzCjZOuP40',                   // Leg extension
    'Leg Curl': 'se2txMEXqNM',                        // Flexion des ischio-jambiers en position assise (Leg curl assis)
    'Standing Calf Raise': 'cC2IsZTeAAQ',             // Élévation des mollets debout à la machine
    'Reverse Pec Deck (Rear Delt)': 'M_XTsbsXrkM',    // LOW CONFIDENCE — rear delt raise, not pec deck machine specifically
    'Incline Hammer Strength Press': 'Zd0Z1NF9yU0',   // Développé horizontal assis incliné à la machine (MEDIUM)
    'Parallel Bar Dips': 'fAjgb38Kku0',               // Dips
    'EZ Bar Bicep Curl': 'UV6_gED9Ml8',               // Curl biceps barre EZ
    'Pull-Ups': 'zNTJuBFcX_8',                        // Tractions prise pronation
    'Hanging Leg Raise': 'yybIhG9-qok',               // Relevés de genoux suspendus (MEDIUM: knee raise variant)
    'Plank': 'fldSXH9ZCtI',                           // Planche normale (gainage)
    'Decline Dumbbell Press': 'rgS8gp7qo1I',          // Développé décliné avec haltères
    'Barbell Upright Row': '1b1WGxFNmis',             // Tirage menton à la barre
    'Barbell Preacher Curl': 'b4gynHy5jc0',           // Curl pupitre à la barre
    'Dumbbell Concentration Curl': 'bEcwNRJh_6g',     // Curl concentré avec haltère
    'Cable Reverse Curl': 'rn5c0A7CXaE',              // Curl à la poulie en prise inversée
    'Flat Chest Press Machine': 'w4xqanUDMOU',        // Chest press - Développé assis unilatéral buste droit
    'Hip Adductor Machine': 'rp-HZ7MXVLo',            // Machine à adducteurs
    'Dumbbell Pullover': 'BdifbiOArvo',               // Pullover haltères
    'Dumbbell Chest Fly': 'sv-pGiNXGLQ',              // Écartés couchés avec haltères
    'Barbell Good Morning': '2nZsBbNTc3M',            // Good Morning avec barre
    'Nordic Hamstring Curl': 'Hte4j3NK3rA',           // Nordic Hamstring
    'Kettlebell Swing': '9-UF52X0A2w',                // Swing avec kettlebell
    'Goblet Squat': 'sNFAfq2vV8g',                    // Squats goblet avec haltère
    'Barbell Hip Thrust': 'Z8h4M-gZHEE',              // (Hip thrust) - Relevé de bassin à la barre
    'Barbell Power Clean': 'vfnMtgVE6DM',             // Clean à la barre (MEDIUM: full clean, not strictly power clean)
    'Box Step-Up': 'yoquxWRdJO0',                     // Step-up avec haltères
    'Cable Pullover': 'LLaiYqBdRjI',                  // Pullover barre à la poulie (MEDIUM: barbell at cable)
    'Dumbbell Tricep Kickback': 'UEvn3sILe-0',        // Kickback - Extensions des triceps assis
    'Seated Calf Raise': '_mJIsBzrVbc',               // Mollets assis à la machine
    'Hyperextensions': '8e57lSvgc3E',                 // Extension lombaires à 45 degrés
    'Band Pull-Apart': '-iJ1hwuFfX4',                 // Écartés avec élastiques
    'Sumo Deadlift': 'iLWRv86lHn0',                   // Soulevé de terre sumo à la barre
    'Hex Bar Deadlift': 'gBV_lTXoG5c',                // Soulevé de terre à la trap bar
    'Bulgarian Split Squat': 'oemJWuqrABo',           // Squat unilatéral pied arrière en élévation (style bulgare)
    'Arnold Press': 'LgBSUbp0TzE',                    // Développé assis Arnold
    'Cable Crunch': 'dfjqQTg1YXw',                    // Crunch décliné avec câble
    'Reverse Crunch': 'nHVurpS8aZ4',                  // Crunchs inversés
    // NEEDS_MANUAL_REVIEW — no @fit-distance match:
    //   Pec Deck Fly, Cable Face Pull, Push-Up, Farmers Walk, Bicycle Crunch
};

for (const [key, videoId] of Object.entries(FIT_DISTANCE_VIDEOS)) {
    const entry = LIBRARY[key];
    if (entry) {
        entry.videoId = videoId;
        entry.videoSource = 'fit-distance';
    }
}

export { LIBRARY as EXERCISE_LIBRARY };
