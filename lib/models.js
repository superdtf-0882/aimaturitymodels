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
// (source_matrix_version/source_matrix_commit). commit 4730189 is that
// same citation: tag v1.2.0, the commit short_form.yml itself was last
// verified against (briefs/2026-07-25-compression-provenance/). Bump
// both together when the model's content next changes meaningfully --
// don't let this drift to a newer commit while short_form.yml cites the
// old one, or the two derived views would disagree about their source.
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
const SDLC_PINNED_COMMIT = "c7aff528f162aeff8ac3edfa74907b18d2e01391";
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
function parseDimensionLevels(md, { captureTransitions = false } = {}) {
  const dims = [];
  let current = null;
  let activeLevel = null;
  let activeTransition = null;
  let buffer = [];

  function flush() {
    if (current && activeLevel) current.levels[activeLevel] = buffer.join(" ").trim();
    if (current && activeTransition) current.transitions[activeTransition] = buffer.join(" ").trim();
    buffer = [];
  }

  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const dimHeader = line.match(/^## (D\d+)\.\s+(.+)$/);
    const levelHeader = line.match(/^\*\*Level ([A-E])\*\*$/);
    const transitionHeader = line.match(/^\*\*Transition from ([A-E]) to ([A-E])\*\*$/);
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
      continue;
    }
    if (dimHeader) {
      flush();
      current = { id: dimHeader[1], name: dimHeader[2].trim(), desc: "", levels: {}, transitions: {} };
      dims.push(current);
      activeLevel = null;
      activeTransition = null;
      continue;
    }
    if (!current) continue;

    if (levelHeader) {
      flush();
      activeLevel = levelHeader[1];
      activeTransition = null;
      continue;
    }
    if (transitionHeader && captureTransitions) {
      flush();
      activeLevel = null;
      activeTransition = `${transitionHeader[1]}-${transitionHeader[2]}`;
      continue;
    }
    if (otherBoldHeader) {
      flush();
      activeLevel = null;
      activeTransition = null; // e.g. a Transition header when not captured -- prose intentionally dropped
      continue;
    }
    if (!current.desc && descLine) {
      current.desc = descLine[1].trim();
      continue;
    }
    if ((activeLevel || activeTransition) && line) buffer.push(line);
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
