import { getProductMarketingAssessmentDimensions } from "../../../lib/models";
import Assessment from "../../../components/Assessment";

// OKF-TOGAF#202: the Product Marketing assessment, on EA's (#145). Pre-AI and
// Exempt are EA's text at v1.1.2, on the owner's scope line; the readout
// route's key is prodmar (pages/api/diagnostic.js).
export async function getStaticProps() {
  const { dimensions, sourceCommit, thresholdStates } = await getProductMarketingAssessmentDimensions();
  return { props: { dimensions, sourceCommit, thresholdStates } };
}

export default function ProductMarketingAssessment({ dimensions, sourceCommit, thresholdStates }) {
  return (
    <Assessment
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      modelSlug="prodmar"
      modelName="AI-Native Product Marketing"
      modelTitle="AI-Native Product Marketing Maturity Assessment"
      modelFullName="AI-Native Product Marketing Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-product-marketing-maturity-model"
      executiveReadoutHref="/models/productmarketing/executivereadout"
      downloadFilename="productmarketing-maturity-assessment.md"
      thresholdStates={thresholdStates}
    />
  );
}
