#!/usr/bin/env node
// Self-test for OKF-TOGAF#158, step 3 -- the AI-reader map (100-DT2 section 4,
// 122-DT2 step 3 of OKF TOGAF briefs/2026-10-01-svm-tranche-3/), on "Work
// #158 and #159 as a tandem as 122-DT2 sets out: the false sentence first,
// alone -- David Facer 10/8/2026". Reach: "An AI agent can navigate the site
// and answer its owner's questions specific to a model, Strata, or EA OKF".
//
// Offline: which page gets a Markdown copy and which map describes it
// (lib/mapRoutes.js), the one-definition-per-term check, and the root map's
// shape. With --built: every generated file against the build -- each page
// with a copy rule has its copy and each copy its page, every link in the
// maps resolves, one definition per term across the maps, the full file
// under both names, and the two tags and footer line in every page's HTML.
// Exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(62) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (p) => { try { return fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n"); } catch { return null; } };
const tryRequire = (p) => { try { return require(p); } catch { return {}; } };
const routes = tryRequire("../lib/mapRoutes");
const aiMap = tryRequire("../lib/aiMap");

console.log("--- which page gets a copy, and which map describes it ---");
const COPY = [
  ["/models/sdlc/deep-dive/d1/", "/models/sdlc/deep-dive/d1.md"],
  ["/models/ea/whole-model-view/", "/models/ea/whole-model-view.md"],
  ["/models/prioritization/strategic-value-matrix/", "/models/prioritization/strategic-value-matrix.md"],
  ["/strata/", "/strata.md"],
  ["/eaokf/", "/eaokf.md"],
  ["/functionmodels/pm/", "/functionmodels/pm.md"],
  ["/models/sdlc/assessment/", null],
  ["/models/pdlc/executivereadout/", null],
  ["/models/", null],
  ["/", null],
  ["/vellum/", null],
];
for (const [r, want] of COPY) {
  const got = routes.copyFor ? routes.copyFor(r) : "missing";
  say(got === want, "copy for " + r, String(got));
}
const MAP = [
  ["/models/sdlc/deep-dive/d1/", "/models/llms.txt"],
  ["/models/", "/models/llms.txt"],
  ["/functionmodels/pm/", "/functionmodels/llms.txt"],
  ["/strata/", "/strata/llms.txt"],
  ["/eaokf/", "/eaokf/llms.txt"],
  ["/", "/llms.txt"],
  ["/ai/", "/llms.txt"],
  ["/assessments/", "/llms.txt"],
];
for (const [r, want] of MAP) {
  const got = routes.mapFor ? routes.mapFor(r) : "missing";
  say(got === want, "map for " + r, String(got));
}

console.log("--- one definition per term, across the maps ---");
{
  const f = aiMap.duplicateDefinitions;
  const dup = f ? f({ "/a": "- [Strata](/strata.md) — the plane\n", "/b": "- [Strata](/strata.md) — again\n" }) : null;
  const ok = f ? f({ "/a": "- [Strata](/strata.md) — the plane\n- [Strata map](/strata/llms.txt)\n", "/b": "**EA OKF** — the contract\n" }) : null;
  say(!!dup && dup.length === 1 && dup[0].startsWith("Strata"), "a term defined in two maps is named", dup ? dup.join("; ") : "missing");
  say(!!ok && ok.length === 0, "a link line with no definition, and distinct terms, pass", ok ? String(ok.length) : "missing");
}

console.log("--- the full file renders all four live models ---");
{
  const core = read("lib/aiDigestCore.js") || "";
  say(/^## AI-Native EA Maturity Model$/m.test(core), "the full file has an EA model section (101-CC section 3: the EA model rendered)");
  say(/\*\*What's included:\*\* all four live models/.test(core), "and says all four, now that it holds them");
}

console.log("--- the root map ---");
{
  const { PRACTICE_INTRO } = require("../lib/intros");
  const r = aiMap.rootMap ? aiMap.rootMap() : "";
  const nn = r.indexOf("\n\n");
  say(r.startsWith("# ") && nn > 0 && r.slice(nn + 2, nn + 2 + PRACTICE_INTRO.length) === PRACTICE_INTRO, "title, then the owner's introduction, exactly");
  for (const href of ["/models/llms.txt", "/functionmodels/llms.txt", "/strata/llms.txt", "/eaokf/llms.txt", "/llms-full.txt", "/ai/full-context.md"]) {
    say(r.includes("](" + href + ")"), "links " + href);
  }
  say(/a rendering, not a source of truth/.test(r), "says it is a rendering, not a source of truth");
  say(r.length < 12000, "short: the full text is elsewhere", r.length + " chars");
}

if (process.argv.includes("--built")) {
  console.log("--- the built map ---");
  const { pageList } = require("./generate-sitemap");
  let pages = [];
  try { pages = pageList(JSON.parse(read(".next/server/pages-manifest.json")), JSON.parse(read(".next/prerender-manifest.json"))); } catch { /* fails below */ }
  say(pages.length > 0, "the build's page list", String(pages.length));
  say(aiMap.rootMap && read("public/llms.txt") === aiMap.rootMap(), "public/llms.txt is the root map");
  const full = read("public/llms-full.txt");
  say(!!full && full.length > 50000 && read("public/ai/full-context.md") === full, "the full file under both names, identical", full ? full.length + " chars" : "missing");
  const MAPS = ["/llms.txt", "/models/llms.txt", "/functionmodels/llms.txt", "/strata/llms.txt", "/eaokf/llms.txt"];
  const maps = {};
  for (const m of MAPS) maps[m] = read("public" + m) || "";
  for (const m of MAPS.slice(1)) say(maps[m].startsWith("# ") && maps[m].includes("](/llms.txt)"), m + ": a heading and a link up to the root");

  // Each page with a copy rule has its copy; each copy has its page.
  const { listMapFiles } = require("../lib/mapFiles");
  const files = listMapFiles(path.join(root, "public"));
  const copies = files.filter((f) => f.endsWith(".md") && f !== "/ai/full-context.md");
  const wantCopies = pages.map((p) => routes.copyFor(p)).filter(Boolean);
  const noCopy = wantCopies.filter((c) => !copies.includes(c));
  const noPage = copies.filter((c) => !wantCopies.includes(c));
  say(wantCopies.length > 0 && noCopy.length === 0, "every page with a copy rule has its copy", wantCopies.length + " expected, missing " + noCopy.join(" "));
  say(noPage.length === 0, "every copy has its page", noPage.join(" "));

  // Every site-relative link in the maps resolves to a built page or file.
  const targets = new Set([...pages, ...files]);
  const broken = [];
  for (const [m, text] of Object.entries(maps)) {
    for (const h of [...text.matchAll(/\]\((\/[^)#?\s]*)\)/g)].map((x) => x[1])) {
      const asPage = h === "/" || h.endsWith("/") || /\.[a-z]+$/i.test(h) ? h : h + "/";
      if (!targets.has(h) && !targets.has(asPage)) broken.push(m + " -> " + h);
    }
  }
  say(broken.length === 0, "every link in the maps resolves", broken.slice(0, 4).join("; "));

  const dups = aiMap.duplicateDefinitions ? aiMap.duplicateDefinitions(maps) : ["missing"];
  say(dups.length === 0, "one definition per term across the five maps", dups.join("; "));

  // The two tags and the footer line in every page's HTML.
  const htmlFor = (p) => read(".next/server/pages" + (p === "/" ? "/index" : p.replace(/\/$/, "")) + ".html");
  const tagMiss = [];
  const live = [];
  for (const p of pages) {
    // A page rendered per request (the executive readouts, getServerSideProps)
    // has no HTML at build time: it uses the same layout, and is read live.
    const html = htmlFor(p);
    if (html === null) { live.push(p); continue; }
    const c = routes.copyFor(p), m = routes.mapFor(p);
    if (!html.includes(`<link rel="describedby" href="${m}"`)) tagMiss.push(p + " describedby");
    if (c && !html.includes(`<link rel="alternate" type="text/markdown" href="${c}"`)) tagMiss.push(p + " alternate");
    if (!c && html.includes('rel="alternate" type="text/markdown"')) tagMiss.push(p + " stray alternate");
    if (!/For AI readers/.test(html)) tagMiss.push(p + " footer");
  }
  say(tagMiss.length === 0, "every page: describedby, alternate where it has a copy, footer", tagMiss.slice(0, 4).join("; "));
  console.log("  NOTE  rendered per request, so checked live, not here: " + (live.join(" ") || "none"));
}

console.log(bad ? "AI MAP SELF-TEST FAIL" : "AI MAP SELF-TEST PASS");
process.exit(bad);
