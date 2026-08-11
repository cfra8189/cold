import React from "react";
import { Panel, Stat, Chip, Bar, Term, Spark } from "../components/primitives.jsx";
import { FPT, BRK } from "../data/companies.js";
import { pct, mm, x, usd } from "../lib/format.js";

export function CompanyPage({ app }) {
  const { company } = app;
  const isReit = company.id === "FPT";
  return (
    <div className="space-y-5">
      <Panel title="Explain it simply">
        <p style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 760 }}>{company.explainSimply}</p>
        <div className="rowline mt-5 pt-4 flex flex-wrap gap-x-6 gap-y-2 mono text-xs dim">
          <span>Click any underlined term for a plain-language definition:</span>
          <Term k="occupancy" /><Term k="lease expiration" /><Term k="affo" />
          <Term k="payout ratio" /><Term k="debt maturity" /><Term k="triple-net" />
        </div>
      </Panel>

      {isReit ? <ReitCompany /> : <HoldcoCompany />}
    </div>
  );
}

function ReitCompany() {
  const c = FPT;
  return (
    <>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <Panel title="What the trust owns">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <Stat size="md" label="Properties" value="84" />
            <Stat size="md" label="Leasable area" value="12.4M sf" />
            <Stat size="md" label={<>Occupancy</>} value={pct(c.occupancy)} tone="green" />
          </div>
          <div className="label mb-3">By share of rent</div>
          {c.propertyTypes.map((p) => (
            <div key={p.name} className="mb-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm">{p.name}</span>
                <span className="mono text-sm">{p.share}%</span>
              </div>
              <Bar pct={p.share} tone={p.name.includes("office") ? "amber" : "green"} h={4} />
              <div className="mono dimmer mt-1.5" style={{ fontSize: 10 }}>{p.note}</div>
            </div>
          ))}
        </Panel>

        <Panel title="Who pays the rent">
          <table className="fin">
            <thead><tr><th>Tenant</th><th>% of rent</th><th>Lease ends</th><th>Credit</th></tr></thead>
            <tbody>
              {c.tenants.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td className="mono text-right">{pct(t.pctRent)}</td>
                  <td className="mono text-right" style={{ color: t.expiry === "2027" ? "var(--amber)" : "var(--dim)" }}>{t.expiry}</td>
                  <td className="mono text-right dim">{t.credit}</td>
                </tr>
              ))}
              <tr>
                <td className="dim">Top five combined</td>
                <td className="mono text-right green">27.5%</td>
                <td colSpan={2} className="mono text-right dimmer" style={{ fontSize: 11 }}>Remaining 72.5% across 210 tenants</td>
              </tr>
            </tbody>
          </table>
          <div className="mono dim mt-4" style={{ fontSize: 11, lineHeight: 1.6 }}>
            Cardinal Logistics is the concentration to watch. Its <Term k="lease expiration">lease expiration</Term> in
            2027 places 8.1% of rent at risk in a single year.
          </div>
        </Panel>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <Panel title="Where the buildings are">
          {c.geography.map((g) => (
            <div key={g.name} className="mb-3.5">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm">{g.name}</span><span className="mono text-sm">{g.share}%</span>
              </div>
              <Bar pct={g.share} tone="neutral" h={4} />
            </div>
          ))}
          <div className="rowline mt-4 pt-4 mono dimmer" style={{ fontSize: 11, lineHeight: 1.6 }}>
            No single market exceeds 14% of rent. Concentration risk here is tenant-level, not geographic.
          </div>
        </Panel>

        <Panel title="How the leases are written">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Stat size="md" label="Average lease term" value={c.avgLeaseYears + " yrs"} />
            <Stat size="md" label="Rent escalator" value="2.5% / yr" tone="green" />
          </div>
          <ul className="space-y-3">
            {c.leaseStructure.map((l, i) => (
              <li key={i} className="text-sm dim flex gap-3" style={{ lineHeight: 1.6 }}>
                <span className="mono dimmer" style={{ fontSize: 10, marginTop: 3 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Revenue sources">
          {c.revenueSources.map((r) => (
            <div key={r.name} className="flex items-baseline justify-between py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <span className="text-sm">{r.name}</span>
              <span className="mono text-sm">{mm(r.amt)}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between pt-3">
            <span className="label">Total revenue</span>
            <span className="mono text-lg">{mm(198.4)}</span>
          </div>
          <div className="mono dimmer mt-3" style={{ fontSize: 11, lineHeight: 1.6 }}>
            Expense recoveries are reimbursements from tenants, not profit. They arrive as revenue and leave as
            property expense.
          </div>
        </Panel>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <Panel title="Competitive advantages">
          <ul className="space-y-4">
            {c.moats.map((m, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ lineHeight: 1.65 }}>
                <span className="green mono" style={{ fontSize: 11, marginTop: 2 }}>+</span><span>{m}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Primary risks" right={<Chip tone="amber">2 high severity</Chip>}>
          <ul className="space-y-4">
            {c.risks.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm items-start" style={{ lineHeight: 1.65 }}>
                <Chip tone={r.sev === "high" ? "red" : "amber"}>{r.sev}</Chip>
                <span style={{ flex: 1 }}>{r.r}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Five-year record">
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div><div className="label mb-3">AFFO per share</div><Spark data={c.history} keyName="affoPs" format={(v) => "$" + v.toFixed(2)} /></div>
          <div><div className="label mb-3">Dividend per share</div><Spark data={c.history} keyName="divPs" format={(v) => "$" + v.toFixed(2)} tone="amber" /></div>
          <div><div className="label mb-3">Occupancy</div><Spark data={c.history} keyName="occ" format={(v) => v.toFixed(1) + "%"} mode="line" /></div>
          <div><div className="label mb-3">Shares outstanding (M)</div><Spark data={c.history} keyName="shares" format={(v) => v.toFixed(1)} tone="amber" /></div>
        </div>
        <div className="rowline mt-5 pt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          <div className="text-sm dim" style={{ lineHeight: 1.65 }}>
            <span className="green mono" style={{ fontSize: 11 }}>READ THIS TOGETHER </span>
            AFFO per share grew 23.9% over five years while total AFFO grew 43.3%. The difference is{" "}
            <Term k="dilution">dilution</Term>: the share count rose 15.7%.
          </div>
          <div className="text-sm dim" style={{ lineHeight: 1.65 }}>
            <span className="amber mono" style={{ fontSize: 11 }}>WATCH THIS </span>
            The dividend grew faster than AFFO per share, so the <Term k="payout ratio">payout ratio</Term> moved from
            78.3% to 82.4%. The cushion is getting thinner, not thicker.
          </div>
        </div>
      </Panel>

      <Panel title="Management's capital-allocation record">
        <table className="fin">
          <thead><tr><th>Period</th><th style={{ textAlign: "left" }}>Action</th><th style={{ textAlign: "left" }}>Amount</th><th style={{ textAlign: "left" }}>What it tells you</th></tr></thead>
          <tbody>
            {c.capitalAllocation.map((r, i) => (
              <tr key={i}>
                <td className="mono dim" style={{ fontSize: 11 }}>{r.yr}</td>
                <td>{r.item}</td>
                <td className="mono">{r.amt}</td>
                <td className="dim text-sm">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

function HoldcoCompany() {
  const c = BRK;
  return (
    <>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <Panel title="What you own">
          <div className="grid grid-cols-2 gap-5 mb-5">
            <Stat size="md" label="Book value / share" value={usd(c.bookPerShare)} />
            <Stat size="md" label="Price to book" value={x(c.price / c.bookPerShare)} />
            <Stat size="md" label="Operating earnings" value={"$" + c.opEarnings.toFixed(1) + "B"} sub="Trailing twelve months" />
            <Stat size="md" label="Cash and Treasury bills" value={"$" + c.cashTbills.toFixed(0) + "B"} tone="green" />
          </div>
          <div className="label mb-3">Earnings by segment</div>
          {c.segments.map((s) => (
            <div key={s.name} className="mb-3">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm">{s.name}</span><span className="mono text-sm">{s.share}%</span>
              </div>
              <Bar pct={s.share} tone="neutral" h={4} />
            </div>
          ))}
        </Panel>
        <Panel title="The insurance engine">
          <Stat label="Insurance float" value={"$" + c.float.toFixed(0) + "B"} sub="Premiums held before claims are paid" />
          <p className="dim text-sm mt-4" style={{ lineHeight: 1.7 }}>
            <Term k="float">Float</Term> is the single idea that explains Berkshire. Customers pay premiums today and
            claims are settled years later. In the meantime that money is invested for the owners' benefit. When
            underwriting breaks even, the capital is effectively free.
          </p>
          <div className="rowline mt-5 pt-4">
            <div className="label mb-3">Competitive advantages</div>
            <ul className="space-y-3">
              {c.moats.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm dim" style={{ lineHeight: 1.6 }}>
                  <span className="green mono" style={{ fontSize: 11, marginTop: 2 }}>+</span><span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
      <Panel title="Primary risks">
        <ul className="space-y-4">
          {c.risks.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm items-start" style={{ lineHeight: 1.65 }}>
              <Chip tone={r.sev === "high" ? "red" : "amber"}>{r.sev}</Chip><span style={{ flex: 1 }}>{r.r}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Research status">
        <div className="text-center py-10">
          <div className="eyebrow mb-3">Dossier not started</div>
          <p className="dim text-sm mb-5" style={{ maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
            You have not researched Berkshire yet. COLD deliberately keeps one company in front of you at a time.
            Finish Foundation Property Trust first, then open this one.
          </p>
        </div>
      </Panel>
    </>
  );
}
