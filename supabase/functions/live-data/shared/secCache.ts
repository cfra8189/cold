/* ============================================================================
   Bounded SEC response cache.

   LIMITATION: the in-memory implementation here is NOT durable across
   serverless instances — exactly like shared/rateLimit.ts, counters/entries
   live in one running instance's memory and are lost on cold start. It is
   included so cache-first behavior and stale-fallback-on-failure can be
   proven end to end in this phase; Phase 4+ can replace it with a
   persistent store behind the same SecCache interface without touching the
   actions that use it.

   Contract: set() is only ever called after a *successful* SEC fetch — a
   failure never overwrites a last-known-good entry (see actions/facts.ts
   and actions/filings.ts). get() returns the entry regardless of whether
   it has expired; isFresh() is a separate check so a caller can decide
   between LIVE (fresh), STALE (expired but present) and UNAVAILABLE
   (nothing cached at all).
   ========================================================================== */

export interface CacheEntry<T> {
  value: T;
  retrievedAt: string;
  sourceEndpoint: string;
}

export interface SecCache {
  get<T>(key: string): CacheEntry<T> | null;
  isFresh(key: string): boolean;
  set<T>(key: string, value: T, sourceEndpoint: string): void;
}

/** Filings and standardized facts change on a quarterly cadence — an hour-scale TTL, not seconds. */
export const SEC_CACHE_TTL_MS = 60 * 60 * 1000;

export function createInMemorySecCache(ttlMs: number = SEC_CACHE_TTL_MS): SecCache {
  const store = new Map<string, CacheEntry<unknown>>();

  return {
    get<T>(key: string): CacheEntry<T> | null {
      const entry = store.get(key);
      return (entry as CacheEntry<T> | undefined) ?? null;
    },
    isFresh(key: string): boolean {
      const entry = store.get(key);
      if (!entry) return false;
      return Date.now() - new Date(entry.retrievedAt).getTime() < ttlMs;
    },
    set<T>(key: string, value: T, sourceEndpoint: string): void {
      store.set(key, { value, retrievedAt: new Date().toISOString(), sourceEndpoint });
    },
  };
}
