import { getPrioritizationFullModel } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  const { dimensions, sourceCommit } = await getPrioritizationFullModel();
  return { props: { dimensions, sourceCommit } };
}

export default function PrioritizationAssessment({ dimensions, sourceCommit }) {
  return (
    <Assessment
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      modelSlug="prioritization"
      modelName="Portfolio Prioritization"
      modelTitle="Portfolio Prioritization Maturity Assessment"
      modelFullName="AI-Native Portfolio Prioritization Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model"
      executiveReadoutHref="/models/prioritization/executivereadout"
      downloadFilename="prioritization-maturity-assessment.md"
    />
  );
}
