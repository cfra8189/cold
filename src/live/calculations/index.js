import * as reitCalculations from "./reitCalculations.js";
import * as holdcoCalculations from "./holdcoCalculations.js";
import { profileFor } from "../profiles/index.js";

const ENGINES = {
  "equity-reit": reitCalculations,
  "diversified-holding-company": holdcoCalculations,
};

/**
 * Returns only the calculation functions the given company type's profile
 * allows, so a page can never accidentally call a REIT calculation for a
 * holding company (or vice versa) even by mistake.
 * @param {import("../schema/company.js").CompanyType} companyType
 */
export function calculationsFor(companyType) {
  const profile = profileFor(companyType);
  const engine = ENGINES[companyType];
  const allowed = {};
  for (const name of profile.allowedCalculations) {
    if (typeof engine[name] === "function") allowed[name] = engine[name];
  }
  return allowed;
}

export { reitCalculations, holdcoCalculations };
