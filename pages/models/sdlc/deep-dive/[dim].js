import Link from "next/link";
import Layout from "../../../../components/Layout";
import { getSdlcDeepDive, getSdlcShortForm, SDLC_DIMENSION_ORDER } from "../../../../lib/models";

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

export default function DeepDive({ id, title, flag, html }) {
  return (
    <Layout title={`SDLC — ${title}`} crumb={
      <>
        <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
        <Link href="/models">AI-Native Maturity Models</Link> /{" "}
        <Link href="/models/sdlc/whole-model-view">AI-Native SDLC</Link> / {id}
      </>
    }>
      <div className="dd-nav">
        {SDLC_DIMENSION_ORDER.map((d) => (
          <Link key={d} href={`/models/sdlc/deep-dive/${d.toLowerCase()}`} className={d === id ? "current" : ""}>
            {d}
          </Link>
        ))}
      </div>
      {flag && (
        <div className="review-banner">
          <strong>Under review.</strong> {flag}
        </div>
      )}
      <div className="dd-body" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="provenance">
        Drafted from the SDLC model&rsquo;s real locked and draft content,
        per Option A (ship now, label the gaps).
      </p>
    </Layout>
  );
}
