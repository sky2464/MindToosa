import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

const trackers = new Map<string, { count: number; expiresAt: number }>();

/**
 * Simple in-memory rate limiter.
 * Note: In a production serverless environment, this should use Redis (e.g., Upstash).
 * This implementation works for single-instance or long-running servers.
 */
export function rateLimit(ip: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = trackers.get(ip);

    if (!record || now > record.expiresAt) {
        trackers.set(ip, { count: 1, expiresAt: now + config.windowMs });
        return true;
    }

    if (record.count >= config.limit) {
        return false;
    }

    record.count++;
    return true;
}

/**
 * Cleanup expired trackers every minute to prevent memory leaks
 */
if (process.env.NODE_ENV !== "test") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of trackers.entries()) {
            if (now > value.expiresAt) {
                trackers.delete(key);
            }
        }
    }, 60000);
}
