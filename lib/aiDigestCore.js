// Core builder for the AI-readable digest (issue #15: "Let's make the site
// readable to AI"). Deliberately plain CommonJS with no Next.js imports --
// this needs to run in two contexts that don't share a module system:
// pages/ai.js (via Next's webpack/babel pipeline, which interops CJS fine)
// and scripts/generate-llms-txt.js (a plain `node` postbuild script, which
// cannot `import` an ESM file without extra tooling). One function, both
// callers -- not two builders that could quietly diverge.
//
// Fetches from `main` (floating), not a pinned commit -- unlike the
// assessment set and Whole-Model View, this digest isn't a scored or
// cross-checked derivation with its own provenance citation to protect.
// Its only job is "hand over the current canonical model," so it should
// always reflect the latest content, the same reasoning short_form.yml
// and the deep-dives already fetch on.

const SDLC_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-sdlc-maturity-model/main";
const PDLC_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-pdlc-maturity-model/main";
const PRIORITIZATION_RAW = "https://raw.githubusercontent.com/superdtf-0882/ai-native-product-prioritization-maturity-model/main";
const { STRATA } = require("./strataData");
const { EAOKF_INTRO, EAOKF_BODY_MARKDOWN } = require("./eaokfContent");
const { pmFunctionModel } = require("./functionModels/pm");
const { productMarketingFunctionModel } = require("./functionModels/productMarketing");
const { softwareEngineeringFunctionModel } = require("./functionModels/softwareEngineering");
const { toMarkdown: functionModelMarkdown } = require("./functionModels/toMarkdown");

async function fetchRaw(base, path) {
  const res = await fetch(`${base}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path} from ${base}: ${res.status}`);
  return res.text();
}

function strataMarkdown() {
  return STRATA.map((s) => `### ${s.code}. ${s.name} — ${s.gloss}\n\n${s.detail}`).join("\n\n");
}

async function buildDigest() {
  const [sharedLayer, fullModel, pdlcModel, prioritizationModel] = await Promise.all([
    fetchRaw(SDLC_RAW, "shared_intelligence_layer.md"),
    fetchRaw(SDLC_RAW, "ai_native_sdlc_maturity_model.md"),
    fetchRaw(PDLC_RAW, "ai_native_pdlc_maturity_model.md"),
    fetchRaw(PRIORITIZATION_RAW, "ai_native_product_prioritization_maturity_model.md"),
  ]);

  return `# AI-Native Maturity Models — AI-Readable Digest

This is a machine-readable digest of the AI-Native Maturity Model family, the Strata governance-layer model, the Enterprise Architecture OKF schema they're built on, and the site's Function Models — assembled for handing directly to an AI assistant. Generated at build time from the same canonical sources this site itself renders from; nothing here is hand-duplicated or summarized.

## Instructions for AI use

This digest contains four distinct artifact classes, and the instructions differ by class. Identify which class an artifact belongs to before applying any instruction to it.

* **Maturity models** (SDLC, PDLC, Product Prioritization) — assessment instruments with A–E ladders. Instructions **M1–M11** apply.
* **Strata** (S0–S7) — a governance-layer model for classifying work. Instructions **S1–S4** apply.
* **Function models** (Product Management, Product Marketing, Software Engineering) — flat ontological maps. Instructions **F1–F5** apply.
* **Enterprise Architecture OKF** — the schema this family is written in. Reference context only: it is neither scored nor used to classify work, and none of the instruction sets below apply to it. Read it to understand the vocabulary the other three classes are described in.

Applying one class's instructions to another is a category error, not a judgment call. Function models in particular have no levels, no transitions, and no maturity axis; scoring one is invalid regardless of how the request is phrased.

### M — Scoring a maturity model

M1. Treat each dimension independently; do not infer one score from another.
M2. Assign only Pre-AI, A, B, C, D, E, or Exempt with a valid constraint reference.
M3. Score from demonstrated evidence, not stated aspiration or tool ownership.
M4. Use the destination level's own Verification clause as the evidence standard for that score. Where a dimension carries per-transition verification clauses, a level is not reached until its verification test is met in practice, not merely claimed. Where a dimension does not yet carry verification clauses in that form — D1–D3 in both SDLC and PDLC, inherited by reference from the Shared Intelligence Layer and owned by neither model — say so rather than substituting a verification test of your own construction. Where a model supplies **both** an Indicative evidence column and a Verification clause — the Product Prioritization model does; SDLC and PDLC do not — they answer different questions and are not interchangeable: indicative evidence is what you would expect to observe at a level and supports the level assignment; the verification clause is the test of whether the transition to it actually landed, and governs completeness. Do not score against the evidence column alone because it reads as a checklist.
M5. Dimension IDs are scoped to their own model and never transfer across models. The Product Prioritization model's D1–D3 (Value Model Coherence, Decision Governance & Portfolio Integration, Outcome Calibration & Adaptation) are entirely unrelated to the Shared Intelligence Layer's D1–D3 (Market discovery, Persona development, Positioning) inherited by SDLC and PDLC. Likewise SDLC's D12 (Instrumentation & observability) and PDLC's D12 (Feedback loop velocity) are different dimensions — PDLC's D12 corresponds in shape to SDLC's **D13**, not its D12. Always name the model alongside the dimension ID.
M6. Distinguish current-state evidence, scoring rationale, transition guidance, and verification criteria in your output.
M7. Recommend the next adjacent transition unless explicitly asked for a longer-range target state.
M8. Preserve the cross-dimension boundaries defined in this digest. Maturity in one dimension is never coverage of another's concern.
M9. Do not average, sum, or otherwise collapse any dimension — Exempt or A–E — into an aggregate maturity score. Each dimension is independently meaningful; a distribution count or modal level is fine, an arithmetic mean is not (OKF TOGAF corpus P-11).
M10. Identify uncertainty and request missing evidence rather than inventing it.
M11. Cite the model version used.

### S — Classifying work against Strata

These govern how you classify your own proposed or executed work before treating it as real — a different task from scoring the models above.

S1. Before proposing or executing any consequential undertaking, identify: its legal artifact or act type; its architectural stratum; the intent it realizes; the authority under which it may proceed.
S2. Treat a missing, illegal, or unresolved type, stratum, intent reference, or authority as a construction failure — not as a field to infer silently.
S3. Distinguish structural validity from semantic validity: resolution proves that an intent reference exists; human judgment determines whether the undertaking genuinely realizes that intent.
S4. A governed thing's type is formally: \`GovernedThing[S](i : Intent)\` — indexed by both its stratum and the intent it realizes. In compact notation: \`thing : LegalType @ LegalStratum realizes Intent\`. A thing missing a legal type is undefined; missing or illegal stratum, misplaced; missing or unresolved intent, ill-typed; missing authority, unactionable regardless of otherwise being well-formed.

### F — Reading a function model

F1. A function model is an ontological map, not an assessment instrument. It names what a function consists of — inputs, activities, capabilities, enabling substrates, outputs — independent of how well any organization performs it.
F2. Do not assign levels, scores, maturity readings, or A–E letters to any element of a function model. There is no maturity axis to place them on. If asked to assess maturity for a function that has a function model here but no corresponding maturity model, say that plainly rather than constructing a ladder.
F3. Function models have no sequence, flow, triggers, or arrows. Inputs and outputs are categories, not steps, and their order in the document carries no temporal meaning. A trigger presumes a time axis this layer does not have. If a question requires sequence, it is asking about a process or lifecycle, which is a different artifact not included in this digest.
F4. Use a function model to check completeness and placement: whether an organization's described function has named all its inputs, activities, capabilities, enabling substrates, and outputs, and where a described activity structurally belongs. Do not use it to judge execution quality.
F5. Respect the stated boundary notes. Where a function model declares what an adjacent function owns — Product Management retaining positioning, pricing, packaging, and release-goal authority; Sales owning commercial commitment; Software Engineering owning HOW rather than WHAT — do not reassign that ownership in analysis or recommendations.

**What's included:** all three live models in the AI-Native Maturity Model family. The **SDLC** model, complete — all 13 dimensions, A through E; D4–D13 carry explicit per-transition verification clauses, but D1–D3 (shared with PDLC) carry transitions and Level E sustainment guidance without verification statements in that same per-transition form yet — a real asymmetry between the two halves of this specific model, not an omission from this digest. The **PDLC** model — D4–D12 own content, complete with per-transition verification clauses throughout; D1–D3 inherited by reference from the same shared source SDLC uses. The **Product Prioritization** model — all 3 dimensions, complete with per-transition verification clauses throughout. Also included: the Strata governance-layer model (S0–S7); the Enterprise Architecture OKF explainer; the Function Models family (flat, ontological maps of what a function consists of — deliberately not maturity models, no AI-nativity axis or A-E progression), currently three entries: the Product Management, Product Marketing, and Software Engineering Function Models.

**What's not included, and why:** the interactive self-assessment tool is deliberately excluded — it's a scoring instrument for one organization's own use, not reference material to hand an AI. Formal scoring instruments now exist for all three models (SPEC-D6-SCORE for SDLC, plus SPEC-D6-SCORE-PDLC and SPEC-D6-SCORE-PRIORITIZATION, both added 2026-07-28) — but their own criteria text lives in a private governance corpus, not these public model repos, so it isn't included in this digest either. All three models can be formally blind-scored; the instruments themselves just aren't reference material handed to an AI here.

**A note on internal references:** the canonical text below sometimes points to files not included in this digest — \`README.md\`, \`CHANGELOG.md\`, \`sdlc_handoff_diagram.png\`, superseded-text files, and briefs in a private governance corpus. These are provenance citations, useful to a human tracing a decision's history — not context this digest expects you to have. Treat any such reference as external provenance only: don't assume its contents, and don't treat its absence as a gap in what's handed to you here.

Canonical sources: https://github.com/superdtf-0882/ai-native-sdlc-maturity-model, https://github.com/superdtf-0882/ai-native-pdlc-maturity-model, https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model (all CC BY 4.0, © David Facer)

---

## AI-Native SDLC Maturity Model

${sharedLayer}

---

${fullModel}

---

## AI-Native PDLC Maturity Model

${pdlcModel}

---

## AI-Native Product Prioritization Maturity Model

${prioritizationModel}

---

## Strata — the governance-layer model (S0–S7)

AI coding agents need a disciplined conceptual world that defines what kinds of things may exist, where they belong, what intent they realize, and what authority allows them to act. Type it, locate it, and resolve what it's for — before it acts, not after.

${strataMarkdown()}

**S2/Normae, concretely:** the AI-Native SDLC Maturity Model above is itself an instance of this layer — an external standard this practice measures itself against, adopted rather than generated. TOGAF® is another. Recognizing that placement is exactly the discipline instructions S1–S4 ask of you for your own proposed work.

**Fiber and feedback are different.** The intent fiber is not a loop — it is present throughout every valid descent from S0 to S7; a governed thing without a resolved intent reference is ill-typed at any stratum, not just at the ends. Feedback is a separate, additional claim: S7 (Observatio) returns findings to S0 (Intent) so that intent itself can be reconsidered — closing a loop the fiber's own presence doesn't by itself require. A stratum can carry the fiber correctly with no feedback event having happened yet; feedback, when it does happen, still has to carry its own resolved intent reference to be real, the same as everything else.

---

## Enterprise Architecture OKF

${EAOKF_INTRO}

${EAOKF_BODY_MARKDOWN}

---

## Function Models

Flat, ontological maps of what a function actually consists of — inputs, activities, capabilities, enabling substrates, and outputs. Unlike the maturity models above, a Function Model doesn't measure AI-nativity or progression; it names what the function is, independent of how well any organization currently does it. Three entries today; more are planned.

${functionModelMarkdown(pmFunctionModel)}

---

${functionModelMarkdown(productMarketingFunctionModel)}

---

${functionModelMarkdown(softwareEngineeringFunctionModel)}
`;
}

module.exports = { buildDigest };
