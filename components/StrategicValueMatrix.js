import { useMemo } from "react";
import useAddressState from "./useAddressState";
import { composites, rank } from "../lib/svmCore";

const { valueMatrix } = require("../lib/address-codecs");

// The Strategic Value Matrix calculator. Every rule it applies is in
// lib/svmCore.js, which the build tests against the frame's conformance
// cases before this page can deploy; this file only collects scores and
// shows the result. The sample comes in as props, fetched at the pinned
// commit -- nothing here embeds it.

const GEO = [1, 3, 9, 27];
const LIN = [1, 2, 3, 4];

export default function StrategicValueMatrix({ sample }) {
  const { criteria, initiatives, edges, r5_terms: r5Terms } = sample;
  // OKF-TOGAF#130: the scale and any changed score live in the address
  // (#scale=linear&scores=id:criterion:27). Both are answers, so they only
  // update the address: Back leaves the page, and a reload or a return
  // restores them. Only scores that differ from the sample are written.
  const codec = useMemo(() => valueMatrix(initiatives, criteria.map((c) => c.key)), [initiatives, criteria]);
  const [{ scores, geometric }, commit] = useAddressState(codec);
  // Rule 1's contrast, kept from the demonstrator: the same rungs read as a
  // 1-to-4 scale. The frame argues against it; the toggle shows why.
  const setGeometric = (g) => commit((prev) => ({ ...prev, geometric: g }));
  const valueOf = (s) => (geometric ? s : LIN[Math.max(0, GEO.indexOf(s))]);

  const names = useMemo(() => Object.fromEntries(initiatives.map((i) => [i.id, i.name])), [initiatives]);
  const rows = useMemo(() => {
    const comp = {};
    const members = initiatives.map((i) => {
      const c = composites(criteria, scores[i.id], valueOf);
      comp[i.id] = c;
      const v = r5Terms.reduce((a, k) => a + valueOf(scores[i.id][k]), 0);
      return { id: i.id, merit: c.merit, v };
    });
    return rank(members, edges).map((r) => ({ ...r, ...comp[r.id] }));
  }, [criteria, initiatives, edges, r5Terms, scores, geometric]);

  const valueCrit = criteria.filter((c) => c.half === "value");
  const easeCrit = criteria.filter((c) => c.half !== "value");
  const setScore = (id, key, val) =>
    commit((prev) => ({ ...prev, scores: { ...prev.scores, [id]: { ...prev.scores[id], [key]: Number(val) } } }));
  const reset = () => commit((prev) => ({ ...prev, scores: codec.initial().scores }));

  return (
    <div className="svm">
      <div className="svm-controls">
        <span className="svm-label">Scale</span>
        <button type="button" className={geometric ? "svm-on" : ""} aria-pressed={geometric} onClick={() => setGeometric(true)}>
          Geometric 1 · 3 · 9 · 27 (rule 1)
        </button>
        <button type="button" className={!geometric ? "svm-on" : ""} aria-pressed={!geometric} onClick={() => setGeometric(false)}>
          Linear 1 · 2 · 3 · 4 (for contrast)
        </button>
        <button type="button" onClick={reset}>Reset scores</button>
      </div>
      <p className="svm-note">
        Illustrative criteria and fictional initiatives. Change any score and the ranking recomputes:
        value against ease, dependency lift, then direction and size-and-risk to break ties.
      </p>
      <div className="svm-wrap">
        <table className="svm-table">
          <thead>
            <tr>
              <th rowSpan={2}>#</th>
              <th rowSpan={2}>Initiative</th>
              <th colSpan={valueCrit.length} className="svm-half">Value</th>
              <th colSpan={easeCrit.length} className="svm-half">Ease</th>
              <th rowSpan={2} className="n">Value</th>
              <th rowSpan={2} className="n">Ease</th>
              <th rowSpan={2} className="n">Merit</th>
              <th rowSpan={2} className="n">Total</th>
            </tr>
            <tr>
              {[...valueCrit, ...easeCrit].map((c) => (
                <th key={c.key} className="svm-crit">
                  {c.name}
                  <span className="svm-w">{c.weight.toFixed(2)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.lifted ? "svm-lifted" : undefined}>
                <td className="n">{r.rank}</td>
                <td>
                  {names[r.id]}
                  {r.lifted && (
                    <span className="svm-lift">
                      lifted: must come before {r.liftedBy.map((d) => names[d]).join(", ")}
                    </span>
                  )}
                </td>
                {[...valueCrit, ...easeCrit].map((c) => (
                  <td key={c.key}>
                    <select
                      aria-label={`${names[r.id]}: ${c.name}`}
                      value={scores[r.id][c.key]}
                      onChange={(e) => setScore(r.id, c.key, e.target.value)}
                    >
                      {GEO.map((g) => (
                        <option key={g} value={g}>{geometric ? g : LIN[GEO.indexOf(g)]}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td className="n">{r.bv.toFixed(2)}</td>
                <td className="n">{r.eoi.toFixed(2)}</td>
                <td className="n">{r.merit.toFixed(2)}</td>
                <td className="n svm-total">{r.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
