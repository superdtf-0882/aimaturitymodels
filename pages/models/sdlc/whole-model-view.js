import Link from "next/link";
import Layout from "../../../components/Layout";
import { getSdlcShortForm, SDLC_DIMENSION_ORDER } from "../../../lib/models";

export async function getStaticProps() {
  const data = await getSdlcShortForm();
  return { props: { data } };
}

// Family-wide axis vocabulary, locked 2026-07-24 (briefs/2026-07-24-
// level-vocabulary/ in the private governance corpus) -- applied here
// as column headers and the legend below.
const LEVEL_NAMES = {
  A: "Nascent",
  B: "Modeled",
  C: "Continuous",
  D: "Integral",
  E: "Telemetric",
};

export default function WholeModelView({ data }) {
  const levels = ["A", "B", "C", "D", "E"];
  return (
    <Layout title="SDLC — Whole-Model View" crumb={
      <>
        <Link href="/">davidfacer.com</Link> / aimaturitymodels.com /{" "}
        <Link href="/models">AI-Native Maturity Models</Link> /{" "}
        <Link href="/models/sdlc/whole-model-view">AI-Native SDLC</Link> / Whole-Model View
      </>
    }>
      <h1>AI-Native SDLC &mdash; Whole-Model View</h1>
      <p className="dek">
        Thirteen dimensions, five maturity levels each. Built to be scanned,
        not read start to finish &mdash; click any cell for its full
        Deep-Dive.
      </p>
      <div className="grid-wrap">
        <table className="wmv">
          <thead>
            <tr>
              <th>Dimension</th>
              {levels.map((l) => (
                <th key={l}>
                  {l} <span className="level-name">&middot; {LEVEL_NAMES[l]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SDLC_DIMENSION_ORDER.map((id) => {
              const dim = data.dimensions[id];
              return (
                <tr key={id}>
                  <td className="dim">
                    <Link href={`/models/sdlc/deep-dive/${id.toLowerCase()}`}>{id}</Link>
                    {dim.title}
                    {dim.flag && <div className="flag-tag">⚠ {dim.flag}</div>}
                  </td>
                  {levels.map((l) => (
                    <td className="cell" key={l}>
                      <Link href={`/models/sdlc/deep-dive/${id.toLowerCase()}`} className="cell-link">
                        <div
                          className="cell-inner"
                          style={{
                            "--cell-fill": `var(--lvl-${l.toLowerCase()}-fill)`,
                            "--cell-border": `var(--lvl-${l.toLowerCase()}-border)`,
                          }}
                        >
                          {dim.levels[l]}
                        </div>
                      </Link>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span><span className="swatch" style={{ background: "var(--lvl-a-fill)", borderColor: "var(--lvl-a-border)" }} /> A &mdash; Nascent</span>
        <span><span className="swatch" style={{ background: "var(--lvl-b-fill)", borderColor: "var(--lvl-b-border)" }} /> B &mdash; Modeled</span>
        <span><span className="swatch" style={{ background: "var(--lvl-c-fill)", borderColor: "var(--lvl-c-border)" }} /> C &mdash; Continuous</span>
        <span><span className="swatch" style={{ background: "var(--lvl-d-fill)", borderColor: "var(--lvl-d-border)" }} /> D &mdash; Integral</span>
        <span><span className="swatch" style={{ background: "var(--lvl-e-fill)", borderColor: "var(--lvl-e-border)" }} /> E &mdash; Telemetric</span>
        <span>⚠ = open review item</span>
      </div>
    </Layout>
  );
}
