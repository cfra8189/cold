import React, { useState, useMemo } from "react";
import { Panel, Stat, Chip, Slider, Term } from "../components/primitives.jsx";
import { FPT } from "../data/companies.js";
import { BASE } from "../lib/reitEngine.js";
import { usd, pct, x } from "../lib/format.js";

const VAL_DEFAULTS = { affoPs: 1.142, multBear: 15, multBase: 19, multBull: 22, req: 7.8, growth: 2.8, capBear: 7.4, capBase: 6.6, capBull: 6.1 };

export function Valuation({ app }) {
  const { company } = app;
  const [v, setV] = useState(VAL_DEFAULTS);
  const set = (k) => (val) => setV((s) => ({ ...s, [k]: val }));
  const netDebtPs = (FPT.debt - FPT.cash) / FPT.shares;

  const calc = useMemo(() => {
    const mult = (m) => v.affoPs * m;
    const nav = (cap) => (BASE.noi / (cap / 100) - (FPT.debt - FPT.cash)) / FPT.shares;
    const inc = (req, g) => FPT.divPerShare / ((req - g) / 100);
    const bear = { mult: mult(v.multBear), nav: nav(v.capBear), inc: inc(v.req + 1.2, v.growth - 1.5) };
    const base = { mult: mult(v.multBase), nav: nav(v.capBase), inc: inc(v.req, v.growth) };
    const bull = { mult: mult(v.multBull), nav: nav(v.capBull), inc: inc(v.req - 0.8, v.growth + 0.8) };
    const avg = (o) => (o.mult + o.nav + o.inc) / 3;
    return { bear, base, bull, bearV: avg(bear), baseV: avg(base), bullV: avg(bull) };
  }, [v]);

  const price = company.price;
  const margin = ((calc.baseV - price) / calc.baseV) * 100;
  const verdict = margin > 15 ? { t: "Price below estimated value", tone: "green" }
    : margin > -5 ? { t: "Price near estimated value", tone: "amber" }
      : { t: "Price above estimated value", tone: "red" };

  const scaleMin = Math.min(calc.bearV, price) * 0.9;
  const scaleMax = Math.max(calc.bullV, price) * 1.05;
  const posOf = (n) => ((n - scaleMin) / (scaleMax - scaleMin)) * 100;

  if (company.id !== "FPT") {
    return (
      <Panel title="Valuation workbench">
        <div className="py-12 text-center">
          <div className="eyebrow mb-3">Not yet available for this company</div>
          <p className="dim text-sm" style={{ maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Berkshire is valued by summing operating businesses, investments and float, which Stage 1 does not cover.
            Switch to Foundation Property Trust to use the workbench.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <Panel title="Estimated value range" right={<Chip tone={verdict.tone}>{verdict.t}</Chip>}>
        <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          <Stat label="Bear case" value={usd(calc.bearV)} sub="Weak leasing, higher rates" />
          <Stat label="Base case" value={usd(calc.baseV)} tone="green" sub="Assumptions as set below" />
          <Stat label="Bull case" value={usd(calc.bullV)} sub="Rent growth, cap rate compression" />
          <Stat label="Market price" value={usd(price)} sub="What you can transact at today" />
          <Stat label="Margin of safety" value={pct(margin)} tone={margin > 15 ? "green" : margin > -5 ? "amber" : "red"}
            sub={margin > 0 ? "Discount to base estimate" : "Premium to base estimate"} />
        </div>

        {/* value ruler */}
        <div style={{ position: "relative", height: 78, marginTop: 8 }}>
          <div style={{ position: "absolute", top: 30, left: 0, right: 0, height: 8, background: "var(--line)" }} />
          <div style={{ position: "absolute", top: 30, height: 8, background: "var(--green-dim)", left: posOf(calc.bearV) + "%", width: (posOf(calc.bullV) - posOf(calc.bearV)) + "%" }} />
          {[{ n: calc.bearV, l: "Bear", c: "var(--dim)" }, { n: calc.baseV, l: "Base", c: "var(--green)" }, { n: calc.bullV, l: "Bull", c: "var(--dim)" }].map((m) => (
            <div key={m.l} style={{ position: "absolute", left: posOf(m.n) + "%", top: 22, transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ width: 1, height: 24, background: m.c, margin: "0 auto" }} />
              <div className="mono" style={{ fontSize: 10, color: m.c, marginTop: 4, whiteSpace: "nowrap" }}>{m.l} {usd(m.n)}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: posOf(price) + "%", top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--tx)", whiteSpace: "nowrap", marginBottom: 3 }}>Price {usd(price)}</div>
            <div style={{ width: 2, height: 44, background: "var(--tx)", margin: "0 auto" }} />
          </div>
        </div>

        <div className="rowline mt-6 pt-4">
          <p className="dim text-sm" style={{ lineHeight: 1.7, maxWidth: 780 }}>
            This is a learning exercise, not a recommendation. The range exists because the inputs are estimates, and
            the width of the range is itself information: the gap between {usd(calc.bearV)} and {usd(calc.bullV)} is{" "}
            {pct(((calc.bullV - calc.bearV) / calc.baseV) * 100, 0)} of the base estimate. Any price inside a range
            that wide deserves the answer "I do not know precisely," which is a legitimate conclusion.
          </p>
        </div>
      </Panel>

      <div className="split-b">
        <Panel title="Assumptions">
          <div className="space-y-5">
            <Slider label="Normalised AFFO per share" value={v.affoPs} min={0.85} max={1.4} step={0.005} onChange={set("affoPs")}
              format={(n) => usd(n, 3)} hint="Reported trailing twelve months: $1.142" />
            <div className="rowline pt-4"><div className="label mb-4">AFFO multiple</div></div>
            <Slider label="Bear multiple" value={v.multBear} min={9} max={18} step={0.5} onChange={set("multBear")} format={(n) => x(n, 1)} />
            <Slider label="Base multiple" value={v.multBase} min={12} max={24} step={0.5} onChange={set("multBase")} format={(n) => x(n, 1)}
              hint={"Today's price implies " + x(price / v.affoPs, 1)} />
            <Slider label="Bull multiple" value={v.multBull} min={16} max={30} step={0.5} onChange={set("multBull")} format={(n) => x(n, 1)} />
            <div className="rowline pt-4"><div className="label mb-4">Income method</div></div>
            <Slider label="Required return" value={v.req} min={5} max={12} step={0.1} onChange={set("req")} format={(n) => pct(n)}
              hint="The annual return you demand for this risk" />
            <Slider label="Growth assumption" value={v.growth} min={0} max={5} step={0.1} onChange={set("growth")} format={(n) => pct(n)}
              hint="Contractual escalators average 2.5%" />
            <div className="rowline pt-4"><div className="label mb-4">Asset method</div></div>
            <Slider label="Base cap rate" value={v.capBase} min={5} max={9} step={0.05} onChange={set("capBase")} format={(n) => pct(n, 2)}
              hint="Private-market pricing for comparable portfolios" />
            <button className="btn mt-2" onClick={() => setV(VAL_DEFAULTS)}>Reset assumptions</button>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Three ways to reach a value" pad={false}>
            <div className="scrollx">
              <table className="fin" style={{ minWidth: 560 }}>
                <thead><tr><th>Method</th><th>Bear</th><th>Base</th><th>Bull</th><th style={{ textAlign: "left" }}>What it assumes</th></tr></thead>
                <tbody>
                  <tr>
                    <td><Term k="affo">AFFO multiple</Term></td>
                    <td className="mono text-right dim">{usd(calc.bear.mult)}</td>
                    <td className="mono text-right">{usd(calc.base.mult)}</td>
                    <td className="mono text-right dim">{usd(calc.bull.mult)}</td>
                    <td className="dim text-sm">Buyers will pay a similar multiple of owner cash as they do for comparable REITs.</td>
                  </tr>
                  <tr>
                    <td>Asset value less debt</td>
                    <td className="mono text-right dim">{usd(calc.bear.nav)}</td>
                    <td className="mono text-right">{usd(calc.base.nav)}</td>
                    <td className="mono text-right dim">{usd(calc.bull.nav)}</td>
                    <td className="dim text-sm">
                      Buildings are worth NOI divided by the <Term k="cap rate">cap rate</Term>, minus {usd(netDebtPs)} per share of net debt.
                    </td>
                  </tr>
                  <tr>
                    <td>Dividend and growth</td>
                    <td className="mono text-right dim">{usd(calc.bear.inc)}</td>
                    <td className="mono text-right">{usd(calc.base.inc)}</td>
                    <td className="mono text-right dim">{usd(calc.bull.inc)}</td>
                    <td className="dim text-sm">
                      The $0.94 dividend grows forever at your growth rate, discounted at your <Term k="required return">required return</Term>.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--tx)" }}>Average</td>
                    <td className="mono text-right dim">{usd(calc.bearV)}</td>
                    <td className="mono text-right green">{usd(calc.baseV)}</td>
                    <td className="mono text-right dim">{usd(calc.bullV)}</td>
                    <td className="dim text-sm">Three imperfect methods agreeing loosely beats one method stated precisely.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 mono dimmer" style={{ fontSize: 11, lineHeight: 1.65, borderTop: "1px solid var(--line)" }}>
              Move required return by one point and watch the third row swing hardest. That sensitivity is why an
              income-based value should never be the only method you use.
            </div>
          </Panel>

          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            <Panel title="Business quality">
              <Stat size="md" label="Assessment" value="Solid, not exceptional" tone="green" />
              <ul className="mt-4 space-y-2.5">
                <li className="text-sm dim" style={{ lineHeight: 1.55 }}>Contracted rent, 6.4-year average term</li>
                <li className="text-sm dim" style={{ lineHeight: 1.55 }}>Renewal spreads positive at +8.4%</li>
                <li className="text-sm dim" style={{ lineHeight: 1.55 }}>23% of rent in a structurally weak segment</li>
              </ul>
            </Panel>
            <Panel title="Financial strength">
              <Stat size="md" label="Assessment" value="Adequate, watch 2027" tone="" />
              <ul className="mt-4 space-y-2.5">
                <li className="text-sm dim" style={{ lineHeight: 1.55 }}>Net debt to EBITDA 6.6x, mid-range for the sector</li>
                <li className="text-sm dim" style={{ lineHeight: 1.55 }}>90.6% of debt at fixed rates</li>
                <li className="text-sm amber" style={{ lineHeight: 1.55 }}>$180M reprices in 2027, roughly $5.4M of new interest</li>
              </ul>
            </Panel>
            <Panel title="Value against price">
              <Stat size="md" label="Base estimate" value={usd(calc.baseV)} tone="green" />
              <Stat size="md" label="Market price" value={usd(price)} />
              <div className="mt-4 p-3" style={{ background: verdict.tone === "green" ? "var(--green-wash)" : verdict.tone === "amber" ? "var(--amber-wash)" : "var(--red-wash)", border: "1px solid var(--line)" }}>
                <div className="mono" style={{ fontSize: 11, lineHeight: 1.6, color: verdict.tone === "green" ? "var(--green)" : verdict.tone === "amber" ? "var(--amber)" : "var(--red)" }}>
                  {verdict.t}. Margin of safety {pct(margin)}.
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
