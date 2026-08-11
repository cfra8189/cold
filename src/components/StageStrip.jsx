import React from "react";
import { Panel, Chip } from "./primitives.jsx";
import { LEARNING_STAGES } from "../data/learningStages.js";

export function StageStrip() {
  return (
    <Panel title="Learning stages">
      <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
        {LEARNING_STAGES.map((s) => {
          const active = s.state === "active";
          return (
            <div key={s.n} style={{ background: active ? "var(--green-wash)" : "var(--panel)", padding: "14px 16px" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: active ? "var(--green)" : "var(--dimmer)" }}>
                  STAGE {s.n}
                </span>
                <Chip tone={active ? "green" : "neutral"}>{active ? "Active" : "Locked"}</Chip>
              </div>
              <div style={{ fontSize: 14, marginBottom: 6, color: active ? "var(--tx)" : "var(--dim)" }}>{s.name}</div>
              <div className="mono dimmer" style={{ fontSize: 11, lineHeight: 1.55 }}>{s.desc}</div>
              {s.unlock && (
                <div className="mono dimmer mt-3 pt-3" style={{ fontSize: 10, borderTop: "1px solid var(--line)" }}>
                  UNLOCKS: {s.unlock}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
