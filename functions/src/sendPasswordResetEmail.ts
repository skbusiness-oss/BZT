/**
 * sendPasswordResetEmail — callable Cloud Function that replaces
 * Firebase Auth's client-side `sendPasswordResetEmail()`.
 *
 * Why this exists:
 *   Firebase's client SDK ships with a hardcoded email template (the
 *   ugly "Hello, follow this link to reset your password" mail).
 *   It can be edited from the Firebase Console but the editor is
 *   limited to basic HTML and most styles get stripped in transit.
 *   Founders kept hitting it the wrong way: "this email looks like
 *   spam." For the brand to feel premium end-to-end, the password-
 *   reset moment can't break the spell.
 *
 *   This function:
 *     1. Generates a reset link via the Admin SDK (same link Firebase
 *        would have emailed itself) using `generatePasswordResetLink`.
 *     2. Sends a branded HTML email through Resend using that link.
 *     3. Returns success/failure to the caller.
 *
 *   The reset link still lands on Firebase's hosted reset page — we
 *   don't rebuild the reset UI itself. Just the email.
 *
 * Public visibility: this is unauthenticated by design — the user
 * hasn't signed in yet (they forgot their password). Per-email rate
 * limit prevents harassing-someone's-inbox abuse: ≤3 resets per
 * email address per 15 minutes. Below that, callers see
 * `resource-exhausted`.
 *
 * Privacy: we ALWAYS return success regardless of whether the email
 * actually exists in Firebase Auth. Otherwise the function becomes
 * an email-enumeration oracle ("which addresses have BioZackTeam
 * accounts"). The user just sees "if an account exists, an email is
 * on its way" either way.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { RESEND_API_KEY, sendEmail } from './emailService';
import { passwordResetEmail } from './emailTemplates';

const APP_ORIGIN = 'https://app.biozackteam.com';

/** Per-email rate limit — 3 reset attempts per 15 minutes. Keyed
 *  by the lowercased email so a vindictive user can't spam their
 *  ex's inbox by hitting the endpoint from different IPs. */
const RATE_LIMIT_WINDOW_SEC = 15 * 60;
const RATE_LIMIT_MAX = 3;

async function throttleByEmail(email: string): Promise<void> {
    const ref = getFirestore().doc(`rateLimits/email_reset_${email.replace(/[^a-z0-9]/g, '_')}`);
    const now = Date.now();
    const snap = await ref.get();
    const data = snap.data() as { count?: number; windowStart?: Timestamp } | undefined;
    const startMs = data?.windowStart?.toMillis() ?? 0;
    const expired = now - startMs >= RATE_LIMIT_WINDOW_SEC * 1000;

    if (expired) {
        await ref.set({
            count: 1,
            windowStart: FieldValue.serverTimestamp(),
            email,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return;
    }
    if ((data?.count ?? 0) >= RATE_LIMIT_MAX) {
        throw new HttpsError(
            'resource-exhausted',
            'Too many reset attempts for this email. Wait a few minutes and try again.',
        );
    }
    await ref.update({
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export const sendPasswordResetEmail = onCall(
    {
        secrets: [RESEND_API_KEY],
        region: 'us-central1',
        memory: '256MiB',
        invoker: 'public', // unauthenticated by design
    },
    async (request) => {
        const raw = (request.data ?? {}) as { email?: unknown };
        if (typeof raw.email !== 'string' || !raw.email.trim()) {
            throw new HttpsError('invalid-argument', 'email is required.');
        }
        const email = raw.email.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
        }

        // Rate limit BEFORE checking the user exists — otherwise the
        // throttle could be sidestepped by spamming addresses that
        // happen not to exist yet.
        await throttleByEmail(email);

        // Generate the actual reset link via Admin SDK. If the user
        // doesn't exist, this throws — we swallow it and return
        // success anyway so the function never confirms whether an
        // email is registered (anti-enumeration posture).
        try {
            const link = await getAuth().generatePasswordResetLink(email, {
                url: `${APP_ORIGIN}/login`,
                handleCodeInApp: false,
            });

            const { subject, html, text } = passwordResetEmail(link);
            const result = await sendEmail({ to: email, subject, html, text });

            if (!result.ok) {
                // eslint-disable-next-line no-console
                console.warn(`[sendPasswordResetEmail] Resend send failed for ${email}:`, result.error);
                // Still return ok — don't leak send failures to the
                // client. They'll know something's off when no email
                // arrives. Internal alerting (Sentry / log monitor)
                // can pick this up.
            }
        } catch (err) {
            const code = (err as { code?: string })?.code ?? '';
            // auth/user-not-found is the anti-enumeration case —
            // swallow it. Real errors get logged.
            if (code !== 'auth/user-not-found') {
                // eslint-disable-next-line no-console
                console.error('[sendPasswordResetEmail] generate link failed:', err);
            }
        }

        return { ok: true };
    },
);
