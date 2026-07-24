import Link from "next/link";
import Layout from "../components/Layout";

export default function Strata() {
  return (
    <Layout title="Strata" crumb={<><Link href="/">davidfacer.com</Link> / aimaturitymodels.com / Strata</>}>
      <h1>Strata</h1>
      <p className="dek">
        Why does market intelligence feed both delivery and product
        decisions? Why does feedback velocity close a loop back to where an
        organization started? This is the underlying structure that answers
        those questions &mdash; not something you assess yourself against,
        but the map explaining why the models in this family fit together
        the way they do.
      </p>

      <h2>Eight layers, one direction</h2>
      <p>
        Every capability a maturity model measures sits somewhere in a
        stack that starts with why an organization exists at all, and ends
        with what it learns from actually operating &mdash; feeding back
        to the start. Knowing which layer something belongs to explains a
        lot about how it behaves.
      </p>

      <div className="grid-wrap" style={{ marginTop: 24 }}>
        <table className="wmv" style={{ minWidth: 0 }}>
          <thead>
            <tr><th>Layer</th><th>What it is</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="dim">Intent</td>
              <td>The reason an organization exists at all &mdash; the thing every governed decision ultimately traces back to.</td>
            </tr>
            <tr>
              <td className="dim">Foundation</td>
              <td>The first governed expression of that intent &mdash; principles and constraints that rarely change and shape everything built on top of them.</td>
            </tr>
            <tr>
              <td className="dim">Standards</td>
              <td>The external benchmarks an organization measures itself against &mdash; adopted, not invented. This is where a maturity model like the ones in this family actually lives.</td>
            </tr>
            <tr>
              <td className="dim">Shared language</td>
              <td>The precise, common vocabulary that makes a standard checkable and keeps everything downstream consistent.</td>
            </tr>
            <tr>
              <td className="dim">Record</td>
              <td>The single place decisions and designs actually live &mdash; a location, not authority by itself. Being on the record doesn&rsquo;t automatically mean it&rsquo;s in force.</td>
            </tr>
            <tr>
              <td className="dim">Authority</td>
              <td>The formal machinery that turns a recorded decision into something actually sanctioned &mdash; issuance is the act that matters here, not just being written down.</td>
            </tr>
            <tr>
              <td className="dim">Operations</td>
              <td>The live systems and people actually doing the work, day to day.</td>
            </tr>
            <tr>
              <td className="dim">Observation</td>
              <td>The feedback layer &mdash; what operating the system actually teaches, returned back to sharpen intent over time. This is where the loop closes.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Why the models in this family connect</h2>
      <p>
        Market intelligence, buyer understanding, and competitive
        positioning aren&rsquo;t separate concerns invented independently
        by engineering and product teams &mdash; they&rsquo;re one shared
        layer sitting at the standards level, feeding into both delivery
        (the SDLC model) and product decisions (the PDLC model) because
        that&rsquo;s structurally where they belong. Feedback loop velocity
        shows up in more than one model for the same reason: every model
        in this family eventually has to answer how fast what it learns
        makes it back to the top of the stack.
      </p>
      <p>
        That&rsquo;s the actual test underneath all of this: can one real
        change in understanding propagate through the whole system &mdash;
        record, authority, operation, observation &mdash; and come back
        around to sharpen the original intent, without getting lost,
        duplicated, or quietly contradicted somewhere along the way?
      </p>
    </Layout>
  );
}
