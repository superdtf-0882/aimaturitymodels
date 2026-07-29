import { getSdlcShortForm, getSdlcFullModel } from "../../../lib/models";
import WholeModelView from "../../../components/WholeModelView";

export async function getStaticProps() {
  const [shortForm, fullModel] = await Promise.all([getSdlcShortForm(), getSdlcFullModel()]);
  const dimensions = fullModel.dimensions.map((d) => ({
    ...d,
    title: shortForm.dimensions[d.id].title,
    // Review flags (e.g. D11's) are David's own call to bury in the
    // Deep-Dive narrative, not surface at this digest layer -- the
    // Deep-Dive page already renders this same flag under "Under
    // review." (pages/models/sdlc/deep-dive/[dim].js), so dropping it
    // here loses nothing, it just stops duplicating at a layer meant
    // to stay scannable. Not fetched into props at all now.
    // The one-sentence-per-cell digest (short_form.yml) -- this is the
    // actual content the matrix cells show. Cut entirely in the prior
    // "digested to pure shape" revision on the mistaken read that David
    // wanted cells fully blank; what he'd actually asked to drop was
    // the redundant state *label* (Nascent/Modeled/...), since the
    // column-header ovals already name that. The digest itself was
    // always meant to be there -- this was the one field getStaticProps
    // never pulled from shortForm to begin with.
    digest: shortForm.dimensions[d.id].levels,
  }));
  return { props: { dimensions, sourceCommit: fullModel.sourceCommit } };
}

export default function SdlcWholeModelView({ dimensions, sourceCommit }) {
  return (
    <WholeModelView
      dimensions={dimensions}
      sourceCommit={sourceCommit}
      modelLabel="AI-Native SDLC"
      dimensionCountLabel="Thirteen dimensions"
      deepDiveBasePath="/models/sdlc/deep-dive"
      crumbLabel="AI-Native SDLC"
      crumbHref="/models/sdlc/whole-model-view"
    />
  );
}
