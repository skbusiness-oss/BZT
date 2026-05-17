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
 */
import * as Sentry from '@sentry/react';

type Extras = Record<string, string | number | boolean | null | undefined>;

export function reportError(source: string, error: unknown, extras?: Extras): void {
    // eslint-disable-next-line no-console
    console.error(`[${source}]`, error, extras ?? '');

    Sentry.captureException(error, {
        tags: { source },
        ...(extras ? { extra: extras } : {}),
    });
}
