// The one place this site writes in-page state into the address and the
// browser's history. OKF-TOGAF#130: every in-page choice on the site survives
// Back, Forward and a return visit, and Back undoes views, not answers.
//
// THE OWNER'S RULINGS (134-DT2 and 190-CC of the OKF TOGAF corpus, scoped
// 2026-10-10):
//   * a VIEW (what the reader is looking at) adds a history step; an ANSWER (a
//     grade, a score, a setting) only updates the address; arrow keys only
//     update the address;
//   * the state lives after the #, one convention across the site --
//     `#key=value&key=value`. The part after # never reaches the server, and
//     crawlers read every state as the same page;
//   * assessment grades survive; typed Exempt reasons stay out of the address.
//
// BACK UNDOES VIEWS, NOT ANSWERS -- and that needs one thing a plain history
// does not do. Each entry holds the address as it was when the reader left it,
// answers included, so stepping Back to an earlier view would also bring back
// that view's older answers. On an in-page Back or Forward the page therefore
// takes its VIEW from the entry it lands on and keeps the ANSWERS it already
// has, then writes the merge onto that entry (traverse, traverseTo).
//
// THE ROUTER. Next's page router also listens for Back and Forward. Two things
// keep it working: every entry written here keeps the router's own history
// state (so Back from another page still routes to this one, and the page then
// reads its address on arrival), and pages/_app.js tells the router to leave an
// in-page step to the page (samePage). Before this, the matrix wrote its cell
// with an empty history state, which the router cannot route back to.
//
// Plain CommonJS with no browser globals: the window is passed in, so
// scripts/address-state-self-test.js drives it with a simulated history.

function parseHash(hash) {
  const out = {};
  const s = String(hash || "").replace(/^#/, "");
  if (!s) return out;
  for (const part of s.split("&")) {
    if (!part) continue;
    const i = part.indexOf("=");
    // A bare token (no "=") is kept with a null value, so an old-form link
    // such as the matrix's #d7-c can still be read by its codec.
    if (i < 0) out[part] = null;
    else out[part.slice(0, i)] = part.slice(i + 1);
  }
  return out;
}

// Values are written as the codecs give them: each codec builds its values
// from a plain alphabet and percent-encodes anything else itself.
function formatHash(params) {
  const parts = [];
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined) continue;
    parts.push(v === null ? k : k + "=" + v);
  }
  return parts.length ? "#" + parts.join("&") : "";
}

// The router's history state, carried onto the new entry with its displayed
// address updated. Its `url` (the route) is left as the router wrote it.
function historyState(prev, as) {
  if (prev && typeof prev === "object" && prev.__N) return { ...prev, as };
  return prev === undefined ? null : prev;
}

// Write the state into the address: a new step for a view, a replacement for
// an answer. Returns false when the address already says this.
function write(win, params, { step = false } = {}) {
  const base = win.location.pathname + (win.location.search || "");
  const url = base + formatHash(params);
  const current = base + (win.location.hash || "");
  if (url === current) return false;
  const state = historyState(win.history.state, url);
  if (step) win.history.pushState(state, "", url);
  else win.history.replaceState(state, "", url);
  return true;
}

// The view from the entry Back or Forward landed on, the answers the page
// already holds.
function traverse(currentParams, targetParams, answerKeys) {
  const out = {};
  for (const [k, v] of Object.entries(targetParams || {})) {
    if (!answerKeys.includes(k)) out[k] = v;
  }
  for (const k of answerKeys) {
    if (currentParams && currentParams[k] !== undefined) out[k] = currentParams[k];
  }
  return out;
}

// On arrival -- a first visit, a reload, a shared link, or a return from
// another page: everything comes from the address.
function restore(win, codec, base) {
  return codec.fromParams(parseHash(win.location.hash), base);
}

// On Back or Forward inside the page. A popstate with no state is a new
// address the reader typed or pasted, not a step through history, so it is
// read whole, like an arrival.
//
// A STEP TO ANOTHER PAGE IS NOT OURS. When Back or Forward crosses to a
// different page, the page being left is still mounted for a moment and hears
// the same popstate. It must not answer: the address now belongs to the page
// arriving, and writing this page's state onto it stamped other pages with
// this one's state (#cell=d1-a on every deep-dive page) or, from a page in its
// default state, wiped the arriving page's own (the value matrix's scale) --
// both found by the fourth outside run (205-CC). `pagePath` is the page's own
// path and query; a step anywhere else returns null and writes nothing.
function traverseTo(win, event, codec, current, pagePath) {
  if (pagePath !== undefined && win.location.pathname + (win.location.search || "") !== pagePath) return null;
  if (!event || event.state == null) return restore(win, codec, current);
  const merged = traverse(codec.toParams(current), parseHash(win.location.hash), codec.answerKeys);
  const next = codec.fromParams(merged, current);
  write(win, codec.toParams(next), { step: false });
  return next;
}

// Is the router's target the page already showing, differing only after #?
function samePage(targetAs, currentAs) {
  const strip = (a) => String(a || "").split("#")[0];
  return strip(targetAs) === strip(currentAs);
}

module.exports = { parseHash, formatHash, historyState, write, traverse, restore, traverseTo, samePage };
