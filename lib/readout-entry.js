// What the site keeps with each Executive Readout -- OKF-TOGAF#217, on the
// owner's line "Approve #217's plan as 556-CC sets it out with 265-DT2's two
// changes as 557-CC words them -- David Facer 10/19/2026". Plain CommonJS, no
// Next imports, so scripts/readout-entry-self-test.js can load it.
//
// An entry holds the readout text, the scores as the visitor's assessment
// states them, the Exempt reasons in the visitor's own words, the model's
// version recorded when the readout is written, and the day. Nothing kept with
// the readout names the visitor. The Exempt reasons are kept for four days and
// shown in the readout's table, on a link anyone holding it can open.
//
// Entries saved before this change are the readout text alone. They still
// open, and say their scores weren't kept. A request that finds one saves it
// again with the scores the request carries -- the cache key is a hash of
// exactly those scores -- but records the version as not kept: the key
// carries no pin, and the pin may have moved since the text was written
// (265-DT2 section 2). For the same reason a kept readout goes on naming the
// version it was written under after a pin moves. That is right; never read
// the current pin for an entry already kept.
"use strict";

const { extractScores } = require("./score-vector");
const { MODEL_VERSIONS } = require("./pins");

const NO_SCORES = "This readout was saved before scores were kept with it.";
const NO_VERSION = "The model version wasn't kept with this readout.";

// The model's version, by the key the assessment and the readout service use.
function versionFor(model) {
  return Object.prototype.hasOwnProperty.call(MODEL_VERSIONS, model) ? MODEL_VERSIONS[model] : null;
}

// The scores table of the visitor's assessment: each dimension's id, name and
// level, and each Exempt reason. Null when the assessment is incomplete, as
// the readout service refuses it.
const ROW = /^\|\s*(D\d{1,2})\s*\|\s*([^|]*?)\s*\|\s*([A-E]|Pre-AI|Exempt)\s*\|/gm;
function scoresFromMd(md, dimensionCount, opts = {}) {
  const parsed = extractScores(md, dimensionCount, opts);
  if (!parsed) return null;
  const names = new Map();
  let m;
  const re = new RegExp(ROW.source, "gm");
  while ((m = re.exec(md)) !== null) names.set(m[1], m[2]);
  const scores = parsed.vector.map((level, i) => {
    const id = "D" + (i + 1);
    return { id, name: names.get(id) || "", level };
  });
  return { scores, reasons: parsed.reasons };
}

function encodeEntry({ readout, scores, reasons, version, writtenAt }) {
  return JSON.stringify({
    readoutEntry: 1,
    readout,
    scores: scores || null,
    reasons: reasons || {},
    version: version || null,
    // An explicit null is kept: a re-saved entry's day is not known (266-DT2).
    writtenAt: writtenAt === null ? null : writtenAt || new Date().toISOString().slice(0, 10),
  });
}

// A kept entry, or text saved before this change. Null for none.
function decodeEntry(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "string" && raw.startsWith("{\"readoutEntry\":1,")) {
    try {
      const o = JSON.parse(raw);
      if (o && o.readoutEntry === 1 && typeof o.readout === "string") {
        return { readout: o.readout, scores: Array.isArray(o.scores) ? o.scores : null, reasons: o.reasons || {}, version: o.version || null };
      }
    } catch { /* read as text below */ }
  }
  return { readout: String(raw), scores: null, reasons: {}, version: null };
}

// A text-only entry saved again: the scores the request carries; the version
// and the day it was written not kept, since neither is known (265-DT2, 266-DT2).
function upgradeEntry(readoutText, scores, reasons) {
  return encodeEntry({ readout: readoutText, scores, reasons, version: null, writtenAt: null });
}

function versionLine(modelTitle, version) {
  return version ? `Scored against the ${modelTitle} ${version}.` : NO_VERSION;
}

// A level as the table shows it: Exempt carries its reason.
function levelCell(s, reasons) {
  return s.level === "Exempt" && reasons && reasons[s.id] ? `Exempt: ${reasons[s.id]}` : s.level;
}

function downloadMd(entry, modelTitle, repoUrl) {
  let md = "# Executive Readout\n\n";
  md += "## Your scores\n\n";
  if (entry.scores) {
    md += "| Dimension | Name | Level |\n|---|---|---|\n";
    // A "|" in a reason, the visitor's own words, would end the cell early.
    const cell = (x) => String(x).replace(/\|/g, "\\|");
    for (const s of entry.scores) md += `| ${s.id} | ${cell(s.name)} | ${cell(levelCell(s, entry.reasons))} |\n`;
    md += "\n";
  } else {
    md += `*${NO_SCORES}*\n\n`;
  }
  md += `*${versionLine(modelTitle, entry.version)}*\n\n`;
  md += `## The readout\n\n${entry.readout.trim()}\n\n`;
  md += `*${modelTitle} © 2026 David Facer — CC BY 4.0*\n`;
  md += `*Full model: ${repoUrl}*\n`;
  return md;
}

module.exports = { NO_SCORES, NO_VERSION, versionFor, scoresFromMd, encodeEntry, decodeEntry, upgradeEntry, versionLine, levelCell, downloadMd };
