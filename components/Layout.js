import Link from "next/link";
import Head from "next/head";

// DS-004 (breadcrumb + back-link), DS-005 (no new tabs, all Link-based),
// C-007 attribution pattern (portfolio-wide variant, DS-008b) applied to
// this domain's own identity rather than aisdlc's.

export default function Layout({ title, crumb, children }) {
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
            <p className="group-label">Family</p>
            <Link href="/">Family Map</Link>
            <p className="group-label">SDLC Model</p>
            <Link href="/models/sdlc/whole-model-view">Whole-Model View</Link>
            <Link href="/models/sdlc/narrative">Narrative (D13)</Link>
            <p className="group-label">Foundation</p>
            <Link href="/strata">Strata</Link>
          </nav>
        </aside>
        <main className="stage">
          {crumb && <p className="crumb">{crumb}</p>}
          {children}
        </main>
      </div>
      <a className="attribution" href="https://davidfacer.com">© 2026 David Facer</a>
    </>
  );
}
