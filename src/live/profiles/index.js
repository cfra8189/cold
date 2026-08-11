import { equityReitProfile } from "./equityReitProfile.js";
import { holdingCompanyProfile } from "./holdingCompanyProfile.js";

const PROFILES = {
  "equity-reit": equityReitProfile,
  "diversified-holding-company": holdingCompanyProfile,
};

/** @param {import("../schema/company.js").CompanyType} companyType */
export function profileFor(companyType) {
  const profile = PROFILES[companyType];
  if (!profile) {
    throw new Error(`No metric profile registered for companyType "${companyType}"`);
  }
  return profile;
}

export function isApplicable(profile, metricKey) {
  return profile.applicableMetrics.includes(metricKey);
}

export function notApplicableReason(profile, metricKey) {
  return profile.notApplicableMetrics[metricKey] || null;
}

export { equityReitProfile, holdingCompanyProfile };
