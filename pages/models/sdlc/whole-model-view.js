import Link from "next/link";
import Layout from "../../../components/Layout";
import { getSdlcShortForm, SDLC_DIMENSION_ORDER } from "../../../lib/models";

export async function getStaticProps() {
  const data = await getSdlcShortForm();
  return { props: { data } };
}

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
              {levels.map((l) => <th key={l}>{l}</th>)}
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
        <span><span className="swatch" style={{ background: "var(--lvl-a-fill)", borderColor: "var(--lvl-a-border)" }} /> A &mdash; Ad hoc</span>
        <span><span className="swatch" style={{ background: "var(--lvl-b-fill)", borderColor: "var(--lvl-b-border)" }} /> B &mdash; Documented</span>
        <span><span className="swatch" style={{ background: "var(--lvl-c-fill)", borderColor: "var(--lvl-c-border)" }} /> C &mdash; Governed</span>
        <span><span className="swatch" style={{ background: "var(--lvl-d-fill)", borderColor: "var(--lvl-d-border)" }} /> D &mdash; Comprehensive</span>
        <span><span className="swatch" style={{ background: "var(--lvl-e-fill)", borderColor: "var(--lvl-e-border)" }} /> E &mdash; Self-evolving</span>
        <span>⚠ = open review item</span>
      </div>
    </Layout>
  );
}
