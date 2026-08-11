/* ============================================================================
   Formatting helpers
   ========================================================================== */

export const usd = (n, d = 2) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const mm = (n, d = 1) => (n < 0 ? "(" : "") + "$" + Math.abs(n).toFixed(d) + "M" + (n < 0 ? ")" : "");
export const pct = (n, d = 1) => n.toFixed(d) + "%";
export const x = (n, d = 2) => n.toFixed(d) + "x";
export const signed = (n, d = 1) => (n > 0 ? "+" : "") + n.toFixed(d);
