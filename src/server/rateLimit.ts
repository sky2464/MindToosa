import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// ─── In-memory fallback (used when UPSTASH_REDIS_REST_URL is not set) ────────
const trackers = new Map<string, { count: number; expiresAt: number }>();

function inMemoryRateLimit(ip: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const record = trackers.get(ip);

  if (!record || now > record.expiresAt) {
    trackers.set(ip, { count: 1, expiresAt: now + config.windowMs });
    return true;
  }

  if (record.count >= config.limit) return false;
  record.count++;
  return true;
}

// Cleanup stale in-memory entries every 60 seconds
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of trackers.entries()) {
      if (now > value.expiresAt) trackers.delete(key);
    }
  }, 60_000);
}

// ─── Upstash Ratelimit (used in production when env vars are present) ─────────
let upstashLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    analytics: false,
    prefix: "rl_search",
  });
}

/**
 * Rate limit a request by IP.
 * Returns true (allowed) or false (throttled).
 *
 * Uses Upstash Redis when env vars are set (production-safe, works across Vercel
 * function instances). Falls back to in-memory when running locally or in tests.
 */
export async function rateLimit(ip: string, config: RateLimitConfig): Promise<boolean> {
  if (upstashLimiter) {
    const { success } = await upstashLimiter.limit(ip);
    return success;
  }
  return inMemoryRateLimit(ip, config);
}

