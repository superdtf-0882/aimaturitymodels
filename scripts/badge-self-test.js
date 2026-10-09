#!/usr/bin/env node
// Self-test for OKF-TOGAF#15, reopened on "Reopen #15 for the badge overlap as
// 125-DT2 sets out -- David Facer 10/8/2026" (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/125-DT2, built in 171-CC).
//
// #15 asked for "a discreet link in the upper-right corner: 'Feed this to your
// AI'", and the owner confirmed "The placement needs to be upper-right." It
// shipped fixed to the window's corner, so text scrolled under it: measured
// 2026-10-08, nothing covered at the top of any page (July's fix reserved that
// room), text covered while scrolling at 635 and 1024 px. The badge now sits
// in the page's top-right corner and scrolls with the page: where #15 put it,
// covering nothing.
//
// Offline. With --built, every built page's HTML as well.
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

console.log("--- the layout ---");
const layout = read("components/Layout.js") || "";
say(/<Link href="\/ai" className="ai-feed-badge" aria-label="Feed This to Your AI">/.test(layout), "the badge links to /ai, its full name for assistive tech");
say(layout.includes('<span className="ai-feed-badge-text">Feed This to Your AI</span>'), "its visible text is unchanged");
say(layout.split('className="ai-feed-badge"').length === 2, "one badge, on every page through the layout");

console.log("--- the styles ---");
const css = read("styles/globals.css") || "";
const rules = (sel) => [...css.matchAll(new RegExp("(?:^|\\n)\\s*" + sel.replace(/[.]/g, "\\.") + " \\{([^}]*)\\}", "g"))].map((m) => m[1]);
const badge = rules(".ai-feed-badge");
const all = badge.join(";");
say(badge.length >= 1, "the badge has its rules", badge.length + " rule(s)");
say(!/position\s*:\s*fixed/.test(all), "not fixed to the window: text no longer scrolls under it");
say(/position\s*:\s*absolute/.test(badge[0] || ""), "placed against the page itself");
say(/top\s*:\s*\d+px/.test(badge[0] || "") && /right\s*:\s*\d+px/.test(badge[0] || ""), "in the upper-right corner, as #15 asks");
const mobile = (css.match(/@media \(max-width: 760px\) \{\n  \/\* The rail title runs edge-to-edge[\s\S]*?\n\}/) || [""])[0];
say(/\.rail-title \{ padding-right: \d+px; \}/.test(mobile), "on a narrow screen the rail title still keeps the badge's room");
say(/\.ai-feed-badge::after \{ content: "Feed AI"; \}/.test(mobile), "and the compact label stays");

if (process.argv.includes("--built")) {
  console.log("--- the built pages ---");
  const dir = path.join(root, ".next", "server", "pages");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
  let files = [];
  try { files = walk(dir); } catch { /* fails below */ }
  // 500.html is Next.js's own error page, outside the Layout (as in
  // attribution-self-test.js).
  files = files.filter((f) => path.relative(dir, f) !== "500.html");
  const miss = files.filter((f) => !/<a class="ai-feed-badge" aria-label="Feed This to Your AI" href="\/ai\/?">/.test(fs.readFileSync(f, "utf8")));
  say(files.length > 0 && miss.length === 0, "every built page carries the badge", files.length + " page(s)" + (miss.length ? "; missing: " + miss.slice(0, 4).map((f) => path.relative(dir, f)).join(", ") : ""));
}

console.log(bad ? "BADGE SELF-TEST FAIL" : "BADGE SELF-TEST PASS");
process.exit(bad);
