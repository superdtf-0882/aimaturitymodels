import Link from "next/link";
import Layout from "../../components/Layout";

export default function FunctionModelsIndex() {
  return (
    <Layout
      title="Function Models"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Function Models</>}
    >
      <h1>Function Models</h1>
      <p className="dek">
        Flat, ontological maps of what a function actually consists of &mdash;
        inputs, activities, capabilities, tools, and outputs. Unlike the
        maturity models, a Function Model doesn&rsquo;t measure AI-nativity or
        progression; it names what the function is, independent of how well
        any organization currently does it.
      </p>

      <div className="model-list">
        <Link href="/functionmodels/pm" className="model-row">
          <div>
            <div className="model-name">Product Management Function Model</div>
            <div className="model-desc">
              How market, user, and business inputs become the activities,
              capabilities, and tools of the PM function &mdash; and what it
              hands off to engineering, GTM, operations, and leadership.
            </div>
          </div>
          <span className="pill live">Live</span>
        </Link>
      </div>
      <p className="footnote">
        First of a family &mdash; more Function Models share this same
        Inputs / Function / Outputs structure as they land.
      </p>
    </Layout>
  );
}
