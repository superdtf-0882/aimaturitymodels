// The readout's reading of an assessment file's scores -- OKF-TOGAF#161.
// Moved out of pages/api/diagnostic.js so a plain Node test can load it
// (scripts/threshold-states-self-test.js). Plain CommonJS, no Next imports.
//
// A to E everywhere; Pre-AI and Exempt only where the model defines them
// (thresholdStates: true -- SDLC and EA today). An Exempt dimension carries
// the reason the models require, and the reason is part of the cache key,
// so a readout written for one organisation's reason is never served for
// another's.
"use strict";

const LETTER = /^\|\s*D(\d{1,2})\s*\|[^|]*\|\s*([A-E])\s*\|/gm;
const ANY = /^\|\s*D(\d{1,2})\s*\|[^|]*\|\s*([A-E]|Pre-AI|Exempt)\s*\|/gm;

// { vector: [...], reasons: { D5: "..." } }, or null if any dimension is
// missing, ungraded, outside the model's states, or Exempt with no reason.
function extractScores(md, dimensionCount, { thresholdStates = false } = {}) {
  const re = new RegExp((thresholdStates ? ANY : LETTER).source, "gm");
  const found = new Map();
  let m;
  while ((m = re.exec(md)) !== null) found.set(Number(m[1]), m[2]);
  const vector = [];
  for (let i = 1; i <= dimensionCount; i++) {
    if (!found.has(i)) return null;
    vector.push(found.get(i));
  }
  const reasons = {};
  const block = md.match(/^## Exempt dimensions\n([\s\S]*?)(?=\n---|\n## )/m);
  if (block) {
    for (const line of block[1].split("\n")) {
      const r = line.match(/^- (D\d{1,2}) — [^:]*: (.+)$/);
      if (r) reasons[r[1]] = r[2].trim();
    }
  }
  for (let i = 1; i <= dimensionCount; i++) {
    if (vector[i - 1] === "Exempt" && !isGraded("Exempt", reasons["D" + i])) return null;
  }
  return { vector, reasons };
}

// What the cache key hashes. A-E-only vectors produce exactly the string
// they always did ("AB..."); a threshold state is written by name, and each
// Exempt reason is appended.
function vectorKey(vector, reasons = {}) {
  const base = vector.map((v) => (v.length === 1 ? v : `[${v}]`)).join("");
  const ids = Object.keys(reasons).sort();
  return ids.length ? base + "|" + ids.map((id) => `${id}=${reasons[id]}`).join("|") : base;
}

// Exempt counts as graded only with a reason: the models say an exemption
// without a citable constraint is not Exempt.
function isGraded(score, reason) {
  if (!score) return false;
  if (score === "Exempt") return typeof reason === "string" && reason.trim().length > 0;
  return true;
}

module.exports = { extractScores, vectorKey, isGraded };
