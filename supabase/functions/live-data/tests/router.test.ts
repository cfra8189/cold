import { test } from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../index.ts";
import { createInMemoryRateLimiter } from "../shared/rateLimit.ts";

const ORIGIN = "http://localhost:5173";

function freshDeps() {
  // A generous limiter per test so these tests never trip Phase 2's own
  // rate limit while exercising many requests in a row.
  return { rateLimiter: createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 1000 }), allowedOrigins: [ORIGIN] };
}

function req(body: unknown, { method = "POST", origin = ORIGIN, rawBody }: { method?: string; origin?: string | null; rawBody?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin) headers.set("origin", origin);
  return new Request("http://localhost/live-data", {
    method,
    headers,
    body: method === "OPTIONS" || method === "GET" ? undefined : rawBody ?? JSON.stringify(body),
  });
}

// --- all four actions, both tickers -----------------------------------------

for (const ticker of ["O", "BRK.B"] as const) {
  for (const action of ["company", "facts", "quote", "filings"] as const) {
    test(`${action} action succeeds for ${ticker}`, async () => {
      const res = await handleRequest(req({ action, ticker }), freshDeps());
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.ok, true);
      assert.equal(json.action, action);
      assert.equal(json.ticker, ticker);
      assert.equal(json.dataMode, "SNAPSHOT");
      assert.ok(json.servedAt);
      assert.ok(json.data);
    });
  }
}

test("O company response matches the approved profile shape", async () => {
  const res = await handleRequest(req({ action: "company", ticker: "O" }), freshDeps());
  const { data } = await res.json();
  assert.equal(data.ticker, "O");
  assert.equal(data.companyType, "equity-reit");
  assert.equal(data.cik, "0000726728");
  assert.match(data.provenance.documentUrl, /^https:\/\/www\.realtyincome\.com\//);
});

test("BRK.B company response matches the approved profile shape", async () => {
  const res = await handleRequest(req({ action: "company", ticker: "BRK.B" }), freshDeps());
  const { data } = await res.json();
  assert.equal(data.ticker, "BRK.B");
  assert.equal(data.companyType, "diversified-holding-company");
  assert.equal(data.cik, "0001067983");
});

test("O facts response contains only reported facts, no calculated metrics", async () => {
  const res = await handleRequest(req({ action: "facts", ticker: "O" }), freshDeps());
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  for (const fact of data) {
    assert.equal(fact.classification, "reported", `${fact.metricKey} must be reported, not computed server-side`);
    assert.equal(fact.freshness, "SNAPSHOT");
  }
  assert.ok(data.some((f: { metricKey: string }) => f.metricKey === "reportedAffoPerShare"));
  assert.ok(!data.some((f: { metricKey: string }) => f.metricKey === "affoPayoutRatio"), "calculated payout ratio must not be served by the backend");
});

test("BRK.B facts response contains only reported facts, no calculated metrics", async () => {
  const res = await handleRequest(req({ action: "facts", ticker: "BRK.B" }), freshDeps());
  const { data } = await res.json();
  for (const fact of data) {
    assert.equal(fact.classification, "reported");
    assert.equal(fact.freshness, "SNAPSHOT");
  }
});

test("quote action returns an unavailable quote for both tickers, never a price", async () => {
  for (const ticker of ["O", "BRK.B"] as const) {
    const res = await handleRequest(req({ action: "quote", ticker }), freshDeps());
    const { data } = await res.json();
    assert.equal(data.price, null);
    assert.equal(data.freshness, "UNAVAILABLE");
    assert.equal(data.unavailableReason, "provider_not_connected");
  }
});

test("filings action reports not_connected and never fabricates filing data", async () => {
  const res = await handleRequest(req({ action: "filings", ticker: "O" }), freshDeps());
  const { data } = await res.json();
  assert.equal(data.status, "not_connected");
  assert.ok(Array.isArray(data.knownSources));
  assert.ok(data.knownSources.length > 0);
  for (const source of data.knownSources) {
    assert.equal(source.freshness, "SNAPSHOT");
    assert.match(source.url, /^https:\/\//);
  }
});

// --- validation ---------------------------------------------------------

test("malformed JSON is rejected with 400 invalid_request", async () => {
  const res = await handleRequest(req(undefined, { rawBody: "{not json" }), freshDeps());
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.ok, false);
  assert.equal(json.error.code, "invalid_request");
});

test("missing action is rejected with 400 invalid_request", async () => {
  const res = await handleRequest(req({ ticker: "O" }), freshDeps());
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error.code, "invalid_request");
});

test("unknown action is rejected with 400 unsupported_action", async () => {
  const res = await handleRequest(req({ action: "history", ticker: "O" }), freshDeps());
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error.code, "unsupported_action");
});

test("missing ticker is rejected with 400 invalid_request", async () => {
  const res = await handleRequest(req({ action: "company" }), freshDeps());
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error.code, "invalid_request");
});

test("unsupported ticker is rejected with 400 unsupported_ticker (arbitrary ticker search is not honored)", async () => {
  const res = await handleRequest(req({ action: "company", ticker: "AAPL" }), freshDeps());
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error.code, "unsupported_ticker");
});

test("extra fields in the body (arbitrary URL / date-range style expansion) are silently ignored, not honored", async () => {
  const res = await handleRequest(
    req({ action: "facts", ticker: "O", url: "https://evil.example/inject", startDate: "1900-01-01", endDate: "2999-01-01" }),
    freshDeps()
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ticker, "O");
  assert.equal(json.action, "facts");
});

test("unsupported HTTP method is rejected with 405 method_not_allowed", async () => {
  const res = await handleRequest(req(undefined, { method: "GET" }), freshDeps());
  assert.equal(res.status, 405);
  const json = await res.json();
  assert.equal(json.error.code, "method_not_allowed");
});

test("PUT is also rejected with 405", async () => {
  const res = await handleRequest(req({ action: "company", ticker: "O" }, { method: "PUT" }), freshDeps());
  assert.equal(res.status, 405);
});

// --- safe error envelope -------------------------------------------------

test("error responses never leak a stack trace, file path, or internal detail", async () => {
  const res = await handleRequest(req(undefined, { rawBody: "not json at all" }), freshDeps());
  const text = await res.text();
  assert.ok(!/at .*\.ts:\d+/.test(text), "response must not contain a stack frame");
  assert.ok(!/[A-Za-z]:\\\\|\/home\/|\/Users\//.test(text), "response must not contain a filesystem path");
  assert.ok(!text.toLowerCase().includes("syntaxerror"), "response must not echo the raw parser error");
});

test("every error response still has the safe { ok:false, error:{code,message} } shape", async () => {
  const res = await handleRequest(req({ action: "nope", ticker: "O" }), freshDeps());
  const json = await res.json();
  assert.equal(json.ok, false);
  assert.equal(typeof json.error.code, "string");
  assert.equal(typeof json.error.message, "string");
  assert.equal(Object.keys(json).length, 2); // ok, error — nothing else
});
