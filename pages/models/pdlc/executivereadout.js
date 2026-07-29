import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";

export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, hash: null } };
  const readout = await kvGet(`diag_cache:${hash}`);
  return { props: { readout: readout || null, hash } };
}

export default function PdlcExecutiveReadout({ readout, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      hash={hash}
      assessmentHref="/models/pdlc/assessment"
      assessmentLabel="AI-Native PDLC Assessment"
      modelTitle="AI-Native PDLC Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-pdlc-maturity-model"
      downloadFilename="pdlc-executive-readout.md"
    />
  );
}
