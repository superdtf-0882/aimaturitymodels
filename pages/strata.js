import { useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { STRATA } from "../lib/strataData";

// Issue #10: the Stratum model's own Latin/numbered names (S0-S7), not the
// plain-English translation the rest of this page used before. That's a
// deliberate reversal of an earlier design call (keep Stratum jargon off
// public pages) -- landed here because David asked for this exact model,
// with a reference image, as its own explainer of the pattern generally
// ("AI Coding Agents Need a Language Architecture"), not as an internal
// document. "Landed as" examples are kept generic -- no internal artifact
// IDs -- consistent with how EA OKF and Vellum are described elsewhere on
// this site. Data moved to lib/strataData.js (issue #15) so the AI-readable
// digest can consume the same source instead of a hand-kept-in-sync copy.

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
        AI coding agents need a disciplined conceptual world that defines
        what kinds of things may exist, where they belong, what intent
        they realize, and what authority allows them to act. Strata tells
        you where something belongs &mdash; but it doesn&rsquo;t stop
        there.
        Every real piece of work in this practice also has to answer a
        second question: what is it actually for? A decision, a rule, a
        piece of work &mdash; each one needs a clear, checkable link back
        to the specific reason it exists. Something missing that link
        isn&rsquo;t just incomplete: it doesn&rsquo;t count as real
        architecture, it&rsquo;s just a file sitting where architecture
        should be. Click any layer for what it actually governs.
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
                  &#8635; Feedback, not fiber. The fiber already runs
                  through every layer above &mdash; this loop is a
                  separate, additional act: what&rsquo;s learned here
                  returns to S0 so intent itself can be reconsidered, not
                  just whichever layer is most convenient.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="stratum-fiber-caption">
        The line running through the layers is the intent fiber &mdash;
        it doesn&rsquo;t stop at any one stratum, and nothing built here
        is real without it.
      </p>

      {/* Four checks, then act -- not three. The authority check was
          missing here until 2026-08-01, which made this line contradict
          both the page's own intro (which names all four) and
          SPEC-STRATA v2.3, ratified the same day: "a thing can be
          correctly typed, correctly placed, and correctly fibered to a
          real intent, and still not be actionable, because being
          well-formed is not the same as being authorized." The old
          wording put "act" in the fourth slot, which read as a
          three-step clearance rather than a four-part gate. */}
      <div className="layer-note stratum-principle">
        <strong>Type it. Locate it. Resolve what it&rsquo;s for. Check what authorizes it. Then act.</strong>
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
