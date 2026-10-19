#!/usr/bin/env node
// Self-test for the AI Architecture Taxonomy page -- OKF-TOGAF#189, on "Build
// #189's taxonomy page for aimaturitymodels: the card-form intake and the
// worked examples, linked to the assessment; not shipped before 29 October --
// David Facer 10/15/2026". The page is the taxonomy's intake: a visitor
// describes one system on a card, answers the one question, reads what the
// answer asks them to decide, keeps the card, and goes on to an assessment by
// a link marked ?from=taxonomy. The twenty-nine worked examples carry the
// families their author gave them, marked as not yet checked by anyone else.
//
// lib/taxonomy.js is plain CommonJS, so it is required; the page is read as
// text. Offline; exit 1 on a failing case.
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } };
let bad = 0;
const ok = (c, what) => { console.log("  " + (c ? "PASS" : "FAIL") + "  " + what); if (!c) bad = 1; };

console.log("SELF-TEST -- the AI Architecture Taxonomy page (OKF-TOGAF#189).\n");
let T = null;
try { T = require(path.join(root, "lib", "taxonomy.js")); } catch (e) { console.log("  FAIL lib/taxonomy.js does not load: " + e.message); bad = 1; }
const page = read("pages/taxonomy.js");
const counts = read("lib/counts.js");

if (T) {
  const { QUESTION, FAMILIES, ANSWERS, TESTS, FACT_LINES, EXAMPLES, MODELS, VERSION, assessmentHref, intakeComplete, cardMarkdown, PROVENANCE } = T;

  // The definitions, as the fourth draft has them.
  ok(QUESTION === "Once the system is running, what decides the next piece of domain work?", "the one question, in the fourth draft's words");
  ok(FAMILIES.map((f) => f.key).join(",") === "built-with,fixed-logic,user,ai-chooses,composite,none-of-these", "four families, composite and none of these, in the draft's order");
  ok(FAMILIES.every((f) => f.name && f.answer && f.means), "each family has its name, its answer and what it means");
  ok(FAMILIES.find((f) => f.key === "fixed-logic").name === "Fixed logic decides, AI supplies a value", "the merged family's name");
  ok(ANSWERS.map((a) => a.key).join(",") === "built-with,fixed-logic,user,ai-chooses,composite,none-of-these,unknown", "the answers: the six, and 'can't tell yet'");
  ok(TESTS.length === 4 && TESTS.every((t) => t.title && t.text), "the four tests");
  ok(/fourth draft/i.test(VERSION) && /2026-10-15|15 October 2026/.test(VERSION), "the page names the draft and its date");

  // What each answer asks the visitor to decide: the implication rule keyed
  // to that answer, its decision and the evidence that would test it.
  const four = FAMILIES.filter((f) => ["built-with", "fixed-logic", "user", "ai-chooses"].includes(f.key));
  ok(four.every((f) => f.decide && f.decide.decision && f.decide.evidence), "each of the four families says what it asks you to decide, and the evidence");

  // The card: the nine fact lines the worked examples use.
  ok(FACT_LINES.length === 9, "nine fact lines");

  // The worked examples.
  ok(EXAMPLES.length === 29, "twenty-nine worked examples");
  ok(EXAMPLES.map((e) => e.id).join(",") === Array.from({ length: 29 }, (_, i) => "W-" + String(i + 1).padStart(2, "0")).join(","), "W-01 to W-29, in order");
  ok(EXAMPLES.every((e) => e.title && e.source && e.flows.length && e.facts.length === 9), "each example has its title, source, steps and nine facts");
  ok(EXAMPLES.every((e) => e.facts.map((f) => f.line).join("|") === FACT_LINES.map((f) => f.line).join("|")), "each example's fact lines are the card's nine, in order");
  const keys = FAMILIES.map((f) => f.key);
  ok(EXAMPLES.every((e) => keys.includes(e.family)), "each example carries a family");
  const by = {};
  EXAMPLES.forEach((e) => { by[e.family] = (by[e.family] || 0) + 1; });
  ok(by["fixed-logic"] === 9 && by["ai-chooses"] === 8 && by.user === 7 && by.composite === 2 && by["built-with"] === 2 && by["none-of-these"] === 1,
    "the families are the sealed list's, mapped: 9, 8, 7, 2, 2, 1");
  ok(EXAMPLES.every((e) => !e.also || (e.also.length && e.also.every((a) => keys.includes(a) && a !== e.family))), "a borderline note names other families only");
  ok(PROVENANCE.verified === false && /0b6da3472c8ae0ee2a660e419bdceee2528b601e315ac412f7c371c45bd258c6/.test(PROVENANCE.families), "the families are marked unverified, with the sealed list's hash");

  // Onward to an assessment, marked by the link and read by the counters.
  ok(MODELS.map((m) => m.slug).join(",") === "ea,sdlc,pdlc,prioritization", "the four assessments, in the site's order");
  ok(MODELS.every((m) => assessmentHref(m.slug) === "/models/" + m.slug + "/assessment/?from=taxonomy"), "each link to an assessment carries ?from=taxonomy");
  let fromOf = null;
  try { fromOf = new Function(counts.replace(/^export\s+/gm, "") + "\nreturn fromOf;")(); } catch (e) { fromOf = null; }
  ok(fromOf && MODELS.every((m) => fromOf(assessmentHref(m.slug).slice(assessmentHref(m.slug).indexOf("?"))) === "taxonomy"), "the counters read those links as from the taxonomy");


  // THE TABLE (OKF-TOGAF#189, rebuilt 2026-10-19 on the owner's line "Build the
  // taxonomy page as DTOG-taxonomy-table drafts it with 252-DT2's link fixes,
  // under #189 -- David Facer 10/19/2026"): four rows, each with the next
  // question to ask, two examples, and the dimensions that measure the answer.
  const R = T.ROWS || [];
  ok(R.map((r) => r.key).join(",") === "built-with,fixed-logic,user,ai-chooses", "four rows, one per family, in order");
  ok(R.map((r) => r.name).join("|") === "AI helped build conventional software|A fixed workflow uses AI outputs|A person directs the interaction|AI chooses successive actions", "the rows carry the owner's names");
  ok((R[0] || {}).question === "How have we verified the resulting software — and can we say who authored each AI-written change and who reviewed it?", "row 1's question, with the attribution join");
  ok((R[1] || {}).question === "What happens when an output is wrong, uncertain, or unexpected?", "row 2's question");
  ok((R[2] || {}).question === "Can that person understand and meaningfully check the AI's contribution before anything is committed on it?", "row 3's question, with the commitment join");
  ok((R[3] || {}).question === "How do we evaluate the sequence, constrain what it may do, and recover from mistakes?", "row 4's question");
  ok(R.map((r) => (r.examples || []).join("+")).join(",") === "W-14+W-03,W-05+W-21,W-15+W-04,W-17+W-27", "two examples per row, as drafted");
  ok(R.every((r) => (r.examples || []).every((id) => (EXAMPLES.find((e) => e.id === id) || {}).family === r.key)), "each row's examples belong to its family");
  const dimsOf = (r) => (r.dims || []).map((d) => d.model + ":" + d.dim).join("+");
  ok(R.map(dimsOf).join(",") === "sdlc:d7+sdlc:d8+sdlc:d11,sdlc:d12,sdlc:d12+sdlc:d8,ea:d7+sdlc:d11+sdlc:d12", "the dimensions that measure each answer, with the two link fixes and EA D7 on row 4");
  // OKF-TOGAF#189, on "Add EA D7 to the taxonomy's fourth row for agents acting
  // in the business, under #189 -- David Facer 10/19/2026" (260-DT2 section 4):
  // row 4 splits by what the agent acts on. EA D7, the authority plane, for an
  // agent acting in the business; SDLC D11 for one acting in the delivery path.
  const r4 = (R[3] || {}).dims || [];
  ok((r4[0] || {}).label === "EA D7" && /where the agent acts in the business/.test((r4[0] || {}).when || ""), "row 4's EA D7 applies where the agent acts in the business");
  ok((r4[1] || {}).label === "SDLC D11" && /where it acts in the delivery path/.test((r4[1] || {}).when || ""), "row 4's SDLC D11 applies where it acts in the delivery path");
  ok(!((r4[2] || {}).when), "row 4's SDLC D12 applies to either, as before");
  ok(T.dimensionHref("ea", "d7") === "/models/ea/assessment/?from=taxonomy#dim=d7", "the EA link opens the EA assessment at D7, marked from the taxonomy");
  ok(/key=\{d\.model \+ ":" \+ d\.dim\}/.test(page), "the page keys each link by model and dimension, so two models' D7 in one row stay apart");
  ok(/D12 stays classic/.test((R[0] || {}).note || ""), "row 1 says D12 stays classic");
  ok(/where the contribution is code/.test(((R[2] || {}).dims || [])[1] ? R[2].dims[1].when || "" : ""), "row 3's D8 applies where the contribution is code");
  ok(/steering, or just reading/i.test((R[2] || {}).note || ""), "row 3 carries the first hard-case test");
  ok(typeof T.dimensionHref === "function" && T.dimensionHref("sdlc", "d7") === "/models/sdlc/assessment/?from=taxonomy#dim=d7", "each cell links to that assessment at that dimension, marked from the taxonomy");
  ok(T.SORTING === "Once the system is running, what decides the next piece of domain work — nothing by AI, fixed logic, a person, or the AI itself?", "the sorting question, as the way to find your row");

  // When the intake is complete: a named system and an answer; none of these
  // needs its sentence; composite needs at least two parts, each classified.
  const base = { name: "Claims triage", purpose: "", steps: [], facts: {}, answer: "fixed-logic", reason: "", parts: [] };
  ok(intakeComplete(base), "a named system with an answer is complete");
  ok(!intakeComplete({ ...base, name: "  " }), "without a name it isn't");
  ok(!intakeComplete({ ...base, answer: "" }), "without an answer it isn't");
  ok(!intakeComplete({ ...base, answer: "none-of-these" }) && intakeComplete({ ...base, answer: "none-of-these", reason: "It has no running state." }), "none of these needs its sentence");
  ok(!intakeComplete({ ...base, answer: "composite", parts: [{ name: "Advice", family: "user" }] }) &&
    intakeComplete({ ...base, answer: "composite", parts: [{ name: "Advice", family: "user" }, { name: "Account changes", family: "ai-chooses" }] }),
    "composite needs two parts, each classified");

  // The card to keep, in Markdown.
  const md = cardMarkdown({ ...base, purpose: "Routes incoming claims", steps: [{ text: "A claim arrives", ai: false, waits: "" }, { text: "A model scores it", ai: true, waits: "" }, { text: "An adjuster reviews it", ai: false, waits: "adjuster" }], facts: { "What starts it": "a claim arriving" }, reason: "The rules route on the score." });
  ok(/^# Claims triage/m.test(md), "the card is headed with the system's name");
  ok(md.includes("Fixed logic decides, AI supplies a value"), "the card names the family");
  ok(md.includes(QUESTION) && md.includes("The rules route on the score."), "the card quotes the question and the visitor's reason");
  ok(/\*\*\[AI\]\*\* A model scores it/.test(md) && /\*\*\[waits: adjuster\]\*\* An adjuster reviews it/.test(md), "the steps keep their AI and waits marks, as the examples write them");
  ok(md.includes("What starts it: a claim arriving") && !md.includes("What it keeps:"), "the card carries the facts given and leaves out the blank ones");
  ok(/fourth draft/i.test(md), "the card names the draft it was classified against");

  // DTOG's answers to 344-CC (OKF TOGAF k189), applied on "Apply DTOG's
  // answers to 344-CC on the taxonomy page and push them to aimaturitymodels
  // -- David Facer 10/15/2026": its final words for what each answer asks.
  const fam = (k) => FAMILIES.find((f) => f.key === k) || {};
  ok((fam("built-with").decide || {}).decision === "Operation is described the way any conventional system is. One decision remains from construction: whether AI-authored change carries a distinct review or attribution requirement."
    && (fam("built-with").decide || {}).evidence === "Change records showing who authored each change and who reviewed it.", "DTOG's words: built with AI, runs without it");
  ok(/^Define the boundary where the model's value enters the logic: the input it accepts, the output it will act on, and what the logic does with an output it won't/.test((fam("fixed-logic").decide || {}).decision || "")
    && /^A log of model calls with an outcome class \(accepted, fallback, refused\); for staged logic, traces showing each model output beside the step taken next\.$/.test((fam("fixed-logic").decide || {}).evidence || ""), "DTOG's words: fixed logic decides");
  ok((fam("user").decide || {}).decision === "Name the commitment point: where a suggestion or draft becomes an act, and who performs it."
    && (fam("user").decide || {}).evidence === "A sample of outputs traced to what was then committed, declined or changed.", "DTOG's words: the user steers");
  ok(/State who may do what — the actor, what needs approval, what it may reach, how its authority is withdrawn\. If that isn't described, record the gap; what the system is technically able to do is not read as permission\.$/.test((fam("ai-chooses").decide || {}).decision || "")
    && /and the record of each act with who is answerable for it\.$/.test((fam("ai-chooses").decide || {}).evidence || ""), "DTOG's words: the AI chooses its own next step");
  ok(T.GUIDANCE && T.GUIDANCE.composite === "Each part gets its own, above."
    && T.GUIDANCE["none-of-these"] === "The sentence you wrote is the finding. Keep it; it's the kind of case that changes the taxonomy."
    && /^Look at the steps you marked AI and ask, for each, what happens to its output next: code acts on it, a person acts on it, or the AI itself decides\. That answer is the family\.$/.test(T.GUIDANCE.unknown || ""),
    "DTOG's words for composite, none of these and can't tell yet");
  const w19 = EXAMPLES.find((e) => e.id === "W-19") || {};
  ok(w19.note === "Same family as W-18; the difference is who may act without approval, not how the system decides — capability and authority are kept separate.", "W-19's note as DTOG approved it, with its added clause");
  ok((EXAMPLES.find((e) => e.id === "W-17") || {}).title === "Claude Code in its default mode (labelled Manual)", "W-17 named as its source does");
  const mdU = cardMarkdown({ ...base, answer: "unknown" });
  ok(mdU.includes(T.GUIDANCE ? T.GUIDANCE.unknown : "\u0000"), "the card carries can't-tell-yet's guidance");
}

// The page.
ok(/export default function/.test(page), "pages/taxonomy.js exists and renders");
ok(/not (yet )?(been )?checked/i.test(page), "the page says the examples' families are not yet checked by anyone else");
ok(/ROWS\.map\(/.test(page) && page.indexOf("ROWS.map(") < page.indexOf("<h2>Worked examples</h2>"), "the table comes first, before the examples");
ok(/How you would answer it/.test(page) && /decideFor\(/.test(page), "under each row, how you would answer it: the decision and its evidence");
ok(/When a case is hard/.test(page) && /TESTS\.map\(/.test(page), "the hard-case tests sit under a disclosure below the table");
ok(!/Name your system/.test(page) && !/intakeComplete\(/.test(page) && !/"taxonomy-intake-completed"/.test(page), "the card intake is gone, and its count with it");
ok(/dimensionHref\(/.test(page) && /\/api\/count\//.test(page), "each cell links to its dimension, and following it is counted at the count route");
ok(/event: "taxonomy-row-followed", row: /.test(page) && /keepalive: true/.test(page), "the count carries the event and the row, and nothing else");
ok(!/localStorage|sessionStorage|document\.cookie/.test(page), "the page keeps nothing in the browser");
ok(/SORTING/.test(page) && /one row per part/.test(page) && /finding, not a mistake/.test(page), "under the table: the sorting question, composite, and none of these");
ok(/href="\/taxonomy"|href="\/taxonomy\/"/.test(read("components/Layout.js")), "the site's menu links to the taxonomy");

// Nothing private on the public page or in its data.
const shipped = (T ? JSON.stringify(T) : "") + page.replace(/\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
ok(!/\bDTOG\b|\bDT2\b|OKF-TOGAF|briefs\/|corpus\//.test(shipped), "no private role, repository or record is named on the page or in its data");

ok(/taxonomy-self-test\.js/.test(read("package.json")), "the build runs this test first");

process.exitCode = bad;
