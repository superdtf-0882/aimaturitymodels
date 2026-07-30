// DS-014: reusable renderer for the Function Model pattern (Inputs ->
// Function -> Outputs). Every Function Model supplies content in the
// shape authored in lib/functionModels/*.js; this component has no
// per-model knowledge, so adding the next Function Model to the family
// means writing a content file, not a new page layout.
//
// Extended for the Product Marketing intake (issue #33), tracked for
// later evaluation on whether it needs its own architecture record:
// - inputs.items carry an optional description (Product Marketing has
//   one per input; Product Management's inputs don't -- both work).
// - `substrates` (named category + bullet items) replaces the old
//   `tools`/`contextStrip` split -- those were always the same concept
//   (what the function runs on) rendered two different ways. Product
//   Management's own Tools/Governance/Resources/Standards content
//   migrated into this one shape rather than keeping two.
// - `boundaryNote` (optional): a short "who owns what" callout.
// - `functionStatement` (optional): a one-line governing statement
//   inside the function box.

import { useEffect, useState } from "react";

const OUTPUT_ACCENTS = {
  eng: "var(--blue)",
  gtm: "var(--fn-gtm)",
  ops: "var(--orange)",
  leadership: "var(--fn-leadership)",
  "customer-success": "var(--fn-customer-success)",
  "demand-gen": "var(--fn-demand-gen)",
  "product-mgmt": "var(--blue)",
  "sales-partners": "var(--fn-gtm)",
  "security-compliance": "var(--fn-security-compliance)",
  "data-platform": "var(--fn-eng-delivery)",
};

// Issue #30: an optional per-model "explainer" -- longer prose than a
// hover popover comfortably holds, so it's a link-triggered modal
// instead, matching this site's existing modal mechanism (the
// Executive Readout's progress modal) rather than inventing a new
// overlay pattern. Its own card styling (.fn-explainer-*) is distinct
// from .assess-modal since that one is sized for a short centered
// status message, not readable prose with lists.
function ExplainerModal({ explainer, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fn-explainer-backdrop" onClick={onClose}>
      <div className="fn-explainer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fn-explainer-header">
          <p className="fn-explainer-title">{explainer.title}</p>
          <button type="button" className="fn-explainer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {explainer.blocks.map((block, i) =>
          block.type === "list" ? (
            <ul className="fn-explainer-list" key={i}>
              {block.items.map((item) => (
                <li key={item.term}>
                  <strong>{item.term}:</strong> {item.text}
                </li>
              ))}
            </ul>
          ) : (
            <p key={i}>{block.text}</p>
          )
        )}
      </div>
    </div>
  );
}

export default function FunctionModel({ data }) {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <>
      <h1>{data.title}</h1>
      {data.dek.map((line, i) => (
        <p className="dek" key={i}>{line}</p>
      ))}
      {data.explainer && (
        <button type="button" className="fn-explainer-link" onClick={() => setExplainerOpen(true)}>
          {data.explainer.linkLabel}
        </button>
      )}
      {explainerOpen && data.explainer && (
        <ExplainerModal explainer={data.explainer} onClose={() => setExplainerOpen(false)} />
      )}

      <section className="fn-section">
        <p className="fn-section-label">Inputs</p>
        <div className="fn-chip-grid">
          {data.inputs.items.map((item) => (
            <div className="fn-chip" key={item.title}>
              <div className="fn-chip-title">{item.title}</div>
              {item.description && <p className="fn-note">{item.description}</p>}
            </div>
          ))}
          {data.inputs.group && (
            <div className="fn-group">
              <p className="fn-group-title">{data.inputs.group.title}</p>
              <ul>
                {data.inputs.group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <div className="fn-arrow">↓</div>

      <section className="fn-section fn-function-box">
        <p className="fn-function-label">{data.functionLabel}</p>
        {data.functionStatement && <p className="fn-function-statement">{data.functionStatement}</p>}

        <p className="fn-caption">{data.activities.caption}</p>
        <div className="fn-chip-grid">
          {data.activities.items.map((item) => {
            const isRich = typeof item === "object";
            const title = isRich ? item.title : item;
            return (
              <div className="fn-chip" key={title}>
                <div className="fn-chip-title">{title}</div>
                {isRich && item.description && <p className="fn-note">{item.description}</p>}
              </div>
            );
          })}
        </div>

        <hr className="fn-inner-divider" />

        <p className="fn-caption">{data.capabilities.caption}</p>
        {data.capabilities.groups && data.capabilities.groups.length > 0 && (
          <div className="fn-cap-groups">
            {data.capabilities.groups.map((group) => (
              <div className="fn-group" key={group.title}>
                <p className="fn-group-title">{group.title}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {group.note && <p className="fn-note">{group.note}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="fn-cap-singles">
          {data.capabilities.singles.map((single) => (
            <div className="fn-chip" key={single.title}>
              {single.title}
              {single.note && <p className="fn-note">{single.note}</p>}
            </div>
          ))}
        </div>
        {data.capabilities.pair && data.capabilities.pair.length > 0 && (
          <div className="fn-cap-pair">
            {data.capabilities.pair.map((item) => (
              <div className="fn-chip" key={item}>{item}</div>
            ))}
          </div>
        )}

        <hr className="fn-inner-divider" />

        <p className="fn-caption">Enabling substrates</p>
        <div className="fn-substrates-grid">
          {data.substrates.map((substrate) => (
            <div className="fn-group" key={substrate.title}>
              <p className="fn-group-title">{substrate.title}</p>
              <ul>
                {substrate.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {substrate.note && <p className="fn-note">{substrate.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <div className="fn-arrow">↓</div>

      <section className="fn-section">
        <p className="fn-section-label">Outputs</p>
        <div className="fn-outputs-grid">
          {data.outputs.map((bucket) => (
            <div
              className="fn-output-bucket"
              key={bucket.key}
              style={{ "--bucket-accent": OUTPUT_ACCENTS[bucket.key] || "var(--line)" }}
            >
              <p className="fn-output-title">{bucket.title}</p>
              {bucket.caption && <p className="fn-output-caption">{bucket.caption}</p>}
              <ul className="fn-output-items">
                {bucket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {data.boundaryNote && (
        <section className="fn-section fn-boundary-note">
          <p className="fn-section-label">{data.boundaryNote.title}</p>
          <ul>
            {data.boundaryNote.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
