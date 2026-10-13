#!/usr/bin/env node
// Self-test for OKF-TOGAF#182, close Phase D (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/159-DT2, row 4), on "Phase D's second set as
// 159-DT2 records it: the rows, runtime and exceptions as decided; ... --
// David Facer 10/12/2026". The runtime is chosen: Node 24, pinned in each live
// repository's manifest, so a build runs what was chosen and not whatever the
// provider defaults to. Offline; exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(64) + (shown || ""));
  if (!ok) bad = 1;
};

let pkg = {};
try { pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")); } catch (e) { pkg = {}; }
const node = pkg.engines && pkg.engines.node;
say(node === "24.x", "package.json pins the runtime to Node 24 (engines.node 24.x)", String(node));
say(!/^>=|^\^|\*/.test(String(node || "")), "the pin is a major, not an open range that drifts upward");

process.exitCode = bad;
