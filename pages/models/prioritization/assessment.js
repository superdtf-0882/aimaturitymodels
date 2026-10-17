import { getPrioritizationFullModel, getPrioritizationShortForm, withShortFormFlags } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  // OKF-TOGAF#202: the short form's open questions, shown on every model's
  // assessment page. Prioritization's has none at its pin.
  const [{ dimensions, sourceCommit }, shortForm] = await Promise.all([getPrioritizationFullModel(), getPrioritizationShortForm()]);
  return { props: { dimensions: withShortFormFlags(dimensions, shortForm), sourceCommit } };
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
