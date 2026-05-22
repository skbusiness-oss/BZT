/**
 * Stripe price → tier mapping.
 *
 * The webhook reads each completed Checkout Session's `line_items[].price.id`
 * and looks the value up here to decide what role to assign in
 * `users/{uid}.role` for the buyer.
 *
 * These 3 IDs are the live-mode prices the founder created in the Stripe
 * dashboard (sent via chat 2026-05-22). They're stable across deploys —
 * Stripe price IDs don't rotate unless the product is intentionally
 * archived and recreated.
 *
 * If a future plan is added (e.g. quarterly billing, founding-rate
 * yearly renewal at $299), append a new entry here and the webhook picks
 * it up automatically.
 */

export type Tier = 'community' | 'client';
export type BillingInterval = 'month' | 'year';

export interface PriceMeta {
    /** Firestore role this price maps to. */
    tier: Tier;
    /** Billing interval — used by the Subscriptions admin page so the
     *  coach can see "monthly" vs "yearly" at a glance. */
    interval: BillingInterval;
    /** Display label used in emails + admin views. */
    label: string;
    /** USD price for human-readable surfaces (admin page, push
     *  notification body). Stripe is still the source of truth on
     *  what was actually charged. */
    amountUsd: number;
}

export const PRICE_TO_TIER: Record<string, PriceMeta> = {
    // Community Monthly — $35
    'price_1TVXaOGzjEKDFMPckyGGCoLB': {
        tier: 'community',
        interval: 'month',
        label: 'Community Monthly',
        amountUsd: 35,
    },
    // Community Yearly Founding — $199
    'price_1TVXbdGzjEKDFMPcjbwSIKOW': {
        tier: 'community',
        interval: 'year',
        label: 'Community Yearly',
        amountUsd: 199,
    },
    // Coaching Monthly with Med — $149
    'price_1TVXcWGzjEKDFMPc9UncdZId': {
        tier: 'client',
        interval: 'month',
        label: 'Coaching Monthly',
        amountUsd: 149,
    },
};

/**
 * Reverse lookup: given a target tier + interval, find the price ID.
 * Used by `createUpgradeCheckout` to generate a session for the
 * coaching plan when an in-app community user taps Upgrade.
 */
export function priceIdFor(tier: Tier, interval: BillingInterval = 'month'): string | null {
    for (const [priceId, meta] of Object.entries(PRICE_TO_TIER)) {
        if (meta.tier === tier && meta.interval === interval) return priceId;
    }
    return null;
}
