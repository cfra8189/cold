/* ============================================================================
   Small shared helpers used by both the facts and filings actions, so
   neither has to duplicate "find the fiscal period that goes with this
   filing" logic.
   ========================================================================== */

import type { SecCompanyFactsResponse } from "./secClient.ts";

/**
 * SEC tags every entry pulled from a given filing (accession) with that
 * filing's own fy/fp — including prior-year comparative entries, which
 * share the accession but not the date range. Scanning any concept for a
 * matching accn is therefore a safe, non-guessing way to answer "what
 * fiscal year/period does this filing report," without doing date math on
 * fiscal quarter boundaries.
 */
export function findFiscalPeriodForAccession(companyFacts: SecCompanyFactsResponse, accessionNumber: string): { fy: number; fp: string } | null {
  const gaap = companyFacts.facts["us-gaap"] ?? {};
  for (const concept of Object.values(gaap)) {
    for (const entries of Object.values(concept.units)) {
      for (const entry of entries) {
        if (entry.accn === accessionNumber) return { fy: entry.fy, fp: entry.fp };
      }
    }
  }
  return null;
}
