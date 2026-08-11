/* ============================================================================
   Shared helpers for calculation functions. Never used to fabricate a value —
   only to shape a consistent "unavailable" result when a required input is
   missing, and to timestamp/attribute a successful calculation consistently.
   ========================================================================== */

export function nowIso() {
  return new Date().toISOString();
}

/**
 * Build a metric envelope representing a calculation that could not run
 * because a required input was missing. Never substitutes zero. Still
 * records which inputs the calculation needed (derivedFrom) and whatever
 * partial values were actually available (calculationInputs), so the
 * "unavailable" result stays as auditable as a successful one.
 */
export function unavailableMetric({ ticker, metricKey, unit, period, reason = "missing_required_input", derivedFrom = [], calculationInputs = {} }) {
  return {
    ticker: ticker || null,
    metricKey,
    value: null,
    unavailableReason: reason,
    currency: "",
    unit: unit || "",
    classification: "calculated",
    period: period || null,
    asOf: null,
    calculatedAt: nowIso(),
    derivedFrom: derivedFrom.length ? derivedFrom : [metricKey + ".requiredInputs"],
    calculationInputs: Object.keys(calculationInputs).length ? calculationInputs : { status: "one or more required inputs were missing" },
    freshness: "UNAVAILABLE",
    provenance: { source: "COLD internal calculation", sourceType: "internal-calculation" },
  };
}

export function calculatedMetric({ ticker, metricKey, value, unit, period, asOf, freshness, derivedFrom, calculationInputs, approximate, precisionNote }) {
  return {
    ticker,
    metricKey,
    value,
    unavailableReason: null,
    currency: "",
    unit,
    classification: "calculated",
    period,
    asOf,
    calculatedAt: nowIso(),
    derivedFrom,
    calculationInputs,
    ...(approximate ? { approximate: true, precisionNote } : {}),
    freshness,
    provenance: { source: "COLD internal calculation", sourceType: "internal-calculation" },
  };
}
