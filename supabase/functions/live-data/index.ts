/* ============================================================================
   live-data — the one protected LIVE-data API boundary.

   A single Edge Function with a small internal action router (company |
   facts | quote | filings), not four separately deployed functions. The
   browser calls only this boundary; it never calls a market-data provider
   or SEC EDGAR directly — in Phase 2 there is nothing beyond this boundary
   to call yet anyway, since every action still serves the same approved
   Phase 1 fixtures.

   `handleRequest` is a plain (Request) => Promise<Response> function using
   only Web-standard APIs, so it can be imported and exercised directly by
   Node's test runner without Deno or Docker — see
   supabase/functions/live-data/tests/router.test.ts and this repo's
   README.md for why that matters in this environment. The Deno.serve call
   at the bottom only fires when a real Deno global is present (i.e. when
   this file is actually deployed as a Supabase Edge Function); it is a
   no-op import under Node.
   ========================================================================== */

import { corsHeadersFor, getAllowedOrigins, preflightResponse } from "./shared/cors.ts";
import { createInMemoryRateLimiter, keyForRequest } from "./shared/rateLimit.ts";
import type { RateLimiter } from "./shared/rateLimit.ts";
import { parseAndValidate } from "./shared/validation.ts";
import { errorResponse, successResponse } from "./shared/response.ts";
import { getCompany } from "./actions/company.ts";
import { getFacts } from "./actions/facts.ts";
import { getQuote } from "./actions/quote.ts";
import { getFilingsStatus } from "./actions/filings.ts";

export interface HandleRequestDeps {
  rateLimiter?: RateLimiter;
  allowedOrigins?: string[];
}

// Module-level singleton so rate-limit counters persist across requests
// within one running instance (see shared/rateLimit.ts for why that is
// still not a production guarantee across multiple instances).
const DEFAULT_RATE_LIMITER = createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export async function handleRequest(req: Request, deps: HandleRequestDeps = {}): Promise<Response> {
  const rateLimiter = deps.rateLimiter ?? DEFAULT_RATE_LIMITER;
  const allowedOrigins = deps.allowedOrigins ?? getAllowedOrigins();
  const origin = req.headers.get("origin");
  const cors = corsHeadersFor(origin, allowedOrigins);

  if (req.method === "OPTIONS") {
    return preflightResponse(origin, allowedOrigins);
  }

  if (req.method !== "POST") {
    return errorResponse("method_not_allowed", "Only POST is supported.", cors);
  }

  // Rate limiting happens before body parsing and is enforced regardless of
  // Origin — a direct non-browser request is not exempt just because it
  // sent no Origin header. See shared/cors.ts: CORS is not authentication.
  const limitResult = rateLimiter.check(keyForRequest(req));
  if (!limitResult.allowed) {
    const headers: Record<string, string> = { ...cors };
    if (limitResult.retryAfterSeconds) headers["retry-after"] = String(limitResult.retryAfterSeconds);
    return errorResponse("rate_limited", "Too many requests. Please slow down and try again shortly.", headers);
  }

  const parsed = await parseAndValidate(req);
  if (!parsed.ok) {
    return errorResponse(parsed.code, parsed.message, cors);
  }

  const { action, ticker } = parsed.body;

  try {
    let data: unknown;
    switch (action) {
      case "company":
        data = getCompany(ticker);
        break;
      case "facts":
        data = getFacts(ticker);
        break;
      case "quote":
        data = getQuote(ticker);
        break;
      case "filings":
        data = getFilingsStatus(ticker);
        break;
    }
    return successResponse(action, ticker, data, cors);
  } catch {
    // Deliberately swallow and never forward the caught error's message or
    // stack — that is exactly the "raw provider body / internal detail"
    // this boundary exists to keep out of any response.
    return errorResponse("unavailable", "The LIVE data service is temporarily unavailable.", cors);
  }
}

const maybeDeno = (globalThis as { Deno?: { serve: (handler: (req: Request) => Response | Promise<Response>) => void } }).Deno;
if (maybeDeno) {
  maybeDeno.serve((req) => handleRequest(req));
}
