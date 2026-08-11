/* ============================================================================
   Simulation — quarterly events, decision options, classification keys
   ========================================================================== */

export const CHANGE_KEYS = [
  { k: "business", l: "The operating business", d: "What tenants pay, how much space is leased, what the buildings earn." },
  { k: "financials", l: "The financial condition", d: "Cash, debt, interest, coverage, obligations." },
  { k: "value", l: "The estimated value", d: "The present worth of the cash the business will produce." },
  { k: "priceOnly", l: "The market price only", d: "The quote changed. Nothing about the business did." },
];

export const EVENTS = [
  {
    q: "Q4 2026", title: "Occupancy falls from 96% to 89%",
    body: "TrueNorth Distribution vacated 380,000 square feet at lease end and a grocery anchor downsized. Occupancy fell to 89.1%. Management expects 12 to 18 months to backfill the industrial space.",
    figures: [["Occupancy", "96.2% → 89.1%"], ["Annualised revenue", "$198.4M → $183.7M"], ["AFFO per share", "$1.14 → $0.98"], ["Dividend coverage", "1.22x → 1.04x"]],
    truth: { business: true, financials: true, value: true, priceOnly: false },
    teach: "Revenue fell 7.4% but AFFO per share fell 14.0%. Property costs barely moved, so the entire shortfall landed on owner cash. Coverage of 1.04x means the dividend is now earned by four cents on the dollar.",
    sound: ["reduce", "hold"], why: "Either holding while you watch the backfill or trimming on thinner coverage is defensible. Adding here requires you to argue the market has overreacted to a real deterioration.",
  },
  {
    q: "Q1 2027", title: "Interest rates rise before the refinancing",
    body: "The $180M of unsecured notes at 3.40% mature in 14 months. Comparable issuance now prices at 6.40%. Nothing about the buildings has changed.",
    figures: [["Debt repricing", "$180M at 3.4% → 6.4%"], ["Added annual interest", "+$5.4M"], ["AFFO per share", "$1.14 → $1.06"], ["Coverage", "1.22x → 1.13x"]],
    truth: { business: false, financials: true, value: true, priceOnly: false },
    teach: "The tenants, the leases and the rent are untouched, so the business did not change. What changed is the cost of the capital sitting underneath it, and that reduces the cash reaching owners permanently until rates fall again.",
    sound: ["hold", "reduce"], why: "This is a known, dated, quantifiable hit. The test is whether the price already reflects $0.086 per share of lost AFFO.",
  },
  {
    q: "Q2 2027", title: "A major tenant leaves",
    body: "Cardinal Logistics confirmed it will not renew at expiry in nine months. It represents 8.1% of annualised base rent across two distribution buildings.",
    figures: [["Rent at risk", "$16.1M, 8.1% of total"], ["Re-lease assumption", "9 to 15 months"], ["Market rent vs in-place", "+6% if re-leased"], ["AFFO per share, gap year", "$1.14 → $0.92"]],
    truth: { business: true, financials: true, value: true, priceOnly: false },
    teach: "Concentration converts from a statistic into a cash-flow event. The correct question is not whether it hurts, but whether the space re-leases and at what rent. If market rent is 6% above in-place rent, the permanent damage is far smaller than the temporary damage.",
    sound: ["hold", "add", "reduce"], why: "A defensible answer separates the gap year from the steady state. If you can show the steady-state AFFO is close to unchanged, adding on weakness is coherent.",
  },
  {
    q: "Q3 2027", title: "Rent revenue increases",
    body: "640,000 square feet renewed at rents 12% above expiring levels, and contractual escalators added $1.4M. Same-property NOI rose 4.8%.",
    figures: [["Renewal spread", "+12.0%"], ["Added NOI", "+$2.9M"], ["AFFO per share", "$1.14 → $1.18"], ["Coverage", "1.22x → 1.26x"]],
    truth: { business: true, financials: true, value: true, priceOnly: false },
    teach: "This is the quietest and most important kind of event. Market rent above in-place rent means every future expiry becomes an opportunity rather than a threat. It raises value more than the 3.5% AFFO increase suggests, because it repeats.",
    sound: ["add", "hold"], why: "Improving business plus unchanged price means a wider margin of safety. Selling here needs a valuation argument, not a business one.",
  },
  {
    q: "Q4 2027", title: "Management raises the dividend",
    body: "The Board increased the quarterly distribution 8%, from $0.235 to $0.254 per share. AFFO per share was flat at $1.14 for the year.",
    figures: [["Dividend per share", "$0.94 → $1.016"], ["Payout ratio", "82.4% → 89.1%"], ["AFFO per share", "$1.14, unchanged"], ["Retained cash", "$12.6M → $8.0M"]],
    truth: { business: false, financials: true, value: false, priceOnly: false },
    teach: "No new cash was created. The same $1.14 is simply divided differently, with more paid out and $4.6M less retained for debt repayment and reinvestment. Your income rose and the company's cushion fell. A higher dividend is a capital-allocation decision, not business improvement.",
    sound: ["hold", "reduce"], why: "The disciplined answer notes that value is roughly unchanged while risk rose. Treating a dividend increase as good news by itself is the exact reflex COLD is built to remove.",
  },
  {
    q: "Q1 2028", title: "The share price falls while AFFO improves",
    body: "The share price fell 18% to $15.90 over six weeks on sector-wide selling. AFFO per share rose 3% and occupancy is unchanged at 96.4%.",
    figures: [["Share price", "$19.40 → $15.90"], ["AFFO per share", "$1.14 → $1.17"], ["Dividend yield", "4.85% → 5.91%"], ["AFFO multiple", "17.0x → 13.6x"]],
    truth: { business: false, financials: false, value: false, priceOnly: true },
    teach: "Nothing measurable about the trust changed. You are being offered the same cash flows for 18% less money. This is the single most valuable scenario in COLD, because the correct answer feels wrong to almost everyone the first time.",
    sound: ["add", "buy", "hold"], why: "Adding is coherent if your estimated value is unchanged and position sizing allows it. Selling here means you were tracking the price, not the business.",
  },
  {
    q: "Q2 2028", title: "Earnings rise while operating cash flow weakens",
    body: "Net income rose 14% year over year, but cash from operations fell 9%. Receivables and straight-line rent increased $8.6M, and one tenant is 62 days past due on $2.4M.",
    figures: [["Net income", "+14.0%"], ["Cash from operations", "-9.0%"], ["Receivables", "$22.4M → $31.0M"], ["Past-due rent", "$2.4M at 62 days"]],
    truth: { business: true, financials: true, value: false, priceOnly: false },
    teach: "Profit is an opinion; cash is a fact. Revenue is being recorded before it is collected. Until you know whether that tenant pays, the reported earnings improvement is an accounting result, not an owner result. Value is not yet impaired, but the quality of the reported numbers is.",
    sound: ["hold"], why: "The right move here is usually investigation, not transaction. A decision to hold with a stated trigger for the next quarter is stronger than any trade.",
  },
  {
    q: "Q3 2028", title: "The company issues additional shares",
    body: "The trust issued 6.2M shares at $18.10, raising $112M to fund an acquisition pipeline. Your estimated value at the time was $20.60.",
    figures: [["Shares outstanding", "62.5M → 68.7M"], ["Issue price vs your estimate", "$18.10 vs $20.60"], ["Your ownership", "0.0019% → 0.0017%"], ["AFFO per share, undeployed", "$1.14 → $1.04"]],
    truth: { business: false, financials: true, value: true, priceOnly: false },
    teach: "Selling ownership below what you believe it is worth transfers value from existing owners to new ones. The proceeds must be deployed above the trust's cost of capital simply to get back to even. Total AFFO will rise; AFFO per share is the number to watch.",
    sound: ["hold", "reduce"], why: "A strong answer quantifies the dilution and states what deployment yield would make the issuance acceptable.",
  },
  {
    q: "Q4 2028", title: "Management acquires properties using debt",
    body: "The trust acquired $210M of industrial assets at a 7.3% entry cap rate, funded entirely with debt priced at 6.1%.",
    figures: [["Added NOI", "+$15.3M"], ["Added interest", "-$12.8M"], ["Net gain to owners", "+$2.5M, $0.04 / share"], ["Net debt to EBITDA", "6.6x → 7.3x"]],
    truth: { business: true, financials: true, value: true, priceOnly: false },
    teach: "The spread between a 7.3% cap rate and 6.1% debt is real but thin. You gained four cents per share and took leverage from 6.6x to 7.3x to get it. Ask whether $0.04 is adequate payment for that much additional risk. Frequently it is not.",
    sound: ["hold", "reduce"], why: "Judging capital allocation on the spread and the leverage together, rather than on the headline growth, is the point of this scenario.",
  },
  {
    q: "Q1 2029", title: "A recession reduces tenant demand",
    body: "Regional industrial vacancy rose from 6.2% to 9.8%. Renewal spreads turned negative at -7%. 22% of leases expire within 24 months.",
    figures: [["Market vacancy", "6.2% → 9.8%"], ["Renewal spreads", "+8.4% → -7.0%"], ["Leases expiring by 2031", "22% of rent"], ["AFFO per share, modelled", "$1.14 → $1.02"]],
    truth: { business: true, financials: true, value: true, priceOnly: false },
    teach: "Negative renewal spreads reverse the mechanism that made the last five years work. Long leases delay the damage rather than preventing it, so the effect arrives gradually across the expiration schedule. This is where lease term stops being a statistic and becomes protection you can measure in years.",
    sound: ["hold", "reduce", "add"], why: "Every answer is defensible if it is quantified. The unacceptable answer is one with no number in it.",
  },
];

export const DECISIONS = [
  { k: "buy", l: "Buy", d: "Open a position" }, { k: "add", l: "Add", d: "Increase an existing position" },
  { k: "hold", l: "Hold", d: "No transaction, thesis unchanged" }, { k: "reduce", l: "Reduce", d: "Trim the position" },
  { k: "sell", l: "Sell", d: "Exit entirely" }, { k: "reject", l: "Reject", d: "Rule the investment out" },
];
