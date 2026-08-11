/* ============================================================================
   Reporting-period metadata
   ========================================================================== */

/**
 * @typedef {Object} ReportingPeriod
 * @property {number} fiscalYear
 * @property {number|null} fiscalQuarter    null for annual/TTM
 * @property {"annual"|"quarterly"|"ttm"} periodType
 * @property {string} periodStart           ISO date
 * @property {string} periodEnd             ISO date
 * @property {string|null} [filedDate]       SEC filing date, when sourced from a filing
 */

export function formatPeriod(period) {
  if (!period) return "";
  if (period.periodType === "quarterly" && period.fiscalQuarter) {
    return `Q${period.fiscalQuarter} ${period.fiscalYear}`;
  }
  if (period.periodType === "annual") return `FY${period.fiscalYear}`;
  if (period.periodType === "ttm") return `TTM through ${period.periodEnd}`;
  return String(period.fiscalYear || "");
}
