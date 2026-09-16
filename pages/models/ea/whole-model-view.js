import { getEaShortForm, getEaFullModel, currencyBasisLine } from "../../../lib/models";
import WholeModelView from "../../../components/WholeModelView";

export async function getStaticProps() {
  const [shortForm, fullModel] = await Promise.all([getEaShortForm(), getEaFullModel()]);
  const dimensions = fullModel.dimensions.map((d) => ({
    ...d,
    title: shortForm.dimensions[d.id].title,
    digest: shortForm.dimensions[d.id].levels,
    // PASSED, unlike the SDLC route which deliberately drops the same
    // field. D4, D5 and D6 ship flagged under the flags-not-blockers
    // disposition ratified 2026-09-11, and WP-EA-01's success criteria
    // require them rendered visibly rather than dropped. SDLC can drop
    // its D11 flag here because its Deep-Dive pages render it; this model
    // has no Deep-Dive pages yet, so dropping it would publish the three
    // open questions nowhere at all.
    flag: shortForm.dimensions[d.id].flag || null,
  }));
  return {
    props: {
      dimensions,
      sourceCommit: fullModel.sourceCommit,
      currencyBasis: currencyBasisLine("ea"),
    },
  };
}

export default function EaWholeModelView({ dimensions, sourceCommit, currencyBasis }) {
  return (
    <WholeModelView
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      currencyBasis={currencyBasis}
      modelLabel="Enterprise Architecture"
      dimensionCountLabel="Ten dimensions"
      // No deepDiveBasePath: the EA repo has no deep_dives/ yet, and the
      // component renders a plain id rather than a link when it is absent.
      // Back-porting them is its own work item; a link to a 404 would be
      // worse than no link.
      crumbLabel="Enterprise Architecture"
      crumbHref="/models/ea/whole-model-view"
    />
  );
}
