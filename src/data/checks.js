/* ============================================================================
   LEARN mode — the six-check ownership review (equity REIT only)

   Every ratio below is scoped to FPT as an equity REIT and framed as a
   company-type-specific screening guide, not a universal threshold. Do not
   reuse these bands for Berkshire Hathaway or any non-REIT company.
   ========================================================================== */

export const CHECKS = [
  {
    id: "business", name: "Business",
    question: "What does the company own or sell, and who pays it?",
    plainAnswer:
      "It owns 84 buildings. 210 tenants pay rent to occupy them, under contracts that average 6.4 years of remaining term.",
    metricLabel: "Average remaining lease term",
    metricName: "Weighted-average lease term",
    scope: "Equity REIT · diversified property portfolio",
    compareWith: "Its own five-year trend and diversified equity REITs with a similar property mix",
    value: 6.4, display: "6.4 years",
    scale: { min: 0, max: 10 },
    bands: [{ to: 3, tone: "red", l: "Danger" }, { to: 5, tone: "amber", l: "Caution" }, { to: 10, tone: "green", l: "Healthy" }],
    reading: "Healthy",
    interpretation:
      "Six and a half years of rent is already signed. That is not a forecast, it is a contract. It means the next two years of revenue are largely known before they happen.",
    why:
      "Most businesses have to win their customers again every year. A landlord with long leases does not. Lease length is one useful measure of revenue visibility, but it must be read with occupancy, tenant quality, concentration and lease expirations.",
    action: "Look at the tenant list. Flag large concentrations for investigation rather than treating 10% as an automatic pass or fail. The largest tenant here supplies 8.1% of rent.",
    verify: { page: "company", l: "See the tenants and leases" },
    supporting: [["Buildings owned", "84"], ["Tenants", "210"], ["Largest tenant", "8.1% of rent"], ["Space occupied", "96.2%"]],
  },
  {
    id: "health", name: "Health",
    question: "Are revenue and owner cash flow growing?",
    plainAnswer:
      "Revenue grew from $158.2M to $198.4M over five years. The cash reaching each share grew from $0.92 to $1.14.",
    metricLabel: "Growth in AFFO per share, last twelve months",
    metricName: "AFFO per-share growth",
    scope: "Equity REIT · company-defined AFFO",
    compareWith: "The same company's prior periods first, then similar equity REITs using comparable adjustments",
    value: 3.5, display: "+3.5%",
    scale: { min: -5, max: 10 },
    bands: [{ to: 0, tone: "red", l: "Danger" }, { to: 3, tone: "amber", l: "Caution" }, { to: 10, tone: "green", l: "Healthy" }],
    reading: "Healthy",
    interpretation:
      "Both are growing, and per share is what counts. Total AFFO grew faster than AFFO per share because the company issued more shares along the way. AFFO is a non-GAAP measure, so verify the company's definition and reconciliation before comparing it with another REIT.",
    why:
      "A company can grow revenue and still shrink your share of it. Always check growth per share before deciding a business is improving.",
    action: "Compare total AFFO growth of 43.3% against per-share growth of 23.9%. The gap is what the new shares cost you.",
    verify: { page: "company", l: "See the five-year record" },
    supporting: [["Revenue, 5 years", "$158.2M → $198.4M"], ["Cash per share", "$0.92 → $1.14"], ["Share count", "54.0M → 62.5M"], ["Occupancy", "93.1% → 96.2%"]],
  },
  {
    id: "distribution", name: "Distribution",
    question: "Is the dividend covered by the cash the company produces?",
    plainAnswer:
      "The company reports $1.14 of AFFO per share and paid a $0.94 dividend. On that company-defined measure, the dividend is covered with $0.20 per share left over.",
    metricLabel: "Share of AFFO paid as dividends",
    metricName: "AFFO payout ratio",
    scope: "Equity REIT · screening guide, not a universal dividend rule",
    compareWith: "The REIT's own payout history, recurring capital needs and similar property-sector peers",
    value: 82.4, display: "82.4%",
    scale: { min: 50, max: 110 },
    bands: [{ to: 75, tone: "green", l: "Healthy" }, { to: 90, tone: "amber", l: "Caution" }, { to: 110, tone: "red", l: "Danger" }],
    reading: "Caution",
    interpretation:
      "Covered, but with limited room. Five years ago the company paid out 78% and kept 22%. Today it pays out 82% and keeps 18%. The cushion has been getting thinner every year, not thicker.",
    why:
      "A payout above recurring cash generation may require cash reserves, asset sales, new debt or new equity. The payout ratio is an early warning, not proof by itself; confirm the source in the cash-flow statement and supplemental report.",
    action: "Watch this number next quarter. A move above this screening range is a prompt to inspect cash flow and financing, not automatic proof that the dividend is unsafe.",
    verify: { page: "flow", l: "Trace the cash to your pocket" },
    supporting: [["Cash per share", "$1.14"], ["Dividend per share", "$0.94"], ["Coverage", "1.22x"], ["Payout five years ago", "78.3%"]],
  },
  {
    id: "debt", name: "Debt",
    question: "Can the company comfortably pay and refinance what it owes?",
    plainAnswer:
      "Net debt is 6.6 times annual EBITDA. This compares debt with one year of operating earnings; it does not mean the company will literally repay everything in 6.6 years.",
    metricLabel: "Net debt compared with annual EBITDA",
    metricName: "Net debt / EBITDA",
    scope: "Equity REIT · property-sector screening guide",
    compareWith: "Similar REITs, the company's own leverage trend, interest coverage and its maturity schedule",
    value: 6.6, display: "6.6x",
    scale: { min: 3, max: 9 },
    bands: [{ to: 5.5, tone: "green", l: "Healthy" }, { to: 7, tone: "amber", l: "Caution" }, { to: 9, tone: "red", l: "Danger" }],
    reading: "Caution",
    interpretation:
      "This may be workable for a property company, but it leaves less slack than a lower ratio. The ratio alone cannot establish safety. Interest coverage, fixed-versus-floating debt, liquidity and maturity timing determine whether the debt is manageable.",
    why:
      "Debt is repriced all at once when it matures, not gradually. A company can look comfortable for years and then face a step change in interest cost on a single date.",
    action: "Find the maturity schedule and identify the largest year. Here it is 2027, when $180M comes due.",
    verify: { page: "reports", l: "Open the maturity schedule" },
    supporting: [["Total debt", "$918M"], ["Average rate", "4.50%"], ["Interest per year", "$41.3M"], ["Fixed rate share", "90.6%"]],
  },
  {
    id: "risk", name: "Risk",
    question: "What is the clearest threat to future cash flow?",
    plainAnswer:
      "$180M of debt at 3.4% matures in 2027. Comparable borrowing now costs 6.4%. That difference is $5.4M a year of new interest.",
    metricLabel: "Estimated share of modeled AFFO at risk",
    metricName: "Modeled refinancing impact / AFFO",
    scope: "Company-specific stress estimate · not a standard industry ratio",
    compareWith: "Management's refinancing plan, available liquidity and updated market borrowing costs",
    value: 7.6, display: "7.6%",
    scale: { min: 0, max: 25 },
    bands: [{ to: 5, tone: "green", l: "Healthy" }, { to: 15, tone: "amber", l: "Caution" }, { to: 25, tone: "red", l: "Danger" }],
    reading: "Caution",
    interpretation:
      "$5.4M against $71.4M of modeled AFFO is 7.6%, or about $0.086 per share. It is a dated and quantifiable exposure, but the actual impact will depend on the amount refinanced, timing, market rate and management's response.",
    why:
      "The threats worth naming are the ones you can quantify and date. Vague worries about the economy cannot be checked next quarter. This one can.",
    action: "Note the date. If management refinances early or pre-funds the maturity, this risk closes. If 2027 arrives untouched, it lands in full.",
    verify: { page: "reports", l: "Read management's own comment on it" },
    supporting: [["Maturing 2027", "$180M"], ["Current rate", "3.40%"], ["Market rate", "6.40%"], ["Annual impact", "$5.4M"]],
  },
];

export const LEARN_DECISIONS = [
  { k: "reject", l: "Reject", d: "Rule it out and move on", tone: "red", after: "Rejecting early is a legitimate outcome. Most investments should be rejected; the ones that survive six checks deserve the time." },
  { k: "watch", l: "Watch", d: "Revisit at the next report", tone: "amber", after: "Set the trigger now: check the payout ratio and the 2027 maturity when the next quarter is filed." },
  { k: "research", l: "Research further", d: "Verify the conclusion in Analytical Mode", tone: "green", after: "This is the right answer for a company that passed on business and health but showed caution on distribution and debt." },
  { k: "simulate", l: "Simulate ownership", d: "Open a simulated position and monitor it", tone: "green", after: "Analytical Mode will require a written dossier before it records a purchase. That is deliberate." },
];
