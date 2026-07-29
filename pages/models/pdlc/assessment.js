import { getPdlcFullModel } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  const { dimensions, sourceCommit } = await getPdlcFullModel();
  return { props: { dimensions, sourceCommit } };
}

export default function PdlcAssessment({ dimensions, sourceCommit }) {
  return (
    <Assessment
      dimensions={dimensions}
      sourceCommit={sourceCommit}
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
