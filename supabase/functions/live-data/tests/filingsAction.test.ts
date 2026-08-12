import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getFilingsResult } from "../actions/filings.ts";
import { createInMemorySecCache } from "../shared/secCache.ts";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(dir, "..", "fixtures", "sec");
const readJson = (name: string) => JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8"));
const O_SUBMISSIONS = readJson("O.submissions.json");

const UA = "COLD Ownership Simulator test@example.com";
const mockFetch = async (url: string) => {
  if (String(url).includes("/submissions/")) return { ok: true, status: 200, text: async () => JSON.stringify(O_SUBMISSIONS) };
  throw new Error("unexpected url " + url);
};

test("without SEC_EDGAR_USER_AGENT, filings honestly reports not_connected and falls back to known verified sources, never fabricated filings", async () => {
  const result = await getFilingsResult("O", { cache: createInMemorySecCache(), secDeps: { userAgent: null } });
  assert.equal(result.data.status, "not_connected");
  assert.equal(result.data.filings, null);
  assert.ok(result.data.knownSources.length > 0);
  for (const s of result.data.knownSources) assert.equal(s.freshness, "SNAPSHOT");
  assert.equal(result.dataMode, "SNAPSHOT");
});

test("with SEC configured and reachable, filings returns connected status with normalized 10-K/10-Q/8-K, dataMode LIVE", async () => {
  const result = await getFilingsResult("O", { cache: createInMemorySecCache(), secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetch } });
  assert.equal(result.data.status, "connected");
  assert.equal(result.dataMode, "LIVE");
  assert.equal(result.data.filings["10-Q"].accessionNumber, "0000726728-26-000048");
  assert.match(result.data.filings["10-Q"].primaryDocumentUrl, /^https:\/\/www\.sec\.gov\//);
});

test("SEC unreachable and no cache yet falls back to not_connected honestly, not an error crash", async () => {
  const result = await getFilingsResult("O", {
    cache: createInMemorySecCache(),
    secDeps: { userAgent: UA, minIntervalMs: 0, maxRetries: 0, fetchImpl: async () => ({ ok: false, status: 503, text: async () => "" }) },
  });
  assert.equal(result.data.status, "not_connected");
  assert.equal(result.dataMode, "SNAPSHOT");
});

test("a prior successful fetch, then SEC failing, serves the cached filings as STALE rather than reverting to not_connected", async () => {
  const cache = createInMemorySecCache(1); // expires almost immediately
  await getFilingsResult("O", { cache, secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetch } });
  await new Promise((r) => setTimeout(r, 5));
  const result = await getFilingsResult("O", {
    cache,
    secDeps: { userAgent: UA, minIntervalMs: 0, maxRetries: 0, fetchImpl: async () => ({ ok: false, status: 503, text: async () => "" }) },
  });
  assert.equal(result.data.status, "connected");
  assert.equal(result.dataMode, "STALE");
  assert.equal(result.data.filings["10-Q"].freshness, "STALE");
});

test("only O and BRK.B ever produce a result — filings for both use their own CIK", async () => {
  const oResult = await getFilingsResult("O", { cache: createInMemorySecCache(), secDeps: { userAgent: UA, minIntervalMs: 0, fetchImpl: mockFetch } });
  assert.equal(oResult.data.filings["10-K"].cik, "0000726728");
});
