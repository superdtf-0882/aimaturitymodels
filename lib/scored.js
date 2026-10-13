// The practice, scored -- OKF-TOGAF#124 (OKF TOGAF briefs/2026-10-01-svm-tranche-3/
// 135-DT2 section 3.3, 287-CC). The record of score is MA-2026-10-13, accepted by
// the owner on 2026-10-13: three blind runs, reconciled, scored with
// SPEC-D6-SCORE-EA against the AI-Native EA Maturity Model at v1.1.2. The
// practice's records are private, so each sentence summarises the evidence in
// plain words and links to public proof only where it exists.
//
// THE WARRANT MARK, in the page's words: "measured" is a tool's output or a
// check anyone can rerun; "from outside" is evidence from someone outside the
// practice; "in our own words" is the practice's own record. The mark changes
// no score; it shows what each score is worth.
//
// THE READOUT is the one the site's own EA assessment wrote for these ten
// scores on 2026-10-13, kept whole: the site caches a readout for a day, so the
// page keeps its own copy rather than a link that would expire.
// Plain CommonJS so scripts/scored-page-self-test.js can load it.
"use strict";

const EA = {
  record: "MA-2026-10-13",
  scoredOn: "13 October 2026",
  modelVersion: "v1.1.2",
  modelHref: "https://github.com/superdtf-0882/ai-native-ea-maturity-model",
  assessmentHref: "/models/ea/assessment/#dim=d1&grades=d1-c,d2-b,d3-b,d4-b,d5-b,d6-c,d7-b,d8-b,d9-b,d10-a",
  dimensions: [
    { id: "D1", name: "Architecture process", score: "C", warrant: ["measured", "in our own words"],
      evidence: "Our architecture is kept as structured records that AI agents write under written charters, and every material change is reviewed and accepted by the owner before it lands.",
      proof: { label: "Strata, the ontology the records are built on", href: "/strata/" } },
    { id: "D2", name: "Architecture development", score: "B", warrant: ["measured"],
      evidence: "Every architecture record follows a strict schema that tools read and check; one index that people read is still kept partly by hand, which holds this at B.",
      proof: { label: "Vellum, the records rendered for reading", href: "/vellum/" } },
    { id: "D3", name: "Business linkage", score: "B", warrant: ["measured", "in our own words"],
      evidence: "Every piece of funded work names the product line it serves, and the ranking shows any that do not; nothing yet checks that work traces back to our stated intent." },
    { id: "D4", name: "Senior management involvement", score: "B", warrant: ["in our own words"],
      evidence: "The owner wrote the practice's founding intent and settles disputed terms by it; funded work does not yet link to that intent in a way a tool can check." },
    { id: "D5", name: "Operating unit participation", score: "B", warrant: ["measured", "in our own words"],
      evidence: "Both of our operating functions, market intelligence and this site, are described in their own leaders' words, one of them by reference to its own records." },
    { id: "D6", name: "Architecture communication", score: "C", warrant: ["from outside", "measured"],
      evidence: "The architecture can be browsed and asked about in plain language; an outside agent given only this site's address answered six questions about our models and framework correctly.",
      proof: { label: "the site's guide for AI readers", href: "/ai/" } },
    { id: "D7", name: "Governance and authority plane", score: "B", warrant: ["measured", "in our own words"],
      evidence: "Who may authorize each consequential action, and what it reaches, is written down, and most enforced boundaries were tested by trying them; one has only been read from its settings." },
    { id: "D8", name: "Strategic portfolio management", score: "B", warrant: ["measured"],
      evidence: "Work is priced and ranked on criteria fixed before any comparison, and initiatives from different functions are compared on the same terms.",
      proof: { label: "the Strategic Value Matrix, the method we rank with", href: "/models/prioritization/strategic-value-matrix/" } },
    { id: "D9", name: "Architecture governance", score: "B", warrant: ["measured", "in our own words"],
      evidence: "Every change to the architecture is checked against written standards before it is released; reviews are still commissioned rather than triggered by measured friction." },
    { id: "D10", name: "Shared language", score: "A", warrant: ["measured"],
      evidence: "We keep a governed vocabulary, but it does not yet separate customer, buyer and user, or give every term an owner and a stated exclusion." },
  ],
  readout: `# Executive Readout

## Executive Summary

This appears to be a mid-to-large enterprise that has made a deliberate move from traditional architecture documentation toward AI-assisted architecture operations, but is still in the controlled adoption phase rather than full agentic execution. The organization has invested in formal architecture process, executive sponsorship, capability mapping, governance structures, and AI-enabled access to architectural knowledge. That is a rational profile for an enterprise trying to learn safely before binding execution to machines.

The profile is not immature; it is uneven in a specific way. Architecture is becoming easier to generate and query, but the underlying artifact substrate and enterprise vocabulary are not yet strong enough to support broad automation with confidence.

## Investment Pattern

Investment is concentrated in architecture workflow and communication: the organization can use chartered agents to help maintain architectural intent (D1) and can expose architecture through natural-language interaction (D6). That suggests a priority on making architecture more usable, more current, and less dependent on scarce architects acting as translators.

Most other capabilities sit at a disciplined but manual level: business linkage, executive involvement, operating unit participation, authority mapping, portfolio management, and architecture governance are all structured, but not yet continuously enforced or dynamically optimized. This is economically rational. The enterprise has built the management scaffolding before attempting deep automation.

The main imbalance is that the architecture process is more advanced than the substrate it depends on. AI can assist and communicate, but the source material remains too document-centric. The shared language capability (D10) is also materially behind the rest of the profile.

## Strategic Strengths

The strongest strategic capability is executive-backed semantic discipline. Senior leaders are not treating architecture as an IT-only activity; they have endorsed business capability and function models and are willing to arbitrate meaning across the enterprise. That matters because agentic architecture cannot scale on technical tooling alone. It requires authority over meaning.

The second strength is accessibility. Stakeholders can query architecture rather than navigate static repositories or depend entirely on individual architects. This creates leverage: architecture becomes a service the organization can consume, not a specialist craft hidden behind review gates.

The third strength is portfolio and governance readiness. The organization has named decision rights, mapped authority boundaries, and uses capability structures to categorize investment. These are strong foundations for later automation, provided the vocabulary and substrate are made more reliable first.

## Emerging Constraints

The next bottleneck is not lack of AI adoption; it is semantic ambiguity in the enterprise’s working language. The formal architecture may contain defined capabilities and functions, but the broader organization still uses key terms inconsistently. That creates a hidden failure mode: agents can answer quickly, but not always against meanings that business, legal, finance, product, and operations share.

The second constraint is the gap between architecture process and architecture substrate. A mature process operating over document-centric artifacts will eventually hit a ceiling. As more users rely on AI-generated answers, the organization will need architecture as data, not merely well-structured documents. Otherwise, confidence will depend on human reconciliation.

Governance is also nearing an inflection point. Authority boundaries are defined, but enforcement remains manual. That is acceptable now, but as AI-assisted execution increases, manual review boards will become latency points unless selected controls become executable.

## Recommended Next Investments

The highest-value investment is a governed enterprise vocabulary that is active where work is authored, not merely documented. This matters now because every other AI-enabled capability depends on shared meaning. The expected value is reduced rework, fewer cross-functional misunderstandings, better legal and commercial precision, and more trustworthy AI responses. This should take precedence over deeper automation because automating ambiguous language would scale confusion.

The second investment should be converting the architecture substrate from structured documents into native, machine-readable architecture data. This matters because the organization is already using agents to maintain and communicate architecture; the underlying source of truth must now support that operating model. The value is faster impact analysis, more reliable lineage, less manual synchronization, and a foundation for execution-bound architecture. This is a better return than adding more review ceremonies or expanding AI pilots over the current substrate.

The third investment should be selective automation of authority and lineage checks for high-value change types. Do not automate all governance. Start where delay, risk, and volume are highest: funding approvals, major platform changes, AI workflow deployment, or capability-impacting initiatives. The value is faster throughput with clearer control. It should follow vocabulary and substrate work closely, because executable governance requires unambiguous terms and reliable architectural data.

## Areas That Should Remain Lightweight

It is rational to keep portfolio allocation, architecture governance, senior management involvement, and operating unit participation at their current disciplined-but-manual posture for now. Pushing these to continuous or real-time operation before the vocabulary and substrate mature would create cost without proportional control.

The organization should also avoid moving directly into telemetry-driven optimization or self-adjusting governance. Those capabilities would be premature. The current priority is not maximum maturity; it is making the foundations trustworthy enough that later automation can operate safely and economically.

No dimension is marked Pre-AI, so the question is not where to begin AI adoption. The question is where to prevent early adoption from outrunning its foundations.

## Closing Perspective

Overall, this profile is optimized for governed learning. The enterprise has moved beyond experimentation, but it is not yet ready for broad agentic execution at scale. The posture is sensible: build executive alignment, expose architecture through AI, then harden the language and substrate before automating authority and allocation.

The executive message is clear: invest next in meaning and machine-readable foundations, not in more AI features.

---

This Executive Readout provides an AI-assisted interpretation of the submitted assessment and is intended to support strategic discussion. It should be considered alongside organizational context, business objectives, and leadership priorities. If you would like to discuss these findings and develop an investment roadmap tailored to your organization, please contact David Facer.`,
};

module.exports = { EA };
