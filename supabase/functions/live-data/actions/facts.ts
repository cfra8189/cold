/* ============================================================================
   facts action — two clearly separate groups in the response:

     secReportedGaap        allowlisted, standardized GAAP facts from SEC
                             Company Facts (Phase 3), tied to the same
                             latest-10-Q filing the filings action reports.
     companyReportedSnapshot the existing, Phase 1/2-approved company
                             supplemental fixtures (Realty Income's reported
                             AFFO/occupancy/property count/payout ratio,
                             Berkshire's operating earnings/insurance float)
                             — unchanged, still classification: "reported",
                             still sourced from the company's own release,
                             never relabeled as SEC GAAP data.

   This function never computes AFFO, occupancy, or any other company
   supplemental metric from SEC data — those stay exactly what Phase 1/2
   verified them to be. It also never computes affoPayoutRatio/affoCoverage/
   occupancyDelta itself; that stays in the approved client-side calculation
   layer (src/live/calculations/*.js), unchanged.
   ========================================================================== */

import type { DataMode, NormalizedFinancialMetric, Ticker } from "../shared/contracts.ts";
import { TICKER_COMPANY_TYPE } from "../shared/contracts.ts";
import { isSecConfigured } from "../shared/secConfig.ts";
import { getSubmissions, getCompanyFacts, APPROVED_CIKS } from "../shared/secClient.ts";
import type { SecClientDeps } from "../shared/secClient.ts";
import { selectFiling, buildPrimaryDocumentUrl } from "../shared/secFilings.ts";
import { mappingsFor } from "../shared/secFactMapping.ts";
import { applyMapping } from "../shared/secFacts.ts";
import type { TargetPeriod } from "../shared/secFacts.ts";
import { findFiscalPeriodForAccession } from "../shared/secOrchestration.ts";
import type { SecCache } from "../shared/secCache.ts";
import { fetchWithCache } from "../shared/secFetchWithCache.ts";
import { O_FACTS, BRKB_FACTS } from "../shared/fixtures.ts";

export interface FactsActionDeps {
  cache: SecCache;
  secDeps?: SecClientDeps;
}

function unavailableGaapFacts(ticker: Ticker, retrievedAt: string): NormalizedFinancialMetric[] {
  const mappings = mappingsFor(TICKER_COMPANY_TYPE[ticker]);
  return mappings.map((mapping) => ({
    ticker,
    metricKey: mapping.metricKey,
    value: null,
    unavailableReason: "sec_not_connected",
    currency: "",
    unit: mapping.permittedUnits[0] === "USD" ? "USD_millions" : mapping.permittedUnits[0] === "USD/shares" ? "USD_per_share" : "count",
    classification: "reported",
    period: { fiscalYear: 0, fiscalQuarter: null, periodType: "quarterly", periodStart: "", periodEnd: "" },
    asOf: null,
    retrievedAt,
    freshness: "UNAVAILABLE",
    provenance: { source: "SEC EDGAR", sourceType: "sec-filing" },
  }));
}

export async function getFactsResult(ticker: Ticker, deps: FactsActionDeps) {
  const companyReportedSnapshot = ticker === "O" ? O_FACTS : BRKB_FACTS;
  const now = new Date().toISOString();

  if (!isSecConfigured(deps.secDeps?.userAgent)) {
    return { data: { secReportedGaap: unavailableGaapFacts(ticker, now), companyReportedSnapshot }, dataMode: "SNAPSHOT" as DataMode };
  }

  const cik = APPROVED_CIKS[ticker];

  const submissionsOutcome = await fetchWithCache(deps.cache, `submissions:${ticker}`, () => getSubmissions(ticker, deps.secDeps));
  if (submissionsOutcome.status === "UNAVAILABLE") {
    return { data: { secReportedGaap: unavailableGaapFacts(ticker, now), companyReportedSnapshot }, dataMode: "SNAPSHOT" as DataMode };
  }

  const latest10Q = selectFiling(submissionsOutcome.data, ticker, cik, "10-Q", submissionsOutcome.retrievedAt, submissionsOutcome.status);
  if ("unavailable" in latest10Q) {
    return { data: { secReportedGaap: unavailableGaapFacts(ticker, now), companyReportedSnapshot }, dataMode: "SNAPSHOT" as DataMode };
  }

  const factsOutcome = await fetchWithCache(deps.cache, `companyfacts:${ticker}`, () => getCompanyFacts(ticker, deps.secDeps));
  if (factsOutcome.status === "UNAVAILABLE") {
    return { data: { secReportedGaap: unavailableGaapFacts(ticker, now), companyReportedSnapshot }, dataMode: "SNAPSHOT" as DataMode };
  }

  const fiscalPeriod = findFiscalPeriodForAccession(factsOutcome.data, latest10Q.accessionNumber);
  const target: TargetPeriod = {
    form: "10-Q",
    fy: fiscalPeriod?.fy ?? 0,
    fp: fiscalPeriod?.fp ?? "",
    periodStart: latest10Q.reportDate,
    periodEnd: latest10Q.reportDate,
  };
  const documentUrl = buildPrimaryDocumentUrl(cik, latest10Q.accessionNumber, latest10Q.primaryDocument);

  const mappings = mappingsFor(TICKER_COMPANY_TYPE[ticker]);
  const secReportedGaap = mappings.map((mapping) =>
    applyMapping(mapping, {
      ticker,
      companyFacts: factsOutcome.data,
      target,
      retrievedAt: factsOutcome.retrievedAt,
      freshness: factsOutcome.status,
      documentUrl,
    })
  );

  return { data: { secReportedGaap, companyReportedSnapshot }, dataMode: factsOutcome.status as DataMode };
}
