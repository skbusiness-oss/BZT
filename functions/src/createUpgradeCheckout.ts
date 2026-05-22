/**
 * createUpgradeCheckout — callable function used by the in-app Upgrade
 * page to generate a Stripe Checkout Session for the signed-in user.
 *
 * Why this exists (and the static Payment Link doesn't fit):
 *
 * The 3 Payment Links on the landing page are static — Stripe can't
 * pre-fill them with the Firebase user's email or attach a UID for
 * the webhook to read. That's fine for guest signups (we look up the
 * user by email after the fact), but for an in-app upgrade we ALREADY
 * know who the user is. Passing their UID via `client_reference_id`
 * lets the webhook flip their existing account's role without any
 * email matching ambiguity.
 *
 * Flow
 * ────
 *   1. Community user taps "Start coaching with Med" on /upgrade
 *   2. App calls this function
 *   3. We generate a one-shot Stripe Checkout Session pre-filled with
 *      their email + UID, pointing at the coaching priceId
 *   4. Return the session URL
 *   5. App redirects browser to the session URL
 *   6. User pays
 *   7. Stripe fires checkout.session.completed → our webhook flips
 *      users/{uid}.role to 'client' + sets Stripe IDs
 *   8. Stripe redirects them to /upgrade/success — the app's
 *      AuthContext sees the role flip and unlocks coaching features
 *      in real time
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import Stripe from 'stripe';
import { priceIdFor } from './stripeConfig';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

// Hardcoded app origin — Stripe needs absolute URLs for success/cancel.
// (Could be pulled from a config doc but it's stable so inlining keeps
// the cold-start path cheap.)
const APP_ORIGIN = 'https://app.biozackteam.com';

export const createUpgradeCheckout = onCall(
    {
        secrets: [STRIPE_SECRET_KEY],
        region: 'us-central1',
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Must be signed in to upgrade.');
        }
        const uid = request.auth.uid;

        // Look up the user's email from Firebase Auth (most trustworthy
        // source) so we can pre-fill Stripe Checkout and the webhook
        // can find them by stripeCustomerId on subsequent events.
        let email = '';
        try {
            const userRecord = await getAuth().getUser(uid);
            email = userRecord.email ?? '';
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[createUpgradeCheckout] could not load Auth user:', err);
        }

        // Read existing stripeCustomerId from the user doc — if they've
        // paid before (e.g. they're an existing Community subscriber
        // upgrading to Coaching), reuse the same Stripe customer so
        // payment history stays consolidated.
        let stripeCustomerId: string | null = null;
        try {
            const snap = await getFirestore().doc(`users/${uid}`).get();
            const data = snap.data();
            stripeCustomerId = (data?.stripeCustomerId as string | undefined) ?? null;
            if (!email && data?.email) email = String(data.email);
        } catch {
            // non-fatal — Stripe will create a new customer
        }

        const priceId = priceIdFor('client', 'month');
        if (!priceId) {
            throw new HttpsError(
                'failed-precondition',
                'Coaching plan price is not configured. Contact support.',
            );
        }

        // Stripe v22 pins an apiVersion default — no need to set it.
        const stripe = new Stripe(STRIPE_SECRET_KEY.value());

        try {
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                // If we already know this user's Stripe customer ID,
                // attach it so the new sub joins their existing payment
                // history. Otherwise prefill the email so Stripe
                // creates a customer with the right address.
                ...(stripeCustomerId
                    ? { customer: stripeCustomerId }
                    : email
                        ? { customer_email: email }
                        : {}),
                // client_reference_id flows back to the webhook so we
                // can update the EXACT Firebase account that initiated
                // this session — no email-matching ambiguity.
                client_reference_id: uid,
                metadata: {
                    firebaseUid: uid,
                    intent: 'upgrade',
                },
                // Tell Stripe to record a subscription_data.metadata too
                // so it surfaces on the subscription object itself for
                // later events.
                subscription_data: {
                    metadata: {
                        firebaseUid: uid,
                    },
                },
                success_url: `${APP_ORIGIN}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${APP_ORIGIN}/upgrade`,
                // Allow promo codes — useful if the founder wants to
                // hand out launch discounts later. No code added today,
                // just the box on the checkout page.
                allow_promotion_codes: true,
                // Send the user back to their billing portal after the
                // success page if they need to update payment.
                billing_address_collection: 'auto',
            });

            return { url: session.url };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error('[createUpgradeCheckout] stripe.checkout.sessions.create threw:', msg);
            throw new HttpsError('internal', `Stripe checkout could not be created: ${msg}`);
        }
    },
);
