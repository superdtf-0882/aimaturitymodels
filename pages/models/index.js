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
        <div className="model-row">
          <div>
            <div className="model-name">AI-Native PDLC Maturity Model</div>
            <div className="model-desc">
              How market intelligence becomes product definition, prioritized
              investment, and closed-loop calibration.
            </div>
          </div>
          <span className="pill coming">Coming</span>
        </div>
        <div className="model-row">
          <div>
            <div className="model-name">Product Prioritization Maturity Model</div>
            <div className="model-desc">
              How organizations move from personal advocacy to coherent,
              governed portfolio decisions.
            </div>
          </div>
          <span className="pill coming">Coming</span>
        </div>
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
        <div className="model-row">
          <div>
            <div className="model-name">AI-Native EA Maturity Model</div>
            <div className="model-desc">
              How enterprise architecture itself adapts to a practice where
              governed cognition isn&rsquo;t exclusively human.
            </div>
          </div>
          <span className="pill coming">Coming</span>
        </div>
      </div>
      <p className="footnote">
        Each model stands alone &mdash; you don&rsquo;t need the others to use
        one. PDLC and Prioritization are complete models with published
        repos, level-by-level definitions, and verification clauses &mdash;
        already in the AI digest (<Link href="/ai">Feed This to Your AI</Link>)
        &mdash; but don&rsquo;t have their own site pages yet. The SDLC
        model&rsquo;s page is built first since its content was ready first.
      </p>
    </Layout>
  );
}
