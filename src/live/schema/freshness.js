/* ============================================================================
   Freshness / display-state classification.

   Local fixture data is fixed and can never honestly be labeled LIVE, DELAYED
   or END_OF_DAY just because it was recently added to the codebase — those
   three states describe an active, time-sensitive feed, which Phase 1 did
   not have and Phase 2 still didn't. Phase 1/2 fixture-sourced values use
   only SAMPLE, SNAPSHOT and UNAVAILABLE.

   Phase 3 adds real use of LIVE and STALE, but only for SEC EDGAR-sourced
   filings/facts, and LIVE there means "successfully retrieved from the
   current SEC endpoint" — a filing-data concept, not a market-real-time
   one. To avoid a reader confusing it with a live stock price (which still
   does not exist anywhere in this app), the UI prefers the label "CURRENT
   SEC FILING DATA" over a bare "LIVE" badge specifically for SEC-sourced
   values — see secFreshnessLabel() below.
   ========================================================================== */

/** @typedef {"SAMPLE"|"SNAPSHOT"|"LIVE"|"DELAYED"|"END_OF_DAY"|"STALE"|"UNAVAILABLE"} FreshnessState */

export const FRESHNESS_STATES = Object.freeze({
  SAMPLE: "SAMPLE",
  SNAPSHOT: "SNAPSHOT",
  LIVE: "LIVE",
  DELAYED: "DELAYED",
  END_OF_DAY: "END_OF_DAY",
  STALE: "STALE",
  UNAVAILABLE: "UNAVAILABLE",
});

/** The only freshness states Phase 1 code is permitted to produce. */
export const PHASE_1_FRESHNESS_STATES = Object.freeze([
  FRESHNESS_STATES.SAMPLE,
  FRESHNESS_STATES.SNAPSHOT,
  FRESHNESS_STATES.UNAVAILABLE,
]);

export const FRESHNESS_COPY = Object.freeze({
  SAMPLE: "Fictional educational data",
  SNAPSHOT: "Real-company data captured from a dated source; not automatically updating",
  LIVE: "Live",
  DELAYED: "Delayed",
  END_OF_DAY: "As of prior close",
  STALE: "Stale — provider unavailable",
  UNAVAILABLE: "Not available",
});

/** The freshness states a Phase 3 SEC-sourced value may carry. */
export const SEC_FRESHNESS_STATES = Object.freeze([
  FRESHNESS_STATES.LIVE,
  FRESHNESS_STATES.STALE,
  FRESHNESS_STATES.SNAPSHOT,
  FRESHNESS_STATES.UNAVAILABLE,
]);

/**
 * SEC-specific display copy. LIVE is relabeled "Current SEC filing data" so
 * it can never be misread as a live market price — nothing in this app has
 * one. STALE/SNAPSHOT/UNAVAILABLE keep their normal meaning.
 */
export const SEC_FRESHNESS_COPY = Object.freeze({
  LIVE: "Current SEC filing data",
  STALE: "Stale — SEC unavailable, showing last verified filing data",
  SNAPSHOT: "SEC not connected in this environment",
  UNAVAILABLE: "Not available",
});

export function secFreshnessLabel(state) {
  return SEC_FRESHNESS_COPY[state] || FRESHNESS_COPY[state] || state;
}

export function isPhase1Freshness(state) {
  return PHASE_1_FRESHNESS_STATES.includes(state);
}
