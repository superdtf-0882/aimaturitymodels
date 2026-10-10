#!/usr/bin/env node
//
// address-state-self-test.js -- OKF-TOGAF#130: every in-page choice on the
// site survives Back, Forward and a return visit, and Back undoes views, not
// answers.
//
// THE OWNER'S RULINGS (134-DT2 and 190-CC of the OKF TOGAF corpus,
// briefs/2026-10-01-svm-tranche-3/, scoped 2026-10-10):
//   1. A choice that changes what the reader is looking at is a VIEW and adds
//      a history step. A choice that records an answer or a setting is an
//      ANSWER and only updates the address. Arrow-key movement only updates
//      the address.
//   2. The state lives after the # in the address, one convention across the
//      site.
//   3. Assessment grades survive a reload and a return. The typed Exempt
//      reasons stay out of the address.
//
// WHAT THIS TESTS, with a simulated browser history (no browser, no React):
// the shared piece (lib/address-state.js) -- a view adds a step, an answer
// replaces, Back takes the view from history and keeps the current answers,
// a reload and a return restore everything -- and each page's codec
// (lib/address-codecs.js) round-trips its own state. It then reads each
// page's source to check it is wired to the shared piece and writes history
// nowhere else. Run: node scripts/address-state-self-test.js
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const results = [];
function check(name, fn) {
  let ok = false, detail = "";
  try { const r = fn(); ok = r === true; if (!ok) detail = typeof r === "string" ? r : JSON.stringify(r); }
  catch (e) { detail = e.message; }
  results.push({ name, ok, detail });
}

let S = null, C = null;
check("lib/address-state.js loads", () => { S = require("../lib/address-state"); return true; });
check("lib/address-codecs.js loads", () => { C = require("../lib/address-codecs"); return true; });

// --- a simulated window: location, a history stack, popstate listeners ----
function fakeWindow(pathname) {
  const listeners = [];
  const w = {
    location: { pathname, search: "", hash: "" },
    history: null,
    addEventListener: (t, f) => { if (t === "popstate") listeners.push(f); },
    removeEventListener: () => {},
  };
  const entries = [{ url: pathname, state: { __N: true, url: pathname, as: pathname, options: {}, key: "k0" } }];
  let index = 0;
  function setLocation(url) {
    const [p, h] = url.split("#");
    w.location.pathname = p;
    w.location.hash = h === undefined ? "" : "#" + h;
  }
  w.history = {
    get length() { return entries.length; },
    get state() { return entries[index].state; },
    pushState(state, _t, url) { entries.splice(index + 1); entries.push({ url, state }); index++; setLocation(url); },
    replaceState(state, _t, url) { entries[index] = { url, state }; setLocation(url); },
    go(d) { index += d; setLocation(entries[index].url); listeners.forEach((f) => f({ state: entries[index].state })); },
    back() { this.go(-1); },
    forward() { this.go(1); },
    // A reload or a fresh visit to the current address: the page starts over
    // and reads the address. Listeners from the old page are dropped.
    reload() { listeners.length = 0; },
  };
  return w;
}

const DIMS = ["D1", "D2", "D3", "D4"];

if (S && C) {
  // --- the shared piece ----------------------------------------------------
  check("a view adds a history step", () => {
    const w = fakeWindow("/strata/");
    S.write(w, { open: "s1" }, { step: true });
    return w.history.length === 2 && w.location.hash === "#open=s1" || "length " + w.history.length + ", hash " + w.location.hash;
  });
  check("an answer replaces the entry and adds no step", () => {
    const w = fakeWindow("/models/sdlc/assessment/");
    S.write(w, { dim: "d1", grades: "d1-b" }, { step: false });
    return w.history.length === 1 && w.location.hash === "#dim=d1&grades=d1-b" || "length " + w.history.length + ", hash " + w.location.hash;
  });
  check("writing the address it already holds adds nothing", () => {
    const w = fakeWindow("/strata/");
    S.write(w, { open: "s1" }, { step: true });
    S.write(w, { open: "s1" }, { step: true });
    return w.history.length === 2;
  });
  check("the router's own history state is kept on every entry (Back from another page still routes)", () => {
    const w = fakeWindow("/strata/");
    S.write(w, { open: "s2" }, { step: true });
    const s = w.history.state;
    return (s && s.__N === true && s.url === "/strata/" && s.as === "/strata/#open=s2") || JSON.stringify(s);
  });
  check("an empty state clears the fragment", () => {
    const w = fakeWindow("/strata/");
    S.write(w, { open: "s1" }, { step: true });
    S.write(w, {}, { step: true });
    return w.location.hash === "" && w.history.length === 3 || w.location.hash;
  });
  check("parse and format are inverses", () => {
    const p = S.parseHash("#dim=d2&grades=d1-a,d2-b");
    return p.dim === "d2" && p.grades === "d1-a,d2-b" && S.formatHash(p) === "#dim=d2&grades=d1-a,d2-b";
  });
  check("an explicit empty value survives (no grades is not the default grade)", () => {
    const p = S.parseHash("#dim=d1&grades=");
    return p.grades === "" && S.formatHash(p) === "#dim=d1&grades=";
  });
  check("Back keeps the current answers and takes the view from history", () => {
    const m = S.traverse({ dim: "d3", grades: "d1-a,d3-c" }, {}, ["grades"]);
    return m.dim === undefined && m.grades === "d1-a,d3-c" || JSON.stringify(m);
  });
  check("an in-page step is told apart from a page change", () =>
    S.samePage("/strata/#open=s1", "/strata/") === true &&
    S.samePage("/models/", "/strata/#open=s1") === false &&
    S.samePage("/models/sdlc/executivereadout/?hash=a", "/models/sdlc/executivereadout/?hash=b") === false);

  // --- crossing pages (the fourth outside run, 205-CC) ----------------------
  // When Back or Forward crosses to another page, the page being left is still
  // listening for a moment. It must not write its state onto the arriving
  // page's address. The run saw deep-dive pages ending #cell=d1-a and the
  // home page carrying an assessment's grades.
  check("crossing pages: the page left writes nothing onto the arriving page's address", () => {
    const m = C.matrix(DIMS);
    const w = fakeWindow("/models/");
    w.history.pushState({ __N: true, url: "/m/", as: "/m/", options: {} }, "", "/m/");   // to the matrix
    let st = { dimId: "D3", level: "C" };
    S.write(w, m.toParams(st), { step: true });                                          // a changed state
    w.history.go(-2);                                                                    // Back to /models/
    const r = S.traverseTo(w, { state: w.history.state }, m, st, "/m/");
    return (r === null && w.location.pathname === "/models/" && w.location.hash === "") || JSON.stringify([r, w.location]);
  });
  check("crossing pages: a page left in its default state does not wipe the arriving page's saved state", () => {
    const strata = C.strata(["S0", "S1"]);
    const m = C.matrix(DIMS);
    const w = fakeWindow("/strata/");
    S.write(w, strata.toParams({ open: new Set(["S1"]) }), { step: false });             // Strata's saved state
    w.history.pushState({ __N: true, url: "/m/", as: "/m/", options: {} }, "", "/m/");   // to the matrix, default
    w.history.back();                                                                    // Back to Strata
    const r = S.traverseTo(w, { state: w.history.state }, m, m.initial(), "/m/");
    return (r === null && w.location.hash === "#open=s1") || JSON.stringify([r, w.location]);
  });
  check("crossing pages: a step that stays on the page is still handled", () => {
    const m = C.matrix(DIMS);
    const w = fakeWindow("/m/");
    let st = { dimId: "D2", level: "B" };
    S.write(w, m.toParams(st), { step: true });
    st = { dimId: "D4", level: "E" };
    S.write(w, m.toParams(st), { step: true });
    w.history.back();
    const r = S.traverseTo(w, { state: w.history.state }, m, st, "/m/");
    return (r && r.dimId === "D2" && r.level === "B") || JSON.stringify(r);
  });

  // --- the full sequence on an assessment, through the shared piece --------
  const assess = C.assessment(DIMS, { thresholdStates: true });
  check("assessment: view, answer, Back, Forward, leave, return", () => {
    const w = fakeWindow("/models/sdlc/assessment/");
    let st = S.restore(w, assess, assess.initial());           // first visit, no fragment
    if (st.dim !== "D1" || st.scores.D1 !== "A") return "default " + JSON.stringify(st);
    st = { ...st, dim: "D2" }; S.write(w, assess.toParams(st), { step: true });          // view
    st = { ...st, scores: { ...st.scores, D2: "C" } }; S.write(w, assess.toParams(st), { step: false }); // answer
    if (w.history.length !== 2) return "steps " + w.history.length;
    w.history.back();                                           // Back: undoes the view
    st = S.traverseTo(w, { state: w.history.state }, assess, st);
    if (st.dim !== "D1" || st.scores.D2 !== "C") return "after Back " + JSON.stringify(st);
    w.history.forward();
    st = S.traverseTo(w, { state: w.history.state }, assess, st);
    if (st.dim !== "D2" || st.scores.D2 !== "C") return "after Forward " + JSON.stringify(st);
    w.history.pushState({ __N: true, url: "/models/", as: "/models/", options: {} }, "", "/models/"); // leave
    w.history.back(); w.history.reload();                        // return: the page starts over
    const back = S.restore(w, assess, assess.initial());
    return back.dim === "D2" && back.scores.D1 === "A" && back.scores.D2 === "C" || "after return " + JSON.stringify(back);
  });
  check("assessment: a reload restores every grade, and the threshold states", () => {
    const st = { dim: "D3", scores: { D1: "B", D2: "Pre-AI", D3: "Exempt" }, exemptReasons: { D3: "Regulatory: a sector rule" } };
    const back = assess.fromParams(S.parseHash(S.formatHash(assess.toParams(st))), assess.initial());
    return back.dim === "D3" && back.scores.D1 === "B" && back.scores.D2 === "Pre-AI" && back.scores.D3 === "Exempt" || JSON.stringify(back);
  });
  check("assessment: the typed Exempt reason never reaches the address", () => {
    const st = { dim: "D3", scores: { D3: "Exempt" }, exemptReasons: { D3: "Regulatory: a sector rule" } };
    const h = S.formatHash(assess.toParams(st));
    return !/sector|regulatory/i.test(h) || h;
  });
  check("assessment: the reason is kept across an in-page Back, and only lost on a reload", () => {
    const w = fakeWindow("/models/sdlc/assessment/");
    let st = { ...assess.initial(), dim: "D3", scores: { D1: "A", D3: "Exempt" }, exemptReasons: { D3: "Contract" } };
    S.write(w, assess.toParams(st), { step: true });
    st = { ...st, dim: "D4" }; S.write(w, assess.toParams(st), { step: true });
    w.history.back();
    st = S.traverseTo(w, { state: w.history.state }, assess, st);
    return st.exemptReasons.D3 === "Contract" && st.dim === "D3" || JSON.stringify(st);
  });
  check("assessment: clearing every grade survives (it does not come back as the D1 sample)", () => {
    const st = { dim: "D1", scores: {}, exemptReasons: {} };
    const back = assess.fromParams(S.parseHash(S.formatHash(assess.toParams(st))), assess.initial());
    return Object.keys(back.scores).length === 0 || JSON.stringify(back.scores);
  });
  check("assessment: Pre-AI and Exempt are refused where a model defines neither", () => {
    const plain = C.assessment(DIMS, { thresholdStates: false });
    const back = plain.fromParams(S.parseHash("#dim=d1&grades=d1-b,d2-exempt"), plain.initial());
    return back.scores.D1 === "B" && back.scores.D2 === undefined || JSON.stringify(back.scores);
  });
  check("assessment: grades and dimensions the model does not hold are ignored", () => {
    const back = assess.fromParams(S.parseHash("#dim=d99&grades=d1-z,d77-a,d2-e"), assess.initial());
    return back.dim === "D1" && back.scores.D2 === "E" && Object.keys(back.scores).length === 1 || JSON.stringify(back);
  });

  // --- Strata ----------------------------------------------------------------
  const strata = C.strata(["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
  check("strata: open rows round-trip, and unknown rows are ignored", () => {
    const st = { open: new Set(["S3", "S1"]) };
    const back = strata.fromParams(S.parseHash(S.formatHash(strata.toParams(st))), strata.initial());
    const odd = strata.fromParams(S.parseHash("#open=s1,s9"), strata.initial());
    return [...back.open].sort().join() === "S1,S3" && [...odd.open].join() === "S1" || [...back.open].join();
  });
  check("strata: Back closes the row the last step opened", () => {
    const w = fakeWindow("/strata/");
    let st = S.restore(w, strata, strata.initial());
    st = { open: new Set(["S1"]) }; S.write(w, strata.toParams(st), { step: true });
    st = { open: new Set(["S1", "S4"]) }; S.write(w, strata.toParams(st), { step: true });
    w.history.back();
    st = S.traverseTo(w, { state: w.history.state }, strata, st);
    return [...st.open].join() === "S1" || [...st.open].join();
  });

  // --- the whole-model matrix ---------------------------------------------
  const matrix = C.matrix(DIMS);
  check("matrix: the selected cell round-trips", () => {
    const back = matrix.fromParams(S.parseHash(S.formatHash(matrix.toParams({ dimId: "D3", level: "C" }))), matrix.initial());
    return back.dimId === "D3" && back.level === "C" || JSON.stringify(back);
  });
  check("matrix: every link already shared in the old form (#d3-c) still resolves", () => {
    const back = matrix.fromParams(S.parseHash("#d3-c"), matrix.initial());
    return back.dimId === "D3" && back.level === "C" || JSON.stringify(back);
  });
  check("matrix: Back from a clicked cell returns to the cell before it", () => {
    const w = fakeWindow("/models/sdlc/whole-model-view/");
    let st = S.restore(w, matrix, matrix.initial());
    st = { dimId: "D2", level: "B" }; S.write(w, matrix.toParams(st), { step: true });   // click
    st = { dimId: "D2", level: "C" }; S.write(w, matrix.toParams(st), { step: false });  // arrow key
    st = { dimId: "D4", level: "E" }; S.write(w, matrix.toParams(st), { step: true });   // click
    w.history.back();
    st = S.traverseTo(w, { state: w.history.state }, matrix, st);
    return st.dimId === "D2" && st.level === "C" && w.history.length === 3 || JSON.stringify(st) + " " + w.history.length;
  });

  // --- the function models' explainer --------------------------------------
  const fn = C.functionModel();
  check("function model: the explainer's open state round-trips, and Back closes it", () => {
    const w = fakeWindow("/functionmodels/pm/");
    let st = S.restore(w, fn, fn.initial());
    st = { explainer: true }; S.write(w, fn.toParams(st), { step: true });
    const reloaded = fn.fromParams(S.parseHash(w.location.hash), fn.initial());
    w.history.back();
    st = S.traverseTo(w, { state: w.history.state }, fn, st);
    return reloaded.explainer === true && st.explainer === false || JSON.stringify([reloaded, st]);
  });

  // --- the value matrix -----------------------------------------------------
  const svm = C.valueMatrix([{ id: "I-1", scores: { a: 9, b: 3 } }, { id: "I 2", scores: { a: 1, b: 27 } }], ["a", "b"]);
  check("value matrix: the scale and changed scores round-trip; untouched scores write nothing", () => {
    const st = svm.initial();
    const untouched = S.formatHash(svm.toParams(st));
    const changed = { geometric: false, scores: { "I-1": { a: 27, b: 3 }, "I 2": { a: 1, b: 27 } } };
    const back = svm.fromParams(S.parseHash(S.formatHash(svm.toParams(changed))), svm.initial());
    return untouched === "" && back.geometric === false && back.scores["I-1"].a === 27 && back.scores["I 2"].b === 27 || untouched + " " + JSON.stringify(back);
  });
  check("value matrix: a score off the scale is ignored", () => {
    const back = svm.fromParams(S.parseHash("#scores=I-1:a:5"), svm.initial());
    return back.scores["I-1"].a === 9 || JSON.stringify(back.scores);
  });
  check("value matrix: both are answers, so Back keeps them", () =>
    svm.answerKeys.includes("scale") && svm.answerKeys.includes("scores"));

  // --- every codec writes only characters that read safely in an address ---
  check("every fragment is plain: letters, digits and - . _ ~ : , % = &", () => {
    const hs = [
      S.formatHash(assess.toParams({ dim: "D2", scores: { D1: "Pre-AI", D2: "Exempt", D3: "B" }, exemptReasons: { D2: "x & y #z" } })),
      S.formatHash(strata.toParams({ open: new Set(["S0", "S7"]) })),
      S.formatHash(matrix.toParams({ dimId: "D4", level: "E" })),
      S.formatHash(fn.toParams({ explainer: true })),
      S.formatHash(svm.toParams({ geometric: false, scores: { "I-1": { a: 27, b: 3 }, "I 2": { a: 3, b: 27 } } })),
    ];
    const bad = hs.filter((h) => !/^(#[A-Za-z0-9\-._~:,%=&]*)?$/.test(h));
    return bad.length === 0 || bad.join(" | ");
  });
}

// --- the pages are wired to the shared piece --------------------------------
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const WIRED = [
  ["components/Assessment.js", "assessment"],
  ["components/WholeModelView.js", "matrix"],
  ["components/FunctionModel.js", "functionModel"],
  ["components/StrategicValueMatrix.js", "valueMatrix"],
  ["pages/strata.js", "strata"],
];
for (const [file, codec] of WIRED) {
  check(file + " uses the shared hook with the " + codec + " codec", () => {
    const src = read(file);
    return (/useAddressState/.test(src) && new RegExp("\\b" + codec + "\\(").test(src)) || "not wired";
  });
}
check("no page or component writes history itself (only lib/address-state.js does)", () => {
  const offenders = [];
  for (const dir of ["components", "pages"]) {
    const walk = (d) => {
      for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
        const rel = d + "/" + e.name;
        if (e.isDirectory()) { if (e.name !== "api") walk(rel); }
        else if (/\.js$/.test(e.name) && /history\.(push|replace)State/.test(read(rel))) offenders.push(rel);
      }
    };
    walk(dir);
  }
  return offenders.length === 0 || offenders.join(", ");
});
check("the hook tells the shared piece which page it is, so a step to another page is left alone", () => {
  const src = read("components/useAddressState.js");
  return (/traverseTo\([^)]*pagePath/.test(src) && /pagePath\s*=\s*window\.location\.pathname/.test(src)) || "the hook passes no page path";
});
// The fifth outside run (210-CC): arriving back on a page, 11 of 87 snapshots
// showed the page's default for a frame or two before it restored -- measured
// at about 10 and 26 ms. The address is read in an effect that runs after the
// page is drawn. Read it in a layout effect, which runs before, and no reader
// or snapshot can see the default. (The server cannot do it: the part after
// # never reaches the server, so a full reload still draws once before the
// browser's script runs.)
check("the hook reads the address before the page is drawn (a layout effect)", () => {
  const src = read("components/useAddressState.js");
  return /use(?:Iso)?LayoutEffect\(\(\) => \{[\s\S]*?restore\(/.test(src) || "the address is read after the page is drawn";
});
check("pages/_app.js lets the page, not the router, handle an in-page Back", () => {
  const src = read("pages/_app.js");
  return (/beforePopState/.test(src) && /samePage/.test(src)) || "not installed";
});

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log((r.ok ? "PASS  " : "FAIL  ") + r.name + (r.ok ? "" : " -- " + r.detail));
console.log("\n" + (results.length - failed.length) + " of " + results.length + " pass.");
process.exit(failed.length ? 1 : 0);
