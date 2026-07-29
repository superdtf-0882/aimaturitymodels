import { getSdlcAssessmentDimensions } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  const { dimensions, sourceCommit } = await getSdlcAssessmentDimensions();
  return { props: { dimensions, sourceCommit } };
}

export default function SdlcAssessment({ dimensions, sourceCommit }) {
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
    />
  );
}
