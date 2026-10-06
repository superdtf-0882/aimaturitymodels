#!/usr/bin/env node
// Self-test for the SDLC model's v1.3.0 release on this site -- OKF-TOGAF#143
// (twelve D1-D3 verification statements, STD-SHARED-INTELLIGENCE v1.1) and
// OKF-TOGAF#156 (D11 rewritten), on "I ratify #143's twelve clauses. Ship D11.
// David Facer 10/6/2026".
//
// It reads the model AT THE COMMITS THIS SITE PINS (lib/pins.js), over HTTPS
// from raw.githubusercontent.com, with the site's own parser -- so it answers
// "will the pages show the release", not "does the model repository have it".
// Against the old pins it fails; after the pin move it passes.
//
// #143's declared reach: Verification rendered on all twelve D1-D3 transitions
// on /models/sdlc/whole-model-view and /models/pdlc/whole-model-view, from the
// pinned commit. Both pages read the shared layer at SDLC_PINNED_COMMIT.
//
// Usage: node scripts/sdlc-release-self-test.js   (network; exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { parseDimensionLevels, normalizeSharedDimension } = require("../lib/dimension-parser");
const { SDLC_PINNED_COMMIT, SDLC_SHORT_FORM_PINNED_COMMIT } = require("../lib/pins");

const RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/";
let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
async function get(commit, file) {
  const res = await fetch(RAW + commit + "/" + file);
  return { status: res.status, text: res.ok ? await res.text() : "" };
}

(async () => {
  console.log("--- the model at SDLC_PINNED_COMMIT " + SDLC_PINNED_COMMIT.slice(0, 7) + " ---");
  const shared = await get(SDLC_PINNED_COMMIT, "shared_intelligence_layer.md");
  const dims = parseDimensionLevels(shared.text, { captureTransitions: true }).map((d) => normalizeSharedDimension(d));
  let v = 0;
  for (const d of dims) for (const t of Object.values(d.transitions || {})) if (t.verification) v++;
  say(dims.length === 3 && v === 12, "#143: all twelve D1-D3 transitions carry a verification", v + " of 12");

  const matrix = await get(SDLC_PINNED_COMMIT, "ai_native_sdlc_maturity_model.md");
  const d11 = parseDimensionLevels(matrix.text, { captureTransitions: true }).find((d) => d.id === "D11");
  say(!!d11 && /attributable/.test(d11.desc) && !/Deferred/i.test(d11.desc) && !d11.desc.includes("*"),
    "#156: D11's definition is the rewrite, plain text, not deferred");
  say(/Version 1\.3\.0/.test(matrix.text), "#156: the matrix declares v1.3.0");

  const ts = await get(SDLC_PINNED_COMMIT, "sdlc_transition_states_d4_d13.md");
  const tsD11 = ts.text.slice(ts.text.indexOf("# D11."), ts.text.indexOf("# D12."));
  say(tsD11.length > 0 && !/Draft caution/.test(tsD11) && /declare the paths by which it can be crossed/.test(tsD11) && /Instrument the hits and the silence/.test(tsD11),
    "#156: D11's transitions are the rewrite, no draft caution");

  const rule = await get(SDLC_PINNED_COMMIT, "guardrail_rule.md");
  say(rule.status === 200 && /frequently contacted mean there is a broken process/.test(rule.text),
    "the guardrail rule's file exists at the pin", String(rule.status));

  console.log("--- the short form at SDLC_SHORT_FORM_PINNED_COMMIT " + SDLC_SHORT_FORM_PINNED_COMMIT.slice(0, 7) + " ---");
  const sf = await get(SDLC_SHORT_FORM_PINNED_COMMIT, "short_form.yml");
  let doc = null;
  try { doc = yaml.load(sf.text); } catch { /* reported below */ }
  const cells = doc ? doc.dimensions.D11.levels : {};
  say(!!doc && !doc.dimensions.D11.flag && doc.source_matrix_version === "1.3.0" && /agent/i.test(cells.A || "") && /telemetry/.test(cells.E || ""),
    "#156: D11's five cells re-compressed, its flag gone", doc ? doc.version : "unparsed");

  console.log("--- this site's own words ---");
  const core = fs.readFileSync(path.join(__dirname, "..", "lib", "aiDigestCore.js"), "utf8");
  say(!/without verification statements in that same per-transition form yet/.test(core) && !/D1–D3 in both SDLC and PDLC, inherited by reference from the Shared Intelligence Layer and owned by neither model — say so/.test(core),
    "the AI digest no longer says D1-D3 lack verification");

  process.exitCode = bad;
})();
