// DS-014: reusable renderer for the Function Model pattern (Inputs ->
// Function -> Outputs). Every Function Model supplies content in the
// shape authored in lib/functionModels/*.js; this component has no
// per-model knowledge, so adding the next Function Model to the family
// means writing a content file, not a new page layout.

const OUTPUT_ACCENTS = {
  eng: "var(--blue)",
  gtm: "var(--fn-gtm)",
  ops: "var(--orange)",
  leadership: "var(--fn-leadership)",
};

export default function FunctionModel({ data }) {
  return (
    <>
      <h1>{data.title}</h1>
      {data.dek.map((line, i) => (
        <p className="dek" key={i}>{line}</p>
      ))}

      <section className="fn-section">
        <p className="fn-section-label">Inputs</p>
        <div className="fn-chip-grid">
          {data.inputs.simple.map((item) => (
            <div className="fn-chip" key={item}>{item}</div>
          ))}
          <div className="fn-group">
            <p className="fn-group-title">{data.inputs.group.title}</p>
            <ul>
              {data.inputs.group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="fn-arrow">↓</div>

      <section className="fn-section fn-function-box">
        <p className="fn-function-label">{data.functionLabel}</p>

        <p className="fn-caption">{data.activities.caption}</p>
        <div className="fn-chip-grid">
          {data.activities.items.map((item) => (
            <div className="fn-chip" key={item}>{item}</div>
          ))}
        </div>

        <hr className="fn-inner-divider" />

        <p className="fn-caption">{data.capabilities.caption}</p>
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
        <div className="fn-cap-singles">
          {data.capabilities.singles.map((single) => (
            <div className="fn-chip" key={single.title}>
              {single.title}
              {single.note && <p className="fn-note">{single.note}</p>}
            </div>
          ))}
        </div>
        <div className="fn-cap-pair">
          {data.capabilities.pair.map((item) => (
            <div className="fn-chip" key={item}>{item}</div>
          ))}
        </div>

        <hr className="fn-inner-divider" />

        <p className="fn-caption">Tools</p>
        {data.tools.rows.map((row, i) => (
          <div className="fn-chip-grid" key={i} style={{ marginBottom: 8 }}>
            {row.map((item) => (
              <div className="fn-chip" key={item}>{item}</div>
            ))}
          </div>
        ))}

        <div className="fn-context-strip">
          <div>
            <p className="fn-context-label">Governance</p>
            <p>{data.contextStrip.governance}</p>
          </div>
          <div>
            <p className="fn-context-label">Resources</p>
            <p>{data.contextStrip.resources.text}</p>
            <p className="fn-note">{data.contextStrip.resources.note}</p>
          </div>
          <div>
            <p className="fn-context-label">Standards</p>
            <p>{data.contextStrip.standards}</p>
          </div>
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
              <p className="fn-output-caption">{bucket.caption}</p>
              <ul className="fn-output-items">
                {bucket.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
