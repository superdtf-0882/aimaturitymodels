#!/usr/bin/env node
// Self-test for the readout length change -- OKF-TOGAF#145, on "Readout
// length: 900-word ceiling with section budgets, as 111-DT2 proposes, tested
// on the preview -- David Facer 10/7/2026" (111-DT2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/).
//
// Prompts are never overwritten (C-006/P-07), so this is a new version of each:
//   SDLC  EXECUTIVE_READOUT_PROMPT_V3     = V2 + the length rule
//   EA    EA_EXECUTIVE_READOUT_PROMPT_V2  = EA V1 + the length rule
// "The length rule" is exactly two edits, applied here to the previous version
// and compared with the new file, so the test is the specification:
//   1. 111-DT2's paragraph, at 900 words, directly under "## Required Output";
//   2. the Style line "approximately 800–1200 words" becomes "no more than 900
//      words" -- left as it was, it would contradict the ceiling.
// PDLC and Prioritization take it when the owner reviews them (111-DT2 2).
// Source checks, offline. Usage: node scripts/readout-length-self-test.js
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
// Line endings as Git stores them (LF), which is what Vercel builds from.
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const body = (s, name) => { const m = s.match(new RegExp("export const " + name + " = `([\\s\\S]*?)`;")); return m ? m[1] : null; };

const CEILING = 900;
const BUDGET = "Write no more than 900 words in total. Keep to these budgets: Executive Summary 120, Investment Pattern 150, Strategic Strengths 120, Emerging Constraints 150, Recommended Next Investments 180, Areas That Should Remain Lightweight 100, Closing Perspective 80. A shorter readout that says the important things is better than a complete one that says everything.";
const OLD_STYLE = "The output should be approximately 800–1200 words.";
const NEW_STYLE = "The output should be no more than 900 words.";
const withLengthRule = (prev) => {
  if (!prev || prev.split("## Required Output\n\n").length !== 2 || prev.split(OLD_STYLE).length !== 2) return null;
  return prev.replace("## Required Output\n\n", "## Required Output\n\n" + BUDGET + "\n\n").replace(OLD_STYLE, NEW_STYLE);
};

console.log("--- the rule itself ---");
{
  const nums = [...BUDGET.matchAll(/ (\d+)[,.]/g)].map((m) => Number(m[1]));
  const sum = nums.reduce((a, b) => a + b, 0);
  say(nums.length === 7 && sum === CEILING, "seven section budgets that add up to the ceiling", nums.join("+") + "=" + sum);
}

const CASES = [
  ["SDLC", "lib/prompts/executive-readout-v2.js", "EXECUTIVE_READOUT_PROMPT_V2", "lib/prompts/executive-readout-v3.js", "EXECUTIVE_READOUT_PROMPT_V3"],
  ["EA", "lib/prompts/ea-executive-readout-v1.js", "EA_EXECUTIVE_READOUT_PROMPT_V1", "lib/prompts/ea-executive-readout-v2.js", "EA_EXECUTIVE_READOUT_PROMPT_V2"],
];
for (const [label, prevFile, prevName, nextFile, nextName] of CASES) {
  console.log("--- " + label + " ---");
  const prev = body(read(prevFile), prevName);
  const next = body(read(nextFile), nextName);
  const want = withLengthRule(prev);
  say(!!prev && !!want, "the previous version carries each anchor exactly once");
  say(!!next && next === want, "the new version is the previous plus the length rule, nothing else");
  say(!!next && !next.includes(OLD_STYLE), "no 800–1200 line remains to contradict the ceiling");
}

// [PDLC and Prioritization, 2026-10-07, on "The PDLC and Prioritization
// prompts as DTOG relays: V2 with the two sentences and the length rule,
// preview first -- David Facer 10/7/2026". Their V1 lines are approved as
// written; each V2 is V1 plus DTOG's two sentences, placed where SDLC V2 has
// them (after "Never recommend improving every low-scoring dimension." and
// after "Do not describe every dimension individually."), plus the length
// rule above. V1's text stays as it is; only its header comment loses
// "pending David's own review".]
const S1 = "The highest-value investment is not necessarily the lowest score. Consider whether deepening an existing strength, or reconciling two scores that contradict each other, would return more than raising the weakest dimension, and say so when it would.";
const S2 = "Refer to capabilities by what they do for the business, not by dimension number or level letter; a dimension number may appear once, in parentheses, on first mention. Do not walk the reader through the dimensions one by one.";
const A1 = "Never recommend improving every low-scoring dimension.\n";
const A2 = "Do not describe every dimension individually.\n";
const withTwoSentences = (prev) => {
  if (!prev || prev.split(A1).length !== 2 || prev.split(A2).length !== 2) return null;
  return prev.replace(A1, A1 + "\n" + S1 + "\n").replace(A2, A2 + "\n" + S2 + "\n");
};
{
  // The sentences as SDLC V2 carries them, so the family holds one wording.
  const sdlc = body(read("lib/prompts/executive-readout-v2.js"), "EXECUTIVE_READOUT_PROMPT_V2") || "";
  say(sdlc.includes(A1 + "\n" + S1 + "\n") && sdlc.includes(A2 + "\n" + S2 + "\n"), "SDLC V2 carries both sentences in these places (the control)");
}
const FAMILY = [
  ["PDLC", "lib/prompts/pdlc-executive-readout-v1.js", "PDLC_EXECUTIVE_READOUT_PROMPT_V1", "lib/prompts/pdlc-executive-readout-v2.js", "PDLC_EXECUTIVE_READOUT_PROMPT_V2", "60680778bf24"],
  ["Prioritization", "lib/prompts/prioritization-executive-readout-v1.js", "PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V1", "lib/prompts/prioritization-executive-readout-v2.js", "PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V2", "b723a682b292"],
];
for (const [label, prevFile, prevName, nextFile, nextName, v1sha] of FAMILY) {
  console.log("--- " + label + " ---");
  const src = read(prevFile);
  const prev = body(src, prevName);
  const next = body(read(nextFile), nextName);
  const want = withLengthRule(withTwoSentences(prev));
  say(!!want, "V1 carries every anchor exactly once");
  say(!!next && next === want, "V2 is V1 plus the two sentences and the length rule, nothing else");
  const got = prev ? require("crypto").createHash("sha256").update(prev).digest("hex").slice(0, 12) : "";
  say(got === v1sha, "V1's prompt text is unchanged", got);
  say(!!src && !/pending David's own\s*(\/\/\s*)?review/.test(src), "V1's header no longer says it is pending review");
}

console.log("--- the route ---");
{
  const api = read("pages/api/diagnostic.js");
  say(/sdlc: \{[^}]*prompt: EXECUTIVE_READOUT_PROMPT_V3,[^}]*promptVersion: "sdlc-v3"/.test(api), "SDLC readouts use V3, under its own prompt version");
  say(/ea: \{[^}]*prompt: EA_EXECUTIVE_READOUT_PROMPT_V2,[^}]*promptVersion: "ea-v2"/.test(api), "EA readouts use V2, under its own prompt version");
  say(/pdlc: \{[^}]*prompt: PDLC_EXECUTIVE_READOUT_PROMPT_V2,[^}]*promptVersion: "pdlc-v2"/.test(api), "PDLC readouts use V2, under its own prompt version");
  // 2026-10-07, OKF-TOGAF#167: V3 is V2 renamed (scripts/portfolio-name-self-test.js).
  say(/prioritization: \{[^}]*prompt: PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V3,[^}]*promptVersion: "prioritization-v3"/.test(api), "Prioritization readouts use V3, under its own prompt version");
  say(!/TEST ONLY|body\.fresh/.test(api), "no preview-only test option in the route");
}

process.exitCode = bad;
