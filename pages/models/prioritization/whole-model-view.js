import { getPrioritizationShortForm, getPrioritizationFullModel } from "../../../lib/models";
import WholeModelView from "../../../components/WholeModelView";

export async function getStaticProps() {
  const [shortForm, fullModel] = await Promise.all([
    getPrioritizationShortForm(),
    getPrioritizationFullModel(),
  ]);
  const dimensions = fullModel.dimensions.map((d) => ({
    ...d,
    title: shortForm.dimensions[d.id].title,
    digest: shortForm.dimensions[d.id].levels,
  }));
  return { props: { dimensions, sourceCommit: fullModel.sourceCommit } };
}

export default function PrioritizationWholeModelView({ dimensions, sourceCommit }) {
  return (
    <WholeModelView
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      modelLabel="Product Prioritization"
      dimensionCountLabel="Three dimensions"
      deepDiveBasePath="/models/prioritization/deep-dive"
      crumbLabel="Product Prioritization"
      crumbHref="/models/prioritization/whole-model-view"
    />
  );
}
