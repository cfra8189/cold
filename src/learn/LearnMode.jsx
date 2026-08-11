import React from "react";
import { Panel, Chip } from "../components/primitives.jsx";
import { NotInStage1 } from "../components/NotInStage1.jsx";
import { CHECKS, LEARN_DECISIONS } from "../data/checks.js";

/* ============================================================================
   LEARN mode — the six-check ownership review.

   This is a simplified, guided review deliberately limited to equity REIT
   analysis (Foundation Property Trust). It must never be shown for
   Berkshire Hathaway or any non-REIT company — see NotInStage1 below.
   ========================================================================== */

function RangeMeter({ check }) {
  const { scale, bands, value } = check;
  const span = scale.max - scale.min;
  const posOf = (n) => Math.max(0, Math.min(100, ((n - scale.min) / span) * 100));
  const col = (t) => (t === "green" ? "var(--green-dim)" : t === "amber" ? "#3F3116" : "#3C1E1B");
  const txt = (t) => (t === "green" ? "var(--green)" : t === "amber" ? "var(--amber)" : "var(--red)");
  let prev = scale.min;
  const segs = bands.map((b) => { const seg = { ...b, from: prev }; prev = b.to; return seg; });
  return (
    <div style={{ position: "relative", paddingTop: 26, paddingBottom: 22 }}>
      <div style={{ display: "flex", height: 12 }}>
        {segs.map((b) => (
          <div key={b.l} style={{ width: (posOf(b.to) - posOf(b.from)) + "%", background: col(b.tone), position: "relative" }}>
            <span className="mono" style={{ position: "absolute", top: 16, left: 0, fontSize: 9, letterSpacing: ".1em", color: txt(b.tone), textTransform: "uppercase" }}>
              {b.l}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 0, left: posOf(value) + "%", transform: "translateX(-50%)", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 11, whiteSpace: "nowrap", marginBottom: 3, color: "var(--tx)" }}>{check.display}</div>
        <div style={{ width: 2, height: 22, background: "var(--tx)", margin: "0 auto" }} />
      </div>
    </div>
  );
}

export function LearnMode({ app, toAnalyze }) {
  const { state, setState, company } = app;
  const step = state.learnStep;
  const setStep = (n) => { setState((s) => ({ ...s, learnStep: n })); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  if (company.id !== "FPT") return <NotInStage1 company={company} what="Simplified mode" />;

  const isDecision = step >= CHECKS.length;
  const c = CHECKS[Math.min(step, CHECKS.length - 1)];
  const toneOf = (r) => (r === "Healthy" ? "green" : r === "Caution" ? "amber" : "red");

  return (
    <div className="space-y-5">
      {/* progress rail */}
      <div className="flex flex-wrap" style={{ gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
        {[...CHECKS, { id: "decision", name: "Decision" }].map((k, i) => {
          const on = i === step, done = i < step;
          return (
            <button key={k.id} onClick={() => setStep(i)} className="mono"
              style={{ flex: "1 1 120px", background: on ? "var(--green-wash)" : "var(--panel)", border: "none",
                padding: "12px 10px", cursor: "pointer", textAlign: "left",
                boxShadow: on ? "inset 0 -2px 0 var(--green)" : "none" }}>
              <div style={{ fontSize: 9, letterSpacing: ".12em", color: done ? "var(--green)" : on ? "var(--green)" : "var(--dimmer)" }}>
                {done ? "✓ " : ""}{String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, color: on ? "var(--tx)" : done ? "var(--dim)" : "var(--dimmer)" }}>{k.name}</div>
            </button>
          );
        })}
      </div>

      {!isDecision ? (
        <>
          <Panel title={"Check " + (step + 1) + " of 6 — " + c.name} right={<Chip tone={toneOf(c.reading)}>{c.reading}</Chip>}>
            <div className="split-a">
              <div>
                <h2 style={{ fontSize: 24, lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: 14, maxWidth: 560 }}>
                  {c.question}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--tx)", maxWidth: 620 }}>{c.plainAnswer}</p>

                <div className="mt-7">
                  <div className="label mb-2">{c.metricLabel}</div>
                  <div className="mono" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "-0.03em", color: toneOf(c.reading) === "green" ? "var(--green)" : toneOf(c.reading) === "amber" ? "var(--amber)" : "var(--red)" }}>
                    {c.display}
                  </div>
                  <RangeMeter check={c} />
                  <div className="sunken" style={{ padding: 12, marginTop: 4 }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="label mb-1">Range applies to</div>
                        <div className="mono" style={{ fontSize: 11 }}>{c.scope}</div>
                      </div>
                      <Chip tone="amber">Screening guide</Chip>
                    </div>
                    <div className="label mt-3 mb-1">Compare with</div>
                    <p className="mono dim" style={{ fontSize: 10, lineHeight: 1.6 }}>{c.compareWith}</p>
                    <p className="mono dimmer mt-2" style={{ fontSize: 9, lineHeight: 1.6 }}>
                      This band organizes attention. It does not produce a buy, sell or safety conclusion by itself.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4" style={{ background: "var(--sunken)", borderLeft: "2px solid " + (toneOf(c.reading) === "green" ? "var(--green)" : toneOf(c.reading) === "amber" ? "var(--amber)" : "var(--red)") }}>
                  <div className="eyebrow mb-2">What this means</div>
                  <p className="text-sm" style={{ lineHeight: 1.7 }}>{c.interpretation}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="sunken" style={{ padding: 16 }}>
                  <div className="label mb-3">Why it matters</div>
                  <p className="text-sm dim" style={{ lineHeight: 1.7 }}>{c.why}</p>
                </div>
                <div className="sunken" style={{ padding: 16 }}>
                  <div className="label mb-3">Do this one thing</div>
                  <p className="text-sm" style={{ lineHeight: 1.7 }}>{c.action}</p>
                  <button className="btn mt-4" style={{ width: "100%" }} onClick={() => toAnalyze(c.verify.page)}>
                    {c.verify.l}
                  </button>
                  <div className="mono dimmer mt-2" style={{ fontSize: 10, lineHeight: 1.5 }}>
                    Opens Analytical Mode. You can come back to this check.
                  </div>
                </div>
                <div className="sunken" style={{ padding: 16 }}>
                  <div className="label mb-3">The numbers behind it</div>
                  {c.supporting.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between py-2" style={{ borderBottom: "1px solid var(--line)" }}>
                      <span className="text-sm dim">{k}</span><span className="mono text-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex justify-between gap-3 flex-wrap">
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {step === CHECKS.length - 1 ? "See the conclusion" : "Next check: " + CHECKS[step + 1].name}
            </button>
          </div>
        </>
      ) : (
        <DecisionStep app={app} toAnalyze={toAnalyze} setStep={setStep} />
      )}
    </div>
  );
}

function DecisionStep({ app, toAnalyze, setStep }) {
  const { state, setState } = app;
  const chosen = state.learnDecision;
  const pick = (k) => setState((s) => ({ ...s, learnDecision: k, learnComplete: true }));
  const chosenObj = LEARN_DECISIONS.find((d) => d.k === chosen);
  const lines = [
    ["Business", "Understandable", "green"],
    ["Operations", "Healthy", "green"],
    ["Dividend", "Covered, but limited room", "amber"],
    ["Debt", "Caution", "amber"],
    ["Primary risk", "2027 refinancing", "amber"],
  ];

  return (
    <>
      <Panel title="Check 6 of 6 — Decision" right={<Chip tone={chosen ? "green" : "amber"}>{chosen ? "Recorded" : "Open"}</Chip>}>
        <div className="split-a">
          <div>
            <h2 style={{ fontSize: 24, lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Reject, watch, research further, or simulate ownership?
            </h2>
            <p className="dim text-sm mb-6" style={{ lineHeight: 1.7, maxWidth: 580 }}>
              Five checks are done. Nothing here tells you to buy. It tells you how much attention this company has
              earned, and that is the only decision the simplified review is designed to produce.
            </p>
            <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
              {LEARN_DECISIONS.map((d) => {
                const on = chosen === d.k;
                return (
                  <button key={d.k} onClick={() => pick(d.k)} className="text-left"
                    style={{ background: on ? "var(--green-wash)" : "var(--panel)", border: "none", padding: 16, cursor: "pointer" }}>
                    <div style={{ fontSize: 15, color: "var(--tx)", marginBottom: 5 }}>{d.l}</div>
                    <div className="mono dimmer" style={{ fontSize: 11, lineHeight: 1.5 }}>{d.d}</div>
                    {on && <div className="mono green mt-3" style={{ fontSize: 10, letterSpacing: ".1em" }}>SELECTED</div>}
                  </button>
                );
              })}
            </div>
            {chosenObj && (
              <div className="mt-4 p-4" style={{ background: "var(--sunken)", borderLeft: "2px solid var(--green)" }}>
                <div className="eyebrow mb-2">On that choice</div>
                <p className="text-sm" style={{ lineHeight: 1.7 }}>{chosenObj.after}</p>
              </div>
            )}
          </div>

          <div className="panel" style={{ padding: 18, alignSelf: "start" }}>
            <div className="eyebrow mb-4">Conclusion</div>
            {lines.map(([k, v, tone]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
                <span className="label" style={{ whiteSpace: "nowrap" }}>{k}</span>
                <span className="mono" style={{ fontSize: 12, textAlign: "right", color: tone === "green" ? "var(--green)" : "var(--amber)" }}>{v}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 pt-3">
              <span className="label">Next step</span>
              <span className="mono" style={{ fontSize: 12, textAlign: "right", color: "var(--tx)" }}>
                {chosenObj ? chosenObj.l : "Continue researching"}
              </span>
            </div>
            <button className="btn btn-primary mt-5" style={{ width: "100%" }} onClick={() => toAnalyze("reports")}>
              Verify this in Analytical Mode
            </button>
            <div className="mono dimmer mt-3" style={{ fontSize: 10, lineHeight: 1.6 }}>
              Every figure above came from a statement you can open. The point of the next mode is to prove it rather
              than accept it.
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Where this sits in the progression">
        <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
          {[
            { n: "Simplified Mode", d: "Learn the six checks", state: "done" },
            { n: "Guided Simulation", d: "Practise decisions against real events", state: "next" },
            { n: "Analytical Mode", d: "Investigate independently", state: "open" },
            { n: "Real Company Dossier", d: "Document your judgment", state: "open" },
          ].map((s, i) => (
            <div key={s.n} style={{ background: s.state === "done" ? "var(--green-wash)" : "var(--panel)", padding: 16 }}>
              <div className="mono mb-2" style={{ fontSize: 9, letterSpacing: ".12em", color: s.state === "done" ? "var(--green)" : "var(--dimmer)" }}>
                {s.state === "done" ? "✓ COMPLETE" : "STEP " + (i + 1)}
              </div>
              <div style={{ fontSize: 14, marginBottom: 5 }}>{s.n}</div>
              <div className="mono dimmer" style={{ fontSize: 11, lineHeight: 1.55 }}>{s.d}</div>
            </div>
          ))}
        </div>
        <div className="rowline mt-5 pt-4 flex flex-wrap gap-3">
          <button className="btn" onClick={() => setStep(0)}>Run the six checks again</button>
          <button className="btn" onClick={() => toAnalyze("simulation")}>Practise decisions in Guided Simulation</button>
          <button className="btn btn-primary" onClick={() => toAnalyze("command")}>Open Analytical Mode</button>
        </div>
      </Panel>
    </>
  );
}
