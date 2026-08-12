/* ============================================================================
   facts action — returns only reported fixture facts, exactly as captured
   in Phase 1 (source, period, classification and provenance untouched).

   This deliberately does NOT compute affoPayoutRatio, affoCoverage,
   occupancyDelta, or any other derived metric. Those calculations already
   live in the approved, tested calculation layer at
   src/live/calculations/{reitCalculations,holdcoCalculations}.js and are
   run client-side against these same reported facts. Duplicating that
   arithmetic here would create a second place for it to silently diverge
   from the approved engine — so this function simply doesn't.
   ========================================================================== */

import type { Ticker } from "../shared/contracts.ts";
import { O_FACTS, BRKB_FACTS } from "../shared/fixtures.ts";

export function getFacts(ticker: Ticker) {
  return ticker === "O" ? O_FACTS : BRKB_FACTS;
}
