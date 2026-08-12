/* ============================================================================
   filings action — official SEC EDGAR filing metadata for the latest 10-K,
   10-Q and 8-K. Falls back to an honest "not connected" shape (still using
   the same known, Phase-1-verified source links, clearly labeled SNAPSHOT)
   when SEC_EDGAR_USER_AGENT is not configured or SEC cannot be reached and
   no cache entry exists yet — it never fabricates filing data.
   ========================================================================== */

import type { DataMode, Ticker } from "../shared/contracts.ts";
import { isSecConfigured } from "../shared/secConfig.ts";
import { getSubmissions, APPROVED_CIKS } from "../shared/secClient.ts";
import type { SecClientDeps } from "../shared/secClient.ts";
import { selectLatestFilings } from "../shared/secFilings.ts";
import type { SecCache } from "../shared/secCache.ts";
import { fetchWithCache } from "../shared/secFetchWithCache.ts";
import { O_COMPANY, O_FACTS, BRKB_COMPANY, BRKB_FACTS } from "../shared/fixtures.ts";

export interface FilingsActionDeps {
  cache: SecCache;
  secDeps?: SecClientDeps;
}

interface KnownSource {
  label: string;
  url: string;
  documentType: string | null;
  freshness: "SNAPSHOT";
}

function knownSourcesFallback(ticker: Ticker): KnownSource[] {
  const company = ticker === "O" ? O_COMPANY : BRKB_COMPANY;
  const facts = ticker === "O" ? O_FACTS : BRKB_FACTS;
  const seen = new Set<string>();
  const sources: KnownSource[] = [];
  const add = (url: string | null | undefined, documentType: string | null, label: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    sources.push({ label, url, documentType, freshness: "SNAPSHOT" });
  };
  add(company.provenance.documentUrl, company.provenance.documentType ?? null, "Company profile source");
  const filingRef = (company.provenance as { filingReferenceUrl?: string }).filingReferenceUrl;
  if (filingRef) add(filingRef, "sec-filing-reference", "SEC filing reference (secondary, not independently verified)");
  for (const fact of facts) add(fact.provenance.documentUrl, fact.provenance.documentType ?? null, `${fact.metricKey} source`);
  return sources;
}

function notConnectedResult(ticker: Ticker, message: string) {
  return {
    data: {
      ticker,
      status: "not_connected" as const,
      message,
      filings: null,
      knownSources: knownSourcesFallback(ticker),
    },
    dataMode: "SNAPSHOT" as DataMode,
  };
}

export async function getFilingsResult(ticker: Ticker, deps: FilingsActionDeps) {
  if (!isSecConfigured(deps.secDeps?.userAgent)) {
    return notConnectedResult(
      ticker,
      "SEC EDGAR is not configured in this environment (SEC_EDGAR_USER_AGENT is not set). Showing previously verified company-supplemental sources instead."
    );
  }

  const cik = APPROVED_CIKS[ticker];
  const outcome = await fetchWithCache(deps.cache, `submissions:${ticker}`, () => getSubmissions(ticker, deps.secDeps));

  if (outcome.status === "UNAVAILABLE") {
    return notConnectedResult(ticker, "SEC EDGAR could not be reached and no cached filing data is available yet.");
  }

  const filings = selectLatestFilings(outcome.data, ticker, cik, outcome.retrievedAt, outcome.status);
  return {
    data: {
      ticker,
      status: "connected" as const,
      message: null,
      filings,
      retrievedAt: outcome.retrievedAt,
    },
    dataMode: outcome.status as DataMode,
  };
}
