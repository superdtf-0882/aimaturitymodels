import { getPdlcFullModel, getPdlcShortForm, withShortFormFlags } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

export async function getStaticProps() {
  // OKF-TOGAF#202: the short form's open questions, shown on every model's
  // assessment page. PDLC's has none at its pin.
  const [{ dimensions, sourceCommit }, shortForm] = await Promise.all([getPdlcFullModel(), getPdlcShortForm()]);
  return { props: { dimensions: withShortFormFlags(dimensions, shortForm), sourceCommit } };
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
