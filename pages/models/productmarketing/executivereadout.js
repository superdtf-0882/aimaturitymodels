import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";
// OKF-TOGAF#217: the entry carries the readout, its scores and the model version.
const { decodeEntry } = require("../../../lib/readout-entry");

// OKF-TOGAF#202: the Product Marketing readout, EA's shape (#145).
export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, scores: null, reasons: {}, version: null, hash: null } };
  const entry = decodeEntry(await kvGet(`diag_cache:${hash}`));
  if (!entry) return { props: { readout: null, scores: null, reasons: {}, version: null, hash } };
  return { props: { readout: entry.readout, scores: entry.scores, reasons: entry.reasons, version: entry.version, hash } };
}

export default function ProductMarketingExecutiveReadout({ readout, scores, reasons, version, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      scores={scores}
      reasons={reasons}
      version={version}
      hash={hash}
      assessmentHref="/models/productmarketing/assessment"
      assessmentLabel="AI-Native Product Marketing Assessment"
      modelTitle="AI-Native Product Marketing Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-product-marketing-maturity-model"
      downloadFilename="productmarketing-executive-readout.md"
      modelSlug="prodmar"
    />
  );
}
