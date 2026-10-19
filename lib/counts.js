// The site's counters -- OKF-TOGAF#189 (190-DT2 section 2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/): count before the taxonomy ships, so there
// is a baseline to compare against. One counter per event, model, origin and
// UTC day, in the site's own store. No cookies and nothing about any person:
// a count is a number, and a body carrying anything else is refused.
//
// Pure functions only; pages/api/count.js does the store work, and
// scripts/counts-self-test.js runs these before every build.

export const EVENTS = ["assessment-started", "taxonomy-intake-completed", "ask-taken", "taxonomy-row-followed"];
// OKF-TOGAF#212: the ask at the end of every readout, counted when its email
// link is clicked. A start and the ask are counted per model; an intake is not.
export const PER_MODEL = ["assessment-started", "ask-taken"];
// OKF-TOGAF#202: prodmar, the readout route's key, counted from the day its
// assessment went live.
export const MODELS = ["sdlc", "pdlc", "prioritization", "ea", "prodmar"];
export const FROMS = ["direct", "taxonomy"];
// OKF-TOGAF#189: the taxonomy page leads with four rows, and following a row's
// dimension link is counted by row, the row in the key's model slot. The
// intake's event stays listed, so its counts still read back, but the page no
// longer sends it: the intake is gone.
export const ROW_EVENTS = ["taxonomy-row-followed"];
export const ROWS = ["built-with", "fixed-logic", "user", "ai-chooses"];
const ALLOWED = ["event", "model", "from", "row"];

export function utcDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function countKey(event, model, from, day) {
  return "count:v1:" + event + ":" + model + ":" + from + ":" + day;
}

// The origin comes from the link alone: the taxonomy's intake hands on
// ?from=taxonomy. Anything else counts as direct.
export function fromOf(search) {
  const m = /[?&]from=([^&#]*)/.exec(String(search || ""));
  return m && decodeURIComponent(m[1]) === "taxonomy" ? "taxonomy" : "direct";
}

export function checkCount(body) {
  const b = body && typeof body === "object" ? body : {};
  if (Object.keys(b).some((k) => !ALLOWED.includes(k))) return { ok: false, why: "unexpected field" };
  if (!EVENTS.includes(b.event)) return { ok: false, why: "unknown event" };
  const from = FROMS.includes(b.from) ? b.from : "direct";
  if (ROW_EVENTS.includes(b.event)) {
    if (!ROWS.includes(b.row)) return { ok: false, why: "unknown row" };
    return { ok: true, event: b.event, model: b.row, from };
  }
  if (b.row !== undefined) return { ok: false, why: "unexpected field" };
  if (PER_MODEL.includes(b.event)) {
    if (!MODELS.includes(b.model)) return { ok: false, why: "unknown model" };
    return { ok: true, event: b.event, model: b.model, from };
  }
  return { ok: true, event: b.event, model: "-", from };
}

// The days ending on `today`, oldest first.
export function daysBack(today, n) {
  const end = Date.parse(today + "T00:00:00Z");
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(end - i * 86400000).toISOString().slice(0, 10));
  return out;
}

// Keys and the store's values (strings, or null for a key never counted) to
// { event: { model: { from: { day: n } } } }.
export function tally(keys, values) {
  const out = {};
  keys.forEach((k, i) => {
    const [, , event, model, from, day] = k.split(":");
    ((((out[event] = out[event] || {})[model] = out[event][model] || {})[from] = out[event][model][from] || {}))[day] = Number(values[i] || 0);
  });
  return out;
}
