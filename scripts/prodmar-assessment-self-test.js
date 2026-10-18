#!/usr/bin/env node
// Self-test for OKF-TOGAF#202 -- the Product Marketing assessment, on "#202 as
// 204-DT2 scopes it: Pre-AI and Exempt from EA's text at v1.1.2 for the
// instrument and the page; D1-D3 and D10 criteria reused by reference from the
// SDLC and EA instruments once CC corrects the SDLC instrument's later-tags
// rule under #200; the flags shown on every model's assessment page; DTOG
// drafts, DT2 traces, I ratify; the page built in parallel and shipped after
// ratification -- David Facer 10/16/2026". Its instrument, SPEC-D6-SCORE-PRODMAR,
// was ratified the same day (OKF TOGAF 386-CC).
//
// Source checks, offline, as scripts/ea-assessment-self-test.js does for EA.
// Usage: node scripts/prodmar-assessment-self-test.js   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(70) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
// Line endings as Git stores them (LF), which is what Vercel builds from.
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const fnBody = (src, name) => (src.match(new RegExp("export (?:async )?function " + name + "\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}")) || [])[1] || "";

const models = read("lib/models.js");

console.log("--- the loader ---");
{
  const fn = fnBody(models, "getProductMarketingAssessmentDimensions");
  say(!!fn, "getProductMarketingAssessmentDimensions exists");
  say(/getProductMarketingFullModel\(\)/.test(fn) && /getProductMarketingShortForm\(\)/.test(fn), "it reads the model at its pin, and its short form");
  say(/\.title/.test(fn), "dimension names are the short form's titles, as on the whole-model view");
  // EA's text at v1.1.2 is the commit D10 is already read from
  // (PRODUCT_MARKETING_D10_SOURCE_COMMIT), not EA_PINNED_COMMIT (v1.1.1).
  say(/fetchRawFrom\(PRODUCT_MARKETING_D10_RAW, "ai_native_ea_maturity_model\.md"\)/.test(fn) && /readThresholdStates\(/.test(fn),
    "Pre-AI and Exempt are read from the EA matrix at v1.1.2");
  say(/withShortFormFlags\(/.test(fn), "its flags come from its short form");
  // OKF-TOGAF#205, v1.0.3: the matrix in the common form in full, read through the family parser.
  const full = fnBody(models, "getProductMarketingFullModel");
  say(/readModelDimensions\(md\)/.test(full) && !/parseDimensionLevels\(/.test(full), "#205: the whole model is read through the family parser (lib/model-reader.js)");
  say(/const PRODUCT_MARKETING_PINNED_COMMIT = "c475da9585a876d5fc441f04a57779384a0f25a6";/.test(read("lib/pins.js")), "#205: Product Marketing is pinned at v1.0.3 (c475da9)");
  const pins = read("lib/pins.js");
  say(/const PRODUCT_MARKETING_D10_SOURCE_COMMIT = "2688129234b59c0f9a864512fbe68eadad41aabe";/.test(pins), "that commit is EA v1.1.2 (2688129)");
}

console.log("--- the two pages ---");
{
  const page = read("pages/models/productmarketing/assessment.js");
  say(/getProductMarketingAssessmentDimensions/.test(page) && /thresholdStates=\{thresholdStates\}/.test(page), "the page passes the two states to the shared component");
  say(/modelSlug="prodmar"/.test(page), "it sends the readout route's key, prodmar");
  say(/executiveReadoutHref="\/models\/productmarketing\/executivereadout"/.test(page) && /downloadFilename="productmarketing-maturity-assessment\.md"/.test(page), "it is wired to its own readout and file name");
  say(/modelFullName="AI-Native Product Marketing Maturity Model"/.test(page) && /repoUrl="https:\/\/github\.com\/superdtf-0882\/ai-native-product-marketing-maturity-model"/.test(page), "it names the model and its repository");
  const ro = read("pages/models/productmarketing/executivereadout.js");
  say(/assessmentHref="\/models\/productmarketing\/assessment"/.test(ro) && /diag_cache:\$\{hash\}/.test(ro), "the readout page reads the cache and links back to the assessment");
  const api = read("pages/api/diagnostic.js");
  say(/prodmar: \{ dimensionCount: 11, prompt: PRODMAR_EXECUTIVE_READOUT_PROMPT_V1, promptVersion: "prodmar-v1", thresholdStates: true \}/.test(api), "the route serves it: eleven dimensions, the approved prompt, both states");
}

console.log("--- the flags, on every model's assessment page ---");
{
  const helper = fnBody(models, "withShortFormFlags");
  say(!!helper && /\.flag/.test(helper) && /null/.test(helper), "withShortFormFlags carries each dimension's flag, or null");
  const ea = fnBody(models, "getEaAssessmentDimensions");
  say(/withShortFormFlags\(/.test(ea), "EA's loader brings EA's three");
  // OKF-TOGAF#207: PDLC's page reads through its own assessment loader, for Pre-AI and Exempt,
  // and the flags come with it, as EA's do.
  const pdlc = fnBody(models, "getPdlcAssessmentDimensions");
  say(/getPdlcShortForm\(\)/.test(pdlc) && /withShortFormFlags\(/.test(pdlc) && /getPdlcAssessmentDimensions\(\)/.test(read("pages/models/pdlc/assessment.js")), "PDLC's loader brings its short form's flags, none today");
  for (const [slug, short] of [["sdlc", "getSdlcShortForm"], ["prioritization", "getPrioritizationShortForm"]]) {
    const p = read("pages/models/" + slug + "/assessment.js");
    say(new RegExp(short + "\\(\\)").test(p) && /withShortFormFlags\(/.test(p), slug + ": the page reads its short form's flags, none today");
  }
  const comp = read("components/Assessment.js");
  say(/dim\.flag && \(/.test(comp) && /Open question\./.test(comp) && /<Marks text=\{dim\.flag\}/.test(comp), "the component shows the selected dimension's open question");
  say(/d\.flag && /.test(comp) && /className="dim-flag"/.test(comp), "and marks the flagged dimension in the list");
  // The downloaded file and the readout's input are unchanged: the flag is
  // shown to the reader, not scored (scripts/threshold-states-self-test.js
  // holds the file byte for byte).
  say(!/flag/.test(read("lib/assessment-md.js")), "the downloaded file carries no flag");
}

console.log("--- the counter, /assessments and the digest count five ---");
{
  const counts = read("lib/counts.js");
  say(/export const MODELS = \["sdlc", "pdlc", "prioritization", "ea", "prodmar"\];/.test(counts), "the counter's model list gains prodmar");
  const idx = read("pages/assessments/index.js");
  const at = idx.indexOf("AI-Native Product Marketing Maturity Assessment");
  const row = at < 0 ? "" : idx.slice(idx.lastIndexOf("<", idx.lastIndexOf("model-row", at)), idx.indexOf("</span>", at) + 7);
  say(/href="\/models\/productmarketing\/assessment"/.test(row) && /pill live">Live/.test(row), "/assessments: Product Marketing links to its assessment and reads Live");
  say(/All five live assessments/.test(idx) && !/All four live assessments/.test(idx), "the footnote counts five live assessments");
  say(/SPEC-D6-SCORE-EA/.test(idx) && /SPEC-D6-SCORE-PRODMAR/.test(idx), "the footnote names EA's and Product Marketing's instruments");
  const core = read("lib/aiDigestCore.js");
  say(/SPEC-D6-SCORE-PRODMAR/.test((core.match(/^G3\..*$/m) || [""])[0]), "the digest's G3 lists the instrument");
  say(/Formal scoring instruments exist for all five models/.test(core) && !/has no scoring instrument yet/.test(core), "the digest says all five have instruments");
}

console.log(bad ? "PRODMAR ASSESSMENT SELF-TEST FAIL" : "PRODMAR ASSESSMENT SELF-TEST PASS");
process.exit(bad);
