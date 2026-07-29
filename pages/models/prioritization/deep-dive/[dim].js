import {
  getPrioritizationDeepDive,
  getPrioritizationShortForm,
  PRIORITIZATION_DIMENSION_ORDER,
} from "../../../../lib/models";
import DeepDive from "../../../../components/DeepDive";

export async function getStaticPaths() {
  return {
    paths: PRIORITIZATION_DIMENSION_ORDER.map((id) => ({ params: { dim: id.toLowerCase() } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const id = params.dim.toUpperCase();
  const data = await getPrioritizationShortForm();
  const html = await getPrioritizationDeepDive(id);
  const dim = data.dimensions[id];
  return { props: { id, title: dim.title, flag: dim.flag || null, html } };
}

export default function PrioritizationDeepDive({ id, title, flag, html }) {
  return (
    <DeepDive
      id={id}
      title={title}
      flag={flag}
      html={html}
      dimensionOrder={PRIORITIZATION_DIMENSION_ORDER}
      basePath="/models/prioritization/deep-dive"
      modelLabel="Product Prioritization"
      wmvHref="/models/prioritization/whole-model-view"
      wmvLabel="Product Prioritization"
      provenanceText="Drafted from the Product Prioritization model’s real locked content."
    />
  );
}
