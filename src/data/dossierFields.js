/* ============================================================================
   Investment Dossier field definitions
   ========================================================================== */

export const DOSSIER_FIELDS = [
  { k: "company", label: "Company", essential: true, type: "line", help: "Name and ticker of what you are researching." },
  { k: "whatIOwn", label: "What I own", essential: true, type: "area", help: "Describe the actual assets and claims, not the ticker." },
  { k: "howItMakesMoney", label: "How the company makes money", essential: true, type: "area", help: "Who pays, for what, and on what terms." },
  { k: "whyTheyPay", label: "Why customers continue paying", essential: true, type: "area", help: "Contract, switching cost, location, brand or necessity." },
  { k: "snapshot", label: "Five-year numerical snapshot", essential: true, type: "area", help: "Revenue, cash flow per share, dividend, debt and share count." },
  { k: "strengths", label: "Financial strengths", essential: false, type: "area" },
  { k: "risksMajor", label: "Major risks", essential: true, type: "area", help: "Specific and measurable, not 'the economy'." },
  { k: "debtObligations", label: "Debt and obligations", essential: true, type: "area", help: "Amount, rate, maturity schedule, covenants." },
  { k: "capitalAllocation", label: "Management's capital-allocation record", essential: false, type: "area" },
  { k: "valBear", label: "Bear value per share", essential: true, type: "line" },
  { k: "valBase", label: "Base value per share", essential: true, type: "line" },
  { k: "valBull", label: "Bull value per share", essential: true, type: "line" },
  { k: "marketPrice", label: "Current market price", essential: true, type: "line" },
  { k: "desiredPrice", label: "Desired purchase price", essential: true, type: "line", help: "The price at which your margin of safety is adequate." },
  { k: "positionSize", label: "Intended position size", essential: true, type: "line", help: "In dollars or as a percentage of the portfolio." },
  { k: "returnSource", label: "Expected source of return", essential: true, type: "area", help: "Dividends, growth in cash flow, multiple change, or debt paydown." },
  { k: "addConditions", label: "Conditions for adding", essential: false, type: "area" },
  { k: "sellConditions", label: "Conditions for selling", essential: true, type: "area", help: "Written before you own it, so it survives your own emotions." },
  { k: "disproof", label: "What would prove my thesis wrong", essential: true, type: "area" },
  { k: "evidence", label: "Evidence and report references", essential: false, type: "area", help: "Which statement, which page, which quarter." },
  { k: "decisionDate", label: "Date of decision", essential: false, type: "line" },
];
