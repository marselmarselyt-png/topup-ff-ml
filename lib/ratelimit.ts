/**
 * Rate limiter in-memory (fixed window) untuk endpoint sensitif.
 * Cukup untuk MVP single-instance; di produksi multi-instance ganti Redis.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
