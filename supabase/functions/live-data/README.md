# live-data — backend contract (Phase 3: SEC EDGAR connected)

## Purpose

Phase 1 built the LIVE frontend against local fixtures only, with no network
code at all. Phase 2 proved the *shape* of a real backend boundary — one
protected Edge Function, request validation, a ticker allowlist, CORS, rate
limiting, and a safe response envelope — while still serving fixture data
for every action. **Phase 3 connects `facts` and `filings` to official SEC
EDGAR endpoints** for a small, explicitly allowlisted set of standardized
GAAP facts and the latest 10-K/10-Q/8-K filing metadata. `company` stays
fixture-backed and `quote` stays permanently unavailable — there is still
**no market-data provider anywhere in this codebase**, and no automatic
market price of any kind.

**This is current SEC filing data, not real-time market data.** It updates
only when SEC publishes a new filing (quarterly for facts, whenever a filing
is submitted for the filings list) — never continuously, and never in
response to price movement, because there is no price feed here at all.

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

`dataMode` is `"SNAPSHOT"` for `company`/`quote` (unchanged). For
`facts`/`filings` it now reflects the SEC portion's own outcome: `"LIVE"`
(fetched successfully this request, or served from a still-fresh cache
entry this instance itself previously fetched), `"STALE"` (SEC failed,
serving an expired last-known-good cache entry), or `"SNAPSHOT"` (SEC not
configured/reachable and no cache — only company-supplemental data, or the
filings fallback, is present).

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
no way to expand the request into a search, a date range, or a raw URL, and
this holds for the SEC calls made behind this boundary too: no caller input
ever reaches a SEC URL.

## Supported actions

- **`company`** — the normalized company profile (identity + provenance).
  Unchanged, fixture-backed.
- **`facts`** — returns `{ secReportedGaap, companyReportedSnapshot }`, two
  deliberately separate arrays:
  - `secReportedGaap`: the allowlisted standardized GAAP facts (see below),
    tied to the same latest-10-Q filing the `filings` action reports for
    that ticker. Never computes AFFO, occupancy, or any company-specific
    supplemental metric.
  - `companyReportedSnapshot`: the existing Phase 1/2-approved fixtures
    (Realty Income's reported AFFO/dividend/occupancy/property
    count/payout ratio; Berkshire's operating earnings/insurance float) —
    byte-for-byte unchanged, still sourced from the company's own release.

  Neither array ever contains `affoPayoutRatio`, `affoCoverage`,
  `occupancyDelta`, or any other derived metric — that arithmetic stays in
  the one approved calculation layer (`src/live/calculations/*.js`), run
  client-side, so there is exactly one place it can ever live or drift.
- **`quote`** — always the unavailable-quote fixture: `price: null`,
  `freshness: "UNAVAILABLE"`, `unavailableReason: "provider_not_connected"`.
  No market-data provider exists in this codebase.
- **`filings`** — the latest 10-K, 10-Q and 8-K from SEC EDGAR submissions,
  normalized with direct filing-index and primary-document URLs. Falls back
  to `status: "not_connected"` (with the same known, Phase-1-verified
  source links, labeled `SNAPSHOT`) when SEC isn't configured or reachable
  and no cache exists — it never fabricates a filing.

## Supported tickers

`O` and `BRK.B` only, each with one approved CIK (`shared/secClient.ts`,
`APPROVED_CIKS`). Nothing else is accepted at any layer — the router, the
SEC adapter, and the CIK lookup all reject an unsupported ticker before any
request (including to SEC) is attempted.

## Official SEC sources and fair-access requirements

Only two fixed `data.sec.gov` endpoints are ever called, only with an
approved CIK, only from `shared/secClient.ts` — no other module constructs
a SEC URL:

- `GET https://data.sec.gov/submissions/CIK{cik}.json` — filing metadata
- `GET https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json` — XBRL facts

No SEC search page, no bulk/full-text endpoint, no scraping. Every request
carries the descriptive User-Agent SEC's fair-access policy requires,
configured via `SEC_EDGAR_USER_AGENT` (server-side Edge Function
environment variable only — see `.env.example` for the expected form,
`"COLD Ownership Simulator contact@example.com"`; the real value is never
committed and never reaches the browser bundle). If it isn't configured,
`facts`/`filings` fall back to the honest not-connected behavior above
rather than sending an anonymous or misleadingly generic request.

Other fair-access controls (`shared/secConfig.ts`, `shared/secClient.ts`):
request pacing (a minimum interval between outbound SEC requests from this
instance), an 8-second timeout, up to 2 retries — **only** for temporary
failures (429/5xx or a network error/timeout, never a 4xx like 404), and a
10MB response-size cap. Every response is validated for the expected
top-level shape before use; a malformed or unexpected shape is treated as a
failure, never partially trusted.

## Supported filing forms

Exactly `10-K`, `10-Q`, `8-K` — exact string match only.
Amendment forms (`10-K/A`, `10-Q/A`, `8-K/A`) are deliberately **excluded**,
not merged in as if they were the same form; this keeps "the latest 10-Q"
unambiguous without deciding which version is authoritative. Accession
numbers and primary-document filenames from SEC's own response are
validated (`shared/secFilings.ts`) before a URL is built from them —
malformed or path-traversal-shaped values are treated as unavailable, not
used.

## Allowlisted GAAP concept mapping

`shared/secFactMapping.ts` is the **only** place a `us-gaap` XBRL concept
name is written down — nothing chooses a concept dynamically from a label.
Every candidate was manually verified against real SEC Company Facts
responses for both O and BRK.B (2026-08-12) before being added.

| metricKey | Concept candidates (ordered) | Applies to | O | BRK.B |
|---|---|---|---|---|
| `secRevenue` | `Revenues` | both | ✅ | ✅ |
| `secNetIncome` | `NetIncomeLossAvailableToCommonStockholdersBasic`, `NetIncomeLoss` | both | ✅ (1st) | ✅ (2nd) |
| `secTotalAssets` | `Assets` | both | ✅ | ✅ |
| `secTotalLiabilities` | `Liabilities` | both | ✅ | ✅ |
| `secCashAndCashEquivalents` | `CashAndCashEquivalentsAtCarryingValue`, `CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents` | both | ✅ (1st) | ✅ (2nd, combined w/ restricted cash) |
| `secLongTermDebt` | `LongTermDebt` | both | ❌ unavailable | ❌ unavailable |
| `secDilutedEPS` | `EarningsPerShareDiluted` | both | ✅ | ❌ unavailable |
| `secSharesOutstanding` | `CommonStockSharesOutstanding` | both | ✅ | ❌ unavailable |
| `secRealEstateDepreciationAndAmortization` | `DepreciationDepletionAndAmortization` | equity-reit only | ✅ | n/a |

**Why the unavailable ones are unavailable, not approximated:**
- **Long-term debt (both)**: Realty Income's `LongTermDebt` concept hasn't
  been used since a 2017 filing (current filings break debt out
  differently — e.g. `NotesPayable` for unsecured notes, `SecuredDebt` for
  mortgages). Berkshire doesn't use the concept at all. Summing the pieces
  would be a COLD-side derivation, not a direct reported fact, so it isn't
  done — this stays unavailable rather than approximated.
- **Diluted EPS / shares outstanding (Berkshire)**: Berkshire tags these
  per share class (A and B) using XBRL dimensions the Company Facts
  endpoint's simple JSON view doesn't resolve; its non-dimensional
  `EarningsPerShareBasic` concept was last used in a 2014 filing. Rather
  than risk showing the wrong share class or a decade-stale figure, both
  are unavailable for Berkshire.
- **U.S. Treasury bills / short-term investments (Berkshire)** — evaluated
  and rejected at design time, not even in the registry: no unambiguous
  concept exists. The only "Treasury"-named concepts present
  (`TreasuryStockValue`, `TreasuryStockValueAcquiredCostMethod`) are about
  treasury **stock** (share buybacks) — an unrelated concept with a
  deceptively similar name.

## Period-selection rules (critical)

A SEC Company Facts response tags a **standalone quarter**, its
**year-to-date cumulative**, and the **prior-year comparative** with the
*same* concept, form, fiscal year and fiscal period (`fy`/`fp`) — picking
"whatever matches fy/fp" or "whatever has the newest `filed` date" is not
enough on its own. `shared/secFacts.ts` selects a value only when, in
order:

1. **Form, fiscal year and fiscal period match** the target filing (the
   same latest-10-Q the `filings` action already selected for that ticker).
2. **The entry's own `end` date matches the target filing's actual report
   date.** This is what actually separates "this filing's own period" from
   the prior-year comparative it also discloses (both share the same
   fy/fp/form) — without it, a prior-year value can silently win a
   same-fy/fp tie.
3. **For duration facts**, the entry's `(end − start)` span must match the
   target period length — roughly 80–100 days for a standalone quarter,
   350–380 days for a full year. This is what separates a standalone
   quarter from its six-month/nine-month year-to-date sibling.
4. Among whatever survives, the entry tied to the **latest `filed` date**
   wins — the same period can legitimately appear across more than one
   filing (as a comparative), and the most recently filed accession is
   treated as authoritative.
5. If nothing survives every step, the fact is **unavailable** — never
   estimated, never a stale substitute shown as current.

Amended filings are handled by exclusion (see "Supported filing forms")
rather than merge logic, so there is no risk of double-counting a filing
and its amendment.

## Fixture synchronization

`shared/fixtures.ts` is **generated**, not hand-maintained, from the
canonical `src/live/fixtures/*.json` the frontend imports directly:

```
npm run sync:fixtures
```

`tests/fixtureDrift.test.ts` re-reads both sides on every test run and
fails if they no longer match byte-for-byte. `supabase/functions/live-data/fixtures/sec/*.json`
are separate, hand-curated **test** fixtures (trimmed real SEC responses,
used only by the test suite — never served to a real client) — see the
`_fixtureNote` field in each file for exactly what was kept and why.

## Fixture transport vs. HTTP transport (frontend)

`src/live/providers/liveDataClient.js` can talk to this function over HTTP,
but **defaults to reading local fixtures directly** unless
`VITE_LIVE_DATA_URL` is explicitly set — zero network calls by default. If
a backend URL *is* configured and an HTTP request fails for any reason
(including a `facts`/`filings` response whose SEC portion is itself
unavailable), the client falls back to the local fixture rather than
erroring the page — and because a fixture's own `freshness` is always
`SNAPSHOT`/`UNAVAILABLE`, a failed or unconfigured call can never be
mistaken for `LIVE` or "current SEC filing data". See
`src/live/providers/liveDataClient.test.js`.

## Local testing

No Docker or Deno CLI is available in this environment, so `supabase
functions serve` could not be exercised here. Everything in this function
is written against Web-standard `Request`/`Response` only (no Deno-specific
API outside the guarded `Deno.serve(...)` line in `index.ts`), so
`handleRequest` and every SEC module are imported and exercised directly
under Node's built-in test runner (`npm test`) using saved, redacted SEC
response fixtures (`fixtures/sec/*.json`) — no test depends on live SEC
availability. A separate, bounded **live** smoke test (not part of the
automated suite) was run once against the real `data.sec.gov` endpoints
during development; see the Phase 3 report for its results.

If the Supabase CLI and Docker become available later:

```
supabase functions serve live-data
curl -i -X POST http://localhost:54321/functions/v1/live-data \
  -H 'content-type: application/json' \
  -H 'origin: http://localhost:5173' \
  -d '{"action":"filings","ticker":"O"}'
```

## CORS limitation

Allowed origins come from `LIVE_DATA_ALLOWED_ORIGINS` (comma-separated). If
unset, only local development origins (`http://localhost:5173`,
`http://127.0.0.1:5173`) are trusted — a wildcard (`*`) is never emitted.
**CORS is not authentication and not rate limiting**: it only controls
whether a browser is allowed to read a response it already received. A
direct request (curl, a script, another server) is unaffected by Origin
and is still fully validated and rate-limited.

## Rate-limit limitation

`shared/rateLimit.ts` ships an in-memory limiter used by default. It is
**not a production-grade distributed rate limiter**: counters live in a
single function instance's memory, reset on cold start, and are not shared
across concurrently scaled instances. Included to prove the `RateLimiter`
interface end-to-end; a persistent implementation can replace it later
without touching the router or any action handler.

## SEC cache limitation

`shared/secCache.ts` is likewise an **in-memory, single-instance** cache —
not durable across serverless instances or cold starts. It is cache-first
(a fresh entry is served without touching the network at all), and on a
SEC failure it serves a last-known-good entry as `STALE` rather than
erroring or silently reverting to "not connected" — but only for the
lifetime of that one running instance. Submissions and company facts are
cached under separate keys (`submissions:{ticker}`, `companyfacts:{ticker}`).
TTL is an hour — appropriate for data that changes quarterly, not seconds.
A failed SEC fetch never overwrites a good cache entry (the cache is only
written to on success).

## SAMPLE / SNAPSHOT / CURRENT SEC FILING DATA / STALE / UNAVAILABLE

- **SAMPLE** — fictional educational data (LEARN/ANALYZE only; never LIVE).
- **SNAPSHOT** — a dated, verified capture that does not update itself:
  every `companyReportedSnapshot` fact, always; a `secReportedGaap`
  fact/filing when SEC isn't configured or reachable and there's no cache.
- **CURRENT SEC FILING DATA** (internal freshness value `LIVE`) — this
  request (or this instance's still-fresh cache) actually retrieved the
  value from SEC's current filing index. Deliberately not labeled "LIVE"
  in the UI, since nothing in this app has a live market price and the two
  must never be confused.
- **STALE** — SEC could not be reached and a last-known-good cached value
  is being served instead, honestly labeled as outdated rather than
  silently presented as current.
- **UNAVAILABLE** — no SEC value and no cache exist. Never zero, never a
  guess.

## Why AFFO and occupancy remain company-supplemental, not SEC facts

AFFO is company-defined and non-GAAP — there is no standardized XBRL
concept for it, and this codebase does not derive one from SEC's
standardized figures (that would be a COLD-side approximation presented as
if it were the company's own number). Occupancy, tenant concentration,
lease expirations, and debt maturity schedules likewise come from a
REIT's investor supplemental package, not from Company Facts. All of these
stay in `companyReportedSnapshot`, sourced directly from the company's own
release, exactly as verified in Phase 1 — Phase 3 adds a parallel SEC
GAAP section, it does not touch or reinterpret these.

## Known unmapped facts

Besides the registry entries marked unavailable above: no XBRL dimensional
data (per-share-class figures, segment reporting) is resolved by this
phase — only the "default context" (non-dimensional) value SEC's simple
Company Facts JSON view exposes. Extending to dimensional data (e.g. to
recover Berkshire's per-class EPS) is explicitly deferred, not attempted
here.

## What Phase 4 will replace

- The in-memory rate limiter and SEC cache → persistent, cross-instance
  implementations behind their existing interfaces.
- The `quote` action's static unavailable fixture → a real market-data
  provider integration (provider key living only in Edge Function
  environment variables, never in the browser).
- Still explicitly out of scope unless separately approved: additional
  tickers, historical prices/charts, valuation, dimensional XBRL facts, and
  any end-user authentication.
