// In-memory sliding-window rate limiter. Pinned to globalThis so dev HMR doesn't
// reset it. Good enough for a single-process pilot; in a multi-instance deploy
// this moves to Redis/Upstash (same interface).

type Hits = Map<string, number[]>;
const g = globalThis as unknown as { __vlRate?: Hits };
function store(): Hits {
  if (!g.__vlRate) g.__vlRate = new Map();
  return g.__vlRate;
}

export type RateResult = { ok: boolean; remaining: number; retryAfterSec: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const s = store();
  const arr = (s.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    const oldest = arr[0];
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  arr.push(now);
  s.set(key, arr);
  return { ok: true, remaining: limit - arr.length, retryAfterSec: 0 };
}

/** Best-effort client IP from forwarded headers (Vercel/proxies set these). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}
