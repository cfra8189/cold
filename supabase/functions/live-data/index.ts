/* ============================================================================
   live-data — the one protected LIVE-data API boundary.

   A single Edge Function with a small internal action router (company |
   facts | quote | filings), not four separately deployed functions. The
   browser calls only this boundary. As of Phase 3, `facts` and `filings`
   may reach SEC EDGAR (server-side only, via shared/secClient.ts, cached
   through shared/secCache.ts) — `company` stays fixture-backed and `quote`
   stays always-unavailable, unchanged from Phase 2. There is still no
   market-data provider anywhere in this codebase.

   `handleRequest` is a plain (Request) => Promise<Response> function using
   only Web-standard APIs, so it can be imported and exercised directly by
   Node's test runner without Deno or Docker — see
   supabase/functions/live-data/tests/ and this repo's README.md for why
   that matters in this environment. The Deno.serve call at the bottom only
   fires when a real Deno global is present; it is a no-op import under Node.
   ========================================================================== */

import { corsHeadersFor, getAllowedOrigins, preflightResponse } from "./shared/cors.ts";
import { createInMemoryRateLimiter, keyForRequest } from "./shared/rateLimit.ts";
import type { RateLimiter } from "./shared/rateLimit.ts";
import { parseAndValidate } from "./shared/validation.ts";
import { errorResponse, successResponse } from "./shared/response.ts";
import { createInMemorySecCache } from "./shared/secCache.ts";
import type { SecCache } from "./shared/secCache.ts";
import type { SecClientDeps } from "./shared/secClient.ts";
import { getCompany } from "./actions/company.ts";
import { getFactsResult } from "./actions/facts.ts";
import { getQuote } from "./actions/quote.ts";
import { getFilingsResult } from "./actions/filings.ts";
import type { DataMode } from "./shared/contracts.ts";

export interface HandleRequestDeps {
  rateLimiter?: RateLimiter;
  allowedOrigins?: string[];
  secCache?: SecCache;
  secDeps?: SecClientDeps;
}

// Module-level singletons so rate-limit counters and the SEC cache persist
// across requests within one running instance (see shared/rateLimit.ts and
// shared/secCache.ts for why neither is a cross-instance guarantee).
const DEFAULT_RATE_LIMITER = createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 30 });
const DEFAULT_SEC_CACHE = createInMemorySecCache();

export async function handleRequest(req: Request, deps: HandleRequestDeps = {}): Promise<Response> {
  const rateLimiter = deps.rateLimiter ?? DEFAULT_RATE_LIMITER;
  const allowedOrigins = deps.allowedOrigins ?? getAllowedOrigins();
  const secCache = deps.secCache ?? DEFAULT_SEC_CACHE;
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
    let dataMode: DataMode = "SNAPSHOT";
    switch (action) {
      case "company":
        data = getCompany(ticker);
        break;
      case "facts": {
        const result = await getFactsResult(ticker, { cache: secCache, secDeps: deps.secDeps });
        data = result.data;
        dataMode = result.dataMode;
        break;
      }
      case "quote":
        data = getQuote(ticker);
        break;
      case "filings": {
        const result = await getFilingsResult(ticker, { cache: secCache, secDeps: deps.secDeps });
        data = result.data;
        dataMode = result.dataMode;
        break;
      }
    }
    return successResponse(action, ticker, data, cors, dataMode);
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
