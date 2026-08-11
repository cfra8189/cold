/* ============================================================================
   Normalized market quote

   Phase 1 has no market-data provider connected. Every quote fixture must
   have price: null, freshness: UNAVAILABLE, unavailableReason: "provider_not_connected".
   ========================================================================== */

/**
 * @typedef {Object} NormalizedMarketQuote
 * @property {string} ticker
 * @property {number|null} price
 * @property {number|null} previousClose
 * @property {number|null} changePct
 * @property {string} currency                ISO 4217, e.g. "USD"
 * @property {string} unit                     "USD_per_share"
 * @property {string|null} marketState         "open" | "closed" | "pre" | "post" | null when unavailable
 * @property {string|null} asOf                ISO timestamp the price applies to; null when unavailable
 * @property {string|null} unavailableReason    required when price is null
 * @property {import("./freshness.js").FreshnessState} freshness
 * @property {import("./provenance.js").Provenance} provenance
 */

export function isQuoteAvailable(quote) {
  return !!quote && quote.price !== null;
}
