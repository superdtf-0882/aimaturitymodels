#!/usr/bin/env node
// Self-test for OKF-TOGAF#172, on "Home page heading and opening line from the
// practice introduction as 126-DT2 sets out, as its own Work Item; also align
// the search description -- David Facer 10/8/2026" (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/126-DT2, built in 173-CC).
//
// The home page's heading and opening line are the practice introduction's
// own first heading and first paragraph, read from lib/intros.js
// PRACTICE_INTRO -- the text that opens /llms.txt -- so the two cannot drift.
// The site-wide search description says the same opening line. The left-hand
// navigation keeps "AI-Native Maturity Models", as the owner asked, so the site
// still names what its address says.
//
// Offline. With --built, the built pages as well.
// Exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(64) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return null; } };
const intros = require("../lib/intros");

// The owner's two lines to DT2, carried in 126-DT2 section 1. A quotation is
// not edited: if the introduction changes, this test says so, and the owner
// decides whether the home page follows.
const OWNER_HEADING = "AI-Native Enterprise Operating Architecture";
const OWNER_LEAD = "The practice describes an operating architecture for an AI-native enterprise: an enterprise designed so humans and intelligent agents can share a coherent understanding of work, capability, meaning, authority, and observed reality.";

console.log("--- the source ---");
const lines = intros.PRACTICE_INTRO.split("\n");
say(lines[0] === "## " + OWNER_HEADING && lines[2] === OWNER_LEAD, "the introduction opens with the owner's heading and paragraph");
say(intros.PRACTICE_HEADING === OWNER_HEADING, "PRACTICE_HEADING is the introduction's first heading", JSON.stringify(intros.PRACTICE_HEADING || null).slice(0, 50));
say(intros.PRACTICE_LEAD === OWNER_LEAD, "PRACTICE_LEAD is its first paragraph", String((intros.PRACTICE_LEAD || "").length) + " chars");
const src = read("lib/intros.js") || "";
say(!src.includes('PRACTICE_HEADING = "') && !src.includes('PRACTICE_LEAD = "'), "both are read from PRACTICE_INTRO, not typed a second time");

console.log("--- the home page ---");
const home = read("pages/index.js") || "";
say(/import \{[^}]*PRACTICE_HEADING[^}]*PRACTICE_LEAD[^}]*\} from "\.\.\/lib\/intros"/.test(home), "the home page imports both");
say(home.includes("<h1>{PRACTICE_HEADING}</h1>"), "its heading is PRACTICE_HEADING");
say(/<p className="dek">\{PRACTICE_LEAD\}<\/p>/.test(home), "its opening line is PRACTICE_LEAD");
say(!home.includes("A family of models, assessments, and governance artifacts"), "the old opening line is gone");

console.log("--- the shared layout ---");
const layout = read("components/Layout.js") || "";
say(layout.includes('<meta name="description" content={PRACTICE_LEAD} />'), "the search description is PRACTICE_LEAD");
say(!layout.includes("Capability models for understanding how AI-nativity changes software delivery, product management, and the enterprise itself."), "the old search description is gone");
say(/aria-label="AI-Native Maturity Models — home">\s*AI-Native Maturity Models\s*</.test(layout), "the rail title still reads AI-Native Maturity Models");
say(layout.includes('<Link href="/models">AI-Native Maturity Models</Link>'), "and so does the navigation's models link");
say(layout.includes('`${title} — AI-Native Maturity Models`'), "the browser tab title is unchanged");

if (process.argv.includes("--built")) {
  console.log("--- the built pages ---");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const idx = read(".next/server/pages/index.html") || "";
  say(idx.includes("<h1>" + esc(OWNER_HEADING) + "</h1>"), "the built home page's heading");
  say(idx.includes('<p class="dek">' + esc(OWNER_LEAD) + "</p>"), "the built home page's opening line");
  const dir = path.join(root, ".next", "server", "pages");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
  let files = [];
  try { files = walk(dir).filter((f) => path.relative(dir, f) !== "500.html"); } catch { /* fails below */ }
  const want = '<meta name="description" content="' + esc(OWNER_LEAD) + '"/>';
  const miss = files.filter((f) => !fs.readFileSync(f, "utf8").includes(want));
  say(files.length > 0 && miss.length === 0, "every built page carries the new search description", files.length + " page(s)" + (miss.length ? "; missing: " + miss.slice(0, 3).map((f) => path.relative(dir, f)).join(", ") : ""));
}

console.log(bad ? "HOME INTRO SELF-TEST FAIL" : "HOME INTRO SELF-TEST PASS");
process.exit(bad);
