import { useRef, useState } from "react";
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
const BASE_ANGLES = NODES.map((_, i) => -90 + i * (360 / NODES.length));

// Below this many degrees of pointer movement, a drag counts as a plain
// click instead -- so tapping a node still navigates, and only an actual
// drag spins the wheel and suppresses the click.
const DRAG_THRESHOLD_DEG = 2;

export default function Hub() {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const circleRef = useRef(null);
  const dragState = useRef({ active: false, startAngle: 0, startRotation: 0, moved: false });

  function angleFromEvent(e) {
    const rect = circleRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  }

  function handlePointerDown(e) {
    dragState.current.active = true;
    dragState.current.moved = false;
    dragState.current.startAngle = angleFromEvent(e);
    dragState.current.startRotation = rotation;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragState.current.active) return;
    let delta = angleFromEvent(e) - dragState.current.startAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    if (Math.abs(delta) > DRAG_THRESHOLD_DEG) dragState.current.moved = true;
    setRotation(dragState.current.startRotation + delta);
  }

  function endDrag() {
    dragState.current.active = false;
    setIsDragging(false);
  }

  function handleNodeClick(e) {
    if (dragState.current.moved) e.preventDefault();
  }

  const points = BASE_ANGLES.map((base) => {
    const angle = ((base + rotation) * Math.PI) / 180;
    return { x: 50 + R * Math.cos(angle), y: 50 + R * Math.sin(angle) };
  });
  const ringPath =
    points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";

  return (
    <Layout title="Home">
      <h1>AI-Native Maturity Models</h1>
      <p className="dek hub-intro">
        Five ways in — it doesn&rsquo;t matter which one a visitor
        starts from. Each leads somewhere different; together they&rsquo;re
        one system. Click and drag the wheel to spin it.
      </p>

      <div
        className={`hub-circle${isDragging ? " dragging" : ""}`}
        ref={circleRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg className="hub-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={ringPath} fill="none" stroke="var(--line)" strokeWidth="0.4" strokeDasharray="1.6 2" />
        </svg>
        {NODES.map((node, i) => (
          <Link
            key={node.href}
            href={node.href}
            className="hub-node"
            onClick={handleNodeClick}
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
