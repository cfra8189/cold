/* ============================================================================
   Diversified holding-company calculations.

   No REIT function exists in this module. There is no AFFO, occupancy,
   payout-ratio or cap-rate calculation here — calling one for a holding
   company is an import error, not a mistaken "N/A" produced by the wrong
   function.
   ========================================================================== */

import { unavailableMetric, calculatedMetric } from "./helpers.js";

/**
 * Generic period-over-period growth for a per-share (or any scalar) reported
 * metric. Used for e.g. net earnings per Class B share, current vs. prior
 * comparable period.
 */
export function perShareGrowth({ current, prior }, { metricKey = "perShareGrowth" } = {}) {
  const ticker = current?.ticker;
  const period = current?.period;
  if (!current || !prior || current.value == null || prior.value == null) {
    return unavailableMetric({
      ticker, metricKey, unit: "percent", period,
      derivedFrom: ["current period value", "prior period value"],
      calculationInputs: { current: current?.value ?? null, prior: prior?.value ?? null },
    });
  }
  const growthPct = ((current.value - prior.value) / Math.abs(prior.value)) * 100;
  return calculatedMetric({
    ticker,
    metricKey,
    value: growthPct,
    unit: "percent",
    period,
    asOf: current.asOf,
    freshness: current.freshness,
    derivedFrom: ["current period value", "prior period value"],
    calculationInputs: {
      current: current.value,
      prior: prior.value,
      currentPeriodEnd: current.period?.periodEnd,
      priorPeriodEnd: prior.period?.periodEnd,
    },
  });
}
