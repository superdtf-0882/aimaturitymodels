// The site's map files for AI readers: the one list both OKF-TOGAF#158 (the
// AI-reader map) and OKF-TOGAF#159 (the sitemap) read (122-DT2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/, "Where the two meet: one file list").
// The list is what #158's generator wrote under public/ -- every llms.txt,
// llms-full.txt and Markdown copy -- so a new map file joins the sitemap with
// no edit here. Node-only (it reads the disk); the browser side uses
// lib/mapRoutes.js. Paths as served, from the site root.
const fs = require("fs");
const path = require("path");

function listMapFiles(publicDir) {
  const out = [];
  const walk = (dir, rel) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const r = rel + "/" + e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (e.name === "llms.txt" || e.name === "llms-full.txt" || e.name.endsWith(".md")) out.push(r);
    }
  };
  walk(publicDir, "");
  return out.sort();
}

module.exports = { listMapFiles };
