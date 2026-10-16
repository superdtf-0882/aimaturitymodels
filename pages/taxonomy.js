import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
const {
  VERSION, QUESTION, DOMAIN_WORK, FAMILIES, ANSWERS, GUIDANCE, TESTS, FACT_LINES, EXAMPLES, MODELS,
  assessmentHref, familyName, decideFor, intakeComplete, cardMarkdown,
} = require("../lib/taxonomy");

// The AI Architecture Taxonomy -- OKF-TOGAF#189. The page is the taxonomy's
// intake: describe one system on a card, answer the one question, read what
// the answer asks you to decide, keep the card, and go on to an assessment by
// a link marked ?from=taxonomy. The worked examples below it carry the
// families their author gave them. The content lives in lib/taxonomy.js; this
// page lays it out (scripts/taxonomy-self-test.js).

const BLANK_STEP = () => ({ text: "", ai: false, waits: "" });
const BLANK = () => ({
  name: "", purpose: "", steps: [BLANK_STEP(), BLANK_STEP(), BLANK_STEP()],
  facts: {}, answer: "", reason: "", parts: [{ name: "", family: "" }, { name: "", family: "" }],
});

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
  const [card, setCard] = useState(BLANK);
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const set = (patch) => setCard((c) => ({ ...c, ...patch }));
  const complete = intakeComplete(card);

  // A completed intake is counted once per visit: one anonymous count to the
  // site's own store, with nothing but its event. No cookie, nothing kept in
  // the browser, and a failed count changes nothing.
  const counted = useRef(false);
  useEffect(() => {
    if (!complete || counted.current) return;
    counted.current = true;
    try {
      fetch("/api/count/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "taxonomy-intake-completed" }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* counting never blocks the intake */ }
  }, [complete]);

  const md = useMemo(() => cardMarkdown(card), [card]);
  const byFamily = useMemo(() => {
    const n = {};
    EXAMPLES.forEach((e) => { n[e.family] = (n[e.family] || 0) + 1; });
    return n;
  }, []);
  const shown = filter === "all" ? EXAMPLES : EXAMPLES.filter((e) => e.family === filter);

  function setStep(i, patch) {
    set({ steps: card.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  }
  function setPart(i, patch) {
    set({ parts: card.parts.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  }
  function copyCard() {
    try {
      navigator.clipboard.writeText(md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, () => {});
    } catch (e) { /* the download still works */ }
  }
  function downloadCard() {
    const name = (card.name.trim() || "system").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "system";
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([md], { type: "text/markdown" })),
      download: name + "-architecture-card.md",
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <Layout
      title="AI Architecture Taxonomy"
      crumb={<><a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com / AI Architecture Taxonomy</>}
    >
      <h1>AI Architecture Taxonomy</h1>
      <p className="dek">
        Before you assess how capable your practices are, name the kind of system they build and run. One question
        decides it.
      </p>
      <p className="tx-question">{QUESTION}</p>
      <p>{DOMAIN_WORK}</p>

      <div className="tx-families">
        {FAMILIES.map((f) => (
          <div key={f.key} className="tx-family">
            <div className="tx-family-name">{f.name}</div>
            <div className="tx-family-answer">{f.answer}</div>
            <div className="tx-family-means">{f.means}</div>
          </div>
        ))}
      </div>

      <details className="tx-tests">
        <summary>Four tests for the hard cases</summary>
        {TESTS.map((t, i) => (
          <div key={t.title} className="tx-test">
            <div className="tx-test-title">{i + 1}. {t.title}</div>
            <p>{t.text}</p>
          </div>
        ))}
      </details>

      <h2>Name your system</h2>
      <p>
        Describe one system on a card, the way the worked examples below are described. A card is one system: a
        product with an advisor and a separate part that changes accounts is two parts of a composite. Nothing you
        type leaves this page; keep the card when you're done.
      </p>

      <div className="tx-card">
        <label className="tx-field">
          <span>System name</span>
          <input type="text" value={card.name} onChange={(e) => set({ name: e.target.value })} placeholder="Claims triage" />
        </label>
        <label className="tx-field">
          <span>What it's for</span>
          <input type="text" value={card.purpose} onChange={(e) => set({ purpose: e.target.value })} placeholder="Routes incoming insurance claims to the right adjuster" />
        </label>

        <div className="tx-label">How it runs, step by step</div>
        <ol className="tx-steps">
          {card.steps.map((s, i) => (
            <li key={i} className="tx-step">
              <input type="text" aria-label={`Step ${i + 1}`} value={s.text} onChange={(e) => setStep(i, { text: e.target.value })} placeholder={i === 0 ? "A claim arrives by email" : ""} />
              <div className="tx-step-marks">
                <label><input type="checkbox" checked={s.ai} onChange={(e) => setStep(i, { ai: e.target.checked, waits: e.target.checked ? "" : s.waits })} /> AI does this</label>
                {!s.ai && (
                  <input type="text" className="tx-waits" aria-label={`Step ${i + 1} waits for`} value={s.waits} onChange={(e) => setStep(i, { waits: e.target.value })} placeholder="waits for… (who)" />
                )}
                {card.steps.length > 1 && (
                  <button type="button" className="tx-link" onClick={() => set({ steps: card.steps.filter((_, j) => j !== i) })}>Remove</button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="tx-btn" onClick={() => set({ steps: [...card.steps, BLANK_STEP()] })}>Add a step</button>

        <details className="tx-facts">
          <summary>The facts, if you know them</summary>
          {FACT_LINES.map((f) => (
            <label key={f.line} className="tx-field">
              <span>{f.line}</span>
              <input type="text" value={card.facts[f.line] || ""} placeholder={f.hint}
                onChange={(e) => set({ facts: { ...card.facts, [f.line]: e.target.value } })} />
            </label>
          ))}
        </details>

        <div className="tx-label tx-ask">{QUESTION}</div>
        <div className="tx-answers" role="group" aria-label="The one question">
          {ANSWERS.map((a) => (
            <button key={a.key} type="button" aria-pressed={card.answer === a.key} onClick={() => set({ answer: card.answer === a.key ? "" : a.key })}>
              {a.name}
            </button>
          ))}
        </div>

        {card.answer === "composite" && (
          <div className="tx-parts">
            <div className="tx-label">Its parts, each classified</div>
            {card.parts.map((p, i) => (
              <div key={i} className="tx-part">
                <input type="text" aria-label={`Part ${i + 1}`} value={p.name} onChange={(e) => setPart(i, { name: e.target.value })} placeholder={`Part ${i + 1}`} />
                <select aria-label={`Part ${i + 1}'s family`} value={p.family} onChange={(e) => setPart(i, { family: e.target.value })}>
                  <option value="">Family…</option>
                  {FAMILIES.filter((f) => f.decide).map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
                </select>
              </div>
            ))}
            <button type="button" className="tx-btn" onClick={() => set({ parts: [...card.parts, { name: "", family: "" }] })}>Add a part</button>
          </div>
        )}

        <label className="tx-field">
          <span>{card.answer === "none-of-these" ? "Why none of these fits, in a sentence" : "Why, in a sentence (optional)"}</span>
          <input type="text" value={card.reason} onChange={(e) => set({ reason: e.target.value })} />
        </label>
      </div>

      {complete && (
        <section className="tx-result" aria-live="polite">
          <div className="tx-result-head">{card.name.trim()}</div>
          <div className="tx-result-family">{familyName(card.answer)}</div>
          {card.answer === "composite" ? (
            <>
              {card.parts.filter((p) => p.name.trim()).map((p, i) => (
                <div key={i} className="tx-result-part">
                  <div className="tx-result-partname">{p.name.trim()}: {familyName(p.family)}</div>
                  <Decide k={p.family} />
                </div>
              ))}
              <p className="tx-result-means">{GUIDANCE.composite}</p>
            </>
          ) : card.answer === "none-of-these" || card.answer === "unknown" ? (
            <p className="tx-result-means">{GUIDANCE[card.answer]}</p>
          ) : (
            <>
              <p className="tx-result-means">{(FAMILIES.find((f) => f.key === card.answer) || {}).means}</p>
              <div className="tx-label">What it asks you to decide</div>
              <Decide k={card.answer} />
            </>
          )}

          <div className="tx-keep">
            <button type="button" className="tx-btn" onClick={copyCard}>{copied ? "Copied" : "Copy the card"}</button>
            <button type="button" className="tx-btn" onClick={downloadCard}>Download it (.md)</button>
          </div>

          <h3 className="tx-next">Now assess the practices that build and run it</h3>
          <div className="model-list">
            {MODELS.map((m) => (
              <a key={m.slug} href={assessmentHref(m.slug)} className="model-row">
                <div>
                  <div className="model-name">{m.name}</div>
                  <div className="model-desc">For {m.for}.</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

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
