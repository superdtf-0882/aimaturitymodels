// The function model pages, derived from the practice's rows (OKF-TOGAF#241
// step 4; STD-FUNCTION-MODEL §2.1 and §3). lib/functionModels/rows.json is the
// practice's export, copied byte for byte; scripts/function-models-self-test.js
// holds its fingerprint and the practice commit it came from. This file writes
// no model text: every word on a page comes from the rows, and the parts the
// standard calls derived are derived here, never written:
//   inputs    the model's input bundles; a bundle with no description of its
//             own lists its members by name, read from the senders' outputs
//   outputs   grouped on recipient, in the order the outputs first name them;
//             an output to two recipients appears under both, and recipients
//             sent the very same list share one block ("To Sales & Partners")
//   boundary  the decision-rights entries that grant to this function or bound it
// The page shape is the one components/FunctionModel.js already renders (DS-014).
//
// Plain CommonJS, as the content files were: the postbuild digest
// (scripts/generate-llms-txt.js) reads these pages under plain node.

const ROWS = require("./rows.json");

const ACCENT = {
  "software-engineering": "eng",
  "product-management": "product-mgmt",
  "product-marketing": "gtm",
  "operations-support": "ops",
  leadership: "leadership",
  "customer-success": "customer-success",
  "demand-generation": "demand-gen",
  sales: "sales-partners",
  partners: "sales-partners",
  "security-compliance": "security-compliance",
  "data-platform": "data-platform",
};

function joinNames(names) {
  if (names.length < 3) return names.join(" & ");
  return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
}

function pageFor(modelId, rows = ROWS) {
  const items = rows.items;
  const model = items.find((it) => it.kind === "model" && it.id === modelId);
  if (!model) throw new Error("no model row " + modelId);
  const parties = new Map(items.filter((it) => it.kind === "party").map((p) => [p.slug, p]));
  const nameOf = (slug) => {
    if (!parties.has(slug)) throw new Error(modelId + ": no party " + slug);
    return parties.get(slug).name;
  };
  const payload = new Map();
  for (const m of items.filter((it) => it.kind === "model")) {
    for (const o of m.outputs || []) payload.set(o.id, o.title);
    for (const x of m.provisional_inputs || []) payload.set(x.id, x.title);
  }
  const f = model.function;

  const inputs = {
    items: (model.input_bundles || []).map((b) => {
      const titles = b.members.map((id) => {
        if (!payload.has(id)) throw new Error(modelId + ": " + b.id + " names no payload " + id);
        return payload.get(id);
      });
      if (b.description) return { title: b.title, description: b.description };
      if (titles.length === 1 && titles[0] === b.title) return { title: b.title };
      return { title: b.title, description: titles.join(", ") + "." };
    }),
  };

  const caps = model.capabilities || [];
  const withItems = (c) => Array.isArray(c.items) && c.items.length > 0;
  const capabilities = {
    caption: rows.captions.capabilities,
    groups: caps.filter(withItems).map((c) => ({ title: c.title, items: c.items, ...(c.note ? { note: c.note } : {}) })),
    singles: caps.filter((c) => !withItems(c)).map((c) => ({ title: c.title, ...(c.note ? { note: c.note } : {}) })),
    pair: [],
  };

  const order = [];
  const byTo = new Map();
  for (const o of model.outputs || []) {
    for (const t of o.to) {
      if (!byTo.has(t)) { byTo.set(t, []); order.push(t); }
      byTo.get(t).push(o.title);
    }
  }
  const blocks = [];
  for (const t of order) {
    const same = blocks.find((b) => JSON.stringify(b.items) === JSON.stringify(byTo.get(t)));
    if (same) same.to.push(t);
    else blocks.push({ to: [t], items: byTo.get(t) });
  }
  const headings = model.output_headings || {};
  const outputs = blocks.map((b) => {
    const h = b.to.length === 1 ? headings[b.to[0]] : null;
    return {
      key: ACCENT[b.to[0]] || b.to[0],
      title: "To " + joinNames(b.to.map(nameOf)),
      ...(h && h.caption ? { caption: h.caption } : {}),
      items: b.items,
    };
  });

  const rights = items.filter((it) => it.kind === "decision_right"
    && ((it.bounds || []).includes(f.id) || (it.grants || []).some((g) => g.holder === f.id)));

  return {
    slug: f.id,
    ...(model.explainer ? { explainer: model.explainer } : {}),
    title: f.name + " Function Model",
    dek: f.dek ? [f.dek] : [],
    inputs,
    functionLabel: f.label || f.name + " Function",
    functionStatement: f.essence,
    activities: {
      caption: rows.captions.activities,
      items: (model.activities || []).map((a) => ({ title: a.title, ...(a.description ? { description: a.description } : {}) })),
    },
    capabilities,
    substrates: (model.substrates || []).map((s) => ({ title: s.title, items: s.items, ...(s.note ? { note: s.note } : {}) })),
    outputs,
    ...(rights.length ? { boundaryNote: { title: "Boundary Note", items: rights.map((r) => r.text) } } : {}),
  };
}

module.exports = { pageFor, ROWS };
