import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Layout from "./Layout";
import { LEVEL_NAMES } from "../lib/levelVocabulary";

// Shared by all three models' Whole-Model Views (SDLC, PDLC,
// Prioritization) -- originally built for SDLC alone
// (pages/models/sdlc/whole-model-view.js), extracted here once PDLC and
// Prioritization needed the identical interaction with different data
// and, for now, no Deep-Dive pages of their own (`deepDiveBasePath`
// null/undefined renders dimension names and the popover's own link as
// plain text instead of a Link -- there's nowhere yet for it to go).

const LEVELS = ["A", "B", "C", "D", "E"];

function nextLevel(l) {
  const i = LEVELS.indexOf(l);
  return i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

const POPOVER_WIDTH = 360;
const POPOVER_MARGIN = 10;
const HOVER_CLOSE_DELAY = 150;

function CellPopover({ dim, level, rect, pinned, deepDiveBasePath, onExpand, onClose, onMouseEnter, onMouseLeave }) {
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

  let left = rect.left - 4;
  left = Math.max(POPOVER_MARGIN, Math.min(left, viewportW - POPOVER_WIDTH - POPOVER_MARGIN));

  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;
  const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
  const positionStyle = placeAbove
    ? { bottom: viewportH - rect.top - 6, maxHeight: Math.max(160, rect.top + 6 - POPOVER_MARGIN) }
    : { top: rect.top - 6, maxHeight: Math.max(160, viewportH - rect.top + 6 - POPOVER_MARGIN) };

  const activeNext = nextLevel(level);
  const activeTransition = activeNext ? dim.transitions[`${level}-${activeNext}`] : null;

  return (
    <div
      className={`wmv-popover${pinned ? " is-pinned" : ""}`}
      style={{ position: "fixed", left, width: POPOVER_WIDTH, ...positionStyle }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={pinned ? "dialog" : undefined}
      aria-label={pinned ? `${dim.id} Level ${level} detail` : undefined}
    >
      {pinned && (
        <button className="wmv-panel-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
      <div className="wmv-panel-head">
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
        <span className="wmv-panel-id">{dim.id} &middot; {dim.name}</span>
      </div>

      {pinned && dim.transitionCaution && (
        <p className="wmv-panel-caution">&#9888; {dim.transitionCaution}</p>
      )}

      <div className="wmv-panel-body">
        <div className="wmv-panel-section">
          <div className="wmv-panel-label">Definition</div>
          <p>{dim.levels[level]}</p>
        </div>

        {!pinned && (
          <button className="wmv-popover-expand" onClick={onExpand}>
            Show transition &amp; more &rarr;
          </button>
        )}

        {pinned && (
          <>
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
              ) : dim.sustainment ? (
                <p>{dim.sustainment}</p>
              ) : (
                <p className="wmv-panel-pending">Sustainment notes not yet drafted for this dimension.</p>
              )}
            </div>

            {deepDiveBasePath && (
              <p className="wmv-panel-link">
                <Link href={`${deepDiveBasePath}/${dim.id.toLowerCase()}`}>Full Deep-Dive →</Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WholeModelView({
  dimensions,
  sourceCommit,
  modelLabel,
  dimensionCountLabel,
  deepDiveBasePath, // e.g. "/models/sdlc/deep-dive" -- null/undefined if this model has none yet
  crumbLabel, // e.g. "AI-Native SDLC"
  crumbHref, // e.g. "/models/sdlc/whole-model-view"
}) {
  const [openCell, setOpenCell] = useState(null); // { dimId, level, rect } | null
  const [pinned, setPinned] = useState(false);
  const popoverRef = useRef(null);
  const closeTimerRef = useRef(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpenCell((c) => (pinned ? c : null)), HOVER_CLOSE_DELAY);
  }, [cancelClose, pinned]);

  const closePopover = useCallback(() => {
    cancelClose();
    setOpenCell(null);
    setPinned(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [cancelClose]);

  useEffect(() => {
    function openFromHash() {
      const m = window.location.hash.replace("#", "").match(/^d(\d+)-([a-e])$/i);
      if (!m) return;
      const dimId = `D${m[1]}`;
      const level = m[2].toUpperCase();
      if (!dimensions.some((d) => d.id === dimId)) return;
      const cellEl = document.querySelector(`[data-cell-id="${dimId}-${level}"]`);
      if (!cellEl) return;
      setOpenCell({ dimId, level, rect: cellEl.getBoundingClientRect() });
      setPinned(true);
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [dimensions]);

  useEffect(() => {
    if (!pinned) return;
    function onKeyDown(e) {
      if (e.key === "Escape") closePopover();
    }
    function onPointerDown(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !e.target.closest(".cell-hit")) {
        closePopover();
      }
    }
    function onScroll() {
      closePopover();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [pinned, closePopover]);

  function cellEnter(e, dimId, level) {
    cancelClose();
    if (!pinned) setOpenCell({ dimId, level, rect: e.currentTarget.getBoundingClientRect() });
  }
  function cellLeave() {
    scheduleClose();
  }
  function pinOpen(dimId, level, rect) {
    cancelClose();
    setOpenCell({ dimId, level, rect });
    setPinned(true);
    window.history.replaceState(null, "", `#d${dimId.replace(/^D/, "")}-${level.toLowerCase()}`);
  }

  const activeDim = openCell ? dimensions.find((d) => d.id === openCell.dimId) : null;

  return (
    <Layout
      title={`${modelLabel} — Whole-Model View`}
      wide
      crumb={
        <>
          <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
          <Link href="/models">AI-Native Maturity Models</Link> /{" "}
          <Link href={crumbHref}>{crumbLabel}</Link> / Whole-Model View
        </>
      }
    >
      <h1>{modelLabel} &mdash; Whole-Model View</h1>
      <p className="dek">
        {dimensionCountLabel}, five maturity levels each. Hover a cell for its
        definition; click it (or the popover&rsquo;s own link) for the
        transition and full detail.
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
                  {deepDiveBasePath ? (
                    <Link href={`${deepDiveBasePath}/${dim.id.toLowerCase()}`}>{dim.id}</Link>
                  ) : (
                    <span>{dim.id}</span>
                  )}
                  {dim.title}
                </td>
                {LEVELS.map((l) => {
                  const isOpen = openCell && openCell.dimId === dim.id && openCell.level === l;
                  return (
                    <td className="cell" key={l}>
                      <div
                        className={`cell-hit${isOpen ? " is-open" : ""}`}
                        data-cell-id={`${dim.id}-${l}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${dim.id} Level ${l}, ${LEVEL_NAMES[l]} — ${dim.name}`}
                        onMouseEnter={(e) => cellEnter(e, dim.id, l)}
                        onMouseLeave={cellLeave}
                        onFocus={(e) => pinOpen(dim.id, l, e.currentTarget.getBoundingClientRect())}
                        onClick={(e) => pinOpen(dim.id, l, e.currentTarget.getBoundingClientRect())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            pinOpen(dim.id, l, e.currentTarget.getBoundingClientRect());
                          }
                        }}
                      >
                        {dim.digest[l]}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {typeof document !== "undefined" && openCell && activeDim &&
        createPortal(
          <CellPopover
            dim={activeDim}
            level={openCell.level}
            rect={openCell.rect}
            pinned={pinned}
            deepDiveBasePath={deepDiveBasePath}
            onExpand={() => pinOpen(openCell.dimId, openCell.level, openCell.rect)}
            onClose={closePopover}
            onMouseEnter={cancelClose}
            onMouseLeave={cellLeave}
          />,
          document.body
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
