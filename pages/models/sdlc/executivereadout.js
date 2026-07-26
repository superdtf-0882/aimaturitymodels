import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Layout from "../../../components/Layout";
import { kvGet } from "../../../lib/kv";

// Ported from AI-architecture-taxonomy's app/executivereadout/ReadoutView.jsx
// as part of the assessment's relocation -- server-rendered lookup (getServerSideProps,
// not getStaticProps: the hash is only known at request time) since Pages Router has
// no per-request App Router server component equivalent here.
export async function getServerSideProps({ query }) {
  const hash = typeof query.hash === "string" ? query.hash : null;
  if (!hash) return { props: { readout: null, hash: null } };
  const readout = await kvGet(`diag_cache:${hash}`);
  return { props: { readout: readout || null, hash } };
}

function buildDownloadMd(readout) {
  return (
    `# Executive Readout\n\n${readout.trim()}\n\n` +
    `*AI-Native SDLC Maturity Model © 2026 David Facer — CC BY 4.0*\n` +
    `*Full model: https://github.com/superdtf-0882/ai-native-sdlc-maturity-model*\n`
  );
}

export default function ExecutiveReadout({ readout, hash }) {
  const [copied, setCopied] = useState(false);

  const crumb = (
    <>
      <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
      <Link href="/models/sdlc/assessment">AI-Native SDLC Assessment</Link> / Executive Readout
    </>
  );

  if (!readout) {
    return (
      <Layout title="Executive Readout" crumb={crumb}>
        <h1>Executive Readout</h1>
        <p className="dek">
          {hash
            ? "This readout has expired or wasn't found — cached readouts are kept for 24 hours."
            : "No readout requested."}
        </p>
        <p>
          <Link href="/models/sdlc/assessment">Run a new assessment →</Link>
        </p>
      </Layout>
    );
  }

  function handleDownload() {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([buildDownloadMd(readout)], { type: "text/markdown" })),
      download: "sdlc-executive-readout.md",
    });
    a.click();
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable -- silently no-op rather than error.
    }
  }

  return (
    <Layout title="Executive Readout" crumb={crumb}>
      <h1>Executive Readout</h1>
      <div className="readout-body">
        <ReactMarkdown>{readout}</ReactMarkdown>
      </div>
      <div className="readout-actions">
        <button type="button" className="assess-btn assess-btn-blue" onClick={handleDownload}>
          Download Executive Readout
        </button>
        <button type="button" className="assess-btn assess-btn-blue" onClick={handleCopyUrl}>
          {copied ? "Copied!" : "Copy This URL"}
        </button>
        <Link href="/models/sdlc/assessment" className="readout-rerun">
          Run another assessment →
        </Link>
      </div>
      <p className="footnote" style={{ textAlign: "center", marginTop: 14 }}>
        <a href="https://github.com/superdtf-0882/ai-native-sdlc-maturity-model" target="_blank" rel="noopener noreferrer">
          AI-Native SDLC Maturity Model
        </a>{" "}
        © 2026 David Facer —{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
      </p>
    </Layout>
  );
}
