import { useMemo, useState } from "react";
import Layout from "../components/Layout";
const {
  VERSION, DOMAIN_WORK, FAMILIES, TESTS, EXAMPLES, SORTING, ROWS,
  familyName, decideFor, dimensionHref,
} = require("../lib/taxonomy");

// The AI Architecture Taxonomy -- OKF-TOGAF#189, rebuilt 19 October 2026
// around the owner's table: four arrangements, each with the next question to
// ask, two examples, and the dimension that measures the answer, as a link to
// that assessment at that dimension. What each arrangement asks you to decide
// sits one click under its row; the hard cases under a disclosure; the worked
// examples below. The content lives in lib/taxonomy.js (scripts/taxonomy-self-test.js).

// The examples' card text is light Markdown: **[AI]** and **[waits: who]**
// marks, *italic* source sections, **bold**, and bare links.
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function inlineHtml(s) {
  return esc(s)
    .replace(/\*\*\[AI\]\*\*/g, '<span class="tx-tag tx-ai">AI</span>')
    .replace(/\*\*\[waits: ([^\]]+)\]\*\*/g, '<span class="tx-tag tx-wait">waits: $1</span>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/(https:\/\/[^\s<]+[^\s<.,;)])/g, '<a href="$1" rel="noopener">$1</a>');
}
const Inline = ({ text }) => <span dangerouslySetInnerHTML={{ __html: inlineHtml(text) }} />;

function Decide({ k }) {
  const d = decideFor(k);
  if (!d) return null;
  return (
    <dl className="tx-decide">
      <dt>Decide</dt><dd>{d.decision}</dd>
      <dt>Evidence</dt><dd>{d.evidence}</dd>
    </dl>
  );
}

export default function Taxonomy() {
  const [filter, setFilter] = useState("all");
  const byFamily = useMemo(() => {
    const n = {};
    EXAMPLES.forEach((e) => { n[e.family] = (n[e.family] || 0) + 1; });
    return n;
  }, []);
  const shown = filter === "all" ? EXAMPLES : EXAMPLES.filter((e) => e.family === filter);
  const exampleTitle = (id) => (EXAMPLES.find((e) => e.id === id) || {}).title || id;
  // Following a row's dimension link is counted: one anonymous count to the
  // site's own store, with its row and nothing else. No cookie, nothing kept in
  // the browser, and a failed count never stands in the link's way.
  function countRow(row) {
    try {
      fetch("/api/count/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "taxonomy-row-followed", row: row }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* counting never blocks the link */ }
  }

  return (
    <Layout
      title="AI Architecture Taxonomy"
      crumb={<><a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com / AI Architecture Taxonomy</>}
    >
      <h1>AI Architecture Taxonomy</h1>
      <p className="dek">
        Find the row that describes your system. Its question is the one to ask next, and the dimension beside it
        is where the answer is measured.
      </p>

      <div className="tx-table-wrap">
        <table className="tx-table">
          <thead>
            <tr>
              <th scope="col">Arrangement</th>
              <th scope="col">The next question to ask</th>
              <th scope="col">For example</th>
              <th scope="col">Where the answer is measured</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.name}</th>
                <td>
                  <div className="tx-q">{r.question}</div>
                  {r.note && <p className="tx-row-note">{r.note}</p>}
                  <details className="tx-answer">
                    <summary>How you would answer it</summary>
                    <Decide k={r.key} />
                  </details>
                </td>
                <td>{r.examples.map((id) => <div key={id} className="tx-ex-name">{exampleTitle(id)}</div>)}</td>
                <td>
                  {r.dims.map((d) => (
                    <div key={d.dim}>
                      <a href={dimensionHref(d.model, d.dim)} onClick={() => countRow(r.key)}>{d.label}</a>
                      {d.when ? " " + d.when : ""}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="tx-under"><strong>Finding your row.</strong> {SORTING}</p>
      <p className="tx-under tx-muted">{DOMAIN_WORK}</p>
      <p className="tx-under"><strong>Composite.</strong> Different parts answer differently — one row per part.</p>
      <p className="tx-under"><strong>None of these.</strong> Say in a sentence why; that sentence is a finding, not a mistake.</p>
      <p className="tx-under">Each question leads to the assessment that measures your answer: follow the dimension beside it.</p>

      <details className="tx-tests">
        <summary>When a case is hard</summary>
        {TESTS.map((t, i) => (
          <div key={t.title} className="tx-test">
            <div className="tx-test-title">{i + 1}. {t.title}</div>
            <p>{t.text}</p>
          </div>
        ))}
      </details>
      <p className="tx-version">{VERSION}</p>

      <h2>Worked examples</h2>
      <p>
        Twenty-nine real systems, each described on a card from its published sources. The family on each is the
        one the taxonomy's author gave it. These have not yet been checked by anyone else, so read them as worked
        examples, not as rulings.
      </p>
      <div className="tx-filter" role="group" aria-label="Show examples by family">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All ({EXAMPLES.length})</button>
        {FAMILIES.filter((f) => byFamily[f.key]).map((f) => (
          <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.name} ({byFamily[f.key]})
          </button>
        ))}
      </div>
      <div className="tx-examples">
        {shown.map((e) => (
          <details key={e.id} className="tx-example">
            <summary>
              <span className="tx-ex-id">{e.id}</span>
              <span className="tx-ex-title">{e.title}</span>
              <span className="tx-ex-family">{familyName(e.family)}</span>
            </summary>
            <p className="tx-ex-source"><Inline text={e.source} /></p>
            {e.flows.map((fl, fi) => (
              <div key={fi}>
                {fl.heading && <div className="tx-label"><Inline text={fl.heading} /></div>}
                <ol className="tx-ex-flow">
                  {fl.steps.map((s, si) => (
                    <li key={si}>
                      <Inline text={s.text} />
                      {s.sub && s.sub.length > 0 && (
                        <ul>{s.sub.map((u, ui) => <li key={ui}><Inline text={u} /></li>)}</ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <dl className="tx-ex-facts">
              {e.facts.map((f) => (
                <div key={f.line} className="tx-ex-fact">
                  <dt>{f.line}</dt>
                  <dd><Inline text={f.text} /></dd>
                </div>
              ))}
            </dl>
            <p className="tx-ex-verdict">
              <strong>Family, as its author gave it:</strong> {familyName(e.family)}.
              {e.also && <> A borderline case: it could also be read as {e.also.map(familyName).join(" or ")}.</>}
              {e.note && <> {e.note}</>}
            </p>
          </details>
        ))}
      </div>

      <p className="footnote">{VERSION}. The taxonomy describes arrangements; the maturity models assess the practices that build and run them. It authorises nothing.</p>

      <style jsx>{`
        .tx-table-wrap { overflow-x: auto; margin: 18px 0; }
        .tx-table { width: 100%; border-collapse: collapse; font-size: 14.5px; min-width: 640px; }
        .tx-table th, .tx-table td { text-align: left; vertical-align: top; padding: 10px 12px; border-top: 1px solid var(--line); }
        .tx-table thead th { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); border-top: 0; }
        .tx-table tbody th { font-weight: 600; width: 22%; }
        .tx-q { font-family: var(--serif); font-size: 16px; }
        .tx-row-note { font-size: 13px; color: var(--muted); margin: 6px 0 0; }
        .tx-answer { margin-top: 8px; font-size: 14px; }
        .tx-answer summary { cursor: pointer; color: var(--ink-soft); }
        .tx-ex-name { font-size: 14px; }
        .tx-under { margin: 8px 0; }
        .tx-muted { color: var(--muted); font-size: 14px; }
        .tx-version { font-size: 12px; color: var(--muted); margin: 6px 0 22px; }
        .tx-question { font-family: var(--serif); font-size: 21px; margin: 6px 0 10px; color: var(--ink); }
        .tx-families { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin: 18px 0; }
        .tx-family { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; background: var(--paper-raised); min-width: 0; }
        .tx-family-name { font-weight: 600; }
        .tx-family-answer { font-size: 14px; color: var(--ink-soft); margin-top: 4px; }
        .tx-family-means { font-size: 13px; color: var(--muted); margin-top: 6px; }
        .tx-tests, .tx-facts { border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; margin: 14px 0; }
        .tx-tests summary, .tx-facts summary { cursor: pointer; font-weight: 600; }
        .tx-test { margin-top: 10px; }
        .tx-test-title { font-weight: 600; }
        .tx-test p { margin: 4px 0 0; font-size: 14px; color: var(--ink-soft); }
        .tx-card { border: 1px solid var(--line); border-radius: 10px; padding: 16px; background: var(--paper-raised); display: grid; gap: 12px; min-width: 0; }
        .tx-field { display: grid; gap: 4px; min-width: 0; }
        .tx-field span, .tx-label { font-size: 13px; color: var(--ink-soft); font-weight: 600; }
        .tx-card input[type="text"], .tx-card select {
          width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px;
          background: var(--paper); color: var(--ink); font: inherit; min-width: 0;
        }
        .tx-steps { margin: 0; padding-left: 22px; display: grid; gap: 10px; }
        .tx-step-marks { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; margin-top: 6px; font-size: 13px; color: var(--ink-soft); }
        .tx-step-marks .tx-waits { flex: 1 1 180px; width: auto; }
        .tx-btn, .tx-answers button, .tx-filter button {
          font: inherit; font-size: 14px; padding: 7px 12px; border: 1px solid var(--line); border-radius: 6px;
          background: var(--paper); color: var(--ink); cursor: pointer; text-align: left;
        }
        .tx-btn { justify-self: start; }
        .tx-link { font: inherit; font-size: 13px; background: none; border: none; color: var(--blue); cursor: pointer; padding: 0; }
        .tx-ask { font-family: var(--serif); font-size: 17px; color: var(--ink); font-weight: 400; margin-top: 6px; }
        .tx-answers { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
        .tx-answers button[aria-pressed="true"], .tx-filter button[aria-pressed="true"] { border-color: var(--blue); background: var(--blue-soft); }
        .tx-parts { display: grid; gap: 8px; }
        .tx-part { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
        .tx-result { border: 1px solid var(--blue); border-radius: 10px; padding: 16px; margin: 18px 0; }
        .tx-result-head { font-size: 13px; color: var(--muted); }
        .tx-result-family { font-family: var(--serif); font-size: 24px; margin: 2px 0 8px; }
        .tx-result-partname { font-weight: 600; margin-top: 10px; }
        .tx-decide { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 12px; margin: 8px 0; font-size: 14px; }
        .tx-decide dt { color: var(--muted); }
        .tx-decide dd { margin: 0; }
        .tx-keep { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 4px; }
        .tx-next { font-family: var(--serif); font-size: 18px; margin: 18px 0 8px; font-weight: 400; }
        .tx-filter { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
        .tx-filter button { font-size: 13px; padding: 4px 10px; border-radius: 999px; }
        .tx-examples { display: grid; gap: 6px; margin-bottom: 28px; }
        .tx-example { border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; min-width: 0; }
        .tx-example summary { cursor: pointer; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
        .tx-ex-id { font-family: var(--mono); font-size: 12px; color: var(--muted); }
        .tx-ex-title { font-weight: 600; flex: 1 1 200px; }
        .tx-ex-family { font-size: 13px; color: var(--ink-soft); }
        .tx-ex-source { font-size: 13px; color: var(--muted); overflow-wrap: anywhere; margin: 10px 0; }
        .tx-ex-flow { padding-left: 22px; margin: 6px 0; font-size: 14px; }
        .tx-ex-flow li { margin: 4px 0; }
        .tx-ex-facts { margin: 10px 0; font-size: 13.5px; display: grid; gap: 4px; }
        .tx-ex-fact { display: grid; grid-template-columns: minmax(140px, 220px) minmax(0, 1fr); gap: 10px; }
        .tx-ex-fact dt { color: var(--muted); }
        .tx-ex-fact dd { margin: 0; min-width: 0; }
        .tx-ex-verdict { font-size: 14px; border-top: 1px solid var(--line); padding-top: 8px; }
        @media (max-width: 560px) {
          .tx-part, .tx-ex-fact { grid-template-columns: minmax(0, 1fr); gap: 2px; }
        }
      `}</style>
      <style jsx global>{`
        .tx-tag { display: inline-block; font-size: 11px; font-weight: 600; padding: 0 6px; border-radius: 4px; margin-right: 4px; }
        .tx-ai { color: #c2a6ee; background: #2a2238; }
        .tx-wait { color: #e2b45a; background: #3a2d12; }
      `}</style>
    </Layout>
  );
}
