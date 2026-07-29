import { getPdlcDeepDive, getPdlcShortForm, PDLC_DIMENSION_ORDER } from "../../../../lib/models";
import DeepDive from "../../../../components/DeepDive";

export async function getStaticPaths() {
  return {
    paths: PDLC_DIMENSION_ORDER.map((id) => ({ params: { dim: id.toLowerCase() } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const id = params.dim.toUpperCase();
  const data = await getPdlcShortForm();
  const html = await getPdlcDeepDive(id);
  const dim = data.dimensions[id];
  return { props: { id, title: dim.title, flag: dim.flag || null, html } };
}

export default function PdlcDeepDive({ id, title, flag, html }) {
  return (
    <DeepDive
      id={id}
      title={title}
      flag={flag}
      html={html}
      dimensionOrder={PDLC_DIMENSION_ORDER}
      basePath="/models/pdlc/deep-dive"
      modelLabel="AI-Native PDLC"
      wmvHref="/models/pdlc/whole-model-view"
      wmvLabel="AI-Native PDLC"
      provenanceText="Drafted from the PDLC model’s real locked content."
    />
  );
}
