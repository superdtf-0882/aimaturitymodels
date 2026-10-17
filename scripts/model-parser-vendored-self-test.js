#!/usr/bin/env node
// Self-test for the vendored family parser and the SDLC adapter (OKF-TOGAF#205,
// STD-MODEL-PARTS v1.1 §7.2), on "Build SDLC's layout release as 419-CC plans it,
// with 420-CC's amendments -- David Facer 10/17/2026".
//
// lib/model-parser.js is the family's one reader, copied byte for byte from the
// practice's model template. Its hash is held here with the template commit it came
// from, so an edit made on this site, and not in the template, fails this test. The
// model repositories carry the same file in tools/; the SDLC copy at the pin is read
// over HTTPS and compared too. lib/sdlc-reader.js maps the parser's shape onto the
// fields the pages already use, and the fixtures below hold that mapping.
//
// Usage: node scripts/model-parser-vendored-self-test.js [--offline]   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { SDLC_PINNED_COMMIT } = require("../lib/pins");
const { readSdlcDimensions } = require("../lib/sdlc-reader");

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

  process.exitCode = bad;
})();
