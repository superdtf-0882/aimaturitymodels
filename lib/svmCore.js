// The Strategic Value Matrix's ranking core -- rules 2 to 8 of the frame
// published as strategic_value_matrix.md in the Product Prioritization
// model's own repository, read by this site at the pinned commit.
//
// REBUILT, NOT PORTED. The 2026-09-12 demonstrator lifted in two passes
// ("two passes covers the chains in this example") and let an item block
// only one other. The frame's rule 3 lifts through whole chains, to a fixed
// point, and rule 4 takes the higher of any number of dependents. A port
// would have published the defect the frame was corrected to remove.
//
// ONE CORE, TWO CALLERS: the page's calculator and scripts/svm-conformance.js
// both require this file, so the build tests the code that renders. No
// sample data and no rule text live here -- both are fetched (AC-008).
//
// Plain CommonJS with no imports, so plain `node` can run it at prebuild,
// the way lib/pins.js and lib/aiDigestCore.js are run outside Next.

const round2 = (n) => Math.round(n * 100) / 100;

// Rule 2: two weighted sums, value and ease. `criteria` carry key, half
// ("value" | "ease") and weight; `scores` maps key -> score.
function composites(criteria, scores, valueOf) {
  const v = valueOf || ((x) => x);
  let bv = 0;
  let eoi = 0;
  for (const c of criteria) {
    const s = v(scores[c.key]);
    if (c.half === "value") bv += c.weight * s;
    else eoi += c.weight * s;
  }
  return { bv: round2(bv), eoi: round2(eoi), merit: round2(bv + eoi) };
}

// Rules 3 and 4: an item inherits the highest total among the items that
// depend on it, repeated until nothing moves. `transitive: false` stops
// after one step -- kept ONLY so the conformance check can prove a one-step
// lift fails its chain case.
function lift(ids, edges, merit, transitive = true) {
  const dependentsOf = new Map(ids.map((id) => [id, []]));
  for (const e of edges) if (dependentsOf.has(e.prerequisite)) dependentsOf.get(e.prerequisite).push(e.dependent);
  if (!transitive) {
    return new Map(ids.map((id) => [id, round2(dependentsOf.get(id).reduce((a, d) => Math.max(a, merit.get(d)), merit.get(id)))]));
  }
  const t = new Map(merit);
  for (let pass = 0; pass <= ids.length; pass++) {
    let moved = false;
    for (const id of ids) {
      const best = round2(dependentsOf.get(id).reduce((a, d) => Math.max(a, t.get(d)), t.get(id)));
      if (best !== t.get(id)) { t.set(id, best); moved = true; }
    }
    if (!moved) return t;
  }
  throw new Error("The lift did not settle: the dependencies contain a cycle.");
}

// Rules 8 then 5: by total; within a tie, a prerequisite before its
// dependent; among what direction leaves free, the higher V; id last, so the
// order never depends on input order.
function order(ids, edges, total, V) {
  const prereqOf = new Map(ids.map((id) => [id, new Set()]));
  for (const e of edges) if (prereqOf.has(e.dependent)) prereqOf.get(e.dependent).add(e.prerequisite);
  const groups = new Map();
  for (const id of ids) {
    const k = total.get(id).toFixed(2);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(id);
  }
  const out = [];
  for (const k of [...groups.keys()].sort((a, b) => Number(b) - Number(a))) {
    const g = groups.get(k);
    const inGroup = new Set(g);
    const placed = new Set();
    while (placed.size < g.length) {
      const ready = g.filter((id) => !placed.has(id) && [...prereqOf.get(id)].every((p) => !inGroup.has(p) || placed.has(p)));
      if (!ready.length) throw new Error("Rule 8 cannot order a tie: the dependencies contain a cycle.");
      ready.sort((a, b) => V.get(b) - V.get(a) || a.localeCompare(b));
      placed.add(ready[0]);
      out.push(ready[0]);
    }
  }
  return out;
}

// members: [{ id, merit, v }]; edges: [{ prerequisite, dependent }].
// Returns the ranked rows, each with what lifted it (rule 6's note).
function rank(members, edges, opts = {}) {
  const ids = members.map((m) => m.id);
  const merit = new Map(members.map((m) => [m.id, round2(m.merit)]));
  const V = new Map(members.map((m) => [m.id, m.v]));
  const total = lift(ids, edges, merit, opts.transitive !== false);
  return order(ids, edges, total, V).map((id, i) => {
    const lifted = total.get(id) > merit.get(id);
    const by = lifted ? edges.filter((e) => e.prerequisite === id && total.get(e.dependent) === total.get(id)).map((e) => e.dependent) : [];
    return { rank: i + 1, id, merit: merit.get(id), total: total.get(id), v: V.get(id), lifted, liftedBy: by };
  });
}

// The conformance cases, run through rank() itself. A case passes when every
// member of expect_order ties at ties_at in that order, and -- where
// r5_silent_required -- rule 5 cannot tell them apart. A one_hop_control
// case is run again with the lift stopped at one step, and that run must FAIL.
function runCase(c, transitive = true) {
  const members = c.members.map((m) => ({ id: m.id, merit: m.merit, v: m.size_inversion + m.risk_inversion }));
  const edges = c.edges.map(([prerequisite, dependent]) => ({ prerequisite, dependent }));
  try {
    const rows = rank(members, edges, { transitive });
    const pos = c.expect_order.map((id) => rows.findIndex((r) => r.id === id));
    const tied = c.expect_order.every((id) => rows.find((r) => r.id === id).total === round2(c.ties_at));
    const ordered = pos.every((p, i) => p !== -1 && (i === 0 || pos[i - 1] < p));
    const r5Silent = new Set(c.expect_order.map((id) => rows.find((r) => r.id === id).v)).size === 1;
    const needSilent = c.r5_silent_required !== false;
    return { ok: tied && ordered && (!needSilent || r5Silent), rows };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function runConformance(cases) {
  const results = [];
  for (const c of cases || []) {
    const full = runCase(c, true);
    results.push({ name: c.name, run: "full depth", ok: full.ok, detail: full.error || full.rows.map((r) => `${r.id} ${r.total.toFixed(2)}`).join(", ") });
    if (c.one_hop_control) {
      const hop = runCase(c, false);
      // The control passes when the one-step run FAILS the case.
      results.push({ name: c.name, run: "one-step control", ok: !hop.ok, detail: hop.ok ? "the one-step lift passed, so this case cannot tell the two apart" : "fails, as the control requires" });
    }
  }
  if (!results.length) results.push({ name: "(none)", run: "-", ok: false, detail: "no conformance cases were found" });
  return results;
}

module.exports = { round2, composites, lift, order, rank, runCase, runConformance };
