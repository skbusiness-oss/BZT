/**
 * Diet content localization — Arabic lookups for the static diet data.
 *
 * The diet catalog (src/data/diets/) and reference content (food keys,
 * supplements, signals matrix) all live in English as the source of truth.
 * This module maps every user-visible English string to its Arabic
 * counterpart so PlanDetail (and any future surface) can render the data
 * in the user's language without bloating the data files with `{en,ar}`
 * objects per row.
 *
 * One unified entry point: `localizeDiet(text, lang)` returns the AR
 * translation when the input is a known string and lang === 'ar';
 * otherwise it returns the input unchanged.
 *
 * If a string is missing from the maps below, the English source falls
 * through — preferable to a TypeScript-error wall when adding new content.
 */
import type { Language } from '../i18n/translations';

// ─── Foods ──────────────────────────────────────────────────────────────
export const FOOD_AR: Record<string, string> = {
    // Proteins
    'Chicken breast': 'صدر دجاج',
    'Meat 96%':       'لحم 96%',
    'White fish':     'سمك أبيض',
    'Egg white':      'بياض البيض',
    'Shrimp':         'روبيان',
    'Sardines':       'سردين',
    // Carbs
    'Wholewheat tortilla': 'تورتيلا قمح كامل',
    'Rice':                'أرز',
    'Potatoes':            'بطاطس',
    'Sweet potatoes':      'بطاطس حلوة',
    'Corn flakes (plain)': 'كورن فليكس (سادة)',
    'Toast wheat':         'توست قمح',
    // Fats
    'Olive oil': 'زيت زيتون',
    'Avocado':   'أفوكادو',
    'Almonds':   'لوز',
    'Walnuts':   'جوز',
    // Veggies
    'Carrots':   'جزر',
    'Zucchini':  'كوسا',
    'Cucumber':  'خيار',
    'Lettuce':   'خس',
    'Broccoli':  'بروكلي',
    // Fruits
    'Berries':    'توت',
    'Apples':     'تفاح',
    'Grapefruit': 'جريب فروت',
    'Kiwis':      'كيوي',
    'Melon':      'شمام',
};

// ─── Supplements ────────────────────────────────────────────────────────
export const SUPPLEMENT_AR: Record<string, string> = {
    'Apple cider vinegar':         'خل التفاح',
    'Warm water':                  'ماء دافئ',
    '200 ml coconut water':        '200 مل ماء جوز هند',
    'or EAAs with electrolytes':   'أو أحماض أمينية أساسية مع إلكتروليتات',
    '7 g creatine':                '7 جرام كرياتين',
    '10 g glutamine':              '10 جرام جلوتامين',
    '30 g iso whey':               '30 جرام واي بروتين',
};

// ─── Signal-group titles ────────────────────────────────────────────────
export const SIGNAL_GROUP_TITLE_AR: Record<string, string> = {
    'General Adjustment Signals': 'إشارات تعديل عامة',
    'Energy & Body Composition':  'الطاقة وتركيب الجسم',
    'Performance & Recovery':     'الأداء والاستشفاء',
    'Hunger & Satiety':           'الجوع والشبع',
    'Visual & Feel':              'المظهر والإحساس',
    'Weight & Measurement':       'الوزن والقياس',
    'Digestion & Gut':            'الهضم والأمعاء',
};

// ─── Signal sentences (left column of the matrix) ──────────────────────
export const SIGNAL_AR: Record<string, string> = {
    // General
    'hungry + super flat + lean':         'جائع + مسطّح جداً + رشيق',
    'not hungry + bloated + not in shape':'غير جائع + منتفخ + غير لائق',
    'hungry + bloated + high body':       'جائع + منتفخ + جسم عالٍ',
    'not hungry + lean + not bloated':    'غير جائع + رشيق + غير منتفخ',
    // Energy
    'tired + flat + lean':                'متعب + مسطّح + رشيق',
    'tired + bloated + soft':             'متعب + منتفخ + رخو',
    'energetic + lean + vascular':        'نشيط + رشيق + بارز العروق',
    'energetic + bloated + puffy':        'نشيط + منتفخ + متضخّم',
    // Performance
    'strong in gym + hungry + flat':      'قوي في الجيم + جائع + مسطّح',
    'weak in gym + not hungry + bloated': 'ضعيف في الجيم + غير جائع + منتفخ',
    'strong in gym + lean + not hungry':  'قوي في الجيم + رشيق + غير جائع',
    'weak in gym + tired + soft':         'ضعيف في الجيم + متعب + رخو',
    // Hunger
    'starving + lean + energetic':           'جائع جداً + رشيق + نشيط',
    'no appetite + soft + tired':            'لا شهية + رخو + متعب',
    'constant hunger + bloated + gaining':   'جوع مستمر + منتفخ + يكتسب وزناً',
    'satisfied + lean + strong':             'شبعان + رشيق + قوي',
    // Visual
    'veiny + flat + hungry':                                'عروق بارزة + مسطّح + جائع',
    'smooth + bloated + lethargic':                         'ناعم + منتفخ + خامل',
    'tight skin + full muscles + moderate hunger':          'جلد مشدود + عضلات ممتلئة + جوع متوسط',
    'loose skin + flat + weak':                             'جلد رخو + مسطّح + ضعيف',
    // Weight
    'scale up + lean + strong':       'الميزان يصعد + رشيق + قوي',
    'scale up + soft + bloated':      'الميزان يصعد + رخو + منتفخ',
    'scale down + flat + weak':       'الميزان ينزل + مسطّح + ضعيف',
    'scale down + lean + energetic':  'الميزان ينزل + رشيق + نشيط',
    // Digestion
    'gassy + bloated + uncomfortable':   'غازات + منتفخ + غير مرتاح',
    'regular + lean + energetic':        'منتظم + رشيق + نشيط',
    'constipated + low energy + flat':   'إمساك + طاقة منخفضة + مسطّح',
    'perfect digestion + hungry + flat': 'هضم مثالي + جائع + مسطّح',
};

// ─── Signal action sentences (right column) ────────────────────────────
export const ACTION_AR: Record<string, string> = {
    // General
    'cheat meal or add carbs':          'وجبة غش أو أضف كربوهيدرات',
    'decrease carbs':                   'خفّض الكربوهيدرات',
    'add water and decrease carbs':     'أضف ماء وخفّض الكربوهيدرات',
    "don't change anything":            'لا تغيّر شيئاً',
    // Energy
    'add carbs pre-workout':            'أضف كربوهيدرات قبل التمرين',
    'reduce meal frequency':            'قلّل عدد الوجبات',
    'maintenance working':              'الحفاظ يعمل',
    'cut sodium & check hydration':     'قلّل الصوديوم وتحقّق من الترطيب',
    // Performance
    'increase carbs post-workout':      'ارفع الكربوهيدرات بعد التمرين',
    'take rest day & reduce carbs':     'خذ يوم راحة وخفّض الكربوهيدرات',
    "perfect zone — don't change":      'المنطقة المثالية — لا تغيّر',
    'add sleep & cut volume':           'زد النوم وقلّل حجم التمرين',
    // Hunger
    'add healthy fats':                 'أضف دهوناً صحية',
    'check stress & sleep first':       'تحقّق من التوتّر والنوم أولاً',
    'increase protein & fiber':         'ارفع البروتين والألياف',
    "you've found your sweet spot":     'وجدت منطقتك المثلى',
    // Visual
    'carb up intelligently':            'ارفع الكربوهيدرات بذكاء',
    'drop processed foods':             'اترك الأطعمة المصنّعة',
    'dial it in perfectly':             'اضبطها بدقة',
    'reverse diet time':                'وقت ريفرس دايت',
    // Weight
    'good weight — keep going':         'وزن جيد — استمرّ',
    'slow the bulk':                    'بطّئ التضخيم',
    'eating too little':                'تأكل قليلاً جداً',
    'cutting successfully':             'التنشيف ناجح',
    // Digestion
    'identify food intolerances':       'حدّد حساسية الطعام',
    'gut health optimal':               'صحة الأمعاء مثالية',
    'add fiber & water':                'أضف ألياف وماء',
    'add quality carbs':                'أضف كربوهيدرات جيدة',
};

// ─── Meal names + extras (catalog data) ─────────────────────────────────
export const MEAL_NAME_AR: Record<string, string> = {
    'Meal 01':                'الوجبة 01',
    'Meal 02 (pre/post WO)':  'الوجبة 02 (قبل/بعد التمرين)',
    'Meal 02':                'الوجبة 02',
    'Meal 03':                'الوجبة 03',
    'Meal 04':                'الوجبة 04',
};

export const EXTRAS_AR: Record<string, string> = {
    '1 green apple':                    'تفاحة خضراء واحدة',
    '70 g veggies':                     '70 جرام خضروات',
    '100 g veggies':                    '100 جرام خضروات',
    '150 g veggies':                    '150 جرام خضروات',
    '70 g veggies, 1 green apple':      '70 جرام خضروات، تفاحة خضراء واحدة',
};

// ─── Public helpers ─────────────────────────────────────────────────────
function lookup(map: Record<string, string>, text: string, lang: Language): string {
    if (lang !== 'ar') return text;
    return map[text] ?? text;
}

export const tFood       = (s: string, lang: Language) => lookup(FOOD_AR, s, lang);
export const tSupplement = (s: string, lang: Language) => lookup(SUPPLEMENT_AR, s, lang);
export const tSignal     = (s: string, lang: Language) => lookup(SIGNAL_AR, s, lang);
export const tAction     = (s: string, lang: Language) => lookup(ACTION_AR, s, lang);
export const tSignalGroupTitle = (s: string, lang: Language) => lookup(SIGNAL_GROUP_TITLE_AR, s, lang);
export const tMealName   = (s: string, lang: Language) => lookup(MEAL_NAME_AR, s, lang);
export const tExtras     = (s: string, lang: Language) => lookup(EXTRAS_AR, s, lang);

/**
 * Localize a plan name like "1,400 kcal · 4 meals" → "1,400 kcal · 4 وجبات".
 * The catalog stores names in English as the source of truth; this helper
 * just swaps the trailing "meals" word so we don't need a parallel name
 * field per plan or 20 hand-translated copies.
 *
 * Pass the language's translation of the word "meals" as `mealsWord`
 * (`t('mealsWord')` from the calling component) so this module stays
 * decoupled from the i18n context.
 */
export function tPlanName(name: string, lang: Language, mealsWord: string): string {
    if (lang !== 'ar') return name;
    return name.replace(/\bmeals\b/i, mealsWord);
}
