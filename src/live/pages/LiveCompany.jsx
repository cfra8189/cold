import React, { useEffect, useState } from "react";
import { Panel, Stat, Chip } from "../../components/primitives.jsx";
import { liveDataClient } from "../providers/liveDataClient.js";
import { profileFor } from "../profiles/index.js";
import { calculationsFor } from "../calculations/index.js";
import { LiveMetric } from "../components/LiveMetric.jsx";
import { FreshnessBadge } from "../components/FreshnessBadge.jsx";
import { secFreshnessLabel } from "../schema/freshness.js";

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

const FILING_FORMS = ["10-K", "10-Q", "8-K"];

function FilingsSection({ filings }) {
  if (filings.status === "not_connected") {
    return (
      <Panel title="SEC filings" right={<Chip tone="amber">SEC not connected</Chip>}>
        <p className="dim text-sm" style={{ lineHeight: 1.65, maxWidth: 700 }}>{filings.message}</p>
        {filings.knownSources.length > 0 && (
          <div className="rowline mt-4 pt-4">
            <div className="label mb-2">Previously verified sources</div>
            <div className="space-y-2">
              {filings.knownSources.map((s) => (
                <div key={s.url} className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm dim">{s.label}</span>
                  <a href={s.url} target="_blank" rel="noreferrer" className="term mono" style={{ fontSize: 11 }}>
                    View source
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    );
  }

  return (
    <Panel title="SEC filings" right={<FreshnessBadge state={filings.filings["10-Q"]?.freshness} label={secFreshnessLabel(filings.filings["10-Q"]?.freshness)} />}>
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {FILING_FORMS.map((form) => {
          const filing = filings.filings[form];
          if (!filing || filing.unavailable) {
            return (
              <div key={form}>
                <div className="label mb-1.5">Latest {form}</div>
                <div className="mono dimmer" style={{ fontSize: 14 }}>Not available</div>
              </div>
            );
          }
          return (
            <div key={form}>
              <div className="label mb-1.5">Latest {form}</div>
              <div className="mono" style={{ fontSize: 16 }}>{filing.reportDate}</div>
              <div className="mono dimmer mt-1" style={{ fontSize: 10, lineHeight: 1.6 }}>
                Filed {filing.filingDate} · accession {filing.accessionNumber}
              </div>
              <div className="mt-2" style={{ display: "flex", gap: 12 }}>
                <a href={filing.filingIndexUrl} target="_blank" rel="noreferrer" className="term mono" style={{ fontSize: 11 }}>
                  Filing index
                </a>
                <a href={filing.primaryDocumentUrl} target="_blank" rel="noreferrer" className="term mono" style={{ fontSize: 11 }}>
                  Primary document
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rowline mt-4 pt-3 mono dimmer" style={{ fontSize: 10, lineHeight: 1.6 }}>
        Data retrieved {filings.retrievedAt}. This reflects SEC's current filing index, not a real-time market feed —
        it updates only when a new filing is submitted.
      </div>
    </Panel>
  );
}

export function LiveCompany({ ticker, onBack }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    (async () => {
      const [profile, quote, facts, filings] = await Promise.all([
        liveDataClient.getCompanyProfile(ticker),
        liveDataClient.getQuote(ticker),
        liveDataClient.getFinancials(ticker),
        liveDataClient.getFilings(ticker),
      ]);
      if (!cancelled) setData({ profile, quote, facts, filings });
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

  const { profile, quote, facts, filings } = data;
  const { secReportedGaap, companyReportedSnapshot } = facts;
  const profileDef = profileFor(profile.companyType);
  const calcs = calculationsFor(profile.companyType);
  const isReit = profile.companyType === "equity-reit";

  const calculated = {};
  if (isReit) {
    const affo = latestFact(companyReportedSnapshot, "reportedAffoPerShare");
    const dividend = latestFact(companyReportedSnapshot, "reportedDividendPerShare");
    calculated.affoPayoutRatio = calcs.affoPayoutRatio({ reportedDividendPerShare: dividend, reportedAffoPerShare: affo });
    calculated.affoCoverage = calcs.affoCoverage({ reportedAffoPerShare: affo, reportedDividendPerShare: dividend });

    const currentOcc = latestFact(companyReportedSnapshot, "occupancy");
    const priorOcc = currentOcc ? priorFact(companyReportedSnapshot, "occupancy", currentOcc.period?.periodEnd) : null;
    calculated.occupancyDelta = calcs.occupancyDelta({ currentOccupancy: currentOcc, priorOccupancy: priorOcc });
  } else {
    const currentEarn = latestFact(companyReportedSnapshot, "netEarningsPerClassBShare");
    const priorEarn = currentEarn ? priorFact(companyReportedSnapshot, "netEarningsPerClassBShare", currentEarn.period?.periodEnd) : null;
    calculated.netEarningsPerClassBShareGrowth = calcs.perShareGrowth(
      { current: currentEarn, prior: priorEarn },
      { metricKey: "netEarningsPerClassBShareGrowth" }
    );
  }

  const notApplicableEntries = Object.entries(profileDef.notApplicableMetrics);
  const mappedGaapFacts = secReportedGaap.filter((f) => f.value !== null);

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

      <FilingsSection filings={filings} />

      {mappedGaapFacts.length > 0 && (
        <Panel title="Standardized GAAP facts (SEC-reported)">
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {mappedGaapFacts.map((fact) => (
              <LiveMetric key={fact.metricKey} metricKey={fact.metricKey} metric={fact} freshnessLabel={secFreshnessLabel(fact.freshness)} />
            ))}
          </div>
          <div className="rowline mt-4 pt-3 mono dimmer" style={{ fontSize: 10, lineHeight: 1.6 }}>
            Standardized figures from SEC's own XBRL tagging of the company's filing — current filing data, not a
            continuously updating feed. See each figure's source for the exact concept and filing it came from.
          </div>
        </Panel>
      )}

      <Panel title="Company-reported snapshot metrics" right={<Chip tone="amber">Company supplemental</Chip>}>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {profileDef.applicableMetrics.map((key) => {
            const fact = Object.prototype.hasOwnProperty.call(calculated, key) ? calculated[key] : latestFact(companyReportedSnapshot, key);
            return <LiveMetric key={key} metricKey={key} metric={fact} />;
          })}
        </div>
        <div className="rowline mt-4 pt-3 mono dimmer" style={{ fontSize: 10, lineHeight: 1.6 }}>
          These come from the company's own earnings release or supplemental report, not SEC's standardized GAAP
          tagging — kept visually separate from the section above deliberately, since they are different kinds of
          source (see each figure's classification and source for detail).
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
        Filings and standardized GAAP facts may reflect SEC's current filing index; company-reported snapshot metrics
        remain dated captures, not automatically updating. Nothing on this page is a live market price — market
        quotes remain unavailable until a future phase connects a licensed data provider.
      </div>
    </div>
  );
}
