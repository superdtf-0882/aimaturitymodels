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

export const pmFunctionModel = {
  slug: "pm",
  title: "Product Management Function Model",
  dek: [
    "Product management turns market, user, and business inputs into product decisions and outcomes.",
    "A governed system of activities, capabilities, and tools — this is a function model, not a process nor a lifecycle — inputs to outputs.",
  ],

  inputs: {
    simple: ["Organizational strategy", "Market targets", "Revenue requirements"],
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

  tools: {
    rows: [
      ["RMS / ALM / Engineering Collaboration Tools", "Document & Presentation Tools"],
      ["Design & UI Tools", "GTM & MarCom Tools"],
      ["Analytics & Outcomes & Market Measurement Tools"],
    ],
  },

  contextStrip: {
    governance: "Stage-gate reviews, OKR cadence, compliance & risk review",
    resources: {
      text: "PMs, designers, engineers, data analysts, GTM stakeholders",
      note: "Resources execute the function, but do not define it",
    },
    standards: "Agile / SAFe / dual-track discovery, data privacy, accessibility",
  },

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
