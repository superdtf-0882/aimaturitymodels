#!/usr/bin/env node
// The code gate -- WP-D6-06, OKF-TOGAF#160, on "WP-D6-06: start it -- David
// Facer 10/16/2026". Its reach, ruled in 104-DT2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/: "Secrets refuse the build on both gated
// sites, lint and dependency audit report there, D8 re-scored on a live run".
//
//   SECRETS REFUSE. A secret shipped cannot be called back, so a secret-shaped
//   string in the code stops the build. The report names the file, the line and
//   the kind, never the value. Patterns are OKF TOGAF's tools/lib/redact-patterns.js
//   (the session-trace export's), copied here less the email shape -- an address
//   on a page is not a secret -- and less an assignment read from process.env,
//   which names a variable and holds nothing (found on pages/api/diagnostic.js
//   by the baseline run, 2026-10-16).
//   LINT AND THE DEPENDENCY AUDIT REPORT. They catch patterns and mostly
//   reversible risk, so they print counts and refuse nothing. A rule moves to
//   refusing only when its own record shows it would fire rarely and the harm is
//   real, on the owner's word (104-DT2 Q2). The counts are read at each digest
//   by running this script with --report on a clean copy of the pushed commit,
//   not from the host: its build log shows the same counts, and for a secret the
//   file, line and kind, never the value. Nothing is published on the site.
//   STAGED as 104-DT2 section 5 and 108-CC section 4 recorded it, as Ring 3 was:
//   at STAGE 1 all three checks run on a live build and nothing refuses; at
//   STAGE 2 a secret refuses. The owner approved refusal for secrets
//   ("104-DT2 answers: Q1 secrets refuse ... -- David Facer 10/6/2026").
//
// HOW IT CAN BE CROSSED (RULE-10, declared): a secret in a shape no pattern
// knows passes; a secret split across lines passes; the owner can edit this
// file. The host's own secret scanning on the repository is a second, separate
// stop (WP-D6-06 activity 2).
//
// Usage: node scripts/code-gate.js            (the build: at stage 2 a secret refuses; the rest report)
//        node scripts/code-gate.js --report   (read only: nothing refuses)
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const SHAPES = [
  { kind: "privatekey", re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { kind: "github", re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/ },
  { kind: "apikey", re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/ },
  { kind: "aws", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { kind: "jwt", re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
];
const SEP = String.raw`\s*["']?\s*[:=]\s*["']?`;
const VAL = String.raw`([^\s"'\x60,;)}\]]{8,})`;
const ASSIGNS = [
  { kind: "vercel", re: new RegExp(String.raw`(\b(?:VERCEL|VC)_[A-Z0-9_]*TOKEN)(` + SEP + ")" + VAL, "gi") },
  { kind: "assign", re: new RegExp(String.raw`(?<![<A-Za-z0-9_])([A-Za-z0-9_]*(?:password|passwd|secret|api_key|apikey|token))(` + SEP + ")" + VAL, "gi") },
];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".vercel", "out"]);
const BINARY = /\.(png|jpe?g|gif|ico|webp|avif|woff2?|ttf|otf|eot|pdf|xlsx?|zip|gz|mp3|mp4|webm|svg)$/i;

function kindsIn(line) {
  const kinds = [];
  for (const { kind, re } of SHAPES) if (re.test(line)) kinds.push(kind);
  for (const { kind, re } of ASSIGNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) {
      if (/^process\.env\b/.test(m[3])) continue; // names a variable, holds nothing
      kinds.push(kind);
      break;
    }
    re.lastIndex = 0;
  }
  return kinds;
}

// Every text file under root, less installed packages, build output and binaries.
function scanSecrets(root) {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name)); continue; }
      if (!e.isFile() || BINARY.test(e.name)) continue;
      const full = path.join(dir, e.name);
      let text;
      try { text = fs.readFileSync(full, "utf8"); } catch { continue; }
      if (text.includes("\u0000")) continue;
      text.split(/\r?\n/).forEach((line, i) => {
        for (const kind of kindsIn(line)) hits.push({ file: path.relative(root, full), line: i + 1, kind });
      });
    }
  };
  walk(root);
  return hits;
}
const formatSecrets = (hits) => hits.map((h) => "  " + h.file.replace(/\\/g, "/") + ":" + h.line + "  " + h.kind).join("\n");
const secretExit = (hits) => (hits.length ? 1 : 0);
const STAGE = 2; // 1: everything reports. 2: a secret refuses the build.
const gateExit = (hits, reportOnly) => (reportOnly || STAGE < 2 ? 0 : secretExit(hits));

// The runners return stdout; a tool that exits non-zero on findings still reports.
// The command is this file's own constant, never input, so it runs as one line.
function run(command, cwd) {
  const r = spawnSync(command, { cwd, encoding: "utf8", shell: true, timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (!r.stdout || !r.stdout.trim()) throw new Error("no output" + (r.stderr ? ": " + r.stderr.split("\n")[0] : ""));
  return r.stdout;
}
function lintReport(root, runner) {
  try {
    const out = (runner || ((d) => run("npx --no-install eslint . --ext .js,.jsx -f json", d)))(root);
    const files = JSON.parse(out);
    const withProblems = files.filter((f) => f.errorCount || f.warningCount);
    return { state: "read", files: withProblems.length, errors: files.reduce((p, f) => p + f.errorCount, 0), warnings: files.reduce((p, f) => p + f.warningCount, 0) };
  } catch (e) {
    return { state: "not run", why: String(e.message || e).split("\n")[0] };
  }
}
function auditReport(root, runner) {
  try {
    const out = (runner || ((d) => run("npm audit --json", d)))(root);
    const v = (JSON.parse(out).metadata || {}).vulnerabilities;
    if (!v) throw new Error("no vulnerability counts in the audit's answer");
    return { state: "read", info: v.info || 0, low: v.low || 0, moderate: v.moderate || 0, high: v.high || 0, critical: v.critical || 0, total: v.total || 0 };
  } catch (e) {
    return { state: "not read", why: String(e.message || e).split("\n")[0] };
  }
}

function main(argv) {
  const reportOnly = argv.includes("--report");
  const root = path.join(__dirname, "..");
  console.log("CODE GATE (WP-D6-06, OKF-TOGAF#160), stage " + STAGE + (reportOnly ? " -- report only" : ""));
  const hits = scanSecrets(root);
  const refuses = gateExit(hits, reportOnly) !== 0;
  if (hits.length) {
    console.log("SECRETS: " + hits.length + " found -- " + (refuses ? "THE BUILD IS REFUSED" : "reported" + (reportOnly ? "" : "; stage 2 would refuse this build")) + ". File, line and kind; the value is never printed:");
    console.log(formatSecrets(hits));
  } else console.log("SECRETS: none found.");
  const L = lintReport(root);
  console.log("LINT (reports, refuses nothing): " + (L.state === "read" ? L.errors + " error(s), " + L.warnings + " warning(s) in " + L.files + " file(s)." : "not run -- " + L.why));
  const A = auditReport(root);
  console.log("DEPENDENCY AUDIT (reports, refuses nothing): " + (A.state === "read" ? A.total + " known vulnerability(ies): critical " + A.critical + ", high " + A.high + ", moderate " + A.moderate + ", low " + A.low + "." : "not read -- " + A.why));
  return gateExit(hits, reportOnly);
}

module.exports = { scanSecrets, formatSecrets, secretExit, gateExit, STAGE, lintReport, auditReport, kindsIn };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
