// Content transcribed from David's Software Engineering Function Model
// diagram (issue #34, third entry in the Function Models family).
// Flat/structural fidelity over recreating the diagram's own visual
// styling, same discipline as the Product Marketing intake (issue #33).
//
// Plain CommonJS -- same reasoning as the other lib/functionModels/*.js
// content files.

const softwareEngineeringFunctionModel = {
  slug: "software-engineering",
  title: "Software Engineering Function Model",
  dek: [
    "Transforms approved requirements into reliable, secure, maintainable software that delivers value in production.",
  ],

  inputs: {
    items: [
      { title: "Approved Requirements", description: "Epics, features, stories, acceptance criteria, non-functional requirements." },
      { title: "Architecture & Design", description: "Solution architecture, design standards, interface contracts, technical constraints." },
      { title: "Product & Technical Context", description: "Product roadmap, priorities, market context, usage data, operational context." },
      { title: "Quality & Security Requirements", description: "Quality goals, test strategy, security & compliance requirements, risk appetite." },
      { title: "Data & Integration Contracts", description: "Data models, schemas, API contracts, event models, integration requirements." },
      { title: "Platform & Infrastructure", description: "Platform capabilities, environments, cloud services, network & infrastructure standards." },
      { title: "Operational & Support Input", description: "Monitoring data, incident reports, support tickets, postmortems, capacity data." },
      { title: "Governance & Compliance", description: "Policies, regulatory requirements, audit obligations, legal constraints." },
    ],
  },

  functionLabel: "Software Engineering Function",
  functionStatement: "Software Engineering delivers reliable, secure, maintainable software that meets requirements, performs in production, and can evolve.",

  activities: {
    caption: "What we repeatedly do",
    items: [
      { title: "Plan & Decompose Work", description: "Break down work; estimate; plan iterations; manage dependencies and commitments." },
      { title: "Design Solutions", description: "Create technical designs; define components, APIs, data models, and interfaces." },
      { title: "Develop Code", description: "Write clean, efficient, secure code; follow standards and coding conventions." },
      { title: "Build & Verify", description: "Compile, lint, unit test; static analysis; quality gates in CI." },
      { title: "Test & Validate", description: "Automated tests, integration tests, performance tests, security tests." },
      { title: "Integrate & Merge", description: "Code reviews; integrate changes; resolve conflicts; maintain mainline health." },
      { title: "Deploy & Release", description: "Deploy to environments; blue/green, canary, or feature flags; release to production." },
      { title: "Operate & Improve", description: "Monitor health; respond to incidents; optimize performance and reliability." },
      { title: "Refactor & Evolve", description: "Improve code quality; reduce technical debt; modernize; continuous improvement." },
    ],
  },

  capabilities: {
    caption: "What we must be good at",
    groups: [],
    singles: [
      { title: "Software Design", note: "Craft modular, scalable, maintainable, and extensible solutions." },
      { title: "Security Engineering", note: "Build secure by design; threat modeling; secure coding; vulnerability management." },
      { title: "Coding Excellence", note: "Write high-quality code; standards; readability; simplicity; reusability." },
      { title: "Test Engineering", note: "Test strategy; automation; test data; coverage; quality engineering." },
      { title: "Integration Engineering", note: "APIs, events, services; dependencies; contract management." },
      { title: "DevOps Engineering", note: "CI/CD; environments; infrastructure as code; automation." },
      { title: "Data Engineering", note: "Data modeling; migrations; data quality; performance; data access." },
      { title: "Observability Engineering", note: "Logging, metrics, tracing, dashboards, alerts." },
      { title: "Performance Engineering", note: "Performance testing; profiling; tuning; capacity planning." },
      { title: "Reliability Engineering", note: "SLOs; resilience; chaos testing; capacity; error budgets." },
      { title: "Collaborative Engineering", note: "Cross-functional teamwork; pairing; code reviews; knowledge sharing." },
      { title: "Engineering Practices", note: "Standards; architecture governance; documentation; continuous learning." },
    ],
    pair: [],
  },

  substrates: [
    {
      title: "People & Resources",
      items: ["Software engineers", "Tech leads & architects", "QA engineers", "Security engineers", "DevOps / SRE engineers", "Data & integration engineers"],
    },
    {
      title: "Tools & Technology",
      items: ["IDEs & coding tools", "Build, test & analysis tools", "CI/CD & deployment tools", "Artifact repositories", "Observability & monitoring tools", "Collaboration tools"],
    },
    {
      title: "Platforms & Infrastructure",
      items: ["Cloud environments", "Runtimes & middleware", "Databases & storage", "Network & security services", "Kubernetes / containers", "Developer platforms"],
    },
    {
      title: "Standards & Definitions",
      items: ["Coding standards", "Architecture patterns", "API & data standards", "Environment standards", "CI/CD pipeline standards", "Naming & branching standards"],
    },
  ],

  outputs: [
    {
      key: "product-mgmt",
      title: "To Product Management",
      items: ["Working software increments", "Technical feasibility & estimates", "Risks, constraints & trade-offs", "Technical insights & options"],
    },
    {
      key: "gtm",
      title: "To GTM (Sales & Marketing)",
      items: ["Product capabilities", "Demos & sandbox access", "Integration samples & docs", "Release notes & materials"],
    },
    {
      key: "ops",
      title: "To Operations & Support",
      items: ["Deployed, monitored systems", "Runbooks & operational docs", "Incident response support", "RCA & remediation"],
    },
    {
      key: "leadership",
      title: "To Leadership",
      items: ["Delivery commitments", "Progress & metrics", "Risk & issue reports", "Investment needs"],
    },
    {
      key: "security-compliance",
      title: "To Security & Compliance",
      items: ["Secure software", "Compliance evidence", "Vulnerability reports", "Audit artifacts"],
    },
    {
      key: "data-platform",
      title: "To Data & Platform Teams",
      items: ["Data schemas & migrations", "APIs & service contracts", "Integration components", "Platform feedback"],
    },
  ],

  boundaryNote: {
    title: "Key Boundaries",
    items: [
      "Product Management defines WHAT and WHY. Software Engineering owns HOW.",
      "Engineering builds within approved requirements, architecture, standards, and constraints.",
      "We do not choose features, set priorities, or make market commitments.",
      "We partner across functions; we do not own their outcomes.",
    ],
  },
};

module.exports = { softwareEngineeringFunctionModel };
