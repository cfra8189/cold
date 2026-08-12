# live-data — Phase 2 backend contract

## Purpose

Phase 1 built the LIVE frontend against local fixtures only, with no network
code at all. Phase 2 proves the *shape* of a real backend boundary — one
protected Edge Function, request validation, a ticker allowlist, CORS,
rate limiting, and a safe response envelope — while still serving the exact
same Phase 1 fixture data. Nothing about the underlying data changes in this
phase: every value is still the same verified, dated snapshot from official
Realty Income and Berkshire Hathaway releases. This is a transport and
security seam, not a live data pipeline.

**COLD is not automatically updating yet.** There is still no SEC EDGAR
connection and no market-data provider anywhere in this codebase.

## Request / response contract

```
POST /live-data
Content-Type: application/json

{ "action": "company" | "facts" | "quote" | "filings", "ticker": "O" | "BRK.B" }
```

Success (`200`):

```json
{
  "ok": true,
  "action": "company",
  "ticker": "O",
  "data": { ... },
  "servedAt": "2026-08-12T00:00:00.000Z",
  "dataMode": "SNAPSHOT"
}
```

Error:

```json
{ "ok": false, "error": { "code": "unsupported_ticker", "message": "..." } }
```

| Status | `error.code` | Meaning |
|---|---|---|
| 400 | `invalid_request` | Missing/malformed field, or malformed JSON body |
| 400 | `unsupported_action` | `action` isn't one of the four supported values |
| 400 | `unsupported_ticker` | `ticker` isn't `O` or `BRK.B` |
| 405 | `method_not_allowed` | Anything other than `POST`/`OPTIONS` |
| 429 | `rate_limited` | Rate limit exceeded (see limitation below); includes `Retry-After` |
| 503 | `unavailable` | Unexpected internal error — message is always generic, never a raw error/stack |

Only `action` and `ticker` are ever read from the body. Query-string
parameters are never parsed, and any extra body field is ignored — there is
no way to expand the request into a search, a date range, or a raw URL.

## Supported actions

- **`company`** — the normalized company profile (identity + provenance).
- **`facts`** — the reported fixture facts array only. It never computes or
  returns `affoPayoutRatio`, `affoCoverage`, `occupancyDelta`, or any other
  derived metric — that arithmetic stays in the one approved calculation
  layer (`src/live/calculations/*.js`), run client-side against these same
  reported facts, so there is exactly one place it can ever live or drift.
- **`quote`** — always the unavailable-quote fixture: `price: null`,
  `freshness: "UNAVAILABLE"`, `unavailableReason: "provider_not_connected"`.
  No market-data provider is connected in Phase 2 either.
- **`filings`** — always `status: "not_connected"`. SEC EDGAR isn't
  connected yet, so this never fabricates a filing list; it only surfaces
  the same official document links already verified in the Phase 1
  fixtures, each explicitly labeled `SNAPSHOT`.

## Supported tickers

`O` and `BRK.B` only. Nothing else is accepted, regardless of how it's
formatted or capitalized — see `shared/contracts.ts`.

## Fixture synchronization

`shared/fixtures.ts` is **generated**, not hand-maintained. It is produced
by `scripts/sync-live-fixtures.mjs` from the canonical
`src/live/fixtures/*.json` files the frontend already imports directly —
the same fixtures verified against official filings in Phase 1.

```
npm run sync:fixtures
```

`tests/fixtureDrift.test.ts` re-reads both sides on every test run and
fails if they no longer match byte-for-byte, so a forgotten regeneration
is caught by the test suite rather than silently shipped. The function is
deliberately self-contained (it does not import across the repo into
`src/` at runtime) so it stays independently deployable.

## Fixture transport vs. HTTP transport (frontend)

`src/live/providers/liveDataClient.js` can talk to this function over HTTP,
but **defaults to reading local fixtures directly** — exactly as it did in
Phase 1 — unless `VITE_LIVE_DATA_URL` is explicitly set. With no backend
configured, the browser makes zero network calls in LIVE mode. If a backend
URL *is* configured and an HTTP request fails for any reason, the client
falls back to the local fixture rather than erroring the page — and because
that fixture's own `freshness` is always `SNAPSHOT`/`UNAVAILABLE`, a failed
HTTP call can never be mistaken for live data. See
`src/live/providers/liveDataClient.test.js`.

## Local testing

No Docker or Deno CLI is available in this environment, so `supabase
functions serve` (which runs the Edge Runtime in a container) could not be
exercised here — see the Phase 2 report for exactly what was and wasn't
run. Everything in this function is written against Web-standard
`Request`/`Response` only, with no Deno-specific API outside the
`Deno.serve(...)` line at the bottom of `index.ts` (guarded so it only
fires when a real `Deno` global exists). That means `handleRequest` can be
— and is — imported and exercised directly under Node's built-in test
runner (`npm test`, which recursively discovers `supabase/functions/live-data/tests/*.test.ts`
alongside the existing frontend tests), giving real request/response
coverage without a container.

If the Supabase CLI and Docker become available later:

```
supabase functions serve live-data
curl -i -X POST http://localhost:54321/functions/v1/live-data \
  -H 'content-type: application/json' \
  -H 'origin: http://localhost:5173' \
  -d '{"action":"company","ticker":"O"}'
```

## CORS limitation

Allowed origins come from `LIVE_DATA_ALLOWED_ORIGINS` (comma-separated). If
unset, only local development origins (`http://localhost:5173`,
`http://127.0.0.1:5173`) are trusted — a wildcard (`*`) is never emitted,
in local dev or otherwise. **CORS is not authentication and not rate
limiting**: it only controls whether a browser is allowed to read a
response it already received. A direct request (curl, a script, another
server) is unaffected by Origin and is still fully validated and
rate-limited — the router deliberately keeps request handling entirely
independent of the CORS decision.

## Rate-limit limitation

`shared/rateLimit.ts` ships an in-memory limiter used by default. It is
**not a production-grade distributed rate limiter**: counters live in a
single function instance's memory, reset on cold start, and are not
shared across concurrently scaled instances. It exists in Phase 2 to prove
the `RateLimiter` interface end-to-end (including `Retry-After` and never
leaking the limiter key in a response) with something real to test against
— not as the intended production abuse control. Phase 3 can swap in a
persistent implementation (e.g. Postgres- or Redis-backed) by implementing
the same `RateLimiter` interface; no router or action-handler code would
need to change.

## What Phase 3 will replace

- The in-memory rate limiter → a persistent, cross-instance limiter.
- The `quote` action's static unavailable fixture → a real market-data
  provider integration (with the provider key living only in Edge Function
  environment variables, never in the browser).
- The `filings`/`facts` "not connected" behavior → a real SEC EDGAR
  integration for reported GAAP facts and filing metadata.
- Still explicitly out of scope for Phase 3 unless separately approved:
  additional tickers, historical prices/charts, valuation, and any
  end-user authentication.
