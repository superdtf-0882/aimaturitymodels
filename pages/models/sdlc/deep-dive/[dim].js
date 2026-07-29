import { getSdlcDeepDive, getSdlcShortForm, SDLC_DIMENSION_ORDER } from "../../../../lib/models";
import DeepDive from "../../../../components/DeepDive";

export async function getStaticPaths() {
  return {
    paths: SDLC_DIMENSION_ORDER.map((id) => ({ params: { dim: id.toLowerCase() } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const id = params.dim.toUpperCase();
  const data = await getSdlcShortForm();
  const html = await getSdlcDeepDive(id);
  const dim = data.dimensions[id];
  return { props: { id, title: dim.title, flag: dim.flag || null, html } };
}

export default function SdlcDeepDive({ id, title, flag, html }) {
  return (
    <DeepDive
      id={id}
      title={title}
      flag={flag}
      html={html}
      dimensionOrder={SDLC_DIMENSION_ORDER}
      basePath="/models/sdlc/deep-dive"
      modelLabel="AI-Native SDLC"
      wmvHref="/models/sdlc/whole-model-view"
      wmvLabel="AI-Native SDLC"
      provenanceText="Drafted from the SDLC model’s real locked content."
    />
  );
}
