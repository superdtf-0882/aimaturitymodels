// Each page's state, to and from the address. OKF-TOGAF#130.
//
// A codec has four parts, read by lib/address-state.js:
//   initial()              the state a first visit starts in
//   toParams(state)        the address's key=value pairs for that state
//   fromParams(params, base)  the state an address describes; a key it does
//                          not hold falls back to the page's default, and
//                          anything never put in the address (an Exempt
//                          reason) is carried over from `base`
//   answerKeys             the keys that are answers, kept on Back and
//                          Forward; every other key is a view
//
// Values use a plain alphabet -- lower-case ids, letters, digits and hyphens
// -- so an address reads cleanly and can be shared as it stands. The value
// matrix's initiative ids and criterion keys come from a data file, so they
// are percent-encoded.
//
// THE CLASSES, as the owner ruled (134-DT2 section 2.1, 190-CC):
//   Strata            open rows             view
//   assessment        which dimension       view
//                     grades                answer   (Exempt reasons: never)
//   whole-model view  selected cell         view     (a click adds a step,
//                                                     an arrow key replaces)
//   function model    the explainer         view
//   value matrix      the scale             answer
//                     the scores            answer

const LEVELS = ["A", "B", "C", "D", "E"];
const STATES = { "pre-ai": "Pre-AI", exempt: "Exempt" };
const tokenOf = (grade) => (LEVELS.includes(grade) ? grade.toLowerCase() : Object.keys(STATES).find((k) => STATES[k] === grade));
const byLower = (ids) => Object.fromEntries(ids.map((id) => [id.toLowerCase(), id]));
const list = (v) => (v ? String(v).split(",").filter(Boolean) : []);

function strata(codes) {
  const known = byLower(codes);
  return {
    answerKeys: [],
    initial: () => ({ open: new Set() }),
    toParams: (s) => (s.open.size ? { open: codes.filter((c) => s.open.has(c)).map((c) => c.toLowerCase()).join(",") } : {}),
    fromParams: (p) => ({ open: new Set(list(p.open).map((t) => known[t.toLowerCase()]).filter(Boolean)) }),
  };
}

// Grades are written as dimension-grade pairs: d1-b, d4-pre-ai, d6-exempt.
// `grades` is always written, even empty: a reader who cleared every grade
// must not come back to the D1 sample grade the page opens with.
function assessment(dimIds, { thresholdStates = false } = {}) {
  const known = byLower(dimIds);
  const first = dimIds[0];
  const gradeRe = /^(d\d+)-(a|b|c|d|e|pre-ai|exempt)$/;
  return {
    answerKeys: ["grades"],
    // Issue #29: D1 opens pre-graded at A, a sample of a graded cell.
    initial: () => ({ dim: first, scores: { [first]: "A" }, exemptReasons: {} }),
    toParams: (s) => ({
      dim: s.dim.toLowerCase(),
      grades: dimIds.filter((d) => s.scores[d] && tokenOf(s.scores[d])).map((d) => d.toLowerCase() + "-" + tokenOf(s.scores[d])).join(","),
    }),
    fromParams: (p, base) => {
      const dim = (p.dim && known[p.dim.toLowerCase()]) || first;
      let scores;
      if (p.grades === undefined) scores = { [first]: "A" };
      else {
        scores = {};
        for (const t of list(p.grades)) {
          const m = t.toLowerCase().match(gradeRe);
          if (!m || !known[m[1]]) continue;
          const g = m[2];
          if (STATES[g] && !thresholdStates) continue;
          scores[known[m[1]]] = STATES[g] || g.toUpperCase();
        }
      }
      return { dim, scores, exemptReasons: (base && base.exemptReasons) || {} };
    },
  };
}

// The selected cell: #cell=d3-c. Links shared in the old form, #d3-c, still
// resolve -- the matrix promised that when it first wrote cells (move 2).
function matrix(dimIds) {
  const known = byLower(dimIds);
  const cellRe = /^(d\d+)-([a-e])$/i;
  const read = (t) => {
    const m = String(t || "").match(cellRe);
    return m && known[m[1].toLowerCase()] ? { dimId: known[m[1].toLowerCase()], level: m[2].toUpperCase() } : null;
  };
  return {
    answerKeys: [],
    initial: () => ({ dimId: dimIds[0], level: "A" }),
    toParams: (s) => ({ cell: s.dimId.toLowerCase() + "-" + s.level.toLowerCase() }),
    fromParams: (p) => {
      const legacy = Object.keys(p).find((k) => p[k] === null && cellRe.test(k));
      return read(p.cell) || read(legacy) || { dimId: dimIds[0], level: "A" };
    },
  };
}

function functionModel() {
  return {
    answerKeys: [],
    initial: () => ({ explainer: false }),
    toParams: (s) => (s.explainer ? { explainer: "open" } : {}),
    fromParams: (p) => ({ explainer: p.explainer === "open" }),
  };
}

// Only scores that differ from the sample are written, as id:criterion:score.
const GEO = [1, 3, 9, 27];
function valueMatrix(initiatives, criterionKeys) {
  const defaults = () => Object.fromEntries(initiatives.map((i) => [i.id, { ...i.scores }]));
  const enc = encodeURIComponent;
  const dec = (s) => { try { return decodeURIComponent(s); } catch (e) { return null; } };
  return {
    answerKeys: ["scale", "scores"],
    initial: () => ({ geometric: true, scores: defaults() }),
    toParams: (s) => {
      const out = {};
      if (!s.geometric) out.scale = "linear";
      const changed = [];
      for (const i of initiatives) {
        for (const k of criterionKeys) {
          const v = s.scores[i.id] && s.scores[i.id][k];
          if (v !== undefined && v !== i.scores[k]) changed.push(enc(i.id) + ":" + enc(k) + ":" + v);
        }
      }
      if (changed.length) out.scores = changed.join(",");
      return out;
    },
    fromParams: (p) => {
      const scores = defaults();
      for (const t of list(p.scores)) {
        const [id, k, v] = t.split(":").map(dec);
        const n = Number(v);
        if (scores[id] && criterionKeys.includes(k) && GEO.includes(n)) scores[id][k] = n;
      }
      return { geometric: p.scale !== "linear", scores };
    },
  };
}

module.exports = { strata, assessment, matrix, functionModel, valueMatrix };
