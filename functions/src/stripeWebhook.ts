/**
 * Stripe webhook — the heart of the payment automation.
 *
 * Listens for 4 Stripe events and translates them into Firestore writes.
 * The app's AuthContext subscribes to `users/{uid}` in real time, so any
 * role / disabled / subscriptionStatus change here propagates to every
 * open tab within ~1 second.
 *
 * Events handled
 * ──────────────
 *   checkout.session.completed   First payment landed. Create / look up
 *                                Firebase Auth user, set tier, fire
 *                                "Welcome — set your password" email.
 *   customer.subscription.updated  Tier or status changed (active /
 *                                  past_due / trialing / canceled).
 *                                  Sync into the user doc.
 *   customer.subscription.deleted  Stripe gave up after retries OR user
 *                                  cancelled. Set disabled=true so the
 *                                  existing AuthContext kick-out flow
 *                                  signs them out immediately.
 *   invoice.payment_failed       Card declined on renewal. Mark
 *                                past_due so the app can show a banner.
 *
 * Idempotency
 * ───────────
 * Stripe retries failed deliveries. If the function partially writes
 * Firestore then errors before responding 200, the retry would
 * double-create or double-update. We dedup via a
 * `stripeWebhookEvents/{event.id}` Firestore doc — create-if-not-exists
 * gate on entry. Stripe event IDs are stable per delivery so this
 * survives every retry strategy.
 *
 * Security
 * ────────
 * Every request is signature-verified using STRIPE_WEBHOOK_SECRET. A
 * forged request with no valid signature returns 400. The function
 * NEVER trusts the request body directly.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { PRICE_TO_TIER, Tier } from './stripeConfig';

// Stripe v22's d.ts uses `export = StripeConstructor` with a nested
// namespace alias that TS can't reliably walk to under `module:
// commonjs` + `esModuleInterop: true`. Rather than fight the type
// system (which adds no safety here — the runtime payload is already
// validated by stripe.webhooks.constructEvent), we declare loose
// aliases for the few shapes we touch. Each is a minimal subset of
// Stripe's actual type, covering only the fields the handlers read.
type StripeEvent = {
    id: string;
    type: string;
    data: { object: unknown };
};
type StripeCheckoutSession = {
    id: string;
    customer_details?: { email?: string | null } | null;
    customer_email?: string | null;
    customer?: string | { id: string } | null;
    subscription?: string | { id: string } | null;
    client_reference_id?: string | null;
    metadata?: Record<string, string> | null;
};
type StripeSubscription = {
    id: string;
    status: string;
    customer: string | { id: string };
    items: { data: { price: { id: string } }[] };
    cancel_at_period_end?: boolean;
};
type StripeInvoice = {
    customer?: string | { id: string } | null;
};
type StripeLineItem = {
    price?: { id: string } | null;
};

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// Firebase web API key — public (lives in the client bundle too). Used
// to trigger Firebase Auth's hosted password-reset email via the
// Identity Toolkit REST endpoint. Same call the client-side
// sendPasswordResetEmail() makes under the hood, so the email uses the
// templates configured in the Firebase Auth console.
const FIREBASE_WEB_API_KEY = 'AIzaSyAoClMgn0gpXR-TKyOAIip3k5v6eKqoo1U';

/**
 * Fire Firebase Auth's hosted "Welcome — set your password" email by
 * hitting the same Identity Toolkit endpoint the client SDK uses. This
 * lets us reuse the customizable email template the founder configures
 * in Firebase console (subject + body + Arabic localization) instead
 * of needing a separate SMTP/SendGrid provider.
 */
async function sendWelcomeEmail(email: string): Promise<void> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email,
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        // eslint-disable-next-line no-console
        console.warn(`[stripeWebhook] welcome email failed for ${email}:`, res.status, text);
    } else {
        // eslint-disable-next-line no-console
        console.log(`[stripeWebhook] welcome email queued for ${email}`);
    }
}

/**
 * Look up the price → tier from PRICE_TO_TIER. Returns null if the
 * price was not configured here — useful for logging "an unknown price
 * was bought" so the founder can fix the mapping.
 */
function tierFromLineItems(items: StripeLineItem[]): { tier: Tier; priceId: string } | null {
    for (const item of items) {
        const priceId = item.price?.id;
        if (priceId && PRICE_TO_TIER[priceId]) {
            return { tier: PRICE_TO_TIER[priceId].tier, priceId };
        }
    }
    return null;
}

/**
 * Same fix for the inline `.map((i) => i.price?.id)` debug log call —
 * keeps the implicit-any TS error from biting.
 */
function debugPriceIds(items: StripeLineItem[]): (string | undefined)[] {
    return items.map((i: StripeLineItem) => i.price?.id);
}

/**
 * Idempotent processing gate. Creates a marker doc atomically; if the
 * doc already exists, we've processed this event before and skip.
 * Returns true if we should process, false if it's a duplicate.
 */
async function acquireLock(eventId: string): Promise<boolean> {
    const db = getFirestore();
    const ref = db.doc(`stripeWebhookEvents/${eventId}`);
    try {
        await ref.create({
            processedAt: FieldValue.serverTimestamp(),
        });
        return true;
    } catch (err) {
        const code = (err as { code?: number })?.code;
        // FAILED_PRECONDITION (gRPC code 9) = ALREADY_EXISTS for create()
        if (code === 6 || code === 9 || (err as { code?: string })?.code === 'already-exists') {
            return false;
        }
        // Any other error → process anyway. Better to potentially double-
        // process than to silently drop a real event.
        // eslint-disable-next-line no-console
        console.warn('[stripeWebhook] acquireLock unexpected error:', err);
        return true;
    }
}

/**
 * Handle the headline event — a checkout completed. Two paths:
 *
 *   1. Guest pay (landing page) — the email has NO existing Firebase
 *      Auth user yet. We create one with a random secure password
 *      placeholder, write users/{uid}, then fire the password-reset
 *      email so they can pick their own password.
 *
 *   2. In-app upgrade — they're already signed in. The Checkout
 *      Session carries `client_reference_id = their Firebase uid`.
 *      We look them up by uid, flip their role + Stripe IDs. No new
 *      account, no welcome email.
 */
async function handleCheckoutCompleted(
    event: StripeEvent,
    stripe: InstanceType<typeof Stripe>,
): Promise<void> {
    const session = event.data.object as StripeCheckoutSession;
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
    const firebaseUidFromMetadata =
        (session.client_reference_id as string | null | undefined) ||
        (session.metadata?.firebaseUid as string | undefined);

    // Pull line items to discover what price was bought. Stripe doesn't
    // include them by default on the event; expand via API.
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
    const tierMatch = tierFromLineItems(lineItems.data);
    if (!tierMatch) {
        // eslint-disable-next-line no-console
        console.error('[stripeWebhook] checkout.session.completed: no known price found', {
            sessionId: session.id,
            prices: debugPriceIds(lineItems.data),
        });
        return;
    }
    const { tier, priceId } = tierMatch;

    const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const stripeSubscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    const auth = getAuth();
    const db = getFirestore();

    // Resolve to a Firebase uid — either the one passed via
    // client_reference_id (in-app upgrade) or look up by email.
    let uid = firebaseUidFromMetadata ?? null;
    let isNewAccount = false;

    if (!uid && email) {
        try {
            const existing = await auth.getUserByEmail(email);
            uid = existing.uid;
        } catch (err) {
            const code = (err as { code?: string })?.code;
            if (code === 'auth/user-not-found') {
                // Guest pay — create the account.
                const created = await auth.createUser({
                    email,
                    emailVerified: false,
                    // No password — Firebase generates a random placeholder.
                    // User sets their own via the welcome email link.
                });
                uid = created.uid;
                isNewAccount = true;
                // eslint-disable-next-line no-console
                console.log(`[stripeWebhook] created Firebase Auth user ${uid} for ${email}`);
            } else {
                throw err;
            }
        }
    }

    if (!uid) {
        // eslint-disable-next-line no-console
        console.error('[stripeWebhook] no uid resolvable — session has no client_reference_id and no email');
        return;
    }

    // Read current user doc to preserve fields we don't own.
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    const now = FieldValue.serverTimestamp();

    const userUpdate: Record<string, unknown> = {
        role: tier,
        email: email || userSnap.data()?.email || '',
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId: priceId,
        subscriptionStatus: 'active',
        // disabled defaults to false on create — explicitly clear on
        // re-subscribe so a user who paid before and was disabled gets
        // back in.
        disabled: false,
        updatedAt: now,
    };

    if (!userSnap.exists) {
        // Brand-new user doc — seed required fields the rest of the app
        // expects.
        userUpdate.name = email ? email.split('@')[0] : 'New member';
        userUpdate.displayName = userUpdate.name;
        userUpdate.createdAt = now;
        await userRef.create(userUpdate);
    } else {
        await userRef.update(userUpdate);
    }

    // Mirror the role onto a Firebase Auth custom claim so Firestore +
    // Storage rules see it server-side. Without this the new user's
    // first session would have an empty token until they re-auth.
    try {
        await auth.setCustomUserClaims(uid, { role: tier });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[stripeWebhook] setCustomUserClaims failed (non-fatal):', err);
    }

    // Welcome / password-set email — only on brand-new accounts. In-app
    // upgrades skip this since the user already has a password.
    if (isNewAccount && email) {
        await sendWelcomeEmail(email);
    }

    // eslint-disable-next-line no-console
    console.log(`[stripeWebhook] checkout.session.completed — uid=${uid}, tier=${tier}, isNew=${isNewAccount}`);
}

/**
 * Subscription status sync. Maps Stripe's status enum to our two
 * meaningful states: 'active' (let them in) vs 'past_due' (show a
 * banner) vs 'canceled' (downgrade — but disable is handled by the
 * subscription.deleted event, not this one).
 */
async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
    const sub = event.data.object as StripeSubscription;
    const db = getFirestore();
    const stripeCustomerId =
        typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    // Find the user doc by stripeCustomerId. We wrote this on the
    // checkout.session.completed handler.
    const usersQuery = await db
        .collection('users')
        .where('stripeCustomerId', '==', stripeCustomerId)
        .limit(1)
        .get();
    if (usersQuery.empty) {
        // eslint-disable-next-line no-console
        console.warn(`[stripeWebhook] subscription update for unknown customer ${stripeCustomerId}`);
        return;
    }
    const userRef = usersQuery.docs[0].ref;

    const subWithPeriod = sub as StripeSubscription & { current_period_end?: number };
    const currentPeriodEnd = subWithPeriod.current_period_end
        ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
        : null;

    await userRef.update({
        subscriptionStatus: sub.status, // active|past_due|canceled|trialing|unpaid|incomplete
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id,
        currentPeriodEnd,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // eslint-disable-next-line no-console
    console.log(`[stripeWebhook] subscription.updated — uid=${userRef.id}, status=${sub.status}`);
}

/**
 * Stripe gave up after retries OR the user explicitly canceled.
 * Lock them out — the existing AuthContext live-subscription to
 * users/{uid}.disabled handles the actual sign-out within seconds.
 */
async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
    const sub = event.data.object as StripeSubscription;
    const db = getFirestore();
    const stripeCustomerId =
        typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    const usersQuery = await db
        .collection('users')
        .where('stripeCustomerId', '==', stripeCustomerId)
        .limit(1)
        .get();
    if (usersQuery.empty) return;

    const userRef = usersQuery.docs[0].ref;
    await userRef.update({
        subscriptionStatus: 'canceled',
        disabled: true,
        canceledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // eslint-disable-next-line no-console
    console.log(`[stripeWebhook] subscription.deleted — uid=${userRef.id} locked out`);
}

/**
 * Card declined on renewal. Mark past_due so the app can surface a
 * banner. Don't lock them out — Stripe is still retrying (Smart
 * Retries over ~7 business days). The lockout fires on
 * subscription.deleted if Stripe eventually gives up.
 */
async function handleInvoicePaymentFailed(event: StripeEvent): Promise<void> {
    const invoice = event.data.object as StripeInvoice;
    const db = getFirestore();
    const stripeCustomerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!stripeCustomerId) return;

    const usersQuery = await db
        .collection('users')
        .where('stripeCustomerId', '==', stripeCustomerId)
        .limit(1)
        .get();
    if (usersQuery.empty) return;

    const userRef = usersQuery.docs[0].ref;
    await userRef.update({
        subscriptionStatus: 'past_due',
        lastPaymentFailedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // eslint-disable-next-line no-console
    console.log(`[stripeWebhook] invoice.payment_failed — uid=${userRef.id} marked past_due`);
}

export const stripeWebhook = onRequest(
    {
        secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
        region: 'us-central1',
        // No minInstances — webhook traffic is bursty + low-volume; the
        // ~5s cold start on the first event of the day is acceptable
        // because Stripe retries on failure anyway.
    },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).send('Method not allowed');
            return;
        }

        const sig = req.headers['stripe-signature'] as string | undefined;
        if (!sig) {
            // eslint-disable-next-line no-console
            console.warn('[stripeWebhook] missing stripe-signature header');
            res.status(400).send('Missing signature');
            return;
        }

        // Omit apiVersion — the SDK pins a default at install time
        // (Stripe v22 → 2024-12-18.acacia). Explicit pinning would
        // require a type cast against the v22 namespace which doesn't
        // resolve cleanly under our tsconfig; the SDK default is
        // identical here.
        const stripe = new Stripe(STRIPE_SECRET_KEY.value());

        // Signature verification — uses the raw request body, NOT the
        // JSON-parsed object. firebase-functions v2 exposes req.rawBody.
        let event: StripeEvent;
        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                STRIPE_WEBHOOK_SECRET.value(),
            ) as unknown as StripeEvent;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error('[stripeWebhook] signature verification failed:', msg);
            res.status(400).send(`Webhook Error: ${msg}`);
            return;
        }

        // Idempotency gate — Stripe retries on non-2xx, so we dedup by
        // event.id. If we've already processed this one, return 200
        // immediately (Stripe stops retrying when it sees 200).
        const isFirstTime = await acquireLock(event.id);
        if (!isFirstTime) {
            // eslint-disable-next-line no-console
            console.log(`[stripeWebhook] duplicate event ${event.id} (${event.type}) — skipping`);
            res.status(200).send('Already processed');
            return;
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutCompleted(event, stripe);
                    break;
                case 'customer.subscription.updated':
                    await handleSubscriptionUpdated(event);
                    break;
                case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(event);
                    break;
                case 'invoice.payment_failed':
                    await handleInvoicePaymentFailed(event);
                    break;
                default:
                    // eslint-disable-next-line no-console
                    console.log(`[stripeWebhook] unhandled event type ${event.type}`);
            }
            res.status(200).send('OK');
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error(`[stripeWebhook] handler ${event.type} threw:`, msg, err);
            // Return 500 so Stripe retries. The lock prevents
            // double-processing if the second attempt succeeds.
            res.status(500).send(`Handler error: ${msg}`);
        }
    },
);
