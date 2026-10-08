#!/usr/bin/env node
// Postbuild step (OKF-TOGAF#159, in tandem with #158, 122-DT2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/): writes public/sitemap.xml from the
// site's own page list -- the build's .next manifests, so a page added to the
// site is listed with no edit here -- plus every map file in lib/mapFiles.js.
// Then THE BUILD CHECK: public/robots.txt must name the sitemap, or this step
// exits 1 and the build fails. robots.txt itself is the owner's text, static,
// word for word (100-DT2 section 8A); no Disallow line (101-CC section 2).
// Plain CommonJS run by plain `node`, like scripts/generate-llms-txt.js.
// Reach: "A robots file and a sitemap listing every page and map file are
// live on the site." Checked by scripts/sitemap-self-test.js (--built).
"use strict";

const fs = require("fs");
const path = require("path");

const ORIGIN = "https://aimaturitymodels.com";
const SITEMAP_LINE = "Sitemap: " + ORIGIN + "/sitemap.xml";

// Every page the build produced: the pages manifest's static routes and the
// prerender manifest's routes (which expand each [dynamic] page into the paths
// it was built for). Out: Next's own /_app, /_document, /_error, the error
// pages, API routes, and unexpanded [dynamic] patterns. trailingSlash is on in
// next.config.js, so every page but the root ends in "/".
function pageList(pagesManifest, prerenderManifest) {
  const keep = (r) => !r.startsWith("/_") && !r.startsWith("/api") && r !== "/404" && r !== "/500" && !r.includes("[");
  const routes = new Set([
    ...Object.keys(pagesManifest || {}).filter(keep),
    ...Object.keys((prerenderManifest && prerenderManifest.routes) || {}).filter(keep),
  ]);
  return [...routes].map((r) => (r === "/" || r.endsWith("/") ? r : r + "/")).sort();
}

function sitemapXml(paths) {
  const locs = [...new Set(paths)].sort().map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    locs.join("\n") + "\n</urlset>\n";
}

function robotsNamesSitemap(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n").some((l) => l.trim() === SITEMAP_LINE);
}

function main() {
  const root = path.join(__dirname, "..");
  const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
  const pages = pageList(readJson(".next/server/pages-manifest.json"), readJson(".next/prerender-manifest.json"));
  const { MAP_FILES } = require("../lib/mapFiles");
  const out = path.join(root, "public", "sitemap.xml");
  fs.writeFileSync(out, sitemapXml([...pages, ...MAP_FILES]));
  console.log(`Wrote ${out} (${pages.length} pages, ${MAP_FILES.length} map file(s))`);
  let robots = "";
  try { robots = fs.readFileSync(path.join(root, "public", "robots.txt"), "utf8"); } catch { /* fails below */ }
  if (!robotsNamesSitemap(robots)) {
    console.error(`REFUSED: public/robots.txt does not carry "${SITEMAP_LINE}" (OKF-TOGAF#159's build check).`);
    process.exit(1);
  }
  console.log("robots.txt names the sitemap.");
}

if (require.main === module) main();

module.exports = { pageList, sitemapXml, robotsNamesSitemap };
