/* ============================================================================
   Fixture drift detection.

   supabase/functions/live-data/shared/fixtures.ts is generated from
   src/live/fixtures/*.json by scripts/sync-live-fixtures.mjs. This test
   re-reads both sides fresh and fails loudly if they no longer match —
   e.g. if someone edits the frontend fixture JSON and forgets to run
   `npm run sync:fixtures`, or hand-edits the generated file directly.
   ========================================================================== */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { O_COMPANY, O_FACTS, O_QUOTE, BRKB_COMPANY, BRKB_FACTS, BRKB_QUOTE } from "../shared/fixtures.ts";
import { validateMetric } from "../../../../src/live/schema/metric.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const canonicalDir = path.resolve(here, "..", "..", "..", "..", "src", "live", "fixtures");
const readJson = (name: string) => JSON.parse(readFileSync(path.join(canonicalDir, name), "utf8"));

test("backend O_COMPANY matches the canonical src/live/fixtures/O.company.json exactly", () => {
  assert.deepEqual(O_COMPANY, readJson("O.company.json"));
});
test("backend O_FACTS matches the canonical src/live/fixtures/O.facts.json exactly", () => {
  assert.deepEqual(O_FACTS, readJson("O.facts.json"));
});
test("backend O_QUOTE matches the canonical src/live/fixtures/O.quote.json exactly", () => {
  assert.deepEqual(O_QUOTE, readJson("O.quote.json"));
});
test("backend BRKB_COMPANY matches the canonical src/live/fixtures/BRKB.company.json exactly", () => {
  assert.deepEqual(BRKB_COMPANY, readJson("BRKB.company.json"));
});
test("backend BRKB_FACTS matches the canonical src/live/fixtures/BRKB.facts.json exactly", () => {
  assert.deepEqual(BRKB_FACTS, readJson("BRKB.facts.json"));
});
test("backend BRKB_QUOTE matches the canonical src/live/fixtures/BRKB.quote.json exactly", () => {
  assert.deepEqual(BRKB_QUOTE, readJson("BRKB.quote.json"));
});

test("no backend fixture fact is ever classified/labeled LIVE", () => {
  for (const fact of [...O_FACTS, ...BRKB_FACTS]) {
    assert.notEqual(fact.freshness, "LIVE");
    assert.equal(fact.freshness, "SNAPSHOT");
  }
});

test("backend quote fixtures remain unavailable, never a fabricated price", () => {
  for (const quote of [O_QUOTE, BRKB_QUOTE]) {
    assert.equal(quote.price, null);
    assert.equal(quote.freshness, "UNAVAILABLE");
    assert.equal(quote.unavailableReason, "provider_not_connected");
  }
});

test("frontend/backend schema compatibility: every backend fact passes the frontend's own validateMetric", () => {
  for (const fact of [...O_FACTS, ...BRKB_FACTS]) {
    // deepEqual against the canonical JSON already proves byte-identity;
    // this additionally proves the *shape* is one the approved frontend
    // schema considers valid, not just textually identical.
    const errors = validateMetric(fact as unknown as Parameters<typeof validateMetric>[0]);
    assert.deepEqual(errors, [], `${fact.metricKey} fails frontend schema validation: ${errors.join("; ")}`);
  }
});
