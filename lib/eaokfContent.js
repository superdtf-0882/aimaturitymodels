// Shared source for the Enterprise Architecture OKF explainer -- consumed
// by pages/eaokf.js (rendered via marked) and lib/aiDigestCore.js (the
// AI-readable digest, issue #15). One markdown source, not a copy hand-kept
// in sync with the page's own JSX. Split into INTRO (styled as this site's
// ".dek" lede treatment on the page) and BODY (the H2 sections) so the page
// keeps that visual distinction; the digest just concatenates both.
// The opening is the owner's introduction's EA OKF paragraph, word for word
// (lib/intros.js), on "The EA OKF page as 160-CC option B -- David Facer
// 10/8/2026", OKF-TOGAF#158. scripts/eaokf-wording-self-test.js fails the
// build if the two drift apart.
const EAOKF_INTRO =
  "The machine-readable representation contract for the architecture corpus. Structured YAML headers encode artifact identity, type, relationships, governance, and other architectural metadata, allowing agents to build an in-memory graph, traverse it to determine relevant context, and load Markdown bodies only when needed. Corpus artifacts are Markdown documents carrying EA OKF headers.";

const EAOKF_BODY_MARKDOWN = `## A corpus, not a wiki

At the center of it sits the Corpus: one official archive, not a loose collection of documents that happen to be true. Everything inside the Corpus is part of the governed record, but corpus membership alone does not place an artifact in force — authority arises through the applicable issuance or authorization mechanism (Auctoritas). Everything outside the Corpus — notes, drafts, working files — is evidence: useful, but not part of the governed record at all. That distinction is what keeps a growing body of decisions from quietly drifting out of sync with what a practice actually does.

## What it actually holds

A small number of entity kinds, kept cleanly separated: the Intent a practice exists to serve; Principles and Constraints that rarely change; named Standards the practice measures itself against (this is exactly where a maturity model like the ones in this family lives); Decision Records for choices already made, so they aren't re-litigated; Work Packages with a clear scope and owner; Authorizations — formal, constitutive acts by which a human owner sanctions specific work; the Systems and Operations doing the actual work day to day; and Observations, the feedback that sharpens Intent over time as those systems actually run.

## Where the models in this family stand

EA OKF represents and connects the architecture; it is not the architecture itself, and not one of the models. Each model is the actual product: a named Standard, expressed as structured, machine-readable governance rather than a one-off document. [Strata](/strata) is the structure explaining how they relate to each other once they're in place.`;

module.exports = { EAOKF_INTRO, EAOKF_BODY_MARKDOWN };
