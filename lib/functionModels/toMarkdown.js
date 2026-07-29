// Generic Function Model -> markdown renderer, shared by every Function
// Model in the family (DS-014) -- one function reads the same content
// shape components/FunctionModel.js renders, so the AI digest never
// hand-duplicates a model's prose. No network fetch needed: unlike the
// three maturity models (each fetched raw from its own public repo),
// a Function Model's content already lives in this repo, so the digest
// builds its markdown locally.

function toMarkdown(data) {
  const lines = [`## ${data.title}`, "", data.dek.join(" ")];

  lines.push("", "### Inputs", "");
  data.inputs.simple.forEach((item) => lines.push(`- ${item}`));
  lines.push(`- **${data.inputs.group.title}:** ${data.inputs.group.items.join(", ")}`);

  lines.push("", `### ${data.functionLabel}`, "");
  lines.push(`**Activities** (${data.activities.caption}): ${data.activities.items.join(" · ")}`);

  lines.push("", "**Capabilities** (" + data.capabilities.caption + "):", "");
  data.capabilities.groups.forEach((group) => {
    const note = group.note ? ` *${group.note}.*` : "";
    lines.push(`- **${group.title}** — ${group.items.join(", ")}.${note}`);
  });
  data.capabilities.singles.forEach((single) => {
    const note = single.note ? ` — *${single.note}.*` : "";
    lines.push(`- **${single.title}**${note}`);
  });
  lines.push(`- ${data.capabilities.pair.join(" · ")}`);

  lines.push("", "**Tools:** " + data.tools.rows.flat().join(" · "));

  lines.push(
    "",
    "**Context:**",
    `- Governance: ${data.contextStrip.governance}`,
    `- Resources: ${data.contextStrip.resources.text} (${data.contextStrip.resources.note})`,
    `- Standards: ${data.contextStrip.standards}`
  );

  lines.push("", "### Outputs", "");
  data.outputs.forEach((bucket) => {
    lines.push(`- **${bucket.title}** (${bucket.caption}): ${bucket.items.join(", ")}`);
  });

  return lines.join("\n");
}

module.exports = { toMarkdown };
