// Build-time content fetching. Per ADR-008: each model's content is
// fetched from that model's own public repo at build time -- never
// duplicated into this repo. No auth needed (CC BY 4.0 published repos).
// This file runs only in getStaticProps/getStaticPaths (Node, build time),
// never in the browser.

import yaml from "js-yaml";
import { marked } from "marked";

const SDLC_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/main";
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
const { SDLC_PINNED_COMMIT, PDLC_PINNED_COMMIT, PRIORITIZATION_PINNED_COMMIT, EA_PINNED_COMMIT, MODEL_CURRENCY, currencyBasisLine } = require("./pins");
// The three pin constants and the currency derivation moved to lib/pins.js
// on 2026-08-26 so lib/aiDigestCore.js -- CommonJS, and unable to import
// this ESM file -- can compute its currency sentence instead of restating
// one by hand. See that file's header for the defect that caused it.
export { MODEL_CURRENCY, currencyBasisLine };
const SDLC_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/${SDLC_PINNED_COMMIT}`;

async function fetchRaw(path) {
  const res = await fetch(`${SDLC_RAW}/${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from SDLC repo: ${res.status}`);
  }
  return res.text();
}

async function fetchRawPinned(path) {
  const res = await fetch(`${SDLC_RAW_PINNED}/${path}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} from SDLC repo at pinned commit ${SDLC_PINNED_COMMIT}: ${res.status}`);
  }
  return res.text();
}

// Parses "## D<n>. Title" sections shared by both source files into
// {id, name, desc, levels: {A..E}, transitions: {"A-B".."D-E"}} -- one
// core parser for both consumers, not two that could quietly diverge
// (SPEC-WORK-ITEM-FIBERING's "one core, many thin adapters"). Handles
// both shapes in the canonical repo: D4-D13 (ai_native_sdlc_maturity_
// model.md) currently have no transition prose between levels, so
// their `transitions` come back empty; D1-D3 (shared_intelligence_
// layer.md) do. `captureTransitions: false` (the assessment set's own
// mode, WP-AIMM-02) drops "**Transition from A to B**" prose entirely,
// same as before; `captureTransitions: true` (the single-pane reveal's
// mode) keeps it, keyed "A-B".."D-E". Branded level names are never
// introduced here either way -- letter-only, by design.
// `inlineTransitions` (added 2026-09-12 for the EA model) is the third
// arrangement this family uses, and it is a VARIANT OF THIS CORE rather
// than a third format -- which is the test the parseTransitionStates
// header below sets for when to fork instead. EA's matrix has this
// document's own dimension headers ("## D<n>. Title") and level headers
// ("**Level A — Nascent**"), and differs only in WHERE the transitions
// live: inline in the matrix, as "**Transition A → B — Label**" followed
// by prose and a "**Verification:**" clause, plus a "**Sustainment**"
// section per dimension. SDLC keeps the same content in a separate
// document under "### A → B — Label" headers, which is why
// parseTransitionStates exists and why it is not reused here.
//
// Under this option transitions come out in the {text, verification}
// shape parseTransitionStates produces, NOT as the plain strings this
// parser otherwise returns -- so an inline-transition model needs no
// normalization pass afterwards, while getSdlcFullModel's existing one
// is untouched.
//
// Measured against the EA matrix at v1.0.1 before this was written:
// 9 dimension headers, 45 level headers, 36 transition headers,
// 36 verification lines, 9 sustainment sections. The transition regex
// requires the "A → B" pair specifically because the prose contains a
// "**Transition velocity.**" line that a looser "^\*\*Transition" match
// captures as a 37th transition -- SDLC's matrix carries the same line.
function parseDimensionLevels(md, { captureTransitions = false, inlineTransitions = false } = {}) {
  const dims = [];
  let current = null;
  let activeLevel = null;
  let activeTransition = null;
  let activeSustainment = false;
  let collectingVerification = false;
  let heldTransitionText = null;
  let buffer = [];
  let collectingDesc = null;

  function flush() {
    const text = buffer.join(" ").trim();
    if (current && activeLevel) current.levels[activeLevel] = text;
    if (current && activeTransition) {
      if (inlineTransitions) {
        // The verification clause, when present, has been collecting into
        // `buffer` since its own line; the transition prose that preceded
        // it was set aside at that point.
        current.transitions[activeTransition] = collectingVerification
          ? { text: heldTransitionText, verification: text }
          : { text, verification: null };
      } else {
        current.transitions[activeTransition] = text;
      }
    }
    if (current && activeSustainment) current.sustainment = text;
    buffer = [];
    collectingVerification = false;
    heldTransitionText = null;
  }

  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const dimHeader = line.match(/^## (D\d+)\.\s+(.+)$/);
    const levelHeader = line.match(/^\*\*Level ([A-E])(?:\s*—\s*\w+)?\*\*$/);
    const transitionHeader = line.match(/^\*\*Transition from ([A-E]) to ([A-E])\*\*$/);
    // EA's inline arrangement. The A→B pair is required, not optional --
    // see this function's header for the "**Transition velocity.**" line
    // it exists to exclude.
    const inlineTransitionHeader = inlineTransitions
      && line.match(/^\*\*Transition\s+([A-E])\s*(?:→|->)\s*([A-E])\s*—.*\*\*$/);
    const sustainmentHeader = inlineTransitions && /^\*\*Sustainment\*\*$/.test(line);
    // Text begins on the same line as the label, so this is not a bare
    // header and `otherBoldHeader` below does not match it (that pattern
    // requires the line to END in "**").
    const verificationLine = inlineTransitions && line.match(/^\*\*Verification:\*\*\s*(.+)$/);
    const otherBoldHeader = line.match(/^\*\*(.+)\*\*$/);
    const descLine = line.match(/^\*(.+)\*$/);
    const rule = /^-{3,}$/.test(line);

    if (rule) {
      // Markdown horizontal-rule separator between dimensions -- without
      // this, the trailing "---" before the next "## D<n>" header gets
      // pushed into whichever level/transition buffer was still active
      // (every dimension's last section, almost always Level E), landing
      // as a stray " ---" appended to that prose. Found live in
      // production on the Whole-Model View's Level E reveal.
      flush();
      activeLevel = null;
      activeTransition = null;
      activeSustainment = false;
      continue;
    }
    if (dimHeader) {
      flush();
      current = { id: dimHeader[1], name: dimHeader[2].trim(), desc: "", levels: {}, transitions: {} };
      if (inlineTransitions) current.sustainment = null;
      dims.push(current);
      activeLevel = null;
      activeTransition = null;
      activeSustainment = false;
      continue;
    }
    if (!current) continue;

    if (levelHeader) {
      flush();
      activeLevel = levelHeader[1];
      activeTransition = null;
      activeSustainment = false;
      continue;
    }
    if (transitionHeader && captureTransitions) {
      flush();
      activeLevel = null;
      activeTransition = `${transitionHeader[1]}-${transitionHeader[2]}`;
      continue;
    }
    if (inlineTransitionHeader) {
      flush();
      activeLevel = null;
      activeSustainment = false;
      activeTransition = `${inlineTransitionHeader[1]}-${inlineTransitionHeader[2]}`;
      continue;
    }
    if (sustainmentHeader) {
      flush();
      activeLevel = null;
      activeTransition = null;
      activeSustainment = true;
      continue;
    }
    if (verificationLine && activeTransition) {
      // Not a flush: the same transition stays active. Its prose so far is
      // held aside and the buffer switches to collecting the verification
      // clause, which runs to the end of the section and can span lines.
      heldTransitionText = buffer.join(" ").trim();
      buffer = [verificationLine[1].trim()];
      collectingVerification = true;
      continue;
    }
    if (otherBoldHeader) {
      flush();
      activeLevel = null;
      activeTransition = null; // e.g. a Transition header when not captured -- prose intentionally dropped
      activeSustainment = false;
      continue;
    }
    if (!current.desc && descLine) {
      current.desc = descLine[1].trim();
      continue;
    }
    // Multi-line italic description. SDLC and PDLC keep each dimension's
    // description on one line, so the single-line pattern above was
    // sufficient until the EA matrix wrapped its own across three --
    // which produced nine dimensions with an empty desc and no error.
    // Only opens when nothing else is collecting, so it cannot swallow
    // an emphasised line inside level or transition prose.
    if (!current.desc && !activeLevel && !activeTransition && !activeSustainment
        && /^\*[^*]/.test(line) && !/\*$/.test(line)) {
      collectingDesc = [line.replace(/^\*/, "")];
      continue;
    }
    if (collectingDesc) {
      collectingDesc.push(line);
      if (/\*$/.test(line)) {
        current.desc = collectingDesc.join(" ").replace(/\*$/, "").replace(/\s+/g, " ").trim();
        collectingDesc = null;
      }
      continue;
    }
    if ((activeLevel || activeTransition || activeSustainment) && line) buffer.push(line);
  }
  flush();
  return dims;
}

// Parses sdlc_transition_states_d4_d13.md -- a structurally different
// document from ai_native_sdlc_maturity_model.md/shared_intelligence_
// layer.md, so it gets its own parser rather than overloading
// parseDimensionLevels with a third header shape (two genuinely
// different formats, not one core with a variant). Recognizes:
// "# D<n>. Title" (dimension boundary -- a bare "# Cross-dimension
// boundary checks" or any other non-D<n> level-1 header ends the
// current dimension, so that trailing section is safely ignored);
// "### A → B — Label" (transition prose, keyed "A-B".."D-E");
// "### Level E sustainment" (sustainment prose); a "**Verification:**"
// line inside a transition section (split out from the surrounding
// prose, kept as a distinct field so the panel can render it
// distinctly rather than burying it in a paragraph); and a leading
// "> **Draft caution:** ..." blockquote right after a dimension header
// (currently only D11) as that dimension's `transitionCaution`.
function parseTransitionStates(md) {
  const dims = new Map();
  let current = null;
  let activeKind = null; // "transition" | "sustainment" | null
  let activeKey = null; // "A-B".."D-E" when activeKind === "transition"
  let buffer = [];
  let verification = null;

  function flush() {
    if (!current || !activeKind) {
      buffer = [];
      verification = null;
      return;
    }
    const text = buffer.join(" ").trim();
    if (activeKind === "transition" && activeKey) {
      current.transitions[activeKey] = { text, verification };
    } else if (activeKind === "sustainment") {
      current.sustainment = text;
    }
    buffer = [];
    verification = null;
  }

  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const dimHeader = line.match(/^#\s+(D\d+)\./);
    const otherH1 = !dimHeader && line.match(/^#\s+/);
    const transitionHeader = line.match(/^###\s+([A-E])\s*(?:→|->)\s*([A-E])\s*—/);
    const sustainmentHeader = line.match(/^###\s+Level E sustainment/i);
    const draftCaution = line.match(/^>\s*\*\*Draft caution:\*\*\s*(.+)$/);
    const verificationLine = line.match(/^\*\*Verification:\*\*\s*(.+)$/);
    const rule = /^-{3,}$/.test(line);

    if (rule) {
      flush();
      activeKind = null;
      activeKey = null;
      continue;
    }
    if (dimHeader) {
      flush();
      current = { id: dimHeader[1], transitions: {}, sustainment: null, transitionCaution: null };
      dims.set(current.id, current);
      activeKind = null;
      activeKey = null;
      continue;
    }
    if (otherH1) {
      flush();
      current = null;
      activeKind = null;
      activeKey = null;
      continue;
    }
    if (!current) continue;

    if (transitionHeader) {
      flush();
      activeKind = "transition";
      activeKey = `${transitionHeader[1]}-${transitionHeader[2]}`;
      continue;
    }
    if (sustainmentHeader) {
      flush();
      activeKind = "sustainment";
      activeKey = null;
      continue;
    }
    if (draftCaution) {
      current.transitionCaution = draftCaution[1].trim();
      continue;
    }
    if (verificationLine && activeKind === "transition") {
      verification = verificationLine[1].trim();
      continue;
    }
    if (activeKind && line) buffer.push(line);
  }
  flush();
  return dims;
}

export async function getSdlcShortForm() {
  const text = await fetchRaw("short_form.yml");
  return yaml.load(text);
}

export async function getSdlcDeepDive(dimId) {
  // dimId like "D1".."D13"
  const n = dimId.replace(/^D/i, "");
  const text = await fetchRaw(`deep_dives/d${n}.md`);
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
  const shared = parseDimensionLevels(sharedMd); // D1-D3
  const rest = parseDimensionLevels(fullMd); // D4-D13 (D1-D3 pointer section doesn't match the parser's header shape, safely ignored)
  const byId = new Map([...shared, ...rest].map((d) => [d.id, d]));
  return {
    dimensions: SDLC_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: SDLC_PINNED_COMMIT,
  };
}

// The single-pane reveal's content (2026-07-26, "digested matrix +
// progressive disclosure" alignment): full Definition, Transition
// Notes, and (Level E) Sustainment notes for every dimension -- same
// pinned commit as the assessment set. D1-D3's transitions come from
// shared_intelligence_layer.md (no verification clause, no sustainment
// content yet -- honest gaps, not bugs); D4-D13's come from
// sdlc_transition_states_d4_d13.md, which has both. See
// parseTransitionStates() for that document's distinct format.
export async function getSdlcFullModel() {
  const [sharedMd, fullMd, transitionMd] = await Promise.all([
    fetchRawPinned("shared_intelligence_layer.md"),
    fetchRawPinned("ai_native_sdlc_maturity_model.md"),
    fetchRawPinned("sdlc_transition_states_d4_d13.md"),
  ]);
  const opts = { captureTransitions: true };
  const shared = parseDimensionLevels(sharedMd, opts); // D1-D3
  const rest = parseDimensionLevels(fullMd, opts); // D4-D13 (levels only; transitions come from transitionMd instead)
  const byId = new Map([...shared, ...rest].map((d) => [d.id, d]));
  const transitionStates = parseTransitionStates(transitionMd); // D4-D13

  // Normalize every dimension's transitions to the same {text, verification}
  // shape -- D1-D3's come from shared_intelligence_layer.md as plain prose
  // strings (no verification clause exists in that format), D4-D13's come
  // from the richer transition-states document. One shape means the panel
  // doesn't need to branch on which source a dimension's content came from.
  for (const dim of byId.values()) {
    const ts = transitionStates.get(dim.id);
    if (ts) {
      dim.transitions = ts.transitions;
      dim.sustainment = ts.sustainment;
      dim.transitionCaution = ts.transitionCaution;
    } else {
      dim.transitions = Object.fromEntries(
        Object.entries(dim.transitions).map(([key, text]) => [key, { text, verification: null }])
      );
      dim.sustainment = null;
      dim.transitionCaution = null;
    }
  }

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
const PDLC_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-pdlc-maturity-model/main";
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

const PDLC_RAW_PINNED = `https://raw.githubusercontent.com/superdtf-0882/ai-native-pdlc-maturity-model/${PDLC_PINNED_COMMIT}`;

const PRIORITIZATION_REPO_URL = "https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model";
const PRIORITIZATION_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-product-prioritization-maturity-model/main";
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
    fetchRawFrom(SDLC_RAW_PINNED, "short_form.yml"),
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
    fetchRawPinned("shared_intelligence_layer.md"),
  ]);
  const owned = parseTableModel(pdlcMd); // D4-D12
  const shared = parseDimensionLevels(sharedMd, { captureTransitions: true }); // D1-D3
  const byId = new Map([...shared, ...owned].map((d) => [d.id, d]));
  for (const dim of byId.values()) {
    if (!dim.transitions) continue;
    // Shared-layer dimensions come back as plain prose strings (no
    // verification clause exists in that source yet); normalize to the
    // same {text, verification} shape parseTableModel's dims already use.
    dim.transitions = Object.fromEntries(
      Object.entries(dim.transitions).map(([key, val]) => [
        key,
        typeof val === "string" ? { text: val, verification: null } : val,
      ])
    );
    if (dim.sustainment === undefined) dim.sustainment = null;
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
export async function getPdlcDeepDive(dimId) {
  const n = dimId.replace(/^D/i, "");
  const res = await fetch(`${PDLC_RAW}/deep_dives/d${n}.md`);
  if (!res.ok) {
    throw new Error(`Failed to fetch deep_dives/d${n}.md from PDLC repo: ${res.status}`);
  }
  return marked.parse(await res.text());
}

export async function getPrioritizationShortForm() {
  const text = await fetchRawFrom(PRIORITIZATION_RAW_PINNED, "short_form.yml");
  return yaml.load(text);
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
  name: "AI-Native Product Prioritization Maturity Model",
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
  return {
    dimensions: EA_DIMENSION_ORDER.map((id) => byId.get(id)),
    sourceCommit: EA_PINNED_COMMIT,
  };
}

export const EA_DIMENSION_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];

export const EA_MODEL_META = {
  name: "AI-Native EA Maturity Model",
  slug: "ea",
  repoUrl: EA_REPO_URL,
  capstone: "D9",
};

// Unpinned, same convention as getSdlcDeepDive/getPdlcDeepDive.
export async function getPrioritizationDeepDive(dimId) {
  const n = dimId.replace(/^D/i, "");
  const res = await fetch(`${PRIORITIZATION_RAW}/deep_dives/d${n}.md`);
  if (!res.ok) {
    throw new Error(`Failed to fetch deep_dives/d${n}.md from Prioritization repo: ${res.status}`);
  }
  return marked.parse(await res.text());
}

