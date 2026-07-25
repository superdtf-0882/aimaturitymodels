import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

// Circular hub (issue #9): five entry points arranged so no one of them
// reads as the "start" -- order follows the sequence as specified, placed
// clockwise from the top.
// `primary: true` marks the two nodes that are actually the product
// (the models and their assessments); the other three -- foundation,
// connective theory, internal tooling -- render visually smaller and
// quieter, so the wheel itself doesn't imply parity that the copy on
// those pages explicitly says isn't there.
const NODES = [
  {
    href: "/models",
    kicker: "The family",
    title: "AI-Native Maturity Models",
    desc: "SDLC, PDLC, Prioritization — and what's coming.",
    primary: true,
  },
  {
    href: "/assessments",
    kicker: "Assess yourself",
    title: "Maturity Model Assessments",
    desc: "Score yourself against each model in the family.",
    primary: true,
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

// Rotation tracks total horizontal drag distance directly (degrees per
// pixel), not the true geometric angle from the wheel's center. The
// angle-from-center approach saturates on a small-radius wheel: a normal
// straight-line drag quickly overshoots the circle, and the angle stops
// increasing well before the pointer has traveled far -- capping the
// spin at 10-20 degrees regardless of how far you actually dragged.
// Distance-based rotation has no such ceiling and needs no layout
// measurement at drag time.
const DRAG_SENSITIVITY = 0.6; // degrees of rotation per pixel of horizontal drag
const CLICK_MOVE_THRESHOLD_PX = 5; // below this, a drag counts as a plain click

// Arrival spin: a random flick on first landing, once per browser tab
// session. sessionStorage (not a cookie -- never sent to a server, gone
// when the tab closes) is enough to remember "already spun this visit"
// without needing any consent banner.
const SPIN_SESSION_KEY = "aimm-hub-spun";
const SPIN_DURATION_MS = 500;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function Hub() {
  const router = useRouter();
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startRotation: 0,
    moved: false,
    targetHref: null,
  });

  useEffect(() => {
    if (window.sessionStorage.getItem(SPIN_SESSION_KEY)) return;
    window.sessionStorage.setItem(SPIN_SESSION_KEY, "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const direction = Math.random() < 0.5 ? -1 : 1;
    const target = direction * (240 + Math.random() * 300); // 240-540 degrees
    const start = performance.now();
    let frameId;

    function tick(now) {
      if (dragState.current.active) return; // user grabbed the wheel -- yield to them
      const t = Math.min((now - start) / SPIN_DURATION_MS, 1);
      setRotation(target * easeOutCubic(t));
      if (t < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  function handlePointerDown(e) {
    dragState.current.active = true;
    dragState.current.moved = false;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.startRotation = rotation;
    const nodeEl = e.target.closest && e.target.closest(".hub-node");
    dragState.current.targetHref = nodeEl ? nodeEl.getAttribute("href") : null;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.hypot(dx, dy) > CLICK_MOVE_THRESHOLD_PX) dragState.current.moved = true;
    setRotation(dragState.current.startRotation + dx * DRAG_SENSITIVITY);
  }

  // Pointer capture (needed to keep tracking the drag even once the
  // pointer leaves the wheel) retargets the resulting pointerup -- and
  // the native "click" synthesized from it -- to the capturing element
  // (.hub-circle) instead of whichever node was actually pressed. That
  // means Link's own click-driven navigation never fires for a mouse or
  // touch interaction here, dragged or not, so navigation is triggered
  // explicitly instead of relying on the (unreachable) native click.
  function handlePointerUp() {
    if (dragState.current.active && !dragState.current.moved && dragState.current.targetHref) {
      router.push(dragState.current.targetHref);
    }
    dragState.current.active = false;
    dragState.current.moved = false;
    setIsDragging(false);
  }

  function handlePointerCancel() {
    dragState.current.active = false;
    dragState.current.moved = false;
    setIsDragging(false);
  }

  // Fallback for keyboard activation (Enter/Space on a focused link) --
  // that path never goes through pointerdown/pointerup, so it isn't
  // affected by the capture-retargeting issue above and still fires a
  // normal click straight on the anchor.
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <svg className="hub-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={ringPath} fill="none" stroke="var(--line)" strokeWidth="0.4" strokeDasharray="1.6 2" />
        </svg>
        {NODES.map((node, i) => (
          <Link
            key={node.href}
            href={node.href}
            className={`hub-node${node.primary ? " hub-node--primary" : " hub-node--secondary"}`}
            draggable={false}
            onClick={handleNodeClick}
            onDragStart={(e) => e.preventDefault()}
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
