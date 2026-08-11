import React from "react";
import { Panel, Stat, Chip, Bar, Term } from "../components/primitives.jsx";
import { StageStrip } from "../components/StageStrip.jsx";
import { COMPANIES } from "../data/companies.js";
import { EIGHT_QUESTIONS } from "../data/learningStages.js";
import { usd, pct, signed } from "../lib/format.js";

export function CommandCenter({ app }) {
  const { state, setState, company, go } = app;
  const pos = state.positions[company.id];
  const answered = Object.values(state.understanding).filter(Boolean).length;
  const portfolioValue =
    state.cash +
    Object.entries(state.positions).reduce((s, [id, p]) => s + p.shares * COMPANIES[id].price, 0);
  const est = company.id === "FPT" ? 20.64 : 498.0;
  const gap = ((est - company.price) / est) * 100;

  const toggleQ = (id) =>
    setState((s) => ({ ...s, understanding: { ...s.understanding, [id]: !s.understanding[id] } }));

  return (
    <div className="space-y-5">
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <Panel title="Simulated portfolio">
          <div className="grid grid-cols-2 gap-5">
            <Stat label="Total value" value={usd(portfolioValue, 0)} sub={"Started at $100,000"} />
            <Stat label="Available cash" value={usd(state.cash, 0)} sub={pct((state.cash / portfolioValue) * 100) + " of portfolio"} />
          </div>
          <div className="rowline mt-4 pt-4 grid grid-cols-2 gap-5">
            <Stat size="md" label="Position" value={pos ? pos.shares.toLocaleString() + " sh" : "None"} sub={pos ? "Cost " + usd(pos.cost) + " / share" : "No shares held"} />
            <Stat size="md" label="Ownership" value={pos ? ((pos.shares / (company.shares * 1e6)) * 100).toFixed(4) + "%" : "0.0000%"} sub={pos ? "of " + company.shares + "M shares" : "—"} />
          </div>
        </Panel>

        <Panel title="Price and value">
          <div className="grid grid-cols-2 gap-5">
            <Stat label="Market price" value={usd(company.price)} sub={signed(company.priceChangePct) + "% today"} />
            <Stat label="Your estimated value" value={usd(est)} sub="Base case, valuation workbench" tone="green" />
          </div>
          <div className="rowline mt-4 pt-4">
            <div className="label mb-2">Price against estimate</div>
            <Bar pct={Math.min(100, (company.price / est) * 100)} tone={gap > 15 ? "green" : gap > -5 ? "amber" : "red"} />
            <div className="mono text-xs dim mt-2">
              Price sits {pct(Math.abs(gap))} {gap > 0 ? "below" : "above"} the base estimate. That is a {pct(Math.abs(gap))}{" "}
              <Term k="margin of safety">margin of safety</Term>.
            </div>
          </div>
        </Panel>

        <Panel title="Income and understanding">
          <div className="grid grid-cols-2 gap-5">
            <Stat label="Dividends received" value={usd(pos ? pos.dividends : 0)} sub={pos ? "1 quarter at $0.235 / share" : "No income yet"} />
            <Stat label="Forward income" value={usd(pos ? pos.shares * company.divPerShare : 0)} sub="Next 12 months at current rate" />
          </div>
          <div className="rowline mt-4 pt-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="label">Cold understanding</span>
              <span className="mono text-sm">{answered} / 8</span>
            </div>
            <Bar pct={(answered / 8) * 100} tone={answered >= 7 ? "green" : answered >= 4 ? "amber" : "red"} />
            <div className="mono dimmer mt-2" style={{ fontSize: 10 }}>Stage: Guided Simulation</div>
          </div>
        </Panel>
      </div>

      {/* Signature panel: the eight questions */}
      <Panel
        title="Cold understanding check"
        right={<Chip tone={answered >= 7 ? "green" : "amber"}>{answered} of 8 answered</Chip>}
      >
        <h2 style={{ fontSize: 22, lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Can you explain this investment without looking at your notes?
        </h2>
        <p className="dim text-sm mb-5" style={{ maxWidth: 640, lineHeight: 1.6 }}>
          Mark a question only when you can answer it out loud, with numbers, and without opening a report. This is the
          only progress measure in COLD that matters.
        </p>
        <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
          {EIGHT_QUESTIONS.map((q, i) => {
            const on = state.understanding[q.id];
            return (
              <button key={q.id} onClick={() => toggleQ(q.id)}
                className="text-left"
                style={{ background: on ? "var(--green-wash)" : "var(--panel)", border: "none", padding: "14px 16px", cursor: "pointer", display: "block" }}>
                <div className="flex items-start gap-3">
                  <span className="mono" style={{ fontSize: 10, color: on ? "var(--green)" : "var(--dimmer)", marginTop: 3 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "var(--tx)" }}>{q.q}</div>
                    <div className="mono dim mt-1.5" style={{ fontSize: 11, lineHeight: 1.5 }}>{q.hint}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: on ? "var(--green)" : "var(--dimmer)" }}>
                    {on ? "KNOWN" : "OPEN"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <Panel title={company.latestEvent ? "Latest quarterly event — " + company.latestEvent.q : "Latest quarterly event"}
          right={<Chip tone={company.latestEvent ? "amber" : "neutral"}>{company.latestEvent ? "Unreviewed" : "Not tracked yet"}</Chip>}>
          {company.latestEvent ? (
            <>
              <div style={{ fontSize: 15, marginBottom: 8 }}>{company.latestEvent.headline}</div>
              <p className="dim text-sm" style={{ lineHeight: 1.65 }}>{company.latestEvent.body}</p>
              <div className="rowline mt-4 pt-4 flex flex-wrap gap-2">
                <button className="btn" onClick={() => go("reports")}>Open the reports</button>
                <button className="btn" onClick={() => go("simulation")}>Go to this quarter's decision</button>
              </div>
            </>
          ) : (
            <div className="py-6">
              <p className="dim text-sm" style={{ lineHeight: 1.7 }}>
                No quarter has been opened for {company.name}. COLD keeps one company in front of you at a time, and
                Foundation Property Trust is the active study.
              </p>
              <button className="btn mt-4" onClick={() => go("company")}>Read the business summary</button>
            </div>
          )}
        </Panel>

        <Panel title="Primary next action">
          <div className="mono green" style={{ fontSize: 11, letterSpacing: ".12em", marginBottom: 10 }}>DO THIS NEXT</div>
          <div style={{ fontSize: 17, lineHeight: 1.4, marginBottom: 10 }}>
            Finish the Investment Dossier before you buy another share.
          </div>
          <p className="dim text-sm mb-4" style={{ lineHeight: 1.65 }}>
            Nine essential fields are still empty, including your sell conditions and your bear case. COLD will not
            process a simulated purchase until those are written down.
          </p>
          <button className="btn btn-primary" onClick={() => go("dossier")}>Open the dossier</button>
        </Panel>
      </div>

      <StageStrip />
    </div>
  );
}
