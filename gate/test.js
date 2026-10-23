#!/usr/bin/env node
// The gate's cases (OKF-TOGAF#219, piece 4 of 568-CC, as 577-CC, 583-CC and
// 281-DT2 set it out). Fixture rows with the corpus's eleven rules as written
// in corpus/authority.md; no git, no environment, no network. Exit 1 on a
// failure.
'use strict';
const { decide, matches } = require('./gate');

const TREE = 'a'.repeat(40), BASE = 'b'.repeat(40), HEAD = 'c'.repeat(40), OTHER = 'd'.repeat(40);

const rule = (id, head, body, stratum) => ({ id, title: id, relation: 'Rule', head, body, stratum, source: 'RULE-1' });
const RULES = [
  rule('AUTH-RULE-UNDER-SELF', 'Under(s,s)', ['Surface(s)'], 1),
  rule('AUTH-RULE-UNDER-WITHIN', 'Under(s,r)', ['Within(s,r)'], 1),
  rule('AUTH-RULE-INCLASS', 'InClass(s,c)', ['Member(m,c)', 'Under(s,m)'], 1),
  rule('AUTH-RULE-BARRED-TIER', 'Barred(a,k,s)', ['Tier(a,t)', 'Forbidden(t,k,r)', 'Under(s,r)'], 1),
  rule('AUTH-RULE-BARRED-ACTOR', 'Barred(a,k,s)', ['Forbidden(a,k,r)', 'Under(s,r)'], 1),
  rule('AUTH-RULE-BARRED-TIER-CLASS', 'Barred(a,k,s)', ['Tier(a,t)', 'ForbiddenClass(t,k,c)', 'InClass(s,c)'], 1),
  rule('AUTH-RULE-BARRED-ACTOR-CLASS', 'Barred(a,k,s)', ['ForbiddenClass(a,k,c)', 'InClass(s,c)'], 1),
  rule('AUTH-RULE-EXCLUDED', 'Excluded(l,s)', ['Excludes(l,c)', 'InClass(s,c)'], 1),
  rule('AUTH-RULE-AUTHORIZED-MAY', 'Authorized(a,k,s)', ['Tier(a,t)', 'May(t,k,r)', 'Under(s,r)'], 2),
  rule('AUTH-RULE-AUTHORIZED-LINE', 'Authorized(a,k,s)', ['Line(l,a,k,r)', 'Under(s,r)', 'not Excluded(l,s)'], 2),
  rule('AUTH-RULE-PERMITTED', 'Permitted(a,k,s)', ['Authorized(a,k,s)', 'not Barred(a,k,s)'], 3),
];
const r = (id, relation, f) => Object.assign({ id, title: id, relation, source: 'RULE-1' }, f);
const surf = (id, path) => r(id, 'Surface', Object.assign({ cites: 'A99', party: 'practice' }, path ? { path } : {}));
const ROWS = RULES.concat([
  r('AUTH-ACTOR-CC', 'Actor', { role: 'ROLE-CC' }),
  r('AUTH-TIER-CC', 'Tier', { actor: 'AUTH-ACTOR-CC', tier: 'executor' }),
  r('AUTH-ACT-PUSH', 'Action', { kind: 'write', irreversible: false }),
  surf('AUTH-SURF-PROBE'),
  surf('AUTH-SURF-PROBE-SETTINGS', '.claude/settings.json'),
  surf('AUTH-SURF-PROBE-GATE', 'gate/'),
  surf('AUTH-SURF-PROBE-SPEC', 'spec/'),
  surf('AUTH-SURF-PROBE-DOCS', 'docs/*.secret'),
  r('AUTH-CLASS-SETTINGS', 'Class', { members: ['.claude/settings.json'] }),
  r('AUTH-CLASS-PLANE', 'Class', { members: ['AUTH-SURF-PROBE-GATE'] }),
  r('AUTH-CLASS-RATIFIED', 'Class', { members: ['spec/', 'docs/*.secret'] }),
  r('AUTH-FORBID-SETTINGS-PUSH-EXECUTOR', 'Forbidden', { tier: 'executor', action: 'AUTH-ACT-PUSH', class: 'AUTH-CLASS-SETTINGS' }),
  r('AUTH-LINE-STANDING', 'Line', { text: 'x', date: '2026-10-20', given_to: 'AUTH-ACTOR-CC', grants: [{ action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-PROBE' }], excludes: ['AUTH-CLASS-SETTINGS', 'AUTH-CLASS-PLANE', 'AUTH-CLASS-RATIFIED'] }),
]);
const STORE = { source: 'superdtf-0882/OKF-TOGAF:corpus/authority.md', revision: 'e'.repeat(40), actor: 'AUTH-ACTOR-CC', action: 'AUTH-ACT-PUSH', repository: 'AUTH-SURF-PROBE', rows: ROWS };

const msg = (...extra) => ['Ship a routine change', '', 'Work-Item: OKF-TOGAF#219', ...extra, '', 'Co-Authored-By: x'].join('\n');
const cleared = (o) => { const v = Object.assign({ review: '300-DT2', tree: TREE, base: BASE, ungated: 'none' }, o || {}); return `Cleared-By: ${v.review} tree ${v.tree} base ${v.base} ungated ${v.ungated}`; };
const input = (o) => Object.assign({
  sha: HEAD, varSha: HEAD, message: msg(cleared()), tree: TREE,
  isAncestor: (c) => c === BASE, changed: () => ['README.md'], store: STORE,
}, o || {});
const rules = (d) => d.refusals.map((x) => x.rule);

const cases = [];
const t = (label, fn) => cases.push([label, fn]);

// Path matching: a folder by prefix, a pattern by pattern (577-CC section 3).
t('a folder surface matches every path under it', () => matches('gate/', 'gate/gate.js') && matches('gate/', 'gate/lib/x.js') && !matches('gate/', 'gatekeeper.js'));
t('a pattern matches as a pattern, * within one segment', () => matches('docs/*.secret', 'docs/a.secret') && !matches('docs/*.secret', 'docs/x/a.secret') && !matches('docs/*.secret', 'docs/a.md'));
t('a plain path matches only itself', () => matches('.claude/settings.json', '.claude/settings.json') && !matches('.claude/settings.json', '.claude/settings.json.bak'));

// 281-DT2 section 2's attempts, as decisions.
t('1. a cleared push changing an ordinary file is allowed', () => decide(input()).outcome === 'allowed');
t('2. no Cleared-By is refused', () => { const d = decide(input({ message: msg() })); return d.outcome === 'refused' && rules(d).includes('clearance'); });
t('3. a tree that is not the tree that ships is refused', () => decide(input({ tree: OTHER })).outcome === 'refused');
t('4a. the settings stand-in without Owner-Line is refused', () => decide(input({ changed: () => ['.claude/settings.json'] })).outcome === 'refused');
t('4b. the plane stand-in without Owner-Line is refused, as excluded', () => { const d = decide(input({ changed: () => ['gate/gate.js'] })); return d.outcome === 'refused' && rules(d).includes('excluded'); });
t('4c. the ratified stand-in without Owner-Line is refused, as excluded', () => { const d = decide(input({ changed: () => ['spec/x.md'] })); return d.outcome === 'refused' && rules(d).includes('excluded'); });
t('5. the plane stand-in with Owner-Line is allowed', () => decide(input({ message: msg(cleared(), 'Owner-Line: 586-CC'), changed: () => ['gate/gate.js'] })).outcome === 'allowed');
t('6. the settings stand-in with Owner-Line is still refused, as forbidden', () => { const d = decide(input({ message: msg(cleared(), 'Owner-Line: 586-CC'), changed: () => ['.claude/settings.json'] })); return d.outcome === 'refused' && rules(d).includes('forbidden') && !rules(d).includes('excluded'); });
t('7. a base not in the build\'s history is refused, and no files are read', () => { let read = false; const d = decide(input({ isAncestor: () => false, changed: () => { read = true; return []; } })); return d.outcome === 'refused' && !read; });
t('8. a touched clearance without Owner-Line is refused', () => decide(input({ message: msg(cleared({ ungated: 'touched' })) })).outcome === 'refused');
t('8b. a touched clearance with Owner-Line is allowed', () => decide(input({ message: msg(cleared({ ungated: 'touched' }), 'Owner-Line: 586-CC') })).outcome === 'allowed');

// The build's wiring (283-DT2 section 1): a change to package.json's build or
// prebuild script, or to vercel.json's build, install or framework settings,
// changed or added, needs Owner-Line.
const PKG = (build, prebuild) => JSON.stringify({ name: 'okf-probe', scripts: Object.assign({ build, test: 'node gate/test.js' }, prebuild ? { prebuild } : {}) });
const BUILD = 'node gate/gate.js && node scripts/discover.js';
const at = (files) => (rev, p) => (files[rev] && Object.prototype.hasOwnProperty.call(files[rev], p) ? files[rev][p] : null);
const wired = (headFiles, o) => input(Object.assign({ fileAt: at({ [BASE]: { 'package.json': PKG(BUILD) }, [HEAD]: Object.assign({ 'package.json': PKG(BUILD) }, headFiles) }), changed: () => ['package.json'] }, o || {}));
t('wiring: package.json changed outside its build scripts is allowed', () => decide(wired({ 'package.json': JSON.stringify({ name: 'okf-probe', version: '2', scripts: { build: BUILD, test: 'node gate/test.js' } }) })).outcome === 'allowed');
t('wiring: the build script changed is refused without Owner-Line', () => { const d = decide(wired({ 'package.json': PKG('node scripts/discover.js') })); return d.outcome === 'refused' && rules(d).includes('wiring'); });
t('wiring: a prebuild script added is refused without Owner-Line', () => decide(wired({ 'package.json': PKG(BUILD, 'echo hi') })).outcome === 'refused');
t('wiring: the build script changed is allowed with Owner-Line', () => decide(wired({ 'package.json': PKG('node scripts/discover.js') }, { message: msg(cleared(), 'Owner-Line: 588-CC') })).outcome === 'allowed');
t('wiring: a vercel.json added with a build command is refused', () => decide(wired({ 'vercel.json': JSON.stringify({ buildCommand: 'true' }) }, { changed: () => ['vercel.json'] })).outcome === 'refused');
t('wiring: a vercel.json added with only headers is allowed', () => decide(wired({ 'vercel.json': JSON.stringify({ headers: [] }) }, { changed: () => ['vercel.json'] })).outcome === 'allowed');
t('wiring: vercel.json\'s install command or framework changed is refused', () => decide(wired({ 'vercel.json': JSON.stringify({ installCommand: 'x' }) }, { changed: () => ['vercel.json'] })).outcome === 'refused' && decide(wired({ 'vercel.json': JSON.stringify({ framework: 'nextjs' }) }, { changed: () => ['vercel.json'] })).outcome === 'refused');
t('wiring: a package.json that is not JSON is refused, not thrown', () => decide(wired({ 'package.json': '{ not json' })).outcome === 'refused');
t('wiring: without a way to read files at a commit, a changed package.json is refused', () => decide(input({ changed: () => ['package.json'] })).outcome === 'refused');

// Fail closed, and the gate's own reads.
t('no store of rows is refused', () => { const d = decide(input({ store: null })); return d.outcome === 'refused' && rules(d).includes('rows'); });
t('a store whose rows the evaluator cannot read is refused, not thrown', () => decide(input({ store: Object.assign({}, STORE, { rows: [rule('AUTH-RULE-BAD', 'Permitted(a,k,s)', ['not Barred(a,k,s)'], 3)] }) })).outcome === 'refused');
t('a commit the hosting names that is not the one checked out is refused', () => { const d = decide(input({ varSha: OTHER })); return d.outcome === 'refused' && rules(d).includes('commit'); });
t('without the hosting\'s commit id, the checked-out commit is used', () => decide(input({ varSha: null })).outcome === 'allowed');
t('changed files that cannot be listed are refused', () => decide(input({ changed: () => null })).outcome === 'refused');
t('two Owner-Line lines are refused', () => { const d = decide(input({ message: msg(cleared(), 'Owner-Line: 586-CC', 'Owner-Line: 587-CC') })); return d.outcome === 'refused' && rules(d).includes('owner-line'); });
t('a repository the rows grant nothing on is refused', () => { const d = decide(input({ store: Object.assign({}, STORE, { repository: 'AUTH-SURF-NOWHERE' }) })); return d.outcome === 'refused' && rules(d).includes('not-granted'); });
t('a file under two excluded surfaces is refused once, by one rule', () => { const st = Object.assign({}, STORE, { rows: STORE.rows.concat([surf('AUTH-SURF-PROBE-CH', 'spec/charter-x.md'), r('AUTH-CLASS-PLANE2', 'Class', { members: ['AUTH-SURF-PROBE-CH'] })]).map((x) => x.id === 'AUTH-LINE-STANDING' ? Object.assign({}, x, { excludes: x.excludes.concat(['AUTH-CLASS-PLANE2']) }) : x) }); const d = decide(input({ store: st, changed: () => ['spec/charter-x.md'] })); return d.refusals.length === 1 && d.refusals[0].rule === 'excluded'; });
t('a file both excluded and forbidden is refused once, as forbidden', () => { const st = Object.assign({}, STORE, { rows: STORE.rows.concat([surf('AUTH-SURF-PROBE-SPECSET', 'spec/.claude/settings.json')]).map((x) => x.id === 'AUTH-CLASS-SETTINGS' ? Object.assign({}, x, { members: x.members.concat(['spec/.claude/settings.json']) }) : x) }); const d = decide(input({ store: st, changed: () => ['spec/.claude/settings.json'] })); return d.refusals.length === 1 && d.refusals[0].rule === 'forbidden'; });
t('one excluded file among ordinary ones refuses the push', () => decide(input({ changed: () => ['README.md', 'spec/x.md', 'index.html'] })).outcome === 'refused');
t('a file moved out of an excluded folder counts by its old path too', () => decide(input({ changed: () => ['spec/x.md', 'x.md'] })).outcome === 'refused');

// The record (583-CC): what the filing act rebuilds from the commit.
t('the record names the commit, the store revision, the clearance, the outcome and each rule', () => { const d = decide(input({ changed: () => ['spec/x.md'] })); return d.commit === HEAD && d.store_revision === STORE.revision && d.cleared_by === '300-DT2' && d.outcome === 'refused' && d.refusals.every((x) => x.rule && x.detail); });
t('the record is the same for the same commit', () => JSON.stringify(decide(input())) === JSON.stringify(decide(input())));
t('the record names the files it read by count, not by name', () => { const d = decide(input({ changed: () => ['a', 'b'] })); return d.files === 2 && !JSON.stringify(d).includes('"a"'); });

// 284-DT2 note 2: on the real rows, a gate file is refused as excluded, so a
// change to the evaluators can't quietly empty what the gate looks under.
t('the real store: a gate file without Owner-Line is refused as excluded', () => { const st = require('./store.json'); const d = decide(input({ store: st, changed: () => ['gate/gate.js'] })); return d.outcome === 'refused' && rules(d).includes('excluded'); });
t('the real store: the settings stand-in is refused as forbidden, even with Owner-Line', () => { const st = require('./store.json'); const d = decide(input({ store: st, message: msg(cleared(), 'Owner-Line: 590-CC'), changed: () => ['.claude/settings.json'] })); return d.outcome === 'refused' && rules(d).includes('forbidden'); });

// The watching mode (OKF-TOGAF#219 recorder, 628-CC with 308-DT2's additions):
// set to "record", the gate writes every decision down and ends the build
// normally; with no setting, or any other, it refuses exactly as before.
const gateMod = require('./gate');
const finish = typeof gateMod.finish === 'function' ? gateMod.finish : null;
const recD = { gate: 'authority gate, piece 4', commit: HEAD, outcome: 'refused', refusals: [{ rule: 'excluded', detail: 'gate/gate.js' }] };
const allowD = { gate: 'authority gate, piece 4', commit: HEAD, outcome: 'allowed', refusals: [] };
t('record mode: a decision it would refuse ends the build normally, written down as would-refuse with its rule', () => {
  const r = finish({ decision: recD, config: { mode: 'record' } });
  return r.exitCode === 0 && /^GATE DECISION /.test(r.line) && JSON.parse(r.line.slice(14)).mode === 'record' && JSON.parse(r.line.slice(14)).outcome === 'refused' && /would refuse: excluded: gate\/gate\.js/.test(r.note);
});
t('record mode: a gate that cannot decide ends the build normally, written down as could-not-decide with why', () => {
  const r = finish({ error: new Error('store.json unreadable'), config: { mode: 'record' } });
  const rec = JSON.parse(r.line.slice(14));
  return r.exitCode === 0 && rec.mode === 'record' && rec.outcome === 'could-not-decide' && /store\.json unreadable/.test(rec.why);
});
t('record mode: it serves nothing on the site, even where the config asks to serve', () => {
  const r = finish({ decision: allowD, config: { mode: 'record', serve_decision: true } });
  return r.exitCode === 0 && r.serve === false;
});
t('no mode set: it refuses exactly as before, and the line says refuse', () => {
  const r = finish({ decision: recD, config: {} });
  return r.exitCode === 1 && JSON.parse(r.line.slice(14)).mode === 'refuse' && /^GATE REFUSED: excluded: gate\/gate\.js/.test(r.note);
});
t('no mode set: an allowed decision passes, and the throwaway still serves its record', () => {
  const r = finish({ decision: allowD, config: { serve_decision: true } });
  return r.exitCode === 0 && r.serve === true;
});
t('a mode it does not know is read as refuse, so a garbled setting cannot stop refusals', () => {
  const r = finish({ decision: recD, config: { mode: 'Record ' } });
  return r.exitCode === 1 && JSON.parse(r.line.slice(14)).mode === 'refuse';
});
t('refuse mode: a gate that cannot decide still refuses the build', () => {
  const r = finish({ error: new Error('x'), config: {} });
  return r.exitCode === 1 && JSON.parse(r.line.slice(14)).outcome === 'could-not-decide';
});

let failed = 0;
console.log('GATE CASES (OKF-TOGAF#219, piece 4)\n');
for (const [label, fn] of cases) {
  let ok = false, err = '';
  try { ok = fn() === true; } catch (e) { err = ' (' + e.message + ')'; }
  if (!ok) failed++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : err}`);
}
console.log(failed ? `\nGATE CASES FAILED: ${failed} of ${cases.length}.` : `\ngate cases passed: ${cases.length}.`);
process.exitCode = failed ? 1 : 0;
