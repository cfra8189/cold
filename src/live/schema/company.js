/* ============================================================================
   Normalized company profile
   ========================================================================== */

/** @typedef {"equity-reit"|"diversified-holding-company"} CompanyType */

export const COMPANY_TYPES = Object.freeze(["equity-reit", "diversified-holding-company"]);

/**
 * @typedef {Object} NormalizedCompanyProfile
 * @property {string} ticker
 * @property {string} cik                CIK, zero-padded to 10 digits
 * @property {string} name
 * @property {CompanyType} companyType    drives metric-profile and calculation-engine selection
 * @property {string} exchange
 * @property {string} description         short, paraphrased — not copied from source documents
 * @property {import("./provenance.js").Provenance} provenance
 * @property {string} retrievedAt         ISO date COLD captured this profile
 */
