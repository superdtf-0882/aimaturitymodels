#!/usr/bin/env node
// Self-test for the function model pages (OKF-TOGAF#241 step 4,
// STD-FUNCTION-MODEL §3 "Presentation").
//
// lib/functionModels/rows.json is the practice's export of its function model
// rows (OKF-TOGAF tools/generated/function-models.json), copied byte for byte.
// Its hash is held here with the practice commit it came from, so an edit made
// on this site, and not in the practice, fails this test. The practice's
// tools/deployed-copies.js compares this copy with its export, which catches a
// copy and a hash changed here together.
//
// lib/functionModels/fromRows.js derives each page from the rows. The cases
// below hold that derivation: what a page shows comes from the rows, and the
// three content files write no model text of their own.
//
// Usage: node scripts/function-models-self-test.js   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// The practice's export at OKF-TOGAF PRACTICE_COMMIT, line endings as LF.
const PRACTICE_COMMIT = "2533cf5c";
const ROWS_SHA256 = "4239cbb4e96c57302b87ac0e4178185f69d1d41af9be8a862de1dfbbfb7256a3";

const DIR = path.join(__dirname, "..", "lib", "functionModels");
const MODELS = [
  ["pm.js", "pmFunctionModel", "FM-MODEL-PM"],
  ["productMarketing.js", "productMarketingFunctionModel", "FM-MODEL-PMM"],
  ["softwareEngineering.js", "softwareEngineeringFunctionModel", "FM-MODEL-SE"],
];

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(70) + (shown || ""));
  if (!ok) bad = 1;
};
const sha = (s) => crypto.createHash("sha256").update(String(s).replace(/\r\n/g, "\n")).digest("hex");

console.log("--- the copy ---");
const raw = fs.readFileSync(path.join(DIR, "rows.json"), "utf8");
say(sha(raw) === ROWS_SHA256, "rows.json is the practice's export at " + PRACTICE_COMMIT, sha(raw).slice(0, 12));
// All zeros is the draft's placeholder (497-DT2): a landing that forgot to fill it fails here.
say(/^[0-9a-f]{7,40}$/.test(PRACTICE_COMMIT) && !/^0+$/.test(PRACTICE_COMMIT), "the practice commit is named", PRACTICE_COMMIT);
const rows = JSON.parse(raw);
say(rows.source === "corpus/function_models.md" && rows.standard && rows.standard.id === "STD-FUNCTION-MODEL",
  "it is the function model sheet, under STD-FUNCTION-MODEL", rows.standard && rows.standard.schema_version);
const modelRows = rows.items.filter((it) => it.kind === "model");
say(modelRows.length === MODELS.length && MODELS.every(([, , id]) => modelRows.some((m) => m.id === id)),
  "the copy's models are the three the site renders", modelRows.map((m) => m.id).join(" "));
say(modelRows.every((m) => m.status === "Active"), "every model the site renders is Active in the practice");

console.log("--- the pages, from the rows ---");
for (const [file, name, id] of MODELS) {
  const src = fs.readFileSync(path.join(DIR, file), "utf8").replace(/\r\n/g, "\n");
  const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\s+/g, " ").trim();
  const want = `const { pageFor } = require("./fromRows"); const ${name} = pageFor("${id}"); module.exports = { ${name} };`;
  say(code === want, file + " writes no model text: it derives " + id);
  const page = require(path.join(DIR, file))[name];
  const row = modelRows.find((m) => m.id === id);
  say(page.functionStatement === row.function.essence && page.dek.join("") === (row.function.dek || ""), file + ": the essence and dek are the row's");
  say(page.inputs.items.map((i) => i.title).join("|") === row.input_bundles.map((b) => b.title).join("|"), file + ": one input per bundle, in order");
  say(page.activities.items.map((a) => a.title).join("|") === row.activities.map((a) => a.title).join("|"), file + ": every activity, in order");
  const shown = [...page.capabilities.groups, ...page.capabilities.singles].map((c) => c.title).sort().join("|");
  say(shown === row.capabilities.map((c) => c.title).sort().join("|"), file + ": every capability");
  const placed = row.outputs.every((o) => o.to.every((t) => page.outputs.some((b) => b.title.includes(rows.items.find((p) => p.kind === "party" && p.slug === t).name) && b.items.includes(o.title))));
  say(placed, file + ": every output under each of its recipients");
}

console.log("--- the derivation, on made-up rows ---");
const { pageFor } = require(path.join(DIR, "fromRows.js"));
const party = (slug, name) => ({ id: "FM-PARTY-" + slug.toUpperCase(), kind: "party", status: "Draft", slug, name });
const fake = (mutate) => {
  const r = {
    captions: { activities: "What we do", capabilities: "What we are good at" },
    items: [
      { id: "FM-MODEL-AL", kind: "model", status: "Active", function: { id: "alpha", name: "Alpha", essence: "Alpha governs shapes.", dek: "Shapes." },
        input_bundles: [{ id: "AL-I1", title: "Briefs", members: ["BE-O1", "BE-O2"] }, { id: "AL-I2", title: "Budget", members: ["AL-X1"] }],
        provisional_inputs: [{ id: "AL-X1", title: "Budget", producer: "gamma", basis: "proposed" }],
        activities: [{ id: "AL-A1", title: "Shape Things" }], capabilities: [{ id: "AL-C1", title: "Shaping" }], substrates: [],
        outputs: [{ id: "AL-O1", title: "Shapes", to: ["beta", "gamma"] }, { id: "AL-O2", title: "Kits", to: ["delta", "epsilon"] }, { id: "AL-O3", title: "Plans", to: ["gamma"] }] },
      { id: "FM-MODEL-BE", kind: "model", status: "Active", function: { id: "beta", name: "Beta", essence: "Beta governs briefs." },
        outputs: [{ id: "BE-O1", title: "Brief A", to: ["alpha"] }, { id: "BE-O2", title: "Brief B", to: ["alpha"] }] },
      party("alpha", "Alpha"), party("beta", "Beta"), party("gamma", "Gamma"), party("delta", "Delta"), party("epsilon", "Epsilon"),
      { id: "FM-DR-01", kind: "decision_right", status: "Active", text: "Alpha holds shaping.", grants: [{ holder: "alpha", holds: ["shaping"] }], bounds: ["beta"] },
      { id: "FM-DR-02", kind: "decision_right", status: "Active", text: "Gamma bounds Alpha.", grants: [], bounds: ["alpha"] },
      { id: "FM-DR-03", kind: "decision_right", status: "Active", text: "Beta holds briefs.", grants: [{ holder: "beta", holds: ["briefs"] }], bounds: [] },
    ],
  };
  if (mutate) mutate(r);
  return r;
};
const p = pageFor("FM-MODEL-AL", fake());
say(p.inputs.items[0].description === "Brief A, Brief B.", "a bundle with no description lists its members by name");
say(!("description" in p.inputs.items[1]), "a one-member bundle named as its member shows the title alone");
say(p.outputs.filter((b) => b.items.includes("Shapes")).map((b) => b.title).join("|") === "To Beta|To Gamma", "an output to two recipients appears under both");
say(p.outputs.some((b) => b.title === "To Delta & Epsilon" && b.items.join() === "Kits"), "recipients sent the same list share one block");
say(p.boundaryNote && p.boundaryNote.items.join("|") === "Alpha holds shaping.|Gamma bounds Alpha.", "the boundary note: the entries that grant to it or bound it");
say(p.activities.caption === "What we do" && p.capabilities.caption === "What we are good at", "the captions are the schema's");
let threw = "";
try { pageFor("FM-MODEL-AL", fake((r) => { r.items[0].input_bundles[0].members.push("XX-O9"); })); } catch (e) { threw = e.message; }
say(/names no payload XX-O9/.test(threw), "a bundle naming a payload nobody sends stops the build", threw.slice(0, 30));
threw = "";
try { pageFor("FM-MODEL-AL", fake((r) => { r.items[0].outputs[0].to.push("nobody"); })); } catch (e) { threw = e.message; }
say(/no party nobody/.test(threw), "an output to a party with no row stops the build");

console.log(bad ? "\nFAIL" : "\nall cases pass");
process.exit(bad);
