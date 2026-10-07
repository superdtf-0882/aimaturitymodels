#!/usr/bin/env node
// Self-test for OKF-TOGAF#166 -- the family's order on /models and
// /assessments, and the SDLC assessment's description. The owner, to CC,
// 2026-10-07: "re-order the models on the aimaturitymodels.com/models page so
// that it makes a bit more sense - AI-Native EA Maturity Model, AI-Native SDLC
// Maturity Model, AI-Native PDLC Maturity Model, Product Prioritization
// Maturity Model, Product Marketing Lifecycle Model. I want to synch that
// order up with the Assessments page also. The last part of that is an update
// to the SDLC Assessment description to add '...or marked Pre-AI or Exempt,
// ...' so that it's consistent with the EA assessment."
//
// Reads the two page sources and compares the order of their model-name
// cells. Offline; exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(52) + (shown || ""));
  if (!ok) bad = 1;
};

// The family, in the owner's order. Each page names a model by its own noun.
const ORDER = ["AI-Native EA", "AI-Native SDLC", "AI-Native PDLC", "Product Prioritization", "Product Marketing Lifecycle"];
const names = (src) => [...src.matchAll(/<div className="model-name">([^<]+)<\/div>/g)].map((m) => m[1].trim());
const family = (list) => list.map((n) => ORDER.find((o) => n.startsWith(o + " ")) || "?" + n);

for (const [page, noun] of [["pages/models/index.js", "Maturity Model"], ["pages/assessments/index.js", "Maturity Assessment"]]) {
  const got = names(read(page));
  say(family(got).join(" | ") === ORDER.join(" | "), page + ": the owner's order", family(got).join(", "));
  say(got.length === ORDER.length && got.every((n) => n.endsWith(" " + noun)), page + ": five rows, each a " + noun);
}

// The SDLC assessment's description reads as the EA one does.
const desc = (src, name) => {
  const at = src.indexOf('<div className="model-name">' + name + "</div>");
  const m = at < 0 ? null : src.slice(at).match(/<div className="model-desc">([\s\S]*?)<\/div>/);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
};
const a = read("pages/assessments/index.js");
const sdlc = desc(a, "AI-Native SDLC Maturity Assessment");
const ea = desc(a, "AI-Native EA Maturity Assessment");
say(sdlc === "Thirteen dimensions, scored A through E or marked Pre-AI or Exempt, with an AI-generated Executive Readout.",
  "SDLC description names Pre-AI and Exempt", sdlc);
say(sdlc.replace(/^Thirteen/, "Ten") === ea, "SDLC and EA descriptions differ only in the count");

console.log(bad ? "FAMILY ORDER SELF-TEST FAIL" : "FAMILY ORDER SELF-TEST PASS");
process.exit(bad);
