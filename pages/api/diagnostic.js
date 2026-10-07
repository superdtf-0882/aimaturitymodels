// Ported from AI-architecture-taxonomy's app/api/diagnostic/route.js as
// part of the assessment's relocation to aimaturitymodels.com -- same
// rate-limit + cache + OpenAI logic, converted from an App Router route
// handler to a Pages Router API handler (this repo is Pages Router).
//
// Generalized for issue #25 to serve all three models that have a
// diagnostic, not just SDLC (the family is four models as of 2026-09-12;
// EA has no diagnostic yet, so "three" here is a count of THIS surface
// and not of the family):
// dimension count and prompt are looked up per `body.model` rather than
// hardcoded to 13. `model` is required, not defaulted -- every caller
// (including the SDLC assessment page) now sends it explicitly, so there's
// no silent "whichever model forgets to pass it gets treated as SDLC" path.
import { kvGet, kvSet, kvIncr, kvExpire } from "../../lib/kv";
// PREVIEW BRANCH readout-gpt-5-5 (OKF-TOGAF#145, 2026-10-07): a test harness for
// the switch to gpt-5.5, on "Switch the readout to the 5.5 model under #145,
// tested with DTOG's two sentences on a preview first -- David Facer 10/7/2026".
// NEVER MERGED AS IS. Three things here are for the test only and come out
// before production: the SDLC candidate prompt and the EA draft (both
// unapproved), and the caller's choice of reasoning effort (body.effort).
import { PDLC_EXECUTIVE_READOUT_PROMPT_V1 } from "../../lib/prompts/pdlc-executive-readout-v1";
import { PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V1 } from "../../lib/prompts/prioritization-executive-readout-v1";
import { EXECUTIVE_READOUT_PROMPT_V2_CANDIDATE } from "../../lib/prompts/executive-readout-v2-candidate";
import { EA_EXECUTIVE_READOUT_PROMPT_V1 } from "../../lib/prompts/ea-executive-readout-v1-draft";
import crypto from "crypto";
import OpenAI from "openai";

const RATE_LIMIT_PER_HOUR = 5;
const DAILY_CAP = 120;

// The AI model behind every readout, in one place (110-DT2 section 3). gpt-5.5
// is a reasoning model: its hidden reasoning is billed as output and counts
// against the output limit, so the limit is max_completion_tokens at the
// 25,000 OpenAI recommends reserving; only what is used is billed (113-CC).
const READOUT_MODEL = "gpt-5.5";
const EFFORTS = ["low", "medium"]; // TEST ONLY: production fixes one

// promptVersion is part of the cache key, so a readout written under one
// prompt is never served for another.
const MODEL_CONFIG = {
  sdlc: { dimensionCount: 13, prompt: EXECUTIVE_READOUT_PROMPT_V2_CANDIDATE, promptVersion: "sdlc-v2-candidate" },
  pdlc: { dimensionCount: 12, prompt: PDLC_EXECUTIVE_READOUT_PROMPT_V1, promptVersion: "pdlc-v1" },
  prioritization: { dimensionCount: 3, prompt: PRIORITIZATION_EXECUTIVE_READOUT_PROMPT_V1, promptVersion: "prioritization-v1" },
  ea: { dimensionCount: 10, prompt: EA_EXECUTIVE_READOUT_PROMPT_V1, promptVersion: "ea-v1-draft" },
};

// A reasoning model answers more slowly than gpt-4o did; this raises the
// function's time limit (Vercel's own limit for the plan applies above it).
export const config = { maxDuration: 300 };

// Parses rows like "| D1 | Market Discovery | C | Defined |" out of the
// assessment .md's scores table and returns the dimensionCount level
// letters in D1..Dn order, or null if any dimension is missing/ungraded.
function extractScoreVector(md, dimensionCount) {
  const re = /^\|\s*D(\d{1,2})\s*\|[^|]*\|\s*([A-E])\s*\|/gm;
  const found = new Map();
  let m;
  while ((m = re.exec(md)) !== null) {
    found.set(Number(m[1]), m[2]);
  }
  const vector = [];
  for (let i = 1; i <= dimensionCount; i++) {
    if (!found.has(i)) return null;
    vector.push(found.get(i));
  }
  return vector;
}

// Includes `model` in what's hashed, not just the vector -- Prioritization's
// 3-letter vectors and a same-length slice of any other model's vector would
// otherwise share a cache namespace with nothing distinguishing them. Cheap
// to get right now, while there are still few enough models to reason about
// by hand; expensive to notice later as a wrong-readout-served bug.
// [2026-10-07, OKF-TOGAF#145: the key also carries the AI model, the reasoning
// effort and the prompt version. Preview and production share one store
// (lib/kv.js), so without them a preview test would write into production's
// cache, and a switched model would serve the old model's readouts.]
function hashVector(model, vector, readoutModel, effort, promptVersion) {
  return crypto.createHash("sha256").update(`${model}:${vector.join("")}:${readoutModel}:${effort}:${promptVersion}`).digest("hex");
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
  const modelConfig = MODEL_CONFIG[body.model];
  if (!modelConfig) {
    return res.status(400).json({ error: "Unknown or missing model." });
  }

  // Rate limit applies even on cache hits -- prevents cache-scraping abuse (RC-001).
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.ok) {
    return res.status(429).json({ error: rateLimit.message });
  }

  const scoreVector = extractScoreVector(body.md, modelConfig.dimensionCount);
  if (!scoreVector) {
    return res
      .status(400)
      .json({ error: `Assessment content is incomplete -- all ${modelConfig.dimensionCount} dimensions must be scored.` });
  }
  const effort = EFFORTS.includes(body.effort) ? body.effort : "medium";
  const hash = hashVector(body.model, scoreVector, READOUT_MODEL, effort, modelConfig.promptVersion);
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
      model: READOUT_MODEL,
      max_completion_tokens: 25000,
      reasoning_effort: effort,
      messages: [
        { role: "system", content: modelConfig.prompt },
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
