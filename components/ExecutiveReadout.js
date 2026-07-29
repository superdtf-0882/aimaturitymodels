import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Layout from "./Layout";

// Shared by all three models' Executive Readout pages -- originally built
// for SDLC alone (pages/models/sdlc/executivereadout.js), extracted here for
// issue #25. Each model's own thin wrapper page still owns its
// getServerSideProps (the KV lookup needs the request-time `hash` query
// param, which Pages Router only exposes there) and just passes the result
// down along with its own crumb/download/attribution text.

export default function ExecutiveReadout({
  readout,
  hash,
  assessmentHref, // e.g. "/models/pdlc/assessment"
  assessmentLabel, // e.g. "AI-Native PDLC Assessment"
  modelTitle, // e.g. "AI-Native PDLC Maturity Model" -- used in the download footer
  repoUrl,
  downloadFilename, // e.g. "pdlc-executive-readout.md"
}) {
  const [copied, setCopied] = useState(false);

  const crumb = (
    <>
      <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
      <Link href={assessmentHref}>{assessmentLabel}</Link> / Executive Readout
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
          <Link href={assessmentHref}>Run a new assessment →</Link>
        </p>
      </Layout>
    );
  }

  function buildDownloadMd() {
    return (
      `# Executive Readout\n\n${readout.trim()}\n\n` +
      `*${modelTitle} © 2026 David Facer — CC BY 4.0*\n` +
      `*Full model: ${repoUrl}*\n`
    );
  }

  function handleDownload() {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([buildDownloadMd()], { type: "text/markdown" })),
      download: downloadFilename,
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
        <Link href={assessmentHref} className="readout-rerun">
          Run another assessment →
        </Link>
      </div>
      <p className="footnote" style={{ textAlign: "center", marginTop: 14 }}>
        <a href={repoUrl} target="_blank" rel="noopener noreferrer">
          {modelTitle}
        </a>{" "}
        © 2026 David Facer —{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
      </p>
    </Layout>
  );
}
