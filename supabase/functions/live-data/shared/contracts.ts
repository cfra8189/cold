/* ============================================================================
   Request/response contract for the live-data Edge Function boundary.

   One function, one small action router — not four separately deployed
   functions. The browser only ever talks to this contract; it never calls
   a market-data provider or SEC EDGAR directly (there is nothing to call
   yet in Phase 2 anyway — every action is still fixture-backed).
   ========================================================================== */

export const ALLOWED_ACTIONS = ["company", "facts", "quote", "filings"] as const;
export type Action = (typeof ALLOWED_ACTIONS)[number];

export const ALLOWED_TICKERS = ["O", "BRK.B"] as const;
export type Ticker = (typeof ALLOWED_TICKERS)[number];

export function isAllowedAction(value: unknown): value is Action {
  return typeof value === "string" && (ALLOWED_ACTIONS as readonly string[]).includes(value);
}

export function isAllowedTicker(value: unknown): value is Ticker {
  return typeof value === "string" && (ALLOWED_TICKERS as readonly string[]).includes(value);
}

export interface LiveDataRequestBody {
  action: Action;
  ticker: Ticker;
}

/** Every successful response carries dataMode: "SNAPSHOT" — Phase 2 has no live pipeline. */
export type DataMode = "SNAPSHOT";

export interface SuccessEnvelope<T = unknown> {
  ok: true;
  action: Action;
  ticker: Ticker;
  data: T;
  servedAt: string;
  dataMode: DataMode;
}

export const ERROR_CODES = [
  "invalid_request",
  "unsupported_action",
  "unsupported_ticker",
  "method_not_allowed",
  "rate_limited",
  "unavailable",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ErrorEnvelope {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

/** HTTP status each error code maps to. Kept in one place so it can't drift per call site. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  unsupported_action: 400,
  unsupported_ticker: 400,
  method_not_allowed: 405,
  rate_limited: 429,
  unavailable: 503,
};
