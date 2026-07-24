import { useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

// Issue #10: the Stratum model's own Latin/numbered names (S0-S7), not the
// plain-English translation the rest of this page used before. That's a
// deliberate reversal of an earlier design call (keep Stratum jargon off
// public pages) -- landed here because David asked for this exact model,
// with a reference image, as its own explainer of the pattern generally
// ("AI Coding Agents Need a Language Architecture"), not as an internal
// document. "Landed as" examples are kept generic -- no internal artifact
// IDs -- consistent with how EA OKF and Vellum are described elsewhere on
// this site.
const STRATA = [
  {
    code: "S0",
    name: "Intent",
    gloss: "Why the practice exists",
    detail:
      "The originating motivation for the practice — ineffable until it's actually elucidated. Not itself a governed artifact until then; everything below exists in service of it.",
  },
  {
    code: "S1",
    name: "Fundamentum",
    gloss: "Principles, constraints, and charters",
    detail:
      "The first governed expression of Intent — generated directly from it, not selected from outside. Principles and foundational constraints that rarely change, plus the charters defining what any AI colleague is authorized to do.",
  },
  {
    code: "S2",
    name: "Normae",
    gloss: "Adopted frameworks, standards, and maturity models",
    detail:
      "External standards and maturity models the practice measures itself against. Adopted, not generated — chosen in service of what Fundamentum already established, not the other way around.",
  },
  {
    code: "S3",
    name: "Vocabula",
    gloss: "Shared language: ontology, taxonomy, lexicon, semantics",
    detail:
      "The shared, precise language that makes a standard checkable and keeps the record consistent — schema, lexicon, and taxonomy, precise enough that an AI system can read it directly and a human still recognizes exactly what it's looking at.",
  },
  {
    code: "S4",
    name: "Corpus",
    gloss: "The governed record",
    detail:
      "The single governed archive. A location, not an authority by itself — an artifact can sit in the Corpus without automatically being in force. Everything else is evidence, not the record.",
  },
  {
    code: "S5",
    name: "Auctoritas",
    gloss: "Authorization, contracts, and briefs",
    detail:
      "The formal machinery by which work is actually sanctioned and handed off. Issuance is the constitutive act — the moment authorization becomes real, not just written down.",
  },
  {
    code: "S6",
    name: "Operationes",
    gloss: "Live systems, tools, and execution",
    detail:
      "The live systems, tools, and processes actually doing the work day to day. This is where the governed model above becomes something running, not just something described.",
  },
  {
    code: "S7",
    name: "Observatio",
    gloss: "Reports, gaps, results, feedback",
    detail:
      "The feedback layer. What operating the system actually teaches, returned back to sharpen Intent over time — this is where the loop closes, and why nothing above is ever really finished.",
  },
];

export default function Strata() {
  const [open, setOpen] = useState(() => new Set());
  const [loopActive, setLoopActive] = useState(false);

  function toggle(code) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <Layout title="Strata" crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Strata</>}>
      <h1>Strata</h1>
      <p className="stratum-kicker">S0&ndash;S7 Stratum Model</p>
      <p className="dek">
        AI coding agents need a language architecture. A disciplined
        conceptual world &mdash; what counts as intent, as a rule, as a
        record, as an authorization &mdash; is what makes delegating real
        work to one safer, faster, and more reliable. Click any layer for
        what it actually governs.
      </p>

      <div className="stratum-list">
        {STRATA.map((s, i) => {
          const isOpen = open.has(s.code);
          const isLinked = loopActive && (s.code === "S0" || s.code === "S7");
          return (
            <div key={s.code} className={`stratum-row${isLinked ? " linked" : ""}`}>
              <button
                type="button"
                className="stratum-header"
                aria-expanded={isOpen}
                aria-controls={`stratum-detail-${s.code}`}
                onClick={() => toggle(s.code)}
                onMouseEnter={() => s.code === "S7" && setLoopActive(true)}
                onMouseLeave={() => s.code === "S7" && setLoopActive(false)}
                onFocus={() => s.code === "S7" && setLoopActive(true)}
                onBlur={() => s.code === "S7" && setLoopActive(false)}
              >
                <span className="stratum-code">{s.code}</span>
                <span className="stratum-text">
                  <span className="stratum-name">{s.name}</span>
                  <span className="stratum-gloss">{s.gloss}</span>
                </span>
                <span className="stratum-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="stratum-detail" id={`stratum-detail-${s.code}`}>
                  {s.detail}
                </div>
              )}
              {s.code === "S7" && (
                <div className="stratum-loop-note">
                  &#8635; Feeds back into S0, not into whichever layer is
                  most convenient &mdash; observed facts continually refine
                  the architecture.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="layer-note stratum-principle">
        <strong>The agent must classify before it acts.</strong>
      </div>

      <p className="footnote" style={{ marginTop: 4 }}>
        Better models help. Better governed worlds compound.
      </p>

      <hr className="section-divider" />
      <h2>Why the models in this family connect</h2>
      <p>
        Market intelligence, buyer understanding, and competitive
        positioning aren&rsquo;t separate concerns invented independently
        by engineering and product teams &mdash; they&rsquo;re one shared
        layer at Normae, feeding into both delivery (the SDLC model) and
        product decisions (the PDLC model) because that&rsquo;s
        structurally where they belong. Feedback velocity shows up in more
        than one model for the same reason: every model in this family
        eventually has to answer how fast what it learns makes it back to
        Intent.
      </p>
    </Layout>
  );
}
