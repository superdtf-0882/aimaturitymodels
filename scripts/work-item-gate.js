#!/usr/bin/env node
//
// work-item-gate.js -- Work Item SOP ring 3: the deploy gate. SOURCE OF RECORD
// (TC-55); copies live, byte-identical, as scripts/work-item-gate.js in each
// enforced surface that builds on Vercel, wired FIRST in its `prebuild`.
//
// Ruled by DT2 in briefs/2026-10-01-svm-tranche-3/10-DT2 section 2, on the
// consultation 07-DT2 as settled by 08-CC and measured by 09-CC; ratified
// "Ring 3: A with the refused paths per surface (08-CC §3 ii), B digest, C
// enforced surfaces only, with the gate reading Vercel's commit-message variable
// and no other (08-CC §4 i), D surfaces to enforce: davidfacer.com,
// aimaturitymodels.com -- David Facer 10/1/2026" and "I ratify 10-DT2 of
// svm-tranche-3; previews: refused like production; SDLC short form pinned at
// 0c9b887 (11-CC §3); build:local without the gate (11-CC §4) -- David Facer
// 10/2/2026". Work Item OKF-TOGAF#141.
//
// WHAT IT DOES. Ring 2 (the commit-msg hook) runs on the workstation and cannot
// see a commit made anywhere else -- the web editor, a bot, a clone without the
// hook, a skipped hook. Every one of those still has to BUILD to go live. This
// runs at build time and refuses a build whose commit carries neither a
// qualified Work-Item line nor the owner's mark, `Work-Item: de-minimis`.
//
// IT READS ONE VALUE AND NO OTHER: Vercel's commit-message variable, by the
// owner's word (08-CC §4 i). It never lists, dumps or prints the environment,
// and it never prints the message. It prints four facts: whether the variable
// is present, its length in bytes, whether a Work-Item line or the mark was
// found, and whether the length says it was probably cut.
//
// IT CANNOT TELL A PREVIEW FROM A PRODUCTION BUILD -- that would be a second
// variable -- so it refuses both, on the owner's word ("previews: refused like
// production"). Under ring 2 a preview fails only on a commit the hook would
// itself have refused on an enforced surface.
//
// THE 2048 CUT. Vercel truncates this variable past 2048 bytes (its system-
// variables documentation, quoted in 09-CC). A value at or within four bytes of
// that length is read as POSSIBLY CUT -- the four bytes allow for a cut that
// lands on a UTF-8 character boundary -- and its last line is dropped before
// matching, because a partial trailer can still match with the wrong number.
// The hook holds the same line wholly inside the first 2048 bytes, so a commit
// that passed ring 2 on an enforced surface always passes here.
//
// TWO MODES, chosen by an ARGUMENT in the surface's package.json and never by
// the environment:
//   --report   STAGE 1. Prints the four facts and exits 0. Run on a preview
//              branch first, so a project whose system variables are not
//              exposed shows ABSENT in a log instead of refusing every build.
//   (none)     STAGE 2. Refuses -- exit 1 -- when the variable is absent or
//              empty (fail closed, which also stops a command-line build), or
//              when it carries neither a Work-Item line nor the mark.
//   --self-test  runs the cases below against synthetic values; reads no
//              environment variable at all.
//
// HOW THIS CONTROL CAN BE CROSSED (RULE-10)
//   1. THE MARK. Declared and visible: the coverage report lists every one.
//   2. IT READS THE DEPLOYED COMMIT ONLY. Earlier commits in the same push go
//      live unread here; the coverage report's deploy view shows them (09-CC:
//      2 of 28 production deploys on the gated surfaces since 2026-09-01).
//   3. IT TRUSTS VERCEL'S VARIABLE. A value Vercel sets wrongly is read as set.
//   4. THE OWNER CAN REMOVE THE `prebuild` LINE, CHANGE THE BUILD COMMAND, OR
//      DEPLOY A PREBUILT OUTPUT. Any of them skips this file; the first is a
//      commit on a tooling path, which ring 2 refuses under the mark.
//   5. NON-VERCEL SURFACES HAVE NO GATE. Ring 2 alone covers them.
//   6. A STALE COPY. A surface's copy can drift from this source of record;
//      tools/deployed-copies.js compares them, as it does the hook copies.
//   7. `build:local` RUNS WITHOUT THIS GATE, on the owner's word (11-CC §4):
//      on the workstation the variable is never set, so a gated local build
//      would always refuse. That build deploys nothing.
//
// EXIT CONTRACT: 0 pass (or report mode, or self-test passed); 1 refuse (or a
// self-test case failed). Nothing else.

'use strict';

const LIMIT = 2048;
const SLACK = 4;
const WI_RE = /^Work-Item:[ \t]*[A-Za-z0-9_.-]+#[0-9]+[ \t\r]*$/m;
const DM_RE = /^Work-Item:[ \t]*de-minimis[ \t\r]*$/m;

// The whole decision, as a pure function of the one value, so --self-test
// exercises the thing that runs rather than a restatement of it.
function judge(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return { present: false, bytes: 0, cut: false, found: 'none', pass: false };
  }
  const bytes = Buffer.byteLength(value, 'utf8');
  const cut = bytes >= LIMIT - SLACK;
  let text = value;
  if (cut) {
    const lines = text.split('\n');
    lines.pop();
    text = lines.join('\n');
  }
  const found = WI_RE.test(text) ? 'work-item' : (DM_RE.test(text) ? 'de-minimis' : 'none');
  return { present: true, bytes, cut, found, pass: found !== 'none' };
}

function facts(j) {
  return [
    `  variable present: ${j.present ? 'yes' : 'NO'}`,
    `  length: ${j.bytes} bytes${j.cut ? ` -- at Vercel's ${LIMIT}-byte cut, so probably truncated; its last line was not read` : ''}`,
    `  found: ${j.found === 'none' ? 'NEITHER a Work-Item line nor the mark' : (j.found === 'work-item' ? 'a qualified Work-Item line' : 'the de-minimis mark')}`,
  ].join('\n');
}

function selfTest() {
  const pad = (n) => Array.from({ length: Math.ceil(n / 64) }, () => 'a body line that pads this synthetic message toward the cut....').join('\n');
  const cutAt = (s) => Buffer.from(s, 'utf8').subarray(0, LIMIT).toString('utf8');
  const cases = [
    ['a qualified Work-Item line', 'subject\n\nWork-Item: OKF-TOGAF#141', true],
    ['the mark', 'subject\n\nWork-Item: de-minimis', true],
    ['neither', 'subject\n\nno trailer here', false],
    ['a bare #120, unqualified', 'subject\n\nWork-Item: #120', false],
    ['absent', undefined, false],
    ['empty', '', false],
    ['cut at 2048, the line past the cut', cutAt('subject\n\n' + pad(2300) + '\nWork-Item: OKF-TOGAF#141'), false],
    ['cut at 2048, the line near the top', cutAt('subject\n\nWork-Item: OKF-TOGAF#141\n\n' + pad(2300)), true],
    ['cut mid-trailer: a partial line must not pass', cutAt('subject\n\n' + 'x'.repeat(2025) + '\nWork-Item: OKF-TOGAF#141'), false],
    ['CRLF message with a qualified line', 'subject\r\n\r\nWork-Item: OKF-TOGAF#141\r\n', true],
  ];
  let failed = 0;
  const seen = new Set();
  console.log('WORK ITEM GATE -- SELF-TEST. No environment variable is read.\n');
  for (const [label, value, want] of cases) {
    const j = judge(value);
    const ok = j.pass === want;
    if (!ok) failed++;
    seen.add(j.pass);
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${(j.pass ? 'PASS' : 'REFUSE').padEnd(6)} (expected ${(want ? 'PASS' : 'REFUSE').padEnd(6)})  ${label}  [${j.bytes} bytes${j.cut ? ', cut' : ''}, found ${j.found}]`);
  }
  console.log(`\n  (control: ${cases.length} case(s); distinct verdicts seen: ${seen.size} -- a self-test returning one verdict discriminates nothing)`);
  if (seen.size < 2) { console.log('\nREFUSE: every case returned the same verdict. The test is not testing.'); return 1; }
  if (failed) { console.log(`\nSELF-TEST FAILED: ${failed} case(s).`); return 1; }
  console.log('\nSelf-test passed.');
  return 0;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) { process.exitCode = selfTest(); return; }
  const report = argv.includes('--report');
  // THE ONE READ. By name, never by enumeration.
  const j = judge(process.env.VERCEL_GIT_COMMIT_MESSAGE);
  const mode = report ? 'STAGE 1 -- REPORT MODE, nothing refused' : 'STAGE 2 -- REFUSING';
  console.log(`WORK ITEM GATE (ring 3) -- ${mode}`);
  console.log(facts(j));
  if (j.pass) { console.log('  PASS'); process.exitCode = 0; return; }
  if (report) {
    console.log(`  WOULD REFUSE in stage 2${j.present ? '' : ' -- the variable is absent: check the project setting "Enable access to System Environment Variables" before stage 2'}.`);
    process.exitCode = 0;
    return;
  }
  console.log('');
  console.log('  REFUSED. This build\'s commit carries neither a qualified Work-Item line nor the');
  console.log('  owner\'s mark. Add one near the top of the message, in a new commit:');
  console.log('      Work-Item: OKF-TOGAF#NNN');
  console.log('      Work-Item: de-minimis       (not on tooling)');
  if (j.cut) console.log(`  The message is at Vercel's ${LIMIT}-byte cut: a Work-Item line past it is never seen here.`);
  if (!j.present) console.log('  The variable is absent: a command-line build, or system variables not exposed to this project.');
  console.log('  Governing record: corpus/catalog_applications.md and OI-81, in OKF-TOGAF.');
  process.exitCode = 1;
}

main();
