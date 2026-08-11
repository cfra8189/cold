import React, { useState, useMemo } from "react";
import { Panel, Stat, Bar, Slider } from "../components/primitives.jsx";
import { NotInStage1 } from "../components/NotInStage1.jsx";
import { FPT } from "../data/companies.js";
import { computeFPT, BASE } from "../lib/reitEngine.js";
import { usd, mm, pct, x, signed } from "../lib/format.js";

export function MoneyFlow({ app }) {
  const [occupancy, setOccupancy] = useState(FPT.occupancy);
  const [rentPsf, setRentPsf] = useState(FPT.rentPsf);
  const [opexRatio, setOpexRatio] = useState(FPT.opexRatio);
  const [rate, setRate] = useState(FPT.interestRate);
  const [capex, setCapex] = useState(FPT.recurringCapex);
  const [sharesOwned, setSharesOwned] = useState(app.state.positions.FPT?.shares || 1200);

  const m = useMemo(
    () => computeFPT({ occupancy, rentPsf, opexRatio, interestRate: rate, recurringCapex: capex }),
    [occupancy, rentPsf, opexRatio, rate, capex]
  );
  const covered = m.coverage >= 1;
  const tight = m.coverage >= 1 && m.coverage < 1.08;
  const userIncome = sharesOwned * FPT.divPerShare;
  const userAffo = sharesOwned * m.affoPs;
  const reset = () => { setOccupancy(FPT.occupancy); setRentPsf(FPT.rentPsf); setOpexRatio(FPT.opexRatio); setRate(FPT.interestRate); setCapex(FPT.recurringCapex); };

  if (app.company.id !== "FPT") return <NotInStage1 company={app.company} what="Money flow" />;

  const chain = [
    { k: "Tenants", v: "210 leases", note: "The source of every dollar", tone: "neutral", noBar: true },
    { k: "Rental revenue", v: mm(m.revenue), note: pct(occupancy) + " occupied at " + usd(rentPsf) + " / sf", tone: "green" },
    { k: "Property expenses", v: mm(-m.propertyExpenses), note: "Taxes, insurance, maintenance not recovered", tone: "red" },
    { k: "Net operating income", v: mm(m.noi), note: "What the buildings earn before financing", tone: "green" },
    { k: "Overhead", v: mm(-m.gna), note: "Corporate staff and listing costs", tone: "red" },
    { k: "Interest", v: mm(-m.interest), note: "$918M of debt at " + pct(rate), tone: "red" },
    { k: "Capital spending", v: mm(-m.capex), note: "Roofs, tenant improvements, leasing commissions", tone: "red" },
    { k: "AFFO", v: mm(m.affo), note: usd(m.affoPs) + " per share — the cash available to owners", tone: "green" },
  ];

  return (
    <div className="space-y-5">
      <div className="split-a">
        <Panel title="The ownership chain" right={<button className="btn" style={{ padding: "4px 10px" }} onClick={reset}>Reset to reported</button>}>
          <div style={{ display: "grid", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
            {chain.map((c, i) => (
              <div key={c.k} style={{ background: "var(--panel)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span className="mono dimmer" style={{ fontSize: 10, width: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{c.k}</div>
                  <div className="mono dimmer" style={{ fontSize: 10, marginTop: 3 }}>{c.note}</div>
                </div>
                <div style={{ flex: "0 0 auto", width: 110, textAlign: "right" }}>
                  <span className={"mono " + (c.tone === "green" ? "green" : c.tone === "red" ? "red" : "dim")} style={{ fontSize: 15 }}>{c.v}</span>
                </div>
                <div style={{ flex: "0 0 90px" }}>
                  {!c.noBar && (
                    <Bar pct={(Math.abs(parseFloat(String(c.v).replace(/[^0-9.]/g, "")) || 0) / m.revenue) * 100}
                      tone={c.tone === "green" ? "green" : c.tone === "red" ? "red" : "neutral"} h={3} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* the split of AFFO */}
          <div className="mt-5">
            <div className="label mb-3">Where AFFO goes</div>
            <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", background: "var(--line)", border: "1px solid var(--line)" }}>
              <div style={{ background: "var(--panel)", padding: 14 }}>
                <Stat size="md" label="Dividends paid" value={mm(m.dividendTotal)} sub={usd(FPT.divPerShare) + " / share"} />
              </div>
              <div style={{ background: "var(--panel)", padding: 14 }}>
                <Stat size="md" label={m.retained >= 0 ? "Retained for debt & reinvestment" : "Shortfall to fund"}
                  value={mm(m.retained)} tone={m.retained >= 0 ? "green" : "red"}
                  sub={m.retained >= 0 ? "Repay debt or buy buildings" : "Must come from debt, asset sales or new shares"} />
              </div>
              <div style={{ background: "var(--panel)", padding: 14 }}>
                <Stat size="md" label="Reaches you" value={usd(userIncome, 0)} tone="green"
                  sub={sharesOwned.toLocaleString() + " shares × " + usd(FPT.divPerShare)} />
              </div>
            </div>
          </div>

          {/* coverage state */}
          <div className="mt-5 p-4" style={{
            background: covered ? (tight ? "var(--amber-wash)" : "var(--green-wash)") : "var(--red-wash)",
            border: "1px solid " + (covered ? (tight ? "#3A2E17" : "var(--green-dim)") : "#3A1F1C"),
          }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <span className="eyebrow" style={{ color: covered ? (tight ? "var(--amber)" : "var(--green)") : "var(--red)" }}>
                {covered ? (tight ? "Dividend covered, but barely" : "Dividend covered by operating cash") : "Dividend not covered by operating cash"}
              </span>
              <span className="mono" style={{ fontSize: 18, color: covered ? (tight ? "var(--amber)" : "var(--green)") : "var(--red)" }}>
                {x(m.coverage)} <span className="dimmer" style={{ fontSize: 11 }}>coverage</span>
              </span>
            </div>
            <Bar pct={Math.min(100, (m.coverage / 1.6) * 100)} tone={covered ? (tight ? "amber" : "green") : "red"} />
            <p className="text-sm mt-3" style={{ lineHeight: 1.6, color: "var(--dim)" }}>
              {covered
                ? tight
                  ? "AFFO of " + mm(m.affo) + " covers " + mm(m.dividendTotal) + " of dividends with only " + mm(m.retained) + " left over. At this level a single tenant departure puts the dividend in question."
                  : "AFFO of " + mm(m.affo) + " covers the " + mm(m.dividendTotal) + " dividend and leaves " + mm(m.retained) + " to repay debt or buy more buildings."
                : "AFFO of " + mm(m.affo) + " falls short of the " + mm(m.dividendTotal) + " dividend by " + mm(Math.abs(m.retained)) + ". The difference has to be borrowed, raised from new shareholders, or funded by selling buildings. None of those are the business paying you."}
            </p>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Assumptions">
            <div className="space-y-5">
              <Slider label="Occupancy" value={occupancy} min={80} max={100} step={0.1} onChange={setOccupancy}
                format={(v) => pct(v)} hint={"Reported 96.2% · " + ((12.4 * (1 - occupancy / 100)) * 1000).toFixed(0) + "k sf vacant"} />
              <Slider label="Average rent" value={rentPsf} min={12} max={22} step={0.05} onChange={setRentPsf}
                format={(v) => usd(v) + " / sf"} hint="Reported $16.65 per square foot" />
              <Slider label="Operating expenses" value={opexRatio} min={0.18} max={0.4} step={0.005} onChange={setOpexRatio}
                format={(v) => pct(v * 100) + " of revenue"} hint="Reported 26.5%" />
              <Slider label="Interest rate on debt" value={rate} min={3} max={9} step={0.1} onChange={setRate}
                format={(v) => pct(v)} hint="Reported 4.5% weighted average on $918M" />
              <Slider label="Capital spending" value={capex} min={8} max={45} step={0.5} onChange={setCapex}
                format={(v) => mm(v)} hint="Reported $18.9M of recurring capital spending" />
              <Slider label="Shares you own" value={sharesOwned} min={0} max={5000} step={50} onChange={setSharesOwned}
                format={(v) => v.toLocaleString() + " sh"} hint={"Ownership " + ((sharesOwned / (FPT.shares * 1e6)) * 100).toFixed(4) + "%"} />
            </div>
          </Panel>

          <Panel title="Your share of the business">
            <Stat label="Dividend income" value={usd(userIncome, 0)} tone="green" sub="Cash you would receive over 12 months" />
            <div className="rowline mt-4 pt-4">
              <Stat size="md" label="AFFO attributable to you" value={usd(userAffo, 0)} sub="Your slice of owner cash, paid or retained" />
            </div>
            <div className="rowline mt-4 pt-4">
              <Stat size="md" label="Retained on your behalf" value={usd(userAffo - userIncome, 0)}
                tone={userAffo - userIncome >= 0 ? "" : "red"}
                sub="Reinvested in buildings or used to repay debt" />
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="What changed against the reported quarter">
        <div className="scrollx">
          <table className="fin" style={{ minWidth: 620 }}>
            <thead><tr><th>Line</th><th>Reported</th><th>Your assumptions</th><th>Change</th><th>Per share</th></tr></thead>
            <tbody>
              {[
                ["Revenue", BASE.revenue, m.revenue, m.revenue / m.shares],
                ["Net operating income", BASE.noi, m.noi, m.noi / m.shares],
                ["Interest expense", -BASE.interest, -m.interest, -m.interest / m.shares],
                ["AFFO", BASE.affo, m.affo, m.affoPs],
                ["Retained after dividend", BASE.retained, m.retained, m.retained / m.shares],
              ].map(([label, base, now, ps]) => {
                const d = now - base;
                return (
                  <tr key={label}>
                    <td>{label}</td>
                    <td className="mono text-right dim">{mm(base)}</td>
                    <td className="mono text-right">{mm(now)}</td>
                    <td className="mono text-right" style={{ color: Math.abs(d) < 0.05 ? "var(--dimmer)" : d > 0 ? "var(--green)" : "var(--red)" }}>
                      {Math.abs(d) < 0.05 ? "—" : (d > 0 ? "+" : "") + mm(d)}
                    </td>
                    <td className="mono text-right dim">{usd(ps)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="dim text-sm mt-4" style={{ lineHeight: 1.65, maxWidth: 700 }}>
          Move occupancy down two points and watch which line reacts hardest. Revenue falls a little; AFFO falls a lot.
          That gap is operating leverage: most property costs stay the same whether the space is full or empty.
        </p>
      </Panel>
    </div>
  );
}
