import { getSdlcAssessmentDimensions, getSdlcShortForm, withShortFormFlags } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  // OKF-TOGAF#202: the short form's open questions, shown on every model's
  // assessment page. SDLC's has none at its pin.
  const [{ dimensions, sourceCommit, thresholdStates }, shortForm] = await Promise.all([getSdlcAssessmentDimensions(), getSdlcShortForm()]);
  return { props: { dimensions: withShortFormFlags(dimensions, shortForm), sourceCommit, thresholdStates } };
}

export default function SdlcAssessment({ dimensions, sourceCommit, thresholdStates }) {
  return (
    <Assessment
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      modelSlug="sdlc"
      modelName="AI-Native SDLC"
      modelTitle="AI-Native SDLC Maturity Assessment"
      modelFullName="AI-Native SDLC Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-sdlc-maturity-model"
      executiveReadoutHref="/models/sdlc/executivereadout"
      downloadFilename="sdlc-maturity-assessment.md"
      thresholdStates={thresholdStates}
    />
  );
}
