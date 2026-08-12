import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { selectFactEntry, applyMapping } from "../shared/secFacts.ts";
import type { TargetPeriod } from "../shared/secFacts.ts";
import { GAAP_FACT_MAPPINGS, mappingsFor } from "../shared/secFactMapping.ts";
import { findFiscalPeriodForAccession } from "../shared/secOrchestration.ts";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(dir, "..", "fixtures", "sec");
const readJson = (name: string) => JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8"));

const O_FACTS_FIXTURE = readJson("O.companyfacts.json");
const BRKB_FACTS_FIXTURE = readJson("BRKB.companyfacts.json");

const O_TARGET: TargetPeriod = { form: "10-Q", fy: 2026, fp: "Q2", periodStart: "2026-06-30", periodEnd: "2026-06-30" };
const BRKB_TARGET: TargetPeriod = { form: "10-Q", fy: 2026, fp: "Q2", periodStart: "2026-06-30", periodEnd: "2026-06-30" };

test("standalone quarter is selected, not the year-to-date cumulative sharing the same fy/fp/form", () => {
  const entries = O_FACTS_FIXTURE.facts["us-gaap"].Revenues.units.USD;
  const entry = selectFactEntry(entries, O_TARGET, "duration");
  assert.ok(entry);
  assert.equal(entry!.val, 1547711000, "must be the standalone $1.548B quarter, not the $3.096B six-month YTD figure");
  assert.equal(entry!.start, "2026-04-01");
  assert.equal(entry!.end, "2026-06-30");
});

test("the prior-year comparative entry (same fy/fp/form, different actual dates) is never selected", () => {
  const entries = O_FACTS_FIXTURE.facts["us-gaap"].Revenues.units.USD;
  const entry = selectFactEntry(entries, O_TARGET, "duration");
  assert.notEqual(entry!.val, 1410378000, "must not select the 2025 prior-year comparative just because it shares fy:2026/fp:Q2");
});

test("year-to-date value is never mistaken for a standalone quarter value", () => {
  const entries = O_FACTS_FIXTURE.facts["us-gaap"].Revenues.units.USD;
  const entry = selectFactEntry(entries, O_TARGET, "duration");
  assert.notEqual(entry!.val, 3096438000);
});

test("the latest applicable accession is preferred over an earlier duplicate/stale accession for the same period", () => {
  const entries = O_FACTS_FIXTURE.facts["us-gaap"].Revenues.units.USD;
  const entry = selectFactEntry(entries, O_TARGET, "duration");
  assert.equal(entry!.accn, "0000726728-26-000048");
  assert.notEqual(entry!.val, 1500000000, "must not select the earlier-filed, stale-accession duplicate value");
});

test("instant-period selection picks the correct balance-sheet date, not a prior comparative instant", () => {
  const entries = O_FACTS_FIXTURE.facts["us-gaap"].Assets.units.USD;
  const entry = selectFactEntry(entries, O_TARGET, "instant");
  assert.ok(entry);
  assert.equal(entry!.end, "2026-06-30");
  assert.equal(entry!.val, 76441475000);
});

test("a concept with only stale (wrong-period) data returns unavailable, not the stale value", () => {
  const entries = O_FACTS_FIXTURE.facts["us-gaap"].LongTermDebt.units.USD;
  const entry = selectFactEntry(entries, O_TARGET, "instant");
  assert.equal(entry, null);
});

test("a missing concept returns unavailable via applyMapping, never a fabricated value", () => {
  const mapping = GAAP_FACT_MAPPINGS.find((m) => m.metricKey === "secLongTermDebt")!;
  const result = applyMapping(mapping, { ticker: "O", companyFacts: O_FACTS_FIXTURE, target: O_TARGET, retrievedAt: "now", freshness: "LIVE", documentUrl: "https://www.sec.gov/x" });
  assert.equal(result.value, null);
  assert.equal(result.unavailableReason, "not_reported");
  assert.equal(result.classification, "reported");
});

test("applyMapping retains the original SEC concept, unit, accession number and filed date", () => {
  const mapping = GAAP_FACT_MAPPINGS.find((m) => m.metricKey === "secRevenue")!;
  const result = applyMapping(mapping, { ticker: "O", companyFacts: O_FACTS_FIXTURE, target: O_TARGET, retrievedAt: "2026-08-12T00:00:00.000Z", freshness: "LIVE", documentUrl: "https://www.sec.gov/x" });
  assert.equal(result.provenance.secConcept, "Revenues");
  assert.equal(result.provenance.secUnit, "USD");
  assert.equal(result.provenance.accessionNumber, "0000726728-26-000048");
  assert.equal(result.provenance.filedDate, "2026-08-06");
  assert.equal(result.provenance.secFrame, "CY2026Q2");
});

test("ordered concept candidates: Berkshire's net income falls back to NetIncomeLoss when NetIncomeLossAvailableToCommonStockholdersBasic is absent", () => {
  const mapping = GAAP_FACT_MAPPINGS.find((m) => m.metricKey === "secNetIncome")!;
  const result = applyMapping(mapping, { ticker: "BRK.B", companyFacts: BRKB_FACTS_FIXTURE, target: BRKB_TARGET, retrievedAt: "now", freshness: "LIVE", documentUrl: "https://www.sec.gov/x" });
  assert.equal(result.provenance.secConcept, "NetIncomeLoss");
  assert.equal(result.value, 25667); // displayed in USD_millions
  assert.notEqual(result.value, 25772 /* ProfitLoss, includes noncontrolling interests — must never be selected */);
});

test("ordered concept candidates: Berkshire's cash falls back to the combined restricted-cash concept", () => {
  const mapping = GAAP_FACT_MAPPINGS.find((m) => m.metricKey === "secCashAndCashEquivalents")!;
  const result = applyMapping(mapping, { ticker: "BRK.B", companyFacts: BRKB_FACTS_FIXTURE, target: BRKB_TARGET, retrievedAt: "now", freshness: "LIVE", documentUrl: "https://www.sec.gov/x" });
  assert.equal(result.provenance.secConcept, "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents");
  assert.equal(result.value, 41360);
});

test("Berkshire diluted EPS and shares outstanding are unavailable, never guessed from a wrong-class or stale concept", () => {
  for (const metricKey of ["secDilutedEPS", "secSharesOutstanding"]) {
    const mapping = GAAP_FACT_MAPPINGS.find((m) => m.metricKey === metricKey)!;
    const result = applyMapping(mapping, { ticker: "BRK.B", companyFacts: BRKB_FACTS_FIXTURE, target: BRKB_TARGET, retrievedAt: "now", freshness: "LIVE", documentUrl: "https://www.sec.gov/x" });
    assert.equal(result.value, null, `${metricKey} must be unavailable for Berkshire`);
  }
});

test("the concept allowlist is closed: a present-but-non-candidate concept (ProfitLoss, TreasuryStockValue) is never selected by any mapping", () => {
  for (const mapping of GAAP_FACT_MAPPINGS) {
    assert.ok(!mapping.conceptCandidates.includes("ProfitLoss"));
    assert.ok(!mapping.conceptCandidates.includes("TreasuryStockValue"));
  }
});

test("real-estate depreciation & amortization is applicable to the equity REIT only", () => {
  const reitMappings = mappingsFor("equity-reit").map((m) => m.metricKey);
  const holdcoMappings = mappingsFor("diversified-holding-company").map((m) => m.metricKey);
  assert.ok(reitMappings.includes("secRealEstateDepreciationAndAmortization"));
  assert.ok(!holdcoMappings.includes("secRealEstateDepreciationAndAmortization"));
});

test("findFiscalPeriodForAccession derives fy/fp from any entry sharing the target accession", () => {
  const period = findFiscalPeriodForAccession(O_FACTS_FIXTURE, "0000726728-26-000048");
  assert.deepEqual(period, { fy: 2026, fp: "Q2" });
});

test("findFiscalPeriodForAccession returns null for an accession that appears nowhere in company facts", () => {
  const period = findFiscalPeriodForAccession(O_FACTS_FIXTURE, "9999999999-99-999999");
  assert.equal(period, null);
});
