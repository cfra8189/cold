/* ============================================================================
   Equity REIT calculations.

   Deliberately narrow. This module does NOT derive AFFO — there is no
   revenue -> NOI -> EBITDA -> FFO -> AFFO pipeline here and there must never
   be one. AFFO is company-defined and non-GAAP; it can only ever enter COLD
   as a "reported" fact copied from the company's own reconciliation (see
   live/fixtures/O.facts.json). These functions only combine reported facts
   into specifically-defined, narrow ratios — and if a required input is
   missing, they return "unavailable", never zero and never a guess.
   ========================================================================== */

import { unavailableMetric, calculatedMetric } from "./helpers.js";

/**
 * Both affoPayoutRatio and affoCoverage divide two already-rounded,
 * company-disclosed per-share figures (e.g. $1.09, $0.8115). A company may
 * separately publish its own payout ratio computed from unrounded internal
 * dollars, which can differ from this quotient by a tenth of a point or so.
 * That is not an error in either number — it is what recomputing a ratio
 * from rounded inputs always does. Never adjust the inputs to force a match.
 */
const ROUNDED_INPUT_NOTE = "Calculated from rounded per-share figures as reported; the company's own reported ratio (if published) may differ slightly because it is computed from unrounded underlying dollars.";

/** dividend / AFFO, both reported. */
export function affoPayoutRatio({ reportedDividendPerShare, reportedAffoPerShare }) {
  const ticker = reportedAffoPerShare?.ticker || reportedDividendPerShare?.ticker;
  const period = reportedAffoPerShare?.period || reportedDividendPerShare?.period;
  if (!reportedDividendPerShare || !reportedAffoPerShare || reportedDividendPerShare.value == null || reportedAffoPerShare.value == null) {
    return unavailableMetric({
      ticker, metricKey: "affoPayoutRatio", unit: "ratio", period,
      derivedFrom: ["reportedDividendPerShare", "reportedAffoPerShare"],
      calculationInputs: { reportedDividendPerShare: reportedDividendPerShare?.value ?? null, reportedAffoPerShare: reportedAffoPerShare?.value ?? null },
    });
  }
  return calculatedMetric({
    ticker,
    metricKey: "affoPayoutRatio",
    value: reportedDividendPerShare.value / reportedAffoPerShare.value,
    unit: "ratio",
    period,
    asOf: reportedAffoPerShare.asOf,
    freshness: reportedAffoPerShare.freshness,
    derivedFrom: ["reportedDividendPerShare", "reportedAffoPerShare"],
    calculationInputs: {
      reportedDividendPerShare: reportedDividendPerShare.value,
      reportedAffoPerShare: reportedAffoPerShare.value,
    },
    approximate: true,
    precisionNote: ROUNDED_INPUT_NOTE,
  });
}

/** AFFO / dividend, both reported — the inverse of payout ratio. */
export function affoCoverage({ reportedAffoPerShare, reportedDividendPerShare }) {
  const ticker = reportedAffoPerShare?.ticker || reportedDividendPerShare?.ticker;
  const period = reportedAffoPerShare?.period || reportedDividendPerShare?.period;
  if (!reportedDividendPerShare || !reportedAffoPerShare || reportedDividendPerShare.value == null || reportedAffoPerShare.value == null) {
    return unavailableMetric({
      ticker, metricKey: "affoCoverage", unit: "ratio", period,
      derivedFrom: ["reportedAffoPerShare", "reportedDividendPerShare"],
      calculationInputs: { reportedAffoPerShare: reportedAffoPerShare?.value ?? null, reportedDividendPerShare: reportedDividendPerShare?.value ?? null },
    });
  }
  return calculatedMetric({
    ticker,
    metricKey: "affoCoverage",
    value: reportedAffoPerShare.value / reportedDividendPerShare.value,
    unit: "ratio",
    period,
    asOf: reportedAffoPerShare.asOf,
    freshness: reportedAffoPerShare.freshness,
    derivedFrom: ["reportedAffoPerShare", "reportedDividendPerShare"],
    calculationInputs: {
      reportedAffoPerShare: reportedAffoPerShare.value,
      reportedDividendPerShare: reportedDividendPerShare.value,
    },
    approximate: true,
    precisionNote: ROUNDED_INPUT_NOTE,
  });
}

/** Change in reported occupancy between two comparable, labeled periods. */
export function occupancyDelta({ currentOccupancy, priorOccupancy }) {
  const ticker = currentOccupancy?.ticker;
  const period = currentOccupancy?.period;
  if (!currentOccupancy || !priorOccupancy || currentOccupancy.value == null || priorOccupancy.value == null) {
    return unavailableMetric({
      ticker, metricKey: "occupancyDelta", unit: "percentage_points", period,
      derivedFrom: ["occupancy (current period)", "occupancy (prior period)"],
      calculationInputs: { currentOccupancy: currentOccupancy?.value ?? null, priorOccupancy: priorOccupancy?.value ?? null },
    });
  }
  return calculatedMetric({
    ticker,
    metricKey: "occupancyDelta",
    value: currentOccupancy.value - priorOccupancy.value,
    unit: "percentage_points",
    period,
    asOf: currentOccupancy.asOf,
    freshness: currentOccupancy.freshness,
    derivedFrom: ["occupancy (current period)", "occupancy (prior period)"],
    calculationInputs: {
      currentOccupancy: currentOccupancy.value,
      priorOccupancy: priorOccupancy.value,
      currentPeriodEnd: currentOccupancy.period?.periodEnd,
      priorPeriodEnd: priorOccupancy.period?.periodEnd,
    },
  });
}

/*
 * Deliberately NOT implemented in Phase 1 (see architecture doc §4 and §6):
 *   - netDebtToReportedEbitda — no fixture input with a confirmed-compatible
 *     EBITDA/EBITDAre definition yet.
 *   - tenantConcentrationDelta — requires comparable-period top-tenant data
 *     not captured in the Phase 1 fixtures.
 *   - refinancingStressEstimate — explicitly out of scope for Phase 1; this
 *     is an on-demand "estimated" calculation for a later phase, never
 *     auto-computed or auto-displayed.
 */
