import { DOSSIER_FIELDS } from "../data/dossierFields.js";

export function dossierStats(d = {}) {
  const filled = (f) => String(d[f.k] || "").trim().length > 0;
  const total = DOSSIER_FIELDS.length;
  const complete = DOSSIER_FIELDS.filter(filled).length;
  const essentials = DOSSIER_FIELDS.filter((f) => f.essential);
  const essentialsDone = essentials.filter(filled).length;
  return { total, complete, pct: Math.round((complete / total) * 100), essentials: essentials.length, essentialsDone, ready: essentialsDone === essentials.length, missing: essentials.filter((f) => !filled(f)) };
}
