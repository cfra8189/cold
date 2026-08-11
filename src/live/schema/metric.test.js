import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMetric, isValidMetric, formatMetricValue } from "./metric.js";

const base = {
  ticker: "O",
  metricKey: "reportedAffoPerShare",
  currency: "USD",
  unit: "USD_per_share",
  period: { fiscalYear: 2026, fiscalQuarter: 2, periodType: "quarterly", periodStart: "2026-04-01", periodEnd: "2026-06-30" },
  freshness: "SNAPSHOT",
  provenance: { source: "Test source", sourceType: "company-supplemental" },
};

test("a value with no unavailableReason is invalid when null", () => {
  const errors = validateMetric({ ...base, value: null, classification: "reported", asOf: null, retrievedAt: "2026-08-11" });
  assert.ok(errors.some((e) => e.includes("unavailableReason is required")));
});

test("null value WITH unavailableReason is valid", () => {
  const errors = validateMetric({ ...base, value: null, unavailableReason: "not_reported", classification: "reported", asOf: null });
  assert.deepEqual(errors, []);
});

test("a legitimate zero is a valid value, not treated as missing", () => {
  const errors = validateMetric({
    ...base, value: 0, unavailableReason: null, classification: "reported", asOf: "2026-06-30", retrievedAt: "2026-08-11",
  });
  assert.deepEqual(errors, []);
  assert.equal(isValidMetric({ ...base, value: 0, unavailableReason: null, classification: "reported", asOf: "2026-06-30", retrievedAt: "2026-08-11" }), true);
});

test("value present AND unavailableReason present is invalid (ambiguous)", () => {
  const errors = validateMetric({ ...base, value: 1.09, unavailableReason: "not_reported", classification: "reported", asOf: "2026-06-30", retrievedAt: "2026-08-11" });
  assert.ok(errors.some((e) => e.includes("must not be set when a value is present")));
});

test("calculated metrics require derivedFrom, calculationInputs and calculatedAt", () => {
  const errors = validateMetric({ ...base, value: 0.7, unavailableReason: null, classification: "calculated", asOf: "2026-06-30" });
  assert.ok(errors.some((e) => e.includes("derivedFrom")));
  assert.ok(errors.some((e) => e.includes("calculationInputs")));
  assert.ok(errors.some((e) => e.includes("calculatedAt")));
});

test("calculated metric with full provenance of inputs is valid", () => {
  const errors = validateMetric({
    ...base, value: 0.7, unavailableReason: null, classification: "calculated", asOf: "2026-06-30",
    calculatedAt: "2026-08-11T00:00:00.000Z",
    derivedFrom: ["reportedDividendPerShare", "reportedAffoPerShare"],
    calculationInputs: { reportedDividendPerShare: 0.8115, reportedAffoPerShare: 1.09 },
  });
  assert.deepEqual(errors, []);
});

test("manual metrics require reviewedAt and reviewedBy", () => {
  const errors = validateMetric({ ...base, value: 98.8, unavailableReason: null, classification: "manual", asOf: "2026-06-30" });
  assert.ok(errors.some((e) => e.includes("reviewedAt")));
  assert.ok(errors.some((e) => e.includes("reviewedBy")));
});

test("approximate calculated metrics require a precisionNote", () => {
  const errors = validateMetric({
    ...base, value: 0.7445, unavailableReason: null, classification: "calculated", asOf: "2026-06-30",
    calculatedAt: "2026-08-11T00:00:00.000Z",
    derivedFrom: ["reportedDividendPerShare", "reportedAffoPerShare"],
    calculationInputs: { reportedDividendPerShare: 0.8115, reportedAffoPerShare: 1.09 },
    approximate: true,
  });
  assert.ok(errors.some((e) => e.includes("precisionNote is required")));
});

test("approximate calculated metric WITH a precisionNote is valid", () => {
  const errors = validateMetric({
    ...base, value: 0.7445, unavailableReason: null, classification: "calculated", asOf: "2026-06-30",
    calculatedAt: "2026-08-11T00:00:00.000Z",
    derivedFrom: ["reportedDividendPerShare", "reportedAffoPerShare"],
    calculationInputs: { reportedDividendPerShare: 0.8115, reportedAffoPerShare: 1.09 },
    approximate: true,
    precisionNote: "Derived from rounded per-share inputs.",
  });
  assert.deepEqual(errors, []);
});

test("a reported metric must never be marked approximate", () => {
  const errors = validateMetric({
    ...base, value: 74.5, unavailableReason: null, classification: "reported", asOf: "2026-06-30", retrievedAt: "2026-08-11",
    approximate: true, precisionNote: "should not be allowed here",
  });
  assert.ok(errors.some((e) => e.includes('must not be marked approximate')));
});

test("formatMetricValue renders known units and blank for missing values", () => {
  assert.equal(formatMetricValue({ value: 1.09, unit: "USD_per_share" }), "$1.09");
  assert.equal(formatMetricValue({ value: 0.7446, unit: "ratio" }), "74.5%");
  assert.equal(formatMetricValue({ value: 98.8, unit: "percent" }), "98.8%");
  assert.equal(formatMetricValue({ value: 0.2, unit: "percentage_points" }), "+0.2 pts");
  assert.equal(formatMetricValue({ value: null, unit: "USD_per_share" }), "");
  assert.equal(formatMetricValue(null), "");
});
