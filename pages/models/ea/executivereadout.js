import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";

// OKF-TOGAF#145: EA assessment parity, the sibling wrappers' shape.
export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, hash: null } };
  const readout = await kvGet(`diag_cache:${hash}`);
  return { props: { readout: readout || null, hash } };
}

export default function EaExecutiveReadout({ readout, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      hash={hash}
      assessmentHref="/models/ea/assessment"
      assessmentLabel="AI-Native EA Assessment"
      modelTitle="AI-Native EA Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-ea-maturity-model"
      downloadFilename="ea-executive-readout.md"
    />
  );
}
