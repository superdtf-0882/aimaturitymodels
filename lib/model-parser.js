#!/usr/bin/env node
// The family parser (STD-MODEL-PARTS §2, §5.2, §7.2; OKF-TOGAF#205). One reader for a
// maturity model's matrix, its shared layer, and the family file, resolving each to the
// one shape the standard names. The release check proves a model against it; the site
// vendors the same file. It is carried into every model repository byte for byte, as
// the licence and the release check are, so there is one copy of how a model is read.
//
// It reads the three prose dialects the family writes today -- Product Marketing's (the
// common form, §5.2), EA's and SDLC's, and the shared layer's -- and resolves the same
// words in any of them to the same content, which is what lets a dialect move be
// text-neutral (§6). A table model is named as one and not read further: its dimensions
// move to prose in its own migration release (§5.1, §8).
//
// Text is verbatim (§2 rule i): marks kept, a paragraph's hard wraps joined by one space,
// nothing else normalized. Only the markers are removed.
//
// It needs nothing installed. As a command it prints the shape of one file:
//   node tools/model-parser.js <file.md> [--json]
"use strict";
const fs = require("fs");

const LEVELS = ["A", "B", "C", "D", "E"];
const STEPS = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]];

// The markers, by dialect.
const LEVEL_COMMON = /^### ([A-E]) — (.+)$/;
const LEVEL_EA = /^\*\*Level ([A-E]) — ([^*]+)\*\*$/;
const LEVEL_LAYER = /^\*\*Level ([A-E])\*\*$/;
const TRANS_EA = /^\*\*Transition ([A-E]) → ([A-E])(?: — (.+?))?\*\*$/;
const TRANS_FROM = /^\*\*Transition from ([A-E]) to ([A-E])\*\*(?: — (.+))?$/;
const VERIFICATION = /^\*\*Verification:\*\*\s*([\s\S]*)$/;
const SUSTAIN_LINE = /^\*\*Sustainment:\*\*\s*([\s\S]*)$/;
const SUSTAIN_HEAD = /^\*\*Sustainment\*\*$/;
const VANTAGE = /^\*\*Vantage:\*\*\s*([\s\S]*)$/;
const EVIDENCE = /^\*\*Indicative evidence:\*\*\s*([\s\S]*)$/;
const STATUS = /^\*\*Status:\*\*\s*([\s\S]*)$/;
const BASIS = /^\*\*Basis:\*\*\s*([\s\S]*)$/;
const DEFINITION_LINE = /^\*\*Definition:\*\*\s*([\s\S]*)$/;
const HEADING = /^(#{1,6}) (.*)$/;
const DIM_ONE = /^D(\d+)\. (.*)$/;
const DIM_RANGE = /^D(\d+)[–-]D(\d+)\. (.*)$/;
const MATRIX_VERSION = /^\*\*Version (\d+\.\d+\.\d+) — (\d{4}-\d{2}-\d{2})/;
const OWN_VERSION = /^\*\*(STD-[A-Z0-9-]+) · v(\d+(?:\.\d+)*) · (\d{4}-\d{2}-\d{2})\*\*/;
const NAMES_LINE = /^A — \S+ · B — \S+ · C — \S+ · D — \S+ · E — \S+$/;
// §4A's two one-line ways (the line forms are CC's proposal, 408-CC, for the standard's
// next version): a named source at a tag, read at its address; or A to E only.
const THRESHOLD_SOURCE = /^\*\*Pre-AI and Exempt:\*\* (STD-[A-Z0-9-]+)'s text at (v\d+\.\d+\.\d+), github\.com\/superdtf-0882\/(ai-native-[a-z0-9-]+-maturity-model)\.?$/;
const THRESHOLD_NONE = /^\*\*Pre-AI and Exempt:\*\* none; this model scores A to E only\.$/;

// Paragraphs: runs of lines between blank lines, a heading or a rule always its own. Each
// paragraph's lines are joined by one space, a wrapped line's indent dropped (§2 rule i). A
// list item starts its own paragraph, so two items merged onto one line read as a difference
// rather than as the same words (420-CC, on 219-DT2).
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
function paragraphs(lines) {
  const out = [];
  let cur = [];
  const flush = () => { if (cur.length) out.push(cur.map((l, i) => (i ? l.trim() : l.replace(/\s+$/, ""))).join(" ")); cur = []; };
  for (const line of lines) {
    if (!line.trim()) { flush(); continue; }
    if (HEADING.test(line) || /^-{3,}$/.test(line.trim())) { flush(); out.push(line.trim()); continue; }
    if (/^\|/.test(line)) { flush(); out.push(line); continue; }
    if (LIST_ITEM.test(line)) flush();
    cur.push(line);
  }
  flush();
  return out;
}

function headings(lines) {
  const out = [];
  lines.forEach((l, i) => { const m = HEADING.exec(l); if (m) out.push({ i, level: m[1].length, text: m[2].trim() }); });
  return out;
}

// The lines under a heading, up to the next heading of the same or a higher level.
function section(lines, hs, h) {
  const next = hs.find((x) => x.i > h.i && x.level <= h.level);
  return lines.slice(h.i + 1, next ? next.i : lines.length);
}

// A dimension's lines also end at a horizontal rule: EA's matrix closes its last dimension
// with one and opens its boundaries under lower headings ("### D1 / D2"), which would
// otherwise read as sustainment. No model at its tag puts a rule inside a dimension.
function dimensionBlock(lines, hs, h) {
  const s = section(lines, hs, h);
  const r = s.findIndex((l) => /^-{3,}\s*$/.test(l));
  return r < 0 ? s : s.slice(0, r);
}

function parseDimension(id, name, block) {
  const d = {
    id, name, definition: null, status: "native", basis: null, rendered: null,
    levels: {}, transitions: {}, verificationInto: {}, sustainment: null, vantage: null,
    indicativeEvidence: null, readingNotes: null, dialect: null,
  };
  const problems = [];
  const levelParas = {};
  const transParas = {};
  const sustainParas = [];
  const notes = [];
  const marks = new Set();
  let cur = null;
  let table = false;
  for (const p of paragraphs(block)) {
    if (/^-{3,}$/.test(p)) continue;
    if (/^\|/.test(p)) { table = true; continue; }
    let m;
    if (d.definition === null && cur === null && /^\*[^*]/.test(p) && /[^*]\*$/.test(p)) { d.definition = p.slice(1, -1); continue; }
    if ((m = DEFINITION_LINE.exec(p)) && d.definition === null) { d.definition = m[1]; continue; }
    if ((m = STATUS.exec(p))) { d.status = /inherited/i.test(m[1]) && /by reference/i.test(m[1]) ? "inherited" : "native"; d.statusText = m[1]; continue; }
    if ((m = BASIS.exec(p))) { d.basis = { text: m[1] }; continue; }
    if ((m = LEVEL_COMMON.exec(p)) || (m = LEVEL_EA.exec(p)) || (m = LEVEL_LAYER.exec(p))) {
      marks.add(LEVEL_COMMON.test(p) ? "common" : LEVEL_EA.test(p) ? "ea" : "layer");
      cur = { kind: "level", L: m[1] };
      levelParas[m[1]] = levelParas[m[1]] || [];
      continue;
    }
    if ((m = TRANS_EA.exec(p)) || (m = TRANS_FROM.exec(p))) {
      const key = m[1] + "-" + m[2];
      cur = { kind: "transition", key };
      transParas[key] = { title: m[3] ? m[3].trim() : null, text: [], verification: [] };
      continue;
    }
    if ((m = VERIFICATION.exec(p))) {
      if (cur && cur.kind === "transition") { transParas[cur.key].verification.push(m[1]); cur = { kind: "verification", key: cur.key }; }
      else problems.push(id + ": a verification line outside a transition");
      continue;
    }
    if ((m = SUSTAIN_LINE.exec(p))) { sustainParas.push(m[1]); cur = { kind: "sustainment" }; continue; }
    if (SUSTAIN_HEAD.test(p)) { cur = { kind: "sustainment" }; continue; }
    if ((m = VANTAGE.exec(p))) { d.vantage = m[1]; cur = { kind: "vantage" }; continue; }
    if ((m = EVIDENCE.exec(p))) {
      if (cur && cur.kind === "level") { d.indicativeEvidence = d.indicativeEvidence || {}; d.indicativeEvidence[cur.L] = m[1]; }
      continue;
    }
    if (!cur) { notes.push(p); continue; }
    if (cur.kind === "level") levelParas[cur.L].push(p);
    else if (cur.kind === "transition") transParas[cur.key].text.push(p);
    else if (cur.kind === "verification") transParas[cur.key].verification.push(p);
    else if (cur.kind === "sustainment") sustainParas.push(p);
    else if (cur.kind === "vantage") d.vantage += "\n\n" + p;
  }
  if (notes.length) d.readingNotes = notes.join("\n\n");
  if (table) {
    d.dialect = "table";
    problems.push(id + ": table form; not read further until its migration release (STD-MODEL-PARTS §5.1, §8)");
    return { d, problems };
  }
  d.dialect = marks.size === 1 ? [...marks][0] : marks.size ? "mixed" : null;
  if (marks.size > 1) problems.push(id + ": level markers in more than one dialect: " + [...marks].join(", "));
  for (const L of LEVELS) {
    const ps = levelParas[L];
    if (!ps || !ps.length) { problems.push(id + ": no level " + L); continue; }
    if (L === "E" && ps.length > 1 && d.vantage === null) { d.levels.E = ps[0]; d.vantage = ps.slice(1).join("\n\n"); }
    else d.levels[L] = ps.join("\n\n");
  }
  for (const [a, b] of STEPS) {
    const key = a + "-" + b;
    const t = transParas[key];
    if (!t) { problems.push(id + ": no transition " + key); continue; }
    if (!t.text.length) problems.push(id + ": transition " + key + " has no text");
    if (!t.verification.length) problems.push(id + ": transition " + key + " has no verification");
    d.transitions[key] = { title: t.title, text: t.text.join("\n\n"), verification: t.verification.length ? t.verification.join("\n\n") : null };
    d.verificationInto[b] = d.transitions[key].verification;
  }
  if (sustainParas.length) d.sustainment = sustainParas.join("\n\n");
  else problems.push(id + ": no sustainment");
  if (d.definition === null) problems.push(id + ": no definition");
  if (d.status === "inherited") d.rendered = LEVELS.some((L) => d.levels[L]);
  return { d, problems };
}

function parseModel(input) {
  const lines = String(input).replace(/\r\n/g, "\n").split("\n");
  const hs = headings(lines);
  const out = {
    title: null, id: null, version: null, date: null, dialect: null,
    namesLine: null, namesSection: null, readingRules: null, boundaries: null, provenance: null, thresholdStates: { preAI: null, exempt: null },
    flags: [], dimensions: [], problems: [],
  };
  const h1 = hs.find((h) => h.level === 1);
  if (h1) out.title = h1.text;
  for (const l of lines.slice(0, 10)) {
    let m;
    if (!out.version && (m = MATRIX_VERSION.exec(l))) { out.version = m[1]; out.date = m[2]; }
    if (!out.id && (m = OWN_VERSION.exec(l))) { out.id = m[1]; out.version = m[2]; out.date = m[3]; }
  }
  for (const h of hs) {
    if (/^(Family maturity names|Maturity-level names)\b/.test(h.text)) {
      const body = section(lines, hs, h).filter((l) => l.trim() && !/^-{3,}$/.test(l.trim()));
      out.namesSection = { heading: h.text, line: h.i + 1, lines: body };
      out.namesLine = body.find((l) => NAMES_LINE.test(l.trim())) || null;
      if (out.namesLine) out.namesLine = out.namesLine.trim();
    }
    if (/^Pre-AI\b/.test(h.text) && !out.thresholdStates.preAI) out.thresholdStates.preAI = { heading: h.text, text: paragraphs(section(lines, hs, h)).filter((p) => !/^-{3,}$/.test(p)).join("\n\n") };
    if (/^Exempt\b/.test(h.text) && !out.thresholdStates.exempt) out.thresholdStates.exempt = { heading: h.text, text: paragraphs(section(lines, hs, h)).filter((p) => !/^-{3,}$/.test(p)).join("\n\n") };
    if (/^Flags$/.test(h.text)) {
      for (const l of section(lines, hs, h)) {
        const m = /^(?:- )?(Model|D\d+(?:[–-]D\d+)?): (.+)$/.exec(l.trim());
        if (m) out.flags.push({ scope: m[1], text: m[2] });
      }
    }
    // The reading rules (M4): the section's text, its flags set aside -- a flag moves from a
    // review bullet into the Flags section in a text-neutral release, and is compared as a flag.
    if (!out.readingRules && /^(How to read\b|Family consistency and review boundaries$)/.test(h.text)) {
      const start = h.i + 1;
      const body = section(lines, hs, h);
      const skip = new Set();
      const fh = hs.find((x) => x.i > h.i && x.i < start + body.length && /^Flags$/.test(x.text));
      if (fh) { const n = section(lines, hs, fh).length; for (let k = fh.i; k <= fh.i + n; k++) skip.add(k); }
      const kept = body.filter((_, k) => !skip.has(start + k));
      out.readingRules = { heading: h.text, line: h.i + 1, text: paragraphs(kept).filter((p) => !/^-{3,}$/.test(p) && !/^- Flag: /.test(p)).join("\n\n") };
    }
  }
  // The cross-dimension boundaries (M7) and the provenance (M8), as text, for the text-neutral
  // test: the section under its heading, its sub-headings and paragraphs, the heading's own words
  // left out, since retitling a section is layout (420-CC).
  for (const h of hs) {
    const asText = () => paragraphs(section(lines, hs, h)).filter((p) => !/^-{3,}$/.test(p)).join("\n\n");
    if (!out.boundaries && h.level === 2 && /^Cross-dimension boundar/i.test(h.text)) out.boundaries = { heading: h.text, text: asText() };
    if (!out.provenance && h.level === 2 && /^(Dimension provenance|Family position|Provenance)\b/i.test(h.text)) out.provenance = { heading: h.text, text: asText() };
  }
  for (const p of paragraphs(lines)) {
    let m;
    if (THRESHOLD_NONE.test(p)) out.thresholdStates = { preAI: { none: true }, exempt: { none: true }, line: p };
    else if ((m = THRESHOLD_SOURCE.exec(p))) {
      const source = { standard: m[1], tag: m[2], repository: m[3] };
      out.thresholdStates = { preAI: { source }, exempt: { source }, line: p };
    }
  }
  const dialects = new Set();
  for (const h of hs) {
    let m;
    if (h.level < 2 || h.level > 4) continue;
    if ((m = DIM_RANGE.exec(h.text))) {
      const block = section(lines, hs, h);
      const basis = paragraphs(block).map((p) => BASIS.exec(p)).find(Boolean);
      for (let n = +m[1]; n <= +m[2]; n++) {
        out.dimensions.push({ id: "D" + n, name: m[3], range: "D" + m[1] + "–D" + m[2], status: "inherited", rendered: false, basis: basis ? { text: basis[1] } : null });
      }
      continue;
    }
    if ((m = DIM_ONE.exec(h.text))) {
      const r = parseDimension("D" + m[1], m[2], dimensionBlock(lines, hs, h));
      out.dimensions.push(r.d);
      out.problems.push(...r.problems);
      if (r.d.dialect) dialects.add(r.d.dialect);
    }
  }
  out.dialect = dialects.size === 1 ? [...dialects][0] : dialects.size ? "mixed" : null;
  return out;
}

// The family file (§3.6): its own version line, the names line, and the table of names
// and one-line descriptions.
function parseFamily(input) {
  const lines = String(input).replace(/\r\n/g, "\n").split("\n");
  const out = { title: null, id: null, version: null, date: null, namesLine: null, levels: {}, paragraphs: [] };
  for (const l of lines) {
    let m;
    if (!out.title && (m = /^# (.+)$/.exec(l))) out.title = m[1].trim();
    if (!out.id && (m = OWN_VERSION.exec(l))) { out.id = m[1]; out.version = m[2]; out.date = m[3]; continue; }
    if (!out.namesLine && NAMES_LINE.test(l.trim())) { out.namesLine = l.trim(); continue; }
    if ((m = /^\| ([A-E]) \| \*\*(.+?)\*\* \| (.+?) \|$/.exec(l.trim()))) out.levels[m[1]] = { name: m[2], oneLine: m[3] };
  }
  out.paragraphs = paragraphs(lines).filter((p) => !HEADING.test(p) && !/^\|/.test(p) && !OWN_VERSION.test(p) && !NAMES_LINE.test(p));
  return out;
}

module.exports = { parseModel, parseFamily, paragraphs, LEVELS, STEPS };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.log("Usage: node tools/model-parser.js <file.md> [--json]"); process.exit(2); }
  const text = fs.readFileSync(file, "utf8");
  const r = /family/i.test(file) ? parseFamily(text) : parseModel(text);
  if (process.argv.includes("--json")) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  if (r.dimensions) {
    console.log("MODEL -- " + (r.title || "untitled") + (r.id ? " " + r.id : "") + (r.version ? " v" + r.version : "") + "; dialect " + (r.dialect || "none"));
    console.log("  names line: " + (r.namesLine ? "yes" : "no") + "; Pre-AI: " + (r.thresholdStates.preAI ? "own" : "none") + "; Exempt: " + (r.thresholdStates.exempt ? "own" : "none") + "; flags in a Flags section: " + r.flags.length);
    for (const d of r.dimensions) {
      const lv = d.levels ? Object.keys(d.levels).length : 0;
      const tv = d.transitions ? Object.values(d.transitions).filter((t) => t.verification).length : 0;
      console.log("  " + d.id + "  " + d.status + (d.rendered === false ? ", referenced" : "") + (d.levels ? "  levels " + lv + ", verified steps " + tv + ", sustainment " + (d.sustainment ? "yes" : "no") + ", vantage " + (d.vantage ? "yes" : "no") : "") + "   " + d.name);
    }
    r.problems.forEach((p) => console.log("  PROBLEM  " + p));
  } else console.log(JSON.stringify(r, null, 2));
}
