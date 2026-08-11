/* ============================================================================
   Structural guard: nothing under src/live may import the fictional data
   modules or the fictional REIT engine. This is enforced by static analysis
   of every import specifier under src/live, not by convention.
   ========================================================================== */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const liveDir = path.dirname(fileURLToPath(import.meta.url));

const FORBIDDEN = [
  "data/companies.js",
  "data/checks.js",
  "data/simulationEvents.js",
  "lib/reitEngine.js",
];

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) files = files.concat(walk(full));
    else if (/\.(js|jsx)$/.test(entry)) files.push(full);
  }
  return files;
}

function importSpecifiers(source) {
  const specs = [];
  const importRe = /import\s+(?:[^'"]*?from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(source))) specs.push(m[1]);
  return specs;
}

test("no file under src/live imports a forbidden fictional module", () => {
  const files = walk(liveDir);
  assert.ok(files.length > 5, "expected to find LIVE source files to scan");

  const offenders = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const spec of importSpecifiers(source)) {
      for (const forbidden of FORBIDDEN) {
        if (spec.includes(forbidden)) {
          offenders.push(`${path.relative(liveDir, file)} imports "${spec}"`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], "src/live must never import fictional data/engine modules:\n" + offenders.join("\n"));
});

test("src/live files only import shared primitives/format helpers from outside src/live, or relative live modules", () => {
  const files = walk(liveDir);
  const allowedExternalPrefixes = [
    "react",
    "../../components/primitives.jsx",
    "../../components/primitives",
    "../../lib/format.js",
    "../../lib/format",
  ];
  const suspicious = [];
  for (const file of files) {
    if (file.endsWith(".test.js")) continue;
    const source = readFileSync(file, "utf8");
    for (const spec of importSpecifiers(source)) {
      const isRelativeWithinLive = spec.startsWith("./") || spec.startsWith("../") ? !spec.includes("../../") || allowedExternalPrefixes.some((p) => spec.includes(p)) : true;
      const isJsonFixture = spec.endsWith(".json");
      if (!isRelativeWithinLive && !isJsonFixture && !allowedExternalPrefixes.some((p) => spec === p || spec.startsWith(p))) {
        suspicious.push(`${path.relative(liveDir, file)} imports "${spec}"`);
      }
    }
  }
  assert.deepEqual(suspicious, [], "unexpected external import from src/live:\n" + suspicious.join("\n"));
});
