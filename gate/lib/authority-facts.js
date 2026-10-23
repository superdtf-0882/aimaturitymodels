// authority-facts -- the authority rows as relations, the one part the two
// evaluators share (269-DT2 change 4). Built under OKF-TOGAF#219, piece 2 of
// 568-CC, on the owner's line approving the plan with 269-DT2's four changes.
//
// Each relation is a set of tuples of row ids or tier names:
//   Tier(a,t)               an Actor row's id and its tier, from Tier rows
//   May(t,k,s)              from May rows
//   Line(l,a,k,s)           from Line rows: each grant that names an action and a surface
//   Excludes(l,c)           from Line rows: each class the line excludes
//   Forbidden(x,k,s)        from Forbidden rows naming a surface; x is an actor id or a tier
//   ForbiddenClass(x,k,c)   from Forbidden rows naming a class
//   Surface(s)              every Surface row (v1.42, 273-DT2)
//   Within(s,r)             a path surface within its repository, through lib/authority.js's within
//   Member(m,c)             a Class row's direct members, through lib/authority.js's inClass;
//                           InClass, which looks down through Within, is a rule (v1.42)
//
// The rules are not read here: each evaluator reads the Rule rows itself.
//
// HOW IT CAN BE CROSSED (RULE-10): a Line grant that names a class rather than
// an action and a surface yields no tuple, and is listed in `skipped`, so a
// grant written that way authorizes nothing until it is written as pairs.

'use strict';

const { inClass, within } = require('./authority');

// Tuples are their values joined by a separator no row id or tier holds.
const SEP = '\u0001';
const RELATIONS = ['Tier', 'May', 'Line', 'Excludes', 'Forbidden', 'ForbiddenClass', 'Surface', 'Within', 'Member'];

// { relations: { name: Set of tuple keys }, skipped: [notes] }
function facts(rows) {
  const rel = {};
  for (const n of RELATIONS) rel[n] = new Set();
  const skipped = [];
  const add = (n, ...xs) => rel[n].add(xs.join(SEP));
  for (const r of rows) {
    if (r.relation === 'Tier') add('Tier', r.actor, r.tier);
    else if (r.relation === 'May') add('May', r.tier, r.action, r.surface);
    else if (r.relation === 'Forbidden') {
      const who = r.actor || r.tier;
      if (r.surface) add('Forbidden', who, r.action, r.surface);
      if (r.class) add('ForbiddenClass', who, r.action, r.class);
    } else if (r.relation === 'Line') {
      for (const g of [].concat(r.grants || [])) {
        if (g && typeof g === 'object' && g.action && g.surface) add('Line', r.id, r.given_to, g.action, g.surface);
        else skipped.push(`${r.id}: a grant of "${typeof g === 'object' ? JSON.stringify(g) : g}" names no action and surface, so it authorizes nothing`);
      }
      for (const c of [].concat(r.excludes || [])) add('Excludes', r.id, c);
    }
  }
  for (const r of rows) if (r.relation === 'Surface') add('Surface', r.id);
  for (const key of within(rows)) add('Within', ...key.split('|'));
  for (const key of inClass(rows)) add('Member', ...key.split('|'));
  return { relations: rel, skipped };
}

module.exports = { facts, SEP, RELATIONS };
