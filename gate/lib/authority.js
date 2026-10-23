// authority -- the practice's authority held as rows, EA OKF bundle spec v1.41,
// EXT-012. Built under OKF-TOGAF#219, piece 1, on the owner's lines "Approve
// #219's plan as 568-CC sets it out with 269-DT2's four changes, with two
// throwaway repositories and one throwaway Vercel project as the probe targets,
// and me installing what CC drafts -- David Facer 10/19/2026" and "Ratify the
// authority row type as 270-DT2 drafts it, for CC to land as bundle spec v1.41
// and EXT-012 -- David Facer 10/19/2026" (briefs/2026-10-01-svm-tranche-3/
// 568-CC, 269-DT2, 270-DT2).
//
// One row per fact about who may do what: actors, tiers, actions, surfaces,
// classes of change, standing decision rights, the owner's standing lines,
// prohibitions no line overrides, what an act requires, clearances, each
// control's declared scope and its reach as an attempt showed it, what a
// mediation point does not cover, and the rules that combine them. The rule
// file, tools/generated/authority.dl, is generated from the Rule rows.
//
// THIS MODULE IS PURE: it reads nothing from disk, git or GitHub. The callers
// (the validator and tools/authority.js) read the rows and the sources and pass
// them in.
//
// WHAT IS REFUSED (270-DT2 section 2): a row missing a row-level field or naming
// an unknown relation; an Actor citing anything but a role row; a May or Line
// granting a non-read act on an outside surface; a Forbidden row with no
// source; a Reach marked not-probed with no reason; a Rule negating a relation
// of its own or a higher stratum; a Line whose text is not quoted in its source.
// WHAT IS REPORTED: a Covers row with no Reach row; a non-owner tier missing a
// prohibition the others carry; a control that is not a corpus id; a Class
// member that names no Surface and matches no Surface path (271-DT2); field values outside the
// type's sets; a positive literal of a higher stratum.
//
// HOW IT CAN BE CROSSED (RULE-10): a row is a record of authority, not an
// authority, so a true-looking row with a real source passes every check here
// whether or not the source grants what the row says. A Line's text is matched
// as a substring of its source, so a line quoted in a brief that later refused
// it would still match. The checks see form; the owner's line and the charters
// are what grant.

'use strict';

// Each relation and the fields its rows carry (270-DT2 section 2). Forbidden
// names an actor or a tier, and a surface or a class; the others are fixed.
const RELATIONS = {
  Actor: ['role'],
  Tier: ['actor', 'tier'],
  Action: ['kind', 'irreversible'],
  Surface: ['cites', 'party'],
  Class: ['members'],
  May: ['tier', 'action', 'surface'],
  Line: ['text', 'date', 'given_to', 'grants', 'excludes'],
  Forbidden: ['action'],
  Requires: ['action', 'surface', 'condition'],
  Cleared: ['review', 'repository', 'commit', 'tree', 'base', 'not_run', 'ungated'], // generated, never a row (v1.43)
  Covers: ['control', 'action', 'surface'],
  Reach: ['control', 'action', 'surface', 'date', 'outcome', 'probe'],
  NotMediated: ['point', 'path', 'reason', 'decision'],
  Rule: ['head', 'body', 'stratum'],
};
const SETS = {
  tier: ['owner', 'executor', 'reviewer', 'drafter'],
  kind: ['read', 'write', 'issue', 'configure'],
  party: ['practice', 'outside'],
  outcome: ['refused', 'admitted', 'not-probed'],
};
// Which fields of which relation take a value from a set.
const SET_FIELDS = { Tier: ['tier'], May: ['tier'], Forbidden: ['tier'], Action: ['kind'], Surface: ['party'], Reach: ['outcome'] };
const ID = /^AUTH-[A-Z0-9][A-Z0-9-]*$/;
const LITERAL = /^(not\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)$/;

const present = (v) => v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');
// Quotes and spacing as briefs write them, so a line matches its source as written.
const plain = (s) => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

function literal(s) {
  const m = String(s).trim().match(LITERAL);
  return m ? { negated: !!m[1], pred: m[2], args: m[3] } : null;
}

// Each predicate's stratum: a head takes its rule's stratum (the highest, if it
// heads several); a predicate no rule heads is a base relation, stratum 0.
function strata(rows) {
  const out = {};
  const rules = rows.filter((r) => r.relation === 'Rule');
  for (const r of rules) {
    for (const b of [].concat(r.body || [])) { const l = literal(b); if (l && !(l.pred in out)) out[l.pred] = 0; }
  }
  for (const r of rules) {
    const h = literal(r.head);
    if (!h || !Number.isInteger(r.stratum)) continue;
    out[h.pred] = Math.max(out[h.pred] || 0, r.stratum);
  }
  return out;
}

// { errors, reports } over every authority row. ctx.roleIds is the set of role
// row ids; ctx.sourceText(source) returns the source's text, or null.
function checkRows(rows, ctx) {
  const errors = [];
  const reports = [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const party = (id) => (byId.get(id) || {}).party;
  const kind = (id) => (byId.get(id) || {}).kind;
  const outsideWrite = (pair) => pair && kind(pair.action) !== 'read' && party(pair.surface) === 'outside';
  const st = strata(rows);

  for (const r of rows) {
    const who = r.id || '(no id)';
    if (!present(r.id) || !ID.test(String(r.id))) errors.push(`${who}: id must be AUTH-*`);
    if (!present(r.title)) errors.push(`${who}: no title`);
    if (!Object.prototype.hasOwnProperty.call(RELATIONS, r.relation)) { errors.push(`${who}: unknown relation "${r.relation}"`); continue; }
    if (!present(r.source)) errors.push(r.relation === 'Forbidden' ? `${who}: a Forbidden row must name the rule that says so` : `${who}: no source`);
    else if (/^convention$/i.test(String(r.source).trim())) errors.push(`${who}: "convention" is not a source`);

    for (const f of RELATIONS[r.relation]) if (!present(r[f]) && !(r.relation === 'Rule' && f === 'stratum') && !(r.relation === 'Surface' && f === 'cites' && present(r.path))) reports.push(`${who}: ${r.relation} row without ${f}`);
    for (const f of SET_FIELDS[r.relation] || []) if (present(r[f]) && !SETS[f].includes(r[f])) reports.push(`${who}: ${f} "${r[f]}" is not one of ${SETS[f].join(', ')}`);

    if (r.relation === 'Cleared') errors.push(`${who}: Cleared is generated from DT2's clearance blocks (bundle spec v1.43), never written as a row`);
    if (r.relation === 'Actor' && !(ctx && ctx.roleIds && ctx.roleIds.has(r.role))) errors.push(`${who}: an Actor must cite a role row, not "${r.role}"`);
    if (r.relation === 'Forbidden') {
      if (!present(r.actor) && !present(r.tier)) reports.push(`${who}: Forbidden row names neither an actor nor a tier`);
      if (!present(r.surface) && !present(r.class)) reports.push(`${who}: Forbidden row names neither a surface nor a class`);
    }
    if (r.relation === 'May' && outsideWrite(r)) errors.push(`${who}: a May row grants a non-read act on an outside surface`);
    if (r.relation === 'Line') {
      const pairs = [];
      for (const g of [].concat(r.grants || [])) {
        if (g && typeof g === 'object') pairs.push(g);
        else { const c = byId.get(g); if (c && c.relation === 'Class') [].concat(c.members || []).forEach((m) => { if (m && typeof m === 'object') pairs.push(m); }); }
      }
      if (pairs.some(outsideWrite)) errors.push(`${who}: a Line grants a non-read act on an outside surface`);
      const text = ctx && ctx.sourceText ? ctx.sourceText(r.source) : null;
      if (text === null || text === undefined) errors.push(`${who}: the Line's source "${r.source}" cannot be read`);
      else if (!present(r.text) || !plain(text).includes(plain(r.text))) errors.push(`${who}: the Line's text is not quoted in its source`);
    }
    if (r.relation === 'Reach' && r.outcome === 'not-probed' && !present(r.reason)) errors.push(`${who}: a not-probed Reach must give its reason`);
    if (r.relation === 'Rule') {
      if (!Number.isInteger(r.stratum) || r.stratum < 1) { errors.push(`${who}: a Rule must carry its stratum, 1 or more`); continue; }
      if (!literal(r.head) || literal(r.head).negated) errors.push(`${who}: the head is not a positive literal`);
      for (const b of [].concat(r.body || [])) {
        const l = literal(b);
        if (!l) { errors.push(`${who}: "${b}" is not a literal`); continue; }
        if (l.negated && (st[l.pred] || 0) >= r.stratum) errors.push(`${who}: negates ${l.pred}, of stratum ${st[l.pred] || 0}, not lower than its own ${r.stratum}`);
        if (!l.negated && (st[l.pred] || 0) > r.stratum) reports.push(`${who}: reads ${l.pred}, of a higher stratum`);
      }
    }
  }
  // 273-DT2, v1.42: a file's repository, by its application.
  {
    const surfs = rows.filter((r) => r.relation === 'Surface');
    const repos = surfs.filter((s) => !present(s.path) && present(s.cites));
    const seen = new Map();
    for (const r of repos) {
      if (seen.has(r.cites)) errors.push(`${r.id}: a second repository surface citing ${r.cites}, beside ${seen.get(r.cites)}, so a file citing it would be within either`);
      else seen.set(r.cites, r.id);
    }
    for (const s of surfs.filter((x) => present(x.path) && present(x.cites))) {
      const r = repos.filter((x) => x.cites === s.cites);
      if (!r.length) errors.push(`${s.id}: cites ${s.cites}, which no repository surface cites, so it is within nothing`);
      else if (r.length === 1 && present(s.party) && present(r[0].party) && s.party !== r[0].party) errors.push(`${s.id}: party "${s.party}" differs from its repository ${r[0].id}'s "${r[0].party}"`);
    }
  }
  // 271-DT2: a prohibition one non-owner tier carries, and another lacks.
  const NON_OWNER = ['executor', 'drafter', 'reviewer'];
  const groups = new Map();
  for (const f of rows.filter((r) => r.relation === 'Forbidden' && NON_OWNER.includes(r.tier))) {
    const key = `${f.action} on ${f.surface || f.class}`;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(f.tier);
  }
  for (const [key, tiers] of groups) {
    for (const t of NON_OWNER) if (!tiers.has(t)) reports.push(`the prohibition of ${key} binds ${[...tiers].join(', ')}, not ${t}`);
  }
  // 271-DT2: a control should be a corpus id, so a reader can open it.
  if (ctx && ctx.knownIds) {
    for (const r of rows.filter((x) => x.relation === 'Covers' && present(x.control))) {
      if (!ctx.knownIds.has(r.control)) reports.push(`${r.id}: control "${r.control}" is not a corpus id`);
    }
  }
  // A Class member must name a Surface or match a Surface's path.
  const surfaces = rows.filter((r) => r.relation === 'Surface');
  for (const c of rows.filter((r) => r.relation === 'Class')) {
    for (const m of [].concat(c.members || [])) {
      if (typeof m !== 'string') continue;
      const hit = surfaces.some((s) => s.id === m) || surfaces.some((s) => present(s.path) && glob(m).test(String(s.path)));
      if (!hit) reports.push(`${c.id}: member "${m}" matches no Surface`);
    }
  }
  for (const c of rows.filter((r) => r.relation === 'Covers')) {
    const shown = rows.some((r) => r.relation === 'Reach' && r.control === c.control && r.action === c.action && r.surface === c.surface);
    if (!shown) reports.push(`${c.id}: ${c.control} covers ${c.action} on ${c.surface}, and no Reach row shows it`);
  }
  return { errors, reports };
}

// The rule file, generated from the Rule rows: stratum by stratum, id by id.
function datalog(rows) {
  const rules = rows.filter((r) => r.relation === 'Rule' && Number.isInteger(r.stratum))
    .slice().sort((a, b) => a.stratum - b.stratum || String(a.id).localeCompare(String(b.id)));
  const out = [
    '% GENERATED by tools/authority.js from the Rule rows of corpus/authority.md',
    '% (EA OKF bundle spec v1.41, EXT-012, OKF-TOGAF#219). Never edit by hand: edit the rows.',
    '% A rule may negate only a relation of a lower stratum.',
  ];
  let at = null;
  for (const r of rules) {
    if (r.stratum !== at) { out.push('', `% stratum ${r.stratum}`); at = r.stratum; }
    out.push(`% ${r.id}: ${r.title}`);
    out.push(`${String(r.head).trim()} :- ${[].concat(r.body || []).map((b) => String(b).trim()).join(', ')}.`);
  }
  return out.join('\n') + '\n';
}

function selfTest() {
  const cases = [];
  const t = (label, fn) => cases.push([label, fn]);
  const roles = new Set(['ROLE-OWNER', 'ROLE-CC', 'ROLE-DT', 'ROLE-DTOG']);
  const SRC = 'briefs/x/1-CC.md';
  const texts = { [SRC]: 'the owner said: "Ship routine changes on clearance -- David Facer 10/20/2026" in session' };
  const ctx = { roleIds: roles, sourceText: (s) => (Object.prototype.hasOwnProperty.call(texts, s) ? texts[s] : null) };
  const row = (relation, fields, extra) => Object.assign({ id: 'AUTH-' + relation.toUpperCase() + '-1', title: relation + ' row', relation, source: 'RULE-1' }, fields, extra || {});
  const outside = row('Surface', { cites: 'A18', party: 'outside' }, { id: 'AUTH-SURF-SUPPLIER' });
  const inside = row('Surface', { cites: 'A13', party: 'practice' }, { id: 'AUTH-SURF-SITE' });
  const read = row('Action', { kind: 'read', irreversible: false }, { id: 'AUTH-ACT-READ' });
  const push = row('Action', { kind: 'write', irreversible: false }, { id: 'AUTH-ACT-PUSH' });
  const base = [outside, inside, read, push];
  const errs = (rows) => checkRows(base.concat(rows), ctx).errors.length;
  const reps = (rows) => checkRows(base.concat(rows), ctx).reports.length;

  // Row level.
  t('the base rows pass', () => errs([]) === 0);
  t('a row without a source is refused', () => errs([row('Tier', { actor: 'AUTH-ACTOR-CC', tier: 'executor' }, { source: '' })]) === 1);
  t('a row without a title is refused', () => errs([row('Tier', { actor: 'AUTH-ACTOR-CC', tier: 'executor' }, { title: '' })]) === 1);
  t('an unknown relation is refused', () => errs([row('Appetite', {})]) === 1);
  t('an id outside AUTH-* is refused', () => errs([row('Tier', { actor: 'AUTH-ACTOR-CC', tier: 'executor' }, { id: 'X-1' })]) === 1);
  t('a source of "convention" is refused', () => errs([row('Tier', { actor: 'AUTH-ACTOR-CC', tier: 'executor' }, { source: 'convention' })]) === 1);

  // Actor.
  t('an Actor citing a role row passes', () => errs([row('Actor', { role: 'ROLE-CC' })]) === 0);
  t('an Actor citing anything else is refused', () => errs([row('Actor', { role: 'A18' })]) === 1);

  // Outside parties.
  t('a May granting a read on an outside surface passes', () => errs([row('May', { tier: 'executor', action: 'AUTH-ACT-READ', surface: 'AUTH-SURF-SUPPLIER' })]) === 0);
  t('a May granting a write on an outside surface is refused', () => errs([row('May', { tier: 'executor', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SUPPLIER' })]) === 1);
  t('a May granting a write on a practice surface passes', () => errs([row('May', { tier: 'executor', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE' })]) === 0);
  const line = (text, grants, extra) => row('Line', { text, date: '2026-10-20', given_to: 'AUTH-ACTOR-CC', grants, excludes: [] }, Object.assign({ source: SRC }, extra || {}));
  t('a Line granting a write on an outside surface is refused', () => errs([line('Ship routine changes on clearance -- David Facer 10/20/2026', [{ action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SUPPLIER' }])]) === 1);

  // Forbidden.
  t('a Forbidden row with a source passes', () => errs([row('Forbidden', { tier: 'executor', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SUPPLIER' }, { source: 'AC-013' })]) === 0);
  t('a Forbidden row without a source is refused', () => errs([row('Forbidden', { tier: 'executor', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SUPPLIER' }, { source: '' })]) === 1);

  // Reach.
  const reach = (outcome, reason) => row('Reach', Object.assign({ control: 'CTRL-1', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE', date: '2026-10-20', outcome, probe: 'tools/reach-probe.js' }, reason ? { reason } : {}));
  t('a refused Reach passes', () => errs([reach('refused')]) === 0);
  t('a not-probed Reach with a reason passes', () => errs([reach('not-probed', 'attempting it is the forbidden act')]) === 0);
  t('a not-probed Reach without a reason is refused', () => errs([reach('not-probed')]) === 1);

  // Covers without Reach: reported, never refused.
  const covers = row('Covers', { control: 'CTRL-1', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE' });
  t('a Covers row with no Reach is reported, not refused', () => errs([covers]) === 0 && reps([covers]) === 1);
  t('a Covers row with its Reach is not reported', () => reps([covers, reach('refused')]) === 0);

  // Rules and strata.
  const rule = (head, body, stratum, id) => row('Rule', { head, body, stratum }, { id: 'AUTH-RULE-' + id });
  const authorized = rule('Authorized(a,k,s)', ['Tier(a,t)', 'May(t,k,s)'], 1, 'A');
  const permitted = rule('Permitted(a,k,s)', ['Authorized(a,k,s)', 'not Forbidden(a,k,s)'], 1, 'P');
  const refuse = rule('Refuse(a,k,s)', ['Attempted(a,k,s)', 'not Permitted(a,k,s)'], 2, 'R');
  t('rules negating only lower strata pass', () => errs([authorized, permitted, refuse]) === 0);
  t('a rule negating a relation of its own stratum is refused', () => errs([authorized, permitted, rule('Refuse(a,k,s)', ['Attempted(a,k,s)', 'not Permitted(a,k,s)'], 1, 'R')]) === 1);
  t('a rule negating a relation of a higher stratum is refused', () => errs([authorized, rule('Permitted(a,k,s)', ['Authorized(a,k,s)', 'not Refuse(a,k,s)'], 1, 'P'), refuse]) >= 1);
  t('a rule without a stratum is refused', () => errs([rule('Authorized(a,k,s)', ['Tier(a,t)'], undefined, 'A')]) === 1);
  t('strata: a base relation is stratum 0, a head its rule\'s stratum', () => { const s = strata([authorized, permitted, refuse]); return s.Forbidden === 0 && s.Authorized === 1 && s.Refuse === 2; });

  // Lines and their sources.
  t('a Line quoted in its source passes', () => errs([line('Ship routine changes on clearance -- David Facer 10/20/2026', [{ action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE' }])]) === 0);
  t('a Line not quoted in its source is refused', () => errs([line('Ship every change -- David Facer 10/20/2026', [{ action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE' }])]) === 1);
  t('a Line whose source cannot be read is refused', () => errs([line('Ship routine changes on clearance -- David Facer 10/20/2026', [], { source: 'briefs/x/9-CC.md' })]) === 1);

  // Values outside the type's sets: reported.
  t('an Action kind outside the set is reported, not refused', () => errs([row('Action', { kind: 'delete', irreversible: true }, { id: 'AUTH-ACT-X' })]) === 0 && reps([row('Action', { kind: 'delete', irreversible: true }, { id: 'AUTH-ACT-X' })]) === 1);

  // 271-DT2: three reports, never refusals.
  const ids = new Set(['RULE-1', 'CTRL-2']);
  const ctx2 = Object.assign({}, ctx, { knownIds: ids });
  const reps2 = (rows) => checkRows(base.concat(rows), ctx2).reports;
  const forbid = (tier, id) => row('Forbidden', { tier, action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SUPPLIER' }, { id, source: 'AC-013' });
  t('a non-owner tier missing a prohibition the others carry is reported', () => reps2([forbid('executor', 'AUTH-F-1'), forbid('drafter', 'AUTH-F-2')]).filter((r) => /reviewer/.test(r)).length === 1);
  t('the same prohibition on every non-owner tier is not reported', () => reps2([forbid('executor', 'AUTH-F-1'), forbid('drafter', 'AUTH-F-2'), forbid('reviewer', 'AUTH-F-3')]).length === 0);
  t('a control that is not a corpus id is reported', () => reps2([row('Covers', { control: 'a gate', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE' }), reach('refused')]).filter((r) => /not a corpus id/.test(r)).length === 1);
  t('a control that is a corpus id is not reported', () => reps2([row('Covers', { control: 'CTRL-2', action: 'AUTH-ACT-PUSH', surface: 'AUTH-SURF-SITE' }), Object.assign(reach('refused'), { control: 'CTRL-2' })]).length === 0);
  const pathSurf = row('Surface', { cites: 'A21', party: 'practice', path: '.claude/settings.json' }, { id: 'AUTH-SURF-SET' });
  t('a Class member that is a Surface id is not reported', () => reps2([row('Class', { members: ['AUTH-SURF-SITE'] }, { id: 'AUTH-CLASS-1' })]).length === 0);
  t('a Class member that matches a Surface path is not reported', () => reps2([pathSurf, row('Class', { members: ['.claude/settings*.json'] }, { id: 'AUTH-CLASS-1' })]).length === 0);
  t('a Class member that names no Surface and matches no path is reported', () => reps2([row('Class', { members: ['nowhere/x.json'] }, { id: 'AUTH-CLASS-1' })]).filter((r) => /matches no Surface/.test(r)).length === 1);
  t('inClass: a member Surface id is in its class, and a path pattern takes the Surfaces it matches', () => { const m = inClass(base.concat([pathSurf, row('Class', { members: ['AUTH-SURF-SITE', '.claude/settings*.json'] }, { id: 'AUTH-CLASS-1' })])); return m.has('AUTH-SURF-SITE|AUTH-CLASS-1') && m.has('AUTH-SURF-SET|AUTH-CLASS-1') && !m.has('AUTH-SURF-SUPPLIER|AUTH-CLASS-1'); });

  // 273-DT2, bundle spec v1.42: a path surface is within the repository
  // surface citing the same application; three refusals.
  const repo = row('Surface', { cites: 'A21', party: 'practice' }, { id: 'AUTH-SURF-REPO' });
  const file = (extra) => row('Surface', Object.assign({ cites: 'A21', party: 'practice', path: 'corpus/x.md' }, extra), { id: 'AUTH-SURF-FILE' });
  t('within: a path surface is within the repository surface citing its application', () => { const w = within(base.concat([repo, file({})])); return w.has('AUTH-SURF-FILE|AUTH-SURF-REPO') && w.size === 1; });
  t('a path surface within its repository passes', () => errs([repo, file({})]) === 0);
  t('a path surface citing nothing passes, and is within nothing', () => errs([file({ cites: undefined, path: '~/x.json' })]) === 0 && within(base.concat([file({ cites: undefined })])).size === 0);
  t('a path surface whose cites matches no repository surface is refused', () => errs([file({ cites: 'A99' })]) === 1);
  t('two repository surfaces citing one application are refused', () => errs([repo, row('Surface', { cites: 'A21', party: 'practice' }, { id: 'AUTH-SURF-REPO2' })]) >= 1);
  t('a path surface whose party differs from its repository\'s is refused', () => errs([repo, file({ party: 'outside' })]) === 1);

  // 282-DT2: path matching written once, for the evaluator and the gate. A
  // folder ("ends/") takes every path under it; anything else is a pattern,
  // * within one path segment.
  t('matches: a folder takes every path under it, and nothing beside it', () => matches('gate/', 'gate/gate.js') && matches('gate/', 'gate/lib/x.js') && matches('spec/', 'spec/') && !matches('gate/', 'gatekeeper.js'));
  t('matches: a pattern matches as a pattern, * within one segment', () => matches('docs/*.secret', 'docs/a.secret') && !matches('docs/*.secret', 'docs/x/a.secret') && !matches('docs/*.secret', 'docs/a.md'));
  t('matches: * never crosses a folder, so spec/charter-*.md takes no file under spec/charter-x/', () => matches('spec/charter-*.md', 'spec/charter-cc.md') && !matches('spec/charter-*.md', 'spec/charter-x/notes.md'));
  t('matches: ** is not a crossing either; no pattern here crosses a folder', () => !matches('spec/**', 'spec/a/b.md') && matches('spec/**', 'spec/a.md'));
  t('matches: a plain path matches only itself', () => matches('.claude/settings.json', '.claude/settings.json') && !matches('.claude/settings.json', '.claude/settings.json.bak'));
  t('inClass: a folder member takes every Surface whose path is under it', () => { const m = inClass(base.concat([row('Surface', { cites: 'A13', party: 'practice', path: 'spec/charter-cc.md' }, { id: 'AUTH-SURF-CH' }), row('Class', { members: ['spec/'] }, { id: 'AUTH-CLASS-1' })])); return m.has('AUTH-SURF-CH|AUTH-CLASS-1'); });

  // 280-DT2, bundle spec v1.43: Cleared is generated from DT2's clearance
  // blocks, never written as a row.
  t('a hand-written Cleared row is refused', () => errs([row('Cleared', { commit: 'a'.repeat(40), tree: 'b'.repeat(40), base: 'c'.repeat(40), review: '300-DT2', not_run: 'none', ungated: 'none' })]) === 1);

  // The generated rule file.
  const dl = () => datalog([refuse, authorized, permitted]);
  t('the rule file says it is generated and from where', () => /GENERATED/.test(dl()) && /corpus\/authority\.md/.test(dl()));
  t('the rule file writes each rule in Datalog form', () => dl().includes('Permitted(a,k,s) :- Authorized(a,k,s), not Forbidden(a,k,s).'));
  t('the rule file orders rules by stratum, then id', () => dl().indexOf('Authorized(a,k,s) :-') < dl().indexOf('Refuse(a,k,s) :-'));
  t('the rule file marks each stratum', () => /% stratum 1/.test(dl()) && /% stratum 2/.test(dl()));
  t('the rule file is the same for the same rows', () => dl() === datalog([permitted, authorized, refuse]));

  let failed = 0;
  console.log('SELF-TEST -- the authority rows (bundle spec v1.43, EXT-012, OKF-TOGAF#219).\n');
  for (const [label, fn] of cases) {
    let ok = false, err = '';
    try { ok = fn() === true; } catch (e) { err = ' (' + e.message + ')'; }
    if (!ok) failed++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : err}`);
  }
  console.log(failed ? `\nAUTHORITY SELF-TEST FAILED: ${failed} of ${cases.length} case(s).` : `\nauthority self-test passed: ${cases.length} case(s).`);
  return failed ? 1 : 0;
}

// A path pattern as a regular expression: * matches within one path segment.
function glob(p) {
  return new RegExp('^' + String(p).split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
}

// Whether a path is matched by a member or a surface's path, written once for
// the evaluator and the deploy gate (282-DT2): a folder (ending "/") takes
// every path under it; anything else is a pattern, * within one segment.
function matches(pattern, p) {
  const m = String(pattern);
  return m.endsWith('/') ? String(p).startsWith(m) : glob(m).test(String(p));
}

// InClass(s,c), as "surface|class" keys (271-DT2): a member that is a Surface
// id is in its class, and a member that is a path pattern takes every Surface
// whose path it matches, a folder every Surface under it (282-DT2).
function inClass(rows) {
  const out = new Set();
  const surfaces = rows.filter((r) => r.relation === 'Surface');
  for (const c of rows.filter((r) => r.relation === 'Class')) {
    for (const m of [].concat(c.members || [])) {
      if (typeof m !== 'string') continue;
      for (const s of surfaces) {
        if (s.id === m || (present(s.path) && matches(m, s.path))) out.add(`${s.id}|${c.id}`);
      }
    }
  }
  return out;
}

// Within(s,r), as "file|repository" keys (273-DT2, bundle spec v1.42): a path
// surface is within the repository surface that cites the same application
// and has no path. Derived, never written (RULE-8). A path surface citing
// nothing is within nothing; one whose application has no single repository
// surface is within nothing here and refused by checkRows.
function within(rows) {
  const out = new Set();
  const surfaces = rows.filter((r) => r.relation === 'Surface');
  const repos = surfaces.filter((s) => !present(s.path) && present(s.cites));
  for (const s of surfaces.filter((x) => present(x.path) && present(x.cites))) {
    const r = repos.filter((x) => x.cites === s.cites);
    if (r.length === 1) out.add(`${s.id}|${r[0].id}`);
  }
  return out;
}

module.exports = { RELATIONS, checkRows, strata, datalog, inClass, within, matches, selfTest };
