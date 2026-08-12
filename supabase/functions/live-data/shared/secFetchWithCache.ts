/* ============================================================================
   Cache-first SEC fetch wrapper, shared by the facts and filings actions.

   Order of operations:
     1. If the cache already has a fresh (within-TTL) entry, serve it
        without touching the network at all — this is "cache-first".
     2. Otherwise attempt a real SEC fetch. On success, store it and serve
        it — labeled LIVE either way: a fresh cache entry still reflects
        this running instance's own prior retrieval from SEC, not a
        pre-baked fixture, so it is honestly "current SEC filing data"
        even if it wasn't fetched on this exact request.
     3. On fetch failure, fall back to a last-known-good cache entry if one
        exists at all (even expired) and label it STALE — never silently
        relabeled as current.
     4. If there is no cache entry to fall back to, the result is
        UNAVAILABLE. A failed fetch never overwrites a good cache entry
        (set() is only called after success).
   ========================================================================== */

import type { SecCache } from "./secCache.ts";
import type { SecFetchResult } from "./secClient.ts";

export type SecCacheOutcome<T> =
  | { status: "LIVE"; data: T; retrievedAt: string }
  | { status: "STALE"; data: T; retrievedAt: string }
  | { status: "UNAVAILABLE"; reason: string };

export async function fetchWithCache<T>(cache: SecCache, cacheKey: string, fetcher: () => Promise<SecFetchResult<T>>): Promise<SecCacheOutcome<T>> {
  if (cache.isFresh(cacheKey)) {
    const cached = cache.get<T>(cacheKey);
    if (cached) return { status: "LIVE", data: cached.value, retrievedAt: cached.retrievedAt };
  }

  const result = await fetcher();
  if (result.ok) {
    cache.set(cacheKey, result.data, cacheKey);
    const stored = cache.get<T>(cacheKey);
    return { status: "LIVE", data: result.data, retrievedAt: stored?.retrievedAt ?? new Date().toISOString() };
  }

  const stale = cache.get<T>(cacheKey);
  if (stale) {
    return { status: "STALE", data: stale.value, retrievedAt: stale.retrievedAt };
  }
  return { status: "UNAVAILABLE", reason: result.reason };
}
