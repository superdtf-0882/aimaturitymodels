import Link from "next/link";
import Layout from "../components/Layout";

export default function Vellum() {
  return (
    <Layout
      title="Vellum & Seminum"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Vellum & Seminum</>}
    >
      <h1>Vellum &amp; Seminum</h1>
      <p className="dek">
        Two internal tools built on top of <Link href="/eaokf">EA OKF</Link>,
        for two different problems: seeing a corpus, and seeding one. Neither
        is public &mdash; both are closed, trusted-access tooling by design,
        described here so their absence from the rest of this site doesn&rsquo;t
        read as an oversight.
      </p>

      <h2>Vellum &mdash; seeing the corpus</h2>
      <p>
        A governed corpus is only as useful as it is legible. Vellum is a
        read-only renderer that makes the corpus&rsquo;s records and the
        relationships between them navigable at multiple altitudes &mdash;
        a single decision, a whole work package, or the practice&rsquo;s
        entire governed history &mdash; without hand-authoring a one-off
        document for each view. The name is deliberate: pre-digital
        architects drafted on thin vellum sheets specifically so several
        layered plans could be overlaid on a light table and read in
        relation to each other. That&rsquo;s exactly what this tool does
        across the corpus&rsquo;s typed edges.
      </p>

      <h2>Seminum &mdash; seeding a new practice</h2>
      <p>
        Every practice built this way accumulates the same pattern layer:
        EA OKF itself, a maturity model shaped like the ones in this family,
        and the process models that hold them together. Seminum is a
        portable package of that pattern &mdash; sanitized of any one
        practice&rsquo;s own instance data &mdash; meant to be dropped into a
        new repository so a new practice starts from something proven
        instead of a blank page. It&rsquo;s planned, not yet shipped.
      </p>

      <p className="footnote">
        Both stay closed-access, by design &mdash; not because there&rsquo;s
        anything to hide, but because a corpus browser and a seed package
        are internal working tools, not public-facing products.
      </p>
    </Layout>
  );
}
