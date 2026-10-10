// The long view -- WP-LONGVIEW-01, OKF-TOGAF#173: the buyer narrative that opens
// the home page, on "Open a Work Item for WP-LONGVIEW-01 and build it as 133-DT2
// scopes it; the electric-motor block is replaced; C5 held back for now --
// David Facer 10/10/2026" (OKF TOGAF briefs/2026-10-01-svm-tranche-3/133-DT2).
//
// THE SPINE is the positioning thesis PT-001 2.0 and its ratified claims, in
// the owner's words, exactly as the market-intelligence supplier records them
// at the commit the practice accepted (AC-013). Claim C5 is held back for now,
// on the owner's word. Whether this text still matches PT-001 is checked on the
// practice side (OKF TOGAF tools/mi-conformance.js): this site cannot read the
// private supplier, and the check reports, never refuses.
//
// THE ENTRIES are one per buyer persona (the corpus's S-009, S-011, S-013,
// S-015, S-017 and S-019). Their words are CC's draft for the owner to approve
// (133-DT2 activity 3); no supplier text, quote or figure is on the page
// (133-DT2 section 3.3, condition 4). Each opens on what brings that buyer
// here and closes on what "understood" means for them (DTOG's table of
// 2026-10-10), and points at proof the site already serves.
//
// Plain CommonJS, no Next imports, so a self-test can require it.
"use strict";

const LONGVIEW_THESIS_PARAGRAPHS = [
  [
    "AI transformation advice typically sprinkles AI across the organization and calls the marginal gains a strategy; the friction eats most of them.",
    "This practice says the opposite: the transformational benefits come only where an enterprise refactors critical components of its work around AI, and the difficulty is knowing which parts.",
  ],
  [
    "Within the AI-Native Enterprise Operating Architecture, the maturity models describe those parts as maturity levels from Nascent to Telemetric, each with the capability evidence that proves it — agnostic to the brand of implementation, from TOGAF to DIY.",
    "The models are published under CC BY 4.0, free to use and adapt, with attribution; there is no secret AI sauce behind them, and nothing a reader outside the engagement cannot check.",
  ],
  [
    "EA OKF is the machine-readable form an enterprise’s architecture records carry, so that people and AI agents read one source of truth.",
    "Strata is the governance plane in which an AI-native enterprise’s consequential work is sanctioned, attributable, bounded and observable, from stated intent through authority and execution to evidence.",
    "Engagements apply the models to the client’s evidence; they do not sell access to the models.",
  ],
];
const LONGVIEW_THESIS = LONGVIEW_THESIS_PARAGRAPHS.map((p) => p.join(" ")).join(" ");

// The ratified claims, their titles verbatim; C5 held back for now.
const LONGVIEW_CLAIMS = [
  { id: "PT-001-C1", title: "Verifiable, not asserted: every maturity level, Nascent to Telemetric, states the capability evidence that proves it, so a reader outside the engagement can check it.", href: "/models/sdlc/whole-model-view", proof: "See every level's evidence" },
  { id: "PT-001-C2", title: "Open: the models are CC BY 4.0, free to use and adapt with attribution, with no secret sauce behind them; engagements apply them to the client's evidence and do not sell access.", href: "/models", proof: "The published models" },
  { id: "PT-001-C3", title: "One family across SDLC, PDLC, portfolio and EA, where every competitor covers one lane.", href: "/models", proof: "The family" },
  { id: "PT-001-C4", title: "One source of truth: EA OKF is the machine-readable form of the architecture records, so people and AI agents read the same records.", href: "/eaokf", proof: "EA OKF" },
  { id: "PT-001-C6", title: "Refactor, don't sprinkle: the transformational benefit comes only where critical components of work are refactored around AI, and the hard part is knowing which ones.", href: "/ai", proof: "The practice introduction" },
  { id: "PT-001-C7", title: "Implementation-agnostic: the levels hold whether an enterprise runs TOGAF, a commercial EA tool or its own method.", href: "/models", proof: "The models" },
  { id: "PT-001-C8", title: "Strata as the governance plane: an AI-native enterprise's consequential work is sanctioned, attributable, bounded and observable, from stated intent through authority and execution to evidence.", href: "/strata", proof: "Strata" },
];

// One entry per buyer persona, in the corpus's order. CC's draft words.
const LONGVIEW_ENTRIES = [
  {
    id: "cio",
    role: "CIO",
    objective: "Decide where AI investment goes next",
    opening: "Your board wants to see what AI is returning, and you have to choose where the next investment goes without repeating the last vendor's promises.",
    body: "Each model sets out the levels a function moves through, and the evidence that shows which level you are at. An assessment gives you a baseline; the Portfolio Prioritization model and its Strategic Value Matrix turn that baseline into a ranked set of priorities.",
    understood: "I have a data-backed baseline and a target I can rank priorities with, and I can trace every claim to its evidence.",
    proof: [
      { href: "/assessments", label: "Run an assessment" },
      { href: "/models/prioritization/whole-model-view", label: "Portfolio Prioritization" },
      { href: "/models/prioritization/strategic-value-matrix", label: "The Strategic Value Matrix" },
    ],
  },
  {
    id: "cto",
    role: "CTO",
    objective: "Know where AI engineering spend pays back",
    opening: "You are paying for AI in the engineering organization and need to know which parts of delivery it actually changes, and which it only speeds up.",
    body: "The AI-Native SDLC Maturity Model covers delivery from specification to production evidence. Every transition between levels carries a verification clause: what you would have to observe to say the level has been reached.",
    understood: "It is evidence-based the way DORA is, and it shows where AI engineering spend pays back.",
    proof: [
      { href: "/models/sdlc/whole-model-view", label: "The SDLC model, whole" },
      { href: "/models/sdlc/assessment", label: "The SDLC assessment" },
    ],
  },
  {
    id: "head-of-product",
    role: "Head of Product",
    objective: "Make better product decisions without more process",
    opening: "You want better product and revenue decisions, and you will not add another process to get them.",
    body: "The AI-Native PDLC Maturity Model reads how market intelligence becomes product definition and governed investment. The Portfolio Prioritization model treats product and internal work as one portfolio, ranked on the same terms.",
    understood: "It helps us make better outcome decisions, adds no process, and plugs into what we already run.",
    proof: [
      { href: "/models/pdlc/whole-model-view", label: "The PDLC model, whole" },
      { href: "/models/prioritization/strategic-value-matrix", label: "The Strategic Value Matrix" },
    ],
  },
  {
    id: "enterprise-architect",
    role: "Enterprise Architect",
    objective: "Keep architecture current and governance light",
    opening: "Architecture records go stale, and there is no single source of truth that people and tools both trust.",
    body: "EA OKF gives architecture records a machine-readable header, so people and AI agents read and traverse the same records. Strata is the governance plane those records serve. The AI-Native EA Maturity Model says what each level of the practice looks like, whatever framework you use.",
    understood: "It maps onto TOGAF, makes governance faster rather than heavier, and is not more documentation nobody maintains.",
    proof: [
      { href: "/eaokf", label: "EA OKF" },
      { href: "/models/ea/whole-model-view", label: "The EA model, whole" },
      { href: "/strata", label: "Strata" },
      { href: "/llms.txt", label: "The map for AI readers" },
    ],
  },
  {
    id: "transformation-lead",
    role: "Transformation Lead",
    objective: "Go past diagnosis to change that lasts",
    opening: "You have seen diagnoses that stopped at the diagnosis, and engagements that left nothing behind when the consultants did.",
    body: "Every assessment ends in an executive readout: where you are, what the next level requires, and what to do first. The models are open under CC BY 4.0, so the capability stays with your organization.",
    understood: "It goes past diagnosis to measures a board can hold us to, and the capability stays with us when the engagement ends.",
    proof: [
      { href: "/assessments", label: "The assessments" },
      { href: "/models/sdlc/whole-model-view", label: "What each transition requires" },
      { href: "/ai", label: "The practice, in full" },
    ],
  },
  {
    id: "c-level-strategist",
    role: "C-level Strategist",
    objective: "Judge the thinking, and what it delivers within a year",
    opening: "You judge advice on the quality of its thinking, on whether it pays back within a year, and on whether anyone can show how its conclusions were checked.",
    body: "The practice's argument is the one above: the returns come from refactoring the few components that matter, not from spreading AI thinly. Every level states the evidence that proves it, and Strata says how consequential work is sanctioned, attributed, bounded and observed.",
    understood: "The thinking is sound, it is actionable inside twelve months, and I can see how the outputs were checked.",
    proof: [
      { href: "/ai", label: "The practice, in full" },
      { href: "/strata", label: "Strata" },
      { href: "/models/sdlc/whole-model-view", label: "Evidence on every level" },
    ],
  },
];

module.exports = { LONGVIEW_THESIS, LONGVIEW_THESIS_PARAGRAPHS, LONGVIEW_CLAIMS, LONGVIEW_ENTRIES };
