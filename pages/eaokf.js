import Link from "next/link";
import Layout from "../components/Layout";

export default function EaOkf() {
  return (
    <Layout
      title="Enterprise Architecture OKF"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Enterprise Architecture OKF</>}
    >
      <h1>Enterprise Architecture OKF</h1>
      <p className="dek">
        The governed schema every model in this family is written in &mdash;
        an Ontology, Lexicon, and Taxonomy for running a technology practice
        with the help of AI colleagues, precise enough that both a human and
        an AI system recognize exactly what they&rsquo;re looking at.
      </p>

      <h2>A corpus, not a wiki</h2>
      <p>
        At the center of it sits the Corpus: one official archive, not a
        loose collection of documents that happen to be true. Everything
        inside it is official. Everything outside it &mdash; notes, drafts,
        working files &mdash; is evidence: useful, but not governing anything
        by itself. That distinction is what keeps a growing body of decisions
        from quietly drifting out of sync with what a practice actually does.
      </p>

      <h2>What it actually holds</h2>
      <p>
        A small number of entity kinds, kept cleanly separated: the Intent a
        practice exists to serve; Principles and Constraints that rarely
        change; named Standards the practice measures itself against
        (this is exactly where a maturity model like the ones in this family
        lives); Decision Records for choices already made, so they
        aren&rsquo;t re-litigated; Work Packages with a clear scope and
        owner; Authorizations &mdash; formal, constitutive acts by which a
        human owner sanctions specific work; the Systems and Operations doing
        the actual work day to day; and Observations, the feedback that
        sharpens Intent over time as those systems actually run.
      </p>

      <h2>Where the models in this family stand</h2>
      <p>
        EA OKF is the schema this family is written in &mdash; not itself
        one of the models, the ground they all stand on. Each model is the
        actual product: a named Standard, expressed as structured,
        machine-readable governance rather than a one-off document, using
        exactly this schema underneath.{" "}
        <Link href="/strata">Strata</Link> is the structure explaining how
        they relate to each other once they&rsquo;re in place.
      </p>
    </Layout>
  );
}
