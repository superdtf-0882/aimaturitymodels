import { getProductMarketingShortForm, getProductMarketingFullModel, currencyBasisLine } from "../../../lib/models";
import WholeModelView from "../../../components/WholeModelView";

// The fifth family member (OKF-TOGAF#198). Titles are the matrix's own
// headings for every dimension, D1-D3 and D10 included, so the page names
// each dimension as this model does; the cells for those four are their
// sources' (lib/models.js says which).
export async function getStaticProps() {
  const [shortForm, fullModel] = await Promise.all([getProductMarketingShortForm(), getProductMarketingFullModel()]);
  const dimensions = fullModel.dimensions.map((d) => ({
    ...d,
    title: d.name,
    digest: shortForm.dimensions[d.id].levels,
    // PASSED, as on the EA page: the model ships two open questions as
    // visible flags (D9, and the upper levels of D5-D8), it has no Deep-Dive
    // pages, and the ratification requires them visible.
    flag: shortForm.dimensions[d.id].flag || null,
  }));
  return {
    props: {
      dimensions,
      sourceCommit: fullModel.sourceCommit,
      currencyBasis: currencyBasisLine("productmarketing"),
    },
  };
}

export default function ProductMarketingWholeModelView({ dimensions, sourceCommit, currencyBasis }) {
  return (
    <WholeModelView
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      currencyBasis={currencyBasis}
      modelLabel="Product Marketing"
      dimensionCountLabel="Eleven dimensions"
      // No deepDiveBasePath: the model has no deep dives, and the component
      // renders a plain id rather than a link when it is absent.
      crumbLabel="Product Marketing"
      crumbHref="/models/productmarketing/whole-model-view"
    />
  );
}
