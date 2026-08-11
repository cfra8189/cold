/* ============================================================================
   Freshness / display-state classification.

   Local fixture data is fixed and can never honestly be labeled LIVE, DELAYED
   or END_OF_DAY just because it was recently added to the codebase — those
   three states describe an active, time-sensitive feed, which Phase 1 does
   not have. Phase 1 uses only SAMPLE, SNAPSHOT and UNAVAILABLE.
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

export function isPhase1Freshness(state) {
  return PHASE_1_FRESHNESS_STATES.includes(state);
}
