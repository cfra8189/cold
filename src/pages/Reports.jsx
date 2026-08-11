import React, { useState } from "react";
import { Panel, Chip, Bar, Tabs, Term } from "../components/primitives.jsx";
import { NotInStage1 } from "../components/NotInStage1.jsx";
import { PERIODS, INCOME, BALANCE, CASHFLOW, SUPPLEMENTAL, MATURITIES, EXPIRIES, RELATIONSHIPS } from "../data/reports.js";
import { pct, mm, x, signed, usd } from "../lib/format.js";

export function Reports({ app }) {
  const [view, setView] = useState("beginner");
  const [stmt, setStmt] = useState("income");
  const rows = { income: INCOME, balance: BALANCE, cash: CASHFLOW, supp: SUPPLEMENTAL }[stmt];

  if (app.company.id !== "FPT") return <NotInStage1 company={app.company} what="Reports" />;

  return (
    <div className="space-y-5">
      <Panel title="Report viewer" right={<Chip>{PERIODS[0] + " · unaudited"}</Chip>}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <Tabs value={stmt} onChange={setStmt} options={[
            { v: "income", l: "Income statement" }, { v: "balance", l: "Balance sheet" },
            { v: "cash", l: "Cash flow" }, { v: "supp", l: "REIT supplemental" }, { v: "mgmt", l: "Management commentary" },
          ]} />
          <Tabs size="sm" value={view} onChange={setView} options={[
            { v: "beginner", l: "Beginner view" }, { v: "analyst", l: "Analyst view" }, { v: "original", l: "Original report" },
          ]} />
        </div>
        <p className="dim text-sm mt-4" style={{ lineHeight: 1.6, maxWidth: 720 }}>
          {view === "beginner" && "Every important line is explained beneath it, in plain language, with the reason it matters to an owner."}
          {view === "analyst" && "Quarter-over-quarter and year-over-year changes, without explanations. This is how you will read Stage 2."}
          {view === "original" && "The statement as filed: no colour, no commentary, no ordering help. Learn to find the same numbers here."}
        </p>
      </Panel>

      {stmt === "mgmt" ? <Commentary view={view} /> : <StatementTable rows={rows} view={view} stmt={stmt} />}

      {stmt === "supp" && view !== "original" && (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          <Panel title="Debt maturity schedule" right={<Chip tone="amber">2027 is the problem</Chip>}>
            {MATURITIES.map((m) => (
              <div key={m.yr} className="mb-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="mono text-sm">{m.yr}</span>
                  <span className="mono text-sm">${m.amt}M <span className="dimmer">at {pct(m.rate)}</span></span>
                </div>
                <Bar pct={(m.amt / 390) * 100} tone={m.yr === "2027" ? "amber" : "neutral"} h={4} />
              </div>
            ))}
            <div className="rowline pt-4 mono dim" style={{ fontSize: 11, lineHeight: 1.6 }}>
              Refinancing $180M from 3.4% to 6.4% adds $5.4M of annual interest. Against $71.4M of trailing AFFO that is
              7.6% of owner cash, or $0.086 per share.
            </div>
          </Panel>
          <Panel title="Lease expiration schedule">
            {EXPIRIES.map((m) => (
              <div key={m.yr} className="mb-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="mono text-sm">{m.yr}</span><span className="mono text-sm">{pct(m.pct)} of rent</span>
                </div>
                <Bar pct={(m.pct / 62.3) * 100} tone={m.yr === "2027" ? "amber" : "neutral"} h={4} />
              </div>
            ))}
            <div className="rowline pt-4 mono dim" style={{ fontSize: 11, lineHeight: 1.6 }}>
              2027 carries both the debt maturity and 12.8% of rent, including Cardinal Logistics. Two risks landing in
              one year is a concentration even when neither is large alone.
            </div>
          </Panel>
        </div>
      )}

      {view !== "original" && (
        <Panel title="How the statements connect">
          <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
            {RELATIONSHIPS.map((r, i) => (
              <div key={i} style={{ background: "var(--panel)", padding: 16 }}>
                <div className="mono mb-3" style={{ fontSize: 10, letterSpacing: ".1em", color: "var(--green)" }}>
                  {r.a.toUpperCase()} <span className="dimmer">{"→"}</span> {r.b.toUpperCase()}
                </div>
                <p className="text-sm dim" style={{ lineHeight: 1.65 }}>{r.t}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function StatementTable({ rows, view, stmt }) {
  const original = view === "original";
  const fmt = (r, i) => {
    if (r.ps) return usd(Math.abs(r.v[i]), 3);
    if (r.unit === "%") return pct(r.v[i]);
    if (r.unit === "x") return x(r.v[i]);
    if (r.unit === " yrs") return r.v[i].toFixed(1) + " yrs";
    return mm(r.v[i]);
  };
  const chg = (r, i) => {
    const a = r.v[0], b = r.v[i];
    if (r.unit === "%" || r.unit === "x" || r.unit === " yrs") return signed(a - b, 1) + (r.unit === "%" ? " pts" : "");
    if (b === 0) return "—";
    return signed(((a - b) / Math.abs(b)) * 100, 1) + "%";
  };
  return (
    <Panel title={original ? "Foundation Property Trust — condensed consolidated statements (unaudited)" : "Statement"} pad={false}>
      <div className="scrollx">
        <table className="fin" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 240 }}>{original ? "(in millions, except per-share amounts)" : "Line"}</th>
              {PERIODS.map((p) => <th key={p}>{p}</th>)}
              {view === "analyst" && <><th>QoQ</th><th>YoY</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <React.Fragment key={r.l}>
                <tr>
                  <td style={{ fontWeight: r.bold && !original ? 500 : 400, color: r.bold ? "var(--tx)" : original ? "var(--tx)" : "var(--dim)" }}>
                    {r.term && !original ? <Term k={r.term}>{r.l}</Term> : r.l}
                  </td>
                  {r.v.map((val, i) => (
                    <td key={i} className="mono" style={{ textAlign: "right", color: original || i > 0 ? "var(--dim)" : r.bold ? "var(--tx)" : "var(--tx)", fontWeight: r.bold ? 500 : 400 }}>
                      {fmt(r, i)}
                    </td>
                  ))}
                  {view === "analyst" && (
                    <>
                      <td className="mono" style={{ textAlign: "right", color: "var(--dim)" }}>{chg(r, 1)}</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--dim)" }}>{chg(r, 2)}</td>
                    </>
                  )}
                </tr>
                {view === "beginner" && r.b && (
                  <tr>
                    <td colSpan={4} style={{ paddingTop: 0, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                      <div className="mono" style={{ fontSize: 11, lineHeight: 1.6, color: "var(--dimmer)", maxWidth: 720 }}>
                        <span className="green" style={{ marginRight: 8 }}>{"└"}</span>{r.b}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {original && (
        <div className="p-4 mono dimmer" style={{ fontSize: 10, lineHeight: 1.7, borderTop: "1px solid var(--line)" }}>
          The accompanying notes are an integral part of these condensed consolidated financial statements. Amounts in
          millions except per-share data. Prepared in accordance with generally accepted accounting principles.
          {stmt === "supp" && " Supplemental measures are not GAAP measures and may not be comparable to those of other issuers."}
        </div>
      )}
    </Panel>
  );
}

function Commentary({ view }) {
  const paras = [
    { t: "Portfolio performance", p: "Same-property net operating income increased 3.1% over the prior-year quarter, driven by contractual rent escalators averaging 2.5% and renewal spreads of 8.4% on 640,000 square feet. Occupancy ended the quarter at 96.2%.", b: "Growth came from existing buildings and contracted increases, not from buying new ones. That is the higher-quality kind of growth." },
    { t: "Capital structure", p: "The trust ended the quarter with $918.0M of total debt at a weighted average rate of 4.50% and a weighted average maturity of 5.2 years. $180.0M of unsecured notes bearing 3.40% mature in 2027. Comparable issuance is currently pricing near 6.40%.", b: "Read this as management telling you in advance that $5.4M of annual interest is coming. It is disclosed, dated, and quantifiable. Very few risks are this legible." },
    { t: "Portfolio strategy", p: "The trust completed $16.9M of acquisitions during the quarter and continues to evaluate selective dispositions within the suburban office segment, which represented 23% of annualised base rent at quarter end.", b: "Management is quietly shrinking the weakest segment. Track this number every quarter: if office stays at 23%, the strategy is stated but not executed." },
    { t: "Distributions", p: "The Board declared a quarterly distribution of $0.235 per share, representing 79.9% of quarterly AFFO. The trust has funded its distribution from operating cash flow in each of the last twenty quarters.", b: "The claim is checkable. Cash from operations was $23.7M and dividends paid were $14.7M, so this quarter it is true." },
  ];
  return (
    <Panel title={"Management commentary — Q3 2026"}>
      <div className="space-y-6" style={{ maxWidth: 760 }}>
        {paras.map((s) => (
          <div key={s.t}>
            <div className="eyebrow mb-2">{s.t}</div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: view === "original" ? "var(--dim)" : "var(--tx)" }}>{s.p}</p>
            {view === "beginner" && (
              <div className="mt-3 p-3" style={{ background: "var(--sunken)", borderLeft: "2px solid var(--green)" }}>
                <span className="label" style={{ marginRight: 8 }}>What to take from it</span>
                <span className="text-sm dim" style={{ lineHeight: 1.65 }}>{s.b}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
