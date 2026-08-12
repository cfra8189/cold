/* ============================================================================
   Provenance — where a value came from. No timestamps live here: every
   timestamp (asOf / retrievedAt / calculatedAt / reviewedAt) lives on the
   metric envelope itself (see metric.js) so each has exactly one meaning
   and nothing is duplicated between the two.
   ========================================================================== */

/**
 * @typedef {Object} Provenance
 * @property {string} source                human name, e.g. "SEC EDGAR", "Realty Income Q2 2026 Earnings Supplemental"
 * @property {"sec-filing"|"market-data-provider"|"company-supplemental"|"manual-entry"|"internal-calculation"} sourceType
 * @property {string} [documentType]         "10-K" | "10-Q" | "8-K" | "supplemental" | "press-release"
 * @property {string} [documentUrl]          direct link to the primary source document — must have been fetched and
 *                                            read directly, not merely cited by a secondary summary
 * @property {string} [filingReferenceUrl]   an additional SEC filing reference for the same information (e.g. the
 *                                            8-K exhibit a company-published PDF was also furnished as). Secondary
 *                                            only — never used in place of a verified documentUrl, and not itself
 *                                            guaranteed to have been fetch-verified the way documentUrl was.
 * @property {string} [companyDefinitionNote] required for company-defined non-GAAP measures (e.g. reported AFFO):
 *                                             a short paraphrase of how the company itself defines/reconciles the figure
 * @property {string} [secConcept]           the exact us-gaap XBRL concept name a SEC-sourced value was read from
 *                                            (e.g. "Revenues") — preserved so the mapping is auditable, never hidden
 * @property {string} [secUnit]              the exact SEC unit the concept was tagged with (e.g. "USD", "USD/shares")
 * @property {string} [accessionNumber]      the SEC accession number the value was tied to
 * @property {string} [filedDate]            the date SEC received the filing that value came from
 * @property {string} [secFrame]             the SEC XBRL "frame" identifier (e.g. "CY2026Q2"), when present
 */

export const SOURCE_TYPES = Object.freeze([
  "sec-filing",
  "market-data-provider",
  "company-supplemental",
  "manual-entry",
  "internal-calculation",
]);
