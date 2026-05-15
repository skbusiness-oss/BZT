// ─── Input validation utilities ──────────────────────────────────────────────
// Pure TypeScript validators used throughout the app.
// Firestore rules enforce the same limits server-side; these validators
// give immediate feedback before any network round-trip.

// ── String ────────────────────────────────────────────────────────────────────

export function validateText(
  value: unknown,
  { min = 1, max }: { min?: number; max: number }
): string | null {
  if (typeof value !== 'string') return 'Must be a string.';
  const trimmed = value.trim();
  if (trimmed.length < min) return `Must be at least ${min} character${min === 1 ? '' : 's'}.`;
  if (trimmed.length > max) return `Must be at most ${max} characters.`;
  return null; // valid
}

// ── File uploads ──────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors storage.rules

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, WEBP, GIF, HEIC images are allowed.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image must be under 10 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Simple in-memory sliding-window rate limiter for client-side abuse prevention.
// Firestore rules and Firebase Auth provide the server-side safety net; this
// reduces wasted writes and gives instant feedback to the user.

const windows: Map<string, number[]> = new Map();

/**
 * Returns true if the action is allowed, false if the rate limit is exceeded.
 * @param key     Unique identifier (e.g. "message:<userId>")
 * @param limit   Max allowed calls within the window
 * @param windowMs  Rolling window in milliseconds (default: 60 000 ms = 1 min)
 */
export function checkRateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const timestamps = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  windows.set(key, timestamps);
  return true;
}

// Convenience wrappers with sensible defaults
export const rateLimits = {
  /** 10 messages per minute per user */
  message: (userId: string) => checkRateLimit(`msg:${userId}`, 10, 60_000),
  /** 5 posts per 10 minutes per user */
  post: (userId: string) => checkRateLimit(`post:${userId}`, 5, 600_000),
  /** 20 comments per 10 minutes per user */
  comment: (userId: string) => checkRateLimit(`comment:${userId}`, 20, 600_000),
  /** 3 password reset emails per 15 minutes */
  passwordReset: (identifier: string) => checkRateLimit(`pwreset:${identifier}`, 3, 900_000),
};
