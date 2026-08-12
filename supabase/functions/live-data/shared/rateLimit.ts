/* ============================================================================
   Rate-limit boundary.

   RateLimiter is a small interface, not an implementation commitment. The
   router only depends on this interface, so Phase 3 can swap in a
   persistent, cross-instance store (e.g. a Postgres table or Redis) without
   touching the router or any action handler.

   IMPORTANT LIMITATION (Phase 2): createInMemoryRateLimiter keeps its
   counters in a plain in-process Map. On Supabase's Edge Runtime this is
   NOT a production-grade distributed rate limiter:
     - Each function instance has its own counters — a burst spread across
       multiple concurrently-scaled instances is not caught.
     - Counters reset whenever an instance is recycled or cold-started.
   It is included in Phase 2 only to prove the interface and to give local
   contract tests something real to exercise. Do not deploy this as the
   sole abuse control for a production endpoint.

   The limiter key is never included in any response body — callers key by
   whatever identifier they choose (e.g. a hash of an IP), and that key
   never leaves this module.
   ========================================================================== */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export interface InMemoryRateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export function createInMemoryRateLimiter(options: InMemoryRateLimiterOptions): RateLimiter {
  const { windowMs, maxRequests } = options;
  const hits = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - windowMs;
      const existing = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (existing.length >= maxRequests) {
        const oldest = existing[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        hits.set(key, existing);
        return { allowed: false, retryAfterSeconds };
      }

      existing.push(now);
      hits.set(key, existing);
      return { allowed: true };
    },
  };
}

/**
 * Derive a rate-limit key from a request without ever exposing the raw
 * value in a response. Falls back to a single shared bucket when no
 * network-identifying header is present (e.g. this local test harness).
 */
export function keyForRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "anonymous";
}
