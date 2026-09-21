import Link from "next/link";
import Layout from "../components/Layout";

// THE WHEEL IS RETIRED (2026-09-21). It was five entry points on a
// drag-spun circle (issues #9, #31, #37). What retired it is not taste:
// its five destinations -- /models, /assessments, /functionmodels,
// /strata, /eaokf -- were a STRICT SUBSET of the six in the rail nav
// beside it (components/Layout.js, which also carries /vellum). Measured
// on the served page, not just in this source: wheel-minus-rail is the
// empty set. So the page's most valuable space reached strictly fewer
// destinations than the navigation next to it, while spending a drag
// handler, a 500ms arrival spin and a session key to do it -- and its own
// copy had to explain itself ("Click and drag the wheel to spin it").
//
// WHAT REPLACES IT is the argument the family exists to make. Every word
// of the copy below is David's own, carried verbatim from the prototype
// he authored 2026-09-18 (71,417 chars, 21:29). CC changed no word of it.
// The prototype's links were absolute https://aimaturitymodels.com/ URLs
// -- an artifact of saving a page from a browser, not a design choice --
// and are Next <Link> hrefs here. That is a transport fix, not an edit.
//
// GOVERNED RECORD: OKF TOGAF, briefs/2026-09-19-capture-and-admission/
// 24-DT2 section 1. Recorded under STD-SVM-01 as a DATED GATE -- "expires
// 2026-09-21, act regardless of rank" -- and deliberately NOT scored to
// the top of the Strategic Value Matrix: a deadline is not value, and
// bending a merit cell to encode a schedule is the unnatural act R3
// exists to prevent. Urgency got its own channel instead.
//
// DELETED DELIBERATELY RATHER THAN ORPHANED, because the wheel was this
// page's only interactive element and its parts outlive it silently:
// DRAG_SENSITIVITY, CLICK_MOVE_THRESHOLD_PX, BASE_ANGLES, the ring path,
// SPIN_DURATION_MS, the `aimm-hub-spun` sessionStorage key and its
// prefers-reduced-motion guard, all five pointer handlers, and the
// .hub-* rules in styles/globals.css. This file no longer needs useState,
// useRef, useEffect, useRouter or the NODES table, and is now static.

export default function Home() {
  return (
    <Layout title="Home">
      <h1>AI-Native Maturity Models</h1>
      <p className="dek">
        A family of models, assessments, and governance artifacts for
        understanding and building AI-native practice.
      </p>

      <section className="thesis" aria-labelledby="thesis-heading">
        <h2 className="question" id="thesis-heading">
          What do the electric motor, the spreadsheet, and the shipping
          container have in common?
        </h2>

        <div className="answer">
          <p className="history">
            Each delivered modest gains when inserted into existing
            operations. Massive gains were available to organizations that
            could redesign their processes, capabilities, and structures
            around them.
          </p>
          <p className="claim">
            <span className="opportunity">AI presents the same opportunity.</span>{" "}
            Local augmentation can improve individual tasks. System-level
            returns require the system itself to change.
          </p>
        </div>

        <div className="definition">
          <div>
            <strong>AI-enabled</strong>
            <p>
              AI is added to work designed around existing organizational
              constraints.
            </p>
          </div>
          <div>
            <strong>AI-native</strong>
            <p>
              Work, context, authority, and feedback are redesigned around
              what people and AI can do together.
            </p>
          </div>
        </div>

        <p className="system-note">
          This site contains the <Link href="/models">maturity models</Link>,{" "}
          <Link href="/assessments">assessments</Link>,{" "}
          <Link href="/functionmodels">function models</Link>, and{" "}
          <Link href="/strata">governance structure</Link> for making that
          redesign explicit and assessable.
        </p>
      </section>
    </Layout>
  );
}
