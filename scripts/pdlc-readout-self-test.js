#!/usr/bin/env node
// Self-test for the PDLC Executive Readout prompt v3 -- OKF-TOGAF#207. Prompts
// are never overwritten (C-006/P-07), so v3 is its own constant:
// PDLC_EXECUTIVE_READOUT_PROMPT_V3 = PDLC_EXECUTIVE_READOUT_PROMPT_V2 with six
// passages added in four places and nothing else. Five are Product Marketing
// v1's own words for Pre-AI and Exempt, which are EA v2's; the sixth is PDLC's
// paragraph on which of its dimensions tend to score Pre-AI. The additions are
// listed here, applied to v2 and compared with the new file, so the test is the
// specification.
// Approved: "Approve PDLC's readout prompt v3 as 448-CC drafts it, with outcome
// measurement out of the often-Pre-AI group as 226-DT2 suggests, and build it as
// 448-CC section 3 lists -- David Facer 10/17/2026". Drafted by CC (448-CC of
// OKF TOGAF briefs/2026-10-01-svm-tranche-3/), reviewed by DT2 (226-DT2).
// With it, PDLC's readout takes Pre-AI and Exempt, and its assessment page
// offers them, read from EA's text at v1.1.2, the source PDLC's model names.
// Source checks, offline. Usage: node scripts/pdlc-readout-self-test.js
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const body = (s, name) => { const m = s.match(new RegExp("export const " + name + " = `([\\s\\S]*?)`;")); return m ? m[1] : null; };
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const count = (s, x) => s.split(x).length - 1;

// Product Marketing v1's passages, word for word.
const SCORES = "- the organization's current scores, which may include dimensions marked Pre-AI (no AI-assisted practice adopted yet) or Exempt (deliberately excluded from AI adoption as a matter of governed policy)";
const NAME_EVERY = "Name every Pre-AI dimension in the readout, whether one dimension is Pre-AI or most are: say what that capability does for the business, whether it should stay Pre-AI for now or is among the next to adopt AI, and why. A Pre-AI dimension left unmentioned is an omission, not a judgement.";
const EXEMPT = "Treat Exempt as a stance, not a gap. An Exempt dimension records a governed decision the organization stands behind. Never recommend investing in it; if relevant, say what the exemption protects or costs elsewhere in the profile.";
const NEVER = "Never recommend moving every Pre-AI dimension off Pre-AI.";
const LIGHT = "Explicitly identify dimensions where additional investment would likely have poor return at the organization's current stage, including dimensions that should remain Pre-AI for now.";
// PDLC's own, as 448-CC drafts it with 226-DT2's change: outcome measurement named in neither group.
const PDLC_PRE_AI = "Expect Pre-AI to be uneven rather than common. Product Management adopted AI-assisted research synthesis and drafting early, so the discovery, persona, positioning, and requirements dimensions are rarely Pre-AI; the authority, portfolio, and feedback-loop dimensions often are, because they need governed records, connected measurement, and decision rights that drafting tools never required. A profile in which several dimensions score Pre-AI is an ordinary result, not a failing one. Read it as a starting position with a readiness story, not as twelve failures. Where a Pre-AI dimension carries a readiness note, use it: existing discipline — a traced requirements record, a written prioritization method, instrumented product analytics — is transferable substrate and predicts how fast that dimension will cross levels once AI tooling arrives.";

const ADDITIONS = [
  ["- the organization's current scores\n", SCORES + "\n"],
  ["Avoid generic best-practice recommendations.\n", "Avoid generic best-practice recommendations.\n\n" + PDLC_PRE_AI + "\n\n" + NAME_EVERY + "\n\n" + EXEMPT + "\n"],
  ["would return more than raising the weakest dimension, and say so when it would.\n", "would return more than raising the weakest dimension, and say so when it would.\n\n" + NEVER + "\n"],
  ["Explicitly identify dimensions where additional investment would likely have poor return at the organization's current stage.", LIGHT],
];

console.log("--- the sources ---");
const v2 = body(read("lib/prompts/pdlc-executive-readout-v2.js"), "PDLC_EXECUTIVE_READOUT_PROMPT_V2");
const pm = body(read("lib/prompts/prodmar-executive-readout-v1.js"), "PRODMAR_EXECUTIVE_READOUT_PROMPT_V1");
say(!!v2 && sha(v2) === "298e26338820a302", "PDLC v2's prompt text is the one v3 is built from", v2 ? sha(v2) : "");
say(!!pm && [SCORES, NAME_EVERY, EXEMPT, NEVER, LIGHT].every((p) => count(pm, p) === 1), "Product Marketing v1 carries each of its five passages once, word for word");
say(!!pm && pm.includes("Avoid generic best-practice recommendations.\n\nExpect Pre-AI") && pm.includes("and say so when it would.\n\n" + NEVER), "Product Marketing v1 puts them after the same sentences");

console.log("--- the six passages, in four places ---");
let want = v2 || "";
let anchors = true;
for (const [at, to] of ADDITIONS) {
  if (count(want, at) !== 1) anchors = false;
  want = want.replace(at, () => to);
}
say(anchors, "each place occurs exactly once in v2");

console.log("--- PDLC v3 ---");
const src = read("lib/prompts/pdlc-executive-readout-v3.js");
const v3 = body(src, "PDLC_EXECUTIVE_READOUT_PROMPT_V3");
say(!!v3, "PDLC v3's prompt body is readable");
say(!!v3 && v3 === want, "PDLC v3 is v2 with the six passages, nothing else");
say(!!v3 && !/outcome-measurement/.test(v3), "outcome measurement is in neither group (226-DT2)");
say(!!v3 && /twelve independently scored/.test(v3) && /not as twelve failures/.test(v3), "it counts twelve dimensions");
say(!!v3 && /please contact David Facer\.$/.test(v3.trim()), "it ends with the family's closing line");
say(/David Facer 10\/17\/2026/.test(src) && /226-DT2/.test(src), "its header records the approval line");

console.log("--- the route ---");
const api = read("pages/api/diagnostic.js");
say(/pdlc: \{[^}]*dimensionCount: 12,[^}]*prompt: PDLC_EXECUTIVE_READOUT_PROMPT_V3,[^}]*promptVersion: "pdlc-v3"[^}]*thresholdStates: true/.test(api), "PDLC readouts use v3, as pdlc-v3, with Pre-AI and Exempt");

console.log("--- the assessment page ---");
const pins = read("lib/pins.js");
const models = read("lib/models.js");
const page = read("pages/models/pdlc/assessment.js");
say(/const PDLC_THRESHOLD_STATES_SOURCE_COMMIT = "2688129234b59c0f9a864512fbe68eadad41aabe";/.test(pins), "the two states' source is pinned at EA v1.1.2 (2688129)");
const loader = (models.match(/export async function getPdlcAssessmentDimensions\(\) \{([\s\S]*?)\n\}/) || [])[1] || "";
say(/ai_native_ea_maturity_model\.md/.test(loader) && /readThresholdStates\(/.test(loader) && /thresholdStates,/.test(loader) && /throw new Error/.test(loader), "the loader reads them from EA's matrix there, and refuses to build without them");
say(/getPdlcAssessmentDimensions\(\)/.test(page) && /thresholdStates=\{thresholdStates\}/.test(page), "PDLC's assessment page offers them");

process.exitCode = bad;
