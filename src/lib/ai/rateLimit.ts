/**
 * Minimal in-memory, per-user rate limiter for AI routes.
 *
 * MVP-grade: state lives in the server process, so limits reset on redeploy and
 * are not shared across serverless instances. Good enough to deter abuse; swap
 * for a durable store (e.g. Upstash/Redis) if you need hard guarantees.
 *
 * The key is the internal user id (or a hashed IP fallback) — it is used only
 * for bucketing and is NEVER sent to Gemini.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key      unique caller key (user id or ip)
 * @param feature  feature name (namespaces the bucket)
 * @param limit    max requests within the window
 * @param windowMs window length in ms (e.g. 1 day, 1 week)
 */
export function checkRateLimit(key: string, feature: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${feature}:${key}`;
  const existing = buckets.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
