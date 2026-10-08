#!/usr/bin/env node
// Self-test for OKF-TOGAF#158, step 1 (122-DT2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/): the AI-readable digest says only what
// it holds. On "Work #158 and #159 as a tandem as 122-DT2 sets out: the false
// sentence first, alone -- David Facer 10/8/2026".
//
// Three faults DTOG found on 2026-10-06 and 101-CC confirmed live:
//   1. "all four live models" while the digest renders three model sections;
//   2. Strata called "a governance-layer model" -- the owner's signed
//      introduction calls it "the architectural governance plane";
//   3. EA OKF called "the schema they're built on" / "the schema this family
//      is written in" -- the introduction calls it "the machine-readable
//      representation contract for the architecture corpus", and says not to
//      read it as an architectural foundation.
// Checks the digest's source and the /ai page, offline; with --built, also
// the generated public/llms.txt. Exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(62) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const WORDS = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six" };

const core = read("lib/aiDigestCore.js");
const ai = read("pages/ai.js");

console.log("--- the model count ---");
// The model sections the digest builds: its "## AI-Native ... Maturity Model" headings.
const sections = (core.match(/^## AI-Native [^\n]* Maturity Model$/gm) || []).length;
// 2026-10-08, step 3: the digest renders all four, so the claim may read "all four live models".
const claim = (core.match(/\*\*What's included:\*\* (?:all )?(\w+)(?: of the \w+)? live models/) || []);
say(sections > 0, "the digest builds model sections", String(sections));
say(claim[1] === WORDS[sections], "\"What's included\" names the number it holds", (claim[1] || "no count") + " / " + sections);
say(sections === 4 || !/all four live models in the AI-Native Maturity Model family/.test(core), "no \"all four\" unless all four are held");
const prov = (core.match(/\* The (\w+) maturity models — /) || [])[1];
say(prov === WORDS[sections], "the provenance line agrees", (prov || "none") + " / " + sections);

console.log("--- Strata and EA OKF, in the owner's words ---");
for (const [label, src] of [["lib/aiDigestCore.js", core], ["pages/ai.js", ai]]) {
  say(!/governance-layer model/.test(src), label + ": no \"governance-layer model\"");
  say(!/Enterprise Architecture OKF\s+schema they're built on/.test(src), label + ": no \"the schema they're built on\"");
}
say(!/\*\*Enterprise Architecture OKF\*\* — the schema this family is written in/.test(core), "the instruction list does not call EA OKF the schema");
say(/the architectural governance plane/.test(core) && /the architectural governance plane/.test(ai), "both name Strata as the architectural governance plane");
say(/the machine-readable representation contract for the architecture corpus/.test(core), "the digest names EA OKF as the representation contract");

if (process.argv.includes("--built")) {
  console.log("--- the built /llms.txt ---");
  // Step 3 (2026-10-08): the full digest is /llms-full.txt; /llms.txt is the map.
  const built = read("public/llms-full.txt") || "";
  const n = (built.match(/^## AI-Native [^\n]* Maturity Model$/gm) || []).length;
  say(!!built, "public/llms-full.txt exists");
  say(new RegExp("\\*\\*What's included:\\*\\* (all )?" + WORDS[n] + "( of the \\w+)? live models").test(built), "the built digest's count matches its sections", String(n));
  say(!/governance-layer model/.test(built), "the built digest has no \"governance-layer model\"");
}

console.log(bad ? "DIGEST CLAIMS SELF-TEST FAIL" : "DIGEST CLAIMS SELF-TEST PASS");
process.exit(bad);
