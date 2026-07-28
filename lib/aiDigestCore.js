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
const { STRATA } = require("./strataData");
const { EAOKF_INTRO, EAOKF_BODY_MARKDOWN } = require("./eaokfContent");

async function fetchRaw(path) {
  const res = await fetch(`${SDLC_RAW}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path} from SDLC repo: ${res.status}`);
  return res.text();
}

function strataMarkdown() {
  return STRATA.map((s) => `### ${s.code}. ${s.name} — ${s.gloss}\n\n${s.detail}`).join("\n\n");
}

async function buildDigest() {
  const [sharedLayer, fullModel] = await Promise.all([
    fetchRaw("shared_intelligence_layer.md"),
    fetchRaw("ai_native_sdlc_maturity_model.md"),
  ]);

  return `# AI-Native Maturity Models — AI-Readable Digest

This is a machine-readable digest of the AI-Native Maturity Model family, the Strata governance-layer model, and the Enterprise Architecture OKF schema they're built on — assembled for handing directly to an AI assistant. Generated at build time from the same canonical sources this site itself renders from; nothing here is hand-duplicated or summarized.

## Instructions for AI use

When applying this model:

1. Treat each dimension independently; do not infer one score from another.
2. Assign only Pre-AI, A, B, C, D, E, or Exempt with a valid constraint reference.
3. Score from demonstrated evidence, not stated aspiration or tool ownership.
4. Distinguish current-state evidence, scoring rationale, transition guidance, and verification criteria.
5. Recommend the next adjacent transition unless explicitly asked for a longer-range target state.
6. Preserve the cross-dimension boundaries defined in this digest.
7. Do not average Exempt dimensions into aggregate maturity.
8. Identify uncertainty and request missing evidence rather than inventing it.
9. Cite the model version used.

**What's included:** the AI-Native SDLC Maturity Model, complete — all 13 dimensions, A through E. D4–D13 carry explicit per-transition verification clauses (a practical test for whether the destination state was actually reached). D1–D3 carry transitions and Level E sustainment guidance, but not verification statements in that same per-transition form yet — a real asymmetry between the two halves of this model, not an omission from this digest. Also included: the Strata governance-layer model (S0–S7); the Enterprise Architecture OKF explainer.

**What's not included, and why:** the AI-Native PDLC and Product Prioritization Maturity Models don't have their own public repos yet — a deliberate, not-yet-satisfied gate in the practice that produces this family, not an oversight. This digest will grow to include them once they exist. The interactive self-assessment tool is deliberately excluded too — it's a scoring instrument for one organization's own use, not reference material to hand an AI.

**A note on internal references:** the canonical text below sometimes points to files not included in this digest — \`README.md\`, \`CHANGELOG.md\`, \`sdlc_handoff_diagram.png\`, superseded-text files, and briefs in a private governance corpus. These are provenance citations, useful to a human tracing a decision's history — not context this digest expects you to have. Treat any such reference as external provenance only: don't assume its contents, and don't treat its absence as a gap in what's handed to you here.

Canonical source: https://github.com/superdtf-0882/ai-native-sdlc-maturity-model (CC BY 4.0, © David Facer)

---

## AI-Native SDLC Maturity Model

${sharedLayer}

---

${fullModel}

---

## Strata — the governance-layer model (S0–S7)

AI coding agents need a language architecture — a disciplined conceptual world (what counts as intent, as a rule, as a record, as an authorization) that makes delegating real work to one safer, faster, and more reliable. The agent must classify before it acts.

${strataMarkdown()}

**S2/Normae, concretely:** the AI-Native SDLC Maturity Model above is itself an instance of this layer — an external standard this practice measures itself against, adopted rather than generated. TOGAF® is another. Recognizing that placement is exactly the discipline the instructions below ask of you for your own proposed work.

### Instructions for applying Strata (distinct from scoring the model above)

The instructions in this digest's opening section govern how to *score* the maturity model. These govern something else: how you should classify *your own* proposed or executed work before treating it as real.

10. Before proposing or executing any consequential undertaking, identify: its legal artifact or act type; its architectural stratum; the intent it realizes; the authority under which it may proceed.
11. Treat a missing, illegal, or unresolved type, stratum, intent reference, or authority as a construction failure — not as a field to infer silently.
12. Distinguish structural validity from semantic validity: resolution proves that an intent reference exists; human judgment determines whether the undertaking genuinely realizes that intent.

Why S0 and S7 connect: the feedback layer (S7) feeds back into Intent (S0), not into whichever layer is most convenient — observed facts continually refine the architecture.

---

## Enterprise Architecture OKF

${EAOKF_INTRO}

${EAOKF_BODY_MARKDOWN}
`;
}

module.exports = { buildDigest };
