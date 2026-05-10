/**
 * dietCalculator.ts — Mifflin-St Jeor BMR, TDEE, goal adjustment, macro split.
 *
 * Industry-standard formulas. Pure functions only — no React, no Firebase.
 * Easy to unit-test and reason about.
 *
 * Formulas:
 *   BMR (men):    10·kg + 6.25·cm − 5·age + 5
 *   BMR (women):  10·kg + 6.25·cm − 5·age − 161
 *   TDEE = BMR × activity multiplier
 *   Target = TDEE × (1 + goal adjustment)
 *
 * Macros (per goal, derived from body weight in pounds):
 *   - Cuts:    high protein, low fat, carbs as remainder (preserves muscle in deficit)
 *   - Recomp:  high protein, slight fat bias, carbs as remainder
 *   - Maintain: balanced 30P/40C/30F by calories
 *   - Bulks:   moderate protein, lower fat, carbs as remainder (fuel growth)
 *
 * If your PDFs use a different system (Coach Zack's own numbers), this
 * file is the single place to retune. Don't fork the math elsewhere.
 */
import type {
    Sex, ActivityLevel, DietGoal, MealsPerDay, DietProfile, Diet, DietBand,
} from '../types';

// ─── Activity multipliers ────────────────────────────────────────────────
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,    // desk job, no training
    light:     1.375,  // light exercise 1–3 days/week
    moderate:  1.55,   // moderate 3–5 days/week
    active:    1.725,  // hard 6–7 days/week
    extra:     1.9,    // hard daily + physical job
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
    sedentary: 'Desk job, no exercise',
    light:     'Exercise 1–3 days/week',
    moderate:  'Exercise 3–5 days/week',
    active:    'Hard exercise 6–7 days/week',
    extra:     'Hard daily exercise + physical job',
};

// ─── Goal adjustments (TDEE-relative) ────────────────────────────────────
export const GOAL_ADJUSTMENT: Record<DietGoal, number> = {
    aggressive_cut: -0.25, // −25%
    cut:            -0.15, // −15%
    recomp:         -0.05, // −5%
    maintain:        0.00, //  0%
    lean_bulk:       0.10, // +10%
    bulk:            0.15, // +15%
};

export const GOAL_LABELS: Record<DietGoal, string> = {
    aggressive_cut: 'Aggressive cut',
    cut:            'Cut',
    recomp:         'Recomp',
    maintain:       'Maintain',
    lean_bulk:      'Lean bulk',
    bulk:           'Bulk',
};

// ─── BMR — Mifflin-St Jeor (most accurate widely-used formula) ──────────
export function computeBMR({ sex, weightKg, heightCm, age }: {
    sex: Sex; weightKg: number; heightCm: number; age: number;
}): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(sex === 'male' ? base + 5 : base - 161);
}

// ─── TDEE = BMR × activity ──────────────────────────────────────────────
export function computeTDEE(bmr: number, activity: ActivityLevel): number {
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

// ─── Target calories = TDEE × (1 + goal adjustment) ─────────────────────
export function computeTargetCalories(tdee: number, goal: DietGoal): number {
    return Math.round(tdee * (1 + GOAL_ADJUSTMENT[goal]));
}

// ─── Macro split per goal ────────────────────────────────────────────────
// Returns grams of protein / carbs / fat that sum (approximately) to the
// target calories. Protein and fat are anchored per-pound-of-bodyweight,
// carbs fill the remainder. For maintain we use a 30/40/30 calories split.
export function computeMacros({
    targetCalories, weightKg, goal,
}: {
    targetCalories: number; weightKg: number; goal: DietGoal;
}): { protein: number; carbs: number; fat: number } {
    const lb = weightKg * 2.20462;

    // Calorie density: protein 4, carbs 4, fat 9.
    const KCAL_P = 4, KCAL_C = 4, KCAL_F = 9;

    if (goal === 'maintain') {
        // 30P / 40C / 30F by calories.
        const protein = Math.round((targetCalories * 0.30) / KCAL_P);
        const carbs   = Math.round((targetCalories * 0.40) / KCAL_C);
        const fat     = Math.round((targetCalories * 0.30) / KCAL_F);
        return { protein, carbs, fat };
    }

    // Per-goal anchors (g/lb of bodyweight).
    const PROTEIN_PER_LB = goal === 'aggressive_cut' || goal === 'cut' ? 1.0
                          : goal === 'recomp' ? 0.95
                          : 0.85; // bulk / lean_bulk
    const FAT_PER_LB     = goal === 'aggressive_cut' || goal === 'cut' ? 0.30
                          : goal === 'recomp' ? 0.35
                          : goal === 'lean_bulk' ? 0.30
                          : 0.25; // bulk

    const protein = Math.round(lb * PROTEIN_PER_LB);
    const fat     = Math.round(lb * FAT_PER_LB);
    const proteinKcal = protein * KCAL_P;
    const fatKcal     = fat * KCAL_F;
    const carbsKcal   = Math.max(0, targetCalories - proteinKcal - fatKcal);
    const carbs       = Math.round(carbsKcal / KCAL_C);

    return { protein, carbs, fat };
}

// ─── Composite — full DietProfile from inputs ───────────────────────────
export function computeDietProfile(inputs: {
    sex: Sex;
    age: number;
    weightKg: number;
    heightCm: number;
    activityLevel: ActivityLevel;
    goal: DietGoal;
    mealsPerDay: MealsPerDay;
}): DietProfile {
    const bmr = computeBMR(inputs);
    const tdee = computeTDEE(bmr, inputs.activityLevel);
    const targetCalories = computeTargetCalories(tdee, inputs.goal);
    const macros = computeMacros({
        targetCalories,
        weightKg: inputs.weightKg,
        goal: inputs.goal,
    });

    return {
        ...inputs,
        bmr,
        tdee,
        targetCalories,
        targetProtein: macros.protein,
        targetCarbs:   macros.carbs,
        targetFat:     macros.fat,
    };
}

// ─── Matcher — pick the best diet from the catalog ──────────────────────
// PDFs are kcal tiers, not goal-keyed. The user's goal already shaped the
// target kcal in the calculator step; the matcher just snaps to the closest
// tier inside the requested meal-count variant. Returns null when no plan
// exists for that meal count yet.
export function matchDiet(
    profile: Pick<DietProfile, 'mealsPerDay' | 'targetCalories'>,
    catalog: Diet[],
): Diet | null {
    const candidates = catalog.filter(d => d.mealsPerDay === profile.mealsPerDay);
    if (candidates.length === 0) return null;

    let best = candidates[0];
    let bestDiff = Math.abs(best.calories - profile.targetCalories);
    for (const d of candidates.slice(1)) {
        const diff = Math.abs(d.calories - profile.targetCalories);
        if (diff < bestDiff) {
            best = d;
            bestDiff = diff;
        }
    }
    return best;
}

// ─── Browse band — for catalog filter chips ──────────────────────────────
export function dietBand(kcal: number): DietBand {
    if (kcal <= 1800) return 'low';
    if (kcal <= 2400) return 'mid';
    if (kcal <= 3000) return 'high';
    return 'super';
}
export const BAND_LABELS: Record<DietBand, string> = {
    low:   'Low (≤1800)',
    mid:   'Mid (2000–2400)',
    high:  'High (2600–3000)',
    super: 'Super (3200+)',
};
