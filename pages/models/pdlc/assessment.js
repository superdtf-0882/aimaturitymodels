import { getPdlcAssessmentDimensions } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  // OKF-TOGAF#202: the short form's open questions, shown on every model's
  // assessment page. PDLC's has none at its pin. OKF-TOGAF#207: Pre-AI and Exempt,
  // read from EA's text at the tag PDLC's model names.
  const { dimensions, sourceCommit, thresholdStates } = await getPdlcAssessmentDimensions();
  return { props: { dimensions, sourceCommit, thresholdStates } };
}

export default function PdlcAssessment({ dimensions, sourceCommit, thresholdStates }) {
  return (
    <Assessment
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      thresholdStates={thresholdStates}
      modelSlug="pdlc"
      modelName="AI-Native PDLC"
      modelTitle="AI-Native PDLC Maturity Assessment"
      modelFullName="AI-Native PDLC Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-pdlc-maturity-model"
      executiveReadoutHref="/models/pdlc/executivereadout"
      downloadFilename="pdlc-maturity-assessment.md"
    />
  );
}
