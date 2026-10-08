#!/usr/bin/env node
// Self-test for OKF-TOGAF#169 (spun off from #158): the full digest agrees
// with itself and with the models it carries. Five findings from an outside
// reading of /llms-full.txt (2026-10-08), each checked by CC before the item
// opened (OKF TOGAF briefs/2026-10-01-svm-tranche-3/164-CC):
//   1. each pinned model's matrix names, in its version line, the release that
//      last changed it -- PDLC read 1.2.0 at v1.2.1 and Portfolio Prioritization
//      1.2.0 at v1.4.0, CC's slips at those releases;
//   2. the SDLC matrix cites the shared D1-D3 layer at the version the layer
//      itself carries at the pin;
//   3. the Portfolio Prioritization matrix names all four models, by their
//      current names, where it says the level names are family-wide;
//   4. the digest's G2 and M12 count four models, EA included;
//   5. the digest's Strata section says feedback returns to the stratum it
//      bears on (SPEC-STRATA v2.4), not to S0 alone.
// Reads the models from their local clones at the site's pins; offline.
// Exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(64) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const git = (repo, args) => { try { return execSync("git " + args, { cwd: path.join(root, "..", repo), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).replace(/\r\n/g, "\n"); } catch { return ""; } };
const pins = read("lib/pins.js");
const pin = (k) => (pins.match(new RegExp("const " + k + ' = "([0-9a-f]{40})"')) || [])[1];

const MODELS = [
  ["SDLC", "SDLC_PINNED_COMMIT", "ai-native-sdlc-maturity-model", "ai_native_sdlc_maturity_model.md"],
  ["PDLC", "PDLC_PINNED_COMMIT", "ai-native-pdlc-maturity-model", "ai_native_pdlc_maturity_model.md"],
  ["Portfolio Prioritization", "PRIORITIZATION_PINNED_COMMIT", "ai-native-product-prioritization-maturity-model", "ai_native_product_prioritization_maturity_model.md"],
  ["EA", "EA_PINNED_COMMIT", "ai-native-ea-maturity-model", "ai_native_ea_maturity_model.md"],
];

console.log("--- 1. each matrix names the release that last changed it ---");
const text = {};
for (const [label, key, repo, file] of MODELS) {
  const p = pin(key);
  text[label] = git(repo, `show ${p}:${file}`);
  const line = (text[label].match(/^\*\*Version ([0-9.]+) —/m) || [])[1];
  const last = git(repo, `log -1 --format=%H ${p} -- ${file}`).trim();
  const rel = (git(repo, `tag --contains ${last} --sort=creatordate`).trim().split("\n")[0] || "").replace(/^v/, "");
  say(!!line && line === rel, label + ": the version line names " + (rel || "?"), "line " + line);
}

console.log("--- 2. the SDLC matrix cites the shared layer's own version ---");
{
  const layer = git("ai-native-sdlc-maturity-model", `show ${pin("SDLC_PINNED_COMMIT")}:shared_intelligence_layer.md`);
  const own = (layer.match(/STD-SHARED-INTELLIGENCE · v([0-9.]+) ·/) || [])[1];
  const cited = (text.SDLC.match(/`STD-SHARED-INTELLIGENCE` v([0-9.]+)\)/) || [])[1];
  say(!!own && cited === own, "the matrix cites v" + own, "cited v" + cited);
}

console.log("--- 3. the level names, family-wide, name all four models ---");
say(/every model in this family \(SDLC, PDLC, Portfolio Prioritization, and Enterprise Architecture\)/.test(text["Portfolio Prioritization"]),
  "Portfolio Prioritization's level-names line");
// Added the same day: PDLC carried the same line, missing EA, and the outside
// reading did not name it; CC found it in the built full file. Every model
// that lists the family in this line must list all four.
for (const [label] of MODELS) {
  const m = text[label].match(/every model in this family \(([^)]*)\)/);
  if (!m) continue;
  say(/Enterprise Architecture/.test(m[1]) && /Prioritization/.test(m[1]) && !/Product Prioritization/.test(m[1]),
    label + ": its family list names all four", "(" + m[1] + ")");
}

console.log("--- 4. the digest's instructions count four models ---");
const core = read("lib/aiDigestCore.js");
const withCol = MODELS.filter(([label]) => /Indicative evidence/.test(text[label])).length;
say(withCol === 1 && /one model with an Indicative evidence column and three without/.test(core), "G2: one with an Indicative evidence column, three without", withCol + " with");
say(/thirteen, twelve, three, and ten dimensions/.test(core), "M12: thirteen, twelve, three, and ten dimensions");

console.log("--- 5. Strata: feedback returns to the stratum it bears on ---");
say(!/returns findings to S0 \(Intent\)/.test(core), "no \"returns findings to S0 (Intent)\"");
say(/returns findings to the stratum they bear on/.test(core), "the digest says the stratum they bear on");

console.log(bad ? "DIGEST CONSISTENCY SELF-TEST FAIL" : "DIGEST CONSISTENCY SELF-TEST PASS");
process.exit(bad);
