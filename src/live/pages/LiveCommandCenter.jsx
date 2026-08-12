import React, { useEffect, useState } from "react";
import { Panel, Chip } from "../../components/primitives.jsx";
import { LIVE_TICKERS } from "../data/liveCompanies.js";
import { liveDataClient } from "../providers/liveDataClient.js";
import { LiveMetric } from "../components/LiveMetric.jsx";

const HEADLINE_METRIC = {
  "equity-reit": "reportedAffoPerShare",
  "diversified-holding-company": "operatingEarnings",
};

export function LiveCommandCenter({ onSelect }) {
  const [snapshots, setSnapshots] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        LIVE_TICKERS.map(async (ticker) => {
          const [profile, quote, facts] = await Promise.all([
            liveDataClient.getCompanyProfile(ticker),
            liveDataClient.getQuote(ticker),
            liveDataClient.getFinancials(ticker),
          ]);
          return { ticker, profile, quote, facts };
        })
      );
      if (!cancelled) setSnapshots(entries);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <Panel title="LIVE foundation" right={<Chip tone="amber">Snapshot data</Chip>}>
        <p className="dim text-sm" style={{ lineHeight: 1.7, maxWidth: 720 }}>
          This environment covers real companies, sourced from dated official filings and company reports. Every
          figure below is a captured snapshot, not a live feed — it will not change until a future phase connects an
          automatic filing and market-data pipeline. Market prices are not yet connected and display as unavailable.
        </p>
      </Panel>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        {(snapshots || LIVE_TICKERS.map((ticker) => ({ ticker, profile: null, quote: null, facts: { secReportedGaap: [], companyReportedSnapshot: [] } }))).map((s) => {
          const headlineKey = s.profile ? HEADLINE_METRIC[s.profile.companyType] : null;
          // Headline metrics (reported AFFO, operating earnings) are always company-supplemental, never SEC GAAP.
          const headlineFact = headlineKey ? s.facts.companyReportedSnapshot.find((f) => f.metricKey === headlineKey) : null;
          return (
            <Panel
              key={s.ticker}
              title={s.ticker}
              right={
                s.profile ? (
                  <Chip tone="neutral">{s.profile.companyType === "equity-reit" ? "Equity REIT" : "Holding company"}</Chip>
                ) : null
              }
            >
              <div className="mb-4">
                <div style={{ fontSize: 16 }}>{s.profile ? s.profile.name : "Loading…"}</div>
                <div className="mono dimmer mt-1" style={{ fontSize: 11 }}>{s.profile?.exchange}</div>
              </div>

              <LiveMetric metricKey="price" label="Market price" metric={s.quote} />

              {headlineFact && (
                <div className="rowline mt-4 pt-4">
                  <LiveMetric metricKey={headlineKey} metric={headlineFact} />
                </div>
              )}

              <button className="btn btn-primary mt-4" style={{ width: "100%" }} onClick={() => onSelect(s.ticker)} disabled={!s.profile}>
                Open {s.ticker}
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
