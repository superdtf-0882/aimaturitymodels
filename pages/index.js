import Link from "next/link";
import Layout from "../components/Layout";

export default function FamilyMap() {
  return (
    <Layout title="Family Map">
      <h1>AI-Native Maturity Models</h1>
      <p className="dek">
        Capability models for understanding how AI-nativity changes software
        delivery, product management, and the enterprise itself. These models
        don&rsquo;t ask how much AI an organization uses &mdash; they ask what
        its operating systems are actually capable of doing, and what
        realistically adjacent capability comes next.
      </p>

      <h2>The Family</h2>
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
          <span className="pill live">Live</span>
        </div>
        <div className="model-row">
          <div>
            <div className="model-name">Product Prioritization Maturity Model</div>
            <div className="model-desc">
              How organizations move from personal advocacy to coherent,
              governed portfolio decisions.
            </div>
          </div>
          <span className="pill live">Live</span>
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
        one. But they share a foundation, and where they connect is
        intentional, not incidental.
      </p>

      <hr className="section-divider" />
      <h2>Built on EA OKF</h2>
      <p>
        Every model in this family is expressed the same way underneath: as
        structured, machine-readable governance &mdash; a schema open enough
        that an AI system can read it directly, and precise enough that a
        human still recognizes exactly what it&rsquo;s looking at. This
        isn&rsquo;t a separate product. It&rsquo;s the layer everything else
        is written in.
      </p>

      <hr className="section-divider" />
      <h2>Strata</h2>
      <p>
        Why do these models relate to each other at all &mdash; why does
        market intelligence feed both delivery and product decisions, why
        does feedback velocity close a loop back to where an organization
        started? <Link href="/strata">Strata is the answer</Link>: the
        underlying structure showing how intent, governance, execution, and
        observation connect across every model in this family.
      </p>

      <hr className="section-divider" />
      <h2>A living system</h2>
      <p>
        These models don&rsquo;t describe a state of perfection. They
        describe a system of becoming &mdash; capable, measurable, and
        adaptively aligned with intent.
      </p>

      <div className="layer-note" style={{ marginTop: 28 }}>
        <strong>Tooling note.</strong> A lightweight internal tool for corpus
        visibility and a portable seed package for standing up a practice
        from scratch both already exist. You won&rsquo;t need to build
        either yourself.
      </div>
    </Layout>
  );
}
