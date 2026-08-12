import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { liveDataClient, __configureForTests } from "./liveDataClient.js";
import companyO from "../fixtures/O.company.json" with { type: "json" };
import factsO from "../fixtures/O.facts.json" with { type: "json" };
import quoteO from "../fixtures/O.quote.json" with { type: "json" };

afterEach(() => {
  __configureForTests({ backendUrl: undefined, fetchImpl: undefined });
});

test("default transport (no backend configured) reads the fixture directly, with no fetch call at all", async () => {
  let fetchCalled = false;
  __configureForTests({ backendUrl: null, fetchImpl: () => { fetchCalled = true; } });
  const profile = await liveDataClient.getCompanyProfile("O");
  assert.deepEqual(profile, companyO);
  assert.equal(fetchCalled, false, "no network call should happen when no backend URL is configured");
});

test("HTTP transport, when configured and successful, returns the backend's normalized data field", async () => {
  const composed = { secReportedGaap: [], companyReportedSnapshot: factsO };
  __configureForTests({
    backendUrl: "https://example.invalid/live-data",
    fetchImpl: async (url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(url, "https://example.invalid/live-data");
      assert.equal(init.method, "POST");
      assert.equal(body.action, "facts");
      assert.equal(body.ticker, "O");
      return {
        ok: true,
        json: async () => ({ ok: true, action: "facts", ticker: "O", data: composed, servedAt: new Date().toISOString(), dataMode: "SNAPSHOT" }),
      };
    },
  });
  const facts = await liveDataClient.getFinancials("O");
  assert.deepEqual(facts, composed);
});

test("fixture transport for getFinancials returns the composed shape: empty secReportedGaap, unchanged companyReportedSnapshot", async () => {
  __configureForTests({ backendUrl: null });
  const facts = await liveDataClient.getFinancials("O");
  assert.deepEqual(facts.secReportedGaap, []);
  assert.deepEqual(facts.companyReportedSnapshot, factsO);
});

test("getFilings fixture transport reports not_connected with verified known sources, never fabricated filings", async () => {
  __configureForTests({ backendUrl: null });
  const filings = await liveDataClient.getFilings("O");
  assert.equal(filings.status, "not_connected");
  assert.equal(filings.filings, null);
  assert.ok(filings.knownSources.length > 0);
  for (const s of filings.knownSources) assert.equal(s.freshness, "SNAPSHOT");
});

test("getFilings HTTP transport returns the backend's data field verbatim", async () => {
  const backendFilings = { ticker: "O", status: "connected", message: null, filings: { "10-Q": { form: "10-Q" } }, retrievedAt: "now" };
  __configureForTests({
    backendUrl: "https://example.invalid/live-data",
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, action: "filings", ticker: "O", data: backendFilings, servedAt: "now", dataMode: "LIVE" }) }),
  });
  const filings = await liveDataClient.getFilings("O");
  assert.deepEqual(filings, backendFilings);
});

test("getFilings HTTP failure falls back to the honest not_connected fixture shape, never fabricated", async () => {
  __configureForTests({ backendUrl: "https://example.invalid/live-data", fetchImpl: async () => { throw new Error("down"); } });
  const filings = await liveDataClient.getFilings("O");
  assert.equal(filings.status, "not_connected");
  assert.equal(filings.filings, null);
});

test("HTTP transport normalizes to the exact same shape fixture transport returns", async () => {
  __configureForTests({
    backendUrl: "https://example.invalid/live-data",
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, action: "quote", ticker: "O", data: quoteO, servedAt: new Date().toISOString(), dataMode: "SNAPSHOT" }) }),
  });
  const viaHttp = await liveDataClient.getQuote("O");
  __configureForTests({ backendUrl: null });
  const viaFixture = await liveDataClient.getQuote("O");
  assert.deepEqual(viaHttp, viaFixture);
});

test("HTTP transport failure (network error) falls back to the local fixture rather than throwing", async () => {
  __configureForTests({
    backendUrl: "https://example.invalid/live-data",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  const profile = await liveDataClient.getCompanyProfile("O");
  assert.deepEqual(profile, companyO, "must fall back to the honest local SNAPSHOT fixture, not crash or fabricate data");
});

test("HTTP transport failure (non-2xx response) falls back to the local fixture", async () => {
  __configureForTests({
    backendUrl: "https://example.invalid/live-data",
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ ok: false, error: { code: "unavailable", message: "down" } }) }),
  });
  const quote = await liveDataClient.getQuote("O");
  assert.deepEqual(quote, quoteO);
});

test("HTTP transport failure never upgrades the fallback data to LIVE — it stays exactly the SNAPSHOT/UNAVAILABLE fixture", async () => {
  __configureForTests({ backendUrl: "https://example.invalid/live-data", fetchImpl: async () => { throw new Error("down"); } });
  const facts = await liveDataClient.getFinancials("O");
  assert.deepEqual(facts.secReportedGaap, []);
  for (const fact of facts.companyReportedSnapshot) assert.notEqual(fact.freshness, "LIVE");
  const quote = await liveDataClient.getQuote("O");
  assert.notEqual(quote.freshness, "LIVE");
  assert.equal(quote.freshness, "UNAVAILABLE");
});

test("a backend success envelope with ok:false is treated as a failure and falls back honestly", async () => {
  __configureForTests({
    backendUrl: "https://example.invalid/live-data",
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: false, error: { code: "unavailable", message: "backend degraded" } }) }),
  });
  const profile = await liveDataClient.getCompanyProfile("O");
  assert.deepEqual(profile, companyO);
});

test("ticker allowlist is still enforced regardless of transport", async () => {
  await assert.rejects(() => liveDataClient.getCompanyProfile("AAPL"));
  __configureForTests({ backendUrl: "https://example.invalid/live-data", fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, data: {} }) }) });
  await assert.rejects(() => liveDataClient.getCompanyProfile("AAPL"));
});
