/**
 * Diet reference content — identical across all 20 PDFs.
 *
 * The coach's PDFs share three sections that don't change between plans:
 *   1. Diet keys (food → macros per 100 g for proteins/carbs/fats; veggies; fruits)
 *   2. Supplements (pre-breakfast / intra-workout / post-workout)
 *   3. Adjustment signals — weekly check-in matrix
 *
 * Centralised here so `Diets.tsx` and any plan detail page can render them
 * once instead of duplicating per plan. The plan-specific data (training-day
 * + rest-day macros, meal split) lives in `index.ts`.
 */

// ─── Diet keys — proteins ────────────────────────────────────────────────
export interface ProteinKey {
    food: string;
    protein: number;
    carbs: number;
    sugar: number;
    fat: number;
    satFat: number;
}
export const PROTEIN_KEYS: ProteinKey[] = [
    { food: 'Chicken breast', protein: 18.5, carbs: 0.9, sugar: 0,   fat: 0,    satFat: 0    },
    { food: 'Meat 96%',       protein: 21,   carbs: 0,   sugar: 0,   fat: 4,    satFat: 0.1  },
    { food: 'White fish',     protein: 20,   carbs: 0,   sugar: 0,   fat: 0,    satFat: 0    },
    { food: 'Egg white',      protein: 6.3,  carbs: 0.4, sugar: 0,   fat: 4.8,  satFat: 1.6  },
    { food: 'Shrimp',         protein: 15,   carbs: 1,   sugar: 0,   fat: 1,    satFat: 0.4  },
    { food: 'Sardines',       protein: 19.4, carbs: 0,   sugar: 0,   fat: 4.2,  satFat: 0.3  },
];

// ─── Diet keys — carbs ───────────────────────────────────────────────────
export interface CarbKey {
    food: string;
    protein: number;
    carbs: number;
    fibers: number;
    fat: number;
    satFat: number;
}
export const CARB_KEYS: CarbKey[] = [
    { food: 'Wholewheat tortilla', protein: 8,   carbs: 44, fibers: 6,   fat: 5,   satFat: 0.5 },
    { food: 'Rice',                protein: 9,   carbs: 76, fibers: 1,   fat: 1.5, satFat: 0   },
    { food: 'Potatoes',            protein: 2.5, carbs: 21, fibers: 2.2, fat: 2.5, satFat: 0.1 },
    { food: 'Sweet potatoes',      protein: 1.6, carbs: 23, fibers: 3,   fat: 0.1, satFat: 0   },
    { food: 'Corn flakes (plain)', protein: 7.1, carbs: 85, fibers: 3.6, fat: 0,   satFat: 0   },
    { food: 'Toast wheat',         protein: 8,   carbs: 42, fibers: 2,   fat: 3.4, satFat: 0.2 },
];

// ─── Diet keys — fats (per 20 g) ─────────────────────────────────────────
export interface FatKey {
    food: string;
    protein: number;
    carbs: number;
    fat: number;
    satFat: number;
}
export const FAT_KEYS: FatKey[] = [
    { food: 'Olive oil', protein: 0,   carbs: 0,   fat: 19.5, satFat: 0.7 },
    { food: 'Avocado',   protein: 0.4, carbs: 3,   fat: 1.8,  satFat: 0.4 },
    { food: 'Almonds',   protein: 4.4, carbs: 4.4, fat: 10.4, satFat: 0.7 },
    { food: 'Walnuts',   protein: 3,   carbs: 2.7, fat: 13,   satFat: 0.7 },
];

export const VEGGIES = ['Carrots', 'Zucchini', 'Cucumber', 'Lettuce', 'Broccoli'];
export const FRUITS  = ['Berries', 'Apples', 'Grapefruit', 'Kiwis', 'Melon'];

// ─── Supplements — same across every plan ────────────────────────────────
export const SUPPLEMENTS = {
    preBreakfast: ['Apple cider vinegar', 'Warm water'],
    intraWorkout: ['200 ml coconut water', 'or EAAs with electrolytes'],
    postWorkout:  ['7 g creatine', '10 g glutamine', '30 g iso whey'],
} as const;

// ─── Carb-adjustment notice ──────────────────────────────────────────────
export const CARB_ADJUSTMENT_NOTE =
    'Carbs should be decreased or increased every week based on hunger level and sensitivity. ' +
    'Adjust in small steps (10–20 g per day at a time), give the change a full week before judging it, ' +
    'and keep protein anchored at 185 g.';

// ─── Adjustment signals — weekly check-in matrix ─────────────────────────
export interface SignalGroup {
    title: string;
    /** "tone" hint for theming the section header. */
    tone: 'general' | 'energy' | 'performance' | 'hunger' | 'visual' | 'weight' | 'digestion';
    rows: { signal: string; action: string }[];
}
export const SIGNAL_GROUPS: SignalGroup[] = [
    {
        title: 'General Adjustment Signals',
        tone: 'general',
        rows: [
            { signal: 'hungry + super flat + lean',         action: 'cheat meal or add carbs' },
            { signal: 'not hungry + bloated + not in shape', action: 'decrease carbs' },
            { signal: 'hungry + bloated + high body',        action: 'add water and decrease carbs' },
            { signal: 'not hungry + lean + not bloated',     action: "don't change anything" },
        ],
    },
    {
        title: 'Energy & Body Composition',
        tone: 'energy',
        rows: [
            { signal: 'tired + flat + lean',         action: 'add carbs pre-workout' },
            { signal: 'tired + bloated + soft',      action: 'reduce meal frequency' },
            { signal: 'energetic + lean + vascular', action: 'maintenance working' },
            { signal: 'energetic + bloated + puffy', action: 'cut sodium & check hydration' },
        ],
    },
    {
        title: 'Performance & Recovery',
        tone: 'performance',
        rows: [
            { signal: 'strong in gym + hungry + flat',         action: 'increase carbs post-workout' },
            { signal: 'weak in gym + not hungry + bloated',    action: 'take rest day & reduce carbs' },
            { signal: 'strong in gym + lean + not hungry',     action: "perfect zone — don't change" },
            { signal: 'weak in gym + tired + soft',            action: 'add sleep & cut volume' },
        ],
    },
    {
        title: 'Hunger & Satiety',
        tone: 'hunger',
        rows: [
            { signal: 'starving + lean + energetic',          action: 'add healthy fats' },
            { signal: 'no appetite + soft + tired',           action: 'check stress & sleep first' },
            { signal: 'constant hunger + bloated + gaining',  action: 'increase protein & fiber' },
            { signal: 'satisfied + lean + strong',            action: "you've found your sweet spot" },
        ],
    },
    {
        title: 'Visual & Feel',
        tone: 'visual',
        rows: [
            { signal: 'veiny + flat + hungry',                          action: 'carb up intelligently' },
            { signal: 'smooth + bloated + lethargic',                   action: 'drop processed foods' },
            { signal: 'tight skin + full muscles + moderate hunger',    action: 'dial it in perfectly' },
            { signal: 'loose skin + flat + weak',                       action: 'reverse diet time' },
        ],
    },
    {
        title: 'Weight & Measurement',
        tone: 'weight',
        rows: [
            { signal: 'scale up + lean + strong',     action: 'good weight — keep going' },
            { signal: 'scale up + soft + bloated',    action: 'slow the bulk' },
            { signal: 'scale down + flat + weak',     action: 'eating too little' },
            { signal: 'scale down + lean + energetic', action: 'cutting successfully' },
        ],
    },
    {
        title: 'Digestion & Gut',
        tone: 'digestion',
        rows: [
            { signal: 'gassy + bloated + uncomfortable',     action: 'identify food intolerances' },
            { signal: 'regular + lean + energetic',          action: 'gut health optimal' },
            { signal: 'constipated + low energy + flat',     action: 'add fiber & water' },
            { signal: 'perfect digestion + hungry + flat',   action: 'add quality carbs' },
        ],
    },
];

export const DIET_DISCLAIMER =
    'Educational use only. Not medical advice. If you have a medical condition, are pregnant, or take medication, ' +
    'review changes with a registered dietitian or your physician before adopting them.';

export const DIET_QUOTE = 'He who lives without discipline lives with no honor.';
