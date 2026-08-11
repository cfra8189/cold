import React, { useState } from "react";
import { GLOSSARY } from "../data/glossary.js";

/* ============================================================================
   Primitive components shared across LEARN and ANALYZE modes
   ========================================================================== */

export function Panel({ title, right, children, className = "", pad = true }) {
  return (
    <section className={"panel " + className}>
      {(title || right) && (
        <header className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
          <h3 className="eyebrow">{title}</h3>
          {right}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone = "", size = "lg" }) {
  const cls = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base";
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      <div className={"mono " + cls + " " + tone} style={{ letterSpacing: "-0.01em" }}>{value}</div>
      {sub && <div className="mono text-xs dimmer mt-1">{sub}</div>}
    </div>
  );
}

export function Chip({ children, tone = "neutral" }) {
  const map = {
    neutral: { c: "var(--dim)", b: "var(--line-2)", bg: "transparent" },
    green: { c: "var(--green)", b: "var(--green-dim)", bg: "var(--green-wash)" },
    amber: { c: "var(--amber)", b: "#3A2E17", bg: "var(--amber-wash)" },
    red: { c: "var(--red)", b: "#3A1F1C", bg: "var(--red-wash)" },
  };
  const s = map[tone] || map.neutral;
  return (
    <span className="mono" style={{ color: s.c, border: "1px solid " + s.b, background: s.bg, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 8px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Term({ k, children }) {
  const [open, setOpen] = useState(false);
  const g = GLOSSARY[k];
  if (!g) return <>{children}</>;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span className="term" tabIndex={0} role="button" onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}>
        {children || g.t}
      </span>
      {open && (
        <span className="panel" style={{ position: "absolute", zIndex: 50, top: "calc(100% + 8px)", left: 0, width: 300, padding: 14, display: "block", boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>{g.t}</span>
          <span className="text-xs" style={{ display: "block", lineHeight: 1.6, color: "var(--tx)" }}>{g.d}</span>
          <span className="text-xs dim" style={{ display: "block", lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
            <span className="label" style={{ marginRight: 6 }}>Why it matters</span>{g.w}
          </span>
          <button className="btn mt-3" style={{ padding: "4px 10px" }} onClick={() => setOpen(false)}>Close</button>
        </span>
      )}
    </span>
  );
}

export function Slider({ label, value, min, max, step, onChange, format, hint }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="label">{label}</span>
        <span className="mono text-sm">{format ? format(value) : value}</span>
      </div>
      <input className="rng" type="range" min={min} max={max} step={step} value={value}
        aria-label={label} onChange={(e) => onChange(parseFloat(e.target.value))} />
      {hint && <div className="mono dimmer mt-1.5" style={{ fontSize: 10 }}>{hint}</div>}
    </div>
  );
}

export function Bar({ pct: p, tone = "green", h = 6 }) {
  const color = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : tone === "red" ? "var(--red)" : "var(--dim)";
  return (
    <div style={{ background: "var(--line)", height: h, width: "100%" }}>
      <div style={{ background: color, height: h, width: Math.max(0, Math.min(100, p)) + "%" }} />
    </div>
  );
}

export function Divide({ label }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <span className="label" style={{ whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}

export function Tabs({ options, value, onChange, size = "md" }) {
  return (
    <div className="flex flex-wrap" style={{ gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.v;
        const l = typeof o === "string" ? o : o.l;
        const on = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} className="mono"
            style={{ background: on ? "var(--panel-2)" : "var(--bg)", color: on ? "var(--tx)" : "var(--dim)",
              padding: size === "sm" ? "5px 10px" : "8px 14px", fontSize: size === "sm" ? 11 : 12,
              letterSpacing: ".06em", border: "none", cursor: "pointer",
              boxShadow: on ? "inset 0 -2px 0 var(--green)" : "none" }}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* small SVG series chart — bars or line, no library */
export function Spark({ data, keyName, format, tone = "green", height = 90, mode = "bar" }) {
  const vals = data.map((d) => d[keyName]);
  const max = Math.max(...vals) * 1.08;
  const min = Math.min(...vals) * 0.92;
  const w = 100, pad = 2;
  const color = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--dim)";
  const xs = (i) => pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
  const ys = (v) => 100 - ((v - min) / (max - min)) * 100;
  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height }}>
        {mode === "line" ? (
          <polyline fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke"
            points={data.map((d, i) => xs(i) + "," + ys(d[keyName])).join(" ")} />
        ) : (
          data.map((d, i) => {
            const bw = (w - pad * 2) / data.length - 2.5;
            const y = ys(d[keyName]);
            return <rect key={i} x={pad + i * ((w - pad * 2) / data.length) + 1} y={y} width={bw} height={100 - y} fill={color} opacity={i === data.length - 1 ? 1 : 0.45} />;
          })
        )}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <div key={i} className="text-center" style={{ flex: 1 }}>
            <div className="mono dimmer" style={{ fontSize: 9 }}>{d.yr}</div>
            <div className="mono" style={{ fontSize: 10, color: i === data.length - 1 ? "var(--tx)" : "var(--dim)" }}>
              {format(d[keyName])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
