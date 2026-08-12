/* ============================================================================
   filings action — SEC EDGAR is not connected until Phase 3. This never
   fabricates a filing list. It honestly reports "not_connected" and, as a
   convenience, surfaces the same document links already verified and
   shipped in the Phase 1 fixtures (the official company releases and their
   SEC filing references) — each explicitly labeled SNAPSHOT, never framed
   as a live filings feed.
   ========================================================================== */

import type { Ticker } from "../shared/contracts.ts";
import { O_COMPANY, O_FACTS, BRKB_COMPANY, BRKB_FACTS } from "../shared/fixtures.ts";

interface KnownSource {
  label: string;
  url: string;
  documentType: string | null;
  freshness: "SNAPSHOT";
}

function knownSourcesFor(ticker: Ticker): KnownSource[] {
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

  for (const fact of facts) {
    add(fact.provenance.documentUrl, fact.provenance.documentType ?? null, `${fact.metricKey} source`);
  }

  return sources;
}

export function getFilingsStatus(ticker: Ticker) {
  return {
    ticker,
    status: "not_connected" as const,
    message: "Automated SEC filing retrieval is not connected yet. Phase 3 will add a real SEC EDGAR integration.",
    knownSources: knownSourcesFor(ticker),
  };
}
