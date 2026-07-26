import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Layout from "../../../components/Layout";
import { getSdlcShortForm, getSdlcFullModel, SDLC_DIMENSION_ORDER } from "../../../lib/models";
import { LEVEL_NAMES } from "../../../lib/levelVocabulary";

export async function getStaticProps() {
  const [shortForm, fullModel] = await Promise.all([getSdlcShortForm(), getSdlcFullModel()]);
  const dimensions = fullModel.dimensions.map((d) => ({
    ...d,
    title: shortForm.dimensions[d.id].title,
    flag: shortForm.dimensions[d.id].flag || null,
  }));
  return { props: { dimensions, sourceCommit: fullModel.sourceCommit } };
}

const LEVELS = ["A", "B", "C", "D", "E"];

function nextLevel(l) {
  const i = LEVELS.indexOf(l);
  return i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

// 2026-07-26 alignment: the matrix is digested (shape only -- color,
// no prose, no per-cell label; the ovular column headers already name
// the state). Progressive disclosure lives in this reveal panel:
// Definition (always available) + Transition Notes (only where the
// canonical model actually has them today -- D1-D3; D4-D13 show that
// honestly rather than papering over it) or Sustainment at Level E
// (not yet authored anywhere, shown the same honest way). Hover
// previews transiently; click or keyboard focus holds it open and
// writes a shareable #d6-c hash; Escape, outside-click, or the close
// control dismiss a held-open panel.
export default function WholeModelView({ dimensions, sourceCommit }) {
  const [openCell, setOpenCell] = useState(null); // { dimId, level } | null
  const [held, setHeld] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const m = window.location.hash.replace("#", "").match(/^d(\d+)-([a-e])$/i);
    if (!m) return;
    const dimId = `D${m[1]}`;
    const level = m[2].toUpperCase();
    if (dimensions.some((d) => d.id === dimId)) {
      setOpenCell({ dimId, level });
      setHeld(true);
    }
  }, [dimensions]);

  const closePanel = useCallback(() => {
    setOpenCell(null);
    setHeld(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    if (!held) return;
    function onKeyDown(e) {
      if (e.key === "Escape") closePanel();
    }
    function onPointerDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest(".cell-hit")) {
        closePanel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [held, closePanel]);

  function hoverOpen(dimId, level) {
    if (!held) setOpenCell({ dimId, level });
  }
  function hoverClose() {
    if (!held) setOpenCell(null);
  }
  function holdOpen(dimId, level) {
    setOpenCell({ dimId, level });
    setHeld(true);
    window.history.replaceState(null, "", `#d${dimId.replace(/^D/, "")}-${level.toLowerCase()}`);
  }

  const activeDim = openCell ? dimensions.find((d) => d.id === openCell.dimId) : null;
  const activeLevel = openCell ? openCell.level : null;
  const activeNext = activeLevel ? nextLevel(activeLevel) : null;
  const activeTransitionText =
    activeDim && activeNext ? activeDim.transitions[`${activeLevel}-${activeNext}`] : null;

  return (
    <Layout
      title="SDLC — Whole-Model View"
      wide
      crumb={
        <>
          <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
          <Link href="/models">AI-Native Maturity Models</Link> /{" "}
          <Link href="/models/sdlc/whole-model-view">AI-Native SDLC</Link> / Whole-Model View
        </>
      }
    >
      <h1>AI-Native SDLC &mdash; Whole-Model View</h1>
      <p className="dek">
        Thirteen dimensions, five maturity levels each. Hover a cell to preview its
        definition; click or tab to it to hold the panel open and get a shareable link.
      </p>
      <div className="grid-wrap">
        <table className="wmv">
          <thead>
            <tr>
              <th className="dim-th">Dimension</th>
              {LEVELS.map((l) => (
                <th key={l} className="level-th">
                  <span
                    className="level-badge"
                    style={{
                      "--badge-fill": `var(--lvl-${l.toLowerCase()}-fill)`,
                      "--badge-border": `var(--lvl-${l.toLowerCase()}-border)`,
                    }}
                  >
                    <span className="level-badge-letter">{l}</span>
                    <span className="level-badge-name">{LEVEL_NAMES[l]}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dim) => (
              <tr key={dim.id}>
                <td className="dim">
                  <Link href={`/models/sdlc/deep-dive/${dim.id.toLowerCase()}`}>{dim.id}</Link>
                  {dim.title}
                  {dim.flag && <div className="flag-tag">⚠ {dim.flag}</div>}
                </td>
                {LEVELS.map((l) => {
                  const isOpen = openCell && openCell.dimId === dim.id && openCell.level === l;
                  return (
                    <td className="cell" key={l}>
                      <div
                        className={`cell-hit${isOpen ? " is-open" : ""}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${dim.id} Level ${l}, ${LEVEL_NAMES[l]} — ${dim.name}`}
                        style={{
                          "--cell-fill": `var(--lvl-${l.toLowerCase()}-fill)`,
                          "--cell-border": `var(--lvl-${l.toLowerCase()}-border)`,
                        }}
                        onMouseEnter={() => hoverOpen(dim.id, l)}
                        onMouseLeave={hoverClose}
                        onFocus={() => holdOpen(dim.id, l)}
                        onClick={() => holdOpen(dim.id, l)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            holdOpen(dim.id, l);
                          }
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`wmv-panel${activeDim ? " has-content" : ""}`}
        ref={panelRef}
        role={held ? "dialog" : undefined}
        aria-label={held && activeDim ? `${activeDim.id} Level ${activeLevel} detail` : undefined}
      >
        {!activeDim && <p className="wmv-panel-empty">Hover or select a cell above to see its definition.</p>}
        {activeDim && (
          <>
            {held && (
              <button className="wmv-panel-close" onClick={closePanel} aria-label="Close">
                ×
              </button>
            )}
            <div className="wmv-panel-head">
              <span
                className="wmv-panel-level"
                style={{
                  "--cell-fill": `var(--lvl-${activeLevel.toLowerCase()}-fill)`,
                  "--cell-border": `var(--lvl-${activeLevel.toLowerCase()}-border)`,
                }}
              >
                {activeLevel}
              </span>
              <span className="wmv-panel-name">{LEVEL_NAMES[activeLevel]}</span>
              <span className="wmv-panel-id">{activeDim.id} &middot; {activeDim.name}</span>
            </div>

            <div className="wmv-panel-section">
              <div className="wmv-panel-label">Definition</div>
              <p>{activeDim.levels[activeLevel]}</p>
            </div>

            <div className="wmv-panel-section">
              <div className="wmv-panel-label">{activeNext ? `Transition to ${activeNext}` : "Sustainment"}</div>
              {activeNext ? (
                activeTransitionText ? (
                  <p>{activeTransitionText}</p>
                ) : (
                  <p className="wmv-panel-pending">Transition notes not yet drafted for this dimension.</p>
                )
              ) : (
                <p className="wmv-panel-pending">Sustainment notes not yet drafted for this dimension.</p>
              )}
            </div>

            {held && (
              <p className="wmv-panel-link">
                <Link href={`/models/sdlc/deep-dive/${activeDim.id.toLowerCase()}`}>Full Deep-Dive →</Link>
              </p>
            )}
          </>
        )}
      </div>

      <div className="legend">
        <span><span className="swatch" style={{ background: "var(--lvl-a-fill)", borderColor: "var(--lvl-a-border)" }} /> A &mdash; Nascent</span>
        <span><span className="swatch" style={{ background: "var(--lvl-b-fill)", borderColor: "var(--lvl-b-border)" }} /> B &mdash; Modeled</span>
        <span><span className="swatch" style={{ background: "var(--lvl-c-fill)", borderColor: "var(--lvl-c-border)" }} /> C &mdash; Continuous</span>
        <span><span className="swatch" style={{ background: "var(--lvl-d-fill)", borderColor: "var(--lvl-d-border)" }} /> D &mdash; Integral</span>
        <span><span className="swatch" style={{ background: "var(--lvl-e-fill)", borderColor: "var(--lvl-e-border)" }} /> E &mdash; Telemetric</span>
        <span>⚠ = open review item</span>
      </div>
      <p className="footnote" style={{ marginTop: 10 }}>
        Content pinned to commit <code>{sourceCommit.slice(0, 7)}</code> of the canonical model repo.
      </p>
    </Layout>
  );
}
