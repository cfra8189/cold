import React from "react";

/* ============================================================================
   Restrained environment-level label — one line, reused in the header and
   footer for all three modes. Not a per-metric badge: LEARN and ANALYZE get
   a single "this is fictional" line, not a SAMPLE tag next to every number.
   ========================================================================== */

const COPY = {
  learn: "FICTIONAL EDUCATIONAL DATA",
  analyze: "FICTIONAL EDUCATIONAL DATA",
  live: "REAL-COMPANY SNAPSHOTS · AUTOMATIC UPDATES NOT CONNECTED",
};

export function EnvironmentLabel({ mode, className = "mono dimmer", style }) {
  const text = COPY[mode];
  if (!text) return null;
  return <span className={className} style={style}>{text}</span>;
}
