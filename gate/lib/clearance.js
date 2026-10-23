// clearance.js -- read DT2's clearance blocks and a shipping commit's
// Cleared-By line, and match the two (bundle spec v1.43, EXT-012; 280-DT2,
// ratified "Ratify 280-DT2's clearance block and Cleared-By line as the
// authority type's Cleared, for CC to land as bundle spec v1.43 -- David
// Facer 10/20/2026"; OKF-TOGAF#219).
//
// A pure library: no file, no git, no environment. The gate on a site reads
// the commit's message through git and hands it here; the filing act hands it
// the filed reviews' text. Cleared is generated from the blocks, never written
// as a row.
//
// The block, at column 0 in a filed DT2 review:
//   Cleared: <repository>@<commit>
//     tree: <tree id>
//     base: <commit the review was against>
//     not_run: <what the review didn't run, or "none">
//     ungated: public-claim <none|touched>; credentials <none|touched>; irreversible <none|touched>
//
// The line, in the commit that ships:
//   Cleared-By: <review brief id> tree <tree id> base <commit> ungated none
//
// The block's commit is the one reviewed. The commit that ships differs from
// it by its message, so the two are matched by review, tree and base, never by
// commit id.
'use strict';

const SHA = /^[0-9a-f]{40}$/;
const HEAD = /^Cleared:[ \t]*(\S+)@([0-9a-f]{7,40})[ \t]*$/;
const ANY_HEAD = /^Cleared:/;
const FIELD = /^[ \t]+(tree|base|not_run|ungated):[ \t]*(.*?)[ \t]*$/;
const FIELDS = ['tree', 'base', 'not_run', 'ungated'];
const LINE = /^Cleared-By:/;
const LINE_FORM = /^Cleared-By:[ \t]+(\S+)[ \t]+tree[ \t]+([0-9a-f]{40})[ \t]+base[ \t]+([0-9a-f]{7,40})[ \t]+ungated[ \t]+(\S+)[ \t]*$/;
const lines = (text) => String(text || '').split(/\r?\n/);

// "public-claim none; credentials touched" -> { 'public-claim': 'none', ... }.
// An entry that has left the list (its gate proved) is simply absent.
function ungatedOf(v) {
  const out = {};
  for (const part of String(v).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^([a-z][a-z-]*)[ \t]+(\S+)$/.exec(part);
    if (!m || !['none', 'touched'].includes(m[2])) return null;
    out[m[1]] = m[2];
  }
  return Object.keys(out).length ? out : null;
}

// Every clearance block in a review's text, at column 0.
function blocks(text) {
  const ls = lines(text), out = [], errors = [];
  for (let i = 0; i < ls.length; i++) {
    if (!ANY_HEAD.test(ls[i])) continue;
    const h = HEAD.exec(ls[i]);
    if (!h) { errors.push(`line ${i + 1}: a Cleared block must name <repository>@<commit>`); continue; }
    const b = { line: i + 1, repository: h[1], commit: h[2] };
    let j = i + 1;
    for (; j < ls.length; j++) { const f = FIELD.exec(ls[j]); if (!f) break; b[f[1]] = f[2]; }
    i = j - 1;
    const bad = [];
    for (const f of FIELDS) if (!b[f]) bad.push(`no ${f}`);
    if (b.tree && !SHA.test(b.tree)) bad.push('tree is not a 40-character id');
    if (b.base && !/^[0-9a-f]{7,40}$/.test(b.base)) bad.push('base is not a commit id');
    if (b.ungated) { const u = ungatedOf(b.ungated); if (!u) bad.push('ungated must list entries each none or touched'); else b.ungated = u; }
    if (bad.length) errors.push(`line ${b.line}: ${bad.join('; ')}`);
    else out.push(b);
  }
  return { blocks: out, errors };
}

// The Cleared-By line of a commit message: null when absent, { malformed }
// when present but not in form or given twice.
function clearedBy(message) {
  const found = lines(message).filter((l) => LINE.test(l));
  if (!found.length) return null;
  if (found.length > 1) return { malformed: true, reason: 'more than one Cleared-By line' };
  const m = LINE_FORM.exec(found[0]);
  if (!m) return { malformed: true, reason: 'Cleared-By is not in form' };
  return { review: m[1], tree: m[2], base: m[3], ungated: m[4] };
}

// The brief an Owner-Line names: null when absent, false when given twice.
const OWNER = /^Owner-Line:[ \t]+(\S+)[ \t]*$/;
function ownerLine(message) {
  const found = lines(message).map((l) => OWNER.exec(l)).filter(Boolean);
  if (!found.length) return null;
  return found.length > 1 ? false : found[0][1];
}

// What the gate refuses, given the line and what the build sees: the tree
// that ships, whether a commit is in the build's history, and the brief the
// commit's Owner-Line names, if any. A touched line ships only with
// Owner-Line, which adds the owner's word to the review and replaces none of
// it (DT2 to CC, 10/20).
function gateRefusals(line, sees) {
  if (!line) return ['no Cleared-By line'];
  if (line.malformed) return [line.reason];
  const out = [];
  if (line.tree !== sees.tree) out.push('the cleared tree is not the tree that ships');
  if (!sees.hasBase(line.base)) out.push('the cleared base is not in the build\'s history');
  if (line.ungated === 'touched') { if (!sees.ownerLine) out.push('the clearance touches an exclusion no gate sees; that needs the owner\'s line'); }
  else if (line.ungated !== 'none') out.push('ungated must be none or touched');
  return out;
}

const sameCommit = (a, b) => !!a && !!b && a.length >= 7 && b.length >= 7 && (a.startsWith(b) || b.startsWith(a));

// What the filing act reports for one shipped commit: its repository, its
// line, and the brief its Owner-Line names (or false), against the filed
// blocks by review id.
function filingFindings(shipped, filedBlocks) {
  const c = shipped.clearedBy;
  if (!c || c.malformed) return [];
  if (!Object.prototype.hasOwnProperty.call(filedBlocks, c.review)) return [`Cleared-By names ${c.review}, which is no filed DT2 review`];
  const bs = (filedBlocks[c.review] || []).filter((b) => b.repository === shipped.repository);
  if (!bs.length) return [`${c.review} has no clearance block for ${shipped.repository}`];
  const b = bs.find((x) => x.tree === c.tree && sameCommit(x.base, c.base));
  if (!b) return [`${c.review}'s block does not match the line's tree and base`];
  const touched = Object.keys(b.ungated).filter((k) => b.ungated[k] === 'touched');
  const out = [];
  if (c.ungated !== (touched.length ? 'touched' : 'none')) out.push(`${c.review}'s block and the line differ on ungated`);
  if (touched.length && !shipped.ownerLine) out.push(`${c.review}'s block says ${touched.join(', ')} touched, and the commit shipped without Owner-Line`);
  return out;
}

function selfTest() {
  const cases = [];
  const t = (label, fn) => cases.push([label, fn]);
  const TREE = 'a'.repeat(40), BASE = 'b'.repeat(40), REV = 'c'.repeat(40), OTHER = 'd'.repeat(40);
  const blockText = (o) => {
    const v = Object.assign({ head: `Cleared: superdtf-0882/okf-probe-inside@${REV}`, tree: TREE, base: BASE, not_run: 'none', ungated: 'public-claim none; credentials none; irreversible none' }, o || {});
    return ['# 300-DT2 -- a review', '', 'Some prose.', '', v.head,
      ...(v.tree === null ? [] : [`  tree: ${v.tree}`]),
      ...(v.base === null ? [] : [`  base: ${v.base}`]),
      ...(v.not_run === null ? [] : [`  not_run: ${v.not_run}`]),
      ...(v.ungated === null ? [] : [`  ungated: ${v.ungated}`]),
      '', '## Verification note', ''].join('\n');
  };
  const line = (o) => { const v = Object.assign({ review: '300-DT2', tree: TREE, base: BASE, ungated: 'none' }, o || {}); return `Cleared-By: ${v.review} tree ${v.tree} base ${v.base} ungated ${v.ungated}`; };
  const msg = (l) => ['Ship a routine change', '', 'Work-Item: OKF-TOGAF#219', l, '', 'Co-Authored-By: x'].join('\n');

  // The block.
  t('a well-formed block is read with its five parts', () => { const b = blocks(blockText()).blocks; return b.length === 1 && b[0].repository === 'superdtf-0882/okf-probe-inside' && b[0].commit === REV && b[0].tree === TREE && b[0].base === BASE && b[0].not_run === 'none' && b[0].ungated['public-claim'] === 'none' && b[0].ungated.credentials === 'none' && b[0].ungated.irreversible === 'none'; });
  t('a review with no block has none, and no error', () => { const r = blocks('# 301-DT2\n\nAsks for changes.\n'); return r.blocks.length === 0 && r.errors.length === 0; });
  t('a block indented or quoted is not a block', () => blocks(blockText().replace(/^Cleared:/m, '  Cleared:')).blocks.length === 0 && blocks(blockText().replace(/^Cleared:/m, '> Cleared:')).blocks.length === 0);
  t('a block missing its tree is an error', () => blocks(blockText({ tree: null })).errors.length === 1);
  t('a block missing its base is an error', () => blocks(blockText({ base: null })).errors.length === 1);
  t('a block missing not_run is an error', () => blocks(blockText({ not_run: null })).errors.length === 1);
  t('a block missing ungated is an error', () => blocks(blockText({ ungated: null })).errors.length === 1);
  t('an ungated value other than none or touched is an error', () => blocks(blockText({ ungated: 'public-claim maybe; credentials none; irreversible none' })).errors.length === 1);
  t('a touched entry is read as touched', () => blocks(blockText({ ungated: 'public-claim touched; credentials none; irreversible none' })).blocks[0].ungated['public-claim'] === 'touched');
  t('an entry that has left the list is simply absent', () => { const b = blocks(blockText({ ungated: 'public-claim none; irreversible none' })); return b.errors.length === 0 && !('credentials' in b.blocks[0].ungated); });
  t('a head without repository@commit is an error', () => blocks(blockText({ head: 'Cleared: the probe commit' })).errors.length === 1);
  t('a tree that is not a 40-character id is an error', () => blocks(blockText({ tree: 'abc' })).errors.length === 1);
  t('two blocks in one review are both read', () => blocks(blockText() + '\n' + blockText({ head: `Cleared: superdtf-0882/okf-probe-inside@${OTHER}` })).blocks.length === 2);
  t('a Built: or Started: line is not taken for a block', () => blocks('Built: OKF-TOGAF#219\nStarted: OKF-TOGAF#219\n').blocks.length === 0);

  // The line.
  t('a well-formed Cleared-By line is read', () => { const c = clearedBy(msg(line())); return c && c.review === '300-DT2' && c.tree === TREE && c.base === BASE && c.ungated === 'none'; });
  t('a message with no Cleared-By line reads null', () => clearedBy(msg('')) === null);
  t('a Cleared-By line not at column 0 is not read', () => clearedBy(msg('  ' + line())) === null);
  t('a malformed Cleared-By line reads as malformed, not as absent', () => { const c = clearedBy(msg('Cleared-By: 300-DT2 tree abc')); return c && c.malformed === true; });
  t('two Cleared-By lines read as malformed', () => { const c = clearedBy(msg(line() + '\n' + line())); return c && c.malformed === true; });
  t('CRLF line ends read the same', () => { const c = clearedBy(msg(line()).replace(/\n/g, '\r\n')); return c && c.tree === TREE && !c.malformed; });

  // The gate's refusals: what the shipping commit carries against what the build sees.
  const sees = (o) => Object.assign({ tree: TREE, hasBase: (b) => b === BASE }, o || {});
  t('the gate passes a line whose tree ships and whose base is in history', () => gateRefusals(clearedBy(msg(line())), sees()).length === 0);
  t('the gate refuses a missing line', () => gateRefusals(null, sees()).length === 1);
  t('the gate refuses a malformed line', () => gateRefusals(clearedBy(msg('Cleared-By: 300-DT2')), sees()).length === 1);
  t('the gate refuses a tree that is not the tree that ships', () => gateRefusals(clearedBy(msg(line())), sees({ tree: OTHER })).length === 1);
  t('the gate refuses a base not in the build\'s history', () => gateRefusals(clearedBy(msg(line())), sees({ hasBase: () => false })).length === 1);
  t('the gate refuses an ungated value other than none', () => gateRefusals(clearedBy(msg(line({ ungated: 'touched' }))), sees()).length === 1);
  // DT2 to CC, 10/20: a touched line ships only with Owner-Line, which adds
  // the owner's word to the review and doesn't replace it.
  t('the gate passes a touched line when the commit carries Owner-Line', () => gateRefusals(clearedBy(msg(line({ ungated: 'touched' }))), sees({ ownerLine: '583-CC' })).length === 0);
  t('Owner-Line does not excuse a tree that is not the tree that ships', () => gateRefusals(clearedBy(msg(line({ ungated: 'touched' }))), sees({ ownerLine: '583-CC', tree: OTHER })).length === 1);
  t('Owner-Line does not stand in for a missing Cleared-By', () => gateRefusals(null, sees({ ownerLine: '583-CC' })).length === 1);
  t('an ungated value neither none nor touched is refused, even with Owner-Line', () => gateRefusals(clearedBy(msg(line({ ungated: 'maybe' }))), sees({ ownerLine: '583-CC' })).length === 1);
  t('ownerLine: the brief an Owner-Line names is read, at column 0, once', () => ownerLine(msg('Owner-Line: 583-CC')) === '583-CC' && ownerLine(msg('  Owner-Line: 583-CC')) === null && ownerLine(msg('')) === null && ownerLine(msg('Owner-Line: 583-CC\nOwner-Line: 584-CC')) === false);

  // The filing act's findings: a shipped line against the filed blocks.
  const filed = (o) => Object.assign({ '300-DT2': blocks(blockText()).blocks }, o || {});
  const shipped = (o) => Object.assign({ repository: 'superdtf-0882/okf-probe-inside', clearedBy: clearedBy(msg(line())), ownerLine: false }, o || {});
  t('a shipped line matching its filed block has no finding', () => filingFindings(shipped(), filed()).length === 0);
  t('a line naming no filed review is reported', () => filingFindings(shipped({ clearedBy: clearedBy(msg(line({ review: '999-DT2' }))) }), filed()).length === 1);
  t('a named review with no block is reported', () => filingFindings(shipped(), filed({ '300-DT2': [] })).length === 1);
  t('a block whose tree differs from the line is reported', () => filingFindings(shipped({ clearedBy: clearedBy(msg(line({ tree: OTHER }))) }), filed()).length === 1);
  t('a block whose base differs from the line is reported', () => filingFindings(shipped({ clearedBy: clearedBy(msg(line({ base: OTHER }))) }), filed()).length === 1);
  t('a block for another repository is reported', () => filingFindings(shipped({ repository: 'superdtf-0882/okf-probe-outside' }), filed()).length === 1);
  t('a touched block shipped without Owner-Line is reported', () => filingFindings(shipped(), { '300-DT2': blocks(blockText({ ungated: 'public-claim touched; credentials none; irreversible none' })).blocks }).length >= 1);
  const touchedBlock = { '300-DT2': blocks(blockText({ ungated: 'public-claim touched; credentials none; irreversible none' })).blocks };
  t('a touched block shipped with Owner-Line, its line saying touched, has no finding', () => filingFindings(shipped({ ownerLine: true, clearedBy: clearedBy(msg(line({ ungated: 'touched' }))) }), touchedBlock).length === 0);
  t('a block whose ungated differs from the line is reported', () => filingFindings(shipped({ ownerLine: true }), touchedBlock).filter((f) => /ungated/.test(f)).length === 1);
  t('a line saying touched against an all-none block is reported', () => filingFindings(shipped({ ownerLine: true, clearedBy: clearedBy(msg(line({ ungated: 'touched' }))) }), filed()).filter((f) => /ungated/.test(f)).length === 1);
  // 280-DT2's refinement (DT2 to CC, 10/20): under Owner-Line, the touched
  // entries beside the brief it names, for a reader; reported, never decided.
  const ownerShipped = shipped({ ownerLine: '583-CC', clearedBy: clearedBy(msg(line({ ungated: 'touched' }))) });
  t('ownerLineNotes: a touched commit under Owner-Line names its touched entries beside the brief', () => { const n = ownerLineNotes(ownerShipped, touchedBlock); return n.length === 1 && /public-claim/.test(n[0]) && /583-CC/.test(n[0]); });
  t('ownerLineNotes: an untouched commit has no note', () => ownerLineNotes(shipped(), filed()).length === 0);
  t('ownerLineNotes: a touched commit without Owner-Line has no note, its finding is elsewhere', () => ownerLineNotes(shipped({ clearedBy: clearedBy(msg(line({ ungated: 'touched' }))) }), touchedBlock).length === 0);
  t('the commit id is never compared: a block for another reviewed commit with the same tree and base matches', () => filingFindings(shipped(), { '300-DT2': blocks(blockText({ head: `Cleared: superdtf-0882/okf-probe-inside@${OTHER}` })).blocks }).length === 0);

  let failed = 0;
  console.log('SELF-TEST -- clearance blocks and Cleared-By (bundle spec v1.43, EXT-012, OKF-TOGAF#219).\n');
  for (const [label, fn] of cases) {
    let ok = false, err = '';
    try { ok = fn() === true; } catch (e) { err = ' (' + e.message + ')'; }
    if (!ok) failed++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : err}`);
  }
  console.log(failed ? `\nCLEARANCE SELF-TEST FAILED: ${failed} of ${cases.length} case(s).` : `\nclearance self-test passed: ${cases.length} case(s).`);
  return failed;
}

// For a touched commit shipped under Owner-Line: the entries its block marks
// touched, beside the brief the Owner-Line names, so a reader can see the
// owner's quoted line covers them. That can't be judged mechanically, so it is
// reported and never decided (DT2 to CC, 10/20, on 280-DT2). shipped.ownerLine
// is the brief id the Owner-Line names, or false.
function ownerLineNotes(shipped, filedBlocks) {
  const c = shipped.clearedBy;
  if (!shipped.ownerLine || !c || c.malformed) return [];
  const b = (filedBlocks[c.review] || []).find((x) => x.repository === shipped.repository && x.tree === c.tree && sameCommit(x.base, c.base));
  if (!b) return [];
  const touched = Object.keys(b.ungated).filter((k) => b.ungated[k] === 'touched');
  return touched.length ? [`for reading: ${c.review} marks ${touched.join(', ')} touched; the owner's line is in ${shipped.ownerLine}`] : [];
}

module.exports = { blocks, clearedBy, ownerLine, gateRefusals, filingFindings, ownerLineNotes, selfTest };
