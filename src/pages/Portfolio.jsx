import React, { useState } from "react";
import { Panel, Stat, Chip, Slider } from "../components/primitives.jsx";
import { StageStrip } from "../components/StageStrip.jsx";
import { COMPANIES } from "../data/companies.js";
import { SCORE_CATS, THESIS_STATES } from "../data/learningStages.js";
import { dossierStats } from "../lib/dossier.js";
import { usd, pct, signed } from "../lib/format.js";

const THESIS_CHECKS = [
  { c: "Dividend covered by AFFO", now: "1.22x coverage", ok: true },
  { c: "Occupancy at or above 94%", now: "96.2%", ok: true },
  { c: "Net debt to EBITDA below 7.0x", now: "6.6x", ok: true },
  { c: "Office below 25% of rent", now: "23.0%", ok: true },
  { c: "Payout ratio below 85%", now: "82.4% and rising", ok: false },
  { c: "2027 maturity refinanced or pre-funded", now: "Not yet addressed", ok: false },
];

export function Portfolio({ app }) {
  const { state, setState, company, go, setCompanyId } = app;
  const [ticketShares, setTicketShares] = useState(200);
  const [msg, setMsg] = useState(null);

  const holdings = Object.entries(state.positions).map(([id, p]) => {
    const c = COMPANIES[id];
    const value = p.shares * c.price;
    const cost = p.shares * p.cost;
    const est = id === "FPT" ? 20.64 : 498.0;
    return { id, c, p, value, cost, est, totalReturn: value - cost + p.dividends, estValue: p.shares * est };
  });
  const invested = holdings.reduce((s, h) => s + h.value, 0);
  const total = invested + state.cash;
  const dstats = dossierStats(state.dossiers[company.id]);
  const canTrade = dstats.ready;
  const price = company.price;
  const cost = ticketShares * price;

  const buy = () => {
    if (!canTrade || cost > state.cash) return;
    setState((s) => {
      const cur = s.positions[company.id];
      const shares = (cur?.shares || 0) + ticketShares;
      const newCost = ((cur?.shares || 0) * (cur?.cost || 0) + ticketShares * price) / shares;
      return {
        ...s, cash: s.cash - cost,
        positions: { ...s.positions, [company.id]: { shares, cost: newCost, dividends: cur?.dividends || 0, thesis: cur?.thesis || "Intact", opened: cur?.opened || "Today" } },
      };
    });
    setMsg("Simulated purchase of " + ticketShares + " shares recorded at " + usd(price) + ".");
  };
  const sell = () => {
    const cur = state.positions[company.id];
    if (!cur || cur.shares < ticketShares) return;
    setState((s) => {
      const shares = s.positions[company.id].shares - ticketShares;
      const positions = { ...s.positions };
      if (shares <= 0) delete positions[company.id]; else positions[company.id] = { ...positions[company.id], shares };
      return { ...s, cash: s.cash + ticketShares * price, positions };
    });
    setMsg("Simulated sale of " + ticketShares + " shares recorded at " + usd(price) + ".");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
        <Panel title="Portfolio value"><Stat label="Total" value={usd(total, 0)} sub={signed(((total - 100000) / 100000) * 100, 2) + "% since opening"} /></Panel>
        <Panel title="Cash"><Stat label="Available" value={usd(state.cash, 0)} sub={pct((state.cash / total) * 100) + " uninvested"} /></Panel>
        <Panel title="Invested"><Stat label="At market" value={usd(invested, 0)} sub={holdings.length + " position" + (holdings.length === 1 ? "" : "s")} /></Panel>
        <Panel title="Income received"><Stat label="Dividends" value={usd(holdings.reduce((s, h) => s + h.p.dividends, 0), 0)} tone="green" sub="Cash the businesses paid you" /></Panel>
      </div>

      <Panel title="Positions" pad={false}>
        {holdings.length === 0 ? (
          <div className="py-14 text-center">
            <div className="eyebrow mb-3">No positions</div>
            <p className="dim text-sm" style={{ maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
              Complete an Investment Dossier, then place a simulated order below. COLD will not record a purchase
              without a written thesis.
            </p>
          </div>
        ) : (
          <div className="scrollx">
            <table className="fin" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Investment</th><th>Thesis</th><th>Cold score</th><th>Shares</th>
                  <th>Cost basis</th><th>Market value</th><th>Your estimate</th><th>Income</th><th>Total return</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const cs = Math.round(SCORE_CATS.reduce((s, c) => s + state.scores[c.k], 0) / SCORE_CATS.length);
                  const th = THESIS_STATES[h.p.thesis];
                  return (
                    <tr key={h.id} style={{ cursor: "pointer" }} onClick={() => { setCompanyId(h.id); go("company"); }}>
                      <td>
                        <div style={{ fontSize: 14 }}>{h.c.name}</div>
                        <div className="mono dimmer" style={{ fontSize: 10, marginTop: 3 }}>
                          {h.c.ticker} {"·"} {((h.p.shares / (h.c.shares * 1e6)) * 100).toFixed(4)}% owned {"·"} opened {h.p.opened}
                        </div>
                      </td>
                      <td><Chip tone={th.tone}>{h.p.thesis}</Chip></td>
                      <td className="mono text-right">{cs}</td>
                      <td className="mono text-right">{h.p.shares.toLocaleString()}</td>
                      <td className="mono text-right dim">{usd(h.p.cost)}</td>
                      <td className="mono text-right">{usd(h.value, 0)}<div className="dimmer" style={{ fontSize: 10 }}>{usd(h.c.price)} / sh</div></td>
                      <td className="mono text-right green">{usd(h.estValue, 0)}<div className="dimmer" style={{ fontSize: 10 }}>{usd(h.est)} / sh</div></td>
                      <td className="mono text-right">{usd(h.p.dividends, 0)}</td>
                      <td className="mono text-right" style={{ color: h.totalReturn >= 0 ? "var(--green)" : "var(--red)" }}>
                        {(h.totalReturn >= 0 ? "+" : "") + usd(h.totalReturn, 0)}
                        <div className="dimmer" style={{ fontSize: 10 }}>{signed((h.totalReturn / h.cost) * 100, 2)}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 mono dimmer" style={{ fontSize: 11, lineHeight: 1.65, borderTop: "1px solid var(--line)" }}>
          Thesis health, income and your own estimate are placed ahead of price movement deliberately. Daily price
          change is not shown anywhere in this table.
        </div>
      </Panel>

      <div className="split-a">
        <Panel title={"Thesis monitor — " + company.name} right={<Chip tone={THESIS_STATES[state.positions[company.id]?.thesis || "Intact"].tone}>{state.positions[company.id]?.thesis || "Not held"}</Chip>}>
          <p className="dim text-sm mb-5" style={{ lineHeight: 1.65, maxWidth: 640 }}>
            Each line is a condition you wrote down before buying. COLD checks the business against your own words
            rather than against the share price.
          </p>
          {!state.positions[company.id] && (
            <div className="p-4 mb-4" style={{ background: "var(--sunken)", border: "1px solid var(--line)" }}>
              <div className="eyebrow mb-2">No thesis recorded</div>
              <p className="text-sm dim" style={{ lineHeight: 1.65 }}>
                You do not hold {company.name}, so there is nothing to monitor yet. The conditions below are the ones
                filed for Foundation Property Trust.
              </p>
            </div>
          )}
          <div style={{ display: "grid", gap: 1, background: "var(--line)", border: "1px solid var(--line)", opacity: state.positions[company.id] ? 1 : 0.55 }}>
            {THESIS_CHECKS.map((t) => (
              <div key={t.c} style={{ background: "var(--panel)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 12, color: t.ok ? "var(--green)" : "var(--amber)", width: 14 }}>{t.ok ? "✓" : "!"}</span>
                <span style={{ flex: "1 1 220px", fontSize: 14 }}>{t.c}</span>
                <span className="mono" style={{ fontSize: 12, color: t.ok ? "var(--dim)" : "var(--amber)" }}>{t.now}</span>
              </div>
            ))}
          </div>
          <div className="rowline mt-5 pt-4">
            <div className="label mb-3">Status ladder</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(THESIS_STATES).map(([k, v]) => {
                const active = (state.positions[company.id]?.thesis || "") === k;
                return (
                  <button key={k} className="btn" style={{ borderColor: active ? "var(--green)" : "var(--line-2)", opacity: state.positions[company.id] ? 1 : 0.5 }}
                    disabled={!state.positions[company.id]}
                    onClick={() => setState((s) => ({ ...s, positions: { ...s.positions, [company.id]: { ...s.positions[company.id], thesis: k } } }))}>
                    {k}
                  </button>
                );
              })}
            </div>
            <div className="mono dimmer mt-3" style={{ fontSize: 11, lineHeight: 1.6 }}>
              {THESIS_STATES[state.positions[company.id]?.thesis || "Watch"].d} Two conditions are drifting: the payout
              ratio and the unaddressed 2027 maturity. Neither breaks the thesis yet.
            </div>
          </div>
        </Panel>

        <Panel title="Simulated order" right={<Chip tone={canTrade ? "green" : "amber"}>{canTrade ? "Unlocked" : "Locked"}</Chip>}>
          {!canTrade ? (
            <div>
              <div className="p-4 mb-4" style={{ background: "var(--amber-wash)", border: "1px solid #3A2E17" }}>
                <div className="eyebrow amber mb-2">Dossier incomplete</div>
                <p className="text-sm dim" style={{ lineHeight: 1.65 }}>
                  {dstats.missing.length} essential fields are still empty, including{" "}
                  {dstats.missing.slice(0, 2).map((f) => f.label.toLowerCase()).join(" and ")}. COLD blocks the order
                  until the reasoning exists in writing.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => go("dossier")}>Finish the dossier</button>
            </div>
          ) : (
            <div className="space-y-4">
              <Slider label="Shares" value={ticketShares} min={0} max={2000} step={50} onChange={setTicketShares} format={(n) => n.toLocaleString()} />
              <div className="grid grid-cols-2 gap-4">
                <Stat size="md" label="Order value" value={usd(cost, 0)} />
                <Stat size="md" label="Cash after" value={usd(state.cash - cost, 0)} tone={state.cash - cost < 0 ? "red" : ""} />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={cost > state.cash || ticketShares === 0} onClick={buy}>Buy</button>
                <button className="btn" style={{ flex: 1 }} disabled={!state.positions[company.id] || (state.positions[company.id]?.shares || 0) < ticketShares || ticketShares === 0} onClick={sell}>Sell</button>
              </div>
              {msg && <div className="mono green" style={{ fontSize: 11, lineHeight: 1.6 }}>{msg}</div>}
              <div className="mono dimmer" style={{ fontSize: 11, lineHeight: 1.6 }}>
                Orders execute at {usd(price)} with no commission. Simulated money only.
              </div>
            </div>
          )}
        </Panel>
      </div>

      <StageStrip />
    </div>
  );
}
