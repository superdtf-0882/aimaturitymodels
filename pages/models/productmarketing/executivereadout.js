import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";

// OKF-TOGAF#202: the Product Marketing readout, EA's shape (#145).
export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, hash: null } };
  const readout = await kvGet(`diag_cache:${hash}`);
  return { props: { readout: readout || null, hash } };
}

export default function ProductMarketingExecutiveReadout({ readout, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      hash={hash}
      assessmentHref="/models/productmarketing/assessment"
      assessmentLabel="AI-Native Product Marketing Assessment"
      modelTitle="AI-Native Product Marketing Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-product-marketing-maturity-model"
      downloadFilename="productmarketing-executive-readout.md"
    />
  );
}
