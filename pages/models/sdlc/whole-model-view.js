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
    // The one-sentence-per-cell digest (short_form.yml) -- this is the
    // actual content the matrix cells show. Cut entirely in the prior
    // "digested to pure shape" revision on the mistaken read that David
    // wanted cells fully blank; what he'd actually asked to drop was
    // the redundant state *label* (Nascent/Modeled/...), since the
    // column-header ovals already name that. The digest itself was
    // always meant to be there -- this was the one field getStaticProps
    // never pulled from shortForm to begin with.
    digest: shortForm.dimensions[d.id].levels,
  }));
  return { props: { dimensions, sourceCommit: fullModel.sourceCommit } };
}

const LEVELS = ["A", "B", "C", "D", "E"];

function nextLevel(l) {
  const i = LEVELS.indexOf(l);
  return i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

const POPOVER_WIDTH = 360;
const POPOVER_MARGIN = 10;
const HOVER_CLOSE_DELAY = 150;

// One popover, anchored at the hovered/clicked cell's own rect, that
// escalates in place rather than handing off between two disconnected
// UI pieces. `pinned=false` (hover): Definition only, plus a real
// "Show transition & more" button (not a decorative hint -- the
// earlier version had text that looked clickable but wasn't, only
// reachable at all via a touchscreen tapping through pointer-events:
// none). `pinned=true` (click/focus/hash): full detail -- Transition/
// Sustainment, Verification, caution, Deep-Dive link -- plus a close
// control. Portaled to <body> (the grid sits inside a horizontally
// scrolling .grid-wrap, so CSS-anchored positioning would get clipped
// by that container's own overflow); positioned from
// getBoundingClientRect(), clamped to the viewport on both axes so it
// can't run off-screen near any edge of a 13-row grid.
function CellPopover({ dim, level, rect, pinned, onExpand, onClose, onMouseEnter, onMouseLeave }) {
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

  let left = rect.left - 4;
  left = Math.max(POPOVER_MARGIN, Math.min(left, viewportW - POPOVER_WIDTH - POPOVER_MARGIN));

  // No gap between cell and popover -- overlaps the cell's own top
  // edge slightly (occludes it, per the reported fix) so the cursor
  // never has to cross dead space to reach the popover's own controls.
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

            <p className="wmv-panel-link">
              <Link href={`/models/sdlc/deep-dive/${dim.id.toLowerCase()}`}>Full Deep-Dive →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// 2026-07-27 second revision: replaced the two disconnected pieces
// (a floating hover tooltip with a dead gap that closed before you
// could reach it, and an unrelated docked bottom bar that needed
// manual closing just to get back to hovering) with one popover that
// escalates in place -- see CellPopover. `openCell` now carries the
// cell's own rect (captured on hover/click/hash) so the SAME anchored
// element can render either tier. `pinned` distinguishes transient
// hover-preview from click/focus/hash-held detail. A short close delay
// (HOVER_CLOSE_DELAY) covers the mouse briefly crossing between the
// cell and the portaled popover -- they're disconnected in the DOM, so
// without it, leaving the cell's own box closes the popover before the
// cursor ever reaches it, which is exactly the bug reported live.
// Pinned popovers close on scroll rather than trying to re-anchor --
// they're positioned from a rect captured once, and a page can scroll
// vertically outside the grid's own horizontal-only overflow.
export default function WholeModelView({ dimensions, sourceCommit }) {
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
    // Runs on initial mount AND on hashchange -- a hash-only URL change
    // (a shared #d6-c link opened while this page is already loaded,
    // or browser back/forward) does not remount the component.
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
    // Anchored from a rect captured once -- rather than re-measuring on
    // every scroll tick, close on scroll (capture:true catches the
    // grid's own inner horizontal scroll too, which doesn't bubble).
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
                        data-cell-id={`${dim.id}-${l}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${dim.id} Level ${l}, ${LEVEL_NAMES[l]} — ${dim.name}`}
                        style={{
                          "--cell-fill": `var(--lvl-${l.toLowerCase()}-fill)`,
                          "--cell-border": `var(--lvl-${l.toLowerCase()}-border)`,
                        }}
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
