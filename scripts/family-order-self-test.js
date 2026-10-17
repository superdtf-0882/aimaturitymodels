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
// [2026-10-07, OKF-TOGAF#167: the fourth model is Portfolio Prioritization, on
// "Rename to Portfolio Prioritization as 118-DT2 rules; repository name kept;
// signed texts updated to match -- David Facer 10/7/2026".]
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
// 2026-10-16, OKF-TOGAF#198: the fifth is named as ratified, "AI-Native
// Product Marketing Maturity Model", where the placeholder said "Product
// Marketing Lifecycle".
const ORDER = ["AI-Native EA", "AI-Native SDLC", "AI-Native PDLC", "Portfolio Prioritization", "AI-Native Product Marketing"];
const names = (src) => [...src.matchAll(/<div className="model-name">([^<]+)<\/div>/g)].map((m) => m[1].trim());
const family = (list) => list.map((n) => ORDER.find((o) => n.startsWith(o + " ")) || "?" + n);

for (const [page, noun] of [["pages/models/index.js", "Maturity Model"], ["pages/assessments/index.js", "Maturity Assessment"]]) {
  const got = names(read(page));
  say(family(got).join(" | ") === ORDER.join(" | "), page + ": the owner's order", family(got).join(", "));
  say(got.length === ORDER.length && got.every((n) => n.endsWith(" " + noun)), page + ": five rows, each a " + noun);
}

// 2026-10-16, OKF-TOGAF#198: the fifth model is live on /models, linked to its
// whole-model view; its assessment stayed Coming until its instrument existed.
// OKF-TOGAF#202: the instrument was ratified 2026-10-16, and the assessment is live.
{
  const m = read("pages/models/index.js");
  const row = (m.match(/<Link href="([^"]+)" className="model-row">\s*<div>\s*<div className="model-name">AI-Native Product Marketing Maturity Model<\/div>[\s\S]*?<span className="pill (\w+)">/) || []);
  say(row[1] === "/models/productmarketing/whole-model-view" && row[2] === "live", "/models: Product Marketing is Live and links to its whole-model view", JSON.stringify(row.slice(1)));
  const as = read("pages/assessments/index.js");
  const at = as.indexOf("AI-Native Product Marketing Maturity Assessment");
  say(at > 0 && /pill live/.test(as.slice(at, at + 600)) && !/pill coming/.test(as.slice(at, at + 600)), "/assessments: Product Marketing is Live");
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
