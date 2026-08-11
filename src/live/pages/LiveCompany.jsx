import React, { useEffect, useState } from "react";
import { Panel, Stat, Chip } from "../../components/primitives.jsx";
import { liveDataClient } from "../providers/liveDataClient.js";
import { profileFor } from "../profiles/index.js";
import { calculationsFor } from "../calculations/index.js";
import { LiveMetric } from "../components/LiveMetric.jsx";

function latestFact(facts, metricKey) {
  const matches = facts.filter((f) => f.metricKey === metricKey);
  if (!matches.length) return null;
  return matches.slice().sort((a, b) => (b.period?.periodEnd || "").localeCompare(a.period?.periodEnd || ""))[0];
}
function priorFact(facts, metricKey, currentPeriodEnd) {
  const matches = facts.filter((f) => f.metricKey === metricKey && f.period?.periodEnd !== currentPeriodEnd);
  if (!matches.length) return null;
  return matches.slice().sort((a, b) => (b.period?.periodEnd || "").localeCompare(a.period?.periodEnd || ""))[0];
}

export function LiveCompany({ ticker, onBack }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    (async () => {
      const [profile, quote, facts] = await Promise.all([
        liveDataClient.getCompanyProfile(ticker),
        liveDataClient.getQuote(ticker),
        liveDataClient.getFinancials(ticker),
      ]);
      if (!cancelled) setData({ profile, quote, facts });
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (!data) {
    return (
      <div className="space-y-5">
        <button className="btn" onClick={onBack}>← Back to Command Center</button>
        <Panel title={ticker}>
          <p className="dim text-sm">Loading snapshot…</p>
        </Panel>
      </div>
    );
  }

  const { profile, quote, facts } = data;
  const profileDef = profileFor(profile.companyType);
  const calcs = calculationsFor(profile.companyType);
  const isReit = profile.companyType === "equity-reit";

  const calculated = {};
  if (isReit) {
    const affo = latestFact(facts, "reportedAffoPerShare");
    const dividend = latestFact(facts, "reportedDividendPerShare");
    calculated.affoPayoutRatio = calcs.affoPayoutRatio({ reportedDividendPerShare: dividend, reportedAffoPerShare: affo });
    calculated.affoCoverage = calcs.affoCoverage({ reportedAffoPerShare: affo, reportedDividendPerShare: dividend });

    const currentOcc = latestFact(facts, "occupancy");
    const priorOcc = currentOcc ? priorFact(facts, "occupancy", currentOcc.period?.periodEnd) : null;
    calculated.occupancyDelta = calcs.occupancyDelta({ currentOccupancy: currentOcc, priorOccupancy: priorOcc });
  } else {
    const currentEarn = latestFact(facts, "netEarningsPerClassBShare");
    const priorEarn = currentEarn ? priorFact(facts, "netEarningsPerClassBShare", currentEarn.period?.periodEnd) : null;
    calculated.netEarningsPerClassBShareGrowth = calcs.perShareGrowth(
      { current: currentEarn, prior: priorEarn },
      { metricKey: "netEarningsPerClassBShareGrowth" }
    );
  }

  const notApplicableEntries = Object.entries(profileDef.notApplicableMetrics);

  return (
    <div className="space-y-5">
      <button className="btn" onClick={onBack}>← Back to Command Center</button>

      <Panel title={profile.name} right={<Chip tone="amber">Snapshot data</Chip>}>
        <div className="grid grid-cols-2 gap-5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
          <Stat size="md" label="Ticker" value={profile.ticker} />
          <Stat size="md" label="Company type" value={isReit ? "Equity REIT" : "Diversified holding company"} />
          <Stat size="md" label="Exchange" value={profile.exchange} />
          <Stat size="md" label="CIK" value={profile.cik} />
        </div>
        <p className="dim text-sm" style={{ lineHeight: 1.65, maxWidth: 700 }}>{profile.description}</p>
        <div className="rowline mt-4 pt-3 mono dimmer" style={{ fontSize: 10, lineHeight: 1.6 }}>{profileDef.screeningContext}</div>
      </Panel>

      <Panel title="Price" right={<Chip tone="red">Not connected</Chip>}>
        <LiveMetric metricKey="price" label="Market price" metric={quote} />
      </Panel>

      <Panel title="Reported and calculated metrics">
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {profileDef.applicableMetrics.map((key) => {
            const fact = Object.prototype.hasOwnProperty.call(calculated, key) ? calculated[key] : latestFact(facts, key);
            return <LiveMetric key={key} metricKey={key} metric={fact} />;
          })}
        </div>
      </Panel>

      {notApplicableEntries.length > 0 && (
        <Panel title="Not applicable to this company">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {notApplicableEntries.map(([key, reason]) => (
              <LiveMetric key={key} metricKey={key} metric={null} notApplicableReason={reason} />
            ))}
          </div>
        </Panel>
      )}

      <div className="mono dimmer" style={{ fontSize: 10, lineHeight: 1.6 }}>
        Automatic updates are not connected yet. Every figure above was captured from the source shown and will not
        change until a later phase connects a live filing and market-data pipeline.
      </div>
    </div>
  );
}
