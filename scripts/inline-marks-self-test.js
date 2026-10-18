#!/usr/bin/env node
// Self-test for OKF-TOGAF#203: the whole-model view renders a model's bold and
// italic marks rather than printing them. On "The whole-model view renders bold
// and italics rather than printing the marks, under its own Work Item, pushed
// once its build passes -- David Facer 10/16/2026".
//
// lib/inline-marks.js turns paired ** and * into structure the view renders as
// <strong> and <em>, with no HTML injected; an asterisk that does not pair stays
// the character it is. Offline; the two model checks read the local clones at
// the site's pins and are skipped where a clone is absent. Exit 1 on a failure.
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
let M = {};
try { M = require("../lib/inline-marks"); } catch (e) { console.log("  FAIL  lib/inline-marks.js does not load: " + e.message.split("\n")[0]); bad = 1; }
const P = M.parseMarks || (() => null);
const S = M.stripMarks || (() => null);
const j = (x) => JSON.stringify(x);

console.log("--- the parser ---");
say(j(P("plain text")) === j(["plain text"]), "plain text is one string", j(P("plain text")));
const loose = "**The author can answer *loose sense, deliberately* and proceed.**";
say(j(P(loose)) === j([{ strong: ["The author can answer ", { em: ["loose sense, deliberately"] }, " and proceed."] }]),
  "EA D10's sentence: italics inside bold", j(P(loose)));
say(j(P("distinguishes *customer*, *buyer* and *user*, and")) ===
  j(["distinguishes ", { em: ["customer"] }, ", ", { em: ["buyer"] }, " and ", { em: ["user"] }, ", and"]),
  "three italic words in a row", j(P("distinguishes *customer*, *buyer* and *user*, and")));
say(j(P("Shared language (*Vocabula*)")) === j(["Shared language (", { em: ["Vocabula"] }, ")"]),
  "italics inside parentheses (EA's D10 title)", j(P("Shared language (*Vocabula*)")));
say(j(P("**Nothing consults it.** Then more.")) === j([{ strong: ["Nothing consults it."] }, " Then more."]),
  "bold at the start", j(P("**Nothing consults it.** Then more.")));
say(j(P("5 * 3 * 2")) === j(["5 * 3 * 2"]), "an asterisk with a space after it is a character", j(P("5 * 3 * 2")));
say(j(P("an unpaired *star")) === j(["an unpaired *star"]), "an unpaired asterisk stays", j(P("an unpaired *star")));
say(j(P("**never closed")) === j(["**never closed"]), "an unclosed pair stays", j(P("**never closed")));
say(S(loose) === "The author can answer loose sense, deliberately and proceed.", "stripMarks gives the plain words", j(S(loose)));
say(j(P("")) === j([]) && j(P(null)) === j([]), "empty and missing text render nothing", j(P("")));

console.log("--- the view uses it everywhere it prints model text ---");
const view = fs.readFileSync(path.join(root, "components/WholeModelView.js"), "utf8");
for (const raw of ["{dim.levels[level]}", "{transition.text}", "{transition.verification}", "{dim.sustainment}", "{dim.desc}", "{dim.digest[l]}", "{dim.title}", "{dim.flag}", "{dim.name}"]) {
  // Raw means printed as a child, not passed to <Marks text=...>.
  const at = [...view.matchAll(new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))].map((m) => m.index);
  say(at.every((i) => view.slice(i - 5, i) === "text="), "no raw " + raw, at.length + " use(s)");
}
say(/<Marks text=/.test(view), "the view renders through <Marks>");
say(!/dangerouslySetInnerHTML/.test(view), "no HTML injected");
say(!/aria-label=\{`[^`]*\$\{dim\.name\}/.test(view), "screen-reader labels use the plain words, not the marks");

console.log("--- the real models: no asterisk survives ---");
const { readModelDimensions } = require("../lib/model-reader");
const pins = fs.readFileSync(path.join(root, "lib/pins.js"), "utf8");
const pin = (k) => (pins.match(new RegExp("const " + k + ' = "([0-9a-f]{40})"')) || [])[1];
const show = (repo, ref, file) => { try { return execSync(`git show ${ref}:${file}`, { cwd: path.join(root, "..", repo), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).replace(/\r\n/g, "\n"); } catch { return ""; } };
for (const [label, repo, key, file] of [
  // Read as the pages read them, through the family parser (OKF-TOGAF#205): the site's old
  // dimension reader was removed with PDLC's v1.2.5.
  ["EA", "ai-native-ea-maturity-model", "EA_PINNED_COMMIT", "ai_native_ea_maturity_model.md"],
  ["Product Marketing", "ai-native-product-marketing-maturity-model", "PRODUCT_MARKETING_PINNED_COMMIT", "ai_native_product_marketing_maturity_model.md"],
]) {
  const md = show(repo, pin(key), file);
  if (!md) { console.log("  skip  " + label + ": no local clone at the pin"); continue; }
  const texts = [];
  for (const d of readModelDimensions(md).values()) {
    texts.push(d.name, d.desc, d.sustainment, ...Object.values(d.levels));
    for (const t of Object.values(d.transitions)) texts.push(t.text, t.verification);
  }
  const marked = texts.filter((t) => t && t.includes("*"));
  const left = marked.filter((t) => S(t) === null || S(t).includes("*"));
  say(marked.length > 0 && left.length === 0, label + ": every marked text renders with no asterisk left",
    marked.length + " marked, " + left.length + " left" + (left[0] ? ": " + left[0].slice(0, 60) : ""));
}

process.exitCode = bad;
