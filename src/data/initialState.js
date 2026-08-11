/* ============================================================================
   Initial simulated state
   ========================================================================== */

export const INITIAL_STATE = {
  cash: 77782.0,
  positions: {
    FPT: { shares: 1200, cost: 18.75, dividends: 282.0, thesis: "Intact", opened: "12 Feb 2026" },
  },
  understanding: { own: true, pays: true, where: true, reaches: true, why: false, debt: false, price: false, sell: false },
  scores: { business: 72, cashFlow: 64, financial: 58, value: 46, risk: 51 },
  quarter: 0,
  log: [],
  quizRuns: 0,
  learnStep: 0,
  learnDecision: null,
  learnComplete: false,
  dossiers: {
    FPT: {
      company: "Foundation Property Trust (FPT)",
      whatIOwn:
        "0.0019% of 84 buildings totalling 12.4M leasable square feet, and the leases attached to them, after $918M of debt is served.",
      howItMakesMoney:
        "Tenants pay base rent of $171.2M plus $21.8M of expense recoveries under leases averaging 6.4 years, 68% of them triple-net.",
      whyTheyPay:
        "They are contractually obliged, and relocation costs a logistics tenant far more than the annual escalator.",
      snapshot: "",
      strengths: "AFFO has covered the dividend in all five years. Net debt to EBITDA improved from 7.4x to 6.6x.",
      risksMajor: "",
      debtObligations: "",
      capitalAllocation: "",
      valBear: "", valBase: "", valBull: "", marketPrice: "19.40",
      desiredPrice: "", positionSize: "", returnSource: "",
      addConditions: "", sellConditions: "", disproof: "", evidence: "", decisionDate: "",
    },
    BRK: {},
  },
};
