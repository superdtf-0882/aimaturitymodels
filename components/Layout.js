import Link from "next/link";
import Head from "next/head";

// DS-004 (breadcrumb + back-link), DS-005 (no new tabs, all Link-based),
// C-007 attribution pattern (portfolio-wide variant, DS-008b) applied to
// this domain's own identity rather than aisdlc's.

export default function Layout({ title, crumb, wide, children }) {
  return (
    <>
      <Head>
        <title>{title ? `${title} — AI-Native Maturity Models` : "AI-Native Maturity Models"}</title>
        <meta name="description" content="Capability models for understanding how AI-nativity changes software delivery, product management, and the enterprise itself." />
      </Head>
      <div className="shell">
        <aside className="rail">
          <p className="rail-title">
            <Link href="/">AI-Native Maturity Models</Link>
          </p>
          <nav>
            {/* Issue #36: dropped the "Explore"/"Function Models"/
                "Foundation" group labels and captions entirely -- David's
                own principle, applied consistently: "the content can
                state itself." Strata promoted to the same major tier as
                Models/Assessments/Function Models (no nav-secondary
                class); EA OKF and Vellum & Seminum now sit as minor
                items directly beneath Strata specifically, not under a
                separate abstract "Foundation" heading. */}
            <Link href="/models">AI-Native Maturity Models</Link>
            <Link href="/assessments">Maturity Model Assessments</Link>
            <Link href="/functionmodels">Function Models</Link>
            <Link href="/strata">Strata</Link>
            <Link href="/eaokf" className="nav-secondary">Enterprise Architecture OKF</Link>
            <Link href="/vellum" className="nav-secondary">Vellum &amp; Seminum</Link>
          </nav>
        </aside>
        <main className={`stage${wide ? " stage--wide" : ""}`}>
          {crumb && <p className="crumb">{crumb}</p>}
          {children}
        </main>
      </div>
      {/* Issue #15, corrected same day: this started as a left-rail
          "Foundation" link (David's own first call) but blended in --
          same small, muted style as its siblings, easy to miss scanning
          the rail. Moved to a fixed corner badge per his direct
          follow-up after live testing ("the placement needs to be
          upper-right ... it blends in"), matching his own original
          issue text. Removed from the rail entirely rather than kept
          in both places -- one discoverable entry point, not two. */}
      <Link href="/ai" className="ai-feed-badge" aria-label="Feed This to Your AI">
        <span className="ai-feed-badge-text">Feed This to Your AI</span>
      </Link>
      <a className="attribution" href="https://davidfacer.com">© 2026 David Facer</a>
    </>
  );
}
