// The site's counters -- OKF-TOGAF#189 (lib/counts.js says what is counted
// and why). POST adds one to a counter; GET reads the daily totals back, so the
// practice can read them without touching the store's credentials.
//
// No cookies and nothing about any person: the route reads only the request
// body or the `days` query, never an address or a header, and sets no cookie.
// HOW IT CAN BE CROSSED (declared): anyone can post a count, so totals can be
// inflated by someone who wants to; the counts are a signal to read, not a
// figure to bill.
import { checkCount, countKey, utcDay, daysBack, tally, EVENTS, MODELS, FROMS } from "../../lib/counts";
import { kvIncr, kvMGet } from "../../lib/kv";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const c = checkCount(typeof req.body === "string" ? safeParse(req.body) : req.body);
    if (!c.ok) return res.status(400).json({ error: c.why });
    try {
      await kvIncr(countKey(c.event, c.model, c.from, utcDay(Date.now())));
    } catch (e) {
      return res.status(503).json({ error: "not counted" });
    }
    return res.status(204).end();
  }
  if (req.method === "GET") {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
    const dayList = daysBack(utcDay(Date.now()), days);
    const keys = [];
    for (const event of EVENTS) {
      const models = event === "assessment-started" ? MODELS : ["-"];
      for (const model of models) for (const from of FROMS) for (const day of dayList) keys.push(countKey(event, model, from, day));
    }
    try {
      const values = await kvMGet(keys);
      return res.status(200).json({ days: dayList, counts: tally(keys, values) });
    } catch (e) {
      return res.status(503).json({ error: "totals not read" });
    }
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
