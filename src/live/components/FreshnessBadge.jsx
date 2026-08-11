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

export function FreshnessBadge({ state }) {
  if (!state) return null;
  return (
    <Chip tone={TONE[state] || "neutral"}>
      {state.replace(/_/g, " ")}
    </Chip>
  );
}
