import { test } from "node:test";
import assert from "node:assert/strict";
import { createInMemoryRateLimiter, keyForRequest } from "../shared/rateLimit.ts";
import { handleRequest } from "../index.ts";

test("in-memory limiter allows up to maxRequests within the window, then rejects", () => {
  const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 3 });
  const key = "test-key";
  assert.equal(limiter.check(key).allowed, true);
  assert.equal(limiter.check(key).allowed, true);
  assert.equal(limiter.check(key).allowed, true);
  const fourth = limiter.check(key);
  assert.equal(fourth.allowed, false);
  assert.ok(typeof fourth.retryAfterSeconds === "number" && fourth.retryAfterSeconds > 0);
});

test("limiter tracks distinct keys independently", () => {
  const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 1 });
  assert.equal(limiter.check("a").allowed, true);
  assert.equal(limiter.check("b").allowed, true, "a different key must not be affected by key a's usage");
  assert.equal(limiter.check("a").allowed, false);
});

test("keyForRequest reads x-forwarded-for and falls back to a shared bucket, never echoing raw headers back", () => {
  const withHeader = new Request("http://localhost/live-data", { headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" } });
  assert.equal(keyForRequest(withHeader), "203.0.113.5");
  const withoutHeader = new Request("http://localhost/live-data");
  assert.equal(keyForRequest(withoutHeader), "anonymous");
});

test("router returns 429 rate_limited with Retry-After once the injected limiter rejects, and never exposes the limiter key", async () => {
  const alwaysReject = { check: () => ({ allowed: false, retryAfterSeconds: 42 }) };
  const request = new Request("http://localhost/live-data", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.7" },
    body: JSON.stringify({ action: "company", ticker: "O" }),
  });
  const res = await handleRequest(request, { rateLimiter: alwaysReject, allowedOrigins: ["http://localhost:5173"] });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "42");
  const text = await res.text();
  assert.ok(!text.includes("198.51.100.7"), "the response must never contain the caller's IP/limiter key");
  const json = JSON.parse(text);
  assert.equal(json.ok, false);
  assert.equal(json.error.code, "rate_limited");
});

test("a permissive limiter lets requests through normally", async () => {
  const alwaysAllow = { check: () => ({ allowed: true }) };
  const request = new Request("http://localhost/live-data", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "quote", ticker: "BRK.B" }),
  });
  const res = await handleRequest(request, { rateLimiter: alwaysAllow, allowedOrigins: ["http://localhost:5173"] });
  assert.equal(res.status, 200);
});
