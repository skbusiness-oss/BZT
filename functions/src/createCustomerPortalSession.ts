/**
 * createCustomerPortalSession — callable function that opens a Stripe
 * Customer Portal session for the signed-in user.
 *
 * The Customer Portal is a Stripe-hosted UI where the customer can:
 *   - Cancel their subscription (immediate or at period end)
 *   - Update their payment method (new card, expired card)
 *   - View + download past invoices
 *   - Switch plans (if you allow it in the portal config)
 *
 * We don't build any of that UI ourselves. We just generate a one-shot
 * URL signed by Stripe and redirect the browser to it. After the user
 * is done they hit "Return to BioZackTeam" and land on the URL we
 * pass as `return_url`.
 *
 * Prerequisites in Stripe Dashboard
 * ─────────────────────────────────
 * One-time setup at
 *   https://dashboard.stripe.com/settings/billing/portal
 * to choose which features the portal exposes:
 *   ✓ Cancel subscriptions
 *   ✓ Update payment method
 *   ✓ View invoices
 *   ✓ Update billing address (optional)
 *   ✗ Switch plans (turn off — we want clean tiers)
 * Stripe complains on the first call if the portal isn't configured yet.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

const APP_ORIGIN = 'https://app.biozackteam.com';

export const createCustomerPortalSession = onCall(
    {
        secrets: [STRIPE_SECRET_KEY],
        region: 'us-central1',
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Must be signed in.');
        }
        const uid = request.auth.uid;

        // Pull the stripeCustomerId off the user doc. Set by the
        // webhook when they first paid — without it we can't open
        // a portal session for them.
        const userSnap = await getFirestore().doc(`users/${uid}`).get();
        const data = userSnap.data();
        const stripeCustomerId = data?.stripeCustomerId as string | undefined;

        if (!stripeCustomerId) {
            throw new HttpsError(
                'failed-precondition',
                'No Stripe customer linked to this account. If you paid, contact support — your account may not have completed setup.',
            );
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY.value());

        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                // Where to send them after they hit "Return to merchant"
                // in Stripe's portal. Sends them back to Settings so
                // they can see whatever they just changed reflected in
                // their account view.
                return_url: `${APP_ORIGIN}/settings`,
            });
            return { url: session.url };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error('[createCustomerPortalSession] threw:', msg);
            throw new HttpsError(
                'internal',
                `Could not open subscription manager: ${msg}`,
            );
        }
    },
);
