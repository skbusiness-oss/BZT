/**
 * Centralised error reporter. Logs to console (dev visibility) AND ships
 * to Sentry (production observability). One call site so we never forget
 * to do both.
 *
 *   reportError('AcademyContext.courses', err, { tier: 'community' });
 *
 * The `source` string becomes both the console prefix and a Sentry tag
 * — so a Sentry alert tells you instantly *which* listener / call site
 * failed without having to triage a stack trace.
 *
 * Permission-denied filtering: Firestore listeners that fire during the
 * brief window between sign-in and token-claim propagation routinely
 * get one or two `permission-denied` errors before stabilising. These
 * are expected and transient — the listener self-recovers on the next
 * snapshot attempt once the claim catches up. Previously every one of
 * these counted as a Sentry event, so a single sign-in produced 5-10
 * spurious alerts (one per Provider context that was already mounted
 * waiting for `user`). We now log them to console (still useful for
 * dev triage) but skip Sentry ingest for that specific code.
 */
import * as Sentry from '@sentry/react';

type Extras = Record<string, string | number | boolean | null | undefined>;

function isTransientPermissionError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const code = (err as { code?: string }).code;
    // Firestore SDK normalises to lower-case `permission-denied`.
    // Auth SDK may use the prefixed `auth/permission-denied` form.
    return code === 'permission-denied' || code === 'auth/permission-denied';
}

export function reportError(source: string, error: unknown, extras?: Extras): void {
    // eslint-disable-next-line no-console
    console.error(`[${source}]`, error, extras ?? '');

    // Skip Sentry for transient permission-denied — they fire on every
    // sign-in during the token-propagation race window and self-recover.
    // If a real rules misconfiguration is causing persistent denials,
    // the console log + the user-visible empty state will surface it
    // without needing Sentry alerts.
    if (isTransientPermissionError(error)) return;

    Sentry.captureException(error, {
        tags: { source },
        ...(extras ? { extra: extras } : {}),
    });
}
