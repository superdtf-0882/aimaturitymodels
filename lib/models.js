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
// {id, name, desc, levels: {A..E}} -- deliberately generic enough to
// handle both shapes in the canonical repo with one parser: D4-D13
// (ai_native_sdlc_maturity_model.md) have no transition prose between
// levels; D1-D3 (shared_intelligence_layer.md) do. Any "**...**" header
// that isn't "**Level X**" (e.g. "**Transition from A to B**") clears
// the active level, so its prose is never captured -- this is exactly
// the assessment-set derivation WP-AIMM-02 called for: full-accuracy
// level text, no transition notes, without hand-duplicating a third
// copy of the content. Branded level names (neither the old CMMI-style
// labels the assessment used to carry, nor the family's own locked
// Nascent/Modeled/Continuous/Integral/Telemetric vocabulary) are never
// introduced here either -- the assessment set stays letter-only by
// design (WP-AIMM-02: "deliberately neutral").
function parseDimensionLevels(md) {
  const dims = [];
  let current = null;
  let activeLevel = null;
  let buffer = [];

  function flush() {
    if (current && activeLevel) current.levels[activeLevel] = buffer.join(" ").trim();
    buffer = [];
  }

  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const dimHeader = line.match(/^## (D\d+)\.\s+(.+)$/);
    const levelHeader = line.match(/^\*\*Level ([A-E])\*\*$/);
    const otherBoldHeader = line.match(/^\*\*(.+)\*\*$/);
    const descLine = line.match(/^\*(.+)\*$/);

    if (dimHeader) {
      flush();
      current = { id: dimHeader[1], name: dimHeader[2].trim(), desc: "", levels: {} };
      dims.push(current);
      activeLevel = null;
      continue;
    }
    if (!current) continue;

    if (levelHeader) {
      flush();
      activeLevel = levelHeader[1];
      continue;
    }
    if (otherBoldHeader) {
      flush();
      activeLevel = null; // e.g. a Transition header -- its prose is intentionally dropped
      continue;
    }
    if (!current.desc && descLine) {
      current.desc = descLine[1].trim();
      continue;
    }
    if (activeLevel && line) buffer.push(line);
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

export const SDLC_DIMENSION_ORDER = [
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13",
];

export const SDLC_MODEL_META = {
  name: "AI-Native SDLC Maturity Model",
  slug: "sdlc",
  repoUrl: SDLC_REPO_URL,
  capstone: "D13",
};
