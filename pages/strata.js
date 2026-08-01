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
      <p className="stratum-kicker">S0&ndash;S7 Governed-World Model</p>
      <p className="dek">
        <strong>Strata defines what makes something real in a governed
        practice.</strong> A document, decision, standard, authorization,
        system, or act doesn&rsquo;t become architecture merely because
        someone created it or stored it in the right place.
      </p>

      <div className="layer-note">
        <p style={{ marginTop: 0 }}>A governed thing must answer four questions:</p>
        <ol className="stratum-questions">
          <li><strong>What kind of thing is it?</strong></li>
          <li><strong>Where does that kind of thing belong?</strong></li>
          <li><strong>What Intent does it realize?</strong></li>
          <li><strong>What authority allows it to act?</strong></li>
        </ol>
        <p className="stratum-failures">
          A thing with no legal type is <strong>undefined</strong>. A
          thing at an illegal stratum is <strong>misplaced</strong>. A
          thing with no resolved Intent is <strong>ill-typed</strong>. A
          thing without required authority is{" "}
          <strong>unactionable</strong>.
        </p>
      </div>

      <h2>Why this matters</h2>
      <p>
        AI makes explicit a problem architecture has always had. Humans
        tolerate ambiguity for a surprisingly long time &mdash; we infer
        what a document probably means, remember who approved something,
        know which copy is current, and recognize from context whether a
        policy is actually in force. Agents can&rsquo;t safely operate on
        those assumptions.
      </p>
      <p>
        So a governed AI-enabled practice needs more than documents and
        repositories. It needs a world where the kinds of things that may
        exist, where they belong, the Intent they realize, and the
        authority under which they may act are explicit enough to inspect
        and check. Strata supplies that structure.
      </p>
      <p>
        It is not a workflow, and S0&ndash;S7 is not a sequence of steps.
        The strata identify different kinds of architectural reality.
        Click any layer for what it actually governs.
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

      <hr className="section-divider" />
      <h2>Intent is the fiber</h2>
      <p>
        The fiber is not a workflow arrow from S0 down to S7. It is a
        structural condition present in every valid governed thing. A
        Standard at S2 must realize Intent. A vocabulary definition at S3
        must realize Intent. A work package or authorization must realize
        Intent. A running system at S6 must realize Intent. An
        observation at S7 must realize Intent.
      </p>
      <p>
        Every governed thing is indexed twice over: by where it belongs,
        and by what it exists to realize. A resolved Intent reference
        proves that an Intent exists &mdash; whether the thing genuinely
        realizes that Intent remains a matter of human judgment.
      </p>

      <h2>Feedback is not the fiber</h2>
      <p>
        These are different structures. <strong>Fiber is
        structural</strong>: Intent is present throughout every valid
        stratum. <strong>Feedback is dynamic</strong>: Observatio may
        return evidence to Intent so that Intent itself can be
        reconsidered. A system can be correctly typed and connected to
        Intent without a feedback event having occurred.
      </p>
      <p>
        And when feedback does occur, it doesn&rsquo;t bypass the
        governed world. An observation that challenges Intent still needs
        its own valid type, placement, Intent reference, and authority
        path. Feedback doesn&rsquo;t mean &ldquo;change whatever layer is
        convenient&rdquo; &mdash; it means reality has produced evidence
        strong enough to reopen a governed question.
      </p>

      <h2>Authority crosses the strata</h2>
      <p>
        Auctoritas is a stratum, but authority is not confined to S5. S5
        holds the formal machinery through which authority is
        established, delegated, constrained, or issued; the resulting
        authority governs consequential acts elsewhere. An S6 deployment
        needs authority. An S2 adoption needs authority. A change to S1
        principles needs authority. Retiring a governed artifact needs
        authority.
      </p>
      <p>
        So for consequential work the question is never only{" "}
        <em>is this thing structurally valid?</em> It is also{" "}
        <em>is anyone authorized to make it real?</em>
      </p>
      <p>
        An undertaking is <strong>consequential</strong> when treating it
        as real would create, change, approve, commit, deploy, publish,
        allocate, bind, or retire a governed thing &mdash; or otherwise
        exercise authority. Analysis, explanation, and hypothetical
        drafting are not consequential merely because their subject is
        important. Thinking about a contract is not issuing one.
        Describing a deployment is not deploying. Writing
        &ldquo;approved&rdquo; into a document is not approval.
      </p>

      <h2>Structural validity and semantic validity</h2>
      <p>
        Strata distinguishes two kinds of correctness.{" "}
        <strong>Structural validity</strong> asks whether the thing can
        be resolved: is its type legal, is its stratum legal for that
        type, does its Intent reference resolve, is the necessary
        authority present? Those can increasingly be checked
        mechanically.
      </p>
      <p>
        <strong>Semantic validity</strong> asks whether the thing
        actually realizes the Intent it claims to serve. That remains a
        judgment. A perfectly typed initiative can still be
        strategically foolish; a valid Standard can still be the wrong
        Standard; a properly issued authorization can still authorize a
        bad decision. Strata makes the structure inspectable. It does not
        automate judgment out of architecture.
      </p>

      <h2>A worked example</h2>
      <p>
        Consider an adopted maturity model. The model itself is a
        Standard at <strong>S2 / Normae</strong>. Its canonical
        representation may be stored in <strong>S4 / Corpus</strong>{" "}
        &mdash; but storing it there doesn&rsquo;t put it in force. Its
        adoption occurs through <strong>S5 / Auctoritas</strong>. Its
        actual use in assessment happens at{" "}
        <strong>S6 / Operationes</strong>. The findings that use produces
        become <strong>S7 / Observatio</strong>, and those findings may
        improve how the practice operates, change how the Standard is
        used, cause the Standard itself to be reconsidered &mdash; or, in
        a sufficiently important case, reveal that the underlying Intent
        needs revisiting.
      </p>
      <p>
        Throughout that movement the artifacts don&rsquo;t become
        interchangeable. A Standard is still a Standard. An authorization
        is still an authorization. An observation is still an
        observation. Each remains valid only insofar as it can resolve
        what it exists to realize.
      </p>

      {/* Four checks, then act -- not three. The authority check was
          missing here until 2026-08-01, which made this line contradict
          both the page's own intro (which names all four) and
          SPEC-STRATA v2.3, ratified the same day: "a thing can be
          correctly typed, correctly placed, and correctly fibered to a
          real intent, and still not be actionable, because being
          well-formed is not the same as being authorized." The old
          wording put "act" in the fourth slot, which read as a
          three-step clearance rather than a four-part gate.
          David's candidate redraft (OKF-TOGAF#43) carried two different
          versions of this line -- "Establish its authority" in its
          opening, "Check what authorizes it" in its closing. Using the
          latter consistently: it matches what already shipped live and
          the candidate's own final statement. */}
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
