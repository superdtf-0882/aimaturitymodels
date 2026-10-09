#!/usr/bin/env node
// Self-test for OKF-TOGAF#170 (a bug, FR-LEX-32): the "© 2026 David Facer"
// link was fixed to the window's bottom-right corner with a solid background,
// so it covered whatever text scrolled under it -- the third outside run saw
// it over the home page's text at 635 x 789. Built on "Build #170: move the
// copyright link into the page footer -- David Facer 10/8/2026".
//
// DS-008b (the portfolio-wide attribution) asks for "small, muted,
// bottom-right. Non-intrusive", and C-007 for it on all page states. The link
// now sits at the bottom of the page, on the right of the footer row, in the
// page's flow: still bottom-right, still on every page, and over nothing.
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
const LINK = '<a className="attribution" href="https://davidfacer.com">© 2026 David Facer</a>';

console.log("--- the layout ---");
const layout = read("components/Layout.js") || "";
const foot = (layout.match(/<footer className="page-foot">([\s\S]*?)<\/footer>/) || [])[1] || "";
say(layout.split(LINK).length === 2, "the link appears once, its text and address unchanged");
say(foot.includes(LINK), "it is inside the page footer");
say(foot.includes('For AI readers: <a href="/llms.txt">/llms.txt</a>.'), "beside the footer's For AI readers line");
say(foot.trim().endsWith(LINK), "last in the footer, so on its right");
const main = (layout.match(/<main[\s\S]*?<\/main>/) || [""])[0];
say(main.includes('<footer className="page-foot">'), "the footer is inside the page's main column, in its flow");

console.log("--- the styles ---");
const css = read("styles/globals.css") || "";
const rule = (sel) => (css.match(new RegExp("(^|\\n)" + sel.replace(/[.]/g, "\\.") + " \\{([^}]*)\\}")) || [])[2] || "";
const attr = rule(".attribution"), row = rule(".page-foot");
say(!!attr && !/position\s*:/.test(attr), "the link is not positioned: it covers nothing", attr.replace(/\s+/g, " ").trim().slice(0, 60));
say(!/background\s*:/.test(attr), "no background of its own");
say(/color:\s*var\(--muted\)/.test(attr) && /font-size:\s*1[0-2]px/.test(attr), "small and muted, as DS-008b asks");
say(/display:\s*flex/.test(row) && /justify-content:\s*space-between/.test(row), "the footer row puts it on the right");
say(/flex-wrap:\s*wrap/.test(row), "the row wraps on a narrow screen rather than overflowing");

if (process.argv.includes("--built")) {
  console.log("--- the built pages ---");
  const dir = path.join(root, ".next", "server", "pages");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
  let files = [];
  try { files = walk(dir); } catch { /* fails below */ }
  const miss = [];
  // 500.html is Next.js's built-in error page: the site has no pages/500.js,
  // so it never used the Layout and never carried the link, before this item
  // or after. Named here rather than silently skipped.
  files = files.filter((f) => path.relative(dir, f) !== "500.html");
  console.log("  NOTE  500.html is Next.js's own error page, outside the Layout; not checked");
  for (const f of files) {
    const html = fs.readFileSync(f, "utf8");
    const n = html.split("© 2026 David Facer</a>").length - 1;
    const inFoot = /<footer class="page-foot">(?:(?!<\/footer>)[\s\S])*class="attribution"(?:(?!<\/footer>)[\s\S])*<\/footer>/.test(html);
    // Pages that carry their own readout attribution (DS-008a) as well have two.
    if (n < 1 || !inFoot) miss.push(path.relative(dir, f));
  }
  say(files.length > 0 && miss.length === 0, "every built page carries the link inside its footer", files.length + " page(s)" + (miss.length ? "; missing: " + miss.slice(0, 4).join(", ") : ""));
}

console.log(bad ? "ATTRIBUTION SELF-TEST FAIL" : "ATTRIBUTION SELF-TEST PASS");
process.exit(bad);
