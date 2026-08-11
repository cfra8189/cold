import { test } from "node:test";
import assert from "node:assert/strict";
import * as reitCalculations from "./reitCalculations.js";
import { validateMetric } from "../schema/metric.js";

const period = { fiscalYear: 2026, fiscalQuarter: 2, periodType: "quarterly", periodStart: "2026-04-01", periodEnd: "2026-06-30" };
const priorPeriod = { fiscalYear: 2025, fiscalQuarter: 2, periodType: "quarterly", periodStart: "2025-04-01", periodEnd: "2025-06-30" };

function reportedMetric(metricKey, value, overrides = {}) {
  return {
    ticker: "O", metricKey, value, unavailableReason: null, currency: "USD", unit: "USD_per_share",
    classification: "reported", period, asOf: "2026-06-30", retrievedAt: "2026-08-11",
    freshness: "SNAPSHOT", provenance: { source: "test", sourceType: "company-supplemental" }, ...overrides,
  };
}

test("reitCalculations never derives AFFO itself — no such function is exported", () => {
  for (const name of ["computeAffo", "calculateAffo", "deriveAffo", "affo", "computeAFFO"]) {
    assert.equal(typeof reitCalculations[name], "undefined", `reitCalculations must not export ${name}`);
  }
});

test("affoPayoutRatio computes dividend / reported AFFO, is classified calculated, and is marked approximate", () => {
  const result = reitCalculations.affoPayoutRatio({
    reportedDividendPerShare: reportedMetric("reportedDividendPerShare", 0.8115),
    reportedAffoPerShare: reportedMetric("reportedAffoPerShare", 1.09),
  });
  assert.equal(result.classification, "calculated");
  assert.ok(Math.abs(result.value - 0.8115 / 1.09) < 1e-9);
  assert.deepEqual(result.derivedFrom, ["reportedDividendPerShare", "reportedAffoPerShare"]);
  assert.deepEqual(result.calculationInputs, { reportedDividendPerShare: 0.8115, reportedAffoPerShare: 1.09 });
  assert.equal(result.provenance.sourceType, "internal-calculation");
  assert.equal(result.approximate, true);
  assert.ok(result.precisionNote && result.precisionNote.length > 0, "approximate result must explain why");
  assert.deepEqual(validateMetric(result), []);
});

test("affoPayoutRatio never claims to exactly reproduce the company's own reported ratio", () => {
  // Company's own reported ratio (from the official release) is 74.5%. COLD's
  // recomputation from the same rounded per-share figures lands close but not
  // necessarily identical — that gap is expected and must be labeled, not hidden.
  const result = reitCalculations.affoPayoutRatio({
    reportedDividendPerShare: reportedMetric("reportedDividendPerShare", 0.8115),
    reportedAffoPerShare: reportedMetric("reportedAffoPerShare", 1.09),
  });
  const companyReportedRatio = 0.745;
  assert.notEqual(result.value, companyReportedRatio, "recomputed ratio should not be silently forced to match the company's rounded headline figure");
  assert.equal(result.approximate, true);
});

test("affoCoverage is the inverse of payout ratio and is also marked approximate", () => {
  const result = reitCalculations.affoCoverage({
    reportedAffoPerShare: reportedMetric("reportedAffoPerShare", 1.09),
    reportedDividendPerShare: reportedMetric("reportedDividendPerShare", 0.8115),
  });
  assert.ok(Math.abs(result.value - 1.09 / 0.8115) < 1e-9);
  assert.equal(result.approximate, true);
  assert.ok(result.precisionNote);
  assert.deepEqual(validateMetric(result), []);
});

test("affoPayoutRatio returns unavailable, never zero, when reported AFFO is missing", () => {
  const result = reitCalculations.affoPayoutRatio({
    reportedDividendPerShare: reportedMetric("reportedDividendPerShare", 0.8115),
    reportedAffoPerShare: reportedMetric("reportedAffoPerShare", null, { value: null, unavailableReason: "not_reported", asOf: null }),
  });
  assert.equal(result.value, null);
  assert.ok(result.unavailableReason);
  assert.notEqual(result.value, 0);
  assert.deepEqual(validateMetric(result), []);
});

test("affoPayoutRatio returns unavailable when an input is entirely absent (undefined)", () => {
  const result = reitCalculations.affoPayoutRatio({ reportedDividendPerShare: reportedMetric("reportedDividendPerShare", 0.8115) });
  assert.equal(result.value, null);
  assert.equal(result.unavailableReason, "missing_required_input");
});

test("occupancyDelta computes current minus prior when both periods exist", () => {
  const result = reitCalculations.occupancyDelta({
    currentOccupancy: reportedMetric("occupancy", 98.8, { unit: "percent" }),
    priorOccupancy: reportedMetric("occupancy", 98.6, { unit: "percent", period: priorPeriod, asOf: "2025-06-30" }),
  });
  assert.ok(Math.abs(result.value - 0.2) < 1e-9);
  assert.equal(result.calculationInputs.currentPeriodEnd, "2026-06-30");
  assert.equal(result.calculationInputs.priorPeriodEnd, "2025-06-30");
  assert.deepEqual(validateMetric(result), []);
});

test("occupancyDelta is unavailable without a prior period", () => {
  const result = reitCalculations.occupancyDelta({ currentOccupancy: reportedMetric("occupancy", 98.8, { unit: "percent" }), priorOccupancy: null });
  assert.equal(result.value, null);
  assert.equal(result.unavailableReason, "missing_required_input");
});
