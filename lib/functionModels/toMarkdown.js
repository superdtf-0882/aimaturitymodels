// Generic Function Model -> markdown renderer, shared by every Function
// Model in the family (DS-014) -- one function reads the same content
// shape components/FunctionModel.js renders, so the AI digest never
// hand-duplicates a model's prose. No network fetch needed: unlike the
// three maturity models (each fetched raw from its own public repo),
// a Function Model's content already lives in this repo, so the digest
// builds its markdown locally.

function toMarkdown(data) {
  const lines = [`## ${data.title}`, "", data.dek.join(" ")];

  if (data.explainer) {
    lines.push("", `### ${data.explainer.title}`, "");
    data.explainer.blocks.forEach((block) => {
      if (block.type === "list") {
        block.items.forEach((item) => lines.push(`- **${item.term}:** ${item.text}`));
        lines.push("");
      } else {
        lines.push(block.text, "");
      }
    });
  }

  lines.push("", "### Inputs", "");
  data.inputs.items.forEach((item) => {
    lines.push(item.description ? `- **${item.title}:** ${item.description}` : `- ${item.title}`);
  });
  if (data.inputs.group) {
    lines.push(`- **${data.inputs.group.title}:** ${data.inputs.group.items.join(", ")}`);
  }

  lines.push("", `### ${data.functionLabel}`, "");
  if (data.functionStatement) lines.push(data.functionStatement, "");
  lines.push(`**Activities** (${data.activities.caption}):`, "");
  data.activities.items.forEach((item) => {
    if (typeof item === "object") {
      lines.push(item.description ? `- **${item.title}:** ${item.description}` : `- ${item.title}`);
    } else {
      lines.push(`- ${item}`);
    }
  });

  lines.push("", "**Capabilities** (" + data.capabilities.caption + "):", "");
  (data.capabilities.groups || []).forEach((group) => {
    const note = group.note ? ` *${group.note}.*` : "";
    lines.push(`- **${group.title}** — ${group.items.join(", ")}.${note}`);
  });
  data.capabilities.singles.forEach((single) => {
    const note = single.note ? ` — *${single.note}.*` : "";
    lines.push(`- **${single.title}**${note}`);
  });
  if (data.capabilities.pair && data.capabilities.pair.length > 0) {
    lines.push(`- ${data.capabilities.pair.join(" · ")}`);
  }

  lines.push("", "**Enabling substrates:**", "");
  data.substrates.forEach((substrate) => {
    const note = substrate.note ? ` *${substrate.note}.*` : "";
    lines.push(`- **${substrate.title}:** ${substrate.items.join(", ")}.${note}`);
  });

  lines.push("", "### Outputs", "");
  data.outputs.forEach((bucket) => {
    const caption = bucket.caption ? ` (${bucket.caption})` : "";
    lines.push(`- **${bucket.title}**${caption}: ${bucket.items.join(", ")}`);
  });

  if (data.boundaryNote) {
    lines.push("", `### ${data.boundaryNote.title}`, "");
    data.boundaryNote.items.forEach((item) => lines.push(`- ${item}`));
  }

  return lines.join("\n");
}

module.exports = { toMarkdown };
