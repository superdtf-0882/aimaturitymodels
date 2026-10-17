#!/usr/bin/env node
// Self-test for OKF-TOGAF#206 -- the definition/claim toggle on the self-assessment pages,
// entered on "Enter model-parts-standard realizing INT-005 and assessment-claim-toggle
// realizing INT-003 as new Work Items with DT2's proposed reach, product Framework ... --
// David Facer 10/17/2026". Its reach: "A self-assessor sees, for each level B to E, the
// model's own test for claiming that level, word for word."
//
// For levels B to E the level window switches between the level's definition and the
// claim: "Claim this level only if you can show:" over the model's verification line for
// the step into that level, verbatim. No toggle for Level A, Pre-AI or Exempt. The page
// stays a self-assessment. The owner's design notes (on #206's issue): mark the view that
// is showing; the lead-in on its own muted line; real buttons a keyboard and a screen
// reader can use.
//
// Offline by default: the rule (lib/claim-view.js) and source checks. With --built, it
// reads each model's built assessment page and requires a claim for every level B to E.
// Usage: node scripts/claim-toggle-self-test.js [--built]   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(70) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const fnBody = (src, name) => (src.match(new RegExp("export (?:async )?function " + name + "\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}")) || [])[1] || "";

console.log("--- the rule: the claim for a level is the verification line into it ---");
let cv = null;
try { cv = require("../lib/claim-view"); } catch (e) { say(false, "lib/claim-view.js loads", e.message.split("\n")[0]); }
if (cv) {
  const dim = { id: "D4", levels: { A: "a", B: "b", C: "c", D: "d", E: "e" }, transitions: {
    "A-B": { text: "Move A to B.", verification: "It reached **B**, observably." },
    "B-C": { text: "Move B to C.", verification: "It reached C." },
    "C-D": { text: "Move C to D.", verification: "It reached D." },
    "D-E": { text: "Move D to E.", verification: "It reached E." },
  } };
  say(cv.CLAIM_LEAD === "Claim this level only if you can show:", "the lead-in is the row's words exactly", JSON.stringify(cv.CLAIM_LEAD));
  say(cv.claimFor(dim, "B") === "It reached **B**, observably.", "B's claim is the A-to-B verification line, verbatim, marks kept");
  say(cv.claimFor(dim, "C") === "It reached C." && cv.claimFor(dim, "D") === "It reached D." && cv.claimFor(dim, "E") === "It reached E.", "C, D and E read the line for the step into each");
  say(cv.claimFor(dim, "A") === null, "Level A has no step into it, so no claim");
  say(cv.claimFor(dim, "Pre-AI") === null && cv.claimFor(dim, "Exempt") === null && cv.claimFor(dim, undefined) === null, "Pre-AI, Exempt and no grade have no claim");
  say(cv.claimFor({ ...dim, transitions: { ...dim.transitions, "B-C": { text: "Move B to C." } } }, "C") === null, "a step with no verification line gives no claim, never a substitute");
  say(cv.claimFor({ id: "D1", levels: dim.levels }, "B") === null, "a dimension with no transitions gives no claim");

  // The owner, 2026-10-17, on the live toggle: a new level, or a new dimension, opens on the
  // definition. The claim shows only for the dimension and level it was opened on.
  const has = typeof cv.claimKey === "function" && typeof cv.claimShown === "function";
  say(has, "the rule says which dimension and level a claim was opened for");
  if (has) {
    const opened = cv.claimKey("D4", "C");
    say(cv.claimShown(opened, "D4", "C") === true, "the claim opened on D4 at C shows on D4 at C");
    say(cv.claimShown(opened, "D4", "B") === false, "moving D4 from C to B opens B on its definition");
    say(cv.claimShown(opened, "D5", "C") === false, "moving to D5, even at the same level, opens on the definition");
    say(cv.claimShown(null, "D4", "C") === false, "with no claim opened, every level shows its definition");
  }
}

console.log("--- the page ---");
{
  const a = read("components/Assessment.js");
  say(/require\("\.\.\/lib\/claim-view"\)/.test(a) && /claimFor\(dim, scores\[dim\.id\]\)/.test(a), "the shared assessment component asks the rule for the graded level's claim");
  const toggle = a.slice(a.indexOf("assess-view-toggle"), a.indexOf("assess-view-toggle") + 1400);
  const buttons = toggle.match(/<button\b[^>]*>/g) || [];
  say(buttons.length === 2 && buttons.every((b) => /type="button"/.test(b) && /aria-pressed=\{/.test(b)), "two real buttons, each saying whether it is pressed (design note 3)", buttons.length + " button(s)");
  say(/>Definition</.test(toggle) && />Claim</.test(toggle), "labelled Definition and Claim");
  say(buttons.length === 2 && buttons.every((b) => /is-selected/.test(b)), "the view that is showing is marked (design note 1)");
  say(/role="group"/.test(toggle) && /aria-label="[^"]+"/.test(toggle), "the pair is one labelled group");
  say(/levelClaim && \(/.test(a) || /\{levelClaim \?/.test(a), "the toggle is drawn only when the level has a claim: none for A, Pre-AI or Exempt");
  say(/claimShown\(claimOpenFor, dim\.id, scores\[dim\.id\]\)/.test(a) && /setClaimOpenFor\(claimKey\(dim\.id, scores\[dim\.id\]\)\)/.test(a) && !/levelView/.test(a),
    "the claim is opened for one dimension at one level, not for the whole page (the owner, 2026-10-17)");
  say(/className="assess-claim-lead">\{CLAIM_LEAD\}</.test(a), "the lead-in sits on its own line, in its own muted style (design note 2)");
  say(/<Marks text=\{levelClaim\} \/>/.test(a), "the claim is the model's line, its marks rendered as the definition's are");
  const css = read("styles/globals.css");
  say(/\.assess-claim-lead \{[^}]*color: var\(--muted\)/.test(css), "the lead-in's style is muted");
  say(/\.assess-view-btn\.is-selected \{/.test(css) && /\.assess-view-btn:focus-visible \{/.test(css), "the pressed button is styled, and a keyboard's focus shows");
}

console.log("--- SDLC's verification lines, from its named home ---");
{
  const fn = fnBody(read("lib/models.js"), "getSdlcAssessmentDimensions");
  // From SDLC v1.4.3 (OKF-TOGAF#205), both files through the vendored family parser, lib/sdlc-reader.js.
  say(/readSdlcDimensions\(sharedMd, fullMd\)/.test(fn) && /fetchRawPinned\("shared_intelligence_layer\.md"\)/.test(fn), "D1-D3's transitions are read from the shared layer");
  say(/fetchRawPinned\("ai_native_sdlc_maturity_model\.md"\)/.test(fn), "D4-D13's are read from the matrix, SDLC's named home, not the transition-states file");
  say(!/sdlc_transition_states_d4_d13\.md/.test(fn), "the assessment does not read the transition-states file");
}

if (process.argv.includes("--built")) {
  console.log("--- built: every level B to E has its claim, on all five pages ---");
  const STEPS = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]];
  for (const m of ["sdlc", "pdlc", "prioritization", "ea", "productmarketing"]) {
    const html = read(".next/server/pages/models/" + m + "/assessment.html");
    const j = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
    let dims = [];
    try { dims = JSON.parse(j[1]).props.pageProps.dimensions; } catch { /* reported below */ }
    let n = 0;
    for (const d of dims) for (const [, to] of STEPS) if (cv && cv.claimFor(d, to)) n++;
    say(dims.length > 0 && n === dims.length * 4, m + ": a claim for every level B to E", n + " of " + dims.length * 4);
  }
}

process.exitCode = bad;
