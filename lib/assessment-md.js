// The assessment's downloadable file, and the threshold states' meanings --
// OKF-TOGAF#161. Moved out of components/Assessment.js so a plain Node test
// can load it (scripts/threshold-states-self-test.js), as lib/dimension-parser.js
// was moved for #142. Plain CommonJS, no Next imports.
//
// An assessment scored A to E only produces byte for byte the file it always
// did (the self-test holds that). Pre-AI and Exempt, which the SDLC and EA
// models define and the PDLC and Prioritization models do not, add a cell
// value, a "Your score" line in place of a marked level, and, for Exempt, the
// cited reason the models require.
"use strict";

const LEVELS = ["A", "B", "C", "D", "E"];

function buildAssessmentMd({ modelTitle, modelFullName, repoUrl, dimensions, scores, exemptReasons = {}, date }) {
  const scored = Object.keys(scores).length;
  const day = date || new Date().toISOString().split("T")[0];

  let md = "";
  md += `# ${modelTitle}\n\n`;
  md += `**Framework:** ${modelFullName} — David Facer (CC BY 4.0)\n`;
  md += `**Model reference:** ${repoUrl}\n`;
  md += `**Generated:** ${day}\n\n`;
  md += `> Each dimension is scored A through E. A given level is only merited when **everything** in its definition is true. `;
  md += `Dimensions are independently scored — an organisation can be advanced in one and nascent in another.\n\n`;
  md += `---\n\n`;

  md += `## Scores\n\n`;
  md += `| Dimension | Name | Level |\n`;
  md += `|---|---|---|\n`;
  dimensions.forEach((d) => {
    md += `| ${d.id} | ${d.name} | ${scores[d.id] || "—"} |\n`;
  });
  md += `\n*${scored} of ${dimensions.length} dimensions graded.* No averaged score is computed above — dimensions are independently scored, and collapsing ordinal A–E judgments into a single mean would lend false interval precision to a profile that is only meaningful dimension by dimension.\n\n`;

  const exempt = dimensions.filter((d) => scores[d.id] === "Exempt");
  if (exempt.length) {
    md += `## Exempt dimensions\n\n`;
    md += `*Each Exempt dimension cites the constraint it rests on, as the model requires.*\n\n`;
    exempt.forEach((d) => {
      md += `- ${d.id} — ${d.name}: ${(exemptReasons[d.id] || "").trim()}\n`;
    });
    md += `\n`;
  }
  md += `---\n\n`;

  md += `## Full maturity definitions\n\n`;
  md += `*All five levels shown for each dimension. Your scored level is marked with ◀.*\n\n`;
  dimensions.forEach((d) => {
    md += `### ${d.id}. ${d.name}\n\n`;
    md += `*${d.desc}*\n\n`;
    if (scores[d.id] === "Pre-AI" || scores[d.id] === "Exempt") {
      md += `*Your score: ${scores[d.id]} — outside the A–E scale, so no lettered level is marked.*\n\n`;
    }
    LEVELS.forEach((lv) => {
      const marker = scores[d.id] === lv ? " — your score ◀" : "";
      md += `**Level ${lv}${marker}**\n\n`;
      md += `${d.levels[lv]}\n\n`;
    });
    md += `---\n\n`;
  });

  md += `*${modelFullName} © 2026 David Facer — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)*\n`;
  md += `*Full model: ${repoUrl}*\n`;
  return md;
}

// The two threshold states' meanings, read from a model's own matrix text at
// its pin, so the page quotes the model and keeps no copy of its own. Returns
// null when the model defines neither (PDLC and Prioritization today).
function readThresholdStates(matrixMd) {
  const section = (heading) => {
    const i = matrixMd.search(new RegExp("^### " + heading + "\\b", "m"));
    if (i < 0) return null;
    const rest = matrixMd.slice(i).split("\n").slice(1).join("\n");
    const end = rest.search(/^(---|### )/m);
    return (end < 0 ? rest : rest.slice(0, end)).split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").replace(/\*\*/g, "").trim()).filter(Boolean);
  };
  const pre = section("Pre-AI"), ex = section("Exempt");
  if (!pre || !ex) return null;
  // Only the sentence itself: the paragraph goes on to introduce a list
  // ("Acceptable constraint sources:") the page does not show.
  const citesPara = ex.find((p) => /valid only when it cites a governing constraint/i.test(p));
  const cites = citesPara && (citesPara.match(/[^.]*valid only when it cites a governing constraint\./i) || [])[0];
  return { preAi: pre[0], exempt: ex[0] + (cites ? " " + cites.trim() : "") };
}

module.exports = { LEVELS, buildAssessmentMd, readThresholdStates };
