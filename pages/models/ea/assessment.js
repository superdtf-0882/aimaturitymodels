import { getEaAssessmentDimensions } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

// OKF-TOGAF#145: EA assessment parity, the sibling wrappers' shape. EA, like
// SDLC, defines Pre-AI and Exempt (OKF-TOGAF#161), so the page offers both.
export async function getStaticProps() {
  const { dimensions, sourceCommit, thresholdStates } = await getEaAssessmentDimensions();
  return { props: { dimensions, sourceCommit, thresholdStates } };
}

export default function EaAssessment({ dimensions, sourceCommit, thresholdStates }) {
  return (
    <Assessment
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      modelSlug="ea"
      modelName="AI-Native EA"
      modelTitle="AI-Native EA Maturity Assessment"
      modelFullName="AI-Native EA Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-ea-maturity-model"
      executiveReadoutHref="/models/ea/executivereadout"
      downloadFilename="ea-maturity-assessment.md"
      thresholdStates={thresholdStates}
    />
  );
}
