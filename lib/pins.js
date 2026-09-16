// Pinned commits and the currency basis computed from them. COMMONJS
// DELIBERATELY, and that is the whole point of this file existing.
//
// WHY IT EXISTS. lib/models.js is ESM; lib/aiDigestCore.js is CommonJS
// and must stay so (its own header: it runs both through Next's pipeline
// and as a plain `node` postbuild script, which cannot `import` ESM).
// Because the digest could not import the pages' constants, its currency
// sentence was written BY HAND -- and on 2026-08-26 it went live saying
// "The site's Whole-Model Views and assessment pages read PINNED
// commits", which is false for the SDLC Whole-Model View, whose
// short-form cells come from `main`.
//
// That is the same one-basis-claim-about-a-two-basis-page defect the
// currency field had just corrected ON THE PAGE, restated on /llms.txt
// IN THE SAME COMMIT. DTOG found it
// (briefs/dtog/2026-08-26-10-DTOG-review-of-the-currency-basis-field.md
// §3.1-3.2) and named the right fix: "the sentence is wrong because it
// was written by hand; correcting the words leaves the mechanism that
// produced them."
//
// So the constants and the derivation live here, in the module system
// BOTH consumers can reach, and neither consumer states a currency fact
// it did not compute.

// ---------------------------------------------------------------------
// SDLC pin history. Moved here from lib/models.js 2026-08-26 unchanged.
//
// Pinned to a specific commit, not `main` -- the assessment set needs a
// checkable citation the same way short_form.yml already carries one
// (source_matrix_version/source_matrix_commit). Bump both together when
// the model's content next changes meaningfully -- don't let this drift
// to a newer commit while short_form.yml cites the old one, or the two
// derived views would disagree about their source.
// This drifted anyway, from 2026-07-26 to 2026-08-26: five bumps moved
// this pin and none moved short_form.yml's citation, which stayed at
// 4730189. Re-verified and realigned to cb6ffd1 on 2026-08-26 (that
// repo's own commit 0c9b887) -- all 65 cells compared at both commits,
// 0 definitions rewritten, so the compression had stayed faithful the
// whole time and only the citation was wrong. The instruction above was
// correct and was simply not executed; the check meant to catch that was
// keyed to a git TAG and so reported stale continuously, which is why a
// month of drift produced no usable signal.
// 2026-08-25: bumped to cb6ffd1 for the stale family-scope line, which
// read "(SDLC, and PDLC/Prioritization once their own repos exist)"
// after both repos existed -- the site had been rendering a superseded
// claim for 24 days. PINNED TO cb6ffd1 AND NOT TO origin/main
// DELIBERATELY: HEAD adds only BETA/, which nothing here fetches, and
// BETA/ is slated for removal -- a history rewrite would 404 every
// pinned fetch on a live public site. cb6ffd1 is its parent and survives
// the removal of a later commit.
// The full bump-by-bump history stays in lib/models.js above the fetch
// helpers that use these URLs.
const SDLC_PINNED_COMMIT = "cb6ffd15f305817dc4bdeef30538a15df86ae505";
const PDLC_PINNED_COMMIT = "a0f18760064d41f3779cad9eb4421f99a5ee18ea";
const PRIORITIZATION_PINNED_COMMIT = "9d8c0a15edee93ad61c6f6684dbb0c4701deb12c";
// EA, added 2026-09-12 with the model's first appearance on the site.
// Pinned at the v1.0.1 commit, and BOTH sources read that one basis --
// short-form cells and full model text alike -- so this page is
// single-basis from the start rather than inheriting SDLC's mixed shape.
//
// v1.0.1 and not v1.0.0 deliberately. The matrix published at v1.0.0
// declared itself "Version 0.1.0-draft ... Not locked, not released, not
// registered" INSIDE THE TAG THAT RELEASED IT, and short_form.yml carried
// no source_matrix_version/source_matrix_commit at all. v1.0.1 corrects
// both and changes no cell content: sha256 over the sorted 45-cell set is
// identical at the two versions. v1.0.0 is deliberately not re-tagged, so
// this pin must stay at v1.0.1 or later -- pinning back to v1.0.0 would
// serve the draft header to readers.
// MOVED TO v1.1.0 2026-09-15, on David's instruction. v1.1.0 adds D10
// Shared language (Vocabula) -- ten dimensions, 50 short-form cells,
// no existing cell changed. Until this pin moved, the released model
// carried ten dimensions and this site served nine, correctly and
// silently, because the pin is the site's statement of what it shows.
// THE SITE PIN IS A RELEASE SURFACE AND WAS NOT ON THE RELEASE ACT'S
// OWN LIST (briefs/2026-09-15-vocabula/09-CC section 4): matrix, short
// form, source_matrix_* fields, changelog, STD-EA-MM, the rehomed note
// -- and not this constant, which lives in another repo. Found by DTOG
// observing the live page render nine, and traced here.
// Moved to v1.1.1 2026-09-15: two corrections inside D10, no dimension
// added and no short-form cell changed, so the page count and the digest
// sentence do not move with this one.
const EA_PINNED_COMMIT = "c30334fa1aee155a953c1ee45351fa7cfcc25b96";

const shortSha = (sha) => String(sha).slice(0, 7);

// Each entry describes what a Whole-Model View actually fetches, keyed to
// the same constants the fetchers build their URLs from. If a pin moves,
// these move with it, because there is no second copy.
//
// `basis: "floating"` is not a defect -- lib/aiDigestCore.js floats on
// purpose and says why. The field exists so a reader can tell WHICH,
// not so everything ends up pinned.
const MODEL_CURRENCY = {
  sdlc: {
    label: "AI-Native SDLC Maturity Model",
    sources: [
      { what: "short-form cells", basis: "floating", ref: "main" },
      { what: "full model text", basis: "pinned", ref: shortSha(SDLC_PINNED_COMMIT) },
    ],
  },
  pdlc: {
    label: "AI-Native PDLC Maturity Model",
    sources: [
      { what: "short-form cells", basis: "pinned", ref: shortSha(PDLC_PINNED_COMMIT) },
      { what: "full model text", basis: "pinned", ref: shortSha(PDLC_PINNED_COMMIT) },
      { what: "shared D1-D3 layer", basis: "pinned", ref: shortSha(SDLC_PINNED_COMMIT) },
    ],
  },
  prioritization: {
    label: "AI-Native Product Prioritization Maturity Model",
    sources: [
      { what: "short-form cells", basis: "pinned", ref: shortSha(PRIORITIZATION_PINNED_COMMIT) },
      { what: "full model text", basis: "pinned", ref: shortSha(PRIORITIZATION_PINNED_COMMIT) },
    ],
  },
  ea: {
    label: "AI-Native EA Maturity Model",
    sources: [
      { what: "short-form cells", basis: "pinned", ref: shortSha(EA_PINNED_COMMIT) },
      { what: "full model text", basis: "pinned", ref: shortSha(EA_PINNED_COMMIT) },
    ],
  },
};

const distinctBases = (m) => new Set(m.sources.map((s) => `${s.basis}:${s.ref}`));

// One sentence a reader can check, and a mixed page says so.
function currencyBasisLine(key) {
  const m = MODEL_CURRENCY[key];
  if (!m) return "";
  const parts = m.sources.map(
    (s) => `${s.what} ${s.basis === "floating" ? "current at main" : `pinned at ${s.ref}`}`
  );
  return `Currency basis: ${parts.join("; ")}.${
    distinctBases(m).size > 1
      // "its sources'" and not "the model's": PDLC's third basis is a
      // commit in the SDLC repo, for the D1-D3 layer PDLC inherits by
      // reference. Two repos, not two points in one model's history.
      ? " These are different bases, so this page can render content from more than one point in its sources' history."
      : " One basis throughout."
  }`;
}

// The digest's own line. COMPUTED, including its claim about the pages --
// which is the clause that was false when a human wrote it. It reads
// MODEL_CURRENCY rather than asserting a summary of it, so a page that
// becomes mixed (or stops being mixed) changes this sentence without
// anyone remembering to.
function digestCurrencyLine() {
  const mixed = Object.keys(MODEL_CURRENCY).filter((k) => distinctBases(MODEL_CURRENCY[k]).size > 1);
  const pagesClause = mixed.length
    ? `The site's Whole-Model Views do NOT share this basis, and they do not all share one basis with each other: ${mixed
        .map((k) => `the ${k.toUpperCase()} view reads ${MODEL_CURRENCY[k].sources
          .map((s) => `${s.what} ${s.basis === "floating" ? "at main" : `pinned at ${s.ref}`}`)
          .join(" and ")}`)
        .join("; ")}. Each of those pages states its own basis where it renders.`
    : "The site's Whole-Model Views each read a single pinned basis, stated on the page.";
  return (
    "CURRENCY BASIS: this digest fetches every model from `main` — it is always current, and it is NOT pinned. " +
    pagesClause +
    " Same sources, different points in their history: when this digest and a model page disagree, that is temporal skew between two correct renderings, not an error in either, and this sentence is here so a reader can tell which is which rather than discovering it."
  );
}

module.exports = {
  SDLC_PINNED_COMMIT,
  PDLC_PINNED_COMMIT,
  PRIORITIZATION_PINNED_COMMIT,
  EA_PINNED_COMMIT,
  MODEL_CURRENCY,
  currencyBasisLine,
  digestCurrencyLine,
};
