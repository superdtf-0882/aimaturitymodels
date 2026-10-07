#!/usr/bin/env node
// Self-test for OKF-TOGAF#161 -- Pre-AI and Exempt on the SDLC and EA
// assessments, on "Open a Work Item for Pre-AI and Exempt on the SDLC and EA
// assessments now, Exempt with a short reason field; PDLC and Prioritization
// wait for their models -- David Facer 10/7/2026".
//
// The assessment file's builder and the readout's score parser move into
// lib/assessment-md.js and lib/score-vector.js (plain CommonJS), so this test
// can load them, as lib/dimension-parser.js was moved for #142.
// Offline; synthetic dimensions only.
// Usage: node scripts/threshold-states-self-test.js   (exit 1 on a failing case)
"use strict";

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
let md = null, sv = null;
try { md = require("../lib/assessment-md"); } catch { /* missing before the change */ }
try { sv = require("../lib/score-vector"); } catch { /* missing before the change */ }

const dims = [1, 2, 3].map((n) => ({
  id: "D" + n, name: "Dimension " + n, desc: "Desc " + n,
  levels: { A: "a" + n, B: "b" + n, C: "c" + n, D: "d" + n, E: "e" + n },
}));
const base = { modelTitle: "T", modelFullName: "M", repoUrl: "https://example.test/m", dimensions: dims, date: "2026-10-07" };

console.log("--- the assessment file ---");
{
  const plain = md && md.buildAssessmentMd({ ...base, scores: { D1: "A", D2: "C", D3: "E" } });
  // The file as today's builder writes it, for an A-E-only assessment: it must not change.
  const want = "# T\n\n**Framework:** M — David Facer (CC BY 4.0)\n**Model reference:** https://example.test/m\n**Generated:** 2026-10-07\n\n> Each dimension is scored A through E. A given level is only merited when **everything** in its definition is true. Dimensions are independently scored — an organisation can be advanced in one and nascent in another.\n\n---\n\n## Scores\n\n| Dimension | Name | Level |\n|---|---|---|\n| D1 | Dimension 1 | A |\n| D2 | Dimension 2 | C |\n| D3 | Dimension 3 | E |\n\n*3 of 3 dimensions graded.* No averaged score is computed above — dimensions are independently scored, and collapsing ordinal A–E judgments into a single mean would lend false interval precision to a profile that is only meaningful dimension by dimension.\n\n---\n\n## Full maturity definitions\n\n*All five levels shown for each dimension. Your scored level is marked with ◀.*\n\n### D1. Dimension 1\n\n*Desc 1*\n\n**Level A — your score ◀**\n\na1\n\n**Level B**\n\nb1\n\n**Level C**\n\nc1\n\n**Level D**\n\nd1\n\n**Level E**\n\ne1\n\n---\n\n### D2. Dimension 2\n\n*Desc 2*\n\n**Level A**\n\na2\n\n**Level B**\n\nb2\n\n**Level C — your score ◀**\n\nc2\n\n**Level D**\n\nd2\n\n**Level E**\n\ne2\n\n---\n\n### D3. Dimension 3\n\n*Desc 3*\n\n**Level A**\n\na3\n\n**Level B**\n\nb3\n\n**Level C**\n\nc3\n\n**Level D**\n\nd3\n\n**Level E — your score ◀**\n\ne3\n\n---\n\n*M © 2026 David Facer — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)*\n*Full model: https://example.test/m*\n";
  say(plain === want, "an A-E-only assessment file is byte for byte today's");

  const withStates = md && md.buildAssessmentMd({ ...base, scores: { D1: "Pre-AI", D2: "Exempt", D3: "B" }, exemptReasons: { D2: "Regulatory: a sector rule restricts AI use here" } });
  say(!!withStates && /\| D1 \| Dimension 1 \| Pre-AI \|/.test(withStates) && /\| D2 \| Dimension 2 \| Exempt \|/.test(withStates), "the scores table carries Pre-AI and Exempt");
  say(!!withStates && /## Exempt dimensions[\s\S]*D2 — Dimension 2: Regulatory: a sector rule restricts AI use here/.test(withStates), "each Exempt dimension's reason is written out");
  say(!!withStates && /### D1\. Dimension 1\n\n\*Desc 1\*\n\n\*Your score: Pre-AI/.test(withStates) && !/\*\*Level [A-E] — your score ◀\*\*\n\na1/.test(withStates), "a Pre-AI dimension marks no lettered level");
}

console.log("--- the readout's parser ---");
{
  const file = md && md.buildAssessmentMd({ ...base, scores: { D1: "Pre-AI", D2: "Exempt", D3: "B" }, exemptReasons: { D2: "Contractual: client agreement" } });
  const on = sv && sv.extractScores(file || "", 3, { thresholdStates: true });
  say(!!on && on.vector.join(",") === "Pre-AI,Exempt,B" && on.reasons.D2 === "Contractual: client agreement", "SDLC/EA: Pre-AI, Exempt and the reason are read");
  const off = sv && sv.extractScores(file || "", 3, { thresholdStates: false });
  say(!!sv && off === null, "PDLC/Prioritization: a file with either state is refused");
  const letters = sv && sv.extractScores(md ? md.buildAssessmentMd({ ...base, scores: { D1: "A", D2: "B", D3: "C" } }) : "", 3, { thresholdStates: false });
  say(!!letters && letters.vector.join("") === "ABC", "an A-E file still reads everywhere (control)");
  const k1 = sv && sv.vectorKey(["Exempt"], { D1: "reason one" });
  const k2 = sv && sv.vectorKey(["Exempt"], { D1: "reason two" });
  say(!!sv && k1 !== k2 && sv.vectorKey(["A", "B"], {}) === "AB", "the cache key carries the reason; A-E keys are unchanged");
}

console.log("--- the meanings, read from the model ---");
{
  // [Added in commit 2: readThresholdStates was designed while building.]
  const matrix = "## How to read\n\n### Pre-AI — The Threshold State\n\n**Pre-AI** designates a dimension\nwith no AI practice.\n\nMore text.\n\n---\n\n### Exempt — The Governed Stance\n\n**Exempt** designates a dimension excluded by policy.\n\n**An Exempt designation is valid only when it cites a governing constraint.** Sources follow.\n\n---\n";
  const t = md && md.readThresholdStates(matrix);
  say(!!t && t.preAi === "Pre-AI designates a dimension with no AI practice." && /excluded by policy\. An Exempt designation is valid only when it cites a governing constraint\./.test(t.exempt), "both meanings read from the model's own sections");
  say(!!t && t.exempt.endsWith("cites a governing constraint.") && !/Sources follow/.test(t.exempt), "the Exempt meaning stops at that sentence, not the list after it");
  say(!!md && md.readThresholdStates("## D1. A model with no threshold sections\n") === null, "a model defining neither gets none (PDLC, Prioritization)");
}

console.log("--- grading ---");
{
  say(!!sv && sv.isGraded("Exempt", "") === false && sv.isGraded("Exempt", "   ") === false, "Exempt without a reason does not count as graded");
  say(!!sv && sv.isGraded("Exempt", "Corporate policy: ref 12") && sv.isGraded("Pre-AI") && sv.isGraded("C"), "Exempt with a reason, Pre-AI and a letter count");
}

console.log("--- the buttons (source check) ---");
{
  // [Added 2026-10-07 on the owner's word: "How about Pre AI wrapped and Exmt?"
  // -- the buttons keep their size; the labels shorten. The stored score stays
  // "Pre-AI" / "Exempt"; screen readers and the tooltip get the full name.]
  const comp = require("fs").readFileSync(require("path").join(__dirname, "..", "components", "Assessment.js"), "utf8");
  say(/<>Pre<br \/>AI<\/>/.test(comp) && /"Exempt": "Exmt"|Exempt: "Exmt"/.test(comp), "the labels read Pre/AI (two lines) and Exmt");
  say(/aria-label=\{st\}/.test(comp) && /title=\{st\}/.test(comp), "each button carries its full name for screen readers and on hover");
  say(/onClick=\{\(\) => selectLevel\(st\)\}/.test(comp), "the score stored is still the full state name");
}

process.exitCode = bad;
