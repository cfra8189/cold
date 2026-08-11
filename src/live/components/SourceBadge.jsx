import React from "react";
import { formatPeriod } from "../schema/period.js";

export function SourceBadge({ provenance, period, asOf }) {
  if (!provenance) return null;
  return (
    <div className="mono dimmer mt-1.5" style={{ fontSize: 10, lineHeight: 1.6 }}>
      <div>{provenance.source}</div>
      <div>
        {period ? formatPeriod(period) : ""}
        {asOf ? " · as of " + asOf : ""}
      </div>
      {provenance.companyDefinitionNote && (
        <div style={{ marginTop: 2 }}>{provenance.companyDefinitionNote}</div>
      )}
      {provenance.documentUrl && (
        <div>
          <a href={provenance.documentUrl} target="_blank" rel="noreferrer" className="term" style={{ fontSize: 10, display: "inline-block", marginTop: 2 }}>
            View source document
          </a>
        </div>
      )}
      {provenance.filingReferenceUrl && (
        <div>
          <a href={provenance.filingReferenceUrl} target="_blank" rel="noreferrer" className="term" style={{ fontSize: 10, display: "inline-block", marginTop: 2 }}>
            Also filed with the SEC (reference, not independently verified)
          </a>
        </div>
      )}
    </div>
  );
}
