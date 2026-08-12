/* ============================================================================
   Response envelope builders. Every response — success or error — goes
   through here, so a stack trace or raw internal error can never leak by
   accident from some other code path.
   ========================================================================== */

import type { Action, ErrorCode, Ticker, SuccessEnvelope, ErrorEnvelope } from "./contracts.ts";
import { ERROR_STATUS } from "./contracts.ts";

export function jsonResponse(body: unknown, status: number, extraHeaders: HeadersInit = {}): Response {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export function successResponse<T>(action: Action, ticker: Ticker, data: T, extraHeaders: HeadersInit = {}): Response {
  const envelope: SuccessEnvelope<T> = {
    ok: true,
    action,
    ticker,
    data,
    servedAt: new Date().toISOString(),
    dataMode: "SNAPSHOT",
  };
  return jsonResponse(envelope, 200, extraHeaders);
}

/**
 * Build a safe error response. `message` must already be a user-facing,
 * non-sensitive string — callers are responsible for never passing a raw
 * caught error, stack trace, file path, or provider response body here.
 */
export function errorResponse(code: ErrorCode, message: string, extraHeaders: HeadersInit = {}): Response {
  const envelope: ErrorEnvelope = { ok: false, error: { code, message } };
  return jsonResponse(envelope, ERROR_STATUS[code], extraHeaders);
}
