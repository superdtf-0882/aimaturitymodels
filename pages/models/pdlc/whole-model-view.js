import { getPdlcShortForm, getPdlcFullModel, currencyBasisLine } from "../../../lib/models";
import WholeModelView from "../../../components/WholeModelView";

export async function getStaticProps() {
  const [shortForm, fullModel] = await Promise.all([getPdlcShortForm(), getPdlcFullModel()]);
  const dimensions = fullModel.dimensions.map((d) => ({
    ...d,
    title: shortForm.dimensions[d.id].title,
    digest: shortForm.dimensions[d.id].levels,
  }));
  return { props: { dimensions, sourceCommit: fullModel.sourceCommit, currencyBasis: currencyBasisLine("pdlc") } };
}

export default function PdlcWholeModelView({ dimensions, sourceCommit, currencyBasis }) {
  return (
    <WholeModelView
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      currencyBasis={currencyBasis}
      modelLabel="AI-Native PDLC"
      dimensionCountLabel="Twelve dimensions"
      deepDiveBasePath="/models/pdlc/deep-dive"
      crumbLabel="AI-Native PDLC"
      crumbHref="/models/pdlc/whole-model-view"
    />
  );
}
