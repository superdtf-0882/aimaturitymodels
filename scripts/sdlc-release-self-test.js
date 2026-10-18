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
// v1.4.0, OKF-TOGAF#200, on "I ratify STD-SHARED-INTELLIGENCE v1.2 as
// DTOG-200-fixes settles it ... -- David Facer 10/15/2026": the layer at v1.2
// reads the same from every function's chair, and D1 and D3 at D require that
// no function keeps its own version; the short form names v1.4.0.
//
// v1.4.2, OKF-TOGAF#204, on the owner's #204 plan line and "Approve the family
// file's text as DTOG-family-levels-text gives it; CC lands it in SDLC's #204
// release -- David Facer 10/17/2026": family_maturity_levels.md (STD-FAMILY-LEVELS
// v1.0) at the pin, the matrix's names section the five names and a pointer to
// it, and the pages reading the names from it (lib/familyLevels.js).
//
// v1.4.3, OKF-TOGAF#205, on "Build SDLC's layout release as 419-CC plans it, with
// 420-CC's amendments -- David Facer 10/17/2026": the matrix and the layer in the family's
// common form, read through the vendored family parser (lib/model-reader.js), the
// transition-states file retired, and PDLC's D1-D3 on their own pin at v1.4.0, the tag PDLC
// cites (lib/pins.js). The cases below read the model as the pages now do.
//
// Usage: node scripts/sdlc-release-self-test.js   (network; exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { SDLC_PINNED_COMMIT, SDLC_SHORT_FORM_PINNED_COMMIT, PDLC_D1_D3_SOURCE_COMMIT } = require("../lib/pins");
const { readSdlcDimensions } = require("../lib/model-reader");
const { parseFamilyLevels } = require("../lib/familyLevels");

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
  const matrix = await get(SDLC_PINNED_COMMIT, "ai_native_sdlc_maturity_model.md");
  const byId = readSdlcDimensions(shared.text, matrix.text);
  const dims = ["D1", "D2", "D3"].map((id) => byId.get(id)).filter(Boolean);
  let v = 0;
  for (const d of dims) for (const t of Object.values(d.transitions || {})) if (t.verification) v++;
  say(dims.length === 3 && v === 12, "#143: all twelve D1-D3 transitions carry a verification", v + " of 12");

  // #200: STD-SHARED-INTELLIGENCE v1.2 at the pin.
  say(/STD-SHARED-INTELLIGENCE · v1\.2 ·/.test(shared.text) && shared.text.includes("**Reading from a chair.**"), "#200: the layer is v1.2, with its reading-from-a-chair paragraph");
  say(shared.text.includes("rather than commissioning separate research or maintaining a version of their own")
    && shared.text.includes("rather than commissioning separate research or maintaining a feed of their own"),
    "#200: D1 and D3 at D require that no function keeps its own version");

  const d11 = byId.get("D11");
  say(!!d11 && /attributable/.test(d11.desc) && !/Deferred/i.test(d11.desc) && !d11.desc.includes("*"),
    "#156: D11's definition is the rewrite, plain text, not deferred");
  say(/Version 1\.3\.0/.test(matrix.text), "#156: the matrix declares v1.3.0");
  say(/^\*\*Version 1\.4\.3/m.test(matrix.text) && matrix.text.includes("(`STD-SHARED-INTELLIGENCE` v1.2)"), "#205: the matrix leads with v1.4.3 and cites the layer at v1.2");
  say(!/STD-SHARED-INTELLIGENCE v1\.1 as of/.test(matrix.text) && matrix.text.includes("(STD-SHARED-INTELLIGENCE v1.2 as of 2026-10-16)"),
    "#200 (v1.4.1): the closing status line cites the layer at v1.2, not v1.1");

  // #204: the level names' one home, and the matrix's names section in M3's fixed form.
  const fam = await get(SDLC_PINNED_COMMIT, "family_maturity_levels.md");
  let levels = null;
  try { levels = parseFamilyLevels(fam.text); } catch { /* reported below */ }
  say(fam.status === 200 && /^\*\*STD-FAMILY-LEVELS · v1\.0 · \d{4}-\d{2}-\d{2}\*\*$/m.test(fam.text), "#204: family_maturity_levels.md is at the pin, STD-FAMILY-LEVELS v1.0", String(fam.status));
  say(!!levels && Object.values(levels.names).join(" ") === "Nascent Modeled Continuous Integral Telemetric" && Object.keys(levels.oneLine).length === 5,
    "#204: the family file gives five names and five one-line descriptions", levels ? Object.values(levels.names).join(" ") : "unparsed");
  const names = (matrix.text.split("## Family maturity names")[1] || "").split("\n---")[0].split("\n").map((l) => l.trim()).filter(Boolean);
  say(names.length === 2 && names[0] === "A — Nascent · B — Modeled · C — Continuous · D — Integral · E — Telemetric" && /^Names, descriptions and the general shape: family_maturity_levels\.md in github\.com\/superdtf-0882\/ai-native-sdlc-maturity-model at v1\.4\.2\.$/.test(names[1] || ""),
    "#204: the matrix's names section is the names line and the pointer", JSON.stringify(names).slice(0, 80));
  say(!/### Maturity-level names/.test(matrix.text) && !/shared with the AI-Native PDLC Maturity Model/.test(matrix.text), "#204: no table of names and no list of models in the matrix");

  // #205: the matrix is the one home of D4-D13's transitions; the file that held a second copy is gone.
  // The pages read the transition's text; its title ("Instrument the hits and the silence") is
  // read from the matrix's D11 section, as the page shows no titles.
  const d11t = d11 ? Object.values(d11.transitions).map((x) => x.text + " " + x.verification).join(" ") : "";
  const d11s = matrix.text.slice(matrix.text.indexOf("\n## D11."), matrix.text.indexOf("\n## D12."));
  say(/declare the paths by which it can be crossed/.test(d11t) && /^\*\*Transition from D to E\*\* — Instrument the hits and the silence$/m.test(d11s),
    "#156: D11's transitions are the rewrite, read from the matrix");
  const ts = await get(SDLC_PINNED_COMMIT, "sdlc_transition_states_d4_d13.md");
  say(ts.status === 404, "#205: the transition-states file is retired at the pin", String(ts.status));
  const rest = Array.from({ length: 10 }, (_, i) => byId.get("D" + (i + 4))).filter(Boolean);
  const full = rest.filter((d) => Object.keys(d.transitions).length === 4 && Object.values(d.transitions).every((x) => x.text && x.verification) && d.sustainment);
  say(rest.length === 10 && full.length === 10, "#205: D4-D13 each give four transitions, verified, and a sustainment", full.length + " of 10");
  say(!/^\*\*Level [A-E]/m.test(matrix.text + shared.text) && (matrix.text.match(/^### [A-E] — /gm) || []).length === 50 && (shared.text.match(/^### [A-E] — /gm) || []).length === 15,
    "#205: the matrix and the layer write their levels in the common form");
  say(dims.every((d) => / From D\d's vantage/.test(d.levels.E || "")), "#205: each layer vantage still reads after its level E");
  say(/^\*\*Basis:\*\* STD-SHARED-INTELLIGENCE v1\.2, github\.com\/superdtf-0882\/ai-native-sdlc-maturity-model\/shared_intelligence_layer\.md, in this repository; referenced\.$/m.test(matrix.text),
    "#205: the matrix's D1-D3 section names the layer's home");

  const rule = await get(SDLC_PINNED_COMMIT, "guardrail_rule.md");
  say(rule.status === 200 && /frequently contacted mean there is a broken process/.test(rule.text),
    "the guardrail rule's file exists at the pin", String(rule.status));

  console.log("--- the short form at SDLC_SHORT_FORM_PINNED_COMMIT " + SDLC_SHORT_FORM_PINNED_COMMIT.slice(0, 7) + " ---");
  const sf = await get(SDLC_SHORT_FORM_PINNED_COMMIT, "short_form.yml");
  let doc = null;
  try { doc = yaml.load(sf.text); } catch { /* reported below */ }
  const cells = doc ? doc.dimensions.D11.levels : {};
  say(!!doc && !doc.dimensions.D11.flag && doc.source_matrix_version === "1.4.3" && /agent/i.test(cells.A || "") && /telemetry/.test(cells.E || ""),
    "#156: D11's five cells re-compressed, its flag gone; the short form names v1.4.3", doc ? doc.source_matrix_version : "unparsed");

  console.log("--- PDLC's D1-D3 at PDLC_D1_D3_SOURCE_COMMIT " + PDLC_D1_D3_SOURCE_COMMIT.slice(0, 7) + " ---");
  const pl = await get(PDLC_D1_D3_SOURCE_COMMIT, "shared_intelligence_layer.md");
  const pdims = [...readSdlcDimensions(pl.text, "").values()];
  let pv = 0;
  for (const d of pdims) for (const x of Object.values(d.transitions || {})) if (x.verification) pv++;
  say(pdims.length === 3 && pv === 12 && /STD-SHARED-INTELLIGENCE · v1\.2 ·/.test(pl.text), "#205: PDLC's page reads the v1.2 layer at its D1-D3 pin through the family parser", pv + " of 12");
  const psf = await get(PDLC_D1_D3_SOURCE_COMMIT, "short_form.yml");
  let pdoc = null;
  try { pdoc = yaml.load(psf.text); } catch { /* reported below */ }
  say(!!pdoc && !!doc && ["D1", "D2", "D3"].every((id) => JSON.stringify(pdoc.dimensions[id]) === JSON.stringify(doc.dimensions[id])),
    "#205: PDLC's D1-D3 cells at their pin are SDLC's at the pin");

  console.log("--- this site's own words ---");
  const core = fs.readFileSync(path.join(__dirname, "..", "lib", "aiDigestCore.js"), "utf8");
  say(!/without verification statements in that same per-transition form yet/.test(core) && !/D1–D3 in both SDLC and PDLC, inherited by reference from the Shared Intelligence Layer and owned by neither model — say so/.test(core),
    "the AI digest no longer says D1-D3 lack verification");
  say(/STD-SHARED-INTELLIGENCE v1\.2/.test(core) && !/STD-SHARED-INTELLIGENCE v1\.1/.test(core), "#200: the AI digest names the layer at v1.2");

  process.exitCode = bad;
})();
