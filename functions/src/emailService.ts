/**
 * emailService — thin wrapper around Resend's REST API.
 *
 * Why Resend over SendGrid / Mailgun / AWS SES:
 *   - Free tier covers 3,000 emails/month (~10x what a young SaaS
 *     sends from auth flows alone). No credit card required.
 *   - Same posture as Stripe: API-first, opinionated defaults,
 *     readable error responses. No XML, no SOAP, no AWS console.
 *   - Domain verification via DNS records the founder can add at
 *     their registrar in <5 minutes. After that, mail flows.
 *   - Modern reputation: deliverability into Gmail + iCloud inboxes
 *     is reliable out of the box. SendGrid's free tier is the
 *     classic Hotmail-spam-folder destination.
 *
 * Why we hit Resend's REST endpoint directly instead of pulling in
 * the @resend/node SDK:
 *   - One less npm dependency in the Cloud Functions bundle
 *   - The SDK is a thin fetch wrapper anyway
 *   - Easier to swap providers later if we ever need to (Postmark,
 *     SES) — only this file changes.
 */
import { defineSecret } from 'firebase-functions/params';

export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

/** What address shows up in the recipient's "From" line.
 *  We send FROM a real, monitored mailbox (support@) rather than a
 *  noreply@ — a reply-able sender scores better with spam filters and,
 *  more importantly, replies are a strong positive reputation signal
 *  that helps our (new, cold) domain land in the inbox. replyTo is the
 *  same address so any reply naturally goes to a watched mailbox. */
const FROM_ADDRESS = 'BioZackTeam <support@biozackteam.com>';
const REPLY_TO     = 'support@biozackteam.com';

export interface SendEmailInput {
    /** Recipient email address. */
    to: string;
    /** Subject line — shown in the inbox preview. */
    subject: string;
    /** Full HTML body. Caller is responsible for inlining all CSS
     *  and using table layouts where Outlook compatibility matters. */
    html: string;
    /** Optional plain-text fallback for clients that can't render
     *  HTML (or for spam-filter scoring). Resend auto-generates one
     *  from the HTML if omitted, but explicit is better. */
    text?: string;
}

export interface SendEmailResult {
    ok: boolean;
    id?: string;        // Resend's message id on success
    error?: string;     // Human-readable error on failure
    status?: number;    // HTTP status code if non-2xx
}

/**
 * Send an email through Resend. Returns a result object instead of
 * throwing so callers (webhook handlers especially) can degrade
 * gracefully — losing an email is annoying but should never break
 * the surrounding business logic.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = RESEND_API_KEY.value();
    if (!apiKey) {
        return { ok: false, error: 'RESEND_API_KEY secret is not configured.' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_ADDRESS,
                to: [input.to],
                reply_to: REPLY_TO,
                subject: input.subject,
                html: input.html,
                ...(input.text ? { text: input.text } : {}),
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            // eslint-disable-next-line no-console
            console.warn(`[emailService] Resend rejected: ${res.status}`, body.slice(0, 400));
            return { ok: false, status: res.status, error: body.slice(0, 400) };
        }

        const data = await res.json() as { id?: string };
        return { ok: true, id: data.id };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error('[emailService] network error sending email:', msg);
        return { ok: false, error: msg };
    }
}
