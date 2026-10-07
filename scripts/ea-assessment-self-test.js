#!/usr/bin/env node
// Self-test for OKF-TOGAF#145 -- EA assessment parity, on "Build #145 as
// DTOG's package plans it; fix the stale EA line on /assessments now --
// David Facer 10/7/2026". The plan is DTOG's package in OKF TOGAF
// briefs/2026-09-26-ea-assessment-parity/.
//
// First, the stale line: /assessments said the EA assessment was "Waiting on
// the model itself", but the EA model has been live since 2026-09-12
// (OKF-TOGAF#126).
//
// Source checks, offline.
// Usage: node scripts/ea-assessment-self-test.js   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
// Line endings as Git stores them (LF), which is what Vercel builds from.
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };

console.log("--- /assessments, the EA row ---");
{
  const page = read("pages/assessments/index.js");
  const i = page.indexOf("AI-Native EA Maturity Assessment");
  const row = i < 0 ? "" : page.slice(i, page.indexOf("</span>", i) + 7);
  say(i >= 0, "the EA row exists");
  say(!!row && !/Waiting on the model itself/.test(row), "it no longer says the model is missing");
  // [The interim line, "The model is published; its assessment and Executive
  // Readout are next", was checked here until the build: the row is now the
  // Live row, checked below.]
}

// [The #145 build: DTOG's package section 2 -- two page wrappers, one readout
// config line, the /assessments row -- and the prompt, approved on "The EA
// readout prompt as DTOG drafted it, with a stronger Pre-AI line -- David
// Facer 10/7/2026". Pre-AI and Exempt come with it (OKF-TOGAF#161).]
{
  console.log("--- the EA assessment page ---");
  const models = read("lib/models.js");
  const fn = (models.match(/export async function getEaAssessmentDimensions\(\)\s*\{([\s\S]*?)\n\}/) || [])[1] || "";
  say(/getEaFullModel\(\)/.test(fn) && /thresholdStates:\s*readThresholdStates\(/.test(fn), "its loader reads the EA model at its pin, with Pre-AI and Exempt");
  const page = read("pages/models/ea/assessment.js");
  say(/getEaAssessmentDimensions/.test(page) && /thresholdStates=\{thresholdStates\}/.test(page), "the page passes the two states to the shared component");
  say(/modelSlug="ea"/.test(page) && /executiveReadoutHref="\/models\/ea\/executivereadout"/.test(page) && /downloadFilename="ea-maturity-assessment\.md"/.test(page), "it is wired as EA, to EA's readout");

  console.log("--- the EA readout ---");
  const ro = read("pages/models/ea/executivereadout.js");
  say(/assessmentHref="\/models\/ea\/assessment"/.test(ro) && /diag_cache:\$\{hash\}/.test(ro), "the readout page reads the cache and links back to EA's assessment");
  const api = read("pages/api/diagnostic.js");
  say(/ea: \{ dimensionCount: 10, prompt: EA_EXECUTIVE_READOUT_PROMPT_V1, promptVersion: "ea-v1", thresholdStates: true \}/.test(api), "the route serves EA: ten dimensions, the approved prompt, both states");

  console.log("--- the EA prompt ---");
  const p = read("lib/prompts/ea-executive-readout-v1.js");
  const body = (p.match(/export const EA_EXECUTIVE_READOUT_PROMPT_V1 = `([\s\S]*?)`;/) || [])[1];
  const LINE = "Name every Pre-AI dimension in the readout, whether one dimension is Pre-AI or most are: say what that capability does for the business, whether it should stay Pre-AI for now or is among the next to adopt AI, and why. A Pre-AI dimension left unmentioned is an omission, not a judgement.";
  say(!!body && body.includes("Expect Pre-AI to be common.") && body.indexOf(LINE) > body.indexOf("Expect Pre-AI to be common."), "the stronger Pre-AI line follows the draft's Pre-AI paragraph");
  // DTOG's draft, its prompt text hashed from the drop (briefs/dtog/ in OKF
  // TOGAF, 2026-10-07), not retyped.
  const DRAFT = "54e179cc819eef93ae10fb13c9ac2bb682745a7c118b4342792a94fe78eddbb4";
  const without = body ? body.replace("\n\n" + LINE, "") : "";
  const got = crypto.createHash("sha256").update(without).digest("hex");
  say(!!body && without !== body && got === DRAFT, "without that line, it is DTOG's draft byte for byte", got.slice(0, 16));

  console.log("--- /assessments lists EA as live ---");
  const idx = read("pages/assessments/index.js");
  const i = idx.indexOf("AI-Native EA Maturity Assessment");
  const row = i < 0 ? "" : idx.slice(idx.lastIndexOf("<", idx.lastIndexOf("model-row", i)), idx.indexOf("</span>", i) + 7);
  say(/href="\/models\/ea\/assessment"/.test(row) && /pill live">Live/.test(row), "the EA row links to the assessment and reads Live");
  say(!/All three live assessments/.test(idx) && /All four live assessments/.test(idx), "the footnote counts four live assessments");
}

process.exitCode = bad;
