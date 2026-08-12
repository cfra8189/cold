import { test } from "node:test";
import assert from "node:assert/strict";
import { getSubmissions, getCompanyFacts, APPROVED_CIKS } from "../shared/secClient.ts";

const UA = "COLD Ownership Simulator test@example.com";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

const VALID_SUBMISSIONS = { cik: "0000726728", name: "REALTY INCOME CORP", filings: { recent: { accessionNumber: ["0000726728-26-000048"], filingDate: ["2026-08-06"], reportDate: ["2026-06-30"], form: ["10-Q"], primaryDocument: ["o-20260630.htm"] } } };
const VALID_COMPANY_FACTS = { cik: 726728, entityName: "REALTY INCOME CORPORATION", facts: { "us-gaap": {} } };

test("APPROVED_CIKS only ever contains the two approved tickers", () => {
  assert.deepEqual(Object.keys(APPROVED_CIKS).sort(), ["BRK.B", "O"]);
  assert.equal(APPROVED_CIKS.O, "0000726728");
  assert.equal(APPROVED_CIKS["BRK.B"], "0001067983");
});

test("missing SEC_EDGAR_USER_AGENT returns sec_not_configured without calling fetch", async () => {
  let called = false;
  const result = await getSubmissions("O", { userAgent: null, fetchImpl: async () => { called = true; return jsonResponse(VALID_SUBMISSIONS); } });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "sec_not_configured");
  assert.equal(called, false, "must never send a request without a configured User-Agent");
});

test("a valid User-Agent is attached to the outbound request", async () => {
  let capturedHeaders: Record<string, string> | undefined;
  await getSubmissions("O", {
    userAgent: UA,
    minIntervalMs: 0,
    fetchImpl: async (_url, init) => {
      capturedHeaders = (init as { headers: Record<string, string> }).headers;
      return jsonResponse(VALID_SUBMISSIONS);
    },
  });
  assert.equal(capturedHeaders?.["User-Agent"], UA);
});

test("requests always use the fixed SEC base URL and the approved CIK for the ticker, never a caller-supplied value", async () => {
  let capturedUrl = "";
  await getCompanyFacts("O", { userAgent: UA, minIntervalMs: 0, fetchImpl: async (url) => { capturedUrl = String(url); return jsonResponse(VALID_COMPANY_FACTS); } });
  assert.equal(capturedUrl, "https://data.sec.gov/api/xbrl/companyfacts/CIK0000726728.json");
});

test("an unsupported ticker is rejected before any request is attempted", async () => {
  let called = false;
  // @ts-expect-error deliberately testing an out-of-contract ticker
  const result = await getSubmissions("AAPL", { userAgent: UA, fetchImpl: async () => { called = true; return jsonResponse(VALID_SUBMISSIONS); } });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "unsupported_ticker");
  assert.equal(called, false);
});

test("a request that times out is reported as a timeout, not left hanging", async () => {
  const result = await getSubmissions("O", {
    userAgent: UA,
    minIntervalMs: 0,
    timeoutMs: 20,
    maxRetries: 0,
    fetchImpl: (_url, init) =>
      new Promise((_resolve, reject) => {
        const signal = (init as { signal: AbortSignal }).signal;
        signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
      }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "timeout");
});

test("a temporary failure (503) is retried up to the configured bound, then succeeds", async () => {
  let attempts = 0;
  const result = await getSubmissions("O", {
    userAgent: UA,
    minIntervalMs: 0,
    maxRetries: 2,
    fetchImpl: async () => {
      attempts++;
      if (attempts <= 2) return jsonResponse({}, 503);
      return jsonResponse(VALID_SUBMISSIONS);
    },
  });
  assert.equal(result.ok, true);
  assert.equal(attempts, 3);
});

test("a non-temporary failure (404) is never retried", async () => {
  let attempts = 0;
  const result = await getSubmissions("O", { userAgent: UA, minIntervalMs: 0, maxRetries: 2, fetchImpl: async () => { attempts++; return jsonResponse({}, 404); } });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "http_404");
  assert.equal(attempts, 1, "a 404 must not be retried — only temporary (429/5xx) failures are");
});

test("retries are bounded — repeated temporary failures eventually give up", async () => {
  let attempts = 0;
  const result = await getSubmissions("O", { userAgent: UA, minIntervalMs: 0, maxRetries: 2, fetchImpl: async () => { attempts++; return jsonResponse({}, 503); } });
  assert.equal(result.ok, false);
  assert.equal(attempts, 3); // initial + 2 retries, then give up
});

test("a response missing the required submissions shape is rejected as invalid_shape", async () => {
  const result = await getSubmissions("O", { userAgent: UA, minIntervalMs: 0, fetchImpl: async () => jsonResponse({ not: "the right shape" }) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_shape");
});

test("a response missing the required company-facts shape is rejected as invalid_shape", async () => {
  const result = await getCompanyFacts("O", { userAgent: UA, minIntervalMs: 0, fetchImpl: async () => jsonResponse({ not: "the right shape" }) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_shape");
});

test("malformed JSON in the SEC response is reported as invalid_json, not thrown", async () => {
  const result = await getSubmissions("O", { userAgent: UA, minIntervalMs: 0, fetchImpl: async () => ({ ok: true, status: 200, text: async () => "{not json" }) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_json");
});

test("an oversized response body is rejected without being parsed", async () => {
  const huge = "x".repeat(11 * 1024 * 1024);
  const result = await getSubmissions("O", { userAgent: UA, minIntervalMs: 0, fetchImpl: async () => ({ ok: true, status: 200, text: async () => huge }) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "response_too_large");
});

test("a valid submissions response is returned as-is on success", async () => {
  const result = await getSubmissions("O", { userAgent: UA, minIntervalMs: 0, fetchImpl: async () => jsonResponse(VALID_SUBMISSIONS) });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.name, "REALTY INCOME CORP");
});
