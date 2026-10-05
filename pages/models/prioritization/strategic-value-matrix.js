import Link from "next/link";
import Layout from "../../../components/Layout";
import StrategicValueMatrix from "../../../components/StrategicValueMatrix";
import { getPrioritizationSvm, currencyBasisLine } from "../../../lib/models";

// The Strategic Value Matrix, the Product Prioritization model's Level E
// reference pattern. The frame's text and the sample are fetched at the
// pinned commit; the calculator is lib/svmCore.js, which the build tests
// against the frame's conformance cases (scripts/svm-conformance.js).

export async function getStaticProps() {
  const svm = await getPrioritizationSvm();
  return { props: { ...svm, currencyBasis: currencyBasisLine("prioritization") } };
}

export default function StrategicValueMatrixPage({ frameHtml, sample, sourceCommit, currencyBasis }) {
  return (
    <Layout
      title="Strategic Value Matrix"
      wide
      crumb={
        <>
          <a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com /{" "}
          <Link href="/models">AI-Native Maturity Models</Link> /{" "}
          <Link href="/models/prioritization/whole-model-view">Product Prioritization</Link> / Strategic Value Matrix
        </>
      }
    >
      <h1>Strategic Value Matrix</h1>
      <p className="dek">
        The Level E reference pattern for Value Model Coherence in the Product Prioritization
        Maturity Model: explicit multi-factor value logic, visible weights, and explainable
        trade-offs. Below, eight fictional initiatives ranked on seven illustrative criteria.
      </p>

      <StrategicValueMatrix sample={sample} />

      <section className="svm-frame" dangerouslySetInnerHTML={{ __html: frameHtml }} />

      <p className="svm-source">
        Source: <code>strategic_value_matrix.md</code> and <code>svm_sample.yml</code> in the{" "}
        <a href="https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model">
          Product Prioritization model&rsquo;s repository
        </a>{" "}
        at <code>{sourceCommit.slice(0, 7)}</code>. {currencyBasis}
      </p>
    </Layout>
  );
}
