/* ============================================================================
   quote action — no market-data provider is connected in Phase 2 either.
   Always returns the normalized unavailable-quote fixture: price null,
   freshness UNAVAILABLE, unavailableReason "provider_not_connected".
   ========================================================================== */

import type { Ticker } from "../shared/contracts.ts";
import { O_QUOTE, BRKB_QUOTE } from "../shared/fixtures.ts";

export function getQuote(ticker: Ticker) {
  return ticker === "O" ? O_QUOTE : BRKB_QUOTE;
}
