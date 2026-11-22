#!/usr/bin/env node
// Self-test for the owner's logo below the "Feed This to Your AI" badge (OKF-TOGAF#275, de minimis on the
// owner's word; OKF TOGAF briefs/2026-10-01-svm-tranche-3/706-DT2 and 1252-CC). His words to DT2: "Probably 150% of
// the width of the "Feed this to your AI" and directly below it. Those two colors should probably match." His three
// choices to CC: the home page only; hidden on narrow screens; announced by name.
//
// The logo is a mask over the badge's own colour variable, --orange, so the two stay matched if the colour
// changes. It is half again the badge's measured width (169 px on a desktop window), aligned to the badge's right
// edge, directly below it, and the home page keeps room for it at the top so it covers nothing.
//
// Offline. With --built, the built home page and the other built pages as well.
// Exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return null; } };
const FILE = "public/ai-enterprise-architect.png";
const NAME = "AI Enterprise Architect";

console.log("--- the file ---");
let png = null;
try { png = fs.readFileSync(path.join(root, FILE)); } catch { png = null; }
say(!!png && png.slice(1, 4).toString() === "PNG", "the logo is a PNG in public/", FILE);
const w = png ? png.readUInt32BE(16) : 0, h = png ? png.readUInt32BE(20) : 0;
say(w === 1286 && h === 421, "its shape is the owner's, trimmed: 1,286 by 421", w + " x " + h);

console.log("--- the layout ---");
const layout = read("components/Layout.js") || "";
const tag = (layout.match(/<span className="ai-logo"[^>]*\/>/) || [""])[0];
say(!!tag, "one logo element in the layout", tag ? "found" : "none");
say(/\{route === "\/" && <span className="ai-logo"/.test(layout), "on the home page only, by its route");
say(tag.includes('role="img"') && tag.includes('aria-label="' + NAME + '"'), "announced by name: " + NAME);
say(!!tag && !/href=/.test(tag) && !/<Link[^>]*ai-logo/.test(layout), "not a link");
say(layout.indexOf('className="ai-feed-badge"') >= 0 && layout.indexOf('className="ai-logo"') > layout.indexOf('className="ai-feed-badge"'), "it follows the badge");

console.log("--- the styles ---");
const css = read("styles/globals.css") || "";
const rules = (sel) => [...css.matchAll(new RegExp("(?:^|\\n)\\s*" + sel.replace(/[.]/g, "\\.") + " \\{([^}]*)\\}", "g"))].map((m) => m[1]);
// The page-level rule, at column 0; the narrow-screen rules inside @media are indented.
const topRule = (sel) => (css.match(new RegExp("\\n" + sel.replace(/[.]/g, "\\.") + " \\{([^}]*)\\}")) || [])[1] || "";
const first = topRule(".ai-logo");
const badge = rules(".ai-feed-badge")[0] || "";
say(/background(-color)?\s*:\s*var\(--orange\)/.test(first), "its colour is the badge's own variable, --orange");
say(/mask(-image)?\s*:[^;]*url\(["']?\/ai-enterprise-architect\.png/.test(first) && /-webkit-mask(-image)?\s*:[^;]*url\(["']?\/ai-enterprise-architect\.png/.test(first), "the file is a mask over that colour, with the webkit form");
say(/width\s*:\s*254px/.test(first), "half again the badge's 169 px: 254 px", (first.match(/width\s*:\s*[^;]+/) || [""])[0]);
const right = (s) => (s.match(/right\s*:\s*(\d+)px/) || [])[1];
say(/position\s*:\s*absolute/.test(first) && right(first) && right(first) === right(badge), "placed against the page, its right edge the badge's", "right " + right(first) + " / " + right(badge));
const top = Number((first.match(/top\s*:\s*(\d+)px/) || [])[1] || 0);
say(top >= 50, "directly below the badge, which sits at 16 px and is about 31 px tall", top + " px");
const narrow = (css.match(/@media \(max-width: 760px\) \{[^@]*?\.ai-logo \{ display: none; \}/) || [""])[0];
say(!!narrow, "hidden on narrow screens, below 760 px");
const room = topRule(".ai-logo-room");
say(/float\s*:\s*right/.test(room) && /width\s*:\s*\d+px/.test(room) && /height\s*:\s*\d+px/.test(room) && /\{route === "\/" && <span className="ai-logo-room" aria-hidden="true" \/>\}/.test(layout), "the home page keeps room at the top, a spacer the heading flows around");
say(/@media \(max-width: 760px\) \{[^@]*?\.ai-logo-room \{ display: none; \}/.test(css), "and the spacer goes with the logo on narrow screens");

if (process.argv.includes("--built")) {
  console.log("--- the built pages ---");
  const dir = path.join(root, ".next", "server", "pages");
  const html = (rel) => { try { return fs.readFileSync(path.join(dir, rel), "utf8"); } catch { return ""; } };
  const home = html("index.html");
  say(new RegExp('<span class="ai-logo" role="img" aria-label="' + NAME + '"></span>').test(home), "the built home page carries the logo, by name");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
  let files = [];
  try { files = walk(dir).filter((f) => path.relative(dir, f) !== "index.html"); } catch { /* fails below */ }
  const with_ = files.filter((f) => /class="ai-logo"/.test(fs.readFileSync(f, "utf8")));
  say(files.length > 0 && with_.length === 0, "no other built page carries it", files.length + " other page(s)" + (with_.length ? "; with it: " + with_.slice(0, 4).map((f) => path.relative(dir, f)).join(", ") : ""));
}

console.log("  " + (bad ? "SELF-TEST FAIL" : "SELF-TEST PASS"));
process.exitCode = bad;
