/* ============================================================================
   Allowlisted SEC standardized-GAAP fact mapping registry.

   This is the only place a us-gaap XBRL concept name is ever written down.
   Nothing outside this file decides which concepts get exposed — the
   companyfacts payload has ~490 concepts per company, and only the ones
   listed here are ever surfaced. A concept is never chosen dynamically from
   a label; every candidate below was manually verified (2026-08-12) against
   real https://data.sec.gov/api/xbrl/companyfacts responses for O and
   BRK.B before being added — see supabase/functions/live-data/README.md
   for the ones that were considered and rejected.

   conceptCandidates is ORDERED: the first candidate with a valid, current-
   period value for the target filing wins. This exists because the two
   companies don't always tag the same real-world fact with the same
   concept name (e.g. Realty Income tags net income available to common
   stockholders separately from noncontrolling interests; Berkshire's
   comparable concept is plain NetIncomeLoss).
   ========================================================================== */

import type { CompanyType } from "./contracts.ts";

export type PeriodKind = "instant" | "duration";

export interface GaapFactMapping {
  metricKey: string;
  conceptCandidates: string[];
  permittedUnits: string[];
  permittedForms: readonly string[];
  periodKind: PeriodKind;
  companyApplicability: CompanyType[];
  label: string;
  explanation: string;
  confidenceNote: string;
}

const BOTH: CompanyType[] = ["equity-reit", "diversified-holding-company"];

export const GAAP_FACT_MAPPINGS: GaapFactMapping[] = [
  {
    metricKey: "secRevenue",
    conceptCandidates: ["Revenues"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "duration",
    companyApplicability: BOTH,
    label: "Revenue (SEC-reported)",
    explanation: "Total revenue as presented on the primary financial statements filed with the SEC.",
    confidenceNote: "Both companies currently tag total revenue with the standard Revenues concept.",
  },
  {
    metricKey: "secNetIncome",
    conceptCandidates: ["NetIncomeLossAvailableToCommonStockholdersBasic", "NetIncomeLoss"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "duration",
    companyApplicability: BOTH,
    label: "Net income attributable to shareholders (SEC-reported)",
    explanation: "Net income attributable to the company's own shareholders, excluding amounts attributable to noncontrolling interests.",
    confidenceNote:
      "Realty Income tags net income available to common stockholders as its own concept, distinct from noncontrolling interests. Berkshire does not use that concept; its NetIncomeLoss excludes noncontrolling interests directly (ProfitLoss, present but not used here, includes them — about $105M higher in Q2 2026).",
  },
  {
    metricKey: "secTotalAssets",
    conceptCandidates: ["Assets"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "instant",
    companyApplicability: BOTH,
    label: "Total assets (SEC-reported)",
    explanation: "Total assets as of the balance-sheet date in the selected filing.",
    confidenceNote: "Both companies currently tag total assets with the standard Assets concept.",
  },
  {
    metricKey: "secTotalLiabilities",
    conceptCandidates: ["Liabilities"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "instant",
    companyApplicability: BOTH,
    label: "Total liabilities (SEC-reported)",
    explanation: "Total liabilities as of the balance-sheet date in the selected filing.",
    confidenceNote: "Both companies currently tag total liabilities with the standard Liabilities concept.",
  },
  {
    metricKey: "secCashAndCashEquivalents",
    conceptCandidates: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "instant",
    companyApplicability: BOTH,
    label: "Cash and cash equivalents (SEC-reported)",
    explanation: "Cash and cash equivalents as of the balance-sheet date in the selected filing.",
    confidenceNote:
      "Realty Income tags unrestricted cash separately. Berkshire's current filings no longer use that concept and instead tag a combined cash + restricted-cash figure — the fallback concept is used for Berkshire and the value carries that distinction in its explanation.",
  },
  {
    metricKey: "secLongTermDebt",
    conceptCandidates: ["LongTermDebt"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "instant",
    companyApplicability: BOTH,
    label: "Long-term debt (SEC-reported)",
    explanation: "Total long-term debt as of the balance-sheet date in the selected filing.",
    confidenceNote:
      "Deliberately unavailable for both companies in this phase. Realty Income's LongTermDebt concept has not been used since a 2017 filing (its current filings break debt out differently, e.g. NotesPayable for unsecured notes and SecuredDebt for mortgages — summing those would be a COLD-side derivation, not a direct reported fact, so it is not done). Berkshire does not use this concept at all. Rather than approximate from a partial concept, this is always unavailable.",
  },
  {
    metricKey: "secDilutedEPS",
    conceptCandidates: ["EarningsPerShareDiluted"],
    permittedUnits: ["USD/shares"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "duration",
    companyApplicability: BOTH,
    label: "Diluted earnings per share (SEC-reported)",
    explanation: "GAAP diluted earnings per share for the selected period.",
    confidenceNote:
      "Available for Realty Income. Berkshire reports EPS per share class (A and B) using XBRL dimensions this phase's Company Facts lookup does not resolve, and its non-dimensional EarningsPerShareBasic concept has not been used since a 2014 filing — marked unavailable rather than guessed or mismatched to the wrong share class.",
  },
  {
    metricKey: "secSharesOutstanding",
    conceptCandidates: ["CommonStockSharesOutstanding"],
    permittedUnits: ["shares"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "instant",
    companyApplicability: BOTH,
    label: "Shares outstanding (SEC-reported)",
    explanation: "Common shares outstanding as of the balance-sheet date in the selected filing.",
    confidenceNote:
      "Available for Realty Income. Berkshire reports shares outstanding per class (A and B) via dimensional dei tags this phase does not resolve — marked unavailable rather than guessed.",
  },
  {
    metricKey: "secRealEstateDepreciationAndAmortization",
    conceptCandidates: ["DepreciationDepletionAndAmortization"],
    permittedUnits: ["USD"],
    permittedForms: ["10-K", "10-Q"],
    periodKind: "duration",
    companyApplicability: ["equity-reit"],
    label: "Real estate depreciation & amortization (SEC-reported)",
    explanation: "The period depreciation and amortization expense reported on the income statement.",
    confidenceNote:
      "Equity REIT only. This is the period expense concept, not RealEstateInvestmentPropertyAccumulatedDepreciation — a similarly-named but different concept representing the cumulative balance-sheet contra-asset, not a period figure. Using the wrong one would silently misstate the value; only the period-expense concept is mapped here.",
  },
];

export function mappingsFor(companyType: CompanyType): GaapFactMapping[] {
  return GAAP_FACT_MAPPINGS.filter((m) => m.companyApplicability.includes(companyType));
}

/*
 * Evaluated and explicitly rejected (see README.md "Known unmapped facts"):
 *   - "U.S. Treasury bills / short-term investments" for Berkshire — no
 *     unambiguous us-gaap concept exists; the only "Treasury"-named concepts
 *     present (TreasuryStockValue, TreasuryStockValueAcquiredCostMethod) are
 *     about treasury STOCK (buybacks), an unrelated concept with a similar
 *     name. Not added to this registry at all, rather than mapped to the
 *     wrong thing.
 */
