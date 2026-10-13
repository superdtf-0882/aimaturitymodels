import { marked } from "marked";
import Layout from "../components/Layout";
const { EA } = require("../lib/scored");

// The practice, scored -- OKF-TOGAF#124. The content lives in lib/scored.js;
// this page only lays it out. Stored text becomes HTML with marked, as the
// site's other content pages do. DRAFT for the owner's approval of its words
// (287-CC); publishing is the owner's word.
const MARK_TEXT = {
  measured: "measured",
  "from outside": "from outside",
  "in our own words": "in our own words",
};

export async function getStaticProps() {
  return { props: { readoutHtml: marked.parse(EA.readout) } };
}

export default function Scored({ readoutHtml }) {
  return (
    <Layout
      title="This practice, scored"
      crumb={<><a href="https://davidfacer.com">davidfacer.com</a> / aimaturitymodels.com / This practice, scored</>}
    >
      <h1>This practice, scored</h1>
      <p className="dek">
        We score ourselves with the same model and assessment we offer you. On {EA.scoredOn} this practice was
        scored against the <a href={EA.modelHref}>AI-Native EA Maturity Model</a>, version {EA.modelVersion}.
      </p>

      <h2>How it was scored</h2>
      <p>
        Three runs scored the practice independently, and none saw another before it finished. Where they differed,
        the difference was traced and settled by the scoring rules and the owner's rulings, and the owner accepted the
        result as the record. Each dimension is read on its own: the scores are never averaged.
      </p>
      <p>
        Each score has one sentence of evidence, and a mark for what that evidence is: <strong>measured</strong>, a
        tool's output or a check anyone can rerun; <strong>from outside</strong>, evidence from someone outside the
        practice; <strong>in our own words</strong>, our own record, which is weaker proof. Our records are private,
        so the sentences summarise them, and link to public proof where it exists.
      </p>

      <h2>The scores</h2>
      <ol className="scored-list">
        {EA.dimensions.map((d) => (
          <li key={d.id} className="scored-item">
            <div className="scored-head">
              <span className="scored-id">{d.id}</span>
              <span className="scored-name">{d.name}</span>
              <span className="scored-grade" aria-label={`Level ${d.score}`}>{d.score}</span>
            </div>
            <p className="scored-evidence">{d.evidence}</p>
            <p className="scored-meta">
              {d.warrant.map((w) => (
                <span key={w} className="scored-mark">{MARK_TEXT[w]}</span>
              ))}
              {d.proof && (
                <a className="scored-proof" href={d.proof.href}>{d.proof.label}</a>
              )}
            </p>
          </li>
        ))}
      </ol>

      <h2>The Executive Readout</h2>
      <p>
        This is the readout this site's EA assessment gives any visitor who enters these ten scores. It reads the
        scores alone, so it pictures an enterprise; we publish it as it was written.{" "}
        <a href={EA.assessmentHref}>Open the assessment with these scores</a>.
      </p>
      <div className="dd-body scored-readout" dangerouslySetInnerHTML={{ __html: readoutHtml }} />

      <style jsx>{`
        .scored-list { list-style: none; padding: 0; margin: 0 0 32px; }
        .scored-item { border-bottom: 1px solid var(--line); padding: 14px 0; }
        .scored-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .scored-id { font-family: var(--mono); color: var(--ink-soft); min-width: 2.6em; }
        .scored-name { font-weight: 600; flex: 1 1 auto; }
        .scored-grade { font-family: var(--mono); font-weight: 700; font-size: 18px; color: var(--blue); }
        .scored-evidence { margin: 6px 0 6px 0; max-width: 70ch; }
        .scored-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 0; font-size: 13px; }
        .scored-mark { border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; color: var(--ink-soft); }
        .scored-proof { color: var(--blue); }
        .scored-readout { border-top: 1px solid var(--line); padding-top: 8px; }
      `}</style>
    </Layout>
  );
}
