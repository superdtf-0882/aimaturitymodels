// The site's counters -- OKF-TOGAF#189 (190-DT2 section 2 of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/): count before the taxonomy ships, so there
// is a baseline to compare against. One counter per event, model, origin and
// UTC day, in the site's own store. No cookies and nothing about any person:
// a count is a number, and a body carrying anything else is refused.
//
// Pure functions only; pages/api/count.js does the store work, and
// scripts/counts-self-test.js runs these before every build.

export const EVENTS = ["assessment-started", "taxonomy-intake-completed", "ask-taken"];
// OKF-TOGAF#212: the ask at the end of every readout, counted when its email
// link is clicked. A start and the ask are counted per model; an intake is not.
export const PER_MODEL = ["assessment-started", "ask-taken"];
// OKF-TOGAF#202: prodmar, the readout route's key, counted from the day its
// assessment went live.
export const MODELS = ["sdlc", "pdlc", "prioritization", "ea", "prodmar"];
export const FROMS = ["direct", "taxonomy"];
const ALLOWED = ["event", "model", "from"];

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
