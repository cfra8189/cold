import { test } from "node:test";
import assert from "node:assert/strict";
import { calculationsFor } from "./index.js";

test("equity-reit calculations include the allowed REIT ratios", () => {
  const calcs = calculationsFor("equity-reit");
  assert.equal(typeof calcs.affoPayoutRatio, "function");
  assert.equal(typeof calcs.affoCoverage, "function");
  assert.equal(typeof calcs.occupancyDelta, "function");
});

test("Berkshire (diversified-holding-company) rejects every REIT calculation", () => {
  const calcs = calculationsFor("diversified-holding-company");
  assert.equal(calcs.affoPayoutRatio, undefined);
  assert.equal(calcs.affoCoverage, undefined);
  assert.equal(calcs.occupancyDelta, undefined);
  assert.equal(typeof calcs.perShareGrowth, "function");
});

test("calculationsFor throws for an unregistered company type", () => {
  assert.throws(() => calculationsFor("mortgage-reit"));
});
