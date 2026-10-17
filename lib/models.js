// Build-time content fetching. Per ADR-008: each model's content is
// fetched from that model's own public repo at build time -- never
// duplicated into this repo. No auth needed (CC BY 4.0 published repos).
// This file runs only in getStaticProps/getStaticPaths (Node, build time),
// never in the browser.

import yaml from "js-yaml";
import { marked } from "marked";

// EVERY MODEL FETCH IS PINNED, 2026-10-02 (Ring 3, OKF-TOGAF#141; 10-DT2
// section 3 of briefs/2026-10-01-svm-tranche-3/ in OKF-TOGAF, ratified "I
// ratify 10-DT2 of svm-tranche-3; previews: refused like production; SDLC
// short form pinned at 0c9b887 (11-CC §3); build:local without the gate
// (11-CC §4) -- David Facer 10/2/2026"). The three `*_RAW` constants that read
// `main` -- SDLC here, PDLC and Prioritization below -- are gone, and nothing
// on this site reads a model's `main` any more. A model change now goes live
// only when a site commit moves a pin in lib/pins.js, and that commit passes
// the Work Item deploy gate. The comments below that say "unpinned" are kept
// as true of their time, each with a dated line beside it.
const SDLC_REPO_URL = "https://github.com/superdtf-0882/ai-native-sdlc-maturity-model";

// Pinned to a specific commit, not `main` -- the assessment set needs a
// checkable citation the same way short_form.yml already carries one
// (source_matrix_version/source_matrix_commit). Bump both together when
// the model's content next changes meaningfully -- don't let this drift
// to a newer commit while short_form.yml cites the old one, or the two
// derived views would disagree about their source.
// This drifted anyway, from 2026-07-26 to 2026-08-26: five bumps below
// moved this pin and none moved short_form.yml's citation, which stayed
// at 4730189. Re-verified and realigned to cb6ffd1 on 2026-08-26 (that
// repo's own commit 0c9b887) -- all 65 cells compared at both commits,
// 0 definitions rewritten, so the compression had stayed faithful the
// whole time and only the citation was wrong. The instruction above was
// correct and was simply not executed; the check meant to catch that
// was keyed to a git TAG and so reported stale continuously, which is
// why a month of drift produced no usable signal.
// 2026-07-26: bumped to the commit that lands sdlc_transition_states_
// d4_d13.md (briefs/2026-07-26-transition-states-canonize/). Verified
// `git diff` between the old and new pinned commits touches only
// README.md/CHANGELOG.md/the new file -- ai_native_sdlc_maturity_
// model.md and shared_intelligence_layer.md are byte-identical, so
// this bump changes nothing the assessment set or short_form.yml
// already rely on. Keep this, source_matrix_commit in short_form.yml,
// and the new file's own PROVENANCE citation moving together.
// 2026-07-27: bumped again for D2's header rename in
// shared_intelligence_layer.md ("Buyer/user" -> "Buyer & user"
// persona development), bringing the canonical name back in sync with
// short_form.yml's own title field (which had already been renamed).
// Verified `git diff` between the old and new pinned commits shows
// only this one line changing -- nothing else in either file moved.
// 2026-07-27, same day: bumped again for ai_native_sdlc_maturity_model.md's
// own consolidation (D4-D13 transition/verification notes and maturity-
// level names folded inline, SDLC@a288d98). Verified `git diff` between
// c7aff52 and a288d98 touches only that one file -- shared_intelligence_
// layer.md and sdlc_transition_states_d4_d13.md are unchanged. This
// required a parser fix first: the new "**Level A — Nascent**" heading
// shape didn't match parseDimensionLevels()'s levelHeader regex (which
// only recognized the bare "**Level A**" form still used in shared_
// intelligence_layer.md) -- caught before bumping, not after, since it
// would have silently blanked every D4-D13 level description on both
// the assessment page and the Whole-Model View.
// 2026-07-28: bumped for two wording fixes David caught in a cold-read
// of aimaturitymodels.com's own AI digest -- shared_intelligence_
// layer.md's Canonical-source rule read future-tense despite already
// being ratified; ai_native_sdlc_maturity_model.md's closing Status
// line called D4-D13 "locked" without stating D11 sits inside that
// baseline in an explicitly provisional state. Verified `git diff`
// between a288d98 and 8e86510 touches only those two files (plus
// CHANGELOG.md and deep_dives/*, already reflected here since
// deep_dives/ is fetched unpinned) -- no maturity content changed.
// 2026-08-25: bumped to cb6ffd1 for the stale family-scope line, which
// read "(SDLC, and PDLC/Prioritization once their own repos exist)"
// after both repos existed -- the site had been rendering a superseded
// claim for 24 days. Verified `git diff` between 8e86510 and cb6ffd1
// touches ai_native_sdlc_maturity_model.md and nothing else.
// PINNED TO cb6ffd1 AND NOT TO origin/main (aa605e3) DELIBERATELY.
// aa605e3 is "Add beta materials" and touches only BETA/ -- nothing
// this site fetches, pinned or unpinned. Two reasons not to pin past
// cb6ffd1: it would move the citation with no content behind the move,
// and BETA/ is slated for removal. If that removal rewrites history,
// aa605e3 stops existing and every pinned fetch here 404s on a live
// public site; cb6ffd1 is its parent and survives the removal of a
// later commit. Bump past this only once BETA/'s disposition is settled.
const { parseFamilyLevels, FAMILY_LEVELS_FILE } = require("./familyLevels");
const { SDLC_PINNED_COMMIT, SDLC_SHORT_FORM_PINNED_COMMIT, PDLC_PINNED_COMMIT, PDLC_D1_D3_SOURCE_COMMIT, PRIORITIZATION_PINNED_COMMIT, EA_PINNED_COMMIT, PRODUCT_MARKETING_PINNED_COMMIT, PRODUCT_MARKETING_D10_SOURCE_COMMIT, PRODUCT_MARKETING_D1_D3_SOURCE_COMMIT, MODEL_CURRENCY, currencyBasisLine } = require("./pins");
const { parseDimensionLevels, normalizeSharedDimension } = require("./dimension-parser");
// SDLC from v1.4.3: the family parser, vendored, through a thin adapter (OKF-TOGAF#205).
const { readSdlcDimensions } = require("./sdlc-reader");
// OKF-TOGAF#161: the threshold states' meanings, read from the model at its pin.
const { readThresholdStates } = require("./assessment-md");
// The three pin constants and the currency derivation moved to lib/pins.js
// on 2026-08-26 so lib/aiDigestCore.js -- CommonJS, and unable to import
// this ESM file -- can compute its currency sentence instead of restating
// one by hand. See that file's header for the defect that caused it.
export { MODEL_CURRENCY, currencyBasisLine };
const SDLC_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/${SDLC_PINNED_COMMIT}`;
// The SDLC short form has ITS OWN PIN (lib/pins.js says why): 0c9b887, the
// commit that realigned its source_matrix_commit to the model-text pin above.
const SDLC_SHORT_FORM_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/${SDLC_SHORT_FORM_PINNED_COMMIT}`;
// PDLC's D1-D3 at the SDLC tag PDLC cites (lib/pins.js says why).
const PDLC_D1_D3_RAW = `https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/${PDLC_D1_D3_SOURCE_COMMIT}`;

async function fetchRawPinned(path) {
  const res = await fetch(`${SDLC_RAW_PINNED}/${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from SDLC repo at pinned commit ${SDLC_PINNED_COMMIT}: ${res.status}`);
  }
  return res.text();
}

// parseDimensionLevels moved to lib/dimension-parser.js (OKF-TOGAF#142), so a
// plain Node self-test can load it: scripts/dimension-parser-self-test.js.

// parseTransitionStates read sdlc_transition_states_d4_d13.md, retired at SDLC v1.4.3
// (OKF-TOGAF#205); it went with the file. lib/sdlc-reader.js reads D4-D13's transitions from
// the matrix, their one home.

// The family's five level names, from family_maturity_levels.md at SDLC's pin
// (OKF-TOGAF#204). Every whole-model page reads them here; the site keeps no copy.
export async function getFamilyLevels() {
  return parseFamilyLevels(await fetchRawPinned(FAMILY_LEVELS_FILE)).names;
}

export async function getSdlcShortForm() {
  // Pinned 2026-10-02 (header). It read `main` until then.
  const text = await fetchRawFrom(SDLC_SHORT_FORM_RAW_PINNED, "short_form.yml");
  return yaml.load(text);
}

export async function getSdlcDeepDive(dimId) {
  // dimId like "D1".."D13"
  // Pinned 2026-10-02 (header), at the model-text pin. It read `main` until
  // then; no deep dive differs between that pin and `main` on the day it moved.
  const n = dimId.replace(/^D/i, "");
  const text = await fetchRawPinned(`deep_dives/d${n}.md`);
  return marked.parse(text);
}

// The assessment set (WP-AIMM-02): full-accuracy D1-D13 level text,
// pinned to SDLC_PINNED_COMMIT, derived by parsing the same two files
// short_form.yml's own digest derives from -- never a third
// hand-maintained copy. Fetched once per build; both source files are
// small enough that fetching them per-page (assessment page only)
// rather than caching is fine.
export async function getSdlcAssessmentDimensions() {
  const [sharedMd, fullMd] = await Promise.all([
    fetchRawPinned("shared_intelligence_layer.md"),
    fetchRawPinned("ai_native_sdlc_maturity_model.md"),
  ]);
  // OKF-TOGAF#206: read with their transitions, so the claim toggle has each level's
  // verification line -- D1-D3's from the shared layer, D4-D13's from the matrix, SDLC's
  // named home (STD-MODEL-PARTS v1.1 section 3.2), not the transition-states file. The ids,
  // names, definitions and level texts read the same as before (compared at bedce3d, 416-CC).
  // OKF-TOGAF#205: through the family parser from v1.4.3; every field the page reads is the
  // same as the site's own reader gave at v1.4.2, 221 of 221.
  const byId = readSdlcDimensions(sharedMd, fullMd);
  return {
    dimensions: SDLC_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: SDLC_PINNED_COMMIT,
    thresholdStates: readThresholdStates(fullMd),
  };
}

// The single-pane reveal's content (2026-07-26, "digested matrix +
// progressive disclosure" alignment): full Definition, Transition
// Notes, and (Level E) Sustainment notes for every dimension -- same
// pinned commit as the assessment set. D1-D3 come from the shared layer, D4-D13 from the
// matrix: since SDLC v1.4.3 (OKF-TOGAF#205) the matrix is the one home of their transitions,
// verification lines and sustainment, and sdlc_transition_states_d4_d13.md, which this read
// until then, is retired. Both files are read through the family parser (lib/sdlc-reader.js).
// transitionCaution stays in the shape, null: the retired file's one caution, D11's, was
// removed in its v0.3, and the matrix carries none.
export async function getSdlcFullModel() {
  const [sharedMd, fullMd] = await Promise.all([
    fetchRawPinned("shared_intelligence_layer.md"),
    fetchRawPinned("ai_native_sdlc_maturity_model.md"),
  ]);
  const byId = readSdlcDimensions(sharedMd, fullMd);
  for (const dim of byId.values()) dim.transitionCaution = null;
  return {
    dimensions: SDLC_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: SDLC_PINNED_COMMIT,
  };
}

export const SDLC_DIMENSION_ORDER = [
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13",
];

export const SDLC_MODEL_META = {
  name: "AI-Native SDLC Maturity Model",
  slug: "sdlc",
  repoUrl: SDLC_REPO_URL,
  capstone: "D13",
};

// --- PDLC and Prioritization: table-format models ---------------------
//
// Unlike SDLC's prose-with-headers shape, PDLC and Prioritization's own
// repos use markdown tables (one row per level, columns named in the
// header rather than fixed by position -- PDLC has 4 columns, Prioritization
// has 5, "Indicative evidence" being the one Prioritization carries that
// PDLC doesn't). One parser, keyed by header name, handles both rather
// than hardcoding column position or forking per model.
//
// Row semantics: a level's own "Transition to next level"/"Verification"
// cells describe the transition OUT of that row (A's cells = A->B, B's =
// B->C, C's = C->D, D's = D->E); Level E's own "Transition" cell holds
// its Sustain/sustainment text instead, and its Verification cell is "--"
// (no transition, so nothing to verify).

const PDLC_REPO_URL = "https://github.com/superdtf-0882/ai-native-pdlc-maturity-model";
// Pinned to the commit that landed short_form.yml, same citation
// discipline as SDLC_PINNED_COMMIT -- bump both together when this
// model's content next changes meaningfully.
// 2026-08-25: bumped to a0f1876, tag v1.2.0. This pin had never moved
// since it was set and sat 28 days behind a release that landed the
// same day it was set. Verified `git diff` between 053c1f6 and a0f1876:
// the only change inside the pinned model file is its own version line,
// 1.1.0 -> 1.2.0, whose text states "narrative content, no change to
// this matrix" -- so the matrix the assessment set parses is unchanged
// and what moves is the version the site cites. deep_dives/ (the actual
// v1.2.0 payload) is fetched unpinned and was already rendering.
// 2026-10-07: bumped to 901949d, tag v1.2.1, OKF-TOGAF#167: D5's and D11's
// notes name the AI-Native Portfolio Prioritization Maturity Model, renamed
// at its own v1.4.0. `git diff a0f1876 901949d` touches the matrix only in
// those two notes; no level, transition or verification clause moves.

const PDLC_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-pdlc-maturity-model/${PDLC_PINNED_COMMIT}`;

const PRIORITIZATION_REPO_URL = "https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model";
// 2026-08-25: bumped to 9d8c0a1, tag v1.2.0, same finding and same
// verification as the PDLC pin directly above -- set 2026-07-28 and
// never moved while the release landed that day. Verified `git diff`
// between 12eb14b and 9d8c0a1: inside the pinned model file only the
// version line moves, 1.1.1 -> 1.2.0, its own text stating "narrative
// content, no change to this matrix". This pin carried no citation
// comment at all before now, which is why it was the last of the three
// to be noticed; the discipline SDLC_PINNED_COMMIT records applies to
// it identically and is stated here so the next reader does not have
// to infer it.
// 2026-10-01: bumped to 3b16185, tag v1.3.0, which adds the Strategic
// Value Matrix as this model's Level E reference pattern --
// strategic_value_matrix.md, svm_sample.yml, svm_conformance.yml.
// Verified `git diff 9d8c0a1 3b16185 -- ai_native_product_prioritization_
// maturity_model.md`: EMPTY. The matrix the Whole-Model View, the
// assessment and the deep-dives parse is byte-identical; what moves is the
// three new files, read at this same pin.
// 2026-10-07: bumped to e7422a5, tag v1.4.0, OKF-TOGAF#167, on "Rename to Portfolio Prioritization as 118-DT2 rules; repository 
// name kept; signed texts updated to match -- David Facer 10/7/2026". The model renamed the AI-Native Portfolio
// Prioritization Maturity Model: its title, first paragraph and four cells
// (one word each), and a Roots section ahead of the dimensions, which the
// parser skips. The repository and the matrix file keep their names.

const PRIORITIZATION_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-product-prioritization-maturity-model/${PRIORITIZATION_PINNED_COMMIT}`;

async function fetchRawFrom(base, path) {
  const res = await fetch(`${base}/${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from ${base}: ${res.status}`);
  }
  return res.text();
}

// Splits a markdown table row into trimmed cell strings, dropping the
// leading/trailing empty strings `split("|")` produces from the row's
// own boundary pipes.
function splitTableRow(line) {
  const cells = line.split("|").map((c) => c.trim());
  if (cells[0] === "") cells.shift();
  if (cells[cells.length - 1] === "") cells.pop();
  return cells;
}

// Parses every "### D<n>. Title" or "#### D<n>. Title" section (heading
// level varies by repo -- PDLC uses ####, Prioritization ### -- matched
// generically rather than assuming one) into {id, name, desc, levels,
// transitions, sustainment}, reading the level-per-row table that
// follows each dimension's **Definition:** line. Column values are read
// by header name, not position, so PDLC's 4-column and Prioritization's
// 5-column tables both work without a fork.
function parseTableModel(md) {
  const dims = [];
  let current = null;
  let headerCells = null;

  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const dimHeader = line.match(/^#{2,4}\s+(D\d+)\.\s+(.+)$/);
    const defLine = line.match(/^\*\*Definition:\*\*\s*(.+)$/);
    const isHeaderRow = /^\|\s*Level\s*\|/.test(line);
    const isSeparatorRow = /^\|[\s-]+\|/.test(line) && /^\|[-\s|]+\|$/.test(line);
    const isDataRow = current && headerCells && /^\|\s*[A-E]\s*-/.test(line);

    if (dimHeader) {
      current = { id: dimHeader[1], name: dimHeader[2].trim(), desc: "", levels: {}, transitions: {}, sustainment: null };
      dims.push(current);
      headerCells = null;
      continue;
    }
    if (!current) continue;
    if (defLine && !current.desc) {
      current.desc = defLine[1].trim();
      continue;
    }
    if (isHeaderRow) {
      headerCells = splitTableRow(line);
      continue;
    }
    if (isSeparatorRow) continue;
    if (isDataRow) {
      const cells = splitTableRow(line);
      const row = {};
      headerCells.forEach((name, idx) => {
        row[name] = cells[idx] !== undefined ? cells[idx] : "";
      });
      const level = row["Level"].match(/^([A-E])/)[1];
      // Description text: PDLC's own "Description" column, or
      // Prioritization's "Maturity definition" -- whichever this
      // table actually has.
      current.levels[level] = row["Description"] || row["Maturity definition"] || "";
      const transitionText = row["Transition to next level"] || "";
      const verificationText = row["Verification"] || "";
      const hasVerification = verificationText && verificationText !== "—" && verificationText !== "-";
      if (level === "E") {
        current.sustainment = transitionText;
      } else {
        const next = { A: "B", B: "C", C: "D", D: "E" }[level];
        current.transitions[`${level}-${next}`] = {
          text: transitionText,
          verification: hasVerification ? verificationText : null,
        };
      }
      continue;
    }
  }
  return dims;
}

// PDLC's own D4-D12; D1-D3 are folded in from the SDLC repo's shared
// intelligence layer (identical content, reused rather than re-fetched
// as a separate copy -- see the PDLC repo's own README on this point).
// short_form.yml similarly only compresses D4-D12; D1-D3's digest reuses
// SDLC's own short_form.yml entries directly, since the underlying model
// text those cells compress is the same text.
export async function getPdlcShortForm() {
  const [pdlcText, sdlcText] = await Promise.all([
    fetchRawFrom(PDLC_RAW_PINNED, "short_form.yml"),
    fetchRawFrom(PDLC_D1_D3_RAW, "short_form.yml"),
  ]);
  const pdlc = yaml.load(pdlcText);
  const sdlc = yaml.load(sdlcText);
  const dimensions = { ...pdlc.dimensions };
  for (const id of ["D1", "D2", "D3"]) {
    dimensions[id] = sdlc.dimensions[id];
  }
  return { dimensions };
}

export async function getPdlcFullModel() {
  const [pdlcMd, sharedMd] = await Promise.all([
    fetchRawFrom(PDLC_RAW_PINNED, "ai_native_pdlc_maturity_model.md"),
    fetchRawFrom(PDLC_D1_D3_RAW, "shared_intelligence_layer.md"),
  ]);
  const owned = parseTableModel(pdlcMd); // D4-D12
  const shared = parseDimensionLevels(sharedMd, { captureTransitions: true }); // D1-D3
  const byId = new Map([...shared, ...owned].map((d) => [d.id, d]));
  for (const dim of byId.values()) {
    if (!dim.transitions) continue;
    normalizeSharedDimension(dim);
  }
  return {
    dimensions: PDLC_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: PDLC_PINNED_COMMIT,
  };
}

export const PDLC_DIMENSION_ORDER = [
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12",
];

export const PDLC_MODEL_META = {
  name: "AI-Native PDLC Maturity Model",
  slug: "pdlc",
  repoUrl: PDLC_REPO_URL,
  capstone: "D12",
};

// Unpinned, same convention as getSdlcDeepDive -- deep-dive essays are
// narrative content, not a scored/citation-protected derivation, so they
// fetch from main rather than a pinned commit. The PDLC repo carries its
// own deep_dives/d1.md-d3.md (SDLC's shared-layer essays plus this
// model's own delta paragraph, not a second hand-authored copy), so all
// twelve dimensions are fetched from the PDLC repo itself.
// PINNED 2026-10-02 (header): the paragraph above is kept as true of its
// time. A deep dive now reaches the site when a site commit moves the pin.
export async function getPdlcDeepDive(dimId) {
  const n = dimId.replace(/^D/i, "");
  const res = await fetch(`${PDLC_RAW_PINNED}/deep_dives/d${n}.md`);
  if (!res.ok) {
    throw new Error(`Failed to fetch deep_dives/d${n}.md from PDLC repo: ${res.status}`);
  }
  return marked.parse(await res.text());
}

export async function getPrioritizationShortForm() {
  const text = await fetchRawFrom(PRIORITIZATION_RAW_PINNED, "short_form.yml");
  return yaml.load(text);
}

// The Strategic Value Matrix page (v1.3.0): the frame's text and the
// illustrative sample, both read at the pin. The page embeds neither --
// AC-008's no-duplication rule -- and the calculator is lib/svmCore.js.
// The frame's own title line is dropped, because the page sets its own
// heading, and its one relative link is pointed at this site's view of
// the model it names.
export async function getPrioritizationSvm() {
  const [frameMd, sampleText] = await Promise.all([
    fetchRawFrom(PRIORITIZATION_RAW_PINNED, "strategic_value_matrix.md"),
    fetchRawFrom(PRIORITIZATION_RAW_PINNED, "svm_sample.yml"),
  ]);
  const body = frameMd
    .replace(/^# [^\r\n]*[\r\n]+/, "")
    .replace("](ai_native_product_prioritization_maturity_model.md)", "](/models/prioritization/whole-model-view)");
  return {
    frameHtml: marked.parse(body),
    sample: yaml.load(sampleText),
    sourceCommit: PRIORITIZATION_PINNED_COMMIT,
  };
}

export async function getPrioritizationFullModel() {
  const md = await fetchRawFrom(PRIORITIZATION_RAW_PINNED, "ai_native_product_prioritization_maturity_model.md");
  const dims = parseTableModel(md);
  const byId = new Map(dims.map((d) => [d.id, d]));
  return {
    dimensions: PRIORITIZATION_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: PRIORITIZATION_PINNED_COMMIT,
  };
}

export const PRIORITIZATION_DIMENSION_ORDER = ["D1", "D2", "D3"];

export const PRIORITIZATION_MODEL_META = {
  name: "AI-Native Portfolio Prioritization Maturity Model",
  slug: "prioritization",
  repoUrl: PRIORITIZATION_REPO_URL,
  capstone: "D3",
};

// --- EA: prose-format model with INLINE transitions -------------------
//
// The fourth family member, live 2026-09-12. Its matrix uses this file's
// prose shape -- "## D<n>. Title", "**Level A — Nascent**" -- and keeps
// its transitions inline rather than in a separate document the way SDLC
// does, which is what `inlineTransitions` handles. See parseDimensionLevels'
// header for why that is an option on the existing parser rather than a
// fourth one.
//
// No deep-dive accessor. The EA repo has no deep_dives/ directory yet;
// back-porting them is its own tracked work item and this model's page
// ships without that tab rather than with one that 404s.
const EA_REPO_URL = "https://github.com/superdtf-0882/ai-native-ea-maturity-model";
const EA_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-ea-maturity-model/${EA_PINNED_COMMIT}`;

export async function getEaShortForm() {
  const text = await fetchRawFrom(EA_RAW_PINNED, "short_form.yml");
  return yaml.load(text);
}

export async function getEaFullModel() {
  const md = await fetchRawFrom(EA_RAW_PINNED, "ai_native_ea_maturity_model.md");
  const dims = parseDimensionLevels(md, { inlineTransitions: true });
  const byId = new Map(dims.map((d) => [d.id, d]));

  // THE ORDER ARRAY AND THE PARSED SET MUST AGREE, AND THIS IS WHY.
  // On 2026-09-15 the model released at v1.1.0 with ten dimensions, the pin
  // moved, and this page served NINE under a label reading "Ten dimensions" --
  // because EA_DIMENSION_ORDER still listed D1-D9, and the map below silently
  // discarded the dimension the parser had found. No error, no warning, no
  // count mismatch anywhere: a published page quietly one dimension short of
  // the model it cites, with its own currency line correct.
  //
  // Checked in BOTH directions, because they fail differently. A dimension the
  // source declares and this array omits is DROPPED (the 2026-09-15 defect). A
  // dimension this array lists and the source does not declare maps to
  // undefined and reaches the renderer as a hole.
  //
  // Fatal rather than a warning, and fail-safe: this runs at build, so a
  // mismatch stops the deploy and the previously-correct page keeps serving.
  // A warning here would print into a build log nobody reads, which is the
  // failure mode OI-77 records for an alarm with no reader.
  const dropped = [...byId.keys()].filter((id) => !EA_DIMENSION_ORDER.includes(id));
  const absent = EA_DIMENSION_ORDER.filter((id) => !byId.has(id));
  if (dropped.length || absent.length) {
    throw new Error(
      "EA_DIMENSION_ORDER disagrees with the model at " + EA_PINNED_COMMIT.slice(0, 7) + ". " +
      (dropped.length ? "Declared by the model and missing from the order array (would be silently dropped): " + dropped.join(", ") + ". " : "") +
      (absent.length ? "Listed in the order array and not declared by the model (would render as a hole): " + absent.join(", ") + ". " : "") +
      "Fix the array or the pin; do not remove this check."
    );
  }

  return {
    dimensions: EA_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: EA_PINNED_COMMIT,
    // The matrix itself, so the assessment can quote its Pre-AI and Exempt
    // meanings without a second fetch (OKF-TOGAF#145, #161).
    matrixMd: md,
  };
}

// The EA assessment's input (OKF-TOGAF#145): the same dimensions, at the same
// pin, as the whole-model view -- one loader, so the two cannot disagree --
// and the model's own meanings of Pre-AI and Exempt, which the EA model
// defines (OKF-TOGAF#161), as getSdlcAssessmentDimensions does for SDLC.
// Names are the short form's titles, as the whole-model view uses: the
// matrix's headings carry markdown ("Shared language (*Vocabula*)").
export async function getEaAssessmentDimensions() {
  const [shortForm, { dimensions, sourceCommit, matrixMd }] = await Promise.all([getEaShortForm(), getEaFullModel()]);
  return {
    dimensions: withShortFormFlags(dimensions.map((d) => ({ ...d, name: shortForm.dimensions[d.id].title })), shortForm),
    sourceCommit,
    thresholdStates: readThresholdStates(matrixMd),
  };
}

// OKF-TOGAF#202, on the owner's scope line: "the flags shown on every model's
// assessment page". A model's open questions ship as a `flag` on its short
// form's dimensions, and the whole-model view already shows them; each
// assessment page now carries them too, so the reader scoring a dimension sees
// that its question is open. EA has three and Product Marketing two; SDLC,
// PDLC and Prioritization have none at their pins, and their pages read their
// short forms so a flag added later shows without a code change. A flag is
// shown, never scored: the downloaded file and the readout do not carry it.
export function withShortFormFlags(dimensions, shortForm) {
  const own = (shortForm && shortForm.dimensions) || {};
  return dimensions.map((d) => ({ ...d, flag: (own[d.id] && own[d.id].flag) || null }));
}

// D10 added 2026-09-15 with the model's v1.1.0 release. THIS ARRAY IS A
// SECOND COPY OF THE MODEL'S OWN DIMENSION SET and it is why the live page
// served nine dimensions under a "Ten dimensions" label after the pin had
// already moved: getEaFullModel parses every dimension out of the matrix and
// then maps over THIS list, so a dimension the model declares and this array
// omits is parsed and discarded, silently, with no error and no count
// mismatch reported anywhere. The pin was one cause of the stale render and
// this was the other; moving the pin alone fixed nothing visible.
//
// It is left as an explicit list rather than derived, deliberately and for
// one reason only: it is the ORDER, and the other three models each carry
// their own, two of them non-sequential. Deriving order from parse order
// would change four models' behaviour to fix one, on a page nobody asked to
// restructure. What is owed instead is an assertion that the list and the
// parsed set agree -- cheap, and it would have caught this in the build
// rather than on the published page.
export const EA_DIMENSION_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"];

export const EA_MODEL_META = {
  name: "AI-Native EA Maturity Model",
  slug: "ea",
  repoUrl: EA_REPO_URL,
  capstone: "D9",
};

// Unpinned, same convention as getSdlcDeepDive/getPdlcDeepDive.
// PINNED 2026-10-02 (header), with them.
export async function getPrioritizationDeepDive(dimId) {
  const n = dimId.replace(/^D/i, "");
  const res = await fetch(`${PRIORITIZATION_RAW_PINNED}/deep_dives/d${n}.md`);
  if (!res.ok) {
    throw new Error(`Failed to fetch deep_dives/d${n}.md from Prioritization repo: ${res.status}`);
  }
  return marked.parse(await res.text());
}

// -----------------------------------------------------------------------
// AI-Native Product Marketing Maturity Model (OKF-TOGAF#198)
// -----------------------------------------------------------------------
//
// The fifth family member, live 2026-10-16. Its matrix renders every
// dimension, D1-D3 and D10 included, from their sources at the tags it cites,
// and it is the one file the full model is read from. Its levels are
// "### A — Nascent" headings with an inline "**Sustainment:**" line, which is
// what parseDimensionLevels' `headingLevels` reads.
//
// Its short form holds only the seven dimensions the model writes itself.
// D1-D3's cells are SDLC's own short form, as on the PDLC page, and D10's are
// the EA model's, at the commit the model cites (pins.js says why that is not
// EA_PINNED_COMMIT). No deep dives. Its assessment came with its scoring
// instrument, SPEC-D6-SCORE-PRODMAR, ratified 2026-10-16 (OKF-TOGAF#202).
const PRODUCT_MARKETING_REPO_URL = "https://github.com/superdtf-0882/ai-native-product-marketing-maturity-model";
const PRODUCT_MARKETING_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-product-marketing-maturity-model/${PRODUCT_MARKETING_PINNED_COMMIT}`;
const PRODUCT_MARKETING_D10_RAW = `https://raw.githubusercontent.com/superdtf-0882/ai-native-ea-maturity-model/${PRODUCT_MARKETING_D10_SOURCE_COMMIT}`;
const PRODUCT_MARKETING_D1_D3_RAW = `https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/${PRODUCT_MARKETING_D1_D3_SOURCE_COMMIT}`;

// The order, and an assertion that it agrees with the parsed set in both
// directions -- EA's 2026-09-15 lesson (EA_DIMENSION_ORDER's comment), applied
// from the first build rather than after a page went out one dimension short.
export const PRODUCT_MARKETING_DIMENSION_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11"];

export async function getProductMarketingShortForm() {
  const [ownText, sdlcText, eaText] = await Promise.all([
    fetchRawFrom(PRODUCT_MARKETING_RAW_PINNED, "short_form.yml"),
    fetchRawFrom(PRODUCT_MARKETING_D1_D3_RAW, "short_form.yml"),
    fetchRawFrom(PRODUCT_MARKETING_D10_RAW, "short_form.yml"),
  ]);
  const own = yaml.load(ownText);
  const sdlc = yaml.load(sdlcText);
  const ea = yaml.load(eaText);
  const dimensions = { ...own.dimensions };
  for (const id of ["D1", "D2", "D3"]) dimensions[id] = sdlc.dimensions[id];
  // EA's D10 carries EA's flags, if any; the inherited cells are what this
  // page shows, not EA's open questions, which EA's own page renders.
  const { flag: eaFlag, ...d10 } = ea.dimensions.D10; // eslint-disable-line no-unused-vars
  dimensions.D10 = d10;
  return { dimensions };
}

export async function getProductMarketingFullModel() {
  const md = await fetchRawFrom(PRODUCT_MARKETING_RAW_PINNED, "ai_native_product_marketing_maturity_model.md");
  const dims = parseDimensionLevels(md, { captureTransitions: true, headingLevels: true });
  const byId = new Map(dims.map((d) => [d.id, d]));
  const dropped = [...byId.keys()].filter((id) => !PRODUCT_MARKETING_DIMENSION_ORDER.includes(id));
  const absent = PRODUCT_MARKETING_DIMENSION_ORDER.filter((id) => !byId.has(id));
  if (dropped.length || absent.length) {
    throw new Error(
      "PRODUCT_MARKETING_DIMENSION_ORDER disagrees with the model at " + PRODUCT_MARKETING_PINNED_COMMIT.slice(0, 7) + ". " +
      (dropped.length ? "Declared by the model and missing from the order array (would be silently dropped): " + dropped.join(", ") + ". " : "") +
      (absent.length ? "Listed in the order array and not declared by the model (would render as a hole): " + absent.join(", ") + ". " : "") +
      "Fix the array or the pin; do not remove this check."
    );
  }
  return {
    dimensions: PRODUCT_MARKETING_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: PRODUCT_MARKETING_PINNED_COMMIT,
  };
}

// The Product Marketing assessment (OKF-TOGAF#202), on EA's: the same
// dimensions, at the same pin, as the whole-model view, named by the short
// form's titles, with the short form's two flags. The model defines no Pre-AI
// or Exempt text of its own -- they "retain their family meanings" -- and the
// owner's scope line names EA's text at v1.1.2 as the source, which is the
// commit this model's D10 is already read from.
export async function getProductMarketingAssessmentDimensions() {
  const [shortForm, { dimensions, sourceCommit }, eaMatrixMd] = await Promise.all([
    getProductMarketingShortForm(),
    getProductMarketingFullModel(),
    fetchRawFrom(PRODUCT_MARKETING_D10_RAW, "ai_native_ea_maturity_model.md"),
  ]);
  const thresholdStates = readThresholdStates(eaMatrixMd);
  if (!thresholdStates) {
    throw new Error("Pre-AI and Exempt not found in the EA matrix at " + PRODUCT_MARKETING_D10_SOURCE_COMMIT.slice(0, 7) + "; the Product Marketing assessment reads them there.");
  }
  return {
    dimensions: withShortFormFlags(dimensions.map((d) => ({ ...d, name: shortForm.dimensions[d.id].title })), shortForm),
    sourceCommit,
    thresholdStates,
  };
}

export const PRODUCT_MARKETING_MODEL_META = {
  name: "AI-Native Product Marketing Maturity Model",
  slug: "productmarketing",
  repoUrl: PRODUCT_MARKETING_REPO_URL,
};

