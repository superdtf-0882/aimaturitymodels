import Link from "next/link";
import Layout from "../../components/Layout";

export default function AssessmentsIndex() {
  return (
    <Layout
      title="Maturity Model Assessments"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Maturity Model Assessments</>}
    >
      <h1>Maturity Model Assessments</h1>
      <p className="dek">
        Score your own organization against each model in the family, model
        by model. Each assessment produces an Executive Readout &mdash; a
        plain-language interpretation of where you actually stand.
      </p>

      <div className="model-list">
        <Link href="/models/sdlc/assessment" className="model-row">
          <div>
            <div className="model-name">AI-Native SDLC Maturity Assessment</div>
            <div className="model-desc">
              Thirteen dimensions, scored A through E, with an AI-generated
              Executive Readout.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
        <Link href="/models/pdlc/assessment" className="model-row">
          <div>
            <div className="model-name">AI-Native PDLC Maturity Assessment</div>
            <div className="model-desc">
              Same instrument shape as the SDLC assessment, applied to the
              PDLC model&rsquo;s dimensions.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
        <Link href="/models/prioritization/assessment" className="model-row">
          <div>
            <div className="model-name">Product Prioritization Maturity Assessment</div>
            <div className="model-desc">
              Same instrument shape, applied to the Prioritization model&rsquo;s
              dimensions.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
        <div className="model-row">
          <div>
            <div className="model-name">Product Marketing Lifecycle Maturity Assessment</div>
            <div className="model-desc">
              Waiting on the model itself, not just its assessment instrument.
            </div>
          </div>
          <span className="pill coming">Coming</span>
        </div>
        <div className="model-row">
          <div>
            <div className="model-name">AI-Native EA Maturity Assessment</div>
            <div className="model-desc">
              Waiting on the model itself, not just its assessment instrument.
            </div>
          </div>
          <span className="pill coming">Coming</span>
        </div>
      </div>
      <p className="footnote">
        All three live models share the same instrument shape &mdash; self-score
        each dimension, download a summary, or generate an AI-assisted
        Executive Readout. Formal instrument-scored assessment (the
        SPEC-D6-SCORE equivalent) exists only for SDLC so far; PDLC and
        Prioritization&rsquo;s own scoring instruments are tracked separately
        (issues #19 and #26).
      </p>
    </Layout>
  );
}
