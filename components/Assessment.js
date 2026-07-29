import { useState } from "react";
import Link from "next/link";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import Layout from "./Layout";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

// Shared by all three models' self-assessment tools -- originally built for
// SDLC alone (pages/models/sdlc/assessment.js), extracted here for issue #25
// once PDLC and Prioritization needed the identical scoring/chart/download/
// Executive-Readout interaction with different data and a different
// dimension count. `modelSlug` is sent to /api/diagnostic as `body.model` --
// the API looks up dimension count and prompt from it server-side, so this
// component never needs to know those itself beyond `dimensions.length`.

const LEVELS = ["A", "B", "C", "D", "E"];

function buildAssessmentMd({ modelTitle, modelFullName, repoUrl, dimensions, scores }) {
  const scored = Object.keys(scores).length;
  const date = new Date().toISOString().split("T")[0];

  let md = "";
  md += `# ${modelTitle}\n\n`;
  md += `**Framework:** ${modelFullName} — David Facer (CC BY 4.0)\n`;
  md += `**Model reference:** ${repoUrl}\n`;
  md += `**Generated:** ${date}\n\n`;
  md += `> Each dimension is scored A through E. A given level is only merited when **everything** in its definition is true. `;
  md += `Dimensions are independently scored — an organisation can be advanced in one and nascent in another.\n\n`;
  md += `---\n\n`;

  md += `## Scores\n\n`;
  md += `| Dimension | Name | Level |\n`;
  md += `|---|---|---|\n`;
  dimensions.forEach((d) => {
    md += `| ${d.id} | ${d.name} | ${scores[d.id] || "—"} |\n`;
  });
  md += `\n*${scored} of ${dimensions.length} dimensions graded.* No averaged score is computed above — dimensions are independently scored, and collapsing ordinal A–E judgments into a single mean would lend false interval precision to a profile that is only meaningful dimension by dimension.\n\n`;
  md += `---\n\n`;

  md += `## Full maturity definitions\n\n`;
  md += `*All five levels shown for each dimension. Your scored level is marked with ◀.*\n\n`;
  dimensions.forEach((d) => {
    md += `### ${d.id}. ${d.name}\n\n`;
    md += `*${d.desc}*\n\n`;
    LEVELS.forEach((lv) => {
      const marker = scores[d.id] === lv ? " — your score ◀" : "";
      md += `**Level ${lv}${marker}**\n\n`;
      md += `${d.levels[lv]}\n\n`;
    });
    md += `---\n\n`;
  });

  md += `*${modelFullName} © 2026 David Facer — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)*\n`;
  md += `*Full model: ${repoUrl}*\n`;
  return md;
}

const READOUT_MESSAGES = [
  "calculating dimensions", "mapping investment concentration", "measuring adjacent maturities",
  "relationships between dimensions", "estimating organizational stage", "identifying strategic priorities",
  "identifying delivery bottlenecks", "organizational strengths", "maturity distribution",
  "forming executive POV", "evaluating dimensional relationships",
];

export default function Assessment({
  dimensions,
  sourceCommit,
  modelSlug, // e.g. "pdlc" -- sent to /api/diagnostic as body.model
  modelName, // e.g. "AI-Native PDLC" -- used in <h1> and crumb
  modelTitle, // e.g. "AI-Native PDLC Maturity Assessment" -- used as the .md's own title
  modelFullName, // e.g. "AI-Native PDLC Maturity Model" -- the model itself, not the assessment of it
  repoUrl,
  executiveReadoutHref, // e.g. "/models/pdlc/executivereadout"
  downloadFilename, // e.g. "pdlc-maturity-assessment.md"
}) {
  const [scores, setScores] = useState({});
  const [selectedDim, setSelectedDim] = useState(dimensions[0].id);
  const [generating, setGenerating] = useState(false);
  const [readoutMsgIndex, setReadoutMsgIndex] = useState(0);
  const [error, setError] = useState(null);

  const dim = dimensions.find((d) => d.id === selectedDim);
  const gradedCount = Object.keys(scores).length;
  const allGraded = gradedCount === dimensions.length;
  const pct = (gradedCount / dimensions.length) * 100;

  function selectLevel(letter) {
    setScores((prev) => {
      const next = { ...prev };
      if (next[selectedDim] === letter) delete next[selectedDim];
      else next[selectedDim] = letter;
      return next;
    });
  }

  function downloadMd() {
    const md = buildAssessmentMd({ modelTitle, modelFullName, repoUrl, dimensions, scores });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([md], { type: "text/markdown" })),
      download: downloadFilename,
    });
    a.click();
  }

  async function tryExecutiveReadout() {
    setError(null);
    setGenerating(true);
    setReadoutMsgIndex(0);
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 1, READOUT_MESSAGES.length - 1);
      setReadoutMsgIndex(i);
    }, 2500);

    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelSlug, md: buildAssessmentMd({ modelTitle, modelFullName, repoUrl, dimensions, scores }) }),
      });
      const data = await res.json();
      clearInterval(timer);
      if (!res.ok) {
        setGenerating(false);
        setError(data.error || "Something went wrong generating the readout.");
        return;
      }
      window.location.href = `${executiveReadoutHref}?hash=${data.hash}`;
    } catch (err) {
      clearInterval(timer);
      setGenerating(false);
      setError("Network error — please try again.");
    }
  }

  return (
    <Layout
      title={`${modelName} — Assessment`}
      crumb={
        <>
          <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
          <Link href="/assessments">Maturity Model Assessments</Link> / {modelName}
        </>
      }
    >
      <h1>{modelTitle}</h1>
      <p className="dek">
        Self-score your organization across {dimensions.length} dimensions.
        Download a summary, or generate an AI-assisted Executive Readout.
      </p>

      <div className="assess-tool">
        <div className="assess-banner">
          <strong>How to use:</strong> select any dimension on the left. Evaluate your
          organization&rsquo;s maturity — for each level, everything in the definition must be
          true to merit that level. The Executive Readout unlocks once all {dimensions.length}{" "}
          dimensions are graded.
        </div>

        <div className="assess-body">
          <div className="assess-left">
            {dimensions.map((d) => {
              const grade = scores[d.id];
              const isSelected = selectedDim === d.id;
              return (
                <button
                  key={d.id}
                  className={`assess-pill${grade ? " is-graded" : ""}${isSelected ? " is-selected" : ""}`}
                  onClick={() => setSelectedDim(d.id)}
                >
                  <span className="assess-pill-label">
                    <span className="assess-pill-id">{d.id}</span>
                    <span className="assess-pill-name">{d.name}</span>
                  </span>
                  {grade && <span className="assess-pill-grade">{grade}</span>}
                </button>
              );
            })}
          </div>

          <div className="assess-right">
            <div className="assess-dim-head">
              <span>{dim.id}</span>
              {scores[dim.id] && <span className="assess-dim-grade">{scores[dim.id]}</span>}
            </div>
            <h2 className="assess-dim-name">{dim.name}</h2>
            <p className="assess-dim-desc">{dim.desc}</p>

            <div className="assess-levels">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  className={`assess-level-btn${scores[dim.id] === l ? " is-selected" : ""}`}
                  onClick={() => selectLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>

            {scores[dim.id] ? (
              <div className="assess-level-def">
                <div className="assess-level-def-label">Level {scores[dim.id]} — definition</div>
                <p>{dim.levels[scores[dim.id]]}</p>
              </div>
            ) : (
              <div style={{ height: 20 }} />
            )}

            {gradedCount > 0 && (
              <div className="assess-chart-wrap">
                <div className="assess-chart-label">Maturity profile</div>
                <div className="assess-chart-canvas">
                  <Radar
                    data={{
                      labels: dimensions.map((d) => d.id),
                      datasets: [
                        {
                          data: dimensions.map((d) => (scores[d.id] ? LEVELS.indexOf(scores[d.id]) + 1 : 0)),
                          backgroundColor: "rgba(146,99,24,0.15)",
                          borderColor: "var(--orange, #926318)",
                          pointBackgroundColor: "#926318",
                          pointBorderColor: "#926318",
                          pointRadius: 3,
                          borderWidth: 1.5,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        r: {
                          min: 0,
                          max: 5,
                          ticks: {
                            stepSize: 1,
                            callback: (v) => ["", "A", "B", "C", "D", "E"][v] || "",
                            color: "#8b9aa8",
                            backdropColor: "transparent",
                          },
                          grid: { color: "#2a3844" },
                          angleLines: { color: "#2a3844" },
                          pointLabels: { color: "#b7c4d1", font: { size: 11 } },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => (ctx.raw > 0 ? `Level ${["", "A", "B", "C", "D", "E"][ctx.raw]}` : "Not graded"),
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="assess-bottom">
          <div className="assess-progress">
            <div className="assess-progress-track">
              <div className="assess-progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <span className="assess-progress-label">{gradedCount} / {dimensions.length}</span>
          </div>
          <button className="assess-btn assess-btn-blue" onClick={downloadMd} disabled={!allGraded}>
            Download .md
          </button>
          <button className="assess-btn assess-btn-orange" onClick={tryExecutiveReadout} disabled={!allGraded || generating}>
            Executive Readout →
          </button>
        </div>
      </div>

      {error && <p className="assess-error">{error}</p>}

      <p className="footnote" style={{ textAlign: "center", marginTop: 14 }}>
        <a href={repoUrl} target="_blank" rel="noopener noreferrer">
          {modelFullName}
        </a>{" "}
        © 2026 David Facer —{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
        <br />
        Dimensions are scored independently — no averaged score is computed; the profile above is the result.
        <br />
        Content pinned to commit <code>{sourceCommit.slice(0, 7)}</code> of the canonical model repo.
      </p>

      {generating && (
        <div className="assess-modal-backdrop">
          <div className="assess-modal">
            <div className="assess-modal-title">Creating Executive Readout</div>
            <div className="assess-modal-message">{READOUT_MESSAGES[readoutMsgIndex]}</div>
          </div>
        </div>
      )}
    </Layout>
  );
}
