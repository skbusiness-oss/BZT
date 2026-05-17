/**
 * Diet catalog — Coach BZT's 20 PDFs, transcribed.
 *
 * The catalog spans calorie tiers from 1,400 → 3,400 kcal in 200 kcal steps,
 * each tier available in a 3-meal and a 4-meal variant (with a few exceptions:
 * the 2,000 kcal plan is the "Carb cycling — flexible" plan with only the
 * 4-meal version, and the 3,400 kcal tier has only the 3-meal version).
 *
 * Each plan stores:
 *   - trainingDay: full kcal target + per-meal carbs/protein/fat split
 *   - restDay:     lower-kcal version with carbs reduced and fats raised
 *
 * Headline `calories` and `macros` mirror the training-day numbers (so the
 * browse cards and assignment snapshot work without descending into
 * trainingDay).
 *
 * The matcher in `src/lib/dietCalculator.ts` snaps the user's calculated
 * target kcal to the closest plan inside the meal-count variant they chose.
 *
 * Common reference content (food keys, supplements, signals matrix) lives
 * in `./reference.ts` so it's not duplicated 20 times.
 *
 * PDFs themselves are uploaded to `public/diets/` (or Firebase Storage) and
 * referenced by `pdfUrl`. Filenames mirror the source on disk.
 */
import type { Diet } from '../../types';

export * from './reference';

const PROTEIN = 185;

// ─── Catalog (20 plans) ──────────────────────────────────────────────────
export const dietPlans: Diet[] = [
    // ── 1,400 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-1400-4',
        name: '1,400 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 1400,
        macros: { protein: PROTEIN, carbs: 84, fat: 36 },
        pdfUrl: '/diets/Diet_1400kcal.pdf',
        trainingDay: {
            kcal: 1400, protein: PROTEIN, carbs: 84, fat: 36,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 21, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 28, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 21, protein: 45, fat: 18, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 14, protein: 45, fat: 18, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 1175, protein: PROTEIN, carbs: 0, fat: 48,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 0, protein: 45, fat: 13 },
                { order: 2, name: 'Meal 02', carbs: 0, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 0, protein: 45, fat: 16, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0, protein: 45, fat: 19, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-1400-3',
        name: '1,400 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 1400,
        macros: { protein: PROTEIN, carbs: 84, fat: 36 },
        pdfUrl: '/diets/Diet_1400kcal_3meals.pdf',
        trainingDay: {
            kcal: 1400, protein: PROTEIN, carbs: 84, fat: 36,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 25, protein: 60, fat: 14, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 34, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 25, protein: 60, fat: 22, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 1175, protein: PROTEIN, carbs: 0, fat: 48,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 0, protein: 60, fat: 14, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 0, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 0, protein: 60, fat: 34, extras: '150 g veggies' },
            ],
        },
    },

    // ── 1,600 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-1600-4',
        name: '1,600 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 1600,
        macros: { protein: PROTEIN, carbs: 116, fat: 44 },
        pdfUrl: '/diets/Diet_1600kcal.pdf',
        trainingDay: {
            kcal: 1600, protein: PROTEIN, carbs: 116, fat: 44,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 29, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 39, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 29, protein: 45, fat: 22, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 19, protein: 45, fat: 22, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 1375, protein: PROTEIN, carbs: 26, fat: 59,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 8, protein: 45, fat: 16 },
                { order: 2, name: 'Meal 02', carbs: 9, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 9, protein: 45, fat: 20, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0, protein: 45, fat: 23, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-1600-3',
        name: '1,600 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 1600,
        macros: { protein: PROTEIN, carbs: 116, fat: 44 },
        pdfUrl: '/diets/Diet_1600kcal_3meals.pdf',
        trainingDay: {
            kcal: 1600, protein: PROTEIN, carbs: 116, fat: 44,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 35, protein: 60, fat: 18, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 46, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 35, protein: 60, fat: 26, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 1375, protein: PROTEIN, carbs: 26, fat: 59,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 8, protein: 60, fat: 18, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 9, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 9, protein: 60, fat: 41, extras: '150 g veggies' },
            ],
        },
    },

    // ── 1,800 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-1800-4',
        name: '1,800 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 1800,
        macros: { protein: PROTEIN, carbs: 148, fat: 52 },
        pdfUrl: '/diets/Diet_1800kcal.pdf',
        trainingDay: {
            kcal: 1800, protein: PROTEIN, carbs: 148, fat: 52,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 37, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 49, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 37, protein: 45, fat: 26, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 25, protein: 45, fat: 26, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 1575, protein: PROTEIN, carbs: 58, fat: 67,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 20, protein: 45, fat: 18 },
                { order: 2, name: 'Meal 02', carbs: 19, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 19, protein: 45, fat: 22, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 27, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-1800-3',
        name: '1,800 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 1800,
        macros: { protein: PROTEIN, carbs: 148, fat: 52 },
        pdfUrl: '/diets/Diet_1800kcal_3meals.pdf',
        trainingDay: {
            kcal: 1800, protein: PROTEIN, carbs: 148, fat: 52,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 44, protein: 60, fat: 21, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 60, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 44, protein: 60, fat: 31, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 1575, protein: PROTEIN, carbs: 58, fat: 67,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 20, protein: 60, fat: 20, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 19, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 19, protein: 60, fat: 47, extras: '150 g veggies' },
            ],
        },
    },

    // ── 2,000 kcal — Carb cycling, only 4-meal version ─────────────────
    {
        id: 'd-2000-4',
        name: '2,000 kcal · 4 meals',
        label: 'Carb cycling',
        description: 'Flexible carb-cycling plan. Higher carbs on training days, moderate on rest.',
        mealsPerDay: 4,
        calories: 2000,
        macros: { protein: PROTEIN, carbs: 180, fat: 60 },
        pdfUrl: '/diets/Diet_2000kcal.pdf',
        trainingDay: {
            kcal: 2000, protein: PROTEIN, carbs: 180, fat: 60,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 45, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 60, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 45, protein: 45, fat: 30, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 30, protein: 45, fat: 30, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 1775, protein: PROTEIN, carbs: 90, fat: 75,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 30, protein: 45, fat: 20 },
                { order: 2, name: 'Meal 02', carbs: 30, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 30, protein: 45, fat: 25, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 30, extras: '150 g veggies' },
            ],
        },
    },

    // ── 2,200 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-2200-4',
        name: '2,200 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 2200,
        macros: { protein: PROTEIN, carbs: 212, fat: 68 },
        pdfUrl: '/diets/Diet_2200kcal.pdf',
        trainingDay: {
            kcal: 2200, protein: PROTEIN, carbs: 212, fat: 68,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 53, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 71, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 53, protein: 45, fat: 34, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 35, protein: 45, fat: 34, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 1975, protein: PROTEIN, carbs: 122, fat: 83,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 40, protein: 45, fat: 22 },
                { order: 2, name: 'Meal 02', carbs: 41, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 41, protein: 45, fat: 28, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 33, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-2200-3',
        name: '2,200 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 2200,
        macros: { protein: PROTEIN, carbs: 212, fat: 68 },
        pdfUrl: '/diets/Diet_2200kcal_3meals.pdf',
        trainingDay: {
            kcal: 2200, protein: PROTEIN, carbs: 212, fat: 68,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 64, protein: 60, fat: 27, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 84, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 64, protein: 60, fat: 41, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 1975, protein: PROTEIN, carbs: 122, fat: 83,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 40, protein: 60, fat: 25, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 41, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 41, protein: 60, fat: 58, extras: '150 g veggies' },
            ],
        },
    },

    // ── 2,400 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-2400-4',
        name: '2,400 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 2400,
        macros: { protein: PROTEIN, carbs: 244, fat: 76 },
        pdfUrl: '/diets/Diet_2400kcal.pdf',
        trainingDay: {
            kcal: 2400, protein: PROTEIN, carbs: 244, fat: 76,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 61, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 81, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 61, protein: 45, fat: 38, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 41, protein: 45, fat: 38, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 2175, protein: PROTEIN, carbs: 154, fat: 91,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 52, protein: 45, fat: 24 },
                { order: 2, name: 'Meal 02', carbs: 51, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 51, protein: 45, fat: 30, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 37, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-2400-3',
        name: '2,400 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 2400,
        macros: { protein: PROTEIN, carbs: 244, fat: 76 },
        pdfUrl: '/diets/Diet_2400kcal_3meals.pdf',
        trainingDay: {
            kcal: 2400, protein: PROTEIN, carbs: 244, fat: 76,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 73, protein: 60, fat: 30, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 98, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 73, protein: 60, fat: 46, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 2175, protein: PROTEIN, carbs: 154, fat: 91,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 52, protein: 60, fat: 27, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 51, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 51, protein: 60, fat: 64, extras: '150 g veggies' },
            ],
        },
    },

    // ── 2,600 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-2600-4',
        name: '2,600 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 2600,
        macros: { protein: PROTEIN, carbs: 276, fat: 84 },
        pdfUrl: '/diets/Diet_2600kcal.pdf',
        trainingDay: {
            kcal: 2600, protein: PROTEIN, carbs: 276, fat: 84,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 69, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 92, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 69, protein: 45, fat: 42, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 46, protein: 45, fat: 42, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 2375, protein: PROTEIN, carbs: 186, fat: 99,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 62, protein: 45, fat: 26 },
                { order: 2, name: 'Meal 02', carbs: 62, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 62, protein: 45, fat: 33, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 40, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-2600-3',
        name: '2,600 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 2600,
        macros: { protein: PROTEIN, carbs: 276, fat: 84 },
        pdfUrl: '/diets/Diet_2600kcal_3meals.pdf',
        trainingDay: {
            kcal: 2600, protein: PROTEIN, carbs: 276, fat: 84,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 83,  protein: 60, fat: 34, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 110, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 83,  protein: 60, fat: 50, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 2375, protein: PROTEIN, carbs: 186, fat: 99,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 62, protein: 60, fat: 30, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 62, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 62, protein: 60, fat: 69, extras: '150 g veggies' },
            ],
        },
    },

    // ── 2,800 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-2800-4',
        name: '2,800 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 2800,
        macros: { protein: PROTEIN, carbs: 308, fat: 92 },
        pdfUrl: '/diets/Diet_2800kcal.pdf',
        trainingDay: {
            kcal: 2800, protein: PROTEIN, carbs: 308, fat: 92,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 77,  protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 103, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 77,  protein: 45, fat: 46, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 51,  protein: 45, fat: 46, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 2575, protein: PROTEIN, carbs: 218, fat: 107,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 72, protein: 45, fat: 29 },
                { order: 2, name: 'Meal 02', carbs: 73, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 73, protein: 45, fat: 36, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 42, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-2800-3',
        name: '2,800 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 2800,
        macros: { protein: PROTEIN, carbs: 308, fat: 92 },
        pdfUrl: '/diets/Diet_2800kcal_3meals.pdf',
        trainingDay: {
            kcal: 2800, protein: PROTEIN, carbs: 308, fat: 92,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 92,  protein: 60, fat: 37, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 124, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 92,  protein: 60, fat: 55, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 2575, protein: PROTEIN, carbs: 218, fat: 107,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 72, protein: 60, fat: 32, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 73, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 73, protein: 60, fat: 75, extras: '150 g veggies' },
            ],
        },
    },

    // ── 3,000 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-3000-4',
        name: '3,000 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 3000,
        macros: { protein: PROTEIN, carbs: 340, fat: 100 },
        pdfUrl: '/diets/Diet_3000kcal.pdf',
        trainingDay: {
            kcal: 3000, protein: PROTEIN, carbs: 340, fat: 100,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 85,  protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 113, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 85,  protein: 45, fat: 50, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 57,  protein: 45, fat: 50, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 2775, protein: PROTEIN, carbs: 250, fat: 115,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 84, protein: 45, fat: 31 },
                { order: 2, name: 'Meal 02', carbs: 83, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 83, protein: 45, fat: 38, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 46, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-3000-3',
        name: '3,000 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 3000,
        macros: { protein: PROTEIN, carbs: 340, fat: 100 },
        pdfUrl: '/diets/Diet_3000kcal_3meals.pdf',
        trainingDay: {
            kcal: 3000, protein: PROTEIN, carbs: 340, fat: 100,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 102, protein: 60, fat: 40, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 136, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 102, protein: 60, fat: 60, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 2775, protein: PROTEIN, carbs: 250, fat: 115,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 84, protein: 60, fat: 34, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 83, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 83, protein: 60, fat: 81, extras: '150 g veggies' },
            ],
        },
    },

    // ── 3,200 kcal ─────────────────────────────────────────────────────
    {
        id: 'd-3200-4',
        name: '3,200 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 3200,
        macros: { protein: PROTEIN, carbs: 372, fat: 108 },
        pdfUrl: '/diets/Diet_3200kcal.pdf',
        trainingDay: {
            kcal: 3200, protein: PROTEIN, carbs: 372, fat: 108,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 93,  protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 124, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 93,  protein: 45, fat: 54, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 62,  protein: 45, fat: 54, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 2975, protein: PROTEIN, carbs: 282, fat: 123,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 94, protein: 45, fat: 33 },
                { order: 2, name: 'Meal 02', carbs: 94, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 94, protein: 45, fat: 41, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,  protein: 45, fat: 49, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-3200-3',
        name: '3,200 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 3200,
        macros: { protein: PROTEIN, carbs: 372, fat: 108 },
        pdfUrl: '/diets/Diet_3200kcal_3meals.pdf',
        trainingDay: {
            kcal: 3200, protein: PROTEIN, carbs: 372, fat: 108,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 112, protein: 60, fat: 43, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 148, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 112, protein: 60, fat: 65, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 2975, protein: PROTEIN, carbs: 282, fat: 123,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 94, protein: 60, fat: 37, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 94, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 94, protein: 60, fat: 86, extras: '150 g veggies' },
            ],
        },
    },

    // ── 3,400 kcal — only 3-meal version ───────────────────────────────
    {
        id: 'd-3400-3',
        name: '3,400 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 3400,
        macros: { protein: PROTEIN, carbs: 404, fat: 116 },
        pdfUrl: '/diets/Diet_3400kcal_3meals.pdf',
        trainingDay: {
            kcal: 3400, protein: PROTEIN, carbs: 404, fat: 116,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 121, protein: 60, fat: 46, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 162, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 121, protein: 60, fat: 70, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 3175, protein: PROTEIN, carbs: 314, fat: 131,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 104, protein: 60, fat: 39, extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 105, protein: 65, fat: 0,  extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 105, protein: 60, fat: 92, extras: '150 g veggies' },
            ],
        },
    },

    // ── 4,000 kcal ─────────────────────────────────────────────────────
    // Top-tier mass-gain plans. Carbs scale linearly from the 3000-series
    // pattern (+32g per 200 kcal step), fat similarly (+8g per 200 kcal).
    // Rest days follow the same -225 kcal / -90c / +15f relationship as
    // every other tier in this catalog. Cover image is overridden to the
    // performance tier (matches the visual language of the 3000 series)
    // rather than the athlete tier the kcal helper would otherwise pick.
    {
        id: 'd-4000-4',
        name: '4,000 kcal · 4 meals',
        mealsPerDay: 4,
        calories: 4000,
        macros: { protein: PROTEIN, carbs: 500, fat: 140 },
        coverImageUrl: '/diets/covers/tier-performance.jpg',
        trainingDay: {
            kcal: 4000, protein: PROTEIN, carbs: 500, fat: 140,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 125, protein: 45, fat: 0,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 165, protein: 50, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 125, protein: 45, fat: 70, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04',                carbs: 85,  protein: 45, fat: 70, extras: '150 g veggies' },
            ],
        },
        restDay: {
            kcal: 3775, protein: PROTEIN, carbs: 410, fat: 155,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 137, protein: 45, fat: 41 },
                { order: 2, name: 'Meal 02', carbs: 137, protein: 50, fat: 0,  extras: '70 g veggies, 1 green apple' },
                { order: 3, name: 'Meal 03', carbs: 136, protein: 45, fat: 53, extras: '70 g veggies' },
                { order: 4, name: 'Meal 04', carbs: 0,   protein: 45, fat: 61, extras: '150 g veggies' },
            ],
        },
    },
    {
        id: 'd-4000-3',
        name: '4,000 kcal · 3 meals',
        mealsPerDay: 3,
        calories: 4000,
        macros: { protein: PROTEIN, carbs: 500, fat: 140 },
        coverImageUrl: '/diets/covers/tier-performance.jpg',
        trainingDay: {
            kcal: 4000, protein: PROTEIN, carbs: 500, fat: 140,
            meals: [
                { order: 1, name: 'Meal 01',                carbs: 150, protein: 60, fat: 56, extras: '1 green apple' },
                { order: 2, name: 'Meal 02 (pre/post WO)',  carbs: 200, protein: 65, fat: 0 },
                { order: 3, name: 'Meal 03',                carbs: 150, protein: 60, fat: 84, extras: '100 g veggies' },
            ],
        },
        restDay: {
            kcal: 3775, protein: PROTEIN, carbs: 410, fat: 155,
            meals: [
                { order: 1, name: 'Meal 01', carbs: 137, protein: 60, fat: 46,  extras: '1 green apple' },
                { order: 2, name: 'Meal 02', carbs: 137, protein: 65, fat: 0,   extras: '70 g veggies' },
                { order: 3, name: 'Meal 03', carbs: 136, protein: 60, fat: 109, extras: '150 g veggies' },
            ],
        },
    },
];

export function getDietById(id: string): Diet | undefined {
    return dietPlans.find(d => d.id === id);
}
