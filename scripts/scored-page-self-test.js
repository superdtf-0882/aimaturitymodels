#!/usr/bin/env node
// Self-test for OKF-TOGAF#124, the practice's EA self-assessment published
// (OKF TOGAF briefs/2026-10-01-svm-tranche-3/135-DT2 section 3.3, 287-CC),
// on "Draft the page" (David, 2026-10-13). The page shows the record of
// score, MA-2026-10-13, as accepted: ten scores, each with one plain
// sentence of evidence and its warrant mark, and the Executive Readout the
// site's own EA assessment wrote for those scores. Offline; exit 1 on a
// failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(64) + (shown || ""));
  if (!ok) bad = 1;
};
let data = null;
try { data = require(path.join(__dirname, "..", "lib", "scored.js")); } catch (e) { data = null; }
const page = (() => { try { return fs.readFileSync(path.join(__dirname, "..", "pages", "scored.js"), "utf8"); } catch (e) { return ""; } })();

// The accepted record, MA-2026-10-13: never computed here, only compared.
const RECORD = { D1: "C", D2: "B", D3: "B", D4: "B", D5: "B", D6: "C", D7: "B", D8: "B", D9: "B", D10: "A" };
const MARKS = ["measured", "from outside", "in our own words"];

say(!!data, "lib/scored.js loads");
const ea = (data && data.EA) || {};
const dims = ea.dimensions || [];
say(dims.length === 10, "ten EA dimensions", String(dims.length));
say(dims.every((d) => RECORD[d.id] === d.score), "every score is the accepted record's");
say(dims.every((d) => typeof d.evidence === "string" && d.evidence.length > 20 && d.evidence.length <= 240),
  "each score has one plain sentence of evidence, at most 240 characters");
say(dims.every((d) => Array.isArray(d.warrant) && d.warrant.length > 0 && d.warrant.every((w) => MARKS.includes(w))),
  "each score carries its warrant marks, in the page's three words");
say(dims.every((d) => !d.proof || /^(https:\/\/|\/)/.test(d.proof.href)), "every proof link is public: a site path or an https address");
say(ea.record === "MA-2026-10-13" && ea.modelVersion === "v1.1.2", "the page names the record and the model version");
say(typeof ea.readout === "string" && /^# Executive Readout/.test(ea.readout) && ea.readout.length > 2000,
  "the Executive Readout is the site's own, kept whole");
say(/never averaged|not averaged|no averaged/i.test(page + JSON.stringify(ea)), "the page says the scores are not averaged");
// The corpus is private: nothing on the page names a private repository.
const text = JSON.stringify(data || {}) + page;
say(!/davidfacer-archive|davidfacer-prototypes|market-intelligence\b|PSVM|corpus\/[a-z_]+\.md/i.test(text),
  "nothing names a private repository or a corpus file");
say(/getStaticProps|export default function/.test(page), "pages/scored.js exists and renders");

process.exitCode = bad;
