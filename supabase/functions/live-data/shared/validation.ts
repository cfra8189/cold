/* ============================================================================
   Request validation. The entire accepted request surface is exactly:

     { "action": "company"|"facts"|"quote"|"filings", "ticker": "O"|"BRK.B" }

   Nothing else is ever honored. Query-string parameters are never read,
   extra body fields are ignored (never passed through anywhere), and a
   ticker outside the allowlist is rejected regardless of shape — there is
   no "search" and no way to expand the request scope beyond these two
   fixed fields.
   ========================================================================== */

import { isAllowedAction, isAllowedTicker } from "./contracts.ts";
import type { Action, LiveDataRequestBody, Ticker } from "./contracts.ts";

export type ParseResult =
  | { ok: true; body: LiveDataRequestBody }
  | { ok: false; code: "invalid_request" | "unsupported_action" | "unsupported_ticker"; message: string };

export async function parseAndValidate(req: Request): Promise<ParseResult> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, code: "invalid_request", message: "Request body must be valid JSON." };
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "invalid_request", message: "Request body must be a JSON object." };
  }

  const record = raw as Record<string, unknown>;

  if (!("action" in record) || record.action === undefined || record.action === null || record.action === "") {
    return { ok: false, code: "invalid_request", message: "Missing required field: action." };
  }
  if (!isAllowedAction(record.action)) {
    return { ok: false, code: "unsupported_action", message: "Unsupported action. Allowed: company, facts, quote, filings." };
  }

  if (!("ticker" in record) || record.ticker === undefined || record.ticker === null || record.ticker === "") {
    return { ok: false, code: "invalid_request", message: "Missing required field: ticker." };
  }
  if (!isAllowedTicker(record.ticker)) {
    return { ok: false, code: "unsupported_ticker", message: "Unsupported ticker. This Phase 2 deployment only serves O and BRK.B." };
  }

  const action: Action = record.action;
  const ticker: Ticker = record.ticker;
  return { ok: true, body: { action, ticker } };
}
