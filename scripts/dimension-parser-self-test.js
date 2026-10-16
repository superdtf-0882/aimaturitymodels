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
  const pdlc = normalizeSharedDimension(JSON.parse(JSON.stringify(d1)));
  say(pdlc.sustainment === "Sustainment prose, first line. Second line.",
    "PDLC's assembly keeps D1's sustainment", JSON.stringify(pdlc.sustainment));
  const legacy = normalizeSharedDimension({ transitions: { "A-B": "plain" } });
  say(legacy.transitions["A-B"].text === "plain" && legacy.transitions["A-B"].verification === null && legacy.sustainment === null,
    "a plain-string transition still normalizes (control)", JSON.stringify(legacy.transitions["A-B"]));
}

// The Product Marketing model's shape (OKF-TOGAF#198): levels as "### A — Nascent"
// headings, "**Status:**" and "**Basis:**" lines under the description, the
// shared layer's "**Transition from A to B**" and "**Verification:**", and the
// sustainment inline as "**Sustainment:** text" after a level E that may run to
// two paragraphs.
const PMM = [
  "# A model",
  "",
  "## Family consistency and review boundaries",
  "",
  "- A boundary bullet that belongs to no dimension.",
  "",
  "## D4. Knowledge corpus & standing",
  "",
  "*A description.*",
  "",
  "**Status:** Native",
  "",
  "**Basis:** Adapted from elsewhere",
  "",
  ...["A", "B", "C", "D"].flatMap((l, i) => [
    "### " + l + " — Name",
    "",
    "Level " + l + " prose.",
    "",
    "**Transition from " + l + " to " + "BCDE"[i] + "**",
    "",
    l + " to " + "BCDE"[i] + " prose.",
    "",
    "**Verification:** " + l + " to " + "BCDE"[i] + " is verified by this.",
    "",
  ]),
  "### E — Telemetric",
  "",
  "Level E prose.",
  "",
  "A vantage paragraph at E.",
  "",
  "**Sustainment:** Sustainment prose.",
  "",
].join("\n");
{
  const [d4, extra] = parseDimensionLevels(PMM, { captureTransitions: true, headingLevels: true });
  say(!!d4 && !extra && d4.id === "D4" && d4.name === "Knowledge corpus & standing" && d4.desc === "A description.",
    "PMM: one dimension, its name and description", JSON.stringify(d4 && [d4.id, d4.name, d4.desc]));
  say(!!d4 && ["A", "B", "C", "D"].every((l) => d4.levels[l] === "Level " + l + " prose."),
    "PMM: \"### A — Nascent\" headings read as levels", JSON.stringify(d4 && d4.levels));
  say(!!d4 && d4.levels.E === "Level E prose. A vantage paragraph at E.",
    "PMM: level E keeps its second paragraph, not the sustainment", JSON.stringify(d4 && d4.levels.E));
  say(!!d4 && d4.transitions["C-D"] && d4.transitions["C-D"].text === "C to D prose." && d4.transitions["C-D"].verification === "C to D is verified by this.",
    "PMM: transitions and their verifications", JSON.stringify(d4 && d4.transitions["C-D"]));
  say(!!d4 && Object.keys(d4.transitions).join(",") === "A-B,B-C,C-D,D-E",
    "PMM: four transitions, no more", JSON.stringify(d4 && Object.keys(d4.transitions)));
  say(!!d4 && d4.sustainment === "Sustainment prose.",
    "PMM: the inline \"**Sustainment:**\" line is the sustainment", JSON.stringify(d4 && d4.sustainment));
  const plain = parseDimensionLevels(PMM, { captureTransitions: true })[0];
  say(!!plain && Object.keys(plain.levels).length === 0,
    "without the option the heading shape reads nothing (others unchanged)", JSON.stringify(plain && plain.levels));
}

process.exitCode = bad;
