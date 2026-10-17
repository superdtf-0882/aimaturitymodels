// SDLC read through the family parser (OKF-TOGAF#205, STD-MODEL-PARTS v1.1 §7.2).
// From SDLC v1.4.3 the matrix and the shared layer are in the family's common form,
// which lib/dimension-parser.js does not read: its transition pattern takes the bare
// "**Transition from A to B**" marker, and SDLC's carry their titles after it. So the
// site reads SDLC with lib/model-parser.js, the family's one reader, vendored byte for
// byte from the practice's model template (scripts/model-parser-vendored-self-test.js
// holds its hash), and this file maps that shape onto the fields the Whole-Model View
// and the assessment page already use. One core, a thin adapter.
//
// The pages read as they did. The parser joins a field's paragraphs with a blank line,
// and the site's own reader joined them with a space, so the adapter joins with a space.
// The layer's three vantage paragraphs are their own field in the family's shape; the
// pages have no place for one and showed each after its level E, so it is put there.
// Transition titles are read and not shown, as before.
//
// D1-D3 come from the shared layer and D4-D13 from the matrix, the one home of their
// transitions and verification lines (§3.2); sdlc_transition_states_d4_d13.md is retired
// at v1.4.3. Other models keep lib/dimension-parser.js until their own layout releases.
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

// Every dimension the two files render, keyed by id: D1-D3 from the layer, D4-D13 from
// the matrix, whose D1-D3 section is a basis line and no levels.
function readSdlcDimensions(sharedMd, matrixMd) {
  const rendered = (md) => parseModel(md).dimensions.filter((d) => d.status !== "inherited");
  return new Map([...rendered(sharedMd), ...rendered(matrixMd)].map((d) => [d.id, toView(d)]));
}

module.exports = { readSdlcDimensions };
