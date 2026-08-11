import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateMetric } from "../schema/metric.js";
import { LIVE_COMPANIES } from "../data/liveCompanies.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(path.join(dir, name), "utf8"));

const FIXTURE_SETS = [
  { ticker: "O", company: readJson("O.company.json"), facts: readJson("O.facts.json"), quote: readJson("O.quote.json") },
  { ticker: "BRK.B", company: readJson("BRKB.company.json"), facts: readJson("BRKB.facts.json"), quote: readJson("BRKB.quote.json") },
];

for (const { ticker, company, facts, quote } of FIXTURE_SETS) {
  test(`${ticker} quote fixture is unavailable, not a fabricated price`, () => {
    assert.equal(quote.price, null);
    assert.equal(quote.freshness, "UNAVAILABLE");
    assert.equal(quote.unavailableReason, "provider_not_connected");
  });

  test(`${ticker} facts are always classified SNAPSHOT, never LIVE/DELAYED/END_OF_DAY/STALE`, () => {
    assert.ok(facts.length > 0, "fixture should not be empty");
    for (const fact of facts) {
      assert.equal(fact.freshness, "SNAPSHOT", `${fact.metricKey} must be SNAPSHOT, got ${fact.freshness}`);
    }
  });

  test(`${ticker} every fact fixture passes schema validation`, () => {
    for (const fact of facts) {
      const errors = validateMetric(fact);
      assert.deepEqual(errors, [], `${fact.metricKey} (${JSON.stringify(fact.period)}) has schema errors: ${errors.join("; ")}`);
    }
  });

  test(`${ticker} identity registry matches the company fixture (no drift)`, () => {
    const identity = LIVE_COMPANIES[ticker];
    assert.equal(identity.ticker, company.ticker);
    assert.equal(identity.cik, company.cik);
    assert.equal(identity.companyType, company.companyType);
  });
}

test("reported AFFO per share is only ever classified reported, never calculated", () => {
  const affo = FIXTURE_SETS.find((f) => f.ticker === "O").facts.find((f) => f.metricKey === "reportedAffoPerShare");
  assert.ok(affo, "O fixture must include reportedAffoPerShare");
  assert.equal(affo.classification, "reported");
  assert.ok(affo.provenance.companyDefinitionNote, "reported AFFO must carry the company's own definition note");
  assert.ok(affo.provenance.documentUrl, "reported AFFO must carry a direct source URL");
});

test("O fixture documentUrl is the official realtyincome.com release, not the SEC exhibit alone", () => {
  const facts = FIXTURE_SETS.find((f) => f.ticker === "O").facts;
  for (const fact of facts) {
    assert.match(fact.provenance.documentUrl, /^https:\/\/www\.realtyincome\.com\//, `${fact.metricKey} documentUrl must be the official Realty Income release`);
  }
});

test("O fixture facts carry the SEC exhibit only as a secondary filingReferenceUrl", () => {
  const facts = FIXTURE_SETS.find((f) => f.ticker === "O").facts;
  for (const fact of facts) {
    if (fact.provenance.filingReferenceUrl) {
      assert.match(fact.provenance.filingReferenceUrl, /^https:\/\/www\.sec\.gov\//);
    }
  }
});

test("company-reported AFFO payout ratio is present, classified reported, and distinct from COLD's calculated ratio", () => {
  const facts = FIXTURE_SETS.find((f) => f.ticker === "O").facts;
  const reportedRatio = facts.find((f) => f.metricKey === "reportedAffoPayoutRatio");
  assert.ok(reportedRatio, "O fixture must include the company's own reported payout ratio");
  assert.equal(reportedRatio.classification, "reported");
  assert.equal(reportedRatio.value, 74.5);
  assert.equal(reportedRatio.approximate, undefined, "a reported metric must never be marked approximate");
});

test("no fixture value is sourced solely from a secondary summary — every fact provenance names the official document", () => {
  for (const { facts } of FIXTURE_SETS) {
    for (const fact of facts) {
      assert.ok(fact.provenance.documentUrl, `${fact.metricKey} must carry a direct primary documentUrl`);
      assert.ok(!/search|summary|aggregator/i.test(fact.provenance.source), `${fact.metricKey} source must not read like a secondary summary`);
    }
  }
});

test("Berkshire fixture facts contain no REIT-shaped metric key", () => {
  const brkFacts = FIXTURE_SETS.find((f) => f.ticker === "BRK.B").facts;
  const forbidden = ["reportedAffoPerShare", "reportedAffoPayoutRatio", "affoPayoutRatio", "affoCoverage", "occupancy", "occupancyDelta", "propertyCount"];
  for (const fact of brkFacts) {
    assert.ok(!forbidden.includes(fact.metricKey), `Berkshire fixture must not contain REIT metric ${fact.metricKey}`);
  }
});
