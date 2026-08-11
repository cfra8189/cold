import React, { useState, useCallback } from "react";
import { STYLES } from "./styles/theme.js";
import { SHELL_CSS } from "./styles/shell.js";
import { COMPANIES } from "./data/companies.js";
import { INITIAL_STATE } from "./data/initialState.js";
import { SCORE_CATS, UNDERSTANDING_STAGES, stageFor } from "./data/learningStages.js";
import { CHECKS, LEARN_DECISIONS } from "./data/checks.js";
import { EVENTS } from "./data/simulationEvents.js";
import { usd, pct } from "./lib/format.js";
import { Bar } from "./components/primitives.jsx";

import { CommandCenter } from "./pages/CommandCenter.jsx";
import { CompanyPage } from "./pages/CompanyPage.jsx";
import { MoneyFlow } from "./pages/MoneyFlow.jsx";
import { Reports } from "./pages/Reports.jsx";
import { Simulation } from "./pages/Simulation.jsx";
import { Valuation } from "./pages/Valuation.jsx";
import { Dossier } from "./pages/Dossier.jsx";
import { ColdScore } from "./pages/ColdScore.jsx";
import { Portfolio } from "./pages/Portfolio.jsx";
import { LearnMode } from "./learn/LearnMode.jsx";
import { LiveCommandCenter } from "./live/pages/LiveCommandCenter.jsx";
import { LiveCompany } from "./live/pages/LiveCompany.jsx";
import { EnvironmentLabel } from "./components/EnvironmentLabel.jsx";

/* ============================================================================
   Shell, navigation and top-level mode switch (LEARN vs ANALYZE vs LIVE)
   ========================================================================== */

const NAV = [
  { id: "command", l: "Command Center", n: "Where you stand today" },
  { id: "company", l: "Company", n: "What you actually own" },
  { id: "flow", l: "Money Flow", n: "Tenants to your pocket" },
  { id: "reports", l: "Reports", n: "The statements, explained" },
  { id: "simulation", l: "Simulation", n: "Quarterly decisions" },
  { id: "valuation", l: "Valuation", n: "What it may be worth" },
  { id: "dossier", l: "Investment Dossier", n: "Your written thesis" },
  { id: "score", l: "Cold Score", n: "How well you know it" },
  { id: "portfolio", l: "Portfolio", n: "Positions and thesis health" },
];

export default function COLD() {
  const [state, setState] = useState(INITIAL_STATE);
  const [companyId, setCompanyId] = useState("FPT");
  const [page, setPage] = useState("command");
  const [mode, setMode] = useState("learn");
  const [liveTicker, setLiveTicker] = useState(null);
  const company = COMPANIES[companyId];
  const go = useCallback((p) => { setPage(p); if (typeof window !== "undefined") window.scrollTo(0, 0); }, []);
  const toAnalyze = useCallback((p) => { setMode("analyze"); setPage(p); if (typeof window !== "undefined") window.scrollTo(0, 0); }, []);

  const app = { state, setState, company, companyId, setCompanyId, go, page };
  const Page = {
    command: CommandCenter, company: CompanyPage, flow: MoneyFlow, reports: Reports,
    simulation: Simulation, valuation: Valuation, dossier: Dossier, score: ColdScore, portfolio: Portfolio,
  }[page];

  const avg = SCORE_CATS.reduce((s, c) => s + state.scores[c.k], 0) / SCORE_CATS.length;
  const nav = NAV.find((n) => n.id === page);
  const learn = mode === "learn";
  const isLive = mode === "live";
  const learnItems = [...CHECKS.map((c) => ({ id: c.id, l: c.name, n: c.question })), { id: "decision", l: "Decision", n: "Reject, watch, research or simulate" }];
  const learnNav = learnItems[Math.min(state.learnStep, learnItems.length - 1)];
  const setLearnStep = (n) => { setState((s) => ({ ...s, learnStep: n })); if (typeof window !== "undefined") window.scrollTo(0, 0); };

  const ModeSwitch = ({ compact }) => (
    <div style={{ display: "flex", gap: 1, background: "var(--line)", border: "1px solid var(--line-2)" }}>
      {[{ k: "learn", l: "LEARN" }, { k: "analyze", l: "ANALYZE" }, { k: "live", l: "LIVE" }].map((m) => {
        const on = mode === m.k;
        return (
          <button key={m.k} onClick={() => setMode(m.k)} className="mono"
            style={{ background: on ? "var(--green-wash)" : "var(--bg)", color: on ? "var(--green)" : "var(--dim)",
              border: "none", padding: compact ? "6px 12px" : "9px 18px", fontSize: compact ? 10 : 12,
              letterSpacing: ".18em", cursor: "pointer" }}>
            {m.l}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="cold-root">
      <style>{STYLES}{SHELL_CSS}</style>

      <div className="shell">
        {/* desktop sidebar */}
        <aside className="side">
          <div style={{ padding: "20px 16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div className="mono" style={{ fontSize: 20, letterSpacing: ".26em", color: "var(--tx)" }}>COLD</div>
            <div className="mono dimmer mt-1.5 mb-4" style={{ fontSize: 9, letterSpacing: ".14em", lineHeight: 1.5 }}>
              OWNERSHIP SIMULATOR
            </div>
            <ModeSwitch compact />
            <div className="mono dimmer mt-2" style={{ fontSize: 9, lineHeight: 1.5 }}>
              {learn ? "SIX CHECKS, PLAIN LANGUAGE" : isLive ? "REAL-COMPANY SNAPSHOTS" : "FULL RESEARCH TERMINAL"}
            </div>
          </div>

          {!isLive && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
              <div className="label mb-2">Studying</div>
              {Object.values(COMPANIES).map((c) => (
                <button key={c.id} onClick={() => { setCompanyId(c.id); }}
                  className="mono text-left"
                  style={{ display: "block", width: "100%", background: c.id === companyId ? "var(--green-wash)" : "transparent",
                    border: "1px solid " + (c.id === companyId ? "var(--green-dim)" : "var(--line)"), padding: "8px 10px",
                    marginBottom: 6, cursor: "pointer", color: c.id === companyId ? "var(--tx)" : "var(--dim)", fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{c.ticker}</span><span className="dimmer">{usd(c.price)}</span>
                  </div>
                  <div className="dimmer" style={{ fontSize: 9, marginTop: 3, whiteSpace: "normal", lineHeight: 1.4 }}>{c.name}</div>
                </button>
              ))}
            </div>
          )}

          <nav style={{ padding: "10px 0" }}>
            {learn
              ? learnItems.map((n, i) => (
                <div key={n.id} className={"nav-item " + (state.learnStep === i ? "active" : "")} onClick={() => setLearnStep(i)}
                  role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setLearnStep(i); }}>
                  <span className="mono" style={{ fontSize: 9, color: i < state.learnStep ? "var(--green)" : "var(--dimmer)" }}>
                    {i < state.learnStep ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{n.l}</span>
                </div>
              ))
              : isLive
              ? (
                <div className="nav-item active" onClick={() => setLiveTicker(null)}
                  role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setLiveTicker(null); }}>
                  <span className="mono dimmer" style={{ fontSize: 9 }}>01</span>
                  <span>Command Center</span>
                </div>
              )
              : NAV.map((n, i) => (
                <div key={n.id} className={"nav-item " + (page === n.id ? "active" : "")} onClick={() => go(n.id)}
                  role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") go(n.id); }}>
                  <span className="mono dimmer" style={{ fontSize: 9 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{n.l}</span>
                </div>
              ))}
          </nav>

          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--line)" }}>
            {learn ? (
              <>
                <div className="label mb-2">Six-check review</div>
                <div className="mono green" style={{ fontSize: 11 }}>
                  {Math.min(state.learnStep, 6)} of 6 complete
                </div>
                <div className="mt-3"><Bar pct={(Math.min(state.learnStep, 6) / 6) * 100} tone="green" h={3} /></div>
                <div className="mono dimmer mt-2" style={{ fontSize: 9, lineHeight: 1.5 }}>
                  {state.learnDecision ? "DECISION: " + LEARN_DECISIONS.find((d) => d.k === state.learnDecision).l.toUpperCase() : "NO DECISION RECORDED"}
                </div>
              </>
            ) : isLive ? (
              <>
                <div className="label mb-2">Environment</div>
                <EnvironmentLabel mode="live" className="mono amber" style={{ fontSize: 10, lineHeight: 1.6, display: "block" }} />
              </>
            ) : (
              <>
                <div className="label mb-2">Stage 1 of 4</div>
                <div className="mono green" style={{ fontSize: 11 }}>Guided Simulation</div>
                <div className="mt-3"><Bar pct={avg} tone={avg >= 70 ? "green" : "amber"} h={3} /></div>
                <div className="mono dimmer mt-2" style={{ fontSize: 9, lineHeight: 1.5 }}>
                  {UNDERSTANDING_STAGES[stageFor(avg)].toUpperCase()} {"·"} COMPOSITE {Math.round(avg)}
                </div>
              </>
            )}
          </div>
        </aside>

        <main style={{ minWidth: 0 }}>
          {/* mobile nav */}
          <div className="side-mobile">
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              <span className="mono" style={{ fontSize: 15, letterSpacing: ".22em" }}>COLD</span>
              {!isLive && <span className="mono dimmer" style={{ fontSize: 10 }}>{company.ticker} {usd(company.price)}</span>}
              <span style={{ marginLeft: "auto" }}><ModeSwitch compact /></span>
            </div>
            <div style={{ display: "flex", gap: 1, background: "var(--line)" }}>
              {learn
                ? learnItems.map((n, i) => (
                  <button key={n.id} onClick={() => setLearnStep(i)} className="mono"
                    style={{ background: state.learnStep === i ? "var(--panel-2)" : "var(--panel)", border: "none",
                      color: state.learnStep === i ? "var(--tx)" : "var(--dim)", padding: "10px 14px", fontSize: 11,
                      whiteSpace: "nowrap", cursor: "pointer", boxShadow: state.learnStep === i ? "inset 0 -2px 0 var(--green)" : "none" }}>
                    {n.l}
                  </button>
                ))
                : isLive
                ? (
                  <button className="mono" onClick={() => setLiveTicker(null)}
                    style={{ background: "var(--panel-2)", border: "none", color: "var(--tx)", padding: "10px 14px",
                      fontSize: 11, whiteSpace: "nowrap", cursor: "pointer", boxShadow: "inset 0 -2px 0 var(--green)" }}>
                    Command Center
                  </button>
                )
                : NAV.map((n) => (
                  <button key={n.id} onClick={() => go(n.id)} className="mono"
                    style={{ background: page === n.id ? "var(--panel-2)" : "var(--panel)", border: "none",
                      color: page === n.id ? "var(--tx)" : "var(--dim)", padding: "10px 14px", fontSize: 11,
                      whiteSpace: "nowrap", cursor: "pointer", boxShadow: page === n.id ? "inset 0 -2px 0 var(--green)" : "none" }}>
                    {n.l}
                  </button>
                ))}
            </div>
          </div>

          {/* header */}
          <header style={{ borderBottom: "1px solid var(--line)", padding: "18px 24px", display: "flex",
            alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow mb-1.5">
                {learn ? "Simplified mode · " + learnNav.n : isLive ? "LIVE · real-company snapshots" : nav?.n}
              </div>
              <h1 style={{ fontSize: 24, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {learn ? learnNav.l : isLive ? (liveTicker || "Command Center") : nav?.l}
              </h1>
              {isLive ? (
                <div className="mono dimmer mt-2" style={{ fontSize: 9, letterSpacing: ".1em" }}>
                  <EnvironmentLabel mode="live" />
                </div>
              ) : (
                <div className="mono dim mt-2" style={{ fontSize: 11 }}>
                  {company.name} {"·"} {company.ticker} {"·"} {company.kind}
                  <span className="dimmer" style={{ marginLeft: 10, fontSize: 9, letterSpacing: ".1em" }}>
                    <EnvironmentLabel mode={mode} />
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-6 flex-wrap items-end">
              {learn ? (
                <>
                  <div><div className="label mb-1">Check</div><div className="mono">{Math.min(state.learnStep + 1, 6)} of 6</div></div>
                  <div><div className="label mb-1">Reading so far</div><div className="mono amber">Caution on debt</div></div>
                </>
              ) : isLive ? null : (
                <>
                  <div><div className="label mb-1">Price</div><div className="mono">{usd(company.price)}</div></div>
                  <div><div className="label mb-1">Cash</div><div className="mono">{usd(state.cash, 0)}</div></div>
                  <div><div className="label mb-1">Quarter</div><div className="mono">{state.quarter < EVENTS.length ? EVENTS[state.quarter].q : "Complete"}</div></div>
                  <div><div className="label mb-1">Understanding</div><div className="mono green">{UNDERSTANDING_STAGES[stageFor(avg)]}</div></div>
                </>
              )}
              <div style={{ paddingBottom: 2 }}><ModeSwitch /></div>
            </div>
          </header>

          <div style={{ padding: "24px", maxWidth: 1440 }}>
            {learn ? (
              <LearnMode app={app} toAnalyze={toAnalyze} />
            ) : isLive ? (
              liveTicker ? (
                <LiveCompany ticker={liveTicker} onBack={() => setLiveTicker(null)} />
              ) : (
                <LiveCommandCenter onSelect={setLiveTicker} />
              )
            ) : (
              <Page app={app} />
            )}
            <footer style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
              {isLive ? (
                <p className="mono dimmer" style={{ fontSize: 10, lineHeight: 1.7, maxWidth: 720 }}>
                  <EnvironmentLabel mode="live" /> — Realty Income (O) and Berkshire Hathaway (BRK.B) figures above are
                  real, sourced snapshots captured from official filings and company reports. They are not investment
                  advice, no order placed in this interface reaches a market, and nothing here updates automatically
                  yet.
                </p>
              ) : (
                <p className="mono dimmer" style={{ fontSize: 10, lineHeight: 1.7, maxWidth: 720 }}>
                  <EnvironmentLabel mode={mode} />
                  <br />
                  COLD is an education mockup. All figures for Foundation Property Trust are fictional and all
                  Berkshire Hathaway figures are illustrative. Nothing here is investment advice, and no order placed in
                  this interface reaches a market.
                </p>
              )}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
