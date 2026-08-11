import React from "react";
import { Panel } from "./primitives.jsx";

export function NotInStage1({ company, what }) {
  return (
    <Panel title={what}>
      <div className="py-12 text-center">
        <div className="eyebrow mb-3">Not part of Stage 1 for this company</div>
        <p className="dim text-sm" style={{ maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
          {company.name} is a holding company, so its cash reaches owners through retained earnings and buybacks
          rather than rent and distributions. Switch to Foundation Property Trust to work through this screen.
        </p>
      </div>
    </Panel>
  );
}
