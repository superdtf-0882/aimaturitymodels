// authority-join -- the first evaluator of the authority rules: plain joins,
// stratum by stratum, to a fixpoint (DTOG-d7-plan section 3; 568-CC piece 2).
// Built under OKF-TOGAF#219 on the owner's line approving the plan with
// 269-DT2's four changes.
//
// It reads the Rule rows' head and body strings itself and shares nothing with
// the second evaluator (lib/authority-einsum.js) but the relations
// lib/authority-facts.js builds from the rows.
//
// evaluate(rules, relations) -> relations, with every rule's head computed.
// A negated literal is read only once its relation's stratum is complete, so a
// rule's answer never depends on the order of the rows.
//
// HOW IT CAN BE CROSSED (RULE-10): an unsafe rule, whose negated literal or
// head holds a variable no positive literal binds, is refused when evaluated,
// not when written; the validator's stratum check does not look for it.

'use strict';

const SEP = '\u0001';
const LIT = /^(not\s+)?([A-Za-z_]\w*)\s*\(([^)]*)\)$/;

function parseLiteral(s, id) {
  const m = String(s).trim().match(LIT);
  if (!m) throw new Error(`${id}: "${s}" is not a literal`);
  return { neg: !!m[1], pred: m[2], args: m[3].split(',').map((x) => x.trim()).filter(Boolean) };
}

function parseRule(row) {
  const head = parseLiteral(row.head, row.id);
  const body = [].concat(row.body || []).map((b) => parseLiteral(b, row.id));
  const bound = new Set();
  body.filter((l) => !l.neg).forEach((l) => l.args.forEach((a) => bound.add(a)));
  for (const v of head.args.concat(...body.filter((l) => l.neg).map((l) => l.args))) {
    if (!bound.has(v)) throw new Error(`${row.id}: unsafe rule, "${v}" is bound by no positive literal`);
  }
  return { id: row.id, stratum: row.stratum, head, pos: body.filter((l) => !l.neg), neg: body.filter((l) => l.neg) };
}

// Every binding of the rule's variables its positive literals admit, less those
// a negated literal names, projected onto the head.
function fire(rule, rel) {
  let bindings = [{}];
  for (const lit of rule.pos) {
    const next = [];
    const tuples = [...(rel[lit.pred] || new Set())].map((x) => x.split(SEP));
    for (const b of bindings) {
      for (const tu of tuples) {
        if (tu.length !== lit.args.length) continue;
        const nb = Object.assign({}, b);
        let ok = true;
        lit.args.forEach((v, i) => { if (ok) { if (v in nb) ok = nb[v] === tu[i]; else nb[v] = tu[i]; } });
        if (ok) next.push(nb);
      }
    }
    bindings = next;
  }
  for (const lit of rule.neg) {
    const set = rel[lit.pred] || new Set();
    bindings = bindings.filter((b) => !set.has(lit.args.map((v) => b[v]).join(SEP)));
  }
  return bindings.map((b) => rule.head.args.map((v) => b[v]).join(SEP));
}

function evaluate(ruleRows, relations) {
  const rel = {};
  for (const [n, s] of Object.entries(relations)) rel[n] = new Set(s);
  const rules = ruleRows.map(parseRule);
  for (const r of rules) if (!rel[r.head.pred]) rel[r.head.pred] = new Set();
  const strata = [...new Set(rules.map((r) => r.stratum))].sort((a, b) => a - b);
  for (const s of strata) {
    const here = rules.filter((r) => r.stratum === s);
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of here) {
        for (const tu of fire(r, rel)) {
          if (!rel[r.head.pred].has(tu)) { rel[r.head.pred].add(tu); changed = true; }
        }
      }
    }
  }
  return rel;
}

module.exports = { evaluate };
