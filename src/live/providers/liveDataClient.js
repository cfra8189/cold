/* ============================================================================
   Fixture-backed LIVE data client.

   Phase 1 reads local fixtures only — no network request is ever made here.
   Every method is async and returns the same normalized shapes a future
   backend would return, so LIVE pages never need to change when Phase 2
   replaces fixture loading with a real fetch() to COLD's own backend.
   ========================================================================== */

import companyO from "../fixtures/O.company.json";
import factsO from "../fixtures/O.facts.json";
import quoteO from "../fixtures/O.quote.json";
import companyBRKB from "../fixtures/BRKB.company.json";
import factsBRKB from "../fixtures/BRKB.facts.json";
import quoteBRKB from "../fixtures/BRKB.quote.json";
import { isAllowedTicker, LIVE_TICKERS } from "../data/liveCompanies.js";

const COMPANY_FIXTURES = { O: companyO, "BRK.B": companyBRKB };
const FACTS_FIXTURES = { O: factsO, "BRK.B": factsBRKB };
const QUOTE_FIXTURES = { O: quoteO, "BRK.B": quoteBRKB };

function assertAllowedTicker(ticker) {
  if (!isAllowedTicker(ticker)) {
    throw new Error(`Ticker "${ticker}" is not part of the Phase 1 LIVE allowlist (${LIVE_TICKERS.join(", ")})`);
  }
}

export const liveDataClient = {
  /** @returns {Promise<import("../schema/company.js").NormalizedCompanyProfile>} */
  async getCompanyProfile(ticker) {
    assertAllowedTicker(ticker);
    return COMPANY_FIXTURES[ticker];
  },

  /** @returns {Promise<import("../schema/quote.js").NormalizedMarketQuote>} */
  async getQuote(ticker) {
    assertAllowedTicker(ticker);
    return QUOTE_FIXTURES[ticker];
  },

  /** @returns {Promise<import("../schema/metric.js").NormalizedFinancialMetric[]>} */
  async getFinancials(ticker) {
    assertAllowedTicker(ticker);
    return FACTS_FIXTURES[ticker] || [];
  },
};
