// Shared source for the Strata model (S0-S7) -- consumed by pages/strata.js
// (the interactive explainer) and lib/aiDigestCore.js (the AI-readable
// digest, issue #15). One array, not a copy hand-kept in sync with a
// second one. See pages/strata.js's own history note on why this uses
// the Latin/numbered names rather than a plain-English translation.
const STRATA = [
  {
    code: "S0",
    name: "Intent",
    gloss: "Why the practice exists",
    detail:
      "The originating motivation for the practice — ineffable until it's actually elucidated. Not itself a governed artifact until then; everything below exists in service of it.",
  },
  {
    code: "S1",
    name: "Fundamentum",
    gloss: "Principles, constraints, and charters",
    detail:
      "The first governed expression of Intent — generated directly from it, not selected from outside. Principles and foundational constraints that rarely change, plus the charters defining what any AI colleague is authorized to do.",
  },
  {
    code: "S2",
    name: "Normae",
    gloss: "Adopted frameworks, standards, and maturity models",
    detail:
      "External standards and maturity models the practice measures itself against. Adopted, not generated — chosen in service of what Fundamentum already established, not the other way around.",
  },
  {
    code: "S3",
    name: "Vocabula",
    gloss: "Shared language: ontology, taxonomy, lexicon, semantics",
    detail:
      "The shared, precise language that makes a standard checkable and keeps the record consistent — schema, lexicon, and taxonomy, precise enough that an AI system can read it directly and a human still recognizes exactly what it's looking at.",
  },
  {
    code: "S4",
    name: "Corpus",
    gloss: "The governed record",
    detail:
      "The single governed archive. A location, not an authority by itself — an artifact can sit in the Corpus without automatically being in force. Everything else is evidence, not the record.",
  },
  {
    code: "S5",
    name: "Auctoritas",
    gloss: "Authorization, contracts, and briefs",
    detail:
      "The formal machinery by which work is actually sanctioned and handed off. Issuance is the constitutive act — the moment authorization becomes real, not just written down.",
  },
  {
    code: "S6",
    name: "Operationes",
    gloss: "Live systems, tools, and execution",
    detail:
      "The live systems, tools, and processes actually doing the work day to day. This is where the governed model above becomes something running, not just something described.",
  },
  {
    code: "S7",
    name: "Observatio",
    gloss: "Reports, gaps, results, feedback",
    detail:
      "The feedback layer. What operating the system actually teaches, returned back to sharpen Intent over time — this is where the loop closes, and why nothing above is ever really finished.",
  },
];

module.exports = { STRATA };
