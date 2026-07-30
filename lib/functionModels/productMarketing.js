// Content transcribed from David's Product Marketing Function Model
// diagram (issue #33, second entry in the Function Models family).
// Flat/structural fidelity over recreating the diagram's own visual
// styling (per-item icons, per-category colors) -- David's own
// instruction: "I'm not interested in the cute presentation as much as
// I want the flat model." No boundary-note or function-statement
// equivalent exists for the Product Management model, since its own
// source never stated one -- left absent there rather than invented.
//
// Plain CommonJS -- same reasoning as lib/functionModels/pm.js.

const productMarketingFunctionModel = {
  slug: "product-marketing",
  title: "Product Marketing Function Model",
  dek: [
    "A bounded corollary to the Product Management function — focused on market translation, launch communication, and field enablement.",
  ],

  inputs: {
    items: [
      {
        title: "Product Management Direction",
        description: "Product strategy, roadmap, release intent, requirements context, positioning, pricing & packaging guidance.",
      },
      {
        title: "Market & Buyer Context",
        description: "Target segments, buyer personas, use cases, market context.",
      },
      {
        title: "Competitive & Commercial Evidence",
        description: "Objections, win/loss patterns, competitor moves, sales feedback, market reactions.",
      },
      {
        title: "Customer Evidence",
        description: "Adoption themes, support issues, customer questions, expansion signals.",
      },
      {
        title: "Governance & Constraints",
        description: "Brand, legal, claims, messaging standards.",
      },
    ],
  },

  functionLabel: "Product Marketing Function",
  functionStatement: "Product Marketing governs product meaning at the enterprise boundary.",

  activities: {
    caption: "What we repeatedly do",
    items: [
      "Interpret Product for the Market",
      "Translate Positioning into Messaging",
      "Create Product Narratives, Proof & Launch Assets",
      "Equip Sales, Partners & Customer Success",
      "Coordinate Market Introduction & Launch Readiness",
      "Monitor Market Response & Feed Back to Product Management",
    ],
  },

  capabilities: {
    caption: "What we must be good at",
    groups: [],
    singles: [
      { title: "Messaging Architecture" },
      { title: "Sales & Partner Enablement" },
      { title: "Launch Communication" },
      { title: "Product Content & Proof Strategy" },
      { title: "Customer Adoption Communication" },
      { title: "Market-Response Learning" },
    ],
    pair: [],
  },

  substrates: [
    {
      title: "People & Resources",
      items: ["Skilled product marketers", "Cross-functional partners", "Advisory network", "Adequate capacity"],
    },
    {
      title: "Tools & Data",
      items: ["Market intelligence", "Content & asset tools", "Analytics & listening", "CRM & usage data"],
    },
    {
      title: "Governance",
      items: ["Decision rights", "Review & approval", "Feedback loops", "Compliance guardrails"],
    },
    {
      title: "Standards & Definitions",
      items: ["Messaging framework", "Asset taxonomy", "Launch checklist", "Success metrics"],
    },
  ],

  outputs: [
    {
      key: "demand-gen",
      title: "To Demand Generation",
      items: ["Campaign inputs", "Launch themes", "Messaging assets", "Product proof"],
    },
    {
      key: "sales-partners",
      title: "To Sales & Partners",
      items: ["Battlecards", "Objection handling", "Product decks", "Enablement materials"],
    },
    {
      key: "customer-success",
      title: "To Customer Success",
      items: ["Release communications", "Adoption assets", "Customer education materials"],
    },
    {
      key: "product-mgmt",
      title: "To Product Management",
      items: ["Message resonance", "Objection patterns", "Adoption barriers", "Unmet needs"],
    },
    {
      key: "leadership",
      title: "To Leadership",
      items: ["Launch readiness", "Market pulse", "Product-market narrative"],
    },
  ],

  boundaryNote: {
    title: "Boundary Note",
    items: [
      "Product Management retains positioning, pricing, packaging, and release-goal authority.",
      "Product Marketing translates and operationalizes that guidance for the market and the field.",
      "Sales owns commercial commitment.",
      "Customer Success owns realized customer outcomes.",
    ],
  },
};

module.exports = { productMarketingFunctionModel };
