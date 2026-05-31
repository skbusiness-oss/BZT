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
import { RESEND_API_KEY, sendEmail } from './emailService';
import { welcomeEmail } from './emailTemplates';

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
    customer_details?: { email?: string | null; name?: string | null } | null;
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

/**
 * Send the post-payment "Welcome — set your password" email through
 * Resend with our branded HTML template, instead of Firebase's
 * default Identity-Toolkit-hosted ugly one.
 *
 * Mechanism:
 *   1. Generate a real reset link via the Admin SDK (same link
 *      Firebase would have emailed itself).
 *   2. Render the branded welcome HTML around that link.
 *   3. Send through Resend (see emailService.ts).
 *
 * Best-effort: failures are logged but don't break the webhook —
 * losing a welcome email is annoying but should never break the
 * surrounding Stripe processing. The user can always tap "Forgot
 * password" on /login to get a fresh reset link.
 */
async function sendWelcomeEmail(email: string, displayName?: string): Promise<void> {
    try {
        const link = await getAuth().generatePasswordResetLink(email, {
            url: 'https://app.biozackteam.com/login',
            handleCodeInApp: false,
        });
        const { subject, html, text } = welcomeEmail(link, displayName);
        const result = await sendEmail({ to: email, subject, html, text });
        if (!result.ok) {
            // eslint-disable-next-line no-console
            console.warn(`[stripeWebhook] welcome email send failed for ${email}:`, result.error);
        } else {
            // eslint-disable-next-line no-console
            console.log(`[stripeWebhook] welcome email queued for ${email} (id=${result.id})`);
        }
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[stripeWebhook] welcome email pipeline failed for ${email}:`, err);
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
 * Idempotent processing gate. Reads (or creates) a marker doc with a
 * `status` field. We process unless the doc says we've already
 * SUCCEEDED — meaning a failed handler can be re-attempted later,
 * but a successful one is never re-run on Stripe retries.
 *
 * Returns 'process' to indicate the caller should run the handler, or
 * 'skip' to indicate the event was already handled successfully.
 *
 * BUGFIX: the original implementation marked every event "processed"
 * before the handler ran. If the handler threw (e.g. 401 from Stripe
 * API), the function returned 500 → Stripe retried → this gate said
 * "already processed" → handler never re-ran → the event was lost
 * forever. We saw this exact failure mode on the first test purchase
 * (evt_1TZtYDGzjEKDFMPcgSv1ZvgP). Now we ONLY mark the doc as
 * successfully processed AFTER the handler completes — failed
 * attempts leave a 'failed' status that Stripe's retry will overwrite
 * back to 'processed' once the underlying issue is fixed.
 */
type LockDecision = 'process' | 'skip';
async function acquireLock(eventId: string, eventType: string): Promise<LockDecision> {
    const db = getFirestore();
    const ref = db.doc(`stripeWebhookEvents/${eventId}`);
    const snap = await ref.get();
    if (snap.exists) {
        const data = snap.data() ?? {};
        if (data.status === 'processed') {
            // Already succeeded — don't run the handler again.
            return 'skip';
        }
        // status was 'processing' or 'failed' — let the retry try again.
        // We update the doc to record this new attempt.
        await ref.set({
            status: 'processing',
            eventType,
            attempts: FieldValue.increment(1),
            lastAttemptAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return 'process';
    }
    // First time we've seen this event.
    await ref.create({
        status: 'processing',
        eventType,
        attempts: 1,
        firstSeenAt: FieldValue.serverTimestamp(),
        lastAttemptAt: FieldValue.serverTimestamp(),
    });
    return 'process';
}

/**
 * Mark a previously-locked event as fully processed. Called once the
 * handler returns without throwing. Any future retries for the same
 * event ID become no-ops.
 */
async function markProcessed(eventId: string): Promise<void> {
    const db = getFirestore();
    await db.doc(`stripeWebhookEvents/${eventId}`).set({
        status: 'processed',
        processedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
}

/**
 * Record a handler failure so the dedup doc shows why this event is
 * stuck. Stripe will retry; on the next attempt acquireLock sees
 * status='failed' and lets the handler run again.
 */
async function markFailed(eventId: string, err: unknown): Promise<void> {
    const db = getFirestore();
    await db.doc(`stripeWebhookEvents/${eventId}`).set({
        status: 'failed',
        lastErrorMessage: err instanceof Error ? err.message : String(err),
        lastFailedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
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
// Canonical coach UID (single-coach launch). Matches the hardcoded
// staff anchor in firestore.rules. New self-serve coaching clients are
// assigned to this coach so they surface in his roster immediately.
const COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3';

/**
 * Ensure a coaching client has their clients/{uid} record.
 *
 * The webhook assigns users/{uid}.role='client' on a coaching purchase,
 * but the ClientDashboard + weekly check-in flow need a SEPARATE
 * clients/{uid} doc (onboarding, check-ins, program, coach link).
 * Without it a self-serve $149 buyer lands on "Client record not found"
 * and never appears in the coach's roster.
 *
 * Idempotent + non-destructive: if the doc already exists (coach made
 * it, OR a prior webhook attempt did) we leave it untouched so we never
 * clobber coach-managed data. Only ever CREATES the minimal onboarding
 * shape — mirrors the coach's AddClient modal so the buyer lands on the
 * normal onboarding form (isOnboarding:true) and shows up in My Clients.
 */
async function ensureClientDoc(
    uid: string,
    opts: { name?: string | null; email?: string | null },
): Promise<void> {
    const db = getFirestore();
    const clientRef = db.doc(`clients/${uid}`);
    const snap = await clientRef.get();
    if (snap.exists) return; // never clobber an existing client record

    const name = (opts.name || opts.email?.split('@')[0] || 'New member').trim();
    try {
        await clientRef.create({
            userId: uid,
            coachId: COACH_UID,
            name,
            email: (opts.email || '').toLowerCase().trim(),
            category: 'health',   // neutral default; coach can recategorize
            currentWeek: 0,
            programLength: 12,
            needsReview: false,
            isOnboarding: true,
            createdAt: FieldValue.serverTimestamp(),
        });
        // eslint-disable-next-line no-console
        console.log(`[stripeWebhook] created clients/${uid} (coaching onboarding)`);
    } catch (e) {
        // ALREADY_EXISTS (gRPC code 6) — a concurrent webhook beat us to
        // it. That's the desired end state, so swallow it; re-throw
        // anything else so Stripe retries.
        const code = (e as { code?: number | string })?.code;
        if (code !== 6 && code !== 'already-exists') throw e;
    }
}

async function handleCheckoutCompleted(
    event: StripeEvent,
    stripe: InstanceType<typeof Stripe>,
): Promise<void> {
    const session = event.data.object as StripeCheckoutSession;
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
    const customerName = (session.customer_details?.name || '').trim() || null;
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
        // Use the customer's display name (from Stripe billing) so the
        // greeting feels personal: "Welcome, Sami." instead of the
        // generic "Welcome to BioZackTeam.". Falls back gracefully
        // if Stripe didn't capture a name.
        await sendWelcomeEmail(email, customerName ?? undefined);
    }

    // Coaching purchase → ensure the clients/{uid} record exists so the
    // buyer lands on the onboarding form (not "Client record not found")
    // and appears in the coach's roster. Community purchases never need
    // this — their dashboard lives entirely on the users doc. Placed
    // LAST + idempotent: if this throws, Stripe retries and re-runs it
    // without re-sending the welcome email (isNewAccount is false on the
    // retry once the Auth user already exists).
    if (tier === 'client') {
        await ensureClientDoc(uid, { name: customerName, email });
    }

    // eslint-disable-next-line no-console
    console.log(`[stripeWebhook] checkout.session.completed — uid=${uid}, tier=${tier}, isNew=${isNewAccount}`);
}

/**
 * Subscription status sync. Maps Stripe's status enum to our two
 * meaningful states: 'active' (let them in) vs 'past_due' (show a
 * banner) vs 'canceled' (downgrade — but disable is handled by the
 * subscription.deleted event, not this one).
 *
 * ALSO syncs role when the customer changed price via the Customer
 * Portal (e.g. "Allow customers to update subscriptions" enabled,
 * customer upgrades from Community Monthly → Coaching Monthly). The
 * portal fires subscription.updated NOT checkout.session.completed,
 * so the role-sync logic from the checkout handler doesn't run.
 * Without this branch the customer would pay the new price but not
 * get the new role — the exact bug enabling portal-update would
 * silently introduce.
 */
async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
    const sub = event.data.object as StripeSubscription;
    const db = getFirestore();
    const auth = getAuth();
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
    const userDocSnap = usersQuery.docs[0];
    const userRef = userDocSnap.ref;
    const currentRole = (userDocSnap.data()?.role as Tier | undefined) ?? null;

    const subWithPeriod = sub as StripeSubscription & { current_period_end?: number };
    const currentPeriodEnd = subWithPeriod.current_period_end
        ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
        : null;

    // Role sync — look up the new price's tier. If the user switched
    // plans (e.g. via Customer Portal "update subscription"), this
    // moves them between community ↔ client cleanly. Skips if the
    // new price isn't in our mapping (logs a warning so the founder
    // knows to update stripeConfig.ts) and skips if the role hasn't
    // actually changed.
    const newPriceId = sub.items.data[0]?.price.id;
    const newPriceMeta = newPriceId ? PRICE_TO_TIER[newPriceId] : undefined;

    const roleUpdate: Record<string, unknown> = {};
    if (newPriceMeta && newPriceMeta.tier !== currentRole) {
        roleUpdate.role = newPriceMeta.tier;
        // Mirror to Firebase Auth custom claim so Firestore + Storage
        // rules pick up the new tier server-side without waiting for
        // the user to re-auth.
        try {
            await auth.setCustomUserClaims(userDocSnap.id, { role: newPriceMeta.tier });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[stripeWebhook] setCustomUserClaims on plan switch failed:', err);
        }
        // eslint-disable-next-line no-console
        console.log(`[stripeWebhook] role switched ${currentRole}→${newPriceMeta.tier} via plan change (uid=${userDocSnap.id})`);
    } else if (newPriceId && !newPriceMeta) {
        // eslint-disable-next-line no-console
        console.warn(`[stripeWebhook] subscription.updated: unknown new price ${newPriceId} — role NOT synced. Add this priceId to stripeConfig.ts.`);
    }

    await userRef.update({
        ...roleUpdate,
        subscriptionStatus: sub.status, // active|past_due|canceled|trialing|unpaid|incomplete
        stripeSubscriptionId: sub.id,
        stripePriceId: newPriceId,
        currentPeriodEnd,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // If the effective role is now 'client' (e.g. a community member
    // upgraded to coaching via the in-app Upgrade or the Customer
    // Portal — both fire subscription.updated, NOT checkout.completed),
    // ensure their coaching record exists. Idempotent: a no-op for
    // users who already have one.
    const effectiveRole = (roleUpdate.role as Tier | undefined) ?? currentRole;
    if (effectiveRole === 'client') {
        const d = userDocSnap.data();
        await ensureClientDoc(userDocSnap.id, {
            name: (d?.name as string | undefined) ?? null,
            email: (d?.email as string | undefined) ?? null,
        });
    }

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
        secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY],
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
        // event.id. SUCCESSFULLY-processed events return 200 instantly
        // (stops Stripe retrying). FAILED-or-in-progress events get
        // another attempt — the previous version marked everything
        // "processed" too early and a transient failure became
        // permanent.
        const decision = await acquireLock(event.id, event.type);
        if (decision === 'skip') {
            // eslint-disable-next-line no-console
            console.log(`[stripeWebhook] duplicate event ${event.id} (${event.type}) — already processed successfully, skipping`);
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
            // Mark as successfully processed AFTER the handler returns
            // cleanly — only then do we tell Stripe to stop retrying.
            await markProcessed(event.id);
            res.status(200).send('OK');
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // eslint-disable-next-line no-console
            console.error(`[stripeWebhook] handler ${event.type} threw:`, msg, err);
            // Record the failure so the dedup doc reflects what
            // happened. The status stays 'failed' so the next Stripe
            // retry will be allowed to re-run the handler (vs the old
            // bug where it got silently skipped as "duplicate").
            await markFailed(event.id, err).catch(() => { /* non-fatal */ });
            res.status(500).send(`Handler error: ${msg}`);
        }
    },
);
