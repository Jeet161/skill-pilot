/**
 * Minimal in-memory rate limiter guarding against rapid repeated
 * submissions / duplicate question-generation calls for the same
 * assessment session. In a multi-instance deployment this should be
 * backed by Redis, but the interface is deliberately small so that swap
 * is a one-file change.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 10_000; // 10 second window
const MAX_CALLS_PER_WINDOW = 4;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_CALLS_PER_WINDOW) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Simple in-flight guard: prevents two concurrent AI generations for the same session. */
const inFlight = new Set<string>();

export function tryAcquireLock(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

export function releaseLock(key: string): void {
  inFlight.delete(key);
}
