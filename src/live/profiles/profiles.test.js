import { test } from "node:test";
import assert from "node:assert/strict";
import { profileFor, isApplicable, notApplicableReason } from "./index.js";

const REIT_ONLY_KEYS = ["reportedAffoPerShare", "reportedAffoPayoutRatio", "affoPayoutRatio", "affoCoverage", "occupancy", "occupancyDelta", "propertyCount"];

test("equity-reit profile declares nothing structurally not-applicable", () => {
  const profile = profileFor("equity-reit");
  assert.deepEqual(profile.notApplicableMetrics, {});
});

test("diversified-holding-company profile marks every REIT-shaped metric not applicable", () => {
  const profile = profileFor("diversified-holding-company");
  for (const key of REIT_ONLY_KEYS) {
    assert.equal(notApplicableReason(profile, key), "not_applicable_holdco", `${key} should be not_applicable_holdco for a holding company`);
    assert.equal(isApplicable(profile, key), false);
  }
});

test("diversified-holding-company applicableMetrics never contains a REIT-only key", () => {
  const profile = profileFor("diversified-holding-company");
  for (const key of REIT_ONLY_KEYS) {
    assert.ok(!profile.applicableMetrics.includes(key), `${key} must not be applicable to a holding company`);
  }
});

test("profileFor throws for an unknown company type instead of guessing", () => {
  assert.throws(() => profileFor("mortgage-reit"));
  assert.throws(() => profileFor(undefined));
});
