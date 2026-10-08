// The AI-reader map (OKF-TOGAF#158; 100-DT2 section 4 and 122-DT2 step 3 of
// OKF TOGAF briefs/2026-10-01-svm-tranche-3/). Reach: "An AI agent can
// navigate the site and answer its owner's questions specific to a model,
// Strata, or EA OKF".
//
// What it builds, all from the sources lib/aiDigestCore.js fetches once:
//   /llms.txt -- a short root: the owner's practice introduction, a
//     provenance line, one line per construct map, the full file's link;
//   four construct maps -- /models/llms.txt, /functionmodels/llms.txt,
//     /strata/llms.txt, /eaokf/llms.txt -- each an index with a link up;
//   a Markdown copy beside each substantive page (lib/mapRoutes.js says which).
// The full file itself (/llms-full.txt and /ai/full-context.md) is
// buildDigest()'s output. ONE DEFINITION PER TERM across the five maps is a
// check that fails the build (100-DT2 section 3(d)): the full file and the
// pages repeat definitions on purpose, so the check covers the maps only.
// Plain CommonJS, run by plain node after the build, like aiDigestCore.js.
"use strict";

const { PRACTICE_INTRO, MODELS_LEAD, MODELS_HOWTO } = require("./intros");
const { STRATA } = require("./strataData");
const { EAOKF_BODY_MARKDOWN } = require("./eaokfContent");
const { strataSection, eaokfSection, FUNCTION_MODELS, functionModelMarkdown } = require("./aiDigestCore");

const SITE = "https://aimaturitymodels.com";
const PROVENANCE = "This file is a rendering, not a source of truth: it is generated at build time from the site's canonical sources, and where it and a canonical source disagree, the source governs.";
const UP = "Up: [the site map](/llms.txt). Everything in one file: [/llms-full.txt](/llms-full.txt).";

// The models, in the owner's family order, with the descriptions the /models
// page shows (pages/models/index.js) -- kept word for word with that page.
const MODELS = [
  { slug: "ea", name: "AI-Native EA Maturity Model", desc: "How enterprise architecture itself adapts to a practice where governed cognition isn’t exclusively human." },
  { slug: "sdlc", name: "AI-Native SDLC Maturity Model", desc: "How specification becomes generated code, governed delivery, and production evidence." },
  { slug: "pdlc", name: "AI-Native PDLC Maturity Model", desc: "How market intelligence becomes product definition, prioritized investment, and closed-loop calibration." },
  { slug: "prioritization", name: "AI-Native Portfolio Prioritization Maturity Model", desc: "How organizations move from personal advocacy to coherent, governed portfolio decisions." },
];

function rootMap() {
  return `# AI-Native Maturity Models — map for AI readers

${PRACTICE_INTRO}

${PROVENANCE} It is a map: each line below leads to a smaller map, and each map to Markdown copies of the site's pages.

## Maps

- [Maturity Models map](/models/llms.txt)
- [Function Models map](/functionmodels/llms.txt)
- [Strata map](/strata/llms.txt)
- [EA OKF map](/eaokf/llms.txt)

## Everything in one file

The full text of the four maturity models, Strata, the EA OKF explainer and the Function Models, with the instructions for AI use, is one file at [/llms-full.txt](/llms-full.txt), also served as [/ai/full-context.md](/ai/full-context.md).
`;
}

// The first "## " heading of a deep-dive essay is its title.
const titleOf = (md, fallback) => ((String(md).match(/^##? (.+)$/m) || [])[1] || fallback).trim();

function modelsMap(sources) {
  const r = MODELS_HOWTO.rule;
  const dd = (slug, label) => (sources.deepDives[slug] || []).map((md, k) =>
    `- [D${k + 1}. ${titleOf(md, label + " D" + (k + 1))}](/models/${slug}/deep-dive/d${k + 1}.md)`).join("\n");
  return `# AI-Native Maturity Models — map

${UP}

${MODELS_LEAD}

## How to read these models

${MODELS_HOWTO.states}

${r.before}[${r.link}](${r.href})${r.after}

## The models

${MODELS.map((m) => `- [${m.name}](/models/${m.slug}/whole-model-view.md) — ${m.desc}`).join("\n")}

The Product Marketing Lifecycle Maturity Model is not yet published.

## Deep dives, as Markdown

### SDLC

${dd("sdlc", "SDLC")}

### PDLC

${dd("pdlc", "PDLC")}

### Portfolio Prioritization

${dd("prioritization", "Portfolio Prioritization")}
- [The Strategic Value Matrix, this model's Level E reference pattern](/models/prioritization/strategic-value-matrix.md)

The EA model has no deep dives yet.
`;
}

function functionModelsMap() {
  return `# Function Models — map

${UP}

Function Models are maps of what a function consists of, not maturity models: read them by the F instructions in the full file.

${FUNCTION_MODELS.map(([slug, fm]) => `- [${fm.title}](/functionmodels/${slug}.md) — ${String(fm.dek || "").trim()}`).join("\n")}
`;
}

function strataMap() {
  return `# Strata — map

${UP}

The page, as Markdown: [Strata, the architectural governance plane](/strata.md).

## The eight strata

${STRATA.map((s) => `- **${s.code}. ${s.name}** — ${s.gloss}`).join("\n")}
`;
}

function eaokfMap() {
  const sections = [...String(EAOKF_BODY_MARKDOWN).matchAll(/^## (.+)$/gm)].map((m) => `- ${m[1].trim()}`);
  return `# EA OKF — map

${UP}

The page, as Markdown: [the Enterprise Architecture OKF explainer](/eaokf.md).

## Its sections

${sections.join("\n")}
`;
}

// A copy's own header: what it is a copy of, and where its map is.
function copyHeader(copyPath, mapPath) {
  const page = SITE + copyPath.replace(/\.md$/, "/");
  return `> Markdown copy of [${page}](${page}), generated at build time: a rendering, not a source of truth. Map: [${mapPath}](${mapPath}). Site map: [/llms.txt](/llms.txt).\n\n`;
}

function pageCopies(sources) {
  const { copyFor, mapFor } = require("./mapRoutes");
  const out = {};
  const put = (route, body) => {
    const c = copyFor(route);
    if (!c) throw new Error("no copy rule for " + route);
    out[c] = copyHeader(c, mapFor(route)) + body.trim() + "\n";
  };
  put("/models/sdlc/whole-model-view/", sources.sharedLayer + "\n\n---\n\n" + sources.fullModel);
  put("/models/pdlc/whole-model-view/", sources.pdlcModel);
  put("/models/prioritization/whole-model-view/", sources.prioritizationModel);
  put("/models/ea/whole-model-view/", sources.eaModel);
  put("/models/prioritization/strategic-value-matrix/", sources.svmFrame);
  for (const m of MODELS) {
    (sources.deepDives[m.slug] || []).forEach((md, k) =>
      put(`/models/${m.slug}/deep-dive/d${k + 1}/`, `# ${m.name} — D${k + 1}\n\n` + md));
  }
  // The Strata section says "the AI-Native SDLC Maturity Model above", which
  // is true in the full file and not on its own page.
  put("/strata/", "# Strata — the architectural governance plane (S0–S7)\n\n" +
    strataSection().replace("the AI-Native SDLC Maturity Model above", "the AI-Native SDLC Maturity Model (/models/sdlc/whole-model-view/)"));
  put("/eaokf/", "# Enterprise Architecture OKF\n\n" + eaokfSection());
  for (const [slug, fm] of FUNCTION_MODELS) put(`/functionmodels/${slug}/`, functionModelMarkdown(fm));
  return out;
}

// Terms the maps define: "- [Term](href) — definition", "**Term** — ...",
// "- **Term** — ...". A link with no " — " is a pointer, not a definition.
function duplicateDefinitions(maps) {
  const seen = new Map();
  for (const [file, text] of Object.entries(maps)) {
    for (const line of String(text).replace(/\r\n/g, "\n").split("\n")) {
      const m = line.match(/^- \[([^\]]+)\]\([^)]*\) — /) || line.match(/^(?:- )?\*\*([^*]+)\*\* — /);
      if (!m) continue;
      const term = m[1].trim();
      seen.set(term, [...(seen.get(term) || []), file]);
    }
  }
  return [...seen].filter(([, files]) => files.length > 1).map(([t, files]) => `${t} (${files.join(", ")})`);
}

function constructMaps(sources) {
  return {
    "/llms.txt": rootMap(),
    "/models/llms.txt": modelsMap(sources),
    "/functionmodels/llms.txt": functionModelsMap(),
    "/strata/llms.txt": strataMap(),
    "/eaokf/llms.txt": eaokfMap(),
  };
}

module.exports = { rootMap, constructMaps, pageCopies, duplicateDefinitions, MODELS };
