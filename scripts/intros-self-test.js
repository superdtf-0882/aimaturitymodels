#!/usr/bin/env node
// Self-test for OKF-TOGAF#157 -- the two introductions, published as the
// owner signed them: "Publish the two introductions as 96-DT2 carries them,
// and correct FR-LEX-25 to the eight strata -- David Facer 10/5/2026".
//
// EXPECTED holds the texts exactly as 96-DT2 (OKF-TOGAF
// briefs/2026-10-01-svm-tranche-3/) carries them, extracted from the brief by
// script, not retyped. The practice introduction's first line becomes a "## "
// heading, the digest's own section style; no word changes.
// [2026-10-07, OKF-TOGAF#161: the five-states paragraph gains the owner's sentence
// naming which models define Pre-AI and Exempt, on "Use that wording for the
// /models/ sentence" (David Facer, to CC in session).]
//
// Two modes:
//   node scripts/intros-self-test.js          source checks, offline
//   node scripts/intros-self-test.js --built  also the built output: public/llms.txt
//                                             and the /models/ and /ai/ pages in .next
// Exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

const EXPECTED = {
  "practice": "**AI-Native Enterprise Operating Architecture**\n\nThe practice describes an operating architecture for an AI-native enterprise: an enterprise designed so humans and intelligent agents can share a coherent understanding of work, capability, meaning, authority, and observed reality.\n\n**Philosophy — Ideals over guardrails.**\n\nThe ideal practice is finite and can be stated. Its failure modes are not. This practice therefore discovers what is less than ideal through exercise and observation, rather than by trying to anticipate every way it might fail. Investment goes first to making the ideal explicit, instrumenting the practice against it, and reading the delta. The delta is telemetry: it accrues whether or not anyone is working the part that emits it.\n\nGuardrails still matter — linters, hooks, gates, and other controls. Too few and nothing can refuse; too many and every act pays a toll. Guardrails that are frequently contacted mean there is a broken process, and guardrails that are never contacted offer little value outside an obligation or an act that cannot be undone. The practice therefore biases toward explicit ideals, telemetry, and continuous improvement: Toyoda over Taylor.\n\nThere are several complementary architectural constructs:\n\n**Function Models — What does the enterprise do?**\nStatic maps of enterprise functions: their inputs, activities, capabilities, enabling substrates, outputs, and boundaries. They define the anatomy of a function, not a process for performing it.\n\n**Maturity Models — How capable is the enterprise?**\nCapability ladders for selected functions and practices. They describe meaningful operating states, the transitions between them, and the observable evidence that distinguishes one state from the next. They measure AI-native capability, not AI adoption, process sequence, or organizational rank.\n\n**Strata — How is enterprise action governed?**\nThe architectural governance plane for intent, foundations, standards, language, governed records, authority, operations, and observation. Intent is carried as a fiber through consequential action so each realization remains resolvable and checkable against the intent it serves. Observation closes the evidentiary relationship by returning what happened to the stratum whose claims or actions produced it.\n\n**EA OKF — How is the architecture made machine-navigable?**\nThe machine-readable representation contract for the architecture corpus. Structured YAML headers encode artifact identity, type, relationships, governance, and other architectural metadata, allowing agents to build an in-memory graph, traverse it to determine relevant context, and load Markdown bodies only when needed. Corpus artifacts are Markdown documents carrying EA OKF headers.\n\n**Corpus — What is the governed record?**\nThe Corpus is the enterprise architecture's single governed record: the authoritative collection of intent, principles, standards, language, decisions, contracts, architecture, evidence, and other governed artifacts. It is the record agents consult rather than relying on memory, embedded extracts, or inferred authority.\n\nThese constructs serve different purposes. Do not interpret a Function Model as a maturity ladder, a Maturity Model as a process, Strata as a document hierarchy, the Corpus as a file repository, or EA OKF as an architectural foundation. EA OKF represents and connects the architecture; it is not the architecture itself.",
  "lead": "Capability models for understanding how AI-nativity changes software delivery (SDLC), product management (PDLC), prioritization understood as asset allocation (Product Prioritization), and the enterprise itself (Enterprise Architecture). These models do not ask how much AI an organization uses; they ask what AI-native capability the system actually has, and what realistically adjacent capability comes next.",
  "howto": [
    "Every dimension progresses through the same five operating states: A — Nascent, where good practice is not yet deliberately defined; B — Modeled, where an explicit method exists; C — Continuous, where the capability operates on an ongoing cadence; D — Integral, where it becomes load-bearing beyond its original owner or function; and E — Telemetric, where operation and observation form a continuous feedback loop. A is the first lettered state, not the floor: a dimension practiced with no AI-assisted method at all is Pre-AI, and a dimension an organization has deliberately excluded under a cited obligation is Exempt. The SDLC and EA models define both states; the PDLC and Prioritization models score A to E.",
    "Every control these models describe is read by one rule: a guardrail contacted often is a broken process; one never contacted earns its place only by an obligation or an act that cannot be undone."
  ]
};

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return null; } };

// The practice introduction as the digest carries it.
const PRACTICE_MD = EXPECTED.practice.replace(/^\*\*(AI-Native Enterprise Operating Architecture)\*\*$/m, "## $1");

// Text a reader sees: tags dropped, entities decoded, markdown emphasis and
// heading marks dropped, whitespace collapsed.
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", nbsp: " ", "#39": "'", "#x27": "'" };
const seen = (s) => s
  .replace(/<!--[\s\S]*?-->/g, "")
  // Inline tags join their text ("read by <a>one rule</a>:"); others break it.
  .replace(/<\/?(a|strong|em|b|i|span|code)\b[^>]*>/gi, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&([#a-z0-9]+);/gi, (m, e) => (e.toLowerCase() in ENT ? ENT[e.toLowerCase()] : m))
  .replace(/\*\*/g, "")
  .replace(/^#+ /gm, "")
  .replace(/\s+/g, " ")
  .trim();

console.log("--- source ---");
{
  let intros = null;
  try { intros = require("../lib/intros"); } catch { /* missing before the change */ }
  say(!!intros && intros.PRACTICE_INTRO === PRACTICE_MD, "lib/intros.js carries the practice introduction exactly");
  say(!!intros && intros.MODELS_LEAD === EXPECTED.lead, "lib/intros.js carries the /models/ lead paragraph exactly");
  const howto = intros && intros.MODELS_HOWTO;
  say(!!howto && howto.states === EXPECTED.howto[0], "lib/intros.js carries the five states paragraph exactly");
  say(!!howto && howto.rule.before + howto.rule.link + howto.rule.after === EXPECTED.howto[1] && howto.rule.href === "/ai/",
    "the guardrail rule is exact, with its link to /ai/", howto ? JSON.stringify(howto.rule.href) : "");

  const core = read("lib/aiDigestCore.js") || "";
  const t = core.indexOf("# AI-Native Maturity Models — AI-Readable Digest");
  const p = core.indexOf("${PRACTICE_INTRO}");
  const f = core.indexOf("This is a machine-readable digest");
  say(t >= 0 && p > t && f > p, "the digest places it after the title, before its first paragraph", JSON.stringify({ t, p, f }));

  const page = read("pages/models/index.js") || "";
  const lead = page.indexOf("{MODELS_LEAD}"), list = page.indexOf('className="model-list"'), how = page.indexOf("How to read these models");
  say(lead >= 0 && list > lead && how > list, "/models/ puts the lead above the list and the section below it", JSON.stringify({ lead, list, how }));
}

if (process.argv.includes("--built")) {
  console.log("--- built output ---");
  const llms = (read("public/llms.txt") || "").replace(/\r\n/g, "\n");
  const firstBreak = llms.indexOf("\n\n");
  say(firstBreak > 0 && llms.slice(firstBreak + 2, firstBreak + 2 + PRACTICE_MD.length) === PRACTICE_MD,
    "llms.txt: the practice introduction follows the title, exactly");
  const ai = read(".next/server/pages/ai.html");
  say(!!ai && seen(ai).includes(seen(PRACTICE_MD)), "the /ai/ page shows the practice introduction");
  const models = read(".next/server/pages/models.html");
  const m = models ? seen(models) : "";
  const iLead = m.indexOf(seen(EXPECTED.lead)), iList = m.indexOf("AI-Native SDLC Maturity Model"), iStates = m.indexOf(seen(EXPECTED.howto[0])), iRule = m.indexOf(seen(EXPECTED.howto[1]));
  say(iLead >= 0 && iList > iLead, "/models/: the owner's paragraph, above the list", JSON.stringify({ iLead, iList }));
  say(iStates > iList && iRule > iStates, "/models/: the five states and the rule, below the list", JSON.stringify({ iStates, iRule }));
  say(!!models && /<a href="\/ai\/?">one rule<\/a>/.test(models), "/models/: the rule links to the practice introduction");
}

process.exitCode = bad;
