/* ============================================================================
   LIVE data client — two transports behind one unchanged public API.

   Fixture transport (default, Phase 1 behavior): reads local fixtures
   directly, zero network calls. This is what runs unless a backend URL is
   intentionally configured.

   HTTP transport (Phase 2, opt-in): posts to COLD's own live-data Edge
   Function boundary and returns its `data` field, which is generated from
   the exact same fixtures (see supabase/functions/live-data/README.md).
   If the HTTP call fails for any reason, this falls back to the local
   fixture rather than erroring the page — and because a fixture's own
   `freshness` is always SNAPSHOT or UNAVAILABLE, a failed HTTP call can
   never be silently reported as LIVE data.

   LiveCommandCenter.jsx and LiveCompany.jsx call only getCompanyProfile /
   getQuote / getFinancials, exactly as in Phase 1 — neither page needed to
   change for this.
   ========================================================================== */

import companyO from "../fixtures/O.company.json" with { type: "json" };
import factsO from "../fixtures/O.facts.json" with { type: "json" };
import quoteO from "../fixtures/O.quote.json" with { type: "json" };
import companyBRKB from "../fixtures/BRKB.company.json" with { type: "json" };
import factsBRKB from "../fixtures/BRKB.facts.json" with { type: "json" };
import quoteBRKB from "../fixtures/BRKB.quote.json" with { type: "json" };
import { isAllowedTicker, LIVE_TICKERS } from "../data/liveCompanies.js";

const COMPANY_FIXTURES = { O: companyO, "BRK.B": companyBRKB };
const FACTS_FIXTURES = { O: factsO, "BRK.B": factsBRKB };
const QUOTE_FIXTURES = { O: quoteO, "BRK.B": quoteBRKB };

function assertAllowedTicker(ticker) {
  if (!isAllowedTicker(ticker)) {
    throw new Error(`Ticker "${ticker}" is not part of the Phase 1 LIVE allowlist (${LIVE_TICKERS.join(", ")})`);
  }
}

// Test-only override seam. Production code (App.jsx, LIVE pages) never
// calls this — the real app always resolves transport from Vite's env.
let testBackendUrl;
let testFetch;

/** @internal test-only. Never called from application code. */
export function __configureForTests({ backendUrl, fetchImpl } = {}) {
  testBackendUrl = backendUrl;
  testFetch = fetchImpl;
}

function resolveBackendUrl() {
  if (testBackendUrl !== undefined) return testBackendUrl || null;
  // import.meta.env only exists under Vite; the `?.` keeps this safe when
  // this module is imported directly by Node (e.g. under `npm test`).
  const configured = typeof import.meta !== "undefined" ? import.meta.env?.VITE_LIVE_DATA_URL : undefined;
  return configured && String(configured).trim() ? String(configured).trim() : null;
}

function resolveFetch() {
  if (testFetch) return testFetch;
  return typeof fetch !== "undefined" ? fetch : undefined;
}

async function fetchFromBackend(backendUrl, action, ticker) {
  const doFetch = resolveFetch();
  if (!doFetch) throw new Error("fetch is not available in this environment");
  const res = await doFetch(backendUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ticker }),
  });
  if (!res.ok) throw new Error("live-data backend responded with status " + res.status);
  const json = await res.json();
  if (!json || json.ok !== true) {
    throw new Error((json && json.error && json.error.message) || "live-data backend returned an error");
  }
  return json.data;
}

async function resolve(action, ticker, fixtureMap) {
  assertAllowedTicker(ticker);
  const backendUrl = resolveBackendUrl();
  if (!backendUrl) return fixtureMap[ticker];
  try {
    return await fetchFromBackend(backendUrl, action, ticker);
  } catch {
    // HTTP transport failed — fall back to the SNAPSHOT/UNAVAILABLE local
    // fixture. Never upgraded, never relabeled as LIVE.
    return fixtureMap[ticker];
  }
}

export const liveDataClient = {
  /** @returns {Promise<import("../schema/company.js").NormalizedCompanyProfile>} */
  async getCompanyProfile(ticker) {
    return resolve("company", ticker, COMPANY_FIXTURES);
  },

  /** @returns {Promise<import("../schema/quote.js").NormalizedMarketQuote>} */
  async getQuote(ticker) {
    return resolve("quote", ticker, QUOTE_FIXTURES);
  },

  /** @returns {Promise<import("../schema/metric.js").NormalizedFinancialMetric[]>} */
  async getFinancials(ticker) {
    const result = await resolve("facts", ticker, FACTS_FIXTURES);
    return result || [];
  },
};
