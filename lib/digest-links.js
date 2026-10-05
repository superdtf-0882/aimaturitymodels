// Relative links in the AI digest -- OKF-TOGAF#155.
//
// THE DEFECT. The digest (lib/aiDigestCore.js) carries each model's canonical
// markdown verbatim. That markdown links to its neighbours by bare file name,
// which works inside the model's own repository and nowhere else: in
// /llms.txt the link to ai_native_product_prioritization_maturity_model.md
// resolved to aimaturitymodels.com/ai_native_product_prioritization_maturity_model.md,
// a 404. Found by the second outside run (OKF-TOGAF briefs/2026-10-04-external-probe-2/).
//
// Plain CommonJS, no Next imports, for the same reason as aiDigestCore.js.
"use strict";

// Rewrites every relative inline link outside code to an absolute URL under
// `base` -- the model's own repository at the commit the site pins, where the
// file the link names actually sits. Root-relative, absolute and anchor links,
// and anything in code, are returned byte for byte.
function absolutizeLinks(markdown, base) {
  const root = base.replace(/\/+$/, "") + "/";
  let fenced = false;
  return markdown.split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return line; }
    if (fenced) return line;
    return line.split(/(`+[^`]*`+)/).map((part) => {
      if (part.startsWith("`")) return part;
      return part.replace(/\]\(([^)\s]+)\)/g, (whole, target) =>
        isRelative(target) ? "](" + new URL(target, root).href + ")" : whole);
    }).join("");
  }).join("\n");
}

// Every inline link target outside code that is neither absolute (a scheme),
// root-relative ("/strata") nor an in-page anchor ("#x"). The self-test's
// sweep; it rewrites nothing.
function relativeLinks(markdown) {
  const out = [];
  eachLinkOutsideCode(markdown, (target) => {
    if (isRelative(target)) out.push(target);
  });
  return out;
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
function isRelative(target) {
  return !SCHEME.test(target) && !target.startsWith("/") && !target.startsWith("#");
}

// Calls fn(target) for each inline link or image "[text](target)" whose target
// has no whitespace, skipping fenced code blocks and inline code spans.
function eachLinkOutsideCode(markdown, fn) {
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    for (const part of line.split(/(`+[^`]*`+)/)) {
      if (part.startsWith("`")) continue;
      for (const m of part.matchAll(/\]\(([^)\s]+)\)/g)) fn(m[1]);
    }
  }
}

module.exports = { absolutizeLinks, relativeLinks, isRelative };
