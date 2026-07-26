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
const SDLC_PINNED_COMMIT = "4730189dbcb975d3c200d0e6d9f57ae4f39eb1a1";
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
// progressive disclosure" alignment): full Definition and, wherever
// authored, Transition Notes -- same pinned commit and source files as
// the assessment set, but captureTransitions:true keeps what that mode
// deliberately drops. Ships now with what the model actually supports:
// D1-D3 have real transition prose (shared_intelligence_layer.md); D4-
// D13 don't yet (ai_native_sdlc_maturity_model.md is Level-only) -- an
// empty `transitions` object for those dimensions is the honest,
// current state, not a bug, and needs no code change here as David
// lands more transition prose: the parser picks up any "**Transition
// from A to B**" section the moment it exists in the source file.
export async function getSdlcFullModel() {
  const [sharedMd, fullMd] = await Promise.all([
    fetchRawPinned("shared_intelligence_layer.md"),
    fetchRawPinned("ai_native_sdlc_maturity_model.md"),
  ]);
  const opts = { captureTransitions: true };
  const shared = parseDimensionLevels(sharedMd, opts); // D1-D3
  const rest = parseDimensionLevels(fullMd, opts); // D4-D13
  const byId = new Map([...shared, ...rest].map((d) => [d.id, d]));
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
