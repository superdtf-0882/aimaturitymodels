import Link from "next/link";
import Layout from "../../../components/Layout";
import { getSdlcDeepDive } from "../../../lib/models";

export async function getStaticProps() {
  const html = await getSdlcDeepDive("D13");
  return { props: { html } };
}

export default function Narrative({ html }) {
  return (
    <Layout title="SDLC — Feedback Loop Velocity" crumb={
      <>
        <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
        <Link href="/models">AI-Native Maturity Models</Link> /{" "}
        <Link href="/models/sdlc/whole-model-view">AI-Native SDLC</Link> / Narrative
      </>
    }>
      <div className="dd-body" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="provenance">
        Drafted from the SDLC model&rsquo;s real locked and draft content,
        following the D1&ndash;D3 reconciliation.
      </p>
    </Layout>
  );
}
