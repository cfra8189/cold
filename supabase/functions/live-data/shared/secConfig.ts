/* ============================================================================
   SEC EDGAR configuration.

   SEC's fair-access policy requires every request to carry a descriptive
   User-Agent identifying the application and a contact address. The real
   value is never committed — only the expected shape is documented (see
   .env.example): "COLD Ownership Simulator contact@example.com".

   If SEC_EDGAR_USER_AGENT is not configured, this module says so instead of
   sending a misleading generic request — see isSecConfigured().
   ========================================================================== */

function getEnv(name: string): string | undefined {
  // deno-lint-ignore no-explicit-any
  const g = globalThis as any;
  if (typeof g.Deno !== "undefined" && g.Deno.env) return g.Deno.env.get(name) ?? undefined;
  if (typeof process !== "undefined" && process.env) return process.env[name];
  return undefined;
}

export function getSecUserAgent(): string | null {
  const value = getEnv("SEC_EDGAR_USER_AGENT");
  return value && value.trim().length > 0 ? value.trim() : null;
}

/**
 * The user agent actually in effect for a request: an explicit override
 * (used by tests to inject a fixture-mode user agent without touching real
 * env vars) takes precedence; otherwise falls back to the configured
 * SEC_EDGAR_USER_AGENT. Actions must gate on this, not on getSecUserAgent()
 * alone, or a test-injected override would be silently ignored.
 */
export function resolveUserAgent(overrideUserAgent?: string | null): string | null {
  if (overrideUserAgent !== undefined) {
    return overrideUserAgent && overrideUserAgent.trim().length > 0 ? overrideUserAgent.trim() : null;
  }
  return getSecUserAgent();
}

export function isSecConfigured(overrideUserAgent?: string | null): boolean {
  return resolveUserAgent(overrideUserAgent) !== null;
}

export const SEC_BASE_URL = "https://data.sec.gov";

/** Fair-access pacing: minimum time between two outbound SEC requests from this instance. */
export const SEC_MIN_REQUEST_INTERVAL_MS = 350;

export const SEC_REQUEST_TIMEOUT_MS = 8000;
export const SEC_MAX_RETRIES = 2;
export const SEC_RETRY_BASE_DELAY_MS = 400;

/** Cap on a response body we'll parse — SEC company-facts payloads can run several MB; this is a safety bound, not a normal ceiling. */
export const SEC_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
