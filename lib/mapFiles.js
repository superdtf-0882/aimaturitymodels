// The site's map files for AI readers: the one list both OKF-TOGAF#158 (the
// AI-reader map) and OKF-TOGAF#159 (the sitemap) read, so the sitemap lists
// every map file without being patched when the map lands (122-DT2 of OKF
// TOGAF briefs/2026-10-01-svm-tranche-3/, "Where the two meet: one file
// list"). Paths as served, from the site root. #158's step adds its files
// here; scripts/generate-sitemap.js reads it after each build, and
// scripts/sitemap-self-test.js --built checks the sitemap against it.
// Plain CommonJS, like lib/aiDigestCore.js, so a postbuild script can require it.
const MAP_FILES = [
  "/llms.txt",
];

module.exports = { MAP_FILES };
