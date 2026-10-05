#!/usr/bin/env node
// Self-test for OKF-TOGAF#155 -- links on aimaturitymodels.com that do not go
// where they say.
//
// A. THE BREADCRUMB. Fifteen source files carried
//    <Link href="/">davidfacer.com</Link>: a link labelled with the owner's
//    site that opened this site's own home page. The footer link on the same
//    pages, href="https://davidfacer.com", went where it said.
// B. THE DIGEST. Model markdown carried into the AI digest links to its
//    neighbours by bare file name, which 404s on this site (lib/digest-links.js).
//
// Reach (the owner, 2026-10-05): "The breadcrumb opens the site its label
// names and every relative link in the AI digest resolves on the live site".
//
// Offline: synthetic markdown and this repository's own source files only.
// Usage: node scripts/links-self-test.js   (exit 1 on a failing case)
"use strict";

const fs = require("fs");
const path = require("path");
const { absolutizeLinks, relativeLinks } = require("../lib/digest-links");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(66) + (shown || ""));
  if (!ok) bad = 1;
};

const BASE = "https://github.com/superdtf-0882/ai-native-product-prioritization-maturity-model/blob/3b1618583c08ac864ef54b3224dff35b45dba81d";

console.log("--- B. the digest's relative links ---");
{
  // The live case, as the model's own strategic_value_matrix.md writes it.
  const real = "*Authored by David Facer in 2015, and the reference pattern for Level E Value Model Coherence in the [AI-Native Product Prioritization Maturity Model](ai_native_product_prioritization_maturity_model.md). Derived content, not independently versioned.*";
  const out = absolutizeLinks(real, BASE);
  say(out.includes("](" + BASE + "/ai_native_product_prioritization_maturity_model.md)"),
    "the live case points at the model's own repository, at the pin");
  say(relativeLinks(out).length === 0, "and no relative link is left", JSON.stringify(relativeLinks(out)));

  const cases = [
    ["a sibling with an anchor", "[x](README.md#licence)", BASE + "/README.md#licence"],
    ["a ./ path", "[x](./CHANGELOG.md)", BASE + "/CHANGELOG.md"],
    ["an image", "![d](sdlc_handoff_diagram.png)", BASE + "/sdlc_handoff_diagram.png"],
  ];
  for (const [name, md, want] of cases) {
    const got = absolutizeLinks(md, BASE);
    say(got.includes("](" + want + ")"), "rewritten: " + name, JSON.stringify(got));
  }

  const kept = [
    ["a root-relative site link (control)", "[Strata](/strata)"],
    ["an absolute link (control)", "[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)"],
    ["an in-page anchor (control)", "[below](#provenance)"],
    ["a mailto link (control)", "[mail](mailto:someone@example.com)"],
    ["an inline code span (control)", "`GovernedThing[S](i : Intent)` and `a[0](b.md)`"],
    ["a fenced code block (control)", "```\n[x](y.md)\n```"],
  ];
  for (const [name, md] of kept) say(absolutizeLinks(md, BASE) === md, "unchanged: " + name);

  say(JSON.stringify(relativeLinks("[a](b.md) [c](/d) [e](https://f) `[g](h.md)`")) === '["b.md"]',
    "the sweep finds only the relative link outside code (control)");
}

console.log("--- A. the breadcrumb ---");
{
  const root = path.join(__dirname, "..");
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) files.push(p);
    }
  };
  walk(path.join(root, "components"));
  walk(path.join(root, "pages"));
  // Any link or anchor whose visible label is exactly "davidfacer.com".
  const LABELLED = /<(Link|a)\b([^>]*)>\s*davidfacer\.com\s*<\/\1>/g;
  let labelled = 0;
  const wrong = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(LABELLED)) {
      labelled++;
      const href = (m[2].match(/href=["']([^"']*)["']/) || [])[1];
      if (href !== "https://davidfacer.com") wrong.push(path.relative(root, f) + " -> " + JSON.stringify(href));
    }
  }
  say(labelled >= 15, "the breadcrumbs labelled davidfacer.com are found", labelled + " found");
  say(wrong.length === 0, "every one opens https://davidfacer.com", wrong.length ? wrong.length + " do not, e.g. " + wrong[0] : "");
}

process.exitCode = bad;
