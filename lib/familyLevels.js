// The family's five level names, read from their one home: family_maturity_levels.md
// (STD-FAMILY-LEVELS) in the SDLC repository, at the commit this site pins SDLC
// (STD-MODEL-PARTS v1.1 §3.6; OKF-TOGAF#204). COMMONJS, like lib/pins.js, so the
// pages (through lib/models.js) and the AI digest (lib/aiDigestCore.js, which runs as
// a plain node postbuild script) read the names the same way and hold no copy of them.
//
// It reads the file's names line, "A — Nascent · B — Modeled · …", and the table's
// one-line descriptions. A file without a complete names line THROWS: the build
// fails closed rather than render a page without its level names.
"use strict";

const NAMES_LINE = /^A — (\S+) · B — (\S+) · C — (\S+) · D — (\S+) · E — (\S+)$/m;
const ROW = /^\| ([A-E]) \| \*\*(.+?)\*\* \| (.+?) \|$/gm;

function parseFamilyLevels(md) {
  const text = String(md || "").replace(/\r\n/g, "\n");
  const m = NAMES_LINE.exec(text);
  if (!m) throw new Error("family_maturity_levels.md has no names line (\"A — … · B — … · C — … · D — … · E — …\")");
  const names = { A: m[1], B: m[2], C: m[3], D: m[4], E: m[5] };
  const oneLine = {};
  let r;
  while ((r = ROW.exec(text))) {
    if (r[2] !== names[r[1]]) throw new Error("family_maturity_levels.md: the table names " + r[1] + " \"" + r[2] + "\", the names line \"" + names[r[1]] + "\"");
    oneLine[r[1]] = r[3];
  }
  return { names, oneLine };
}

module.exports = { parseFamilyLevels, FAMILY_LEVELS_FILE: "family_maturity_levels.md" };
