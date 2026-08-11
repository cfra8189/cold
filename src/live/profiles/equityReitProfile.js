/* ============================================================================
   Equity REIT metric profile

   Declares what an equity REIT's page may ask for and display. This is a
   screening-context guide, not a universal investment law — every REIT
   range shown alongside these metrics must say so.
   ========================================================================== */

export const equityReitProfile = {
  companyType: "equity-reit",
  screeningContext: "Equity REIT · property-sector screening guide, not a universal investment law",
  applicableMetrics: [
    "reportedAffoPerShare",
    "reportedDividendPerShare",
    "reportedAffoPayoutRatio",
    "affoPayoutRatio",
    "affoCoverage",
    "occupancy",
    "occupancyDelta",
    "propertyCount",
  ],
  /** metricKey -> reason code. Empty for this profile: nothing here is structurally excluded for a REIT. */
  notApplicableMetrics: {},
  /** metricKey -> the input metricKeys a calculation needs before it can run. */
  requiredEvidence: {
    affoPayoutRatio: ["reportedDividendPerShare", "reportedAffoPerShare"],
    affoCoverage: ["reportedAffoPerShare", "reportedDividendPerShare"],
    occupancyDelta: ["occupancy"],
  },
  /** Function names from calculations/reitCalculations.js this profile is permitted to run. */
  allowedCalculations: ["affoPayoutRatio", "affoCoverage", "occupancyDelta"],
};
