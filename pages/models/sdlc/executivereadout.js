import { kvGet } from "../../../lib/kv";
import ExecutiveReadout from "../../../components/ExecutiveReadout";

// Server-rendered lookup (getServerSideProps, not getStaticProps: the hash
// is only known at request time) since Pages Router has no per-request App
// Router server component equivalent here.
export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, hash: null } };
  const readout = await kvGet(`diag_cache:${hash}`);
  return { props: { readout: readout || null, hash } };
}

export default function SdlcExecutiveReadout({ readout, hash }) {
  return (
    <ExecutiveReadout
      readout={readout}
      hash={hash}
      assessmentHref="/models/sdlc/assessment"
      assessmentLabel="AI-Native SDLC Assessment"
      modelTitle="AI-Native SDLC Maturity Model"
      repoUrl="https://github.com/superdtf-0882/ai-native-sdlc-maturity-model"
      downloadFilename="sdlc-executive-readout.md"
    />
  );
}
