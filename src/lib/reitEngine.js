import { FPT } from "../data/companies.js";

/* ----------------------------------------------------------------------------
   Derived REIT engine: every page calls this so the numbers never drift.
   This engine is specific to equity REITs (FFO/AFFO, NOI, occupancy-driven
   revenue) and must not be reused for BRK or any non-REIT company.
   -------------------------------------------------------------------------- */
export function computeFPT(o = {}) {
  const occupancy = o.occupancy ?? FPT.occupancy;
  const rentPsf = o.rentPsf ?? FPT.rentPsf;
  const opexRatio = o.opexRatio ?? FPT.opexRatio;
  const rate = o.interestRate ?? FPT.interestRate;
  const capex = o.recurringCapex ?? FPT.recurringCapex;
  const shares = FPT.shares;

  const revenue = FPT.sqft * (occupancy / 100) * rentPsf;
  const propertyExpenses = revenue * opexRatio;
  const noi = revenue - propertyExpenses;
  const gna = FPT.gna;
  const ebitda = noi - gna;
  const interest = (FPT.debt * rate) / 100;
  const depreciation = 61.5;
  const netIncome = revenue - propertyExpenses - gna - interest - depreciation;
  const ffo = netIncome + depreciation;
  const affo = ffo - capex;
  const affoPs = affo / shares;
  const dividendTotal = FPT.divPerShare * shares;
  const coverage = dividendTotal === 0 ? 0 : affo / dividendTotal;
  const payout = (FPT.divPerShare / affoPs) * 100;
  const retained = affo - dividendTotal;
  const netDebt = FPT.debt - FPT.cash;
  return {
    occupancy, rentPsf, opexRatio, rate, capex, shares,
    revenue, propertyExpenses, noi, gna, ebitda, interest, depreciation,
    netIncome, epsPs: netIncome / shares, ffo, ffoPs: ffo / shares,
    affo, affoPs, dividendTotal, coverage, payout, retained,
    netDebt, ndEbitda: netDebt / ebitda,
  };
}

export const BASE = computeFPT();
