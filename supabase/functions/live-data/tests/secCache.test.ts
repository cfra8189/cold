import { test } from "node:test";
import assert from "node:assert/strict";
import { createInMemorySecCache } from "../shared/secCache.ts";
import { fetchWithCache } from "../shared/secFetchWithCache.ts";

test("cache-first: a fresh cache entry is served without calling the fetcher at all", async () => {
  const cache = createInMemorySecCache(60_000);
  cache.set("submissions:O", { hello: "world" }, "submissions:O");
  let called = false;
  const outcome = await fetchWithCache(cache, "submissions:O", async () => {
    called = true;
    return { ok: true, data: { hello: "network" } };
  });
  assert.equal(called, false, "a fresh cache entry must be served without touching the network");
  assert.equal(outcome.status, "LIVE");
  if (outcome.status !== "UNAVAILABLE") assert.deepEqual(outcome.data, { hello: "world" });
});

test("a cache miss triggers a fetch, and a successful fetch is stored", async () => {
  const cache = createInMemorySecCache(60_000);
  const outcome = await fetchWithCache(cache, "submissions:O", async () => ({ ok: true, data: { hello: "fresh" } }));
  assert.equal(outcome.status, "LIVE");
  assert.equal(cache.isFresh("submissions:O"), true);
});

test("on fetch failure with an expired cache entry present, the last-known-good value is served as STALE", async () => {
  const cache = createInMemorySecCache(1); // 1ms TTL — expires almost immediately
  cache.set("submissions:O", { hello: "old" }, "submissions:O");
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(cache.isFresh("submissions:O"), false);
  const outcome = await fetchWithCache(cache, "submissions:O", async () => ({ ok: false, reason: "network_error" }));
  assert.equal(outcome.status, "STALE");
  if (outcome.status !== "UNAVAILABLE") assert.deepEqual(outcome.data, { hello: "old" });
});

test("on fetch failure with no cache entry at all, the result is UNAVAILABLE", async () => {
  const cache = createInMemorySecCache(60_000);
  const outcome = await fetchWithCache(cache, "submissions:O", async () => ({ ok: false, reason: "network_error" }));
  assert.equal(outcome.status, "UNAVAILABLE");
  if (outcome.status === "UNAVAILABLE") assert.equal(outcome.reason, "network_error");
});

test("a failed fetch never overwrites a good cache entry — set() is only reachable on success", async () => {
  const cache = createInMemorySecCache(1);
  cache.set("submissions:O", { hello: "good" }, "submissions:O");
  await new Promise((r) => setTimeout(r, 5));
  await fetchWithCache(cache, "submissions:O", async () => ({ ok: false, reason: "network_error" }));
  const entry = cache.get<{ hello: string }>("submissions:O");
  assert.equal(entry?.value.hello, "good", "the last-known-good value must remain in the cache after a failed refresh attempt");
});

test("submissions and company facts are cached under separate keys and don't collide", async () => {
  const cache = createInMemorySecCache(60_000);
  await fetchWithCache(cache, "submissions:O", async () => ({ ok: true, data: { kind: "submissions" } }));
  await fetchWithCache(cache, "companyfacts:O", async () => ({ ok: true, data: { kind: "companyfacts" } }));
  assert.equal(cache.get<{ kind: string }>("submissions:O")?.value.kind, "submissions");
  assert.equal(cache.get<{ kind: string }>("companyfacts:O")?.value.kind, "companyfacts");
});

test("each cache entry records retrievedAt and the source endpoint identity it was cached under", async () => {
  const cache = createInMemorySecCache(60_000);
  cache.set("submissions:O", { x: 1 }, "submissions:O");
  const entry = cache.get("submissions:O");
  assert.ok(entry?.retrievedAt);
  assert.equal(entry?.sourceEndpoint, "submissions:O");
});
