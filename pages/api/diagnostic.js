// Ported from AI-architecture-taxonomy's app/api/diagnostic/route.js as
// part of the assessment's relocation to aimaturitymodels.com -- same
// rate-limit + cache + OpenAI logic, converted from an App Router route
// handler to a Pages Router API handler (this repo is Pages Router).
import { kvGet, kvSet, kvIncr, kvExpire } from "../../lib/kv";
import { EXECUTIVE_READOUT_PROMPT_V1 } from "../../lib/prompts/executive-readout-v1";
import crypto from "crypto";
import OpenAI from "openai";

const RATE_LIMIT_PER_HOUR = 5;
const DAILY_CAP = 120;

// Parses rows like "| D1 | Market Discovery | C | Defined |" out of the
// assessment .md's scores table and returns the 13 level letters in D1..D13
// order, or null if any dimension is missing/ungraded.
function extractScoreVector(md) {
  const re = /^\|\s*D(\d{1,2})\s*\|[^|]*\|\s*([A-E])\s*\|/gm;
  const found = new Map();
  let m;
  while ((m = re.exec(md)) !== null) {
    found.set(Number(m[1]), m[2]);
  }
  const vector = [];
  for (let i = 1; i <= 13; i++) {
    if (!found.has(i)) return null;
    vector.push(found.get(i));
  }
  return vector;
}

function hashVector(vector) {
  return crypto.createHash("sha256").update(vector.join("")).digest("hex");
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() || "unknown";
}

async function checkRateLimit(ip) {
  const now = new Date();
  const hourKey = `diag_rl:${ip}:${now.toISOString().slice(0, 13)}`;
  const dayKey = `diag_rl_day:${now.toISOString().slice(0, 10)}`;

  const hourCount = await kvIncr(hourKey);
  if (hourCount === 1) await kvExpire(hourKey, 3600);

  const dayCount = await kvIncr(dayKey);
  if (dayCount === 1) await kvExpire(dayKey, 86400);

  if (hourCount > RATE_LIMIT_PER_HOUR) {
    return { ok: false, message: "You've hit the hourly limit for diagnostic requests. Please try again in a bit." };
  }
  if (dayCount > DAILY_CAP) {
    return { ok: false, message: "The daily limit for diagnostic requests has been reached. Please try again tomorrow." };
  }
  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const body = req.body;
  if (!body || typeof body.md !== "string" || !body.md.trim()) {
    return res.status(400).json({ error: "Missing assessment content." });
  }

  // Rate limit applies even on cache hits -- prevents cache-scraping abuse (RC-001).
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.ok) {
    return res.status(429).json({ error: rateLimit.message });
  }

  const scoreVector = extractScoreVector(body.md);
  if (!scoreVector) {
    return res.status(400).json({ error: "Assessment content is incomplete -- all 13 dimensions must be scored." });
  }
  const hash = hashVector(scoreVector);
  const cacheKey = `diag_cache:${hash}`;

  const cached = await kvGet(cacheKey);
  if (cached) {
    return res.status(200).json({ readout: cached, hash });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Diagnostic service is not configured." });
  }

  let readout;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      messages: [
        { role: "system", content: EXECUTIVE_READOUT_PROMPT_V1 },
        { role: "user", content: body.md },
      ],
    });
    readout = completion.choices[0]?.message?.content?.trim();
  } catch (err) {
    console.error("[diagnostic] OpenAI call failed:", err.message);
    return res.status(502).json({ error: "Failed to generate the Executive Readout. Please try again." });
  }

  if (!readout) {
    return res.status(502).json({ error: "Failed to generate the Executive Readout. Please try again." });
  }

  await kvSet(cacheKey, readout, 86400);

  return res.status(200).json({ readout, hash });
}
