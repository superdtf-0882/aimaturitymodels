#!/usr/bin/env node
// Self-test for OKF-TOGAF#167 -- the Product Prioritization model renamed the
// AI-Native Portfolio Prioritization Maturity Model, on "Rename to Portfolio
// Prioritization as 118-DT2 rules; repository name kept; signed texts updated
// to match -- David Facer 10/7/2026" (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/118-DT2). Ids, routes, the repository's
// name and the prompt constants' names stay; titles change.
//
// Three things, offline:
//   the site's own text names the model by its new name;
//   the readout prompt V3 is V2 with the name changed and nothing else, and
//     the readout route uses it;
//   the model release the site pins (read from the local model clone, never
//     fetched) is v1.4.0 as ruled: title, first paragraph, the four D1 and D3
//     cells, a Roots section before the 2015 one, and the CHANGELOG entry.
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
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const body = (s, name) => { const m = s.match(new RegExp("export const " + name + " = `([\\s\\S]*?)`;")); return m ? m[1] : null; };

const OLD = /product prioritization/i;
const NEW_MODEL = "AI-Native Portfolio Prioritization Maturity Model";

// --- the site's text
console.log("--- the site's text ---");
// The two frozen prompts keep the old name: a prompt version is never edited
// (P-07). scripts/family-order-self-test.js quotes the owner's line of
// 2026-10-07 word for word, and a quotation is not edited. Everything else
// under pages/, lib/ and scripts/ uses the new name.
const FROZEN = new Set(["lib/prompts/prioritization-executive-readout-v1.js", "lib/prompts/prioritization-executive-readout-v2.js",
  "scripts/portfolio-name-self-test.js", "scripts/family-order-self-test.js",
  // OKF-TOGAF#169: names the old model only to check it is absent.
  "scripts/digest-consistency-self-test.js"]);
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : /\.js$/.test(d.name) ? [path.join(dir, d.name).replace(/\\/g, "/")] : []);
const left = ["pages", "lib", "scripts"].flatMap(walk).filter((f) => !FROZEN.has(f) && OLD.test(read(f)));
say(left.length === 0, "no page, library or script names the old model", left.join(", "));
const has = (f, s) => read(f).includes(s);
say(has("pages/models/index.js", '<div className="model-name">Portfolio Prioritization Maturity Model</div>'), "/models lists Portfolio Prioritization Maturity Model");
say(has("pages/assessments/index.js", '<div className="model-name">Portfolio Prioritization Maturity Assessment</div>'), "/assessments lists Portfolio Prioritization Maturity Assessment");
say(has("lib/pins.js", 'label: "' + NEW_MODEL + '"'), "the pins table labels the model by its new name");
say(has("lib/intros.js", "prioritization understood as asset allocation (Portfolio Prioritization)"), "the /models paragraph names Portfolio Prioritization");
say(has("lib/models.js", "https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model"), "the repository's name is kept (an identifier)");

// --- the prompt
console.log("--- the readout prompt ---");
const v2 = body(read("lib/prompts/prioritization-executive-readout-v2.js"), "PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V2");
const v3 = body(read("lib/prompts/prioritization-executive-readout-v3.js"), "PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V3");
const RENAMES = [
  ["a Product Prioritization Maturity Assessment", "a Portfolio Prioritization Maturity Assessment"],
  ["the AI-Native Product Prioritization Maturity Model", "the " + NEW_MODEL],
  ["an organization's product prioritization capability", "an organization's portfolio prioritization capability"],
];
const want = v2 && RENAMES.every(([a]) => v2.split(a).length === 2)
  ? RENAMES.reduce((t, [a, b]) => t.replace(a, b), v2) : null;
say(!!want, "V2 carries each of the three phrases exactly once");
say(!!v3 && v3 === want, "V3 is V2 with the name changed, nothing else");
say(!!v3 && !OLD.test(v3), "V3 does not name the old model");
const route = read("pages/api/diagnostic.js");
say(route.includes('prioritization: { dimensionCount: 3, prompt: PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V3, promptVersion: "prioritization-v3" }'),
  "the readout route uses V3 under its own prompt version");

// --- the pinned model release
console.log("--- the model release the site pins ---");
const pin = (read("lib/pins.js").match(/const PRIORITIZATION_PINNED_COMMIT = "([0-9a-f]{40})"/) || [])[1];
const clone = path.join(root, "..", "ai-native-product-prioritization-maturity-model");
const at = (file) => { try { return execSync(`git show ${pin}:${file}`, { cwd: clone, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).replace(/\r\n/g, "\n"); } catch { return ""; } };
// rev-list, not rev-parse v1.4.0^{commit}: Windows' shell strips the caret.
// 2026-10-08 (OKF-TOGAF#169): the pin may move to a later patch of v1.4.
const tagged = (() => { try { return execSync("git describe --tags --abbrev=0 " + pin, { cwd: clone, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } })();
say(!!pin && /^v1\.4\.\d+$/.test(tagged), "the pin is the model's v1.4.0 or a later v1.4 patch", (pin || "").slice(0, 7) + " / " + tagged);
const m = at("ai_native_product_prioritization_maturity_model.md");
const lines = m.split("\n");
say(lines[0] === "# " + NEW_MODEL + " — Matrix", "the matrix's title", lines[0]);
say(m.includes("This model appraises an organization's portfolio prioritization capability — its ability to see the whole of its discretionary work, product and internal alike, as one portfolio of fungible assets"), "the first paragraph, as DTOG drafted it");
for (const cell of ["Is portfolio value explicit, multi-dimensional", "an explicit model of portfolio value", "a shared portfolio-value model", "Portfolio prioritization operates as a continuous learning loop"]) {
  say(m.includes(cell), "cell: " + cell);
}
say(!/product value|product-value|product prioritization/i.test(m), "no cell or heading still uses the old name's phrasing");
const roots = m.indexOf("## Roots"), svm = m.indexOf("## The 2015 Strategic Value Matrix");
say(roots > 0 && svm > roots, "a Roots section before the 2015 Strategic Value Matrix");
say(m.includes("In 2010, a colleague and I implemented enterprise wide portfolio management"), "Roots names a colleague, as the owner chose");
const cl = at("CHANGELOG.md");
say(/^## v1\.4\.0 — 2026-10-07$/m.test(cl), "CHANGELOG: a v1.4.0 entry");
say(cl.includes("Scores against v1.3.0 remain comparable: no level's substance changed; D1 and D3 now name the portfolio, product and internal work alike, which the model always meant."), "CHANGELOG: the comparability line as ruled");

// --- the sibling models (2026-10-07, "Update the PDLC and EA mentions under
// #167 -- David Facer, to CC in session"): the PDLC model's notes and two
// deep-dives, read at the pin the site loads; the EA model's README, at its
// release tag (the site does not load READMEs, so EA's pin does not move).
console.log("--- the sibling models ---");
const gitIn = (dir, args) => { try { return execSync("git " + args, { cwd: path.join(root, "..", dir), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).replace(/\r\n/g, "\n"); } catch { return ""; } };
const pdlcPin = (read("lib/pins.js").match(/const PDLC_PINNED_COMMIT = "([0-9a-f]{40})"/) || [])[1];
const pdlcTag = gitIn("ai-native-pdlc-maturity-model", "describe --tags --abbrev=0 " + pdlcPin).trim();
say(!!pdlcPin && /^v1\.2\.([1-9]\d*)$/.test(pdlcTag), "the PDLC pin is v1.2.1 or a later v1.2 patch", (pdlcPin || "").slice(0, 7) + " / " + pdlcTag);
for (const f of ["ai_native_pdlc_maturity_model.md", "deep_dives/d5.md", "deep_dives/d11.md"]) {
  const s = gitIn("ai-native-pdlc-maturity-model", `show ${pdlcPin}:${f}`);
  say(!!s && !OLD.test(s) && s.includes(NEW_MODEL), "PDLC " + f + " names the new model");
}
const eaReadme = gitIn("ai-native-ea-maturity-model", "show v1.1.2:README.md");
say(!!eaReadme && !OLD.test(eaReadme) && eaReadme.includes(NEW_MODEL), "EA README at v1.1.2 names the new model");

console.log(bad ? "PORTFOLIO NAME SELF-TEST FAIL" : "PORTFOLIO NAME SELF-TEST PASS");
process.exit(bad);
