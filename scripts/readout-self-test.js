#!/usr/bin/env node
// Self-test for the executive readout's switch to gpt-5.5 -- OKF-TOGAF#145, on
// "Switch the readout to the 5.5 model under #145, tested with DTOG's two
// sentences on a preview first -- David Facer 10/7/2026" (113-CC of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/).
// [Production form, on "Medium reasoning; the SDLC readout prompt as tested,
// with DTOG's two sentences and the four Pre-AI and Exempt lines -- David
// Facer 10/7/2026". The preview branch's test-only parts come out: the
// caller's choice of effort, the candidate's name and the EA draft.]
//
// Source checks, offline; pages/api/diagnostic.js is an ES module Next compiles,
// so it is read as text, not imported.
//   1. the model is one named constant, gpt-5.5, at one fixed reasoning
//      effort, medium; no caller can choose another;
//   2. the output limit is max_completion_tokens >= 25000, never max_tokens
//      (a reasoning model's hidden reasoning counts against it; at 2000 a
//      readout can come back empty -- OpenAI's reasoning guide);
//   3. the cache key carries the AI model, the reasoning effort and the prompt
//      version, so a readout made one way is never served for another -- and
//      preview, which shares the store with production, cannot leak into it;
//   4. the SDLC prompt is V2, byte for byte the text tested on the preview,
//      which is the approved V1 plus DTOG's two sentences and the four
//      Pre-AI/Exempt lines, nothing else changed;
//   5. nothing preview-only remains: no EA draft, no candidate file.
// Usage: node scripts/readout-self-test.js   (exit 1 on a failing case)
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
// Line endings as Git stores them (LF), which is what Vercel builds from: a
// Windows checkout with core.autocrlf rewrites the working copy with CRLF,
// and the byte-for-byte check then fails on a file that is correct.
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
const exists = (p) => fs.existsSync(path.join(root, p));
const api = read("pages/api/diagnostic.js");

console.log("--- the call ---");
say(/const READOUT_MODEL = "gpt-5\.5";/.test(api), "the model is one constant, gpt-5.5");
say(/model:\s*READOUT_MODEL/.test(api), "the call uses that constant");
const mct = api.match(/max_completion_tokens:\s*(\d+)/);
say(!!mct && Number(mct[1]) >= 25000 && !/max_tokens:/.test(api), "max_completion_tokens >= 25000, no max_tokens", mct ? mct[1] : "");
say(/const READOUT_EFFORT = "medium";/.test(api) && /reasoning_effort:\s*READOUT_EFFORT/.test(api), "the reasoning effort is one constant, medium, set on the call");
say(!/body\.effort/.test(api) && !/EFFORTS/.test(api), "no caller can choose the effort");

console.log("--- the cache key ---");
const hv = api.match(/function hashVector\(([^)]*)\)\s*\{([\s\S]*?)\n\}/);
say(!!hv && /readoutModel/.test(hv[1]) && /effort/.test(hv[1]) && /promptVersion/.test(hv[1]), "hashVector takes the AI model, effort and prompt version", hv ? hv[1] : "");
// [OKF-TOGAF#161 adds a trailing argument, the Exempt reasons; the three stay.]
say(/hashVector\(body\.model, scoreVector, READOUT_MODEL, READOUT_EFFORT, modelConfig\.promptVersion[,)]/.test(api), "the handler passes all three");

console.log("--- the SDLC prompt ---");
const v1 = read("lib/prompts/executive-readout-v1.js");
const v2 = read("lib/prompts/executive-readout-v2.js");
const body = (s, name) => { const m = s.match(new RegExp("export const " + name + " = `([\\s\\S]*?)`;")); return m ? m[1] : null; };
const t1 = body(v1, "EXECUTIVE_READOUT_PROMPT_V1"), t2 = body(v2, "EXECUTIVE_READOUT_PROMPT_V2");
say(/sdlc: \{[^}]*prompt: EXECUTIVE_READOUT_PROMPT_V2,[^}]*promptVersion: "sdlc-v2"/.test(api), "SDLC readouts use V2, under its own prompt version");
// The candidate's text at 7b41f6e, the commit the preview ran when the owner
// approved it; its sha256 is taken from that file, not retyped.
const TESTED = "aa9c3f98dfb8e9e917ac37d39175b29e7f168ea641f357cd72d86e4cd664c19e";
const got = t2 === null ? "" : crypto.createHash("sha256").update(t2).digest("hex");
say(got === TESTED, "V2 is byte for byte the text tested on the preview", got.slice(0, 16));
const S1 = "The highest-value investment is not necessarily the lowest score.";
const S2 = "Refer to capabilities by what they do for the business, not by dimension number or level letter;";
say(!!t2 && t2.includes(S1) && t2.includes(S2), "V2 carries DTOG's two sentences");
let rest = t2 || "";
// [OKF-TOGAF#161: four Pre-AI/Exempt lines from the EA draft. Two are added
// lines, removed here like S1 and S2; two extend a V1 line, restored here to
// V1's wording. Nothing else may differ.]
const ADDED = [S1, S2, "Treat Exempt as a stance, not a gap.", "Never recommend moving every Pre-AI dimension off Pre-AI."];
for (const s of ADDED) { const i = rest.indexOf(s); if (i >= 0) { const e = rest.indexOf("\n", i); rest = rest.slice(0, i).replace(/\n\n$/, "\n") + rest.slice(e < 0 ? rest.length : e + 1); } }
rest = rest.replace(/^- the organization's current scores, which may include .*$/m, "- the organization's current scores")
  .replace("at the organization's current stage, including dimensions that should remain Pre-AI for now.", "at the organization's current stage.");
say(!!t1 && !!t2 && rest.replace(/\n{3,}/g, "\n\n") === t1.replace(/\n{3,}/g, "\n\n"), "and nothing else differs from the approved V1");
say(t1 !== null && !/max_tokens|gpt-/.test(t1), "the approved V1 file is untouched (control)");

console.log("--- nothing preview-only ---");
// [Until the EA prompt's approval this read "no EA readout until its prompt is
// approved (#145)". Approved 2026-10-07; scripts/ea-assessment-self-test.js
// holds the prompt to the draft. Here: EA imports the approved file only.]
say(/from "\.\.\/\.\.\/lib\/prompts\/ea-executive-readout-v1";/.test(api) && !/ea-executive-readout-v1-draft/.test(api), "EA's readout uses its approved prompt, not the draft");
say(!exists("lib/prompts/ea-executive-readout-v1-draft.js") && !exists("lib/prompts/executive-readout-v2-candidate.js"), "neither the EA draft nor the candidate file remains");
say(!/PREVIEW BRANCH|TEST ONLY|NEVER MERGED/.test(api), "the route carries no preview-branch notes");

process.exitCode = bad;
