/**
 * Cover-image helper for the diet catalog.
 *
 * Maps each plan's calorie target to one of five visual tiers, so the browse
 * grid teaches the user "this band = this style of meal" at a glance. Each
 * tier resolves to a single static JPEG under public/diets/covers/, generated
 * once via scripts/generateDietCovers.mjs (Unsplash API).
 *
 * Distinct from `dietBand` in src/lib/dietCalculator.ts — that has 4 buckets
 * tuned for the filter chips (low|mid|high|super, coarser bands chosen for
 * filter UX). Cover tiers are 5 buckets tuned for visual variety on the grid.
 * The split is intentional; don't merge.
 */
export type CoverTier = 'lean' | 'balanced' | 'highProtein' | 'performance' | 'athlete';

export function coverTier(kcal: number): CoverTier {
    if (kcal <= 1600) return 'lean';
    if (kcal <= 2000) return 'balanced';
    if (kcal <= 2600) return 'highProtein';
    if (kcal <= 3000) return 'performance';
    return 'athlete';
}

/** Public URL for the tier's cover image. Served from /public/diets/covers/. */
export function coverUrl(kcal: number): string {
    return `/diets/covers/tier-${coverTier(kcal)}.jpg`;
}
