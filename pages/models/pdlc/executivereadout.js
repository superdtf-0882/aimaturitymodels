import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";
// OKF-TOGAF#217: the entry carries the readout, its scores and the model version.
const { decodeEntry } = require("../../../lib/readout-entry");

export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, scores: null, reasons: {}, version: null, hash: null } };
  const entry = decodeEntry(await kvGet(`diag_cache:${hash}`));
  if (!entry) return { props: { readout: null, scores: null, reasons: {}, version: null, hash } };
  return { props: { readout: entry.readout, scores: entry.scores, reasons: entry.reasons, version: entry.version, hash } };
}

export default function PdlcExecutiveReadout({ readout, scores, reasons, version, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      scores={scores}
      reasons={reasons}
      version={version}
      hash={hash}
      assessmentHref="/models/pdlc/assessment"
      assessmentLabel="AI-Native PDLC Assessment"
      modelTitle="AI-Native PDLC Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-pdlc-maturity-model"
      downloadFilename="pdlc-executive-readout.md"
      modelSlug="pdlc"
    />
  );
}
