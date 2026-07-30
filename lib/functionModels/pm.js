// Content transcribed directly from pm_function_model_inkscape.svg
// (David's own diagram, OKF TOGAF briefs/2026-07-28-function-model/) --
// the first of what will become a family of Function Models. This file
// is pure content; components/FunctionModel.js is the reusable renderer
// every future Function Model shares, per DS-014.
//
// Deliberately NOT a maturity model: flat and ontological ("what this
// function consists of"), no AI-nativity axis, no A-E progression.
// No corpus type registered for this content yet, per David's own
// stated discipline ("we create exactly what we need, and not more") --
// treated as market-tier content, same class as market/*.md.
//
// Plain CommonJS, not ESM export -- same reasoning as lib/aiDigestCore.js:
// this needs to run under both Next's webpack pipeline (pages/functionmodels/
// pm.js, which interops CJS fine) and the plain-node postbuild script
// (generate-llms-txt.js -> aiDigestCore.js -> this file), which cannot
// `import` an ESM module without extra tooling.

const pmFunctionModel = {
  slug: "pm",
  // Issue #30: why this page is a Function Model and not a process or
  // lifecycle diagram -- David's own text, verbatim. A generic block
  // shape (paragraph / list) so future Function Models can supply their
  // own explainer the same way, rather than a one-off string.
  explainer: {
    linkLabel: "What's a Function Model, really?",
    title: "Function, Process, and Lifecycle",
    blocks: [
      { type: "p", text: "Most experienced product executives can feel when product management is working and when it's fragmented. It can be difficult to articulate why. The usual answers reach for process maturity or tooling — which is an overcomplication." },
      { type: "p", text: "PMs are taught sprints, ceremonies, and cadences without knowing the layer beneath. They get the verbs without the nouns." },
      { type: "p", text: "The product management function can be represented at three levels, and each answers a different question:" },
      {
        type: "list",
        items: [
          { term: "Function model", text: "flat and structural. What must exist: inputs, activities, capabilities, outputs. No sequence, no arrows. A trigger presumes a time axis, and this layer has none." },
          { term: "Process", text: "a linear path through part of the function. The function model is the dictionary; a process is a sentence built from it." },
          { term: "Lifecycle", text: "the function projected onto time, derived from the processes that form the flywheel of a practice." },
        ],
      },
      { type: "p", text: "Most organizations struggle to adopt lifecycles before they understand the function." },
      { type: "p", text: "In short:" },
      {
        type: "list",
        items: [
          { term: "The function model", text: "is a flat, ontological form; what the function is and what it does." },
          { term: "Processes", text: "are linear renderings of portions of the function." },
          { term: "A lifecycle", text: "is an approximate rendering of the function in motion. That's what it looks like when it's running." },
        ],
      },
      { type: "p", text: "This page represents the first layer only. Nothing here is missing an arrow. Arrows belong to a different diagram, answering a different question." },
    ],
  },
  title: "Product Management Function Model",
  dek: [
    "Product management turns market, user, and business inputs into product decisions and outcomes.",
    "A governed system of activities, capabilities, and tools — this is a function model, not a process nor a lifecycle — inputs to outputs.",
  ],

  inputs: {
    items: [
      { title: "Organizational strategy" },
      { title: "Market targets" },
      { title: "Revenue requirements" },
    ],
    group: {
      title: "Market intelligence",
      items: ["Competitor data", "Buyer intelligence", "Customer/user insights", "Analyst insights"],
    },
  },

  functionLabel: "Product Management Function",

  activities: {
    caption: "What the PM does all day",
    items: [
      "Define Markets",
      "Requirements Management",
      "Prioritization & Tradeoffs",
      "Engineering Interface Cadence",
      "Executive Interface Cadence",
      "Organizational Evangelism",
      "Product Portfolio Alignment Cadence",
      "GTM Cadence",
      "Experimentation & Validation",
      "User/Customer/Analyst Meetings",
    ],
  },

  capabilities: {
    caption: "What the PM is good at",
    groups: [
      {
        title: "Market intimacy",
        items: ["Customer/Buyer Engagement", "User Intimacy", "Market/Analyst Engagement"],
        note: "Deep knowledge of markets, customers, users & analysts",
      },
      {
        title: "Persona generation",
        items: ["User Personas", "Buyer Personas", "Delivery & Support Personas"],
        note: "Structured archetypes for effective PDLC and key stakeholder groups",
      },
    ],
    singles: [
      { title: "Strategic Analysis", note: "Beat competitors — cheaper, faster, higher quality" },
      { title: "Requirements Articulation" },
      { title: "Executive Engagement", note: "Where authority over portfolio, prioritization, roadmap, pricing & scope is maintained" },
    ],
    pair: ["Pricing", "Market positioning"],
  },

  // Issue #33: Tools and the old Governance/Resources/Standards context
  // strip were always the same concept -- what the function runs on --
  // just rendered two different ways (a chip grid, a plain-text row).
  // Migrated into the one substrates shape Product Marketing's own
  // diagram already uses natively. No content added or removed, only
  // restructured -- same items, same note.
  substrates: [
    {
      title: "Tools",
      items: [
        "RMS / ALM / Engineering Collaboration Tools",
        "Document & Presentation Tools",
        "Design & UI Tools",
        "GTM & MarCom Tools",
        "Analytics & Outcomes & Market Measurement Tools",
      ],
    },
    {
      title: "Governance",
      items: ["Stage-gate reviews", "OKR cadence", "Compliance & risk review"],
    },
    {
      title: "Resources",
      items: ["PMs", "Designers", "Engineers", "Data analysts", "GTM stakeholders"],
      note: "Resources execute the function, but do not define it",
    },
    {
      title: "Standards",
      items: ["Agile / SAFe / dual-track discovery", "Data privacy", "Accessibility"],
    },
  ],

  outputs: [
    {
      key: "eng",
      title: "Engineering & delivery",
      caption: "What engineering needs to know what to build",
      items: ["Requirements", "Prioritization", "Release goals"],
    },
    {
      key: "gtm",
      title: "GTM & market-facing",
      caption: "What sales and the market need to price, position, and sell",
      items: ["Positioning & Pricing", "Market messaging", "Provisioning & Billing Plans", "Buyer Personas & Battlecards"],
    },
    {
      key: "ops",
      title: "Operations",
      caption: "What operations needs to keep customers happy and paying",
      items: ["Support materials & training", "User feedback mechanism"],
    },
    {
      key: "leadership",
      title: "Leadership & governance",
      caption: "What leadership needs for cadence, fiduciary duty & alignment",
      items: ["Product strategy", "Executive transparency"],
    },
  ],
};

module.exports = { pmFunctionModel };
