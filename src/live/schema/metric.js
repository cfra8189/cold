/* ============================================================================
   Normalized financial metric — every displayed LIVE value resolves to this
   shape. A component is never allowed to coerce a missing value into 0:
   value is `number | null`, and unavailableReason is required whenever
   value is null so "missing" can never be confused with "legitimately zero".

   Timestamps each have exactly one meaning, and none are duplicated with
   Provenance (see provenance.js):
     asOf          when the underlying value itself applies
     retrievedAt   when COLD retrieved this from its source (reported/manual)
     calculatedAt  when COLD computed this (calculated/estimated)
     reviewedAt    when a human verified this (manual)
     reviewedBy    required whenever reviewedAt is present
   ========================================================================== */

/** @typedef {"reported"|"calculated"|"estimated"|"manual"} MetricClassification */

export const CLASSIFICATIONS = Object.freeze(["reported", "calculated", "estimated", "manual"]);

/**
 * @typedef {Object} NormalizedFinancialMetric
 * @property {string} ticker
 * @property {string} metricKey
 * @property {number|null} value
 * @property {string|null} unavailableReason     required when value is null, e.g. "not_reported", "missing_required_input", "provider_not_connected"
 * @property {string} currency                   "USD" or "" for ratios/percentages
 * @property {string} unit                        "USD_per_share" | "USD_millions" | "USD_billions" | "percent" | "percentage_points" | "ratio" | "count"
 * @property {MetricClassification} classification
 * @property {import("./period.js").ReportingPeriod} period
 * @property {string|null} asOf                   null only if value is null
 * @property {string} [retrievedAt]
 * @property {string} [calculatedAt]
 * @property {string} [reviewedAt]
 * @property {string} [reviewedBy]
 * @property {string[]} [derivedFrom]              required when classification is "calculated" or "estimated"
 * @property {Object.<string, number|string>} [calculationInputs]  required when classification is "calculated" or "estimated"
 * @property {boolean} [approximate]               true when a calculated value was derived from already-rounded
 *                                                   inputs and may not exactly reproduce a company-reported figure
 *                                                   computed from unrounded internals. Requires precisionNote.
 * @property {string} [precisionNote]              required when approximate is true: a short explanation of why
 *                                                   the value is approximate (e.g. "derived from rounded per-share inputs")
 * @property {import("./freshness.js").FreshnessState} freshness
 * @property {import("./provenance.js").Provenance} provenance
 */

/**
 * Validate a metric envelope against the rules above. Returns an array of
 * human-readable problems; empty array means valid.
 * @param {NormalizedFinancialMetric} metric
 * @returns {string[]}
 */
export function validateMetric(metric) {
  const errors = [];
  if (!metric || typeof metric !== "object") return ["metric must be an object"];

  if (!metric.ticker) errors.push("ticker is required");
  if (!metric.metricKey) errors.push("metricKey is required");

  if (metric.value !== null && typeof metric.value !== "number") {
    errors.push("value must be a number or null");
  }
  if (metric.value === null && !metric.unavailableReason) {
    errors.push("unavailableReason is required when value is null");
  }
  if (metric.value !== null && metric.unavailableReason) {
    errors.push("unavailableReason must not be set when a value is present");
  }
  if (metric.value === null && metric.asOf) {
    errors.push("asOf must be null when value is null");
  }

  if (!CLASSIFICATIONS.includes(metric.classification)) {
    errors.push("classification must be one of: " + CLASSIFICATIONS.join(", "));
  }

  if (metric.classification === "calculated" || metric.classification === "estimated") {
    if (!Array.isArray(metric.derivedFrom) || metric.derivedFrom.length === 0) {
      errors.push("derivedFrom is required for calculated/estimated metrics");
    }
    if (!metric.calculationInputs || typeof metric.calculationInputs !== "object") {
      errors.push("calculationInputs is required for calculated/estimated metrics");
    }
    if (!metric.calculatedAt) {
      errors.push("calculatedAt is required for calculated/estimated metrics");
    }
  }

  if (metric.classification === "manual") {
    if (!metric.reviewedAt) errors.push("reviewedAt is required for manual metrics");
    if (!metric.reviewedBy) errors.push("reviewedBy is required for manual metrics");
  }

  if (metric.approximate === true && !metric.precisionNote) {
    errors.push("precisionNote is required when approximate is true");
  }
  if (metric.approximate && metric.classification === "reported") {
    errors.push('a "reported" metric must not be marked approximate — approximate only describes a COLD calculation, not a company-reported figure');
  }

  if (metric.classification === "reported" && metric.value !== null && !metric.retrievedAt) {
    errors.push("retrievedAt is required for reported metrics with a value");
  }

  if (!metric.freshness) errors.push("freshness is required");
  if (!metric.provenance || !metric.provenance.source) errors.push("provenance.source is required");

  return errors;
}

export function isValidMetric(metric) {
  return validateMetric(metric).length === 0;
}

/** Display labels for the metric keys used in Phase 1. Purely presentational. */
export const METRIC_LABELS = Object.freeze({
  reportedAffoPerShare: "AFFO per share (reported)",
  reportedDividendPerShare: "Dividend per share (reported)",
  reportedAffoPayoutRatio: "AFFO payout ratio (company-reported)",
  affoPayoutRatio: "AFFO payout ratio (COLD-calculated)",
  affoCoverage: "AFFO coverage (COLD-calculated)",
  occupancy: "Occupancy",
  occupancyDelta: "Occupancy change (YoY)",
  propertyCount: "Properties owned",
  operatingEarnings: "Operating earnings (reported)",
  netEarningsPerClassBShare: "Net earnings per Class B share",
  netEarningsPerClassBShareGrowth: "Net earnings per share growth (YoY)",
  insuranceFloat: "Insurance float",
  secRevenue: "Revenue (SEC-reported)",
  secNetIncome: "Net income attributable to shareholders (SEC-reported)",
  secTotalAssets: "Total assets (SEC-reported)",
  secTotalLiabilities: "Total liabilities (SEC-reported)",
  secCashAndCashEquivalents: "Cash and cash equivalents (SEC-reported)",
  secLongTermDebt: "Long-term debt (SEC-reported)",
  secDilutedEPS: "Diluted earnings per share (SEC-reported)",
  secSharesOutstanding: "Shares outstanding (SEC-reported)",
  secRealEstateDepreciationAndAmortization: "Real estate depreciation & amortization (SEC-reported)",
});

/**
 * Format a metric's value for display according to its declared unit.
 * Returns "" for a missing value — callers are responsible for rendering
 * the "not available" / "not applicable" states themselves.
 * @param {NormalizedFinancialMetric} metric
 */
export function formatMetricValue(metric) {
  if (!metric || metric.value === null || metric.value === undefined) return "";
  const { value, unit } = metric;
  switch (unit) {
    case "USD_per_share":
      return "$" + value.toFixed(2);
    case "percent":
      return value.toFixed(1) + "%";
    case "percentage_points":
      return (value > 0 ? "+" : "") + value.toFixed(1) + " pts";
    case "ratio":
      return (value * 100).toFixed(1) + "%";
    case "count":
      return value.toLocaleString("en-US");
    case "USD_millions":
      return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 }) + "M";
    case "USD_billions":
      return "$" + value.toFixed(1) + "B";
    default:
      return String(value);
  }
}
