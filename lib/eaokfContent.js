// Shared source for the Enterprise Architecture OKF explainer -- consumed
// by pages/eaokf.js (rendered via marked) and lib/aiDigestCore.js (the
// AI-readable digest, issue #15). One markdown source, not a copy hand-kept
// in sync with the page's own JSX. Split into INTRO (styled as this site's
// ".dek" lede treatment on the page) and BODY (the H2 sections) so the page
// keeps that visual distinction; the digest just concatenates both.
const EAOKF_INTRO =
  "The governed schema every model in this family is written in — an Ontology, Lexicon, and Taxonomy for running a technology practice with the help of AI colleagues, precise enough that both a human and an AI system recognize exactly what they're looking at.";

const EAOKF_BODY_MARKDOWN = `## A corpus, not a wiki

At the center of it sits the Corpus: one official archive, not a loose collection of documents that happen to be true. Everything inside the Corpus is part of the governed record, but corpus membership alone does not place an artifact in force — authority arises through the applicable issuance or authorization mechanism (Auctoritas). Everything outside the Corpus — notes, drafts, working files — is evidence: useful, but not part of the governed record at all. That distinction is what keeps a growing body of decisions from quietly drifting out of sync with what a practice actually does.

## What it actually holds

A small number of entity kinds, kept cleanly separated: the Intent a practice exists to serve; Principles and Constraints that rarely change; named Standards the practice measures itself against (this is exactly where a maturity model like the ones in this family lives); Decision Records for choices already made, so they aren't re-litigated; Work Packages with a clear scope and owner; Authorizations — formal, constitutive acts by which a human owner sanctions specific work; the Systems and Operations doing the actual work day to day; and Observations, the feedback that sharpens Intent over time as those systems actually run.

## Where the models in this family stand

EA OKF is the schema this family is written in — not itself one of the models, the ground they all stand on. Each model is the actual product: a named Standard, expressed as structured, machine-readable governance rather than a one-off document, using exactly this schema underneath. [Strata](/strata) is the structure explaining how they relate to each other once they're in place.`;

module.exports = { EAOKF_INTRO, EAOKF_BODY_MARKDOWN };
