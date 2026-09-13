import Link from "next/link";
import Layout from "../../components/Layout";

export default function ModelsIndex() {
  return (
    <Layout
      title="The Family"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / AI-Native Maturity Models</>}
    >
      <h1>AI-Native Maturity Models</h1>
      <p className="dek">
        Capability models for understanding how AI-nativity changes software
        delivery, product management, and the enterprise itself. These models
        don&rsquo;t ask how much AI an organization uses &mdash; they ask what
        its operating systems are actually capable of doing, and what
        realistically adjacent capability comes next.
      </p>

      <div className="model-list">
        <Link href="/models/sdlc/whole-model-view" className="model-row">
          <div>
            <div className="model-name">AI-Native SDLC Maturity Model</div>
            <div className="model-desc">
              How specification becomes generated code, governed delivery, and
              production evidence.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
        <Link href="/models/pdlc/whole-model-view" className="model-row">
          <div>
            <div className="model-name">AI-Native PDLC Maturity Model</div>
            <div className="model-desc">
              How market intelligence becomes product definition, prioritized
              investment, and closed-loop calibration.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
        <Link href="/models/prioritization/whole-model-view" className="model-row">
          <div>
            <div className="model-name">Product Prioritization Maturity Model</div>
            <div className="model-desc">
              How organizations move from personal advocacy to coherent,
              governed portfolio decisions.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
        <div className="model-row">
          <div>
            <div className="model-name">Product Marketing Lifecycle Maturity Model</div>
            <div className="model-desc">
              How positioning, messaging, and go-to-market discipline mature
              alongside the product itself.
            </div>
          </div>
          <span className="pill coming">Coming</span>
        </div>
        <Link href="/models/ea/whole-model-view" className="model-row">
          <div>
            <div className="model-name">AI-Native EA Maturity Model</div>
            <div className="model-desc">
              How enterprise architecture itself adapts to a practice where
              governed cognition isn&rsquo;t exclusively human.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
      </div>
      {/* OKF-TOGAF#131. This sentence described hover-then-click, from before
          move 2 (2026-09-11) replaced it with the always-open rail -- so it
          contradicted all four pages it describes, each of which says "Select
          a cell to read it — click, or use the arrow keys. The detail is
          always open."

          Worth a comment because of HOW it survived: CC edited this exact
          sentence hours earlier, changing "three live models" to "four", and
          did not see that the second half was false too. The count was what
          was being looked for, so the count was what got checked. The wording
          below is kept deliberately close to what the model pages themselves
          say, so the next drift shows up as a difference rather than needing
          to be reasoned about. */}
      <p className="footnote">
        Each model stands alone &mdash; you don&rsquo;t need the others to use
        one. Whole-Model Views for all four live models share the same
        interaction: select a cell to read it &mdash; click, or use the arrow
        keys &mdash; and the detail stays open beside the matrix.
      </p>
    </Layout>
  );
}
