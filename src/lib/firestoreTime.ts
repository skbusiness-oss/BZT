/**
 * Firestore time helpers. Firestore SDK returns server-stamped timestamps
 * as `Timestamp` objects (with `.seconds`, `.nanoseconds`, `.toDate()`),
 * NOT as ISO strings or Date instances. Calling `new Date(timestampObj)`
 * yields "Invalid Date", which is the bug behind every "Invalid Date,
 * Invalid Date" string you've ever seen on a timestamped UI surface.
 *
 * Use these helpers anywhere a Firestore timestamp field crosses into
 * UI rendering or sort comparisons.
 */

/** Convert ANY plausible timestamp representation to a Date, or null
 *  if the input isn't a valid timestamp.
 *
 *  Handles:
 *    - Firestore Timestamp objects ({ seconds, nanoseconds, toDate })
 *    - Pending serverTimestamp() (which appears as null briefly on the
 *      writer's local snapshot before the server stamp lands)
 *    - ISO strings (legacy docs, or fields stamped client-side)
 *    - Numbers (epoch milliseconds)
 *    - Existing Date instances (no-op)
 */
export function tsToDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
    if (typeof v === 'object' && v !== null) {
        const obj = v as { toDate?: () => Date; seconds?: number };
        if (typeof obj.toDate === 'function') {
            try {
                const d = obj.toDate();
                return Number.isNaN(d.getTime()) ? null : d;
            } catch {
                return null;
            }
        }
        if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000);
    }
    if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/** Numeric epoch-ms for sort comparisons. Returns 0 for null/invalid so
 *  pending serverTimestamp() messages sort consistently to the start
 *  rather than throwing NaN into the comparator. */
export function tsToMillis(v: unknown): number {
    const d = tsToDate(v);
    return d ? d.getTime() : 0;
}
