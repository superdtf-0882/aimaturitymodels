#!/usr/bin/env node
// Self-test for the scores and the model version kept with every Executive
// Readout -- OKF-TOGAF#217, on the owner's line "Approve #217's plan as 556-CC
// sets it out with 265-DT2's two changes as 557-CC words them -- David Facer
// 10/19/2026" (OKF TOGAF briefs/2026-10-01-svm-tranche-3/556-CC, 265-DT2,
// 557-CC). Declared reach: every Executive Readout, on the page and in its
// download, shows the scores it was written from and the model version.
//
// What the entry keeps: the readout text, the scores as the visitor sent them,
// the Exempt reasons in the visitor's own words, the model's version recorded
// when the readout is written, and the date. Nothing kept with the readout
// names the visitor. An entry saved as text alone, before this change, still
// opens and says its scores weren't kept; found by a new request, it is saved
// again with the scores that request carries, and its version is recorded as
// not kept, because the cache key carries no pin and the pin may have moved
// since it was written (265-DT2 section 2). A kept readout goes on naming the
// version it was written under after a pin moves, which is right: never read
// the current pin for an entry already kept.
//
// lib/readout-entry.js and lib/pins.js are CommonJS and loaded; the API route,
// the component and the pages are ES modules Next compiles, so they are read
// as text.
// Usage: node scripts/readout-entry-self-test.js   (exit 1 on a failing case)
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } };
let failed = 0;
const check = (cond, what) => { console.log("  " + (cond ? "PASS" : "FAIL") + "  " + what); if (!cond) failed = 1; };
const attempt = (fn) => { try { return fn(); } catch { return undefined; } };

console.log("SELF-TEST -- the scores and model version kept with every readout (OKF-TOGAF#217).\n");

let E = {};
try { E = require(path.join(root, "lib/readout-entry.js")); } catch { E = {}; }
let P = {};
try { P = require(path.join(root, "lib/pins.js")); } catch { P = {}; }

// 1. The version beside each model's own pin, moved in the same commit.
const WANT_VERSIONS = { sdlc: "v1.4.3", pdlc: "v1.2.5", prioritization: "v1.4.3", ea: "v1.1.4", prodmar: "v1.0.3" };
const MV = P.MODEL_VERSIONS || {};
check(Object.keys(WANT_VERSIONS).every((k) => MV[k] === WANT_VERSIONS[k]), "each model's version sits beside its pin: SDLC v1.4.3, PDLC v1.2.5, Prioritization v1.4.3, EA v1.1.4, Product Marketing v1.0.3");
const pins = read("lib/pins.js");
for (const [name, v] of [["SDLC", "v1.4.3"], ["PDLC", "v1.2.5"], ["PRIORITIZATION", "v1.4.3"], ["EA", "v1.1.4"], ["PRODUCT_MARKETING", "v1.0.3"]]) {
  const pinAt = pins.indexOf("const " + name + "_PINNED_COMMIT =");
  const verAt = pins.indexOf("const " + name + "_VERSION = \"" + v + "\"");
  check(pinAt > -1 && verAt > pinAt && verAt - pinAt < 400, name + "_VERSION is written on the lines after " + name + "_PINNED_COMMIT");
}
check(attempt(() => E.versionFor("sdlc")) === "v1.4.3" && attempt(() => E.versionFor("prodmar")) === "v1.0.3" && attempt(() => E.versionFor("nope")) === null, "the version for a model is read from the pins, and an unknown model has none");

// 2. The scores, read from the assessment the visitor sent.
const MD = [
  "# AI-Native SDLC Maturity Model", "", "## Scores", "",
  "| Dimension | Name | Level |", "|---|---|---|",
  "| D1 | Strategy | C |", "| D2 | Discovery | Pre-AI |", "| D3 | Delivery | Exempt |", "",
  "## Exempt dimensions", "", "- D3 — Delivery: Regulated by the Acme charter", "", "---", "",
].join("\n");
const sc = attempt(() => E.scoresFromMd(MD, 3, { thresholdStates: true }));
check(Array.isArray(sc && sc.scores) && sc.scores.length === 3 && sc.scores[0].id === "D1" && sc.scores[0].name === "Strategy" && sc.scores[0].level === "C", "each dimension's id, name and level, as the visitor's assessment states them");
check(sc && sc.scores && sc.scores[1].level === "Pre-AI" && sc.scores[2].level === "Exempt", "Pre-AI and Exempt as the assessment shows them");
check(sc && sc.reasons && sc.reasons.D3 === "Regulated by the Acme charter", "the Exempt reason in the visitor's own words");
check(attempt(() => E.scoresFromMd(MD, 4, { thresholdStates: true })) === null, "an assessment missing a dimension gives no scores");

// 3. A new entry: written and read back.
const raw = attempt(() => E.encodeEntry({ readout: "The readout.", scores: sc.scores, reasons: sc.reasons, version: "v1.4.3", writtenAt: "2026-10-20" }));
const back = attempt(() => E.decodeEntry(raw));
check(typeof raw === "string" && back && back.readout === "The readout." && back.version === "v1.4.3" && back.scores.length === 3 && back.reasons.D3 === "Regulated by the Acme charter", "a new entry keeps the readout, the scores, the reasons and the version, and reads back whole");
const keys = attempt(() => Object.keys(JSON.parse(raw)).sort().join(","));
check(keys === "readout,readoutEntry,reasons,scores,version,writtenAt", "nothing else is kept with the readout: no address, no name, no browser detail");
check(attempt(() => JSON.parse(raw).writtenAt) === "2026-10-20", "the date written is a day, not a time");

// 4. An entry saved as text alone, before this change.
const old = attempt(() => E.decodeEntry("## Summary\n\nAn older readout."));
check(old && old.readout === "## Summary\n\nAn older readout." && old.scores === null && old.version === null, "an entry saved as text alone still opens, with no scores and no version");
const jsonish = attempt(() => E.decodeEntry("{\"readout\": \"not ours\"}"));
check(jsonish && jsonish.readout === "{\"readout\": \"not ours\"}" && jsonish.scores === null, "text that merely looks like JSON is read as text");
check(attempt(() => E.decodeEntry(null)) === null && attempt(() => E.decodeEntry("")) === null, "no entry reads as none");
const up = attempt(() => E.decodeEntry(E.upgradeEntry("An older readout.", sc.scores, sc.reasons, "2026-10-20")));
check(up && up.readout === "An older readout." && up.scores.length === 3 && up.version === null, "a text-only entry saved again keeps the scores the request carries and records the version as not kept");

// 5. What the page and the download say.
check(attempt(() => E.versionLine("AI-Native SDLC Maturity Model", "v1.4.3")) === "Scored against the AI-Native SDLC Maturity Model v1.4.3.", "the version line, in the wording the card models-doesnt-describe-us uses");
check(attempt(() => E.versionLine("AI-Native SDLC Maturity Model", null)) === "The model version wasn't kept with this readout.", "a readout whose version wasn't kept says so");
check(attempt(() => E.NO_SCORES) === "This readout was saved before scores were kept with it.", "a readout whose scores weren't kept says so");
const dl = attempt(() => E.downloadMd(back, "AI-Native SDLC Maturity Model", "https://example.org/model")) || "";
check(/## Your scores/.test(dl) && /\| D1 \| Strategy \| C \|/.test(dl) && /\| D2 \| Discovery \| Pre-AI \|/.test(dl), "the download carries the scores as a table");
check(/\| D3 \| Delivery \| Exempt: Regulated by the Acme charter \|/.test(dl), "the download shows each Exempt reason in its table");
check(dl.includes("Scored against the AI-Native SDLC Maturity Model v1.4.3.") && dl.includes("The readout.") && dl.indexOf("## Your scores") < dl.indexOf("The readout."), "the download names the version and puts the scores before the readout");
check(/CC BY 4\.0/.test(dl) && dl.includes("https://example.org/model"), "the download keeps its licence and model lines");
const dlOld = attempt(() => E.downloadMd(old, "AI-Native SDLC Maturity Model", "https://example.org/model")) || "";
check(dlOld.includes("This readout was saved before scores were kept with it.") && dlOld.includes("The model version wasn't kept with this readout."), "an older readout's download says what wasn't kept");

// 6. The readout service.
const diag = read("pages/api/diagnostic.js");
check(/require\("\.\.\/\.\.\/lib\/readout-entry"\)/.test(diag), "the readout service writes entries through lib/readout-entry.js");
check(/scoresFromMd\(body\.md/.test(diag) && /encodeEntry\(\{[^}]*version: versionFor\(body\.model\)/.test(diag), "a fresh readout records the version it is written under");
check(/kvSet\(cacheKey, encodeEntry\(/.test(diag) && /READOUT_KEPT_SECONDS/.test(diag), "the entry is kept four days, as the readout was");
check(/decodeEntry\(cached\)/.test(diag) && /upgradeEntry\(/.test(diag) && !/upgradeEntry\([^)]*versionFor/.test(diag), "a text-only entry found by a request is saved again with its scores, never with the current version");

// 7. The five readout pages and the shared component.
for (const dir of ["sdlc", "pdlc", "prioritization", "ea", "productmarketing"]) {
  const page = read("pages/models/" + dir + "/executivereadout.js");
  check(/decodeEntry\(await kvGet\(`diag_cache:\$\{hash\}`\)\)/.test(page) && /scores=\{scores\}/.test(page) && /version=\{version\}/.test(page), "the " + dir + " readout page reads the entry and passes its scores and version");
}
const ro = read("components/ExecutiveReadout.js");
check(/className="readout-scores"/.test(ro) && ro.indexOf('className="readout-scores"') < ro.indexOf('className="readout-body"'), "the readout page shows the scores above the readout");
check(/versionLine\(modelTitle, version\)/.test(ro) && /NO_SCORES/.test(ro), "the page names the version, or says what wasn't kept");
check(/downloadMd\(/.test(ro), "the download is the same document the page shows");
check(!/localStorage|sessionStorage|document\.cookie/.test(ro), "nothing is kept in the visitor's browser");

console.log("\n" + (failed ? "FAIL" : "PASS") + " -- readout entry self-test.");
process.exit(failed);
