import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import Link from "next/link";
import Layout from "./Layout";
import { LEVEL_NAMES } from "../lib/levelVocabulary";

// Shared by all three models' Whole-Model Views (SDLC, PDLC,
// Prioritization) -- originally built for SDLC alone
// (pages/models/sdlc/whole-model-view.js), extracted here once PDLC and
// Prioritization needed the identical interaction with different data.
// `deepDiveBasePath` started null/undefined for PDLC and Prioritization
// (no Deep-Dive pages existed yet, so dimension names and the popover's
// own link rendered as plain text instead of a Link); both now point at
// real routes, since all three models have Deep-Dive pages.
//
// ===========================================================================
// MOVE 2, 2026-09-11 -- the navigation pass. OKF-TOGAF#118's successor,
// specified in briefs/2026-09-11-level-header/02-DTOG, geometry ruled in
// 05-DT2, and given the go by David: "Move 2 is a go. Rail on SDLC and PDLC,
// below-layout on Prioritization per 05-DT2. Design floor is 1920x1200; below
// that, horizontal scroll is accepted -- no responsive breakpoint, no cap
// change."
//
// WHAT IT REPLACED: hover revealed a definition, click revealed transitions,
// click again reached the rest. Three interactions to read one cell, two of
// them disclosures. THE RULE NOW: three scopes, three places, nothing hidden.
//   * the MATRIX is the model    -- every row, every column
//   * the RAIL   is the cell     -- one row, one column
//   * the BAND   is the dimension -- one row, all five columns
// Selection REPLACES content; it never uncovers it. No hover state carries
// meaning, and there is no <details> anywhere -- a disclosure inside the fix
// for disclosures is the page arguing against itself.
// ===========================================================================

const LEVELS = ["A", "B", "C", "D", "E"];

// Header rule lengths, A->E. Ordinality is a true property of A-E and
// deserves an encoding; LENGTH says "further along" where HUE says
// "better or worse". A bar has no scale, no units and no zero, so it
// cannot be totalled and carries no valence -- nothing about a short bar
// says failure, where #a32d2d does. If it ever reads as ornament it is
// the first thing to cut, and the header survives without it.
// (briefs/2026-09-11-level-header/01- section 2, OKF-TOGAF#118.)
// David reviewed it live 2026-09-11: "It reads as a progression."
const BAR_WIDTHS = [22, 34, 46, 58, 70];

const RAIL_WIDTH = 360;   // 02-DTOG section 3: prose runs ~337px, ~47 chars.
const RAIL_GAP = 24;
const RAIL_STICKY_TOP = 24;

// ---------------------------------------------------------------------------
// GEOMETRY BY MODEL -- 05-DT2's ruling, and the ONE place it is decided.
//
// "The family's uniformity lives in the pattern's invariants -- three scopes
// always visible, never empty, selection replaces, one click or one arrow,
// every cell addressable -- and every model carries all of them. GEOMETRY is
// per model, chosen by the measured ratio."
//
// Every model carries every invariant. Only the PLACE of the detail differs:
//   rail  -- detail beside the matrix. SDLC (13 rows), PDLC (12), EA (9).
//   below -- detail beneath at full width. Prioritization (3 rows), where the
//            rail would be TALLER than the matrix: measured, its matrix is
//            412px under the rail against a 560-750px rail, so the matrix
//            would float in a corner beside an empty column. That is not an
//            exception to the pattern; it is the pattern's second geometry.
//
// WHAT AN UNLISTED MODEL GETS: "rail", stated here rather than discovered --
// the standing-controls discipline DT2 required of kanban.js in
// briefs/2026-09-11-attestation-warrant/15-DT2 section 3, applied to this
// router for the same reason. EA is not listed because it has no page yet;
// when it lands it takes the default, which is the geometry DT2 ruled for it.
const GEOMETRY_BY_MODEL = {
  "/models/prioritization/whole-model-view": "below",
};
const DEFAULT_GEOMETRY = "rail";
function geometryFor(crumbHref) {
  return GEOMETRY_BY_MODEL[crumbHref] || DEFAULT_GEOMETRY;
}

function nextLevel(l) {
  const i = LEVELS.indexOf(l);
  return i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

// ---------------------------------------------------------------------------
// THE RAIL -- one row, one column. Rule 5: it holds only what CHANGES when you
// move. The dimension's own prose is constant across all five levels, so it
// lives in the band and not here; that is also the only reason the longest
// cell fits without the rail growing its own scrollbar.
function CellDetail({ dim, level, deepDiveBasePath, geometry }) {
  const next = nextLevel(level);
  const transition = next ? dim.transitions[`${level}-${next}`] : null;
  return (
    <div className={`wmv-detail wmv-detail--${geometry}`} aria-live="polite">
      <div className="wmv-detail-head">
        <span className="wmv-detail-level">{level}</span>
        <span className="wmv-detail-name">{LEVEL_NAMES[level]}</span>
        <span className="wmv-detail-id">{dim.id} &middot; {dim.name}</span>
      </div>

      {dim.transitionCaution && (
        <p className="wmv-detail-caution">&#9888; {dim.transitionCaution}</p>
      )}

      <div className="wmv-detail-section">
        <div className="wmv-detail-label">Definition</div>
        <p>{dim.levels[level]}</p>
      </div>

      <div className="wmv-detail-section">
        <div className="wmv-detail-label">{next ? `Transition to ${next}` : "Sustainment"}</div>
        {next ? (
          transition ? (
            <>
              <p>{transition.text}</p>
              {transition.verification && (
                <p className="wmv-detail-verification">
                  <strong>Verification:</strong> {transition.verification}
                </p>
              )}
            </>
          ) : (
            <p className="wmv-detail-pending">Transition notes not yet drafted for this dimension.</p>
          )
        ) : dim.sustainment ? (
          <p>{dim.sustainment}</p>
        ) : (
          <p className="wmv-detail-pending">Sustainment notes not yet drafted for this dimension.</p>
        )}
      </div>

      {deepDiveBasePath && (
        <p className="wmv-detail-link">
          <Link href={`${deepDiveBasePath}/${dim.id.toLowerCase()}`}>Full Deep-Dive &rarr;</Link>
        </p>
      )}
    </div>
  );
}

// THE BAND -- one row, all five columns. Rule 6: always open, row-scoped, and
// constant as you move across the levels, which is precisely why it is NOT in
// the rail. `desc` is present on all 28 dimensions across the three models;
// `sustainment` is present on 22 of 28, so "Where it ends" carries the same
// not-yet-drafted line the detail uses rather than rendering an empty section.
function DimensionBand({ dim }) {
  return (
    <section className="wmv-band" aria-live="polite">
      <div className="wmv-band-col">
        <div className="wmv-band-label">What {dim.id} measures</div>
        <p>{dim.desc}</p>
      </div>
      <div className="wmv-band-col">
        <div className="wmv-band-label">Where it ends</div>
        {dim.sustainment
          ? <p>{dim.sustainment}</p>
          : <p className="wmv-detail-pending">Sustainment notes not yet drafted for this dimension.</p>}
      </div>
    </section>
  );
}

export default function WholeModelView({
  dimensions,
  sourceCommit,
  currencyBasis,
  modelLabel,
  dimensionCountLabel,
  deepDiveBasePath, // e.g. "/models/sdlc/deep-dive" -- null/undefined if this model has none yet
  crumbLabel, // e.g. "AI-Native SDLC"
  crumbHref, // e.g. "/models/sdlc/whole-model-view"
}) {
  const geometry = geometryFor(crumbHref);

  // Rule 2: NEVER EMPTY. The page opens on a real cell, so there is no null
  // state to render around and no "nothing selected" branch anywhere below.
  const [sel, setSel] = useState({ dimId: dimensions[0].id, level: "A" });
  const [railOffset, setRailOffset] = useState(0);

  const wrapRef = useRef(null);
  const railRef = useRef(null);
  const tbodyRef = useRef(null);
  const shouldFocusRef = useRef(false);

  const activeDim = dimensions.find((d) => d.id === sel.dimId) || dimensions[0];

  const select = useCallback((dimId, level, opts = {}) => {
    setSel({ dimId, level });
    if (opts.focus) shouldFocusRef.current = true;
    if (typeof window !== "undefined") {
      // Rule 7: every cell addressable. replaceState, not pushState -- arrowing
      // across a 65-cell grid must not bury the back button under 65 entries.
      window.history.replaceState(null, "", `#${dimId.toLowerCase()}-${level.toLowerCase()}`);
    }
  }, []);

  // Deep links in, both directions. The hash format (#d7-c) predates move 2
  // and is kept verbatim so every link already shared still resolves.
  useEffect(() => {
    function openFromHash() {
      const m = window.location.hash.replace("#", "").match(/^d(\d+)-([a-e])$/i);
      if (!m) return;
      const dimId = `D${m[1]}`;
      const level = m[2].toUpperCase();
      if (!dimensions.some((d) => d.id === dimId)) return;
      setSel({ dimId, level });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [dimensions]);

  // "...and the title follows" (02-DTOG rule 7).
  useEffect(() => {
    document.title = `${activeDim.id} ${sel.level} — ${modelLabel} — Whole-Model View`;
  }, [activeDim.id, sel.level, modelLabel]);

  // Rule 3: roving tabindex means the grid is ONE tab stop. When selection
  // moves by keyboard the new cell must take focus, or the next arrow key goes
  // to whatever the browser still thinks is focused.
  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    const el = tbodyRef.current?.querySelector(`[data-cell-id="${sel.dimId}-${sel.level}"]`);
    if (el) el.focus({ preventScroll: false });
  }, [sel]);

  // ---------------------------------------------------------------------
  // Rule 4: the rail ARRIVES LEVEL WITH THE ROW IT SERVES, clamped so its
  // bottom never passes the bottom of the matrix. Sticky then pins it once
  // the page scrolls past.
  //
  // useLayoutEffect, not useEffect: the offset is read and written in the same
  // frame as the selection change, so the rail does not visibly jump.
  //
  // THE TRAP THIS LAYOUT IS BUILT AROUND (02-DTOG section 4): an ancestor with
  // `overflow` other than `visible` silently makes a sticky descendant
  // non-sticky. `.grid-wrap` is `overflow-x: auto` and always has been, so THE
  // RAIL IS A SIBLING OF .grid-wrap AND NEVER A DESCENDANT OF IT. Putting it
  // inside the scroller would kill the sticky with no error and no visual clue.
  useLayoutEffect(() => {
    if (geometry !== "rail") { setRailOffset(0); return; }
    const wrap = wrapRef.current, rail = railRef.current;
    if (!wrap || !rail) return;
    const row = wrap.querySelector(`[data-cell-id="${sel.dimId}-${sel.level}"]`)?.closest("tr");
    if (!row) return;
    const raw = row.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
    const maxOffset = Math.max(0, wrap.offsetHeight - rail.offsetHeight);
    setRailOffset(Math.max(0, Math.min(raw, maxOffset)));
  }, [sel, geometry, dimensions]);

  function onGridKeyDown(e) {
    const di = dimensions.findIndex((d) => d.id === sel.dimId);
    const li = LEVELS.indexOf(sel.level);
    let next = null;
    if (e.key === "ArrowRight") next = [di, Math.min(LEVELS.length - 1, li + 1)];
    else if (e.key === "ArrowLeft") next = [di, Math.max(0, li - 1)];
    else if (e.key === "ArrowDown") next = [Math.min(dimensions.length - 1, di + 1), li];
    else if (e.key === "ArrowUp") next = [Math.max(0, di - 1), li];
    else if (e.key === "Home") next = [di, 0];
    else if (e.key === "End") next = [di, LEVELS.length - 1];
    if (!next) return;
    e.preventDefault();
    select(dimensions[next[0]].id, LEVELS[next[1]], { focus: true });
  }

  const railStyle = geometry === "rail"
    ? { marginTop: railOffset, position: "sticky", top: RAIL_STICKY_TOP }
    : undefined;

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
        {dimensionCountLabel}, five maturity levels each. Select a cell to read
        it &mdash; click, or use the arrow keys. The detail is always open.
      </p>

      <div
        className={`wmv-layout wmv-layout--${geometry}`}
        style={geometry === "rail" ? { gridTemplateColumns: `minmax(0, 1fr) ${RAIL_WIDTH}px`, gap: RAIL_GAP } : undefined}
      >
        <div className="grid-wrap" ref={wrapRef}>
          <table className="wmv">
            <thead>
              <tr>
                <th className="dim-th">Dimension</th>
                {/* The letter was never missing from this page -- it was filed
                    nine rows away, in the legend, and the ONLY thing joining
                    "A" to "Nascent" was the hue. That is what the colour ramp
                    was doing here: carrying an adjacency at a distance. Marrying
                    the two deletes the legend's level half outright.
                    `is-selected` is move 2's addition: 01-DTOG section 4b was
                    explicit that no header carried an active class and that
                    move 1 must not invent one, because column selection did not
                    exist. Move 2 creates it, so the header can now say so. */}
                {LEVELS.map((l, i) => (
                  <th key={l} className={`level-th${l === sel.level ? " is-selected" : ""}`}>
                    <span className="level-head">
                      <span className="ltr">{l}</span>
                      <span className="nm">{LEVEL_NAMES[l]}</span>
                      <span className="bar" style={{ width: BAR_WIDTHS[i] }} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={tbodyRef} onKeyDown={onGridKeyDown}>
              {dimensions.map((dim) => {
                const rowSelected = dim.id === sel.dimId;
                return (
                  <tr key={dim.id} className={rowSelected ? "is-selected" : undefined}>
                    <td className="dim">
                      {deepDiveBasePath ? (
                        <Link href={`${deepDiveBasePath}/${dim.id.toLowerCase()}`}>{dim.id}</Link>
                      ) : (
                        <span>{dim.id}</span>
                      )}
                      {dim.title}
                    </td>
                    {LEVELS.map((l) => {
                      const isSel = rowSelected && sel.level === l;
                      return (
                        <td className="cell" key={l}>
                          <div
                            className={`cell-hit${isSel ? " is-selected" : ""}`}
                            data-cell-id={`${dim.id}-${l}`}
                            /* Roving tabindex -- exactly one cell is tabbable,
                               so the 65-cell grid is ONE tab stop. */
                            tabIndex={isSel ? 0 : -1}
                            role="gridcell"
                            aria-selected={isSel}
                            aria-label={`${dim.id} Level ${l}, ${LEVEL_NAMES[l]} — ${dim.name}`}
                            onClick={() => select(dim.id, l)}
                            onFocus={() => { if (!isSel) select(dim.id, l); }}
                          >
                            {dim.digest[l]}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="wmv-rail" ref={railRef} style={railStyle}>
          <CellDetail
            dim={activeDim}
            level={sel.level}
            deepDiveBasePath={deepDiveBasePath}
            geometry={geometry}
          />
        </aside>
      </div>

      <DimensionBand dim={activeDim} />

      {/* The five level keys were cut 2026-09-11: the header now carries the
          letter beside its own name, so a swatch-to-oval colour round-trip
          has nothing left to do. The div and the review-item key STAY -- the
          legend's level half went, the legend did not. */}
      <div className="legend">
        <span>⚠ = open review item</span>
      </div>
      {/*
        CURRENCY BASIS, added 2026-08-26. This replaced "Content pinned to
        commit <sha> of the canonical model repo", which was true of PDLC
        and Prioritization and NOT TRUE OF SDLC: that page's short-form
        cells are fetched from main while its full model text is pinned,
        so the old sentence claimed one basis for a page that renders two.
        The string is computed in lib/models.js from the same constants
        the fetchers use -- never hand-written, because a hand-maintained
        currency claim is the next stale one.
      */}
      <p className="footnote" style={{ marginTop: 10 }}>
        {currencyBasis || (
          <>Content pinned to commit <code>{sourceCommit.slice(0, 7)}</code> of the canonical model repo.</>
        )}
      </p>
    </Layout>
  );
}
