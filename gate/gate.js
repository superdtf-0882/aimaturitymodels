#!/usr/bin/env node
// The deploy gate (OKF-TOGAF#219, piece 4 of 568-CC, as 577-CC, 583-CC and
// 281-DT2 set it out), on the owner's lines "For piece 4: the gate may also
// read the commit's own id and the build's copy of its history, with no
// network call and no other variable; ..." and "Routine changes ship once
// DT2's review clears the commit that ships; ... -- David Facer 10/20/2026".
//
// On every build, in order: the commit names DT2's clearance (Cleared-By) and
// the tree that ships is the tree cleared; the clearance's base is in the
// build's history, or the gate refuses, since it cannot list what changed; and
// every file changed from that base is permitted to CC by the authority rows,
// asked of the join evaluator, a file your line excludes passing only with an
// Owner-Line, a forbidden one never.
//
// It reads one variable by name, the commit's id, and runs git on the build's
// own checkout. It makes no network call and lists no environment. The rows
// are a copy, gate/store.json, with the corpus revision it was taken at; the
// libraries in gate/lib/ are copies of the corpus's tools/lib/, recorded in
// gate/lib/COPIED.json.
//
// HOW IT CAN BE CROSSED (RULE-10): a commit can change this folder, which is
// why the folder is in the plane class and needs the owner's line; a push that
// skips the build, or a rule outside the build, is piece 7's (GitHub's branch
// rule); who wrote a clearance is checked when CC files, not here (579-CC).
// SET TO "record" (config.json's mode) it refuses nothing, so while so set it
// is a recorder, not a control: the setting lives in this folder, in the plane
// class; a missing or garbled setting reads as "refuse"; and CC's filing
// reports a site decision made in refuse mode as a departure (308-DT2).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const clearance = require('./lib/clearance');
const { facts } = require('./lib/authority-facts');
const { evaluate } = require('./lib/authority-join');
const { matches } = require('./lib/authority');

const SEP = '\u0001';

// A surface's path against a changed file is the corpus's own matching,
// tools/lib/authority.js's matches(), copied here with the other libraries, so
// the gate and the evaluator answer one question one way (282-DT2).

// The build's wiring (283-DT2 section 1): what decides whether the gate runs
// and whether its refusal stops the build. A change to any of it needs
// Owner-Line. Wiring that stops the gate or ignores it is past any gate; the
// filing act's rebuild records it as "gate not run" (AUTH-NOTMED-GATE-WIRING).
const WIRING = { 'package.json': (j) => ({ build: j && j.scripts ? j.scripts.build : undefined, prebuild: j && j.scripts ? j.scripts.prebuild : undefined }),
  'vercel.json': (j) => ({ buildCommand: j ? j.buildCommand : undefined, installCommand: j ? j.installCommand : undefined, framework: j ? j.framework : undefined }) };
function wiringChanges(changed, base, sha, fileAt) {
  const out = [];
  for (const f of Object.keys(WIRING).filter((x) => changed.includes(x))) {
    if (typeof fileAt !== 'function') { out.push(`${f} changed, and the gate cannot read it at a commit`); continue; }
    let before, after;
    try { const b = fileAt(base, f), a = fileAt(sha, f); before = WIRING[f](b === null ? null : JSON.parse(b)); after = WIRING[f](a === null ? null : JSON.parse(a)); }
    catch (e) { out.push(`${f} could not be read as JSON`); continue; }
    for (const k of Object.keys(before)) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) out.push(`${f}'s ${k} changed`);
  }
  return out;
}

// The decision for one commit, from what the build read. Pure: the same input
// gives the same record, so the filing act can rebuild it from the commit.
function decide(input) {
  const out = { gate: 'authority gate, piece 4', commit: input.sha, store_revision: input.store ? input.store.revision : null, cleared_by: null, owner_line: null, files: null, outcome: null, refusals: [] };
  const refuse = (rule, detail) => out.refusals.push({ rule, detail });
  const done = () => { out.outcome = out.refusals.length ? 'refused' : 'allowed'; return out; };

  if (input.varSha && input.varSha !== input.sha) refuse('commit', 'the commit the hosting names is not the one checked out');
  const store = input.store;
  if (!store || !Array.isArray(store.rows) || !store.actor || !store.action || !store.repository) { refuse('rows', 'no readable copy of the authority rows'); return done(); }

  const c = clearance.clearedBy(input.message);
  const o = clearance.ownerLine(input.message);
  if (c && !c.malformed) out.cleared_by = c.review;
  if (o === false) refuse('owner-line', 'more than one Owner-Line');
  else if (o) out.owner_line = o;
  for (const why of clearance.gateRefusals(c, { tree: input.tree, hasBase: input.isAncestor, ownerLine: o || null })) refuse('clearance', why);
  if (!c || c.malformed || !input.isAncestor(c.base)) return done();

  const changed = input.changed(c.base);
  if (!Array.isArray(changed)) { refuse('files', 'the changed files could not be listed'); return done(); }
  out.files = changed.length;
  for (const w of wiringChanges(changed, c.base, input.sha, input.fileAt)) if (!o || /cannot read|could not be read/.test(w)) refuse('wiring', o ? w : w + '; it needs Owner-Line');

  let rel;
  try { rel = evaluate(store.rows.filter((x) => x.relation === 'Rule'), facts(store.rows).relations); }
  catch (e) { refuse('rows', 'the evaluator could not read the rows: ' + e.message); return done(); }
  const has = (name, ...xs) => !!rel[name] && rel[name].has(xs.join(SEP));
  const a = store.actor, k = store.action, R = store.repository;
  const lines = store.rows.filter((x) => x.relation === 'Line' && x.given_to === a).map((x) => x.id);

  if (!has('Permitted', a, k, R)) {
    refuse(has('Barred', a, k, R) ? 'forbidden' : 'not-granted', `${R} is not permitted to ${a} for ${k}`);
    return done();
  }
  const within = store.rows.filter((x) => x.relation === 'Surface' && x.path && has('Within', x.id, R));
  // One refusal per file, by its strongest reason: a file under two surfaces
  // the line excludes is excluded once, and one also forbidden is forbidden
  // (282-DT2's check on the record).
  const RANK = { forbidden: 3, 'not-granted': 2, excluded: 1 };
  for (const f of changed) {
    let worst = null;
    for (const s of within.filter((x) => matches(x.path, f))) {
      if (has('Permitted', a, k, s.id)) continue;
      const why = has('Barred', a, k, s.id) ? { rule: 'forbidden', detail: `${f} is in ${s.id}, which no line overrides` }
        : lines.some((l) => has('Excluded', l, s.id)) ? (o ? null : { rule: 'excluded', detail: `${f} is in ${s.id}, which the line excludes; it needs Owner-Line` })
        : { rule: 'not-granted', detail: `${f} is in ${s.id}, which nothing grants` };
      if (why && (!worst || RANK[why.rule] > RANK[worst.rule])) worst = why;
    }
    if (worst) refuse(worst.rule, worst.detail);
  }
  return done();
}

// ------------------------------------------------------------- the build
function git(...args) { return String(execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] })).trim(); }
function tryGit(...args) { try { return git(...args); } catch (e) { return null; } }

// ------------------------------------------------------------- the end of a build
// The watching mode (OKF-TOGAF#219's recorder, 628-CC with 308-DT2's
// additions): config.mode "record" writes every decision down, naming its
// mode, and ends the build normally, serving nothing; any other value, a
// missing setting included, is "refuse", the gate as proved. A gate that
// cannot decide is written down as could-not-decide, and refuses in refuse
// mode as an uncaught error did before.
function finish({ decision, error, config }) {
  const mode = config && config.mode === 'record' ? 'record' : 'refuse';
  const d = error || !decision
    ? { gate: 'authority gate, piece 4', commit: (decision && decision.commit) || null, outcome: 'could-not-decide', refusals: [], why: String((error && error.message) || error || 'no decision') }
    : decision;
  const line = 'GATE DECISION ' + JSON.stringify(Object.assign({}, d, { mode }));
  const stops = d.outcome !== 'allowed';
  const why = d.outcome === 'could-not-decide' ? 'could not decide: ' + d.why : (d.refusals || []).map((x) => x.rule + ': ' + x.detail).join(' | ');
  if (mode === 'record') return { exitCode: 0, line, serve: false, note: stops ? 'GATE RECORDED, would refuse: ' + why : 'GATE RECORDED, would allow' };
  return { exitCode: stops ? 1 : 0, line, serve: !stops && !!config && config.serve_decision === true, note: stops ? 'GATE REFUSED: ' + why : null };
}

function main() {
  const root = path.join(__dirname, '..');
  let config = {};
  try { config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch (e) { config = {}; }
  let d = null, error = null;
  try {
    const sha = tryGit('rev-parse', 'HEAD');
    let store = null;
    try { store = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8')); } catch (e) { store = null; }
    d = sha ? decide({
      sha,
      varSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      message: tryGit('log', '-1', '--format=%B', sha) || '',
      tree: tryGit('rev-parse', sha + '^{tree}'),
      isAncestor: (b) => { try { execFileSync('git', ['merge-base', '--is-ancestor', b, sha], { stdio: 'ignore' }); return true; } catch (e) { return false; } },
      changed: (b) => { const r = tryGit('diff', '--name-only', '--no-renames', b, sha); return r === null ? null : r.split('\n').filter(Boolean); },
      fileAt: (rev, p) => { try { return String(execFileSync('git', ['show', rev + ':' + p], { stdio: ['ignore', 'pipe', 'ignore'] })); } catch (e) { return null; } },
      store,
    }) : { gate: 'authority gate, piece 4', commit: null, outcome: 'refused', refusals: [{ rule: 'commit', detail: 'no commit checked out' }] };
  } catch (e) { error = e; }
  const r = finish({ decision: d, error, config });
  console.log(r.line);
  // Only the throwaway target serves its record; a live site never does (583-CC),
  // and the watching mode never does.
  if (r.serve) {
    fs.mkdirSync(path.join(root, 'public'), { recursive: true });
    fs.writeFileSync(path.join(root, 'public', 'gate-decision.json'), JSON.stringify(d, null, 2) + '\n');
  }
  if (r.note) (r.exitCode ? console.error : console.log)(r.note);
  process.exitCode = r.exitCode;
}

if (require.main === module) main();
module.exports = { decide, matches, wiringChanges, finish };
