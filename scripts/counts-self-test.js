#!/usr/bin/env node
// Self-test for the site's counters -- OKF-TOGAF#189, on "#189 as 190-DT2
// follows my line -- David Facer 10/15/2026" (190-DT2 section 2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/): count on the site before the taxonomy
// ships, so there is a baseline to compare against. What is counted, with no
// cookies and nothing about any person:
//   1. assessments started, per model, per day (UTC);
//   2. taxonomy intakes completed, per day, once the taxonomy ships;
//   3. assessments started from the taxonomy, marked by the link the intake
//      hands on (?from=taxonomy), not by tracking the visitor.
//
// lib/counts.js, pages/api/count.js and components/Assessment.js are ES
// modules Next compiles, so they are read as text; lib/counts.js's pure
// functions are run by evaluating its source with its exports stripped.
// Usage: node scripts/counts-self-test.js   (exit 1 on a failing case)
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } };
let bad = 0;
const ok = (c, what) => { console.log("  " + (c ? "PASS" : "FAIL") + "  " + what); if (!c) bad = 1; };

console.log("SELF-TEST -- the site's counters (OKF-TOGAF#189; 190-DT2 section 2).\n");
const lib = read("lib/counts.js");
let C = null;
try {
  C = new Function(lib.replace(/^export\s+/gm, "") + "\nreturn { EVENTS, MODELS, FROMS, countKey, checkCount, fromOf, utcDay, daysBack, tally };")();
} catch (e) { console.log("  FAIL lib/counts.js does not load: " + e.message); bad = 1; }

if (C) {
  const { EVENTS, MODELS, FROMS, countKey, checkCount, fromOf, utcDay, daysBack, tally } = C;
  ok(EVENTS.join(",") === "assessment-started,taxonomy-intake-completed", "two events, and only these");
  // OKF-TOGAF#202: the fifth, under the readout route's key.
  ok(MODELS.join(",") === "sdlc,pdlc,prioritization,ea,prodmar", "the five models with an assessment");
  ok(FROMS.join(",") === "direct,taxonomy", "a start comes directly or from the taxonomy");
  ok(utcDay(new Date("2026-10-15T23:30:00-06:00")) === "2026-10-16", "the day is UTC");
  ok(countKey("assessment-started", "sdlc", "taxonomy", "2026-10-15") === "count:v1:assessment-started:sdlc:taxonomy:2026-10-15", "one key per event, model, origin and day");
  ok(countKey("taxonomy-intake-completed", "-", "direct", "2026-10-15") === "count:v1:taxonomy-intake-completed:-:direct:2026-10-15", "an intake has no model");
  const good = checkCount({ event: "assessment-started", model: "pdlc", from: "taxonomy" });
  ok(good.ok && good.model === "pdlc" && good.from === "taxonomy", "a start with a known model is counted");
  ok(checkCount({ event: "taxonomy-intake-completed" }).ok && checkCount({ event: "taxonomy-intake-completed" }).model === "-", "an intake is counted without a model");
  ok(!checkCount({ event: "assessment-started" }).ok, "a start without a model is refused");
  ok(!checkCount({ event: "assessment-started", model: "nope" }).ok, "an unknown model is refused");
  ok(!checkCount({ event: "page-view", model: "sdlc" }).ok, "an unknown event is refused");
  ok(checkCount({ event: "assessment-started", model: "ea", from: "elsewhere" }).from === "direct", "an unknown origin counts as direct");
  ok(!checkCount({ event: "assessment-started", model: "ea", visitor: "x" }).ok, "anything about a person is refused, not stored");
  ok(fromOf("?from=taxonomy") === "taxonomy" && fromOf("?from=other") === "direct" && fromOf("") === "direct", "the origin is read from the link only");
  ok(daysBack("2026-10-15", 3).join(",") === "2026-10-13,2026-10-14,2026-10-15", "the days asked for, oldest first");
  const t = tally(["count:v1:assessment-started:sdlc:direct:2026-10-15", "count:v1:assessment-started:sdlc:taxonomy:2026-10-15"], ["4", null]);
  ok(t["assessment-started"].sdlc.direct["2026-10-15"] === 4 && t["assessment-started"].sdlc.taxonomy["2026-10-15"] === 0, "totals read back as numbers, a missing one as zero");
}

const api = read("pages/api/count.js");
ok(/checkCount\(/.test(api) && /kvIncr\(/.test(api), "the count route checks a count, then increments its key");
ok(/req\.method === "GET"/.test(api) && /kvMGet\(/.test(api), "the count route also reads totals back");
ok(!/headers\[?["']?x-forwarded-for|req\.socket|remoteAddress|set-cookie|Set-Cookie/i.test(api), "the count route reads no address and sets no cookie");

const kv = read("lib/kv.js");
ok(/export async function kvMGet\(/.test(kv), "the store reads many totals in one call");

const comp = read("components/Assessment.js");
ok(/assessment-started/.test(comp) && /fromOf\(/.test(comp) && /useRef\(/.test(comp), "the assessment counts its first grade, once per visit, with its origin");
ok(!/localStorage|document\.cookie/.test(comp.split("assessment-started")[0].slice(-2000) + comp.split("assessment-started")[1]?.slice(0, 2000)), "nothing is stored in the visitor's browser to count them");

const pkg = read("package.json");
ok(/counts-self-test\.js/.test(pkg), "this test runs before every build");
console.log(bad ? "\nSELF-TEST FAILED." : "\nSelf-test passed.");
process.exit(bad);
