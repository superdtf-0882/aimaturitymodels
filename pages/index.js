import Link from "next/link";
import Layout from "../components/Layout";
import { PRACTICE_HEADING, PRACTICE_LEAD } from "../lib/intros";
import { LONGVIEW_THESIS_PARAGRAPHS, LONGVIEW_CLAIMS, LONGVIEW_ENTRIES } from "../lib/longview";

// 2026-10-08, OKF-TOGAF#172 (126-DT2): the heading and opening line are the
// practice introduction's own first heading and paragraph, read from
// lib/intros.js -- the owner's words. The left-hand navigation keeps
// "AI-Native Maturity Models".
//
// 2026-10-10, OKF-TOGAF#173 (WP-LONGVIEW-01, 133-DT2): THE LONG VIEW replaces
// the thesis block below ("the electric-motor block is replaced", the owner's
// word). Its spine is the positioning thesis PT-001 2.0 and its claims, the
// owner's words; its six entries are CC's draft for his approval. All of it
// lives in lib/longview.js and is rendered as real text, so the AI-reader map,
// the sitemap and a reader with scripts off all get the whole of it. The
// record of the thesis block, which itself replaced the wheel, follows.

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
      <h1>{PRACTICE_HEADING}</h1>
      <p className="dek">{PRACTICE_LEAD}</p>

      <nav className="longview-sort" aria-label="Find your way in">
        <p className="longview-sort-lead">Find your way in</p>
        <ul>
          {LONGVIEW_ENTRIES.map((e) => (
            <li key={e.id}>
              <a href={"#" + e.id}>
                <span className="role">{e.role}</span>
                <span className="objective">{e.objective}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="longview-spine" aria-labelledby="spine-heading">
        <h2 id="spine-heading">The argument</h2>
        {LONGVIEW_THESIS_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p.join(" ")}</p>
        ))}
      </section>

      <section className="longview-entries" aria-label="By role">
        {LONGVIEW_ENTRIES.map((e) => (
          <article className="longview-entry" id={e.id} key={e.id}>
            <h3><span className="role">{e.role}</span>: {e.objective}</h3>
            <p className="opening">{e.opening}</p>
            <p>{e.body}</p>
            <ul className="proof">
              {e.proof.map((p) => (
                <li key={p.href}>
                  {/\.(txt|md)$/.test(p.href) ? <a href={p.href}>{p.label} →</a> : <Link href={p.href}>{p.label} →</Link>}
                </li>
              ))}
            </ul>
            <p className="understood"><span>You have understood it when you can say:</span>{e.understood}</p>
          </article>
        ))}
      </section>

      <section className="longview-claims" aria-labelledby="claims-heading">
        <h2 id="claims-heading">What the practice holds to</h2>
        <ul>
          {LONGVIEW_CLAIMS.map((c) => (
            <li key={c.id}>{c.title} <Link href={c.href}>{c.proof} →</Link></li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
