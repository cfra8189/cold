import { test } from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../index.ts";
import { corsHeadersFor, isOriginAllowed, preflightResponse } from "../shared/cors.ts";
import { createInMemoryRateLimiter } from "../shared/rateLimit.ts";

const ALLOWED = ["http://localhost:5173"];

test("allowed origin receives access-control-allow-origin", () => {
  const headers = corsHeadersFor("http://localhost:5173", ALLOWED);
  assert.equal(headers["access-control-allow-origin"], "http://localhost:5173");
});

test("unknown origin receives no CORS header at all (not a 403 — just omitted)", () => {
  const headers = corsHeadersFor("https://not-allowed.example", ALLOWED);
  assert.equal(headers["access-control-allow-origin"], undefined);
});

test("isOriginAllowed is false for null/absent origin", () => {
  assert.equal(isOriginAllowed(null, ALLOWED), false);
});

test("a wildcard origin is never produced by corsHeadersFor", () => {
  const headers = corsHeadersFor("https://anything.example", ALLOWED);
  assert.notEqual(headers["access-control-allow-origin"], "*");
});

test("OPTIONS preflight returns 204 with the expected headers for an allowed origin", () => {
  const res = preflightResponse("http://localhost:5173", ALLOWED);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
  assert.equal(res.headers.get("access-control-allow-methods"), "POST, OPTIONS");
});

test("OPTIONS preflight for an unknown origin still returns 204 but without the allow-origin header", () => {
  const res = preflightResponse("https://not-allowed.example", ALLOWED);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("router handles an OPTIONS preflight request end to end", async () => {
  const request = new Request("http://localhost/live-data", { method: "OPTIONS", headers: { origin: "http://localhost:5173" } });
  const res = await handleRequest(request, { allowedOrigins: ALLOWED, rateLimiter: createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 1000 }) });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

test("a request from a rejected origin still processes fully — CORS is not authentication", async () => {
  const request = new Request("http://localhost/live-data", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://not-allowed.example" },
    body: JSON.stringify({ action: "company", ticker: "O" }),
  });
  const res = await handleRequest(request, { allowedOrigins: ALLOWED, rateLimiter: createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 1000 }) });
  assert.equal(res.status, 200, "the server must still answer a valid request even from an unrecognized Origin");
  assert.equal(res.headers.get("access-control-allow-origin"), null, "but must not tell a browser it's allowed to read the response");
  const json = await res.json();
  assert.equal(json.ok, true);
});

test("a direct request with no Origin header at all (non-browser client) is still validated and rate-limited normally", async () => {
  const request = new Request("http://localhost/live-data", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "quote", ticker: "O" }),
  });
  const res = await handleRequest(request, { allowedOrigins: ALLOWED, rateLimiter: createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 1000 }) });
  assert.equal(res.status, 200);
});
