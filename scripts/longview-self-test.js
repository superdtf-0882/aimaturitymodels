#!/usr/bin/env node
// Self-test for OKF-TOGAF#173, WP-LONGVIEW-01, the buyer narrative, on "Open a
// Work Item for WP-LONGVIEW-01 and build it as 133-DT2 scopes it; the
// electric-motor block is replaced; C5 held back for now -- David Facer
// 10/10/2026" (OKF TOGAF briefs/2026-10-01-svm-tranche-3/133-DT2, built in 184-CC).
//
// The home page opens on the long view: the positioning thesis PT-001 2.0 as
// the spine, in the owner's words; six entries, one per buyer persona, picked
// early by role and objective; the ratified claims but C5. 133-DT2 section 3.3's
// conditions, checked here: real text in the served page; motion optional and
// off under reduced motion; no supplier text (no attribute ids, no figures);
// every proof link resolves; the old block gone. Whether the thesis matches
// PT-001 at the accepted commit is checked practice-side (tools/mi-conformance.js
// in OKF TOGAF): this site cannot read the private supplier.
//
// Offline. With --built, the built home page as well.
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
let lv = {};
try { lv = require("../lib/longview"); } catch { /* fails below */ }

console.log("--- the spine ---");
const T = lv.LONGVIEW_THESIS || "";
say(T.startsWith("AI transformation advice typically sprinkles AI across the organization") && T.endsWith("they do not sell access to the models."), "the thesis, PT-001 2.0, as ratified", T.length + " chars");
const paras = lv.LONGVIEW_THESIS_PARAGRAPHS || [];
say(paras.length >= 2 && paras.map((p) => p.join(" ")).join(" ") === T, "its paragraphs join back to it word for word", paras.length + " paragraph(s)");
const claims = lv.LONGVIEW_CLAIMS || [];
const ids = claims.map((c) => c.id).join(",");
say(ids === "PT-001-C1,PT-001-C2,PT-001-C3,PT-001-C4,PT-001-C6,PT-001-C7,PT-001-C8", "the ratified claims, C5 held back", ids);

console.log("--- the six entries ---");
const entries = lv.LONGVIEW_ENTRIES || [];
const want = ["cio", "cto", "head-of-product", "enterprise-architect", "transformation-lead", "c-level-strategist"];
say(entries.map((e) => e.id).join(",") === want.join(","), "one per buyer persona, in the corpus's order", entries.map((e) => e.id).join(","));
say(entries.every((e) => e.role && e.objective && e.opening && e.understood && Array.isArray(e.proof) && e.proof.length >= 2), "each: role, objective, opening, what understood means, two proofs or more");
const ea = entries.find((e) => e.id === "enterprise-architect") || {};
// [2026-10-10: the owner's rewrite says "a current, relevant source of truth"
// where 133-DT2 and CC's draft said "single source of truth"; the case follows
// his words.]
say(/stale/.test(ea.opening || "") && /source of truth/.test(ea.opening || ""), "the EA entry says its pain plainly: architecture gone stale, no source of truth");

console.log("--- no supplier text ---");
const all = JSON.stringify(lv);
say(!/ATT-[A-Z]+-[BU]-\d+/.test(all), "no supplier attribute id");
say(!/\d+\s?%|\d+ (percent|in \d+)/.test(all), "no figure: none is on the page unchecked", (all.match(/\d+\s?%/) || [""])[0]);
// C5 is the practice running ITS OWN market intelligence; the PDLC model's own
// description (market intelligence becoming product definition) is not C5.
// [Narrowed before landing: the first form refused the phrase anywhere.]
say(!/own market intelligence|PT-001-C5/i.test(all), "nothing of C5 (the practice running its own market intelligence)");

console.log("--- every proof resolves ---");
const routes = new Set(["/", "/models", "/assessments", "/functionmodels", "/strata", "/eaokf", "/ai", "/vellum"]);
for (const m of ["sdlc", "pdlc", "prioritization", "ea"]) for (const r of ["whole-model-view", "assessment", "executivereadout"]) routes.add("/models/" + m + "/" + r);
routes.add("/models/prioritization/strategic-value-matrix");
const files = new Set(["/llms.txt", "/llms-full.txt"]);
const hrefs = [...entries.flatMap((e) => e.proof.map((p) => p.href)), ...claims.map((c) => c.href)];
const pageFile = (h) => fs.existsSync(path.join(root, "pages", h === "/" ? "index.js" : h + ".js")) || fs.existsSync(path.join(root, "pages", h, "index.js"));
const missing = hrefs.filter((h) => !(routes.has(h) && pageFile(h)) && !files.has(h));
say(hrefs.length > 0 && missing.length === 0, "every link is a page or map file the site serves", hrefs.length + " link(s)" + (missing.length ? "; not found: " + missing.join(", ") : ""));

console.log("--- the home page ---");
const home = read("pages/index.js") || "";
say(/from "\.\.\/lib\/longview"/.test(home), "the home page reads the long view from lib/longview.js");
say(!/electric motor|shipping container/.test(home), "the electric-motor block is gone (the owner's word)");
say(/className="longview-sort"/.test(home) && home.indexOf('className="longview-sort"') < home.indexOf('className="longview-spine"'), "the six-way sort comes early, before the spine");
const css = read("styles/globals.css") || "";
say(/scroll-behavior:\s*smooth/.test(css) && /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}scroll-behavior:\s*auto/.test(css), "smooth scrolling, off under reduced motion");
say(!/^\.thesis \{|^\.definition \{|^\.system-note \{/m.test(css), "the old block's styles are gone");

if (process.argv.includes("--built")) {
  console.log("--- the built home page: real text ---");
  const html = read(".next/server/pages/index.html") || "";
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  const text = html.replace(/<!-- -->/g, "");
  say(paras.every((p) => text.includes(esc(p.join(" ")))), "the thesis is in the served page");
  say(entries.every((e) => text.includes(esc(e.opening)) && text.includes(esc(e.understood))), "every entry's opening and close is in the served page");
  say(claims.every((c) => text.includes(esc(c.title))), "every claim is in the served page");
}

console.log(bad ? "LONGVIEW SELF-TEST FAIL" : "LONGVIEW SELF-TEST PASS");
process.exit(bad);
