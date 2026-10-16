#!/usr/bin/env node
// Self-test for the code gate -- WP-D6-06, OKF-TOGAF#160, on "WP-D6-06: start it
// -- David Facer 10/16/2026" and its ruled reach: "Secrets refuse the build on
// both gated sites, lint and dependency audit report there, D8 re-scored on a
// live run" (104-DT2 of OKF TOGAF briefs/2026-10-01-svm-tranche-3/). A secret in
// the code refuses the build; lint and the dependency audit only report. The
// gate prints a secret's file, line and kind, never its value.
//
// Every planted fake below is assembled at run time, so this file never holds a
// secret-shaped string for the real scan to find. Offline; exit 1 on a failure.
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const root = path.join(__dirname, "..");
let bad = 0;
const ok = (c, what, shown) => { console.log("  " + (c ? "PASS" : "FAIL") + "  " + what + (shown ? "   " + shown : "")); if (!c) bad = 1; };
console.log("SELF-TEST -- the code gate (WP-D6-06, OKF-TOGAF#160).\n");

let G = null;
try { G = require(path.join(root, "scripts", "code-gate.js")); } catch (e) { console.log("  FAIL scripts/code-gate.js does not load: " + e.message); bad = 1; }

if (G) {
  // A planted tree: three real-shaped secrets, three that are not, and three places never scanned.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "code-gate-"));
  const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
  const gh = "gh" + "p_" + "A1b2C3d4".repeat(5);
  const aws = "AK" + "IA" + "ABCDEFGHIJKLMNOP";
  const pw = "hunter" + "2hunter2xyz";
  put("lib/a.js", "const t = \"" + gh + "\";\n");
  put("notes/b.txt", "line one\nkey " + aws + "\n");
  put("lib/c.js", "const cfg = { apiKey: process.env.OPENAI_API_KEY, model: \"x\" };\n");
  put("lib/d.js", "const pass" + "word = \"" + pw + "\";\n");
  put("README.md", "Write to someone" + "@" + "example.com for help.\n");
  put("node_modules/pkg/x.js", "const t = \"" + gh + "\";\n");
  put(".next/server/y.js", "const t = \"" + gh + "\";\n");
  fs.writeFileSync(path.join(dir, "logo.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]));
  const hits = G.scanSecrets(dir);
  const seen = hits.map((h) => h.file.replace(/\\/g, "/") + ":" + h.line + ":" + h.kind).sort();
  ok(JSON.stringify(seen) === JSON.stringify(["lib/a.js:1:github", "lib/d.js:1:assign", "notes/b.txt:2:aws"]),
    "three planted secrets found, by file, line and kind", JSON.stringify(seen));
  ok(!hits.some((h) => /c\.js/.test(h.file)), "a value read from process.env is not a secret");
  ok(!hits.some((h) => /README/.test(h.file)), "an email address is not a secret");
  ok(!hits.some((h) => /node_modules|\.next|logo\.png/.test(h.file.replace(/\\/g, "/"))), "installed packages, build output and binaries are not scanned");
  const printed = G.formatSecrets(hits);
  ok(/lib\/a\.js:1 +github/.test(printed.replace(/\\/g, "/")) && !printed.includes(gh) && !printed.includes(aws) && !printed.includes(pw),
    "the report names file, line and kind, and never the value");
  ok(G.secretExit(hits) === 1 && G.secretExit([]) === 0, "a secret refuses the build; none lets it through");
  // Staged as 104-DT2 section 5 and 108-CC section 4 recorded it, as Ring 3 was:
  // stage 1 runs all three checks on a live build and refuses nothing; stage 2
  // refuses on a secret. The stage is one constant, so moving it is one commit.
  ok(G.STAGE === 1, "stage 1: all three checks report, nothing refuses yet", "STAGE " + G.STAGE);
  ok(typeof G.gateExit === "function" && G.gateExit(hits, false) === (G.STAGE >= 2 ? 1 : 0) && G.gateExit(hits, true) === 0 && G.gateExit([], false) === 0,
    "the build's exit follows the stage; --report never refuses");
  fs.rmSync(dir, { recursive: true, force: true });

  // Lint and the audit report, and never refuse -- even when they cannot run.
  const fail = () => { throw new Error("not available"); };
  const lintOut = JSON.stringify([{ filePath: "a.js", errorCount: 2, warningCount: 1 }, { filePath: "b.js", errorCount: 0, warningCount: 3 }]);
  const L = G.lintReport(root, () => lintOut);
  ok(L.state === "read" && L.errors === 2 && L.warnings === 4 && L.files === 2, "lint reports errors and warnings by count", JSON.stringify(L));
  ok(G.lintReport(root, fail).state === "not run", "lint that cannot run says so and refuses nothing");
  const auditOut = JSON.stringify({ metadata: { vulnerabilities: { info: 0, low: 1, moderate: 2, high: 0, critical: 0, total: 3 } } });
  const A = G.auditReport(root, () => auditOut);
  ok(A.state === "read" && A.moderate === 2 && A.low === 1 && A.total === 3, "the dependency audit reports counts by severity", JSON.stringify(A));
  ok(G.auditReport(root, fail).state === "not read", "an audit that cannot reach the registry says so and refuses nothing");

  // The site itself scans clean today, so the gate can refuse from its first build.
  const real = G.scanSecrets(root);
  ok(real.length === 0, "this site's own code holds no secret", real.length ? G.formatSecrets(real) : "");
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
ok(/work-item-gate\.js && node scripts\/code-gate\.js/.test(pkg.scripts.prebuild || ""), "the build runs the code gate, right after the Work Item gate");
ok(/code-gate-self-test\.js/.test(pkg.scripts.prebuild || ""), "the build runs this test first");
ok(!!(pkg.devDependencies && pkg.devDependencies.eslint), "the linter is a development dependency");
// Next's build runs the linter itself once one is installed, and refuses on an
// error -- which would make lint refuse. The gate reports lint; Next must not.
const nextCfg = require(path.join(root, "next.config.js"));
ok(!!(nextCfg.eslint && nextCfg.eslint.ignoreDuringBuilds), "Next's own build does not let lint refuse");

process.exitCode = bad;
