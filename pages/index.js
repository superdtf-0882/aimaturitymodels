import Link from "next/link";
import Layout from "../components/Layout";

// Circular hub (issue #9): five entry points arranged so no one of them
// reads as the "start" -- order follows the sequence as specified, placed
// clockwise from the top.
const NODES = [
  {
    href: "/models",
    kicker: "The family",
    title: "AI-Native Maturity Models",
    desc: "SDLC, PDLC, Prioritization — and what's coming.",
  },
  {
    href: "/assessments",
    kicker: "Assess yourself",
    title: "Maturity Model Assessments",
    desc: "Score yourself against each model in the family.",
  },
  {
    href: "/eaokf",
    kicker: "The foundation",
    title: "Enterprise Architecture OKF",
    desc: "The schema this family is written in.",
  },
  {
    href: "/strata",
    kicker: "Why it connects",
    title: "Strata",
    desc: "Why these models fit together at all.",
  },
  {
    href: "/vellum",
    kicker: "The tooling",
    title: "Vellum & Seminum",
    desc: "Making a corpus visible, and portable.",
  },
];

const R = 30; // percent radius -- kept well under 50 minus the node's own
// half-width-as-percent-of-container, so a card can never push past the
// circle's own box (and, in turn, never widen the page) at any container
// size down to the 640px breakpoint where this layout takes over.
const points = NODES.map((_, i) => {
  const angle = ((-90 + i * (360 / NODES.length)) * Math.PI) / 180;
  return {
    x: 50 + R * Math.cos(angle),
    y: 50 + R * Math.sin(angle),
  };
});
const ringPath =
  points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";

export default function Hub() {
  return (
    <Layout title="Home">
      <h1>AI-Native Maturity Models</h1>
      <p className="dek hub-intro">
        Five ways in — it doesn&rsquo;t matter which one a visitor
        starts from. Each leads somewhere different; together they&rsquo;re
        one system.
      </p>

      <div className="hub-circle">
        <svg className="hub-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={ringPath} fill="none" stroke="var(--line)" strokeWidth="0.4" strokeDasharray="1.6 2" />
        </svg>
        {NODES.map((node, i) => (
          <Link
            key={node.href}
            href={node.href}
            className="hub-node"
            style={{ left: `${points[i].x}%`, top: `${points[i].y}%` }}
          >
            <div className="hub-kicker">{node.kicker}</div>
            <div className="hub-title">{node.title}</div>
            <div className="hub-desc">{node.desc}</div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
