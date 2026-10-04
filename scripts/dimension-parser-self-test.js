#!/usr/bin/env node
// Self-test for lib/dimension-parser.js -- OKF-TOGAF#142, the D1-D3 parser.
//
// THE DEFECT. parseDimensionLevels read "**Sustainment**" and "**Verification:**"
// only in inlineTransitions mode (the EA model's). SDLC and PDLC read the shared
// intelligence layer (D1-D3) in captureTransitions mode, so its three
// sustainment paragraphs were dropped and the Whole-Model View printed "not yet
// drafted" on D1-D3 level E. Measured 2026-10-02 by DTOG against the live pages
// and against the pinned sources.
//
// Synthetic markdown only: this runs offline and reads no model repository.
// Usage: node scripts/dimension-parser-self-test.js   (exit 1 on a failing case)
"use strict";

const { parseDimensionLevels, normalizeSharedDimension } = require("../lib/dimension-parser");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + shown);
  if (!ok) bad = 1;
};

// The shared layer's shape: "**Level X**", "**Transition from X to Y**",
// "**Sustainment**", "---" between dimensions.
const SHARED = [
  "## How to read this matrix",
  "",
  "**Transition velocity.** A preamble line, as in the SDLC matrix, that is not a transition.",
  "",
  "## D1. Market discovery",
  "",
  "*A description.*",
  "",
  "**Level A**",
  "",
  "Level A prose.",
  "",
  "**Transition from A to B**",
  "",
  "A to B prose.",
  "",
  "**Level B**",
  "",
  "Level B prose.",
  "",
  "**Transition from B to C**",
  "",
  "B to C prose.",
  "",
  "**Verification:** B to C is verified by this.",
  "",
  "**Level E**",
  "",
  "Level E prose.",
  "",
  "**Sustainment**",
  "",
  "Sustainment prose, first line.",
  "Second line.",
  "",
  "---",
  "",
  "## D2. Personas",
  "",
  "**Level A**",
  "",
  "D2 level A prose.",
  "",
  "---",
  "",
].join("\n");

console.log("--- dimension-parser self-test: the shared layer in captureTransitions mode (OKF-TOGAF#142) ---");
{
  const [d1, d2] = parseDimensionLevels(SHARED, { captureTransitions: true });
  say(d1.sustainment === "Sustainment prose, first line. Second line.",
    "D1's sustainment paragraph is read", JSON.stringify(d1.sustainment));
  const ab = d1.transitions["A-B"];
  say(ab && typeof ab === "object" && ab.text === "A to B prose." && ab.verification === null,
    "a transition comes out as {text, verification: null}", JSON.stringify(ab));
  const bc = d1.transitions["B-C"];
  say(bc && bc.text === "B to C prose." && bc.verification === "B to C is verified by this.",
    "a Verification: line is split into its own field", JSON.stringify(bc));
  say(d2.sustainment === null, "a dimension with no Sustainment section reads null", JSON.stringify(d2.sustainment));
  say(d1.levels.E === "Level E prose.", "Level E keeps only its own prose (control)", JSON.stringify(d1.levels.E));
  say(Object.keys(d1.transitions).join(",") === "A-B,B-C",
    "'**Transition velocity.**' is not taken as a transition (control)", Object.keys(d1.transitions).join(","));
  say(d1.desc === "A description." && d2.levels.A === "D2 level A prose.",
    "description and the next dimension parse as before (control)", JSON.stringify(d2.levels.A));
}

console.log("--- the assessment mode (no options) is unchanged ---");
{
  const [d1] = parseDimensionLevels(SHARED);
  say(Object.keys(d1.transitions).length === 0, "no transitions captured (control)", Object.keys(d1.transitions).length + " transition(s)");
  say(!("sustainment" in d1), "no sustainment field (control)", "sustainment" in d1 ? "present" : "absent");
  say(d1.levels.B === "Level B prose.", "a level after a Verification line is clean (control)", JSON.stringify(d1.levels.B));
}

console.log("--- EA's inline mode is unchanged ---");
{
  const EA = [
    "## D1. Strategy",
    "",
    "**Level A — Nascent**",
    "",
    "EA level A.",
    "",
    "**Transition A → B — Label**",
    "",
    "EA transition.",
    "",
    "**Verification:** EA verification.",
    "",
    "**Sustainment**",
    "",
    "EA sustainment.",
    "",
  ].join("\n");
  const [d] = parseDimensionLevels(EA, { inlineTransitions: true });
  say(d.transitions["A-B"].text === "EA transition." && d.transitions["A-B"].verification === "EA verification." && d.sustainment === "EA sustainment.",
    "EA's transition, verification and sustainment (control)", JSON.stringify(d.transitions["A-B"]));
}

console.log("--- the SDLC and PDLC assembly keep the shared layer's sustainment ---");
{
  const [d1] = parseDimensionLevels(SHARED, { captureTransitions: true });
  const sdlc = normalizeSharedDimension(JSON.parse(JSON.stringify(d1)));
  say(sdlc.sustainment === "Sustainment prose, first line. Second line.",
    "SDLC's assembly keeps D1's sustainment", JSON.stringify(sdlc.sustainment));
  say(sdlc.transitions["B-C"] && sdlc.transitions["B-C"].verification === "B to C is verified by this.",
    "SDLC's assembly keeps a verification clause", JSON.stringify(sdlc.transitions["B-C"]));
  const pdlc = normalizeSharedDimension(JSON.parse(JSON.stringify(d1)), { keepSustainment: true });
  say(pdlc.sustainment === "Sustainment prose, first line. Second line.",
    "PDLC's assembly keeps D1's sustainment", JSON.stringify(pdlc.sustainment));
  const legacy = normalizeSharedDimension({ transitions: { "A-B": "plain" } });
  say(legacy.transitions["A-B"].text === "plain" && legacy.transitions["A-B"].verification === null && legacy.sustainment === null,
    "a plain-string transition still normalizes (control)", JSON.stringify(legacy.transitions["A-B"]));
}

process.exitCode = bad;
