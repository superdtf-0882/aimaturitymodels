import { useMemo, useState } from "react";
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
import useAddressState from "./useAddressState";
// OKF-TOGAF#161: the file builder and the grading rule live in plain CommonJS
// libraries so scripts/threshold-states-self-test.js can load them.
const { LEVELS, buildAssessmentMd } = require("../lib/assessment-md");
const { isGraded } = require("../lib/score-vector");
const { assessment } = require("../lib/address-codecs");

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

// Shared by the self-assessment tools of the three models that have one --
// SDLC, PDLC and Prioritization. The family is four models as of 2026-09-12;
// EA's assessment is tracked, open work, so this count is of this surface
// and not of the family. Originally built for
// SDLC alone (pages/models/sdlc/assessment.js), extracted here for issue #25
// once PDLC and Prioritization needed the identical scoring/chart/download/
// Executive-Readout interaction with different data and a different
// dimension count. `modelSlug` is sent to /api/diagnostic as `body.model` --
// the API looks up dimension count and prompt from it server-side, so this
// component never needs to know those itself beyond `dimensions.length`.

// LEVELS and buildAssessmentMd moved to lib/assessment-md.js (OKF-TOGAF#161).

// The threshold-state buttons keep the level buttons' size, so their labels
// are short, on the owner's word ("How about Pre AI wrapped and Exmt?", then
// "Xmpt is better, more phonetic"). The score stored, written to the file and
// read by the readout stays the full name; screen readers and the hover
// tooltip get it too.
const STATE_LABELS = { "Pre-AI": <>Pre<br />AI</>, "Exempt": "Xmpt" };

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
  // OKF-TOGAF#161: { preAi, exempt } -- the two threshold states' meanings,
  // read from the model's own text at its pin -- or absent for a model that
  // defines neither (PDLC and Prioritization today): A to E only.
  thresholdStates = null,
}) {
  // Issue #29: D1 starts pre-graded at level A so a first-time visitor
  // sees what a graded cell looks like before doing anything themselves --
  // context for how to engage the assessment, not a real default score.
  // (The default now lives in the codec's initial state.)
  //
  // OKF-TOGAF#130: the dimension in view and the grades live in the address
  // (#dim=d3&grades=d1-a,d3-c). Choosing a dimension is a view and adds a
  // history step; a grade is an answer and only updates the address, so Back
  // walks back through dimensions, never through grades, and a reload or a
  // return restores every grade. The typed Exempt reasons are never written
  // to the address, on the owner's ruling: they survive an in-page Back and
  // are re-entered after a reload or a return.
  const codec = useMemo(
    () => assessment(dimensions.map((d) => d.id), { thresholdStates: !!thresholdStates }),
    [dimensions, thresholdStates]
  );
  const [{ dim: selectedDim, scores, exemptReasons }, commit] = useAddressState(codec);
  const setSelectedDim = (id) => commit((prev) => ({ ...prev, dim: id }), { step: true });
  const [generating, setGenerating] = useState(false);
  const [readoutMsgIndex, setReadoutMsgIndex] = useState(0);
  const [error, setError] = useState(null);

  const dim = dimensions.find((d) => d.id === selectedDim);
  // Exempt counts only with its reason: the models say an exemption without a
  // citable constraint is not Exempt.
  const gradedCount = dimensions.filter((d) => isGraded(scores[d.id], exemptReasons[d.id])).length;
  const allGraded = gradedCount === dimensions.length;
  const pct = (gradedCount / dimensions.length) * 100;

  function selectLevel(letter) {
    commit((prev) => {
      const next = { ...prev.scores };
      if (next[prev.dim] === letter) delete next[prev.dim];
      else next[prev.dim] = letter;
      return { ...prev, scores: next };
    });
  }

  function downloadMd() {
    const md = buildAssessmentMd({ modelTitle, modelFullName, repoUrl, dimensions, scores, exemptReasons });
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
        body: JSON.stringify({ model: modelSlug, md: buildAssessmentMd({ modelTitle, modelFullName, repoUrl, dimensions, scores, exemptReasons }) }),
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
          <a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com /{" "}
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
          {thresholdStates && (
            <> Pre-AI and Exempt sit outside the A–E scale; an Exempt dimension needs the constraint it rests on.</>
          )}
        </div>

        <div className="assess-body">
          <div className="assess-left">
            {dimensions.map((d) => {
              const grade = isGraded(scores[d.id], exemptReasons[d.id]) ? scores[d.id] : null;
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
              {thresholdStates &&
                ["Pre-AI", "Exempt"].map((st) => (
                  <button
                    key={st}
                    className={`assess-level-btn assess-state-btn${scores[dim.id] === st ? " is-selected" : ""}`}
                    onClick={() => selectLevel(st)}
                    aria-label={st}
                    title={st}
                  >
                    {STATE_LABELS[st]}
                  </button>
                ))}
            </div>

            {scores[dim.id] === "Pre-AI" || scores[dim.id] === "Exempt" ? (
              <div className="assess-level-def">
                <div className="assess-level-def-label">{scores[dim.id]} — outside the A–E scale</div>
                <p>{scores[dim.id] === "Pre-AI" ? thresholdStates.preAi : thresholdStates.exempt}</p>
                {scores[dim.id] === "Exempt" && (
                  <label className="assess-exempt-reason">
                    <span>The constraint this rests on (regulatory, contractual, or corporate policy):</span>
                    <input
                      type="text"
                      maxLength={200}
                      value={exemptReasons[dim.id] || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        // The reason changes only the page's own state; the
                        // address it writes is unchanged, so nothing is added.
                        commit((prev) => ({ ...prev, exemptReasons: { ...prev.exemptReasons, [dim.id]: v } }));
                      }}
                      placeholder="e.g. Regulatory: a sector rule restricts AI use in this activity"
                    />
                  </label>
                )}
              </div>
            ) : scores[dim.id] ? (
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
                          data: dimensions.map((d) => (LEVELS.includes(scores[d.id]) ? LEVELS.indexOf(scores[d.id]) + 1 : 0)),
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
