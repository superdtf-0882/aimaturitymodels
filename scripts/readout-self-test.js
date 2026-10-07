#!/usr/bin/env node
// Self-test for the executive readout's switch to gpt-5.5 -- OKF-TOGAF#145, on
// "Switch the readout to the 5.5 model under #145, tested with DTOG's two
// sentences on a preview first -- David Facer 10/7/2026" (113-CC of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/).
//
// Source checks, offline; pages/api/diagnostic.js is an ES module Next compiles,
// so it is read as text, not imported.
//   1. the model is one named constant, gpt-5.5;
//   2. the output limit is max_completion_tokens >= 25000, never max_tokens
//      (a reasoning model's hidden reasoning counts against it; at 2000 a
//      readout can come back empty -- OpenAI's reasoning guide);
//   3. the cache key carries the AI model, the reasoning effort and the prompt
//      version, so a readout made one way is never served for another -- and
//      preview, which shares the store with production, cannot leak into it;
//   4. the SDLC candidate prompt is the approved V1 plus exactly DTOG's two
//      sentences, nothing else changed.
// Usage: node scripts/readout-self-test.js   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } };
const api = read("pages/api/diagnostic.js");

console.log("--- the call ---");
say(/const READOUT_MODEL = "gpt-5\.5";/.test(api), "the model is one constant, gpt-5.5");
say(/model:\s*READOUT_MODEL/.test(api), "the call uses that constant");
const mct = api.match(/max_completion_tokens:\s*(\d+)/);
say(!!mct && Number(mct[1]) >= 25000 && !/max_tokens:/.test(api), "max_completion_tokens >= 25000, no max_tokens", mct ? mct[1] : "");
say(/reasoning_effort:\s*effort/.test(api), "the reasoning effort is set on the call");

console.log("--- the cache key ---");
const hv = api.match(/function hashVector\(([^)]*)\)\s*\{([\s\S]*?)\n\}/);
say(!!hv && /readoutModel/.test(hv[1]) && /effort/.test(hv[1]) && /promptVersion/.test(hv[1]), "hashVector takes the AI model, effort and prompt version", hv ? hv[1] : "");
// [OKF-TOGAF#161 adds a trailing argument, the Exempt reasons; the three stay.]
say(/hashVector\(body\.model, scoreVector, READOUT_MODEL, effort, modelConfig\.promptVersion[,)]/.test(api), "the handler passes all three");

console.log("--- the SDLC candidate prompt ---");
const v1 = read("lib/prompts/executive-readout-v1.js");
const v2 = read("lib/prompts/executive-readout-v2-candidate.js");
const body = (s, name) => { const m = s.match(new RegExp("export const " + name + " = `([\\s\\S]*?)`;")); return m ? m[1] : null; };
const t1 = body(v1, "EXECUTIVE_READOUT_PROMPT_V1"), t2 = body(v2, "EXECUTIVE_READOUT_PROMPT_V2_CANDIDATE");
const S1 = "The highest-value investment is not necessarily the lowest score.";
const S2 = "Refer to capabilities by what they do for the business, not by dimension number or level letter;";
say(!!t2 && t2.includes(S1) && t2.includes(S2), "the candidate carries DTOG's two sentences");
let rest = t2 || "";
// [OKF-TOGAF#161: the candidate also carries four Pre-AI/Exempt lines from the
// EA draft. Two are added lines, removed here like S1 and S2; two extend a V1
// line, restored here to V1's wording. Nothing else may differ.]
const ADDED = [S1, S2, "Treat Exempt as a stance, not a gap.", "Never recommend moving every Pre-AI dimension off Pre-AI."];
for (const s of ADDED) { const i = rest.indexOf(s); if (i >= 0) { const e = rest.indexOf("\n", i); rest = rest.slice(0, i).replace(/\n\n$/, "\n") + rest.slice(e < 0 ? rest.length : e + 1); } }
rest = rest.replace(/^- the organization's current scores, which may include .*$/m, "- the organization's current scores")
  .replace("at the organization's current stage, including dimensions that should remain Pre-AI for now.", "at the organization's current stage.");
say(!!t1 && !!t2 && rest.replace(/\n{3,}/g, "\n\n") === t1.replace(/\n{3,}/g, "\n\n"), "and nothing else differs from the approved V1");
say(t1 !== null && !/max_tokens|gpt-/.test(t1), "the approved V1 file is untouched (control)");

process.exitCode = bad;
