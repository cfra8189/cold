/* ============================================================================
   Filing normalization — selects only the latest 10-K, 10-Q and 8-K from a
   SEC submissions response and constructs their archive URLs deterministically
   from validated SEC-supplied fields. Nothing here ever accepts a
   caller-supplied accession number or document name — both are validated
   against SEC's own known formats before a URL is built from them, and an
   entry that fails validation is treated as unavailable, never silently
   dropped into a URL.

   Only exact form matches ("10-K", "10-Q", "8-K") are selected. Amendment
   forms ("10-K/A", "10-Q/A", "8-K/A") are deliberately excluded rather than
   merged in as if they were the same form — that keeps "the latest 10-Q"
   unambiguous without needing to decide which version is authoritative.
   ========================================================================== */

import type { Ticker } from "./contracts.ts";
import type { SecSubmissionsResponse, SecSubmissionsRecent } from "./secClient.ts";
import type { FreshnessState } from "./contracts.ts";

export const FILING_FORMS = ["10-K", "10-Q", "8-K"] as const;
export type FilingForm = (typeof FILING_FORMS)[number];

const ACCESSION_PATTERN = /^\d{10}-\d{2}-\d{6}$/;

export function isValidAccessionNumber(accessionNumber: string): boolean {
  return typeof accessionNumber === "string" && ACCESSION_PATTERN.test(accessionNumber);
}

/** Allows a plain filename or a shallow subpath (SEC sometimes nests XBRL viewer docs), never "..", a protocol, or a leading slash. */
export function isSafePrimaryDocument(name: string): boolean {
  if (typeof name !== "string" || name.length === 0) return false;
  if (name.includes("..")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(name)) return false;
  if (name.startsWith("/") || name.startsWith("\\")) return false;
  return /^[A-Za-z0-9._\-/]+$/.test(name);
}

function accessionNoDashes(accessionNumber: string): string {
  return accessionNumber.replace(/-/g, "");
}

export function buildFilingIndexUrl(cik: string, accessionNumber: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes(accessionNumber)}/${accessionNumber}-index.htm`;
}

export function buildPrimaryDocumentUrl(cik: string, accessionNumber: string, primaryDocument: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes(accessionNumber)}/${primaryDocument}`;
}

export interface NormalizedFiling {
  ticker: Ticker;
  cik: string;
  form: FilingForm;
  filingDate: string;
  reportDate: string;
  accessionNumber: string;
  primaryDocument: string;
  filingIndexUrl: string;
  primaryDocumentUrl: string;
  source: "SEC EDGAR";
  sourceType: "sec-filing";
  retrievedAt: string;
  freshness: FreshnessState;
}

export interface UnavailableFiling {
  form: FilingForm;
  unavailable: true;
  reason: "not_found" | "invalid_accession" | "invalid_primary_document";
}

function findLatestIndex(recent: SecSubmissionsRecent, form: FilingForm): number {
  return recent.form.findIndex((f) => f === form);
}

export function selectFiling(
  submissions: SecSubmissionsResponse,
  ticker: Ticker,
  cik: string,
  form: FilingForm,
  retrievedAt: string,
  freshness: FreshnessState
): NormalizedFiling | UnavailableFiling {
  const recent = submissions.filings.recent;
  const idx = findLatestIndex(recent, form);
  if (idx < 0) return { form, unavailable: true, reason: "not_found" };

  const accessionNumber = recent.accessionNumber[idx];
  const primaryDocument = recent.primaryDocument[idx];

  if (!isValidAccessionNumber(accessionNumber)) return { form, unavailable: true, reason: "invalid_accession" };
  if (!isSafePrimaryDocument(primaryDocument)) return { form, unavailable: true, reason: "invalid_primary_document" };

  return {
    ticker,
    cik,
    form,
    filingDate: recent.filingDate[idx],
    reportDate: recent.reportDate[idx],
    accessionNumber,
    primaryDocument,
    filingIndexUrl: buildFilingIndexUrl(cik, accessionNumber),
    primaryDocumentUrl: buildPrimaryDocumentUrl(cik, accessionNumber, primaryDocument),
    source: "SEC EDGAR",
    sourceType: "sec-filing",
    retrievedAt,
    freshness,
  };
}

export function selectLatestFilings(
  submissions: SecSubmissionsResponse,
  ticker: Ticker,
  cik: string,
  retrievedAt: string,
  freshness: FreshnessState
): Record<FilingForm, NormalizedFiling | UnavailableFiling> {
  const result = {} as Record<FilingForm, NormalizedFiling | UnavailableFiling>;
  for (const form of FILING_FORMS) {
    result[form] = selectFiling(submissions, ticker, cik, form, retrievedAt, freshness);
  }
  return result;
}
