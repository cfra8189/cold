/* ============================================================================
   Diversified holding-company metric profile

   No REIT-shaped metric (AFFO, occupancy, payout ratio, property count, ...)
   is applicable here. This profile is the single place that says so, rather
   than scattering ticker-specific "if BRK, hide AFFO" checks across pages.
   ========================================================================== */

export const holdingCompanyProfile = {
  companyType: "diversified-holding-company",
  screeningContext: "Diversified holding company · not a REIT; property-sector screening ranges do not apply",
  applicableMetrics: [
    "operatingEarnings",
    "netEarningsPerClassBShare",
    "netEarningsPerClassBShareGrowth",
    "insuranceFloat",
  ],
  notApplicableMetrics: {
    reportedAffoPerShare: "not_applicable_holdco",
    reportedDividendPerShare: "not_applicable_holdco",
    reportedAffoPayoutRatio: "not_applicable_holdco",
    affoPayoutRatio: "not_applicable_holdco",
    affoCoverage: "not_applicable_holdco",
    occupancy: "not_applicable_holdco",
    occupancyDelta: "not_applicable_holdco",
    propertyCount: "not_applicable_holdco",
  },
  requiredEvidence: {
    netEarningsPerClassBShareGrowth: ["netEarningsPerClassBShare"],
  },
  /** Function names from calculations/holdcoCalculations.js this profile is permitted to run. */
  allowedCalculations: ["perShareGrowth"],
};
