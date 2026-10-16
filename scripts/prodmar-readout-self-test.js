#!/usr/bin/env node
// Self-test for the Product Marketing Executive Readout prompt -- OKF-TOGAF#202
// (drafted by DTOG under #198). Prompts are never overwritten (C-006/P-07), so
// the new model gets its own constant: PRODMAR_EXECUTIVE_READOUT_PROMPT_V1 =
// EA_EXECUTIVE_READOUT_PROMPT_V2 with exactly ten passages replaced. The
// replacements are listed here, applied to EA v2 and compared with the new
// file, so the test is the specification.
// Approved: "ProdMar readout v1.0: EA v2 with DTOG's nine passages replaced and
// 203-DT2's two changes, which CC applies at landing with the self-test
// updated, nothing else -- David Facer 10/16/2026". 203-DT2's change A
// rewrites replacement 7 (the scope sentence keeps the security exclusion and
// says D3 scores the positioning thesis); change B is replacement 10 (the
// order sentence). DTOG wrote this test; CC applied both changes to it.
// Source checks, offline. Usage: node scripts/prodmar-readout-self-test.js
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

const REPLACEMENTS = [
  ["You are a senior Enterprise Architecture and Product Strategy consultant.", "You are a senior Product Marketing and Enterprise Architecture consultant."],
  ["You have been provided an AI-Native Enterprise Architecture Maturity Assessment generated from the AI-Native Enterprise Architecture Maturity Model by David Facer. This model measures the enterprise architecture function's AI-native maturity — the allocation of organizational capability investment toward an architecture that governs agentic execution — not general architectural excellence, and not necessarily organizational quality.", "You have been provided an AI-Native Product Marketing Maturity Assessment generated from the AI-Native Product Marketing Maturity Model by David Facer. This model measures the Product Marketing function's AI-native maturity — the allocation of organizational capability investment toward a function whose knowledge, claims, and language are governed well enough for human and AI actors to work from them — not general marketing excellence, and not necessarily organizational quality."],
  ["- ten independently scored maturity dimensions", "- eleven independently scored maturity dimensions"],
  ["for a CEO, CIO, CTO, Chief Enterprise Architect, or private equity operating partner.", "for a CEO, CMO, Chief Product Officer, Head of Product Marketing, or private equity operating partner."],
  ["Expect Pre-AI to be common. Enterprise architecture is later to agentic adoption than software delivery, and a profile in which most dimensions score Pre-AI is an ordinary result, not a failing one. Read it as a starting position with a readiness story, not as ten failures. Where a Pre-AI dimension carries a readiness note, use it: existing architectural discipline — a real ontology, enforced metamodel conformance, an operating repository — is transferable substrate and predicts how fast that dimension will cross levels once AI tooling arrives.", "Expect Pre-AI to be uneven rather than common. Product Marketing adopted AI-assisted drafting early, so the messaging, enablement, and communication dimensions are rarely Pre-AI; the corpus, authority, and market-response dimensions often are, because they need governed records and decision rights that drafting tools never required. A profile in which several dimensions score Pre-AI is an ordinary result, not a failing one. Read it as a starting position with a readiness story, not as eleven failures. Where a Pre-AI dimension carries a readiness note, use it: existing discipline — an owned messaging framework, a maintained claims library, written decision rights — is transferable substrate and predicts how fast that dimension will cross levels once AI tooling arrives."],
  ["This model's dimensions come in pairs that must be scored apart and read together:\n\n- D1 (Architecture process) governs how architectural intent is formed and validated; D2 (Architecture development) governs what the architecture is made of — the artifacts and the substrate they live in. A practice can run a mature process over a poor substrate, and a rich substrate can be maintained by an immature process.\n- D3 (Business linkage) governs whether work traces to business authority; D8 (Strategic portfolio management and asset allocation) governs how scarce resources — capital, compute, token budget, agentic capacity — are allocated among things that all trace correctly. Valid lineage is a precondition for D8, not a substitute for it: everything in a portfolio can be properly linked and still be the wrong portfolio.\n- D4 (Senior management involvement) governs the authoring of intent and the trust placed in the substrate by those who author it; D5 (Operating unit participation) governs consumption and participation by those who operate within it. The two often diverge: executive mandate without unit participation produces a repository nobody uses, and unit adoption without executive mandate produces a repository nobody obeys.\n- D7 (Governance and authority plane) governs whether an actor may act, and over which surfaces; D9 (Architecture governance) governs whether the architecture itself remains coherent, and treats friction as a symptom of a design flaw. An action can be fully authorized and still indicate an ontological defect — that is D9's signal, not D7's.\n\nTreat D7 (Governance and authority plane) and D10 (Shared language) as systemic capabilities rather than simply two of the ten dimensions. D7 is whether decision rights and authority boundaries have been established against the surfaces they actually cover, for human actors and machine agents alike — the floor an agentic enterprise runs on. D10 is whether the enterprise's working vocabulary resolves to one governed meaning in both directions — the condition every other dimension's artifacts and agents depend on to mean the same thing to everyone who reads them.\n\nRecognize that D2 is the substrate dimension: whether architecture artifacts bind runtime execution or merely describe it. The upper levels of most other dimensions presuppose a substrate that binds; a high score elsewhere over a low D2 is a claim worth examining.\n\nRecognize that D6 (Architecture communication) is where the architecture becomes available to AI assistants as well as to people. A low D6 beside a high D2 means a substrate that exists but is not yet reachable by the agents it is meant to govern.", "This model's dimensions come in pairs that must be scored apart and read together:\n\n- D4 (Knowledge corpus & standing) governs what a record is, where it came from, and whether it is in force; D5 (Messaging, content & proof) governs whether the claims, wording, and proof built from those records are coherent and substantiated. A claim can be well stored and properly approved and still be unsupported — that is D5's signal, not D4's.\n- D5 (Messaging, content & proof) governs the quality of what is produced; D6 (Sales & partner enablement) governs whether the field can use it at the moment of a commercial conversation. Good content nobody can reach in a deal and reachable content that is stale are different failures with different owners.\n- D7 (Launch communication & readiness) governs readiness and market introduction against release intent; the release decision itself belongs to Product Management and is read from, never made by, the readiness record. A high D7 does not imply launch authority and should not be read as one.\n- D8 (Customer adoption communication) governs outbound guidance that supports adoption; D9 (Market-response learning) governs what the market's response teaches. D8 at its highest level depends on D11 at Integral, because agents sending to customers need delegated authority first; a high D8 over a low D11 is a claim worth examining.\n- D1–D3 are read from the Product Marketing chair and inherited from the family's shared intelligence layer. Through Level C they describe one function's asset; where Product and Marketing each keep a version — Product's user personas beside Marketing's buyer personas — the dimension is below D by definition, and that gap is a finding about integration, not a scoring error.\n\nTreat D10 (Shared language) and D11 (Governance, delegation & authority) as systemic capabilities rather than simply two of the eleven dimensions. D10 is whether the function's working vocabulary resolves to one governed meaning inward and translates outward with a record of what was collapsed — the condition every claim, asset, and agent depends on to mean the same thing to everyone who reads them, and the condition the buyer meets first. D11 is whether decision rights over drafting, approving, issuing, publishing, and sending have been established against the surfaces they actually cover, for human actors and machine agents alike — the floor an agentic function runs on.\n\nRecognize that D5 is the continuity dimension: whether a claim stays the same claim, in approved wording with its evidence attached, across every asset that uses it. The upper levels of D6, D7, and D8 presuppose claim records that persist; a high score there over a low D5 is a claim worth examining.\n\nRecognize that D9 is scored on how response evidence is gathered, linked, routed, and acted on, not on how fast the market answers. In calendar-bound markets, signal arrives on budget and buying cycles; market-imposed latency is not a maturity deficit and should not be read as one."],
  ["This model does not assess the security programme. Data protection, secrets hygiene, vendor risk, and regulatory security compliance are outside its scope; what D7 measures is reachability — whether an authority boundary has been established against the surface it actually covers. Interpret D7 on that basis, and do not mention this scope boundary to the reader.", "This model does not assess demand generation, campaign performance, pipeline, pricing or packaging decisions, or the security programme. Positioning decisions belong to Product Management; D3 scores whether the positioning thesis is maintained and shared, not who decides it. What D11 measures is reachability — whether an authority boundary has been established against the surface it actually covers. Interpret D11 on that basis, and do not mention this scope boundary to the reader."],
  ["Do not explain TOGAF or the Architecture Capability Maturity Model it descends from.", "Do not explain the model family, the shared intelligence layer, or the Enterprise Architecture model this one draws on."],
  ["The reader should feel that an experienced enterprise architect has interpreted the assessment", "The reader should feel that an experienced product marketing leader has interpreted the assessment"],
  // 203-DT2 change B: this model's order is presentation order (its own review boundaries).
  ["Their order comes from the model's provenance, not from any workflow.", "Their order is presentation order, not any workflow."]
];

console.log("--- EA v2, the source ---");
const ea = body(read("lib/prompts/ea-executive-readout-v2.js"), "EA_EXECUTIVE_READOUT_PROMPT_V2");
say(!!ea, "EA v2's prompt body is readable");
say(ea && sha(ea) === "aa940f69b082c0e0", "EA v2's prompt text is the one the draft was built from", ea ? sha(ea) : "");

console.log("--- the ten replacements ---");
let want = ea || "";
let anchors = true;
for (const [oldText, newText] of REPLACEMENTS) {
  const n = want.split(oldText).length - 1;
  if (n !== 1) anchors = false;
  want = want.replace(oldText, newText);
}
say(anchors, "each replaced passage occurs exactly once in EA v2");
say(REPLACEMENTS.length === 10, "ten replacements, as the header says", String(REPLACEMENTS.length));

console.log("--- ProdMar v1 ---");
const pm = body(read("lib/prompts/prodmar-executive-readout-v1.js"), "PRODMAR_EXECUTIVE_READOUT_PROMPT_V1");
say(!!pm, "ProdMar v1's prompt body is readable");
say(!!pm && pm === want, "ProdMar v1 is EA v2 plus the ten replacements, nothing else");
say(!!pm && /eleven independently scored/.test(pm) && !/\bten independently\b/.test(pm), "it counts eleven dimensions");
// "security programme" left this list with 203-DT2 change A: the model's D11
// excludes it, as EA's D7 does, so the scope sentence now names it on purpose.
say(!!pm && !/TOGAF|Architecture Capability Maturity Model|Chief Enterprise Architect/.test(pm), "no EA-only reference survives");
say(!!pm && /or the security programme\./.test(pm) && /D3 scores whether the positioning thesis is maintained and shared/.test(pm), "the scope sentence keeps the security exclusion and D3's thesis (203-DT2 A)");
say(!!pm && /Their order is presentation order, not any workflow\./.test(pm) && !/model's provenance/.test(pm), "the order sentence is this model's (203-DT2 B)");
say(!!pm && /Write no more than 900 words in total/.test(pm) && /no more than 900 words\./.test(pm), "the 900-word ceiling and budgets are carried");
say(!!pm && /please contact David Facer\.$/.test(pm.trim()), "it ends with the family's closing line");

console.log("--- the route ---");
{
  const api = read("pages/api/diagnostic.js");
  say(/prodmar: \{[^}]*dimensionCount: 11,[^}]*prompt: PRODMAR_EXECUTIVE_READOUT_PROMPT_V1,[^}]*promptVersion: "prodmar-v1"[^}]*thresholdStates: true/.test(api), "ProdMar readouts use V1 with eleven dimensions and threshold states (pending CC's registry entry)");
}

process.exitCode = bad;
