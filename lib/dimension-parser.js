// The dimension parser, moved out of lib/models.js on 2026-10-03 for
// OKF-TOGAF#142 so that scripts/dimension-parser-self-test.js can load it in
// plain Node (lib/models.js mixes `import` and `require` and loads only
// under Next). The function below is moved VERBATIM; its history and its
// census comment travel with it.
//
// normalizeSharedDimension is the shared-layer (D1-D3) normalization that
// getSdlcFullModel and getPdlcFullModel each carried inline, now one function.

// Parses "## D<n>. Title" sections shared by both source files into
// {id, name, desc, levels: {A..E}, transitions: {"A-B".."D-E"}} -- one
// core parser for both consumers, not two that could quietly diverge
// (SPEC-WORK-ITEM-FIBERING's "one core, many thin adapters"). Handles
// both shapes in the canonical repo: D4-D13 (ai_native_sdlc_maturity_
// model.md) currently have no transition prose between levels, so
// their `transitions` come back empty; D1-D3 (shared_intelligence_
// layer.md) do. `captureTransitions: false` (the assessment set's own
// mode, WP-AIMM-02) drops "**Transition from A to B**" prose entirely,
// same as before; `captureTransitions: true` (the single-pane reveal's
// mode) keeps it, keyed "A-B".."D-E". Branded level names are never
// introduced here either way -- letter-only, by design.
// `inlineTransitions` (added 2026-09-12 for the EA model) is the third
// arrangement this family uses, and it is a VARIANT OF THIS CORE rather
// than a third format -- which is the test the parseTransitionStates
// header below sets for when to fork instead. EA's matrix has this
// document's own dimension headers ("## D<n>. Title") and level headers
// ("**Level A — Nascent**"), and differs only in WHERE the transitions
// live: inline in the matrix, as "**Transition A → B — Label**" followed
// by prose and a "**Verification:**" clause, plus a "**Sustainment**"
// section per dimension. SDLC keeps the same content in a separate
// document under "### A → B — Label" headers, which is why
// parseTransitionStates exists and why it is not reused here.
//
// Under this option transitions come out in the {text, verification}
// shape parseTransitionStates produces, NOT as the plain strings this
// parser otherwise returns -- so an inline-transition model needs no
// normalization pass afterwards, while getSdlcFullModel's existing one
// is untouched.
//
// Measured against the EA matrix at v1.0.1 before this was written:
// 9 dimension headers, 45 level headers, 36 transition headers,
// 36 verification lines, 9 sustainment sections. The transition regex
// requires the "A → B" pair specifically because the prose contains a
// "**Transition velocity.**" line that a looser "^\*\*Transition" match
// captures as a 37th transition -- SDLC's matrix carries the same line.
function parseDimensionLevels(md, { captureTransitions = false, inlineTransitions = false } = {}) {
  const dims = [];
  let current = null;
  let activeLevel = null;
  let activeTransition = null;
  let activeSustainment = false;
  let collectingVerification = false;
  let heldTransitionText = null;
  let buffer = [];
  let collectingDesc = null;

  function flush() {
    const text = buffer.join(" ").trim();
    if (current && activeLevel) current.levels[activeLevel] = text;
    if (current && activeTransition) {
      if (inlineTransitions) {
        // The verification clause, when present, has been collecting into
        // `buffer` since its own line; the transition prose that preceded
        // it was set aside at that point.
        current.transitions[activeTransition] = collectingVerification
          ? { text: heldTransitionText, verification: text }
          : { text, verification: null };
      } else {
        current.transitions[activeTransition] = text;
      }
    }
    if (current && activeSustainment) current.sustainment = text;
    buffer = [];
    collectingVerification = false;
    heldTransitionText = null;
  }

  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const dimHeader = line.match(/^## (D\d+)\.\s+(.+)$/);
    const levelHeader = line.match(/^\*\*Level ([A-E])(?:\s*—\s*\w+)?\*\*$/);
    const transitionHeader = line.match(/^\*\*Transition from ([A-E]) to ([A-E])\*\*$/);
    // EA's inline arrangement. The A→B pair is required, not optional --
    // see this function's header for the "**Transition velocity.**" line
    // it exists to exclude.
    const inlineTransitionHeader = inlineTransitions
      && line.match(/^\*\*Transition\s+([A-E])\s*(?:→|->)\s*([A-E])\s*—.*\*\*$/);
    const sustainmentHeader = inlineTransitions && /^\*\*Sustainment\*\*$/.test(line);
    // Text begins on the same line as the label, so this is not a bare
    // header and `otherBoldHeader` below does not match it (that pattern
    // requires the line to END in "**").
    const verificationLine = inlineTransitions && line.match(/^\*\*Verification:\*\*\s*(.+)$/);
    const otherBoldHeader = line.match(/^\*\*(.+)\*\*$/);
    const descLine = line.match(/^\*(.+)\*$/);
    const rule = /^-{3,}$/.test(line);

    if (rule) {
      // Markdown horizontal-rule separator between dimensions -- without
      // this, the trailing "---" before the next "## D<n>" header gets
      // pushed into whichever level/transition buffer was still active
      // (every dimension's last section, almost always Level E), landing
      // as a stray " ---" appended to that prose. Found live in
      // production on the Whole-Model View's Level E reveal.
      flush();
      activeLevel = null;
      activeTransition = null;
      activeSustainment = false;
      continue;
    }
    if (dimHeader) {
      flush();
      current = { id: dimHeader[1], name: dimHeader[2].trim(), desc: "", levels: {}, transitions: {} };
      if (inlineTransitions) current.sustainment = null;
      dims.push(current);
      activeLevel = null;
      activeTransition = null;
      activeSustainment = false;
      continue;
    }
    if (!current) continue;

    if (levelHeader) {
      flush();
      activeLevel = levelHeader[1];
      activeTransition = null;
      activeSustainment = false;
      continue;
    }
    if (transitionHeader && captureTransitions) {
      flush();
      activeLevel = null;
      activeTransition = `${transitionHeader[1]}-${transitionHeader[2]}`;
      continue;
    }
    if (inlineTransitionHeader) {
      flush();
      activeLevel = null;
      activeSustainment = false;
      activeTransition = `${inlineTransitionHeader[1]}-${inlineTransitionHeader[2]}`;
      continue;
    }
    if (sustainmentHeader) {
      flush();
      activeLevel = null;
      activeTransition = null;
      activeSustainment = true;
      continue;
    }
    if (verificationLine && activeTransition) {
      // Not a flush: the same transition stays active. Its prose so far is
      // held aside and the buffer switches to collecting the verification
      // clause, which runs to the end of the section and can span lines.
      heldTransitionText = buffer.join(" ").trim();
      buffer = [verificationLine[1].trim()];
      collectingVerification = true;
      continue;
    }
    if (otherBoldHeader) {
      flush();
      activeLevel = null;
      activeTransition = null; // e.g. a Transition header when not captured -- prose intentionally dropped
      activeSustainment = false;
      continue;
    }
    if (!current.desc && descLine) {
      current.desc = descLine[1].trim();
      continue;
    }
    // Multi-line italic description. SDLC and PDLC keep each dimension's
    // description on one line, so the single-line pattern above was
    // sufficient until the EA matrix wrapped its own across three --
    // which produced nine dimensions with an empty desc and no error.
    // Only opens when nothing else is collecting, so it cannot swallow
    // an emphasised line inside level or transition prose.
    if (!current.desc && !activeLevel && !activeTransition && !activeSustainment
        && /^\*[^*]/.test(line) && !/\*$/.test(line)) {
      collectingDesc = [line.replace(/^\*/, "")];
      continue;
    }
    if (collectingDesc) {
      collectingDesc.push(line);
      if (/\*$/.test(line)) {
        current.desc = collectingDesc.join(" ").replace(/\*$/, "").replace(/\s+/g, " ").trim();
        collectingDesc = null;
      }
      continue;
    }
    if ((activeLevel || activeTransition || activeSustainment) && line) buffer.push(line);
  }
  flush();
  return dims;
}

// One shape for every dimension's transitions -- {text, verification} -- so
// the panel never branches on which source a dimension came from. SDLC's
// branch dropped sustainment for the shared layer; PDLC's kept whatever the
// parser produced. Both behaviours are preserved here as they stood.
function normalizeSharedDimension(dim, { keepSustainment = false } = {}) {
  dim.transitions = Object.fromEntries(
    Object.entries(dim.transitions || {}).map(([key, val]) => [
      key,
      typeof val === "string" ? { text: val, verification: null } : val,
    ])
  );
  if (!keepSustainment) dim.sustainment = null;
  else if (dim.sustainment === undefined) dim.sustainment = null;
  return dim;
}

module.exports = { parseDimensionLevels, normalizeSharedDimension };
