import Link from "next/link";
import Layout from "./Layout";

// Shared by all three models' Deep-Dive pages -- originally built for
// SDLC alone (pages/models/sdlc/deep-dive/[dim].js), extracted here once
// PDLC and Prioritization needed the identical page shape with different
// data (dimension order, model label, Whole-Model View crumb target).

export default function DeepDive({
  id,
  title,
  flag,
  html,
  dimensionOrder,
  basePath, // e.g. "/models/pdlc/deep-dive"
  modelLabel, // e.g. "AI-Native PDLC"
  wmvHref, // e.g. "/models/pdlc/whole-model-view"
  wmvLabel, // e.g. "AI-Native PDLC"
  provenanceText, // fallback provenance line when `flag` is not set
}) {
  return (
    <Layout
      title={`${modelLabel} — ${title}`}
      crumb={
        <>
          <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
          <Link href="/models">AI-Native Maturity Models</Link> /{" "}
          <Link href={wmvHref}>{wmvLabel}</Link> / {id}
        </>
      }
    >
      <div className="dd-nav">
        {dimensionOrder.map((d) => (
          <Link key={d} href={`${basePath}/${d.toLowerCase()}`} className={d === id ? "current" : ""}>
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
        {flag
          ? `Drafted from the ${modelLabel} model’s real locked content, per Option A (ship now, label the gap above).`
          : provenanceText}
      </p>
    </Layout>
  );
}
