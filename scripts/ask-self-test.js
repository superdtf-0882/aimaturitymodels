#!/usr/bin/env node
// Self-test for the ask at the end of every readout -- OKF-TOGAF#212, on the
// owner's line "Start #212 as 510-CC plans it with 247-DT2's answers; the ask
// reads "Send me your assessment summary and I'll read it with you — a short
// call, no charge."; the email asks the visitor to attach their summary --
// David Facer 10/18/2026" (OKF TOGAF briefs/2026-10-01-svm-tranche-3/510-CC,
// 247-DT2). Every readout ends with one ask; the visitor takes it by an email
// link to the owner's address, from their own mail program; the site counts
// the click per model and keeps nothing about the person.
//
// The component and pages are ES modules Next compiles, so they are read as text.
// REOPENED 2026-10-19 on the owner's test of the live ask: a web page cannot
// attach a file, so the email carries the link to the visitor's readout and
// claims no attachment, and readouts are kept four days -- the owner, in session:
// "Just include the link", "let's keep the links for four days", "re-open #212".
//
// Usage: node scripts/ask-self-test.js   (exit 1 on a failing case)
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } };
let failed = 0;
const check = (cond, what) => { console.log("  " + (cond ? "PASS" : "FAIL") + "  " + what); if (!cond) failed = 1; };

console.log("SELF-TEST -- the ask at the end of every readout (OKF-TOGAF#212).\n");
const ro = read("components/ExecutiveReadout.js");
const ASK = "Send me your assessment summary and I\u2019ll read it with you \u2014 a short call, no charge.";
const ASK_PLAIN = "Send me your assessment summary and I'll read it with you \u2014 a short call, no charge.";
check(ro.includes(ASK) || ro.includes(ASK_PLAIN), "the ask, in the owner's words");
check(/mailto:david\.facer@davidfacer\.com/.test(ro), "taken by an email link to the owner's davidfacer.com address");
check(/subject=/.test(ro) && /body=/.test(ro), "the email names the assessment and carries a short body");
const bodyLine = (ro.match(/const body = [^\n]*/) || [""])[0];
check(bodyLine !== "" && !/attach/i.test(bodyLine), "the email claims no attachment: a web page cannot attach a file");
check(/readoutUrl/.test(bodyLine) && /executivereadout/.test(ro) && /hash/.test(ro.slice(ro.indexOf("function askHref"), ro.indexOf("function askHref") + 900)), "the email carries the link to the visitor's own readout");
check(/kept for four days/.test(ro) && !/24 hours/.test(ro), "the readout page says readouts are kept for four days");
const diag = read("pages/api/diagnostic.js");
check(/READOUT_KEPT_SECONDS = 4 \* 86400/.test(diag) && /kvSet\(cacheKey, encodeEntry\(\{ readout,.*\}\), READOUT_KEPT_SECONDS\)/.test(diag), "the readout service keeps each readout four days");
check(/kvExpire\(dayKey, 86400\)/.test(diag), "the daily limit still resets each day");
check(/event: "ask-taken"/.test(ro) && /keepalive: true/.test(ro), "the click counts the ask taken, without waiting on it");
check(/modelSlug/.test(ro), "the count names the model");
check(/href="https:\/\/davidfacer\.com"[^>]*>\s*David Facer/.test(ro), "an author line names the owner and links to davidfacer.com");
const askAt = ro.indexOf("readout-ask"), actionsAt = ro.indexOf("readout-actions"), footAt = ro.lastIndexOf('className="footnote"');
check(askAt > actionsAt && actionsAt > -1 && askAt < footAt, "the ask comes after the readout and its buttons, before the footnote");
check((ro.match(/mailto:/g) || []).length === 1, "one ask, once");
check(!/localStorage|sessionStorage|document\.cookie/.test(ro), "nothing is kept in the visitor's browser");

for (const [dir, slug] of [["sdlc", "sdlc"], ["pdlc", "pdlc"], ["prioritization", "prioritization"], ["ea", "ea"], ["productmarketing", "prodmar"]]) {
  const page = read("pages/models/" + dir + "/executivereadout.js");
  check(page.includes('modelSlug="' + slug + '"'), "the " + dir + " readout names its model as its assessment does, " + slug);
}
check(/ask-self-test\.js/.test(read("package.json")), "this test runs before every build");
console.log(failed ? "\nSELF-TEST FAILED." : "\nSelf-test passed.");
process.exit(failed);
