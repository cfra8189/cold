/* ============================================================================
   CORS — explicit allowed-origin handling.

   CORS is not authentication and it is not rate limiting. It only controls
   whether a *browser* is allowed to read the response it already received —
   it does nothing to stop a direct request from curl, a script, or another
   server, and this function does not pretend otherwise. Every request is
   still fully validated and rate-limited regardless of its Origin header;
   the only thing Origin affects here is whether we attach
   access-control-allow-origin to the response.

   Allowed origins come from a server-side configuration value
   (LIVE_DATA_ALLOWED_ORIGINS, comma-separated), read at request time so
   tests can set it via process.env without reloading the module. No
   provider secret is involved — this is just a list of front-end origins.

   When unset, only local development origins are trusted, and a wildcard
   ("*") is never emitted — the intended production configuration must set
   LIVE_DATA_ALLOWED_ORIGINS explicitly to its real deployed origin(s).
   ========================================================================== */

const DEFAULT_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function getEnv(name: string): string | undefined {
  // deno-lint-ignore no-explicit-any
  const g = globalThis as any;
  if (typeof g.Deno !== "undefined" && g.Deno.env) return g.Deno.env.get(name) ?? undefined;
  if (typeof process !== "undefined" && process.env) return process.env[name];
  return undefined;
}

export function getAllowedOrigins(): string[] {
  const configured = getEnv("LIVE_DATA_ALLOWED_ORIGINS");
  if (configured && configured.trim().length > 0) {
    return configured
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_DEV_ORIGINS;
}

export function isOriginAllowed(origin: string | null, allowedOrigins: string[] = getAllowedOrigins()): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

/** Headers to merge into any response. Empty object (no header at all) for an unrecognized origin. */
export function corsHeadersFor(origin: string | null, allowedOrigins: string[] = getAllowedOrigins()): Record<string, string> {
  if (isOriginAllowed(origin, allowedOrigins)) {
    return {
      "access-control-allow-origin": origin as string,
      vary: "Origin",
    };
  }
  return {};
}

export function preflightResponse(origin: string | null, allowedOrigins: string[] = getAllowedOrigins()): Response {
  const headers = new Headers(corsHeadersFor(origin, allowedOrigins));
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-max-age", "600");
  return new Response(null, { status: 204, headers });
}
