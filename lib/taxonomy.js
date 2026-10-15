// The AI Architecture Taxonomy -- OKF-TOGAF#189. What the taxonomy page
// renders: the one question, the families, the four tests, the card's nine
// fact lines, what each answer asks the visitor to decide, the twenty-nine
// worked examples, and the links on to an assessment. Plain CommonJS with no
// Node-only imports, so the page's browser bundle can carry it; the self-test
// requires it (scripts/taxonomy-self-test.js).
//
// The definitions are the fourth draft of 15 October 2026, the experts' copy,
// in its own words. What each family asks you to decide is the implication
// rule keyed to that answer in the taxonomy's draft rules. The examples and
// their families come from lib/taxonomy-examples.json, generated from the
// filed case cards and the author's sealed list; the families are the
// author's and no one else has checked them.
const DATA = require("./taxonomy-examples.json");

const VERSION = "Definitions: fourth draft, 15 October 2026";

const QUESTION = "Once the system is running, what decides the next piece of domain work?";

const DOMAIN_WORK =
  "Domain work is the work the system exists to do — pay a claim, answer a customer, change a file, ship a story. " +
  "It is not the technical steps inside one piece of work: fetching some documents, calling a model, formatting the reply. " +
  "Those three together are one piece of domain work, not three.";

const FAMILIES = [
  {
    key: "built-with",
    name: "Built with AI, runs without it",
    answer: "Nothing by AI. AI helped build or change the system; when it runs, no model is in the path of any decision.",
    means: "The system's operation is conventional; only its construction involved AI.",
    decide: {
      decision: "Its running is described the ordinary way. What it asks of you comes from how AI helped build it: decide whether AI-authored change carries a distinct review or attribution requirement.",
      evidence: "Change records showing authorship and review standing.",
    },
  },
  {
    key: "fixed-logic",
    name: "Fixed logic decides, AI supplies a value",
    answer: "Fixed logic. Code, rules, or a predefined sequence of steps decides what comes next; a model supplies a value inside it.",
    means: "The model produces a score, a label, an extraction, a draft; the logic branches on it or passes it on. One call or many stages, with or without people reviewing at stations along the way — the arrangement is the same.",
    decide: {
      decision: "The invocation boundary is a contract: define the accepted input, the acceptable output, and what the system does with an unacceptable one — fall back, refuse, retry. Where a predefined sequence runs, decide what an AI step may return that takes it off its path: nothing, an exception, a named branch.",
      evidence: "An invocation log with an outcome class (accepted, fallback, refused) over a sample period, and traces showing each AI step's output beside the transition taken.",
    },
  },
  {
    key: "user",
    name: "The user steers",
    answer: "The user. What the AI does next depends on what the person does next — their next message, keystroke, or choice.",
    means: "The AI interprets, suggests, drafts; the person's next move directs it; whatever gets committed, the person commits, outside the AI's hands.",
    decide: {
      decision: "Name the commitment point: where a recommendation or draft becomes an act, and who performs it.",
      evidence: "A sample of outputs traced to the commitment made, declined or altered.",
    },
  },
  {
    key: "ai-chooses",
    name: "The AI chooses its own next step",
    answer: "The AI. It chooses or revises its own next step — which tool, which action, whether to stop — toward a goal.",
    means: "Planning, tool choice and delegation are the AI's.",
    decide: {
      decision: "Treat plan revision as an event: decide whether a revised plan is recorded, surfaced, or must be seen before work continues. And keep what the AI is able to do apart from what it is authorized to do: unknown authority is recorded as unknown, never filled in from capability.",
      evidence: "For a sample of runs, the plan as first formed beside the work as done.",
    },
  },
  {
    key: "composite",
    name: "Composite",
    answer: "Different parts answer differently.",
    means: "Name the parts and classify each.",
  },
  {
    key: "none-of-these",
    name: "None of these",
    answer: "None of these fits — and say in one sentence why.",
    means: "A system that resists the question is a finding, not a mistake.",
  },
];

// The answers the intake offers: the six, and an honest "can't tell yet".
const ANSWERS = FAMILIES.map((f) => ({ key: f.key, name: f.name }))
  .concat([{ key: "unknown", name: "Can't tell yet" }]);

const UNKNOWN_DECIDE = {
  decision: "Find out what decides the next piece of domain work before anything else. The steps you marked AI are where to look.",
  evidence: "The system's own description, its code, or watching it run.",
};

const TESTS = [
  {
    title: "Is the user steering, or just reading the result?",
    text: "The user steers only if the user's choices during operation change what the AI does next. Someone who submits an input, waits, and reads the output is outside the system's boundary; the system itself is fixed-logic. A person reading a report the system produced does not make the system user-steered, however much the person then does with the report.",
  },
  {
    title: "When is a part a separate part?",
    text: "A part is classified separately only when both are true: it realises its own named capability, and it answers the one question differently from the rest. A second model call inside the same capability — a check, a grader, a second pass — is the same arrangement, not a composite. Composite means different jobs, differently arranged; not one job that calls a model twice.",
  },
  {
    title: "Advising and acting under one roof",
    text: "Apply the second test. If the advising and the acting serve different named capabilities, they are parts, and the whole is composite. If they serve one capability, classify that capability by who decides its next step.",
  },
  {
    title: "How much may you read into a word?",
    text: "A word counts only when it describes behaviour. “The agent plans its route” describes behaviour. “AI-powered”, “agent”, “intelligent”, “autonomous” on their own are labels and count for nothing.",
  },
];

// The card's nine fact lines, as the worked examples write them, each with a
// prompt for the visitor's own system.
const FACT_LINES = [
  { line: "What starts it", hint: "A request, a schedule, an event, a person pressing a button." },
  { line: "What the AI does", hint: "Reads, scores, drafts, answers, plans, acts." },
  { line: "What happens after each AI step", hint: "Code branches on it, a person looks, the AI picks its next step." },
  { line: "What waits for a person", hint: "Which steps stop until someone acts." },
  { line: "What doesn't wait", hint: "Which steps go ahead without anyone." },
  { line: "What it can reach", hint: "The systems, data and outside services it can read or change." },
  { line: "What it keeps", hint: "What it remembers between steps or sessions." },
  { line: "Evidence kept, and who reads it", hint: "Logs, records, ratings — and whether anyone reads them." },
  { line: "Where its knowledge comes from", hint: "Documents, databases, the web, its training." },
];

const EXAMPLES = DATA.examples;
const PROVENANCE = { families: DATA.provenance.families, verified: DATA.provenance.verified };

// The assessments, in the site's order, and the link that marks a start as
// coming from the taxonomy (lib/counts.js reads it).
const MODELS = [
  { slug: "ea", name: "AI-Native EA Maturity Assessment", for: "how the enterprise architects for AI" },
  { slug: "sdlc", name: "AI-Native SDLC Maturity Assessment", for: "how the system is built" },
  { slug: "pdlc", name: "AI-Native PDLC Maturity Assessment", for: "how the product is shaped and run" },
  { slug: "prioritization", name: "Portfolio Prioritization Maturity Assessment", for: "how work like it is chosen" },
];

function assessmentHref(slug) {
  return "/models/" + slug + "/assessment/?from=taxonomy";
}

function familyName(key) {
  const a = ANSWERS.find((x) => x.key === key);
  return a ? a.name : "";
}

function decideFor(key) {
  if (key === "unknown") return UNKNOWN_DECIDE;
  const f = FAMILIES.find((x) => x.key === key);
  return (f && f.decide) || null;
}

const clean = (s) => String(s || "").trim();

// Complete: a named system and an answer. None of these needs its sentence;
// composite needs at least two parts, each named and classified.
function intakeComplete(c) {
  if (!c || !clean(c.name) || !ANSWERS.some((a) => a.key === c.answer)) return false;
  if (c.answer === "none-of-these") return !!clean(c.reason);
  if (c.answer === "composite") {
    const parts = (c.parts || []).filter((p) => clean(p.name) || p.family);
    return parts.length >= 2 && parts.every((p) => clean(p.name) && FAMILIES.some((f) => f.key === p.family && f.decide));
  }
  return true;
}

// The card as Markdown, for the visitor to keep. Only what they typed, the
// question and the family's words; the steps are marked as the examples are.
function cardMarkdown(c) {
  const out = ["# " + (clean(c.name) || "Untitled system"), ""];
  if (clean(c.purpose)) out.push(clean(c.purpose), "");
  const steps = (c.steps || []).filter((s) => clean(s.text));
  if (steps.length) {
    out.push("## How it runs", "");
    steps.forEach((s, i) => {
      const mark = s.ai ? "**[AI]** " : clean(s.waits) ? "**[waits: " + clean(s.waits) + "]** " : "";
      out.push(i + 1 + ". " + mark + clean(s.text));
    });
    out.push("");
  }
  const facts = FACT_LINES.filter((f) => clean((c.facts || {})[f.line]));
  if (facts.length) {
    out.push("## Facts", "");
    facts.forEach((f) => out.push("- " + f.line + ": " + clean(c.facts[f.line])));
    out.push("");
  }
  out.push("## Its family", "", "> " + QUESTION, "");
  out.push("**" + (familyName(c.answer) || "Not answered") + "**");
  if (clean(c.reason)) out.push("", clean(c.reason));
  if (c.answer === "composite") {
    out.push("");
    (c.parts || []).filter((p) => clean(p.name)).forEach((p) => out.push("- " + clean(p.name) + ": " + familyName(p.family)));
  }
  const keys = c.answer === "composite" ? [...new Set((c.parts || []).map((p) => p.family).filter(Boolean))] : [c.answer];
  const asks = keys.map((k) => ({ k, d: decideFor(k) })).filter((x) => x.d);
  if (asks.length) {
    out.push("", "## What it asks you to decide", "");
    asks.forEach(({ k, d }) => {
      if (keys.length > 1) out.push("**" + familyName(k) + "**", "");
      out.push("- Decide: " + d.decision, "- Evidence: " + d.evidence, "");
    });
  }
  out.push("", "---", "AI Architecture Taxonomy, aimaturitymodels.com/taxonomy/ · " + VERSION);
  return out.join("\n") + "\n";
}

module.exports = {
  VERSION, QUESTION, DOMAIN_WORK, FAMILIES, ANSWERS, TESTS, FACT_LINES, EXAMPLES, PROVENANCE, MODELS,
  assessmentHref, familyName, decideFor, intakeComplete, cardMarkdown,
};
