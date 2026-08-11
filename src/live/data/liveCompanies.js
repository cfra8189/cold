/* ============================================================================
   LIVE company identity registry — the Phase 1 ticker allowlist.

   This is deliberately minimal: ticker, CIK and companyType only. It is the
   source of truth for which tickers LIVE mode will ever resolve, and for
   which metric profile/calculation engine applies. Financial facts and the
   fuller descriptive profile live separately in live/fixtures/*.company.json
   (kept in sync with this file — see live/structural.test.js).

   CIK numbers verified against SEC EDGAR (sec.gov/edgar/browse/?CIK=...) on 2026-08-11.
   ========================================================================== */

export const LIVE_COMPANIES = Object.freeze({
  O: {
    ticker: "O",
    cik: "0000726728",
    companyType: "equity-reit",
  },
  "BRK.B": {
    ticker: "BRK.B",
    cik: "0001067983",
    companyType: "diversified-holding-company",
  },
});

export const LIVE_TICKERS = Object.freeze(Object.keys(LIVE_COMPANIES));

export function isAllowedTicker(ticker) {
  return LIVE_TICKERS.includes(ticker);
}
