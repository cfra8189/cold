import React, { useState } from "react";
import { Panel, Stat, Chip, Bar } from "../components/primitives.jsx";
import { DOSSIER_FIELDS } from "../data/dossierFields.js";
import { dossierStats } from "../lib/dossier.js";

export function Dossier({ app }) {
  const { state, setState, company, go } = app;
  const d = state.dossiers[company.id] || {};
  const s = dossierStats(d);
  const [saved, setSaved] = useState(false);

  const update = (k, val) => {
    setSaved(false);
    setState((st) => ({ ...st, dossiers: { ...st.dossiers, [company.id]: { ...st.dossiers[company.id], [k]: val } } }));
  };

  return (
    <div className="space-y-5">
      <Panel title={"Investment dossier — " + company.name}
        right={<Chip tone={s.ready ? "green" : "amber"}>{s.ready ? "Ready to transact" : s.missing.length + " essential fields open"}</Chip>}>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <Stat label="Completion" value={s.pct + "%"} sub={s.complete + " of " + s.total + " fields"} tone={s.pct > 80 ? "green" : ""} />
          <Stat label="Essential fields" value={s.essentialsDone + " / " + s.essentials} tone={s.ready ? "green" : "amber"} sub="Required before a simulated purchase" />
          <Stat label="Status" value={saved ? "Saved" : "Draft"} sub={saved ? "Recorded in this session" : "Unsaved changes"} />
          <div>
            <div className="label mb-2">Progress</div>
            <Bar pct={s.pct} tone={s.pct > 80 ? "green" : s.pct > 40 ? "amber" : "red"} />
            <div className="mono dimmer mt-2" style={{ fontSize: 10 }}>
              {s.ready ? "Purchases unlocked in Portfolio" : "Purchases locked until essentials are written"}
            </div>
          </div>
        </div>
        {!s.ready && (
          <div className="mt-5 p-4" style={{ background: "var(--amber-wash)", border: "1px solid #3A2E17" }}>
            <div className="eyebrow amber mb-2">Still needed before you can buy</div>
            <div className="text-sm dim" style={{ lineHeight: 1.7 }}>{s.missing.map((f) => f.label).join(" · ")}</div>
          </div>
        )}
      </Panel>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))" }}>
        {DOSSIER_FIELDS.map((f) => {
          const val = d[f.k] || "";
          const done = String(val).trim().length > 0;
          return (
            <div key={f.k} className="panel" style={{ padding: 16 }}>
              <div className="flex items-center justify-between mb-2 gap-3">
                <span className="label" style={{ color: done ? "var(--green)" : "var(--dimmer)" }}>{f.label}</span>
                {f.essential && <Chip tone={done ? "green" : "amber"}>{done ? "Done" : "Essential"}</Chip>}
              </div>
              {f.type === "area" ? (
                <textarea className="input" rows={3} value={val} onChange={(e) => update(f.k, e.target.value)} placeholder={f.help || "Write it in your own words"} />
              ) : (
                <input className="input" value={val} onChange={(e) => update(f.k, e.target.value)} placeholder={f.help || ""} />
              )}
              {f.help && f.type === "area" && <div className="mono dimmer mt-2" style={{ fontSize: 10, lineHeight: 1.5 }}>{f.help}</div>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={() => setSaved(true)}>Save dossier</button>
        <button className="btn" onClick={() => go("portfolio")} disabled={!s.ready}>
          {s.ready ? "Go to portfolio and place a simulated order" : "Purchases locked until essentials complete"}
        </button>
        <span className="mono dimmer" style={{ fontSize: 11 }}>
          Nothing here is sent anywhere. The dossier exists so your reasoning survives your own memory.
        </span>
      </div>
    </div>
  );
}
