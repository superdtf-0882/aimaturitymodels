#!/usr/bin/env node
// Prebuild step: the Strategic Value Matrix's calculator must pass the
// frame's own conformance cases, or this build stops.
//
// It fetches svm_conformance.yml from the Product Prioritization model's
// repository AT THE PINNED COMMIT (lib/pins.js), runs every case through
// lib/svmCore.js -- the same core the page's calculator uses -- and exits 1
// on any disagreement, including a one-step control that PASSES (a case that
// cannot fail confirms nothing). Plain CommonJS, run by plain `node`.
//
// THIS IS A REFUSAL, AND IT CAN BE CROSSED IN FOUR WAYS, stated so none of
// them is mistaken for enforcement:
//   (i)   the repository owner can delete this script or its `prebuild` line;
//   (ii)  a pin at an older commit tests against that commit's cases;
//   (iii) running `next build` directly, rather than `npm run build`, skips
//         `prebuild` entirely;
//   (iv)  the host's build command decides whether `prebuild` runs at all.
//         This project sets none, and the host runs `npm run build` with its
//         hooks -- the `postbuild` that writes public/llms.txt runs on every
//         deploy. The first deploy's log is the proof that this line runs.

const yaml = require("js-yaml");
const { PRIORITIZATION_PINNED_COMMIT } = require("../lib/pins");
const { runConformance } = require("../lib/svmCore");

const URL = `https://raw.githubusercontent.com/superdtf-0882/ai-native-product-prioritization-maturity-model/${PRIORITIZATION_PINNED_COMMIT}/svm_conformance.yml`;

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`could not fetch the conformance cases (${res.status}) from ${URL}`);
  const doc = yaml.load(await res.text());
  const results = runConformance(doc.cases);
  for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(10)} ${r.run.padEnd(17)} ${r.detail}`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`SVM conformance: ${failed.length} of ${results.length} check(s) FAILED against ${PRIORITIZATION_PINNED_COMMIT.slice(0, 7)}. Build stopped.`);
    // exitCode, not exit(): exiting while fetch's handles are still closing
    // trips a libuv assertion on Windows and reports 127 instead of 1.
    process.exitCode = 1;
    return;
  }
  console.log(`SVM conformance: ${results.length} of ${results.length} checks pass against the frame's cases at ${PRIORITIZATION_PINNED_COMMIT.slice(0, 7)} (frame version ${doc.frame_version}).`);
}

main().catch((err) => {
  console.error("SVM conformance could not run:", err.message, "-- build stopped.");
  process.exitCode = 1;
});
