/**
 * Frontend mirror of functions/src/stripeConfig.ts — same 3 live-mode
 * Stripe price IDs mapped to human-readable labels for the coach's
 * Subscriptions admin page.
 *
 * Kept in two places (functions/ vs src/) because the build setups
 * don't share code — functions/ compiles to its own lib/ folder.
 * Tiny and stable so the duplication cost is near zero. If a new
 * price ID is ever added, update BOTH files.
 */

export interface StripePriceMeta {
    tier: 'community' | 'client';
    interval: 'month' | 'year';
    label: string;
    amountUsd: number;
}

export const STRIPE_PRICE_META: Record<string, StripePriceMeta> = {
    'price_1TVXaOGzjEKDFMPckyGGCoLB': {
        tier: 'community',
        interval: 'month',
        label: 'Community Monthly',
        amountUsd: 35,
    },
    'price_1TVXbdGzjEKDFMPcjbwSIKOW': {
        tier: 'community',
        interval: 'year',
        label: 'Community Yearly',
        amountUsd: 199,
    },
    'price_1TVXcWGzjEKDFMPc9UncdZId': {
        tier: 'client',
        interval: 'month',
        label: 'Coaching Monthly',
        amountUsd: 149,
    },
};

export function describePriceId(priceId: string | undefined): string {
    if (!priceId) return '—';
    return STRIPE_PRICE_META[priceId]?.label ?? priceId.slice(0, 16) + '…';
}
