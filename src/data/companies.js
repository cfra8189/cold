/* ============================================================================
   Company data — kept as one source of truth for every page.

   FPT (Foundation Property Trust) is a fictional equity REIT. Its metrics
   (occupancy, AFFO, payout ratio, net debt/EBITDA, cap rate, etc.) are
   property-sector screening measures and must not be applied to BRK.
   BRK (Berkshire Hathaway) is a fictional holding company / diversified
   ordinary stock, valued on entirely different terms (book value, operating
   earnings, insurance float) — it intentionally has no REIT-style fields.
   ========================================================================== */

export const FPT = {
  id: "FPT",
  ticker: "FPT",
  name: "Foundation Property Trust",
  kind: "REIT",
  oneLine: "Owns 84 industrial, grocery-anchored retail and suburban office buildings; collects rent under long leases.",
  price: 19.4,
  priceChangePct: -0.6,
  shares: 62.5, // millions
  sqft: 12.4, // millions leasable
  rentPsf: 16.65,
  occupancy: 96.2,
  divPerShare: 0.94,
  debt: 918.0,
  cash: 48.6,
  gna: 14.2,
  opexRatio: 0.265,
  interestRate: 4.5,
  recurringCapex: 18.9,
  capRate: 6.75,
  explainSimply:
    "Foundation Property Trust owns buildings. Tenants pay rent. The trust pays property expenses, employees, interest, and taxes. The remaining operating cash can be reinvested, used to repay debt, or distributed to shareholders.",
  propertyTypes: [
    { name: "Industrial / logistics", share: 46, note: "38 buildings, 6.9M sf, mostly single-tenant" },
    { name: "Grocery-anchored retail", share: 31, note: "29 centers anchored by regional grocers" },
    { name: "Suburban office", share: 23, note: "17 buildings, the segment management is shrinking" },
  ],
  tenants: [
    { name: "Cardinal Logistics", pctRent: 8.1, expiry: "2027", credit: "BBB" },
    { name: "Harvest Grocers", pctRent: 6.7, expiry: "2031", credit: "BBB+" },
    { name: "Meridian Health Systems", pctRent: 5.2, expiry: "2033", credit: "A-" },
    { name: "TrueNorth Distribution", pctRent: 4.4, expiry: "2029", credit: "BB+" },
    { name: "Statewide Credit Union", pctRent: 3.1, expiry: "2028", credit: "Not rated" },
  ],
  geography: [
    { name: "Southeast", share: 41 },
    { name: "Midwest", share: 27 },
    { name: "Texas", share: 19 },
    { name: "Mid-Atlantic", share: 13 },
  ],
  leaseStructure: [
    "68% triple-net: the tenant pays property taxes, insurance and maintenance directly",
    "32% modified gross: the trust pays some operating costs and recovers part through tenant charges",
    "2.5% average annual rent escalators written into 81% of leases",
  ],
  avgLeaseYears: 6.4,
  revenueSources: [
    { name: "Base rent", amt: 171.2 },
    { name: "Expense recoveries", amt: 21.8 },
    { name: "Percentage rent & parking", amt: 5.4 },
  ],
  moats: [
    "Long leases with contractual escalators make near-term revenue highly predictable",
    "68% triple-net structure pushes tax, insurance and maintenance inflation onto tenants",
    "Grocery-anchored centers keep foot traffic through weak consumer cycles",
    "Industrial assets sit inside three of the ten fastest-growing distribution corridors",
  ],
  risks: [
    { r: "Suburban office (23% of rent) faces structurally lower demand", sev: "high" },
    { r: "$180M of debt matures in 2027 at 3.4% against a 6.4% market rate", sev: "high" },
    { r: "Cardinal Logistics is 8.1% of rent and its lease expires in 2027", sev: "medium" },
    { r: "Payout ratio has climbed from 78% to 82% over five years", sev: "medium" },
    { r: "Share count has grown 15.7% in five years, diluting per-share growth", sev: "medium" },
  ],
  history: [
    { yr: "2021", rev: 158.2, noi: 114.6, affoPs: 0.92, divPs: 0.72, occ: 93.1, ndEbitda: 7.4, shares: 54.0 },
    { yr: "2022", rev: 168.9, noi: 122.8, affoPs: 0.99, divPs: 0.78, occ: 94.4, ndEbitda: 7.1, shares: 56.8 },
    { yr: "2023", rev: 179.4, noi: 131.2, affoPs: 1.05, divPs: 0.84, occ: 95.6, ndEbitda: 6.9, shares: 59.2 },
    { yr: "2024", rev: 189.1, noi: 138.6, affoPs: 1.1, divPs: 0.9, occ: 96.0, ndEbitda: 6.7, shares: 61.0 },
    { yr: "2025", rev: 198.4, noi: 145.8, affoPs: 1.14, divPs: 0.94, occ: 96.2, ndEbitda: 6.6, shares: 62.5 },
  ],
  latestEvent: {
    q: "Q3 2026",
    headline: "Rent escalators added $1.2M; management flagged the 2027 maturity",
    body:
      "Same-property NOI rose 3.1% year over year on contractual escalators. Management disclosed that $180M of unsecured notes carrying 3.4% mature in 2027, and that comparable new debt is pricing near 6.4%.",
  },
  capitalAllocation: [
    { yr: "2021-2025", item: "Dividends paid", amt: "$248M", note: "Grew 5.5% a year, funded from AFFO every year" },
    { yr: "2022-2025", item: "Acquisitions", amt: "$412M", note: "Average entry cap rate 7.1% against a 6.2% cost of capital" },
    { yr: "2023", item: "Equity issued", amt: "$96M at $17.40", note: "Below the trust's own estimated value at the time" },
    { yr: "2024-2025", item: "Office dispositions", amt: "$88M", note: "Sold 4 office buildings at a 6.9% cap rate" },
  ],
};

export const BRK = {
  id: "BRK",
  ticker: "BRK.B",
  name: "Berkshire Hathaway",
  kind: "Holding company",
  oneLine: "Owns insurance operations, a railroad, utilities, manufacturers and a large marketable-securities portfolio.",
  price: 478.2,
  priceChangePct: 0.3,
  shares: 2160, // B-equivalent, millions
  divPerShare: 0,
  explainSimply:
    "Berkshire owns whole businesses and pieces of other businesses. Insurance customers pay premiums up front and claims are paid later, so Berkshire holds that money in the meantime and invests it. Profits are almost never paid out; they are reinvested or used to buy back stock.",
  bookPerShare: 302.4,
  opEarnings: 47.2, // $B TTM
  cashTbills: 189.0, // $B
  float: 174.0, // $B
  segments: [
    { name: "Insurance (GEICO, Gen Re, BH Primary)", share: 31 },
    { name: "BNSF Railway", share: 17 },
    { name: "Berkshire Hathaway Energy", share: 15 },
    { name: "Manufacturing, service & retail", share: 26 },
    { name: "Investment & derivative gains", share: 11 },
  ],
  moats: [
    "Insurance float of $174B is capital that costs less than nothing in most years",
    "Decentralised structure keeps overhead near zero for a company of this size",
    "Regulated utility and rail assets earn steady returns on very large reinvestment",
  ],
  risks: [
    { r: "Size makes any single acquisition immaterial to the whole", sev: "high" },
    { r: "Succession beyond the current management generation", sev: "high" },
    { r: "Reported earnings swing violently with marked-to-market equity holdings", sev: "medium" },
  ],
};

export const COMPANIES = { FPT, BRK };
