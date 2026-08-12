import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { selectFiling, selectLatestFilings, isValidAccessionNumber, isSafePrimaryDocument, buildFilingIndexUrl, buildPrimaryDocumentUrl } from "../shared/secFilings.ts";
import { APPROVED_CIKS } from "../shared/secClient.ts";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(dir, "..", "fixtures", "sec");
const readJson = (name: string) => JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8"));

const O_SUBMISSIONS = readJson("O.submissions.json");
const BRKB_SUBMISSIONS = readJson("BRKB.submissions.json");

test("submissions normalization for O: latest 10-K is selected correctly", () => {
  const filing = selectFiling(O_SUBMISSIONS, "O", APPROVED_CIKS.O, "10-K", "2026-08-12T00:00:00.000Z", "LIVE");
  assert.ok(!("unavailable" in filing));
  if (!("unavailable" in filing)) {
    assert.equal(filing.accessionNumber, "0000726728-26-000011");
    assert.equal(filing.filingDate, "2026-02-25");
    assert.equal(filing.reportDate, "2025-12-31");
    assert.equal(filing.primaryDocument, "o-20251231.htm");
  }
});

test("submissions normalization for O: latest 10-Q is selected correctly, not the older or amended one", () => {
  const filing = selectFiling(O_SUBMISSIONS, "O", APPROVED_CIKS.O, "10-Q", "2026-08-12T00:00:00.000Z", "LIVE");
  assert.ok(!("unavailable" in filing));
  if (!("unavailable" in filing)) {
    assert.equal(filing.accessionNumber, "0000726728-26-000048", "must pick the real 10-Q, not the synthetic 10-Q/A decoy filed one day later");
    assert.equal(filing.filingDate, "2026-08-06");
  }
});

test("submissions normalization for O: latest 8-K is selected correctly, not an older 8-K", () => {
  const filing = selectFiling(O_SUBMISSIONS, "O", APPROVED_CIKS.O, "8-K", "2026-08-12T00:00:00.000Z", "LIVE");
  assert.ok(!("unavailable" in filing));
  if (!("unavailable" in filing)) {
    assert.equal(filing.accessionNumber, "0001104659-26-094098");
    assert.equal(filing.filingDate, "2026-08-11");
  }
});

test("amended filings (10-Q/A) are excluded — the exact-form-match latest 10-Q is unaffected by a newer amendment", () => {
  const filing = selectFiling(O_SUBMISSIONS, "O", APPROVED_CIKS.O, "10-Q", "now", "LIVE");
  assert.ok(!("unavailable" in filing));
  if (!("unavailable" in filing)) {
    assert.notEqual(filing.accessionNumber, "0000726728-26-000050", "must not select the synthetic 10-Q/A entry");
  }
});

test("submissions normalization for BRK.B: latest 10-K/10-Q/8-K", () => {
  const filings = selectLatestFilings(BRKB_SUBMISSIONS, "BRK.B", APPROVED_CIKS["BRK.B"], "now", "LIVE");
  assert.ok(!("unavailable" in filings["10-K"]));
  assert.ok(!("unavailable" in filings["10-Q"]));
  assert.ok(!("unavailable" in filings["8-K"]));
  if (!("unavailable" in filings["10-Q"])) assert.equal(filings["10-Q"].accessionNumber, "0001193125-26-341032");
  if (!("unavailable" in filings["8-K"])) assert.equal(filings["8-K"].accessionNumber, "0001193125-26-344495");
});

test("accession URL construction strips dashes only for the archive folder, keeps them in the index filename", () => {
  const indexUrl = buildFilingIndexUrl("0000726728", "0000726728-26-000048");
  assert.equal(indexUrl, "https://www.sec.gov/Archives/edgar/data/0000726728/000072672826000048/0000726728-26-000048-index.htm");
  const docUrl = buildPrimaryDocumentUrl("0000726728", "0000726728-26-000048", "o-20260630.htm");
  assert.equal(docUrl, "https://www.sec.gov/Archives/edgar/data/0000726728/000072672826000048/o-20260630.htm");
});

test("isValidAccessionNumber accepts the real SEC format and rejects arbitrary strings", () => {
  assert.equal(isValidAccessionNumber("0000726728-26-000048"), true);
  assert.equal(isValidAccessionNumber("not-an-accession"), false);
  assert.equal(isValidAccessionNumber("../../etc/passwd"), false);
  assert.equal(isValidAccessionNumber(""), false);
});

test("isSafePrimaryDocument rejects path traversal, protocol prefixes and absolute paths", () => {
  assert.equal(isSafePrimaryDocument("o-20260630.htm"), true);
  assert.equal(isSafePrimaryDocument("xslF345X05/wf-form4.xml"), true);
  assert.equal(isSafePrimaryDocument("../../../etc/passwd"), false);
  assert.equal(isSafePrimaryDocument("http://evil.example/x.htm"), false);
  assert.equal(isSafePrimaryDocument("/etc/passwd"), false);
  assert.equal(isSafePrimaryDocument("javascript:alert(1)"), false);
  assert.equal(isSafePrimaryDocument(""), false);
});

test("a malicious primaryDocument in the SEC response itself is rejected rather than turned into a URL", () => {
  const poisoned = JSON.parse(JSON.stringify(O_SUBMISSIONS));
  const idx = poisoned.filings.recent.form.indexOf("10-Q");
  poisoned.filings.recent.primaryDocument[idx] = "../../../etc/passwd";
  const filing = selectFiling(poisoned, "O", APPROVED_CIKS.O, "10-Q", "now", "LIVE");
  assert.ok("unavailable" in filing);
  if ("unavailable" in filing) assert.equal(filing.reason, "invalid_primary_document");
});

test("a malformed accession number in the SEC response is rejected rather than used to build a URL", () => {
  const poisoned = JSON.parse(JSON.stringify(O_SUBMISSIONS));
  const idx = poisoned.filings.recent.form.indexOf("10-K");
  poisoned.filings.recent.accessionNumber[idx] = "not-a-real-accession";
  const filing = selectFiling(poisoned, "O", APPROVED_CIKS.O, "10-K", "now", "LIVE");
  assert.ok("unavailable" in filing);
  if ("unavailable" in filing) assert.equal(filing.reason, "invalid_accession");
});

test("a form with no matching filing at all is reported as not_found, never fabricated", () => {
  const empty = { filings: { recent: { accessionNumber: [], filingDate: [], reportDate: [], form: [], primaryDocument: [] } } };
  const filing = selectFiling(empty as never, "O", APPROVED_CIKS.O, "10-K", "now", "LIVE");
  assert.ok("unavailable" in filing);
  if ("unavailable" in filing) assert.equal(filing.reason, "not_found");
});
