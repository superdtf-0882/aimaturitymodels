#!/usr/bin/env node
// Self-test for the EA OKF page's wording (OKF-TOGAF#158), on "The EA OKF
// page as 160-CC option B -- David Facer 10/8/2026" (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/160-CC). The page's opening is the owner's
// introduction's EA OKF paragraph, word for word, and this check holds the two
// together: if either changes alone, it fails. The models paragraph says EA OKF
// represents and connects the architecture, and is not its foundation.
// Offline; exit 1 on a failing case.
"use strict";

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(62) + (shown || ""));
  if (!ok) bad = 1;
};
const { PRACTICE_INTRO } = require("../lib/intros");
const { EAOKF_INTRO, EAOKF_BODY_MARKDOWN } = require("../lib/eaokfContent");

// The introduction's EA OKF paragraph: the line after its bold heading.
const HEAD = "**EA OKF — How is the architecture made machine-navigable?**\n";
const at = PRACTICE_INTRO.indexOf(HEAD);
const para = at < 0 ? "" : PRACTICE_INTRO.slice(at + HEAD.length).split("\n")[0].trim();
say(para.startsWith("The machine-readable representation contract for the architecture corpus."), "the introduction carries its EA OKF paragraph", String(para.length));
say(EAOKF_INTRO === para, "the page's opening is that paragraph, word for word");

const MODELS_PARA = "EA OKF represents and connects the architecture; it is not the architecture itself, and not one of the models. Each model is the actual product: a named Standard, expressed as structured, machine-readable governance rather than a one-off document. [Strata](/strata) is the structure explaining how they relate to each other once they're in place.";
say(EAOKF_BODY_MARKDOWN.includes("## Where the models in this family stand\n\n" + MODELS_PARA), "the models paragraph, as 160-CC words it");

const page = EAOKF_INTRO + "\n" + EAOKF_BODY_MARKDOWN;
for (const phrase of ["the schema this family is written in", "governed schema every model", "the ground they all stand on", "using exactly this schema underneath", "an Ontology, Lexicon, and Taxonomy"]) {
  say(!page.includes(phrase), "gone: \"" + phrase + "\"");
}
say(EAOKF_BODY_MARKDOWN.includes("## A corpus, not a wiki") && EAOKF_BODY_MARKDOWN.includes("## What it actually holds"), "the two Corpus sections stay");

console.log(bad ? "EAOKF WORDING SELF-TEST FAIL" : "EAOKF WORDING SELF-TEST PASS");
process.exit(bad);
