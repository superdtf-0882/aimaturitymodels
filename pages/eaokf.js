import Link from "next/link";
import { marked } from "marked";
import Layout from "../components/Layout";
import { EAOKF_INTRO, EAOKF_BODY_MARKDOWN } from "../lib/eaokfContent";

// Content moved to lib/eaokfContent.js (issue #15) so the AI-readable
// digest can consume the same source instead of a hand-kept-in-sync copy.
export default function EaOkf() {
  return (
    <Layout
      title="Enterprise Architecture OKF"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Enterprise Architecture OKF</>}
    >
      <h1>Enterprise Architecture OKF</h1>
      <p className="dek">{EAOKF_INTRO}</p>
      <div className="dd-body" dangerouslySetInnerHTML={{ __html: marked.parse(EAOKF_BODY_MARKDOWN) }} />
    </Layout>
  );
}
