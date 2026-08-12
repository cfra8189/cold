import React from "react";
import { FreshnessBadge } from "./FreshnessBadge.jsx";
import { SourceBadge } from "./SourceBadge.jsx";
import { METRIC_LABELS, formatMetricValue } from "../schema/metric.js";

const CLASSIFICATION_LABEL = {
  reported: "Reported",
  calculated: "Calculated",
  estimated: "Estimated",
  manual: "Manual",
};

/**
 * The single render path for every displayed LIVE value. Three distinct
 * outcomes only, so "missing", "not applicable" and "unavailable price"
 * can never be confused with each other or with a real zero:
 *   - notApplicableReason set  -> "Not applicable" (wrong company type)
 *   - metric.value === null    -> "Not available" (or the price-specific copy)
 *   - otherwise                -> value + classification + freshness + source
 */
export function LiveMetric({ metricKey, label, metric, notApplicableReason, format, freshnessLabel }) {
  const displayLabel = label || METRIC_LABELS[metricKey] || metricKey;

  if (notApplicableReason) {
    return (
      <div>
        <div className="label mb-1.5">{displayLabel}</div>
        <div className="mono dimmer" style={{ fontSize: 14 }}>Not applicable</div>
        <div className="mono dimmer mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>
          {notApplicableReason === "not_applicable_holdco"
            ? "This is a REIT-specific measure. It does not apply to a diversified holding company."
            : notApplicableReason}
        </div>
      </div>
    );
  }

  if (!metric || metric.value === null || metric.value === undefined) {
    const reason = metric?.unavailableReason;
    return (
      <div>
        <div className="label mb-1.5">{displayLabel}</div>
        <div className="mono dimmer" style={{ fontSize: 14 }}>
          {reason === "provider_not_connected" ? "Price unavailable until market-data connection" : "Not available"}
        </div>
        {metric?.provenance && <SourceBadge provenance={metric.provenance} period={metric.period} asOf={metric.asOf} />}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="label">{displayLabel}</span>
        <FreshnessBadge state={metric.freshness} label={freshnessLabel} />
      </div>
      <div className="mono" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>
        {metric.approximate ? "≈ " : ""}
        {format ? format(metric.value) : formatMetricValue(metric)}
      </div>
      <div className="mono dimmer mt-1" style={{ fontSize: 10 }}>
        {CLASSIFICATION_LABEL[metric.classification] || metric.classification}
        {metric.approximate ? " · approximate" : ""}
      </div>
      {metric.approximate && metric.precisionNote && (
        <div className="mono dimmer mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>{metric.precisionNote}</div>
      )}
      <SourceBadge provenance={metric.provenance} period={metric.period} asOf={metric.asOf} />
    </div>
  );
}
