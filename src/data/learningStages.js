/* ============================================================================
   App-level constants — the eight questions, learning stages, Cold Score
   ========================================================================== */

export const EIGHT_QUESTIONS = [
  { id: "own", q: "What do I own?", hint: "84 buildings, 12.4M square feet, and the leases attached to them." },
  { id: "pays", q: "Who pays the business?", hint: "Tenants. The five largest supply 27.5% of rent." },
  { id: "why", q: "Why do they continue paying?", hint: "Contracted leases averaging 6.4 years, plus relocation cost and location." },
  { id: "where", q: "Where does the money go?", hint: "Property expenses, overhead, interest, then capital spending on the buildings." },
  { id: "reaches", q: "What reaches the owner?", hint: "$1.14 of AFFO per share, of which $0.94 is paid as dividends." },
  { id: "debt", q: "What debt supports or threatens it?", hint: "$918M at 4.5%, with $180M repricing in 2027." },
  { id: "price", q: "What assumptions justify the price?", hint: "$19.40 implies a 17.0x AFFO multiple and a 7.0% cap rate on the assets." },
  { id: "sell", q: "What would make me sell?", hint: "Coverage below 1.0x, office above 30% of rent, or price far above value." },
];

export const LEARNING_STAGES = [
  { n: 1, name: "Guided Simulation", desc: "Simplified reports, definitions, explanations and hints.", state: "active" },
  { n: 2, name: "Independent Simulation", desc: "Realistic reports and prices. No hints, no definitions.", state: "locked", unlock: "Reach Analyzing on all five Cold Score categories" },
  { n: 3, name: "Live-Market Simulation", desc: "Real company filings and market data, simulated money.", state: "locked", unlock: "Complete 8 simulated quarters with sound reasoning" },
  { n: 4, name: "Real Ownership", desc: "The same research and monitoring process, connected to a brokerage account.", state: "locked", unlock: "Reach COLD on one company and file a complete dossier" },
];

export const SCORE_CATS = [
  { k: "business", name: "Business", asks: "Can you explain how the company earns money?" },
  { k: "cashFlow", name: "Cash Flow", asks: "Can you trace money from customers to owners?" },
  { k: "financial", name: "Financial Strength", asks: "Can you evaluate cash, debt and obligations?" },
  { k: "value", name: "Value", asks: "Can you separate value from market price?" },
  { k: "risk", name: "Risk", asks: "Can you explain exactly what could interrupt returns?" },
];

export const EVIDENCE = {
  business: [
    "Name the three property segments and their share of rent without notes",
    "Explain what a triple-net lease shifts to the tenant",
    "State the top five tenants and their combined share of rent",
  ],
  cashFlow: [
    "Reconcile net income of $28.8M to AFFO of $71.4M unaided",
    "Explain why recurring capital spending never appears on the income statement",
    "Calculate dividend coverage from the cash-flow statement",
  ],
  financial: [
    "State net debt, weighted average rate and the 2027 maturity from memory",
    "Compute the interest impact of refinancing $180M from 3.4% to 6.4%",
    "Explain what net debt to EBITDA of 6.6x means in plain language",
  ],
  value: [
    "Produce a bear, base and bull value without opening the workbench",
    "Explain what the current $19.40 price assumes about growth",
    "Distinguish a 12% price fall from a 12% fall in value",
  ],
  risk: [
    "Name the three events that would break your thesis",
    "Quantify the AFFO effect of occupancy falling to 89%",
    "Explain how share issuance can reduce your return while total profit rises",
  ],
};

export const UNDERSTANDING_STAGES = ["Unfamiliar", "Introduced", "Following", "Analyzing", "Independent", "COLD"];
export function stageFor(avg) {
  if (avg < 20) return 0;
  if (avg < 40) return 1;
  if (avg < 55) return 2;
  if (avg < 70) return 3;
  if (avg < 85) return 4;
  return 5;
}

export const THESIS_STATES = {
  Intact: { tone: "green", d: "The reasons you bought still hold." },
  Strengthening: { tone: "green", d: "Evidence has improved beyond your original case." },
  Watch: { tone: "amber", d: "One assumption is drifting. Verify at the next report." },
  Weakened: { tone: "amber", d: "A core assumption is no longer supported." },
  Broken: { tone: "red", d: "A stated sell condition has occurred." },
};
