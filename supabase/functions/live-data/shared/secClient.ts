/* ============================================================================
   SEC EDGAR adapter — the only place in this codebase allowed to construct
   a data.sec.gov URL or send it a request.

   Server-side only, fixed base URL, no caller-supplied URL, no arbitrary
   CIK: the CIK always comes from APPROVED_CIKS, keyed by the same O/BRK.B
   ticker allowlist the rest of live-data already enforces. Every request
   carries the configured descriptive User-Agent (see secConfig.ts) or the
   request is refused outright rather than sent anonymously/generically.
   ========================================================================== */

import type { Ticker } from "./contracts.ts";
import {
  SEC_BASE_URL,
  SEC_REQUEST_TIMEOUT_MS,
  SEC_MAX_RETRIES,
  SEC_RETRY_BASE_DELAY_MS,
  SEC_MIN_REQUEST_INTERVAL_MS,
  SEC_MAX_RESPONSE_BYTES,
  getSecUserAgent,
} from "./secConfig.ts";

/** The only CIKs this adapter will ever request. Never accept a caller-supplied CIK. */
export const APPROVED_CIKS: Record<Ticker, string> = {
  O: "0000726728",
  "BRK.B": "0001067983",
};

export interface SecRawEntry {
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string;
  form: string;
  filed: string;
  frame?: string;
}

export interface SecConceptFacts {
  units: Record<string, SecRawEntry[]>;
}

export interface SecCompanyFactsResponse {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, SecConceptFacts>;
    dei?: Record<string, SecConceptFacts>;
  };
}

export interface SecSubmissionsRecent {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  form: string[];
  primaryDocument: string[];
  primaryDocDescription?: string[];
  isXBRL?: number[];
}

export interface SecSubmissionsResponse {
  cik: string;
  name: string;
  filings: { recent: SecSubmissionsRecent };
}

export type SecFetchFailureReason =
  | "sec_not_configured"
  | "fetch_unavailable"
  | "unsupported_ticker"
  | "invalid_shape"
  | "response_too_large"
  | "invalid_json"
  | "timeout"
  | "network_error"
  | `http_${number}`;

export type SecFetchResult<T> = { ok: true; data: T } | { ok: false; reason: SecFetchFailureReason };

export interface SecClientDeps {
  fetchImpl?: typeof fetch;
  userAgent?: string | null;
  minIntervalMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

let lastRequestAt = 0;
async function pace(minIntervalMs: number): Promise<void> {
  const now = Date.now();
  const wait = minIntervalMs - (now - lastRequestAt);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

function isTemporaryStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function fetchWithTimeout(doFetch: typeof fetch, url: string, headers: Record<string, string>, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await doFetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function requestJson(path: string, deps: SecClientDeps): Promise<SecFetchResult<unknown>> {
  const userAgent = deps.userAgent !== undefined ? deps.userAgent : getSecUserAgent();
  if (!userAgent) return { ok: false, reason: "sec_not_configured" };

  const doFetch = deps.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);
  if (!doFetch) return { ok: false, reason: "fetch_unavailable" };

  const minIntervalMs = deps.minIntervalMs ?? SEC_MIN_REQUEST_INTERVAL_MS;
  const timeoutMs = deps.timeoutMs ?? SEC_REQUEST_TIMEOUT_MS;
  const maxRetries = deps.maxRetries ?? SEC_MAX_RETRIES;

  let attempt = 0;
  for (;;) {
    attempt++;
    await pace(minIntervalMs);
    try {
      const res = await fetchWithTimeout(doFetch, SEC_BASE_URL + path, { "User-Agent": userAgent, Accept: "application/json" }, timeoutMs);
      if (res.ok) {
        const text = await res.text();
        if (text.length > SEC_MAX_RESPONSE_BYTES) return { ok: false, reason: "response_too_large" };
        try {
          return { ok: true, data: JSON.parse(text) };
        } catch {
          return { ok: false, reason: "invalid_json" };
        }
      }
      if (isTemporaryStatus(res.status) && attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, SEC_RETRY_BASE_DELAY_MS * attempt));
        continue;
      }
      return { ok: false, reason: `http_${res.status}` as const };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, SEC_RETRY_BASE_DELAY_MS * attempt));
        continue;
      }
      return { ok: false, reason: isAbort ? "timeout" : "network_error" };
    }
  }
}

function isValidSubmissionsShape(data: unknown): data is SecSubmissionsResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const filings = d.filings as Record<string, unknown> | undefined;
  const recent = filings?.recent as Record<string, unknown> | undefined;
  return (
    typeof d.cik === "string" &&
    typeof d.name === "string" &&
    !!recent &&
    Array.isArray(recent.accessionNumber) &&
    Array.isArray(recent.form) &&
    Array.isArray(recent.filingDate) &&
    Array.isArray(recent.primaryDocument)
  );
}

function isValidCompanyFactsShape(data: unknown): data is SecCompanyFactsResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.cik === "number" && typeof d.entityName === "string" && typeof d.facts === "object" && d.facts !== null;
}

export async function getSubmissions(ticker: Ticker, deps: SecClientDeps = {}): Promise<SecFetchResult<SecSubmissionsResponse>> {
  const cik = APPROVED_CIKS[ticker];
  if (!cik) return { ok: false, reason: "unsupported_ticker" };
  const result = await requestJson(`/submissions/CIK${cik}.json`, deps);
  if (!result.ok) return result;
  if (!isValidSubmissionsShape(result.data)) return { ok: false, reason: "invalid_shape" };
  return { ok: true, data: result.data };
}

export async function getCompanyFacts(ticker: Ticker, deps: SecClientDeps = {}): Promise<SecFetchResult<SecCompanyFactsResponse>> {
  const cik = APPROVED_CIKS[ticker];
  if (!cik) return { ok: false, reason: "unsupported_ticker" };
  const result = await requestJson(`/api/xbrl/companyfacts/CIK${cik}.json`, deps);
  if (!result.ok) return result;
  if (!isValidCompanyFactsShape(result.data)) return { ok: false, reason: "invalid_shape" };
  return { ok: true, data: result.data };
}
