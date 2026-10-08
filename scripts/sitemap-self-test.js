#!/usr/bin/env node
// Self-test for OKF-TOGAF#159 -- robots and a sitemap, worked in tandem with
// #158 (122-DT2 of OKF TOGAF briefs/2026-10-01-svm-tranche-3/, on "Work #158
// and #159 as a tandem as 122-DT2 sets out: the false sentence first, alone
// -- David Facer 10/8/2026"). Reach: "A robots file and a sitemap listing
// every page and map file are live on the site."
//
// Offline: the page list taken from the build's manifests (synthetic here),
// the sitemap's form, and public/robots.txt as the owner's text word for word.
// With --built, the real public/sitemap.xml against the real .next manifests
// and the shared map-file list (lib/mapFiles.js). Exit 1 on a failing case.
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
let gen = null;
try { gen = require("./generate-sitemap"); } catch { /* reported below */ }

console.log("--- the page list, from the build's manifests ---");
{
  const pagesManifest = { "/": "x", "/models": "x", "/404": "x", "/_app": "x", "/_error": "x", "/api/diagnostic": "x",
    "/models/sdlc/deep-dive/[dim]": "x", "/models/ea/whole-model-view": "x" };
  const prerender = { routes: { "/models/sdlc/deep-dive/d1": {}, "/models/sdlc/deep-dive/d2": {}, "/models/ea/whole-model-view": {} } };
  const got = gen && gen.pageList ? gen.pageList(pagesManifest, prerender) : null;
  const want = ["/", "/models/", "/models/ea/whole-model-view/", "/models/sdlc/deep-dive/d1/", "/models/sdlc/deep-dive/d2/"];
  say(!!got && JSON.stringify(got) === JSON.stringify(want), "pages in, 404/_app/_error/api/[dynamic] out, trailing slash", got ? got.length + " pages" : "missing");
}

console.log("--- the sitemap's form ---");
{
  const xml = gen && gen.sitemapXml ? gen.sitemapXml(["/", "/models/", "/llms.txt"]) : "";
  say(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), "an XML urlset in the sitemaps.org namespace");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  say(JSON.stringify(locs) === JSON.stringify(["https://aimaturitymodels.com/", "https://aimaturitymodels.com/llms.txt", "https://aimaturitymodels.com/models/"]),
    "one absolute loc per entry, sorted, no duplicates", locs.length + " locs");
}

console.log("--- robots.txt, the owner's text ---");
const ROBOTS = [
  "User-agent: Googlebot", "Allow: /", "",
  "User-agent: bingbot", "Allow: /", "",
  "User-agent: OAI-SearchBot", "Allow: /", "",
  "User-agent: ChatGPT-User", "Allow: /", "",
  "User-agent: Claude-SearchBot", "Allow: /", "",
  "User-agent: Claude-User", "Allow: /", "",
  "User-agent: PerplexityBot", "Allow: /", "",
  "User-agent: Applebot", "Allow: /", "",
  "User-agent: *", "Allow: /", "",
  "Sitemap: https://aimaturitymodels.com/sitemap.xml", "",
].join("\n");
const robots = read("public/robots.txt");
say(robots === ROBOTS, "public/robots.txt is the owner's text, word for word (100-DT2 8A)");
say(!!robots && !/^Disallow:/m.test(robots), "no Disallow line (101-CC section 2)");
say(!!gen && typeof gen.robotsNamesSitemap === "function" && gen.robotsNamesSitemap(ROBOTS) && !gen.robotsNamesSitemap(ROBOTS.replace(/^Sitemap:.*$/m, "")),
  "the build check: robots names the sitemap, and a robots without it fails");

if (process.argv.includes("--built")) {
  console.log("--- the built sitemap ---");
  const xml = read("public/sitemap.xml");
  say(!!xml, "public/sitemap.xml exists");
  const locs = new Set([...String(xml).matchAll(/<loc>https:\/\/aimaturitymodels\.com([^<]+)<\/loc>/g)].map((m) => m[1]));
  let pages = [];
  try {
    pages = gen.pageList(JSON.parse(read(".next/server/pages-manifest.json")), JSON.parse(read(".next/prerender-manifest.json")));
  } catch { /* fails below */ }
  const maps = (() => { try { return require("../lib/mapFiles").MAP_FILES; } catch { return []; } })();
  const want = [...pages, ...maps];
  const missing = want.filter((u) => !locs.has(u));
  const extra = [...locs].filter((u) => !want.includes(u));
  say(pages.length > 0 && missing.length === 0, "every built page and map file is in the sitemap", want.length + " expected, missing " + missing.length);
  say(extra.length === 0, "nothing in the sitemap that the build does not have", extra.join(" "));
}

console.log(bad ? "SITEMAP SELF-TEST FAIL" : "SITEMAP SELF-TEST PASS");
process.exit(bad);
