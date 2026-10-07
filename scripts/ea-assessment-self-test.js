#!/usr/bin/env node
// Self-test for OKF-TOGAF#145 -- EA assessment parity, on "Build #145 as
// DTOG's package plans it; fix the stale EA line on /assessments now --
// David Facer 10/7/2026". The plan is DTOG's package in OKF TOGAF
// briefs/2026-09-26-ea-assessment-parity/.
//
// First, the stale line: /assessments said the EA assessment was "Waiting on
// the model itself", but the EA model has been live since 2026-09-12
// (OKF-TOGAF#126).
//
// Source checks, offline.
// Usage: node scripts/ea-assessment-self-test.js   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } };

console.log("--- /assessments, the EA row ---");
{
  const page = read("pages/assessments/index.js");
  const i = page.indexOf("AI-Native EA Maturity Assessment");
  const row = i < 0 ? "" : page.slice(i, page.indexOf("</span>", i) + 7);
  say(i >= 0, "the EA row exists");
  say(!!row && !/Waiting on the model itself/.test(row), "it no longer says the model is missing");
  say(/model is published/i.test(row), "it says the model is published", JSON.stringify((row.match(/model-desc">\s*([^<]*)/) || [])[1] || "").slice(0, 90));
}

process.exitCode = bad;
