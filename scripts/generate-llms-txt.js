#!/usr/bin/env node
// Postbuild step (issue #15): writes the same digest pages/ai.js renders
// into public/llms.txt as a plain static file -- served with zero
// per-request cost, and reachable at the well-known /llms.txt path a
// growing number of AI tools check for automatically. Plain CommonJS,
// run by plain `node` outside Next's build pipeline (see
// lib/aiDigestCore.js's own header for why that file has no Next
// imports), so this can require() it directly.

const fs = require("fs");
const path = require("path");
const { buildDigest } = require("../lib/aiDigestCore");

async function main() {
  const digest = await buildDigest();
  const publicDir = path.join(__dirname, "..", "public");
  fs.mkdirSync(publicDir, { recursive: true });
  const outPath = path.join(publicDir, "llms.txt");
  fs.writeFileSync(outPath, digest, "utf8");
  console.log(`Wrote ${outPath} (${digest.length} bytes)`);
}

main().catch((err) => {
  console.error("generate-llms-txt.js failed:", err);
  process.exit(1);
});
