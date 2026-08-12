/* ============================================================================
   Period selection — the critical part.

   A SEC Company Facts response mixes, for the same concept, form and fiscal
   period, several different DURATION spans: a standalone quarter, the
   year-to-date cumulative through that quarter, and (every quarter) the
   prior-year comparative — all tagged with the same fy/fp/form. Picking
   "whatever has the newest filed date" or "whatever matches fy/fp" alone is
   not enough; a six-month year-to-date figure would silently get shown as
   if it were the standalone Q2 value. This module exists specifically to
   avoid that.

   Algorithm, in order:
     1. Filter to entries whose form/fy/fp exactly match the target filing
        (the filing already selected by secFilings.ts, so GAAP facts are
        always tied to the same filing the filings section shows).
     2. For duration facts, additionally filter by the actual (end - start)
        span length: ~80-100 days for a quarterly figure, ~350-380 days for
        an annual one. This is what separates a standalone quarter from its
        year-to-date cumulative sibling, which share the same fy/fp/form.
     3. Among whatever remains, prefer the entry tied to the latest `filed`
        date — the same fy/fp period can appear in more than one filing
        (e.g. as a prior-year comparative in a later filing); the most
        recently filed accession is treated as authoritative.
     4. If nothing survives every step, the fact is unavailable — never
        estimated, never a stale substitute presented as current.
   ========================================================================== */

import type { SecCompanyFactsResponse, SecRawEntry } from "./secClient.ts";
import type { GaapFactMapping, PeriodKind } from "./secFactMapping.ts";
import type { Ticker, NormalizedFinancialMetric, FreshnessState } from "./contracts.ts";
import type { FilingForm } from "./secFilings.ts";

export interface TargetPeriod {
  form: FilingForm;
  fy: number;
  fp: string; // "Q1" | "Q2" | "Q3" | "Q4" | "FY"
  periodStart: string;
  periodEnd: string;
}

function durationDays(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function matchesDurationSpan(entry: SecRawEntry, fp: string): boolean {
  if (!entry.start) return false;
  const days = durationDays(entry.start, entry.end);
  if (fp === "FY") return days >= 350 && days <= 380;
  return days >= 80 && days <= 100; // Q1/Q2/Q3/Q4 standalone quarter
}

/**
 * Select the single correct raw entry for one concept/unit against a target
 * period. Returns null when no entry survives every filter — the caller
 * must treat that as unavailable, not fall back to something looser.
 */
export function selectFactEntry(entries: SecRawEntry[] | undefined, target: TargetPeriod, periodKind: PeriodKind): SecRawEntry | null {
  if (!entries || entries.length === 0) return null;

  let candidates = entries.filter((e) => e.form === target.form && e.fy === target.fy && e.fp === target.fp);

  // fy/fp/form alone is NOT enough: SEC tags a filing's prior-year
  // comparative entry with the SAME fy/fp/form as the filing itself (e.g.
  // a Q2 2026 10-Q's "three months ended June 30, 2025" comparative is
  // still tagged fy:2026, fp:"Q2"). The entry's own end date is what
  // actually distinguishes "this filing's own period" from "the
  // comparative period it also discloses" — so it must match the target
  // filing's real reportDate, not just the fiscal label.
  if (target.periodEnd) {
    candidates = candidates.filter((e) => e.end === target.periodEnd);
  }

  if (periodKind === "duration") {
    candidates = candidates.filter((e) => matchesDurationSpan(e, target.fp));
  }
  // Instant facts have no start date and thus no YTD-vs-quarter ambiguity —
  // the end-date match above is sufficient once combined with fy/fp/form.

  if (candidates.length === 0) return null;

  candidates = candidates.slice().sort((a, b) => (a.filed < b.filed ? 1 : a.filed > b.filed ? -1 : 0));
  return candidates[0];
}

function fiscalQuarterNumber(fp: string): number | null {
  if (fp === "FY") return null;
  const n = Number(fp.replace("Q", ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Convert a raw SEC unit/value into the same unit vocabulary the frontend's
 * formatMetricValue (src/live/schema/metric.js) already knows how to render
 * — rather than inventing a new unit label here. SEC dollar amounts arrive
 * as whole dollars; COLD displays large dollar figures in millions.
 */
function toDisplayUnit(rawUnit: string, rawVal: number): { value: number; unit: string; currency: string } {
  if (rawUnit === "USD") return { value: rawVal / 1_000_000, unit: "USD_millions", currency: "USD" };
  if (rawUnit === "USD/shares") return { value: rawVal, unit: "USD_per_share", currency: "USD" };
  if (rawUnit === "shares") return { value: rawVal, unit: "count", currency: "" };
  return { value: rawVal, unit: rawUnit, currency: "" };
}

function unavailableDisplayUnit(rawUnit: string): string {
  if (rawUnit === "USD") return "USD_millions";
  if (rawUnit === "USD/shares") return "USD_per_share";
  if (rawUnit === "shares") return "count";
  return rawUnit;
}

export interface ApplyMappingOptions {
  ticker: Ticker;
  companyFacts: SecCompanyFactsResponse;
  target: TargetPeriod;
  retrievedAt: string;
  freshness: FreshnessState;
  documentUrl: string;
}

export function applyMapping(mapping: GaapFactMapping, opts: ApplyMappingOptions): NormalizedFinancialMetric {
  const gaap = opts.companyFacts.facts["us-gaap"] ?? {};

  for (const conceptName of mapping.conceptCandidates) {
    const concept = gaap[conceptName];
    if (!concept) continue;
    for (const unit of mapping.permittedUnits) {
      const entry = selectFactEntry(concept.units[unit], opts.target, mapping.periodKind);
      if (entry) {
        const display = toDisplayUnit(unit, entry.val);
        return {
          ticker: opts.ticker,
          metricKey: mapping.metricKey,
          value: display.value,
          unavailableReason: null,
          currency: display.currency,
          unit: display.unit,
          classification: "reported",
          period: {
            fiscalYear: opts.target.fy,
            fiscalQuarter: fiscalQuarterNumber(opts.target.fp),
            periodType: opts.target.fp === "FY" ? "annual" : "quarterly",
            periodStart: entry.start ?? entry.end,
            periodEnd: entry.end,
          },
          asOf: entry.end,
          retrievedAt: opts.retrievedAt,
          freshness: opts.freshness,
          provenance: {
            source: "SEC EDGAR",
            sourceType: "sec-filing",
            documentType: opts.target.form,
            documentUrl: opts.documentUrl,
            secConcept: conceptName,
            secUnit: unit,
            accessionNumber: entry.accn,
            filedDate: entry.filed,
            ...(entry.frame ? { secFrame: entry.frame } : {}),
          },
        };
      }
    }
  }

  return {
    ticker: opts.ticker,
    metricKey: mapping.metricKey,
    value: null,
    unavailableReason: "not_reported",
    currency: "",
    unit: unavailableDisplayUnit(mapping.permittedUnits[0]),
    classification: "reported",
    period: {
      fiscalYear: opts.target.fy,
      fiscalQuarter: fiscalQuarterNumber(opts.target.fp),
      periodType: opts.target.fp === "FY" ? "annual" : "quarterly",
      periodStart: opts.target.periodStart,
      periodEnd: opts.target.periodEnd,
    },
    asOf: null,
    retrievedAt: opts.retrievedAt,
    freshness: "UNAVAILABLE",
    provenance: {
      source: "SEC EDGAR",
      sourceType: "sec-filing",
      documentType: opts.target.form,
      documentUrl: opts.documentUrl,
    },
  };
}
