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

        // Read existing stripeCustomerId + stripeSubscriptionId from
        // the user doc — if they've paid before (e.g. they're an
        // existing Community subscriber upgrading to Coaching), reuse
        // the same Stripe customer so payment history stays
        // consolidated, AND we can switch their existing subscription
        // instead of opening a duplicate one.
        let stripeCustomerId: string | null = null;
        let existingSubId: string | null = null;
        try {
            const snap = await getFirestore().doc(`users/${uid}`).get();
            const data = snap.data();
            stripeCustomerId = (data?.stripeCustomerId as string | undefined) ?? null;
            existingSubId = (data?.stripeSubscriptionId as string | undefined) ?? null;
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

        // ── Branch 1: user already has an ACTIVE Stripe subscription ─
        // Switch the existing subscription's item to the new price
        // instead of creating a second sub. This is the right path
        // for community users upgrading to coaching — they keep the
        // same subscription ID and Stripe handles proration (charges
        // the prorated diff on the spot, no double-billing).
        //
        // Without this branch we'd hit checkout.sessions.create below
        // and end up with TWO active subscriptions on the same
        // customer ($35 + $149 = $184/mo instead of $149). The current
        // payment method on file gets charged automatically.
        if (existingSubId && stripeCustomerId) {
            try {
                const existingSub = await stripe.subscriptions.retrieve(existingSubId);
                if (existingSub.status === 'active' || existingSub.status === 'trialing' || existingSub.status === 'past_due') {
                    const itemId = existingSub.items.data[0]?.id;
                    const currentPriceId = existingSub.items.data[0]?.price?.id;

                    // No-op guard: if the user somehow lands here
                    // when they're already on the target price (e.g.,
                    // they clicked Upgrade as a Coaching user), don't
                    // re-update the sub.
                    if (currentPriceId === priceId) {
                        return { url: `${APP_ORIGIN}/upgrade/success?ref=already_on_plan` };
                    }
                    if (!itemId) {
                        throw new Error('Existing subscription has no items — cannot update.');
                    }

                    await stripe.subscriptions.update(existingSubId, {
                        items: [{ id: itemId, price: priceId }],
                        // Charge the prorated diff immediately so the
                        // upgrade feels instant (Stripe waits for next
                        // invoice otherwise).
                        proration_behavior: 'always_invoice',
                        // Mark the metadata for our webhook to know
                        // this came from an in-app upgrade.
                        metadata: { firebaseUid: uid, intent: 'upgrade-switch' },
                    });

                    // subscription.updated fires → our webhook role-sync
                    // flips users/{uid}.role to 'client' within seconds.
                    // AuthContext picks up the change in real time → UI
                    // unlocks coaching features automatically.
                    return { url: `${APP_ORIGIN}/upgrade/success?ref=switched` };
                }
                // Non-active sub (canceled / unpaid / incomplete) →
                // fall through to Checkout to create a fresh one.
            } catch (err) {
                // If the subscription lookup or update fails (e.g.
                // sub was deleted in Stripe but still referenced on
                // our user doc), fall through to Checkout. Better to
                // create a clean new sub than fail the upgrade entirely.
                // eslint-disable-next-line no-console
                console.warn('[createUpgradeCheckout] existing-sub update failed, falling through to Checkout:', err);
            }
        }

        // ── Branch 2: no existing active subscription ────────────────
        // Coach-created community accounts (no Stripe sub) or accounts
        // whose previous sub was canceled go through normal Checkout
        // to create a fresh subscription.
        try {
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                ...(stripeCustomerId
                    ? { customer: stripeCustomerId }
                    : email
                        ? { customer_email: email }
                        : {}),
                client_reference_id: uid,
                metadata: {
                    firebaseUid: uid,
                    intent: 'upgrade',
                },
                subscription_data: {
                    metadata: {
                        firebaseUid: uid,
                    },
                },
                success_url: `${APP_ORIGIN}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${APP_ORIGIN}/upgrade`,
                allow_promotion_codes: true,
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
