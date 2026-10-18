// The models read through the family parser (OKF-TOGAF#205, STD-MODEL-PARTS v1.1 §7.2).
// Called lib/sdlc-reader.js until Product Marketing's v1.0.3, when it read SDLC alone.
// From SDLC v1.4.3 the matrix and the shared layer are in the family's common form,
// which lib/dimension-parser.js, the site's old reader, did not read: its transition pattern took the bare
// "**Transition from A to B**" marker, and SDLC's carry their titles after it. So the
// site reads SDLC with lib/model-parser.js, the family's one reader, vendored byte for
// byte from the practice's model template (scripts/model-parser-vendored-self-test.js
// holds its hash), and this file maps that shape onto the fields the Whole-Model View
// and the assessment page already use. One core, a thin adapter.
//
// The pages read as they did. The parser joins a field's paragraphs with a blank line,
// and the site's own reader joined them with a space, so the adapter joins with a space.
// The vantage paragraphs are their own field in the family's shape; the pages have no
// place for one and showed each after its level E, so it is put there. Transition
// titles are read and not shown, as before.
//
// SDLC: D1-D3 come from the shared layer and D4-D13 from the matrix, the one home of
// their transitions and verification lines (§3.2); sdlc_transition_states_d4_d13.md is
// retired at v1.4.3. Product Marketing, from v1.0.3: every dimension from its matrix,
// D1-D3 and D10 included, which it renders from their sources (§4B); its own
// `**Vantage:**` marker would otherwise reach level E's text through the site's reader.
// Portfolio Prioritization from v1.4.3 and EA from v1.1.4: every dimension from the matrix.
// PDLC, from v1.2.5: D1-D3 from the layer at SDLC's tag and D4-D12 from the matrix, whose
// D1-D3 range heading renders nothing. With PDLC every model is read here, and the old
// reader and the site's table reader were removed.
const { parseModel, LEVELS } = require("./model-parser");

const spaced = (s) => (s == null ? null : s.replace(/\n\n/g, " "));

function toView(d) {
  const levels = {};
  for (const L of LEVELS) levels[L] = spaced(d.levels[L]);
  if (d.vantage) levels.E = levels.E + " " + spaced(d.vantage);
  const transitions = {};
  for (const [key, t] of Object.entries(d.transitions)) transitions[key] = { text: spaced(t.text), verification: spaced(t.verification) };
  return { id: d.id, name: d.name, desc: spaced(d.definition) || "", levels, transitions, sustainment: spaced(d.sustainment) };
}

// Every dimension the files render, keyed by id. A range heading (`## D1–D3.`) names its
// source and renders nothing, so its dimensions are left out; an inherited dimension the
// file renders, under its own heading, is read like a native one.
function readModelDimensions(...mds) {
  const rendered = (md) => parseModel(md).dimensions.filter((d) => d.rendered !== false);
  return new Map(mds.flatMap(rendered).map((d) => [d.id, toView(d)]));
}

// SDLC's two files: D1-D3 from the layer, D4-D13 from the matrix, whose D1-D3 section is
// a range heading with a basis line and no levels.
const readSdlcDimensions = (sharedMd, matrixMd) => readModelDimensions(sharedMd, matrixMd);

module.exports = { readModelDimensions, readSdlcDimensions };
