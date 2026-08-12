import React from "react";
import { Chip } from "../../components/primitives.jsx";

const TONE = {
  SAMPLE: "neutral",
  SNAPSHOT: "amber",
  LIVE: "green",
  DELAYED: "amber",
  END_OF_DAY: "amber",
  STALE: "red",
  UNAVAILABLE: "red",
};

/**
 * `label` lets a caller substitute a context-specific display string (e.g.
 * "CURRENT SEC FILING DATA" instead of a bare "LIVE" for SEC-sourced values,
 * so it can never be misread as a live market price). Defaults to the raw
 * state name when no label is given.
 */
export function FreshnessBadge({ state, label }) {
  if (!state) return null;
  return (
    <Chip tone={TONE[state] || "neutral"}>
      {(label || state.replace(/_/g, " ")).toUpperCase()}
    </Chip>
  );
}
