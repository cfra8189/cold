/* ============================================================================
   Cold Score — knowledge-check quiz
   ========================================================================== */

export const QUIZ = [
  { cat: "cashFlow", q: "Net income was $7.5M this quarter but cash from operations was $23.7M. What explains most of the gap?",
    a: ["Depreciation of $15.6M reduced profit but no cash left the company", "The trust collected rent early", "Dividends are added back to cash flow", "Interest was capitalised"], correct: 0,
    why: "Depreciation is an accounting charge, not a payment. For property owners it is the single largest reason profit understates cash." },
  { cat: "financial", q: "$180M of debt at 3.40% matures in 2027. Comparable new debt prices at 6.40%. What is the annual interest impact?",
    a: ["About $1.8M", "About $5.4M", "About $11.5M", "None until 2029"], correct: 1,
    why: "$180M multiplied by the 3.0-point increase equals $5.4M a year, or $0.086 per share against 62.5M shares." },
  { cat: "value", q: "The share price falls 18% while AFFO per share rises 3% and occupancy is unchanged. What changed?",
    a: ["The business deteriorated", "The financial condition weakened", "Only the market price", "The estimated value fell 18%"], correct: 2,
    why: "Nothing measurable about the trust moved. You are being offered the same cash flows at a lower price." },
  { cat: "business", q: "Under a triple-net lease, who normally pays property taxes, insurance and maintenance?",
    a: ["The landlord", "The tenant", "Split evenly", "The mortgage lender"], correct: 1,
    why: "The tenant pays them directly, which is why 68% triple-net exposure makes FPT's cash flow far more predictable." },
  { cat: "risk", q: "The payout ratio is 82% and AFFO per share then falls 14%. What happens to dividend coverage?",
    a: ["It stays at 1.22x", "It rises", "It falls to roughly 1.04x, close to the point where the dividend is not earned", "It becomes irrelevant"], correct: 2,
    why: "A thin cushion converts an ordinary operating problem into a dividend problem. That is why the payout trend matters more than the yield." },
  { cat: "cashFlow", q: "Where does $4.7M of recurring capital expenditure appear, and what does it affect?",
    a: ["Income statement, reducing net income", "Cash flow statement, reducing cash available to owners", "Balance sheet only, with no cash effect", "It is not reported"], correct: 1,
    why: "It never touches profit, but it is real money spent before any dividend can be paid. Ignoring it is how REIT payouts get overstated." },
];
