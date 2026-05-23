/**
 * linkClientToStripe — coach-initiated handoff for clients who paid
 * the coach in cash (outside the platform) and need to be migrated
 * to recurring Stripe billing.
 *
 * The problem this solves
 * ───────────────────────
 * Founder has existing clients who paid in cash for an N-month coaching
 * package. They're now being onboarded into the platform. We want them
 * to:
 *   1. Have full app access starting today (they've already paid).
 *   2. Be billed automatically by Stripe starting on the day their
 *      cash-paid period ends, so the coach never has to chase a
 *      payment again.
 *
 * Standard Stripe pattern for this: create a subscription in TRIALING
 * status with `trial_end` set to the cutover date. While trialing, the
 * subscription counts as "active" for our access gating (we accept both
 * 'active' and 'trialing' in the AuthContext checks), so the client has
 * full access. When `trial_end` arrives, Stripe automatically charges
 * the saved card and transitions the subscription to 'active'.
 *
 * Flow
 * ────
 *   1. Coach opens the Subscriptions admin page → "Link existing client"
 *   2. Picks the client, the plan (community/coaching), and the date
 *      auto-billing should start
 *   3. App calls this function with { clientUid, priceId, billingStartDate }
 *   4. Function creates (or reuses) a Stripe Customer for the client,
 *      generates a Checkout Session in subscription mode with
 *      `subscription_data.trial_end` set to the billing-start date,
 *      and returns the session URL
 *   5. Coach copies the URL and sends it to the client via WhatsApp /
 *      SMS / in-app message
 *   6. Client opens the URL, enters their card, the subscription is
 *      created in 'trialing' status
 *   7. Our existing stripeWebhook handles checkout.session.completed
 *      → writes stripeCustomerId, stripeSubscriptionId,
 *        subscriptionStatus='trialing', etc to users/{clientUid}
 *      AND flips role to match the price tier (already wired up).
 *   8. On `trial_end`, Stripe charges + fires customer.subscription.updated
 *      with status='active'. Webhook already handles status updates.
 *
 * Inputs
 *   clientUid          string  — uid of the user to link
 *   priceId            string  — must be one of PRICE_TO_TIER's keys
 *   billingStartDate   string  — ISO date (e.g. "2026-08-23"). Cannot
 *                                be in the past. Stripe requires
 *                                trial_end at least 48 hours in the
 *                                future for live mode.
 *   note?              string  — optional internal note, written to
 *                                Stripe subscription metadata + audit log
 *
 * Returns { url: string, customerId: string, expiresAt: number }
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { PRICE_TO_TIER } from './stripeConfig';
import { throttle } from './rateLimit';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const APP_ORIGIN = 'https://app.biozackteam.com';

/** Stripe requires trial_end to be at least 48 hours in the future
 *  for live mode. We enforce 24h client-side as a UX hint and let
 *  Stripe enforce the hard 48h limit if the coach somehow gets
 *  closer (gives a clearer error). */
const MIN_TRIAL_OFFSET_MS = 24 * 60 * 60 * 1000; // 24h

async function callerIsCoach(uid: string): Promise<boolean> {
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'coach' || claims?.role === 'admin') return true;
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    return role === 'coach' || role === 'admin';
}

interface LinkInput {
    clientUid?: unknown;
    priceId?: unknown;
    billingStartDate?: unknown;
    note?: unknown;
}

export const linkClientToStripe = onCall(
    {
        secrets: [STRIPE_SECRET_KEY],
        region: 'us-central1',
        memory: '256MiB',
        invoker: 'public',
    },
    async (request) => {
        // ── Auth gate ────────────────────────────────────────────
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        // Tight rate limit — this is an admin operation, not a hot
        // path. 20/hour gives plenty of room for a bulk-migration
        // session, hard stop on a leaked session script-spamming.
        await throttle(callerUid, 'linkClientToStripe', { maxPerWindow: 20, windowSec: 3600 });
        if (!(await callerIsCoach(callerUid))) {
            throw new HttpsError('permission-denied', 'Only coaches can link clients to Stripe.');
        }

        // ── Input validation ─────────────────────────────────────
        const { clientUid, priceId, billingStartDate, note } = (request.data ?? {}) as LinkInput;

        if (typeof clientUid !== 'string' || !clientUid.trim()) {
            throw new HttpsError('invalid-argument', 'clientUid is required.');
        }
        if (typeof priceId !== 'string' || !PRICE_TO_TIER[priceId]) {
            throw new HttpsError('invalid-argument', 'priceId is not a recognised plan.');
        }
        if (typeof billingStartDate !== 'string' || !billingStartDate) {
            throw new HttpsError('invalid-argument', 'billingStartDate is required (ISO date).');
        }

        const startMs = Date.parse(billingStartDate);
        if (!Number.isFinite(startMs)) {
            throw new HttpsError('invalid-argument', 'billingStartDate could not be parsed as a date.');
        }
        const minStartMs = Date.now() + MIN_TRIAL_OFFSET_MS;
        if (startMs < minStartMs) {
            throw new HttpsError(
                'invalid-argument',
                'billingStartDate must be at least 24 hours in the future.',
            );
        }
        // Stripe trial_end is in seconds, not ms.
        const trialEndUnix = Math.floor(startMs / 1000);

        // ── Look up the client ──────────────────────────────────
        const clientDocRef = getFirestore().doc(`users/${clientUid}`);
        const clientSnap = await clientDocRef.get();
        if (!clientSnap.exists) {
            throw new HttpsError('not-found', 'Client account does not exist.');
        }
        const clientData = clientSnap.data() ?? {};
        const clientEmail = (clientData.email as string | undefined) ?? '';
        const clientName  = (clientData.displayName as string | undefined)
                            || (clientData.name as string | undefined)
                            || '';

        if (!clientEmail) {
            throw new HttpsError('failed-precondition', 'Client has no email on file — cannot create a Stripe customer.');
        }

        // Block re-linking if they already have an active sub. The
        // coach should switch plans via the existing portal /
        // upgrade flow instead of opening a parallel subscription.
        const existingSubStatus = clientData.subscriptionStatus as string | undefined;
        const existingSubId     = clientData.stripeSubscriptionId as string | undefined;
        if (existingSubId && (existingSubStatus === 'active' || existingSubStatus === 'trialing')) {
            throw new HttpsError(
                'failed-precondition',
                `Client already has an ${existingSubStatus} subscription. Cancel or use the customer portal to change plans first.`,
            );
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY.value());

        // ── Resolve / create Stripe customer ─────────────────────
        let stripeCustomerId = clientData.stripeCustomerId as string | undefined;
        if (!stripeCustomerId) {
            try {
                const customer = await stripe.customers.create({
                    email: clientEmail,
                    name: clientName || undefined,
                    metadata: {
                        firebaseUid: clientUid,
                        linkedByCoachUid: callerUid,
                        linkSource: 'coach-handoff',
                    },
                });
                stripeCustomerId = customer.id;
                // Persist immediately so the webhook can find the user
                // by stripeCustomerId on the imminent
                // checkout.session.completed event.
                await clientDocRef.set(
                    { stripeCustomerId, updatedAt: FieldValue.serverTimestamp() },
                    { merge: true },
                );
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[linkClientToStripe] customer create failed:', err);
                throw new HttpsError('internal', 'Could not create Stripe customer.');
            }
        }

        // ── Create Checkout Session ──────────────────────────────
        // Subscription mode with trial_end = the chosen billing start
        // date. While trialing, the subscription is in 'trialing'
        // status — our access gating treats that as active, so the
        // client has full app access during the cash-paid window.
        //
        // trial_settings.end_behavior.missing_payment_method = 'cancel'
        // means if the client fills out Checkout BUT removes their
        // card before trial_end somehow, the subscription will be
        // canceled instead of silently failing to charge.
        try {
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer: stripeCustomerId,
                line_items: [{ price: priceId, quantity: 1 }],
                subscription_data: {
                    trial_end: trialEndUnix,
                    trial_settings: {
                        end_behavior: {
                            missing_payment_method: 'cancel',
                        },
                    },
                    metadata: {
                        firebaseUid: clientUid,
                        linkedByCoachUid: callerUid,
                        linkSource: 'coach-handoff',
                        ...(typeof note === 'string' && note.trim() ? { note: note.trim().slice(0, 480) } : {}),
                    },
                },
                client_reference_id: clientUid,
                // Most checkout features default to off for handoff —
                // we want the smoothest possible card capture.
                allow_promotion_codes: false,
                success_url: `${APP_ORIGIN}/welcome?ref=stripe-handoff`,
                cancel_url:  `${APP_ORIGIN}/login?ref=stripe-handoff-cancel`,
            });

            // ── Audit log ────────────────────────────────────────
            await getFirestore().collection('auditLog').add({
                action: 'linkClientToStripe',
                actorUid: callerUid,
                target: clientUid,
                priceId,
                tier: PRICE_TO_TIER[priceId].tier,
                billingStartDate,
                trialEndUnix,
                sessionId: session.id,
                stripeCustomerId,
                createdAt: FieldValue.serverTimestamp(),
            }).catch((err) => {
                // eslint-disable-next-line no-console
                console.warn('[linkClientToStripe] audit log write failed (non-fatal):', err);
            });

            return {
                url: session.url ?? '',
                customerId: stripeCustomerId,
                expiresAt: session.expires_at, // unix seconds — Checkout sessions live ~24h
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error('[linkClientToStripe] session create failed:', msg);
            throw new HttpsError('internal', `Could not create Checkout session: ${msg}`);
        }
    },
);
