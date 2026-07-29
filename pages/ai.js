import { useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { buildDigest } from "../lib/aiDigestCore";

// Issue #15: "Let's make the site readable to AI" -- a single markdown
// digest of the maturity model family, Strata, and EA OKF, for handing
// directly to an AI assistant. Same digest also served as a static
// /llms.txt (scripts/generate-llms-txt.js, run postbuild) for the
// growing convention of AI tools checking that path automatically --
// this page is the one David asked for by name (a visible link, a raw
// pane, a copy button), not a replacement for it.
export async function getStaticProps() {
  const digest = await buildDigest();
  return { props: { digest }, revalidate: 3600 };
}

export default function Ai({ digest }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable -- silently no-op rather than error.
    }
  }

  return (
    <Layout
      title="Feed This to Your AI"
      crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Feed This to Your AI</>}
    >
      <h1>Feed This to Your AI</h1>
      <p className="dek">
        One markdown file: the AI-Native Maturity Model family, the
        Strata governance-layer model, the Enterprise Architecture OKF
        explainer, and the site's Function Models. Copy it into your own AI
        assistant, or point it at <a href="/llms.txt">/llms.txt</a> directly.
      </p>
      <div className="ai-digest-actions">
        <button type="button" className="assess-btn assess-btn-blue" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy Digest"}
        </button>
        <a className="ai-digest-raw-link" href="/llms.txt" target="_blank" rel="noopener noreferrer">
          Open raw at /llms.txt →
        </a>
      </div>
      <pre className="ai-digest-pre">{digest}</pre>
    </Layout>
  );
}
