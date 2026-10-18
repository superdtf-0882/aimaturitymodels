#!/usr/bin/env node
// Self-test for the vendored family parser and the SDLC adapter (OKF-TOGAF#205,
// STD-MODEL-PARTS v1.1 §7.2), on "Build SDLC's layout release as 419-CC plans it,
// with 420-CC's amendments -- David Facer 10/17/2026".
//
// lib/model-parser.js is the family's one reader, copied byte for byte from the
// practice's model template. Its hash is held here with the template commit it came
// from, so an edit made on this site, and not in the template, fails this test. The
// model repositories carry the same file in tools/; the SDLC copy at the pin is read
// over HTTPS and compared too. lib/model-reader.js maps the parser's shape onto the
// fields the pages already use, and the fixtures below hold that mapping.
//
// From Product Marketing's v1.0.3 (OKF-TOGAF#205), on "Build Product Marketing's two
// releases as 429-CC plans them, with 222-DT2's answers and the flag wording in 430-CC
// -- David Facer 10/17/2026": the reader reads every dimension a file renders, inherited
// ones included, and Product Marketing's copy of the parser at its pin is compared too.
//
// Usage: node scripts/model-parser-vendored-self-test.js [--offline]   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { SDLC_PINNED_COMMIT, PRODUCT_MARKETING_PINNED_COMMIT } = require("../lib/pins");
const { readSdlcDimensions, readModelDimensions } = require("../lib/model-reader");

// The template's tools/model-parser.js at OKF-TOGAF 56bbb79, line endings as LF.
const TEMPLATE_COMMIT = "56bbb79";
const TEMPLATE_SHA256 = "8a107d7463b750f45b4842d22e370b8716e40a3faa2d95d0cb66b34b75e835a2";
const RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/";

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const sha = (s) => crypto.createHash("sha256").update(String(s).replace(/\r\n/g, "\n")).digest("hex");

(async () => {
  console.log("--- the vendored file ---");
  const mine = fs.readFileSync(path.join(__dirname, "..", "lib", "model-parser.js"), "utf8");
  say(sha(mine) === TEMPLATE_SHA256, "lib/model-parser.js is the template's at " + TEMPLATE_COMMIT, sha(mine).slice(0, 12));
  if (!process.argv.includes("--offline")) {
    const res = await fetch(RAW + SDLC_PINNED_COMMIT + "/tools/model-parser.js");
    const theirs = res.ok ? await res.text() : "";
    say(res.ok && sha(theirs) === TEMPLATE_SHA256, "SDLC carries the same file at the pin, " + SDLC_PINNED_COMMIT.slice(0, 7), String(res.status));
    const pm = await fetch("https://raw.githubusercontent.com/superdtf-0882/ai-native-product-marketing-maturity-model/" + PRODUCT_MARKETING_PINNED_COMMIT + "/tools/model-parser.js");
    const pmText = pm.ok ? await pm.text() : "";
    say(pm.ok && sha(pmText) === TEMPLATE_SHA256, "Product Marketing carries the same file at its pin, " + PRODUCT_MARKETING_PINNED_COMMIT.slice(0, 7), String(pm.status));
  }

  console.log("--- the adapter ---");
  const layer = [
    "# Layer", "", "## D1. Shared research", "", "*What the dimension is.*", "",
    "### A — Nascent", "", "A's text,", "wrapped.", "", "**Transition from A to B**", "", "Do this.", "", "**Verification:** Shown so.", "",
    "### B — Modeled", "", "B.", "", "**Transition from B to C**", "", "Then this.", "", "**Verification:** And so.", "",
    "### C — Continuous", "", "C.", "", "**Transition from C to D**", "", "Next.", "", "**Verification:** So.", "",
    "### D — Integral", "", "D.", "", "**Transition from D to E**", "", "Last.", "", "**Verification:** Done.", "",
    "### E — Telemetric", "", "E's text.", "", "**Vantage:** From D1's vantage, a view.", "",
    "**Sustainment:** Keep it.", "", "---", "",
  ].join("\n");
  const matrix = [
    "# Matrix", "", "## D1–D3. Shared Intelligence Layer", "", "**Basis:** the layer; referenced.", "", "---", "",
    "## D4. Specification", "", "*Specs.*", "",
    "### A — Nascent", "", "One.", "", "Two.", "", "**Transition from A to B** — A title", "", "Go.", "", "**Verification:** Seen.", "",
    "### B — Modeled", "", "B.", "", "**Transition from B to C** — Another", "", "Go.", "", "**Verification:** Seen.", "",
    "### C — Continuous", "", "C.", "", "**Transition from C to D** — Third", "", "Go.", "", "**Verification:** Seen.", "",
    "### D — Integral", "", "D.", "", "**Transition from D to E** — Fourth", "", "Go.", "", "**Verification:** Seen.", "",
    "### E — Telemetric", "", "E.", "", "**Sustainment:** Hold.", "", "---", "",
  ].join("\n");
  const byId = readSdlcDimensions(layer, matrix);
  const d1 = byId.get("D1"), d4 = byId.get("D4");
  say([...byId.keys()].join(",") === "D1,D4", "D1 from the layer, D4 from the matrix; the matrix's D1-D3 basis section adds none", [...byId.keys()].join(","));
  say(!!d1 && d1.name === "Shared research" && d1.desc === "What the dimension is.", "name and definition map to name and desc");
  say(!!d1 && d1.levels.A === "A's text, wrapped.", "a wrapped paragraph reads as one line", d1 && d1.levels.A);
  say(!!d1 && d1.levels.E === "E's text. From D1's vantage, a view.", "the vantage reads after its level E, as the pages showed it", d1 && d1.levels.E);
  say(!!d1 && d1.transitions["A-B"].text === "Do this." && d1.transitions["A-B"].verification === "Shown so." && d1.sustainment === "Keep it.",
    "transitions are {text, verification}; sustainment its own field");
  say(!!d4 && d4.levels.A === "One. Two.", "two paragraphs join with a space, as the site's own reader joined them", d4 && d4.levels.A);
  say(!!d4 && !("title" in d4.transitions["A-B"]) && d4.transitions["A-B"].text === "Go.", "a transition's title is read and not passed to the page");
  say(!!d4 && Object.keys(d4.transitions).join(",") === "A-B,B-C,C-D,D-E" && d4.sustainment === "Hold.", "all four transitions and the sustainment, from the matrix");

  // Product Marketing's shape: an inherited dimension the matrix renders is read; a range heading
  // that only names a source is not.
  const rendered = layer.replace("*What the dimension is.*", "*What the dimension is.*\n\n**Status:** Inherited · by reference\n\n**Basis:** STD-X v1.0, github.com/superdtf-0882/ai-native-x-maturity-model at v1.0.0, by reference.")
    + "\n## D2–D3. A range\n\n**Basis:** STD-Y v1.0; referenced.\n";
  const pmById = typeof readModelDimensions === "function" ? readModelDimensions(rendered) : new Map();
  const r1 = pmById.get("D1");
  say([...pmById.keys()].join(",") === "D1", "an inherited dimension the matrix renders is read; a range heading's dimensions are not", [...pmById.keys()].join(","));
  say(!!r1 && r1.levels.E === "E's text. From D1's vantage, a view." && r1.transitions["A-B"].verification === "Shown so.", "the rendered dimension maps as a native one does");

  // Portfolio Prioritization from v1.4.3 (OKF-TOGAF#205): its tables are prose, read through the
  // family parser; the site's table reader keeps one caller, PDLC, until PDLC's layout release.
  console.log("--- the loaders ---");
  const models = fs.readFileSync(path.join(__dirname, "..", "lib", "models.js"), "utf8").replace(/\r\n/g, "\n");
  const body = (name) => (models.match(new RegExp("export (?:async )?function " + name + "\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}")) || [])[1] || "";
  const prio = body("getPrioritizationFullModel");
  say(/readModelDimensions\(md\)/.test(prio) && !/parseTableModel\(/.test(prio), "#205: Prioritization's whole model is read through the family parser");
  say(/const PRIORITIZATION_PINNED_COMMIT = "893feeb8588584ae940aa802e31a3a322199343c";/.test(fs.readFileSync(path.join(__dirname, "..", "lib", "pins.js"), "utf8")), "#205: Prioritization is pinned at v1.4.3 (893feeb)");
  // PDLC from v1.2.5 (OKF-TOGAF#205): the last model read through the family parser, so no page
  // calls the site's table reader or its old dimension reader.
  const pdlc = body("getPdlcFullModel");
  say(/readModelDimensions\(sharedMd, pdlcMd\)/.test(pdlc), "#205: PDLC's whole model is read through the family parser, D1-D3 from the layer");
  say(/const PDLC_PINNED_COMMIT = "21a6d877538133ee530204b4eaab746fd2917ec7";/.test(fs.readFileSync(path.join(__dirname, "..", "lib", "pins.js"), "utf8")), "#205: PDLC is pinned at v1.2.5 (21a6d87)");
  const oldCalls = (models.match(/(?<!function )\b(parseTableModel|parseDimensionLevels|normalizeSharedDimension)\(\w/g) || []);
  say(oldCalls.length === 0, "no page reads through the table reader or the old dimension reader", oldCalls.join(", ") || "none");

  process.exitCode = bad;
})();
