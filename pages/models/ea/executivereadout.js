import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";
// OKF-TOGAF#217: the entry carries the readout, its scores and the model version.
const { decodeEntry } = require("../../../lib/readout-entry");

// OKF-TOGAF#145: EA assessment parity, the sibling wrappers' shape.
export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, scores: null, reasons: {}, version: null, hash: null } };
  const entry = decodeEntry(await kvGet(`diag_cache:${hash}`));
  if (!entry) return { props: { readout: null, scores: null, reasons: {}, version: null, hash } };
  return { props: { readout: entry.readout, scores: entry.scores, reasons: entry.reasons, version: entry.version, hash } };
}

export default function EaExecutiveReadout({ readout, scores, reasons, version, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      scores={scores}
      reasons={reasons}
      version={version}
      hash={hash}
      assessmentHref="/models/ea/assessment"
      assessmentLabel="AI-Native EA Assessment"
      modelTitle="AI-Native EA Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-ea-maturity-model"
      downloadFilename="ea-executive-readout.md"
      modelSlug="ea"
    />
  );
}
