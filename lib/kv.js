import { createClient } from "redis";

// ABB-001 (Environment Isolation), Pattern B: local dev never touches
// production Redis. Vercel sets VERCEL_ENV for every deployed environment
// (production and preview) but never for plain local `next dev` -- so its
// absence is what identifies "really running on a dev machine," not
// NODE_ENV (which Next.js sets to "development" even for some Vercel builds).
const isLocalDev = !process.env.VERCEL_ENV;

let clientPromise;
function getRedisClient() {
  if (isLocalDev) {
    throw new Error(
      "getRedisClient() must not be called in local dev -- use the mock store below."
    );
  }
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL });
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

// In-memory mock for local development. Data resets on every dev server
// restart and never leaves the process -- no real store, nothing to touch.
const mockStore = new Map();
const mockTimers = new Map();

function mockExpire(key, seconds) {
  clearTimeout(mockTimers.get(key));
  mockTimers.set(
    key,
    setTimeout(() => mockStore.delete(key), seconds * 1000)
  );
}

export async function kvGet(key) {
  if (isLocalDev) return mockStore.has(key) ? mockStore.get(key) : null;
  const redis = await getRedisClient();
  return redis.get(key);
}

export async function kvSet(key, value, exSeconds) {
  if (isLocalDev) {
    mockStore.set(key, value);
    if (exSeconds) mockExpire(key, exSeconds);
    return "OK";
  }
  const redis = await getRedisClient();
  return exSeconds ? redis.set(key, value, { EX: exSeconds }) : redis.set(key, value);
}

export async function kvIncr(key) {
  if (isLocalDev) {
    const next = (mockStore.get(key) || 0) + 1;
    mockStore.set(key, next);
    return next;
  }
  const redis = await getRedisClient();
  return redis.incr(key);
}

export async function kvExpire(key, seconds) {
  if (isLocalDev) {
    mockExpire(key, seconds);
    return 1;
  }
  const redis = await getRedisClient();
  return redis.expire(key, seconds);
}
