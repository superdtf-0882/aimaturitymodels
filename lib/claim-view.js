// The claim side of the definition/claim toggle on the self-assessment pages (OKF-TOGAF#206).
// COMMONJS, like lib/assessment-md.js, so scripts/claim-toggle-self-test.js can load it.
//
// For a level B to E, the claim is the model's own verification line for the step into that
// level -- transitions["<previous>-<level>"].verification -- word for word, its marks kept.
// This is the shape's verificationInto (STD-MODEL-PARTS v1.1 section 2), read from what the
// site's loaders already give each dimension. Level A has no step into it; Pre-AI and Exempt
// sit outside the scale; a step without a verification line has no claim, and nothing is
// put in its place. The page stays a self-assessment: it shows the test, it applies none.
"use strict";

const CLAIM_LEAD = "Claim this level only if you can show:";
const PREVIOUS = { B: "A", C: "B", D: "C", E: "D" };

function claimFor(dim, level) {
  const from = PREVIOUS[level];
  if (!from || !dim || !dim.transitions) return null;
  const t = dim.transitions[from + "-" + level];
  return t && typeof t === "object" && typeof t.verification === "string" && t.verification.trim() ? t.verification : null;
}

// Which claim is open: one dimension at one level. A new level, or a new dimension, opens on
// the definition -- the owner, 2026-10-17, after using the live toggle: "I think it should
// start with the definition in those types of transitions."
const claimKey = (dimId, level) => dimId + ":" + level;
const claimShown = (openedFor, dimId, level) => openedFor != null && openedFor === claimKey(dimId, level);

module.exports = { CLAIM_LEAD, claimFor, claimKey, claimShown };
