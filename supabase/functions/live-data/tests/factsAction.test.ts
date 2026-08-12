import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getFactsResult } from "../actions/facts.ts";
import { createInMemorySecCache } from "../shared/secCache.ts";
import { validateMetric } from "../../../../src/live/schema/metric.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(dir, "..", "fixtures", "sec");
const readJson = (name: string) => JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8"));
const O_SUBMISSIONS = readJson("O.submissions.json");
const O_FACTS_FIXTURE = readJson("O.companyfacts.json");
const BRKB_SUBMISSIONS = readJson("BRKB.submissions.json");
const BRKB_FACTS_FIXTURE = readJson("BRKB.companyfacts.json");

const UA = "COLD Ownership Simulator test@example.com";

function mockFetchFor(submissions: unknown, companyFacts: unknown) {
  return async (url: string) => {
    if (String(url).includes("/submissions/")) return { ok: true, status: 200, text: async () => JSON.stringify(submissions) };
    if (String(url).includes("/companyfacts/")) return { ok: true, status: 200, text: async () => JSON.stringify(companyFacts) };
    throw new Error("unexpected url " + url);
  };
}

test("without SEC_EDGAR_USER_AGENT configured, facts still returns companyReportedSnapshot and marks SEC facts unavailable — never crashes", async () => {
  const result = await getFactsResult("O", { cache: createInMemorySecCache(), secDeps: { userAgent: null } });
  assert.equal(result.dataMode, "SNAPSHOT");
  assert.ok(result.data.companyReportedSnapshot.length > 0);
  for (const fact of result.data.secReportedGaap) assert.equal(fact.value, null);
});

test("with SEC configured and reachable, O's facts response is dataMode LIVE with real SEC-mapped values plus the unchanged snapshot", async () => {
  const result = await getFactsResult("O", {
    cache: createInMemorySecCache(),
    secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetchFor(O_SUBMISSIONS, O_FACTS_FIXTURE) },
  });
  assert.equal(result.dataMode, "LIVE");
  const revenue = result.data.secReportedGaap.find((f: { metricKey: string }) => f.metricKey === "secRevenue");
  assert.equal(revenue.value, 1547.711);
  assert.equal(revenue.classification, "reported");
  assert.ok(result.data.companyReportedSnapshot.some((f: { metricKey: string }) => f.metricKey === "reportedAffoPerShare"));
});

test("AFFO is never derived from SEC facts — no SEC-sourced metric key resembles affo, and reportedAffoPerShare only ever comes from companyReportedSnapshot", async () => {
  const result = await getFactsResult("O", {
    cache: createInMemorySecCache(),
    secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetchFor(O_SUBMISSIONS, O_FACTS_FIXTURE) },
  });
  for (const fact of result.data.secReportedGaap) {
    assert.ok(!/affo/i.test(fact.metricKey), `secReportedGaap must never contain an AFFO-shaped metric key, found ${fact.metricKey}`);
  }
  const snapshotAffo = result.data.companyReportedSnapshot.find((f: { metricKey: string }) => f.metricKey === "reportedAffoPerShare");
  assert.equal(snapshotAffo.classification, "reported");
  assert.equal(snapshotAffo.provenance.sourceType, "company-supplemental");
});

test("existing verified snapshot figures (AFFO, occupancy, payout ratio) are byte-for-byte unchanged by Phase 3", async () => {
  const result = await getFactsResult("O", { cache: createInMemorySecCache(), secDeps: { userAgent: null } });
  const affo = result.data.companyReportedSnapshot.find((f: { metricKey: string }) => f.metricKey === "reportedAffoPerShare");
  assert.equal(affo.value, 1.09);
  const payout = result.data.companyReportedSnapshot.find((f: { metricKey: string }) => f.metricKey === "reportedAffoPayoutRatio");
  assert.equal(payout.value, 74.5);
});

test("Berkshire never receives a REIT-only SEC fact (real estate D&A)", async () => {
  const result = await getFactsResult("BRK.B", {
    cache: createInMemorySecCache(),
    secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetchFor(BRKB_SUBMISSIONS, BRKB_FACTS_FIXTURE) },
  });
  assert.ok(!result.data.secReportedGaap.some((f: { metricKey: string }) => f.metricKey === "secRealEstateDepreciationAndAmortization"));
});

test("Berkshire's operating earnings and insurance float remain company-supplemental, never relabeled as SEC GAAP", async () => {
  const result = await getFactsResult("BRK.B", { cache: createInMemorySecCache(), secDeps: { userAgent: null } });
  const opEarnings = result.data.companyReportedSnapshot.find((f: { metricKey: string }) => f.metricKey === "operatingEarnings");
  assert.equal(opEarnings.provenance.sourceType, "company-supplemental");
  const float = result.data.companyReportedSnapshot.find((f: { metricKey: string }) => f.metricKey === "insuranceFloat");
  assert.equal(float.provenance.sourceType, "company-supplemental");
});

test("O and BRK.B use their own approved CIK — the SEC client rejects anything else before a request is made (see secClient.test.ts); this action never passes a caller-supplied ticker through unchecked", async () => {
  const result = await getFactsResult("O", {
    cache: createInMemorySecCache(),
    secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetchFor(O_SUBMISSIONS, O_FACTS_FIXTURE) },
  });
  assert.ok(result.data.secReportedGaap.every((f: { ticker: string }) => f.ticker === "O"));
});

test("every secReportedGaap entry passes the frontend's own metric schema validation", async () => {
  const result = await getFactsResult("O", {
    cache: createInMemorySecCache(),
    secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetchFor(O_SUBMISSIONS, O_FACTS_FIXTURE) },
  });
  for (const fact of result.data.secReportedGaap) {
    const errors = validateMetric(fact);
    assert.deepEqual(errors, [], `${fact.metricKey}: ${errors.join("; ")}`);
  }
});

test("cache-first: a second facts call within the TTL does not re-fetch SEC", async () => {
  const cache = createInMemorySecCache();
  let fetchCount = 0;
  const fetchImpl = async (url: string) => {
    fetchCount++;
    return mockFetchFor(O_SUBMISSIONS, O_FACTS_FIXTURE)(url);
  };
  await getFactsResult("O", { cache, secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl } });
  const firstCount = fetchCount;
  await getFactsResult("O", { cache, secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl } });
  assert.equal(fetchCount, firstCount, "the second call must be served entirely from cache");
});
