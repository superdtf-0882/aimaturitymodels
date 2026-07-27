import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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

const TOOLTIP_WIDTH = 320;
const TOOLTIP_MARGIN = 10;

// Positioned from the hovered cell's own getBoundingClientRect(), not
// CSS anchoring -- the grid sits inside a horizontally-scrolling
// .grid-wrap, so a CSS-positioned tooltip would get clipped by that
// container's own overflow. Portaled to <body> instead (see the main
// component), which sidesteps that entirely. Clamped horizontally to
// the viewport; flips above the cell when there isn't room below.
function CellTooltip({ dim, level, rect }) {
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  left = Math.max(TOOLTIP_MARGIN, Math.min(left, viewportW - TOOLTIP_WIDTH - TOOLTIP_MARGIN));
  const placeAbove = rect.top > viewportH / 2;
  const positionStyle = placeAbove
    ? { bottom: viewportH - rect.top + 8 }
    : { top: rect.bottom + 8 };

  return (
    <div
      className="wmv-tooltip"
      style={{ position: "fixed", left, width: TOOLTIP_WIDTH, ...positionStyle }}
    >
      <div className="wmv-tooltip-head">
        <span
          className="wmv-panel-level"
          style={{
            "--cell-fill": `var(--lvl-${level.toLowerCase()}-fill)`,
            "--cell-border": `var(--lvl-${level.toLowerCase()}-border)`,
          }}
        >
          {level}
        </span>
        <span className="wmv-panel-name">{LEVEL_NAMES[level]}</span>
      </div>
      <p className="wmv-tooltip-id">{dim.id} &middot; {dim.name}</p>
      <p className="wmv-tooltip-def">{dim.levels[level]}</p>
      <p className="wmv-tooltip-hint">Click for transition &amp; full detail &rarr;</p>
    </div>
  );
}

// 2026-07-27 revision: hover and click are two genuinely independent
// tiers now, not one state shared between a transient preview and a
// held-open panel -- the earlier version drove both from the same
// `openCell`, so "hover to preview" silently updated a panel sitting
// below a 65-cell grid where nobody could see it happen (reported live
// as "hover/click does nothing", correctly -- nothing OBSERVABLE did).
// Hover now shows `hoverInfo`: a small tooltip, portaled to <body> and
// positioned from the hovered cell's own bounding rect, holding just
// the Definition text plus a "click for more" hint. Click/focus/hash
// still drive `openCell`/`held` as before, but that panel is now a
// fixed bar docked to the viewport bottom (`.wmv-panel-fixed`) --
// always in view the instant it opens, not scrolled past. The hover
// tooltip is suppressed once a panel is held open (both visible at
// once reads as two competing popups, not a preview-then-detail flow).
export default function WholeModelView({ dimensions, sourceCommit }) {
  const [openCell, setOpenCell] = useState(null); // { dimId, level } | null -- click/focus/hash tier
  const [held, setHeld] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null); // { dimId, level, rect } | null -- hover tier
  const panelRef = useRef(null);

  useEffect(() => {
    // Runs on initial mount AND on hashchange -- a hash-only URL change
    // (a shared #d6-c link opened while this page is already loaded,
    // or browser back/forward) does not remount the component, so a
    // mount-only effect would miss it. Found by testing the deep-link
    // against a live, already-loaded tab, not assumed to work.
    function openFromHash() {
      const m = window.location.hash.replace("#", "").match(/^d(\d+)-([a-e])$/i);
      if (!m) return;
      const dimId = `D${m[1]}`;
      const level = m[2].toUpperCase();
      if (dimensions.some((d) => d.id === dimId)) {
        setOpenCell({ dimId, level });
        setHeld(true);
      }
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
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

  function hoverOpen(e, dimId, level) {
    setHoverInfo({ dimId, level, rect: e.currentTarget.getBoundingClientRect() });
  }
  function hoverClose() {
    setHoverInfo(null);
  }
  function holdOpen(dimId, level) {
    setHoverInfo(null);
    setOpenCell({ dimId, level });
    setHeld(true);
    window.history.replaceState(null, "", `#d${dimId.replace(/^D/, "")}-${level.toLowerCase()}`);
  }

  const activeDim = openCell ? dimensions.find((d) => d.id === openCell.dimId) : null;
  const activeLevel = openCell ? openCell.level : null;
  const activeNext = activeLevel ? nextLevel(activeLevel) : null;
  const activeTransition =
    activeDim && activeNext ? activeDim.transitions[`${activeLevel}-${activeNext}`] : null;

  const hoverDim = hoverInfo ? dimensions.find((d) => d.id === hoverInfo.dimId) : null;

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
        Thirteen dimensions, five maturity levels each. Hover a cell for its
        definition; click or tab to it for the transition and full detail,
        docked below so it&rsquo;s always in view.
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
                        onMouseEnter={(e) => hoverOpen(e, dim.id, l)}
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

      {typeof document !== "undefined" && hoverDim && !held &&
        createPortal(<CellTooltip dim={hoverDim} level={hoverInfo.level} rect={hoverInfo.rect} />, document.body)}

      {held && activeDim && (
        <div
          className="wmv-panel-fixed has-content"
          ref={panelRef}
          role="dialog"
          aria-label={`${activeDim.id} Level ${activeLevel} detail`}
        >
          <button className="wmv-panel-close" onClick={closePanel} aria-label="Close">
            ×
          </button>
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

          {activeDim.transitionCaution && (
            <p className="wmv-panel-caution">&#9888; {activeDim.transitionCaution}</p>
          )}

          <div className="wmv-panel-body">
            <div className="wmv-panel-section">
              <div className="wmv-panel-label">Definition</div>
              <p>{activeDim.levels[activeLevel]}</p>
            </div>

            <div className="wmv-panel-section">
              <div className="wmv-panel-label">{activeNext ? `Transition to ${activeNext}` : "Sustainment"}</div>
              {activeNext ? (
                activeTransition ? (
                  <>
                    <p>{activeTransition.text}</p>
                    {activeTransition.verification && (
                      <p className="wmv-panel-verification">
                        <strong>Verification:</strong> {activeTransition.verification}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="wmv-panel-pending">Transition notes not yet drafted for this dimension.</p>
                )
              ) : activeDim.sustainment ? (
                <p>{activeDim.sustainment}</p>
              ) : (
                <p className="wmv-panel-pending">Sustainment notes not yet drafted for this dimension.</p>
              )}
            </div>

            <p className="wmv-panel-link">
              <Link href={`/models/sdlc/deep-dive/${activeDim.id.toLowerCase()}`}>Full Deep-Dive →</Link>
            </p>
          </div>
        </div>
      )}

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
