import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Layout from "./Layout";
// OKF-TOGAF#217: the scores the readout was written from and the model version,
// on the page and in its download (lib/readout-entry.js says what is kept).
const { NO_SCORES, versionLine, levelCell, downloadMd } = require("../lib/readout-entry");

// OKF-TOGAF#212: every readout ends with one ask, in the owner's words, taken by
// an email link to his davidfacer.com address. The visitor writes and sends the
// email from their own mail program; a web page cannot attach a file, so the
// email carries the link to the visitor's own readout, which the site keeps four
// days (reopened 2026-10-19 on the owner's test). The site counts the click per
// model and keeps nothing about the person.
const ASK = "Send me your assessment summary and I'll read it with you — a short call, no charge.";
function askHref(assessmentLabel, assessmentHref, hash) {
  const subject = "Read my " + assessmentLabel + " with me";
  // The readout's own page, e.g. /models/sdlc/executivereadout?hash=..., kept four days.
  const readoutUrl = "https://aimaturitymodels.com" + assessmentHref.replace(/assessment$/, "executivereadout") + "?hash=" + encodeURIComponent(hash || "");
  const body = "Hello David,\n\nHere is my readout from aimaturitymodels.com: " + readoutUrl + "\n\nCould we read it together?\n\n";
  return "mailto:david.facer@davidfacer.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

// Shared by the Executive Readout pages of the three models that have them
// -- SDLC, PDLC and Prioritization. The family is four models as of
// 2026-09-12; EA has no readout yet. Originally built
// for SDLC alone (pages/models/sdlc/executivereadout.js), extracted here for
// issue #25. Each model's own thin wrapper page still owns its
// getServerSideProps (the KV lookup needs the request-time `hash` query
// param, which Pages Router only exposes there) and just passes the result
// down along with its own crumb/download/attribution text.

export default function ExecutiveReadout({
  readout,
  scores = null, // [{ id, name, level }], or null for a readout saved before #217
  reasons = {}, // each Exempt dimension's reason, in the visitor's own words
  version = null, // the model version recorded when the readout was written
  hash,
  assessmentHref, // e.g. "/models/pdlc/assessment"
  assessmentLabel, // e.g. "AI-Native PDLC Assessment"
  modelTitle, // e.g. "AI-Native PDLC Maturity Model" -- used in the download footer
  repoUrl,
  downloadFilename, // e.g. "pdlc-executive-readout.md"
  modelSlug, // the counter's key, as the model's assessment page names it
}) {
  const [copied, setCopied] = useState(false);

  const crumb = (
    <>
      <a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com /{" "}
      <Link href={assessmentHref}>{assessmentLabel}</Link> / Executive Readout
    </>
  );

  if (!readout) {
    return (
      <Layout title="Executive Readout" crumb={crumb}>
        <h1>Executive Readout</h1>
        <p className="dek">
          {hash
            ? "This readout has expired or wasn't found — cached readouts are kept for four days."
            : "No readout requested."}
        </p>
        <p>
          <Link href={assessmentHref}>Run a new assessment →</Link>
        </p>
      </Layout>
    );
  }

  function buildDownloadMd() {
    return downloadMd({ readout, scores, reasons, version }, modelTitle, repoUrl);
  }

  function handleDownload() {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([buildDownloadMd()], { type: "text/markdown" })),
      download: downloadFilename,
    });
    a.click();
  }

  function countAsk() {
    try {
      fetch("/api/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "ask-taken", model: modelSlug }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* counting never stands between the visitor and the email */ }
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
      <div className="readout-scores">
        <h2>Your scores</h2>
        {scores ? (
          <table>
            <thead>
              <tr><th>Dimension</th><th>Name</th><th>Level</th></tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{levelCell(s, reasons)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{NO_SCORES}</p>
        )}
        <p className="readout-version">{versionLine(modelTitle, version)}</p>
      </div>
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
      <div className="readout-ask">
        <p>
          {ASK}{" "}
          <a href={askHref(assessmentLabel, assessmentHref, hash)} onClick={countAsk}>Email David</a>
        </p>
        <p className="readout-author">
          — <a href="https://davidfacer.com">David Facer</a>
        </p>
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
