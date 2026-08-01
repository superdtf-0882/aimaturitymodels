// Shared source for the Strata model (S0-S7) -- consumed by pages/strata.js
// (the interactive explainer) and lib/aiDigestCore.js (the AI-readable
// digest, issue #15). One array, not a copy hand-kept in sync with a
// second one. See pages/strata.js's own history note on why this uses
// the Latin/numbered names rather than a plain-English translation.
//
// Detail prose expanded 2026-08-01 from David's own candidate redraft
// (OKF-TOGAF#43, briefs/2026-08-01-strata-page-reconcile/). Because this
// array feeds both surfaces, the digest's strata section gains the same
// richer text -- that's the point of the single source, not a side
// effect to be worked around.
const STRATA = [
  {
    code: "S0",
    name: "Intent",
    gloss: "Why the practice exists",
    detail:
      "The originating motivation for the practice — ineffable until it's actually elucidated. Not itself a governed artifact until expressed; everything below exists in service of it. Intent is also not a label attached to architecture afterward: every valid governed thing must resolve to the Intent it exists to realize.",
  },
  {
    code: "S1",
    name: "Fundamentum",
    gloss: "Principles, constraints, and charters",
    detail:
      "The first governed expression of Intent. Principles and foundational constraints that rarely change, together with the charters defining what actors — including AI colleagues — are authorized to do. These are generated from Intent, not selected independently and rationalized afterward.",
  },
  {
    code: "S2",
    name: "Normae",
    gloss: "Adopted frameworks, standards, and maturity models",
    detail:
      "The standards against which the practice chooses to govern or measure itself. Adopted, not generated from first principles — selected because they serve the Intent and Fundamentum already established. The AI-Native maturity models in this family are examples; TOGAF® is another. A standard can therefore be entirely legitimate and still be wrong for a practice, if it doesn't serve that practice's Intent.",
  },
  {
    code: "S3",
    name: "Vocabula",
    gloss: "Shared language: ontology, taxonomy, lexicon, semantics",
    detail:
      "The shared language that makes governance checkable — what the practice means by a term, what kinds of entities exist, how they're classified, and which distinctions must stay distinct. This is what lets a human and an AI system inspect the same governed record and recognize the same kind of thing. Without it, governance stays dependent on interpretation.",
  },
  {
    code: "S4",
    name: "Corpus",
    gloss: "The governed record",
    detail:
      "The official archive of the practice. Corpus answers what is part of the record. It does not answer what is in force — a document can sit in the Corpus without possessing authority. Membership establishes that something belongs to the governed record; it doesn't enact, approve, or operationalize what the artifact says. Recorded is not the same as authorized.",
  },
  {
    code: "S5",
    name: "Auctoritas",
    gloss: "Authorization, contracts, and briefs",
    detail:
      "The machinery by which governed work becomes sanctioned — where permission becomes real. A draft authorization is not authorization merely because its text says \"approved\"; the constitutive act, issuance by the proper authority, is what changes its status. This is the difference between a record describing authority and authority actually having been exercised.",
  },
  {
    code: "S6",
    name: "Operationes",
    gloss: "Live systems, tools, and execution",
    detail:
      "The running practice: systems execute, tools act, processes run, agents perform work, and authorized decisions affect the world. Correct placement here does not itself authorize an action — a system can be well described, correctly classified, and traceable to Intent while still lacking authority for a particular consequential act. Well-formed is not the same as permitted.",
  },
  {
    code: "S7",
    name: "Observatio",
    gloss: "Reports, gaps, results, feedback",
    detail:
      "What operation teaches the practice — the evidence produced when architecture meets reality: results, exceptions, failures, measurements, gaps, and lessons. Those observations may justify changes elsewhere in the governed world, and at the deepest level may challenge the Intent the practice set out to realize. That is where feedback closes the loop.",
  },
];

module.exports = { STRATA };
