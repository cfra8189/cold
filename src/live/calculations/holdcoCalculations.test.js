import { test } from "node:test";
import assert from "node:assert/strict";
import * as holdcoCalculations from "./holdcoCalculations.js";
import { validateMetric } from "../schema/metric.js";

const period = { fiscalYear: 2026, fiscalQuarter: 2, periodType: "quarterly", periodStart: "2026-04-01", periodEnd: "2026-06-30" };
const priorPeriod = { fiscalYear: 2025, fiscalQuarter: 2, periodType: "quarterly", periodStart: "2025-04-01", periodEnd: "2025-06-30" };

function reportedMetric(value, overrides = {}) {
  return {
    ticker: "BRK.B", metricKey: "netEarningsPerClassBShare", value, unavailableReason: null, currency: "USD",
    unit: "USD_per_share", classification: "reported", period, asOf: "2026-06-30", retrievedAt: "2026-08-11",
    freshness: "SNAPSHOT", provenance: { source: "test", sourceType: "company-supplemental" }, ...overrides,
  };
}

test("holdcoCalculations exposes no REIT-shaped function at all", () => {
  for (const name of ["affoPayoutRatio", "affoCoverage", "occupancyDelta", "computeAffo", "netDebtToReportedEbitda", "tenantConcentrationDelta"]) {
    assert.equal(typeof holdcoCalculations[name], "undefined", `holdcoCalculations must not export ${name}`);
  }
});

test("perShareGrowth computes year-over-year percentage growth", () => {
  const result = holdcoCalculations.perShareGrowth(
    { current: reportedMetric(11.91), prior: reportedMetric(5.73, { period: priorPeriod, asOf: "2025-06-30" }) },
    { metricKey: "netEarningsPerClassBShareGrowth" }
  );
  assert.equal(result.metricKey, "netEarningsPerClassBShareGrowth");
  assert.ok(Math.abs(result.value - ((11.91 - 5.73) / 5.73) * 100) < 1e-9);
  assert.equal(result.classification, "calculated");
  assert.deepEqual(validateMetric(result), []);
});

test("perShareGrowth is unavailable, never zero, without a prior period", () => {
  const result = holdcoCalculations.perShareGrowth({ current: reportedMetric(11.91), prior: null }, { metricKey: "netEarningsPerClassBShareGrowth" });
  assert.equal(result.value, null);
  assert.equal(result.unavailableReason, "missing_required_input");
  assert.notEqual(result.value, 0);
});
