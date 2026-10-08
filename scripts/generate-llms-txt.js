#!/usr/bin/env node
// Postbuild step (issue #15; OKF-TOGAF#158 step 3, 2026-10-08). Writes the
// AI-reader map under public/, every file from one fetch of the sources:
//   /llms.txt                 the short root map (lib/aiMap.js)
//   /llms-full.txt and /ai/full-context.md
//                             the full file, the same text under both names
//   /models/llms.txt, /functionmodels/llms.txt, /strata/llms.txt, /eaokf/llms.txt
//                             the four construct maps
//   <page>.md                 a Markdown copy beside each substantive page
// Fails the build (exit 1) if a term is defined twice across the five maps
// (100-DT2 section 3(d)). Plain CommonJS, run by plain `node` outside Next's
// build pipeline, so it can require lib/aiDigestCore.js directly.
// Until 2026-10-08 /llms.txt was the full digest; it is now the map, and the
// full digest is /llms-full.txt (100-DT2 section 3(b); OKF-TOGAF#155's row).
const fs = require("fs");
const path = require("path");
const { buildDigest, fetchSources } = require("../lib/aiDigestCore");
const { constructMaps, pageCopies, duplicateDefinitions } = require("../lib/aiMap");

async function main() {
  const publicDir = path.join(__dirname, "..", "public");
  const sources = await fetchSources();
  const full = await buildDigest(sources);
  const maps = constructMaps(sources);
  const dups = duplicateDefinitions(maps);
  if (dups.length) {
    console.error("REFUSED: a term is defined more than once across the maps: " + dups.join("; "));
    process.exit(1);
  }
  const files = Object.assign({ "/llms-full.txt": full, "/ai/full-context.md": full }, maps, pageCopies(sources));
  for (const [rel, text] of Object.entries(files)) {
    const out = path.join(publicDir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, text, "utf8");
  }
  console.log(`Wrote the AI-reader map under ${publicDir}: ${Object.keys(files).length} files (root ${maps["/llms.txt"].length} bytes, full ${full.length} bytes)`);
}

main().catch((err) => {
  console.error("generate-llms-txt.js failed:", err);
  process.exit(1);
});
