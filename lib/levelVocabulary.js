// Family-wide maturity-level vocabulary, shared across every model in the
// family (SDLC, and PDLC/Prioritization once their own repos exist) --
// identical regardless of model, so it lives here once rather than being
// duplicated per model page. Locked 2026-07-24 (briefs/2026-07-24-level-
// vocabulary/); full definitions added 2026-07-25 (briefs/2026-07-25-
// model-data-architecture/01a-maturity-column-definitions.md, private
// governance corpus) for column-header click content in the single-pane
// view.

export const LEVEL_NAMES = {
  A: "Nascent",
  B: "Modeled",
  C: "Continuous",
  D: "Integral",
  E: "Telemetric",
};

export const LEVEL_DEFINITIONS = {
  A: "The capability doesn't yet exist in any consistent, intentional form. Whatever's happening is ad hoc -- present by individual habit or accident, not by design. Nobody has yet decided what \"good\" looks like here, let alone built a way to produce it reliably.",
  B: "A real, deliberate representation now exists. Someone has defined what good looks like and built a consistent method for producing it -- but that method is still manual, and it belongs to one person or function rather than the organization at large.",
  C: "The method no longer waits for a scheduled moment. It runs constantly, staying current on its own cadence instead of being refreshed only when someone remembers to check. Still narrowly owned -- but always on.",
  D: "The capability has become load-bearing to how the work actually gets done, not a parallel check performed before or after it. It's now shared beyond its original owner, and removing it would break something real -- not just remove a nice-to-have.",
  E: "A continuous, two-way connection exists between what's happening and what's decided next -- signal flows in, action flows back out, close to real time. The way a race car and its pit crew stay in constant contact throughout a race, each shaping what the other does, moment to moment.",
};
