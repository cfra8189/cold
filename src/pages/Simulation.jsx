import React, { useState } from "react";
import { Panel, Stat, Chip, Bar } from "../components/primitives.jsx";
import { NotInStage1 } from "../components/NotInStage1.jsx";
import { CHANGE_KEYS, EVENTS, DECISIONS } from "../data/simulationEvents.js";

export function Simulation({ app }) {
  const { state, setState } = app;
  const idx = state.quarter;
  const done = idx >= EVENTS.length;
  const ev = EVENTS[Math.min(idx, EVENTS.length - 1)];
  const [picks, setPicks] = useState({});
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);

  const hasNumber = /\d/.test(reason);
  const longEnough = reason.trim().length >= 40;
  const ready = decision && hasNumber && longEnough && Object.values(picks).some(Boolean);

  const submit = () => {
    const missed = CHANGE_KEYS.filter((c) => ev.truth[c.k] && !picks[c.k]);
    const over = CHANGE_KEYS.filter((c) => !ev.truth[c.k] && picks[c.k]);
    const classificationScore = Math.round(((4 - missed.length - over.length) / 4) * 100);
    const soundDecision = ev.sound.includes(decision);
    const numbers = (reason.match(/\d+(\.\d+)?/g) || []).length;
    const r = { missed, over, classificationScore, soundDecision, numbers, decision, reason, ev };
    setResult(r);
    setState((s) => {
      const delta = Math.round((classificationScore - 50) / 12);
      const bump = (v, d) => Math.max(0, Math.min(100, v + d));
      return {
        ...s,
        log: [...s.log, { q: ev.q, title: ev.title, decision, reason, classificationScore, soundDecision }],
        scores: {
          ...s.scores,
          business: bump(s.scores.business, ev.truth.business ? delta : 0),
          cashFlow: bump(s.scores.cashFlow, numbers >= 2 ? 2 : 0),
          financial: bump(s.scores.financial, ev.truth.financials ? delta : 0),
          value: bump(s.scores.value, ev.truth.value || ev.truth.priceOnly ? delta : 0),
          risk: bump(s.scores.risk, soundDecision ? 3 : -1),
        },
      };
    });
  };

  const next = () => {
    setState((s) => ({ ...s, quarter: s.quarter + 1 }));
    setPicks({}); setDecision(null); setReason(""); setResult(null);
  };

  if (app.company.id !== "FPT") return <NotInStage1 company={app.company} what="Simulation" />;

  if (done) {
    return (
      <div className="space-y-5">
        <Panel title="Guided simulation complete">
          <div className="py-8 text-center">
            <div className="eyebrow mb-3">Ten quarters recorded</div>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>You have worked through every scenario in Stage 1.</h2>
            <p className="dim text-sm" style={{ maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Stage 2 removes the hints, the definitions and the simplified statements. It unlocks when all five Cold
              Score categories reach Analyzing.
            </p>
          </div>
        </Panel>
        <DecisionLog log={state.log} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="split-c">
        <Panel title={"Quarter " + (idx + 1) + " of 10 — " + ev.q} right={<Chip tone="amber">Decision required</Chip>}>
          <h2 style={{ fontSize: 21, lineHeight: 1.3, marginBottom: 10, letterSpacing: "-0.01em" }}>{ev.title}</h2>
          <p className="dim" style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>{ev.body}</p>
          <div className="grid gap-px mt-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
            {ev.figures.map(([k, v]) => (
              <div key={k} style={{ background: "var(--sunken)", padding: 14 }}>
                <div className="label mb-1.5">{k}</div>
                <div className="mono text-sm">{v}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Progress">
          <Stat size="md" label="Quarters completed" value={state.log.length + " / 10"} />
          <div className="mt-3"><Bar pct={(state.log.length / 10) * 100} tone="green" h={4} /></div>
          <div className="rowline mt-4 pt-4 mono dim" style={{ fontSize: 11, lineHeight: 1.65 }}>
            COLD does not score whether the price went your way. It scores whether your classification was right and
            whether your reasoning used the numbers in front of you.
          </div>
        </Panel>
      </div>

      {!result ? (
        <>
          <Panel title="Step 1 — What actually changed?" right={<Chip>Select all that apply</Chip>}>
            <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
              {CHANGE_KEYS.map((c) => {
                const on = !!picks[c.k];
                return (
                  <button key={c.k} onClick={() => setPicks((p) => ({ ...p, [c.k]: !p[c.k] }))}
                    className="text-left" style={{ background: on ? "var(--green-wash)" : "var(--panel)", border: "none", padding: 16, cursor: "pointer" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 14, color: "var(--tx)" }}>{c.l}</span>
                      <span className="mono" style={{ fontSize: 10, color: on ? "var(--green)" : "var(--dimmer)" }}>{on ? "YES" : "NO"}</span>
                    </div>
                    <div className="mono dimmer" style={{ fontSize: 11, lineHeight: 1.5 }}>{c.d}</div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Step 2 — Your decision">
            <div className="flex flex-wrap gap-2">
              {DECISIONS.map((d) => (
                <button key={d.k} className={"btn " + (decision === d.k ? "btn-sel" : "")} onClick={() => setDecision(d.k)}
                  style={{ minWidth: 96 }}>
                  <div>{d.l}</div>
                  <div className="dimmer" style={{ fontSize: 9, marginTop: 3, letterSpacing: 0 }}>{d.d}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Step 3 — Justify it with numbers">
            <textarea className="input" rows={4} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Example: coverage falls from 1.22x to 1.04x, so $0.04 of every dividend dollar is now the only cushion. I hold rather than add until the 380,000 sf is re-leased." />
            <div className="flex flex-wrap gap-4 mt-3 mono" style={{ fontSize: 11 }}>
              <span style={{ color: hasNumber ? "var(--green)" : "var(--dimmer)" }}>{hasNumber ? "✓" : "○"} Contains at least one figure</span>
              <span style={{ color: longEnough ? "var(--green)" : "var(--dimmer)" }}>{longEnough ? "✓" : "○"} At least 40 characters ({reason.trim().length})</span>
              <span style={{ color: decision ? "var(--green)" : "var(--dimmer)" }}>{decision ? "✓" : "○"} Decision selected</span>
              <span style={{ color: Object.values(picks).some(Boolean) ? "var(--green)" : "var(--dimmer)" }}>
                {Object.values(picks).some(Boolean) ? "✓" : "○"} Classification made
              </span>
            </div>
            <div className="rowline mt-4 pt-4 flex items-center gap-3 flex-wrap">
              <button className="btn btn-primary" disabled={!ready} onClick={submit}>Submit decision</button>
              <span className="mono dimmer" style={{ fontSize: 11 }}>
                {ready ? "COLD will grade the reasoning, not the outcome." : "A decision without a number is a guess. Complete every check."}
              </span>
            </div>
          </Panel>
        </>
      ) : (
        <Feedback r={result} onNext={next} />
      )}

      {state.log.length > 0 && <DecisionLog log={state.log} />}
    </div>
  );
}

function Feedback({ r, onNext }) {
  const { ev } = r;
  const good = r.classificationScore >= 75;
  return (
    <>
      <Panel title="Feedback on your reasoning"
        right={<Chip tone={good ? "green" : r.classificationScore >= 50 ? "amber" : "red"}>Classification {r.classificationScore}%</Chip>}>
        <div className="grid gap-px mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
          {CHANGE_KEYS.map((c) => {
            const truth = ev.truth[c.k];
            return (
              <div key={c.k} style={{ background: "var(--panel)", padding: 14 }}>
                <div className="label mb-2">{c.l}</div>
                <div className="mono" style={{ fontSize: 13, color: truth ? "var(--green)" : "var(--dimmer)" }}>
                  {truth ? "Changed" : "Unchanged"}
                </div>
              </div>
            );
          })}
        </div>

        {r.missed.length > 0 && (
          <div className="p-4 mb-3" style={{ background: "var(--amber-wash)", border: "1px solid #3A2E17" }}>
            <div className="eyebrow amber mb-2">You missed</div>
            <div className="text-sm dim" style={{ lineHeight: 1.6 }}>
              {r.missed.map((m) => m.l).join(", ")}. Re-read the figures panel and identify which line each one moves.
            </div>
          </div>
        )}
        {r.over.length > 0 && (
          <div className="p-4 mb-3" style={{ background: "var(--amber-wash)", border: "1px solid #3A2E17" }}>
            <div className="eyebrow amber mb-2">You over-attributed</div>
            <div className="text-sm dim" style={{ lineHeight: 1.6 }}>
              {r.over.map((m) => m.l).join(", ")} did not change here. Treating every event as fundamental is as costly
              as treating none of them that way.
            </div>
          </div>
        )}

        <div className="p-4" style={{ background: "var(--sunken)", borderLeft: "2px solid var(--green)" }}>
          <div className="eyebrow green mb-2">What this event was teaching</div>
          <p className="text-sm" style={{ lineHeight: 1.7 }}>{ev.teach}</p>
        </div>

        <div className="rowline mt-5 pt-4 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          <div>
            <div className="label mb-2">Your decision</div>
            <div className="flex items-center gap-3 mb-3">
              <span className="mono" style={{ fontSize: 15 }}>{DECISIONS.find((d) => d.k === r.decision)?.l}</span>
              <Chip tone={r.soundDecision ? "green" : "amber"}>{r.soundDecision ? "Defensible" : "Needs a stronger case"}</Chip>
            </div>
            <p className="text-sm dim" style={{ lineHeight: 1.65 }}>{ev.why}</p>
          </div>
          <div>
            <div className="label mb-2">Your written reasoning</div>
            <p className="mono text-xs" style={{ lineHeight: 1.7, color: "var(--tx)", background: "var(--sunken)", padding: 12, border: "1px solid var(--line)" }}>
              {r.reason}
            </p>
            <div className="mono dimmer mt-2" style={{ fontSize: 11 }}>
              {r.numbers} figure{r.numbers === 1 ? "" : "s"} used.{" "}
              {r.numbers >= 2 ? "Specific enough to check later." : "One figure is thin. Two or more make the reasoning testable next quarter."}
            </div>
          </div>
        </div>
      </Panel>
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={onNext}>Advance to the next quarter</button>
      </div>
    </>
  );
}

function DecisionLog({ log }) {
  if (!log.length) return null;
  return (
    <Panel title="Decision log" right={<Chip>{log.length} recorded</Chip>} pad={false}>
      <div className="scrollx">
        <table className="fin" style={{ minWidth: 620 }}>
          <thead><tr><th>Quarter</th><th style={{ textAlign: "left" }}>Event</th><th style={{ textAlign: "left" }}>Decision</th><th>Classification</th><th style={{ textAlign: "left" }}>Your reason</th></tr></thead>
          <tbody>
            {log.map((l, i) => (
              <tr key={i}>
                <td className="mono dim" style={{ fontSize: 11 }}>{l.q}</td>
                <td className="text-sm">{l.title}</td>
                <td className="mono text-sm">{DECISIONS.find((d) => d.k === l.decision)?.l}</td>
                <td className="mono text-right" style={{ color: l.classificationScore >= 75 ? "var(--green)" : "var(--amber)" }}>{l.classificationScore}%</td>
                <td className="dim" style={{ fontSize: 12, maxWidth: 280 }}>{l.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
