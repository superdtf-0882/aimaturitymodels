import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";

export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, hash: null } };
  const readout = await kvGet(`diag_cache:${hash}`);
  return { props: { readout: readout || null, hash } };
}

export default function PrioritizationExecutiveReadout({ readout, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      hash={hash}
      assessmentHref="/models/prioritization/assessment"
      assessmentLabel="Product Prioritization Assessment"
      modelTitle="AI-Native Product Prioritization Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model"
      downloadFilename="prioritization-executive-readout.md"
    />
  );
}
