import { randomUUID } from "crypto";

export interface LogEntry {
  traceId: string;
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  userId?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Emit a structured JSON log entry to stdout.
 * In production, this is picked up by log aggregation tools (Vercel, Datadog, etc.).
 */
export function log(entry: LogEntry): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
}

/**
 * Create a request tracer that measures latency and logs on completion.
 * Usage:
 *   const tracer = createTracer(req, userId);
 *   // ... do work ...
 *   tracer.end(200);
 */
export function createTracer(req: Request, userId?: string) {
  const start = Date.now();
  const traceId = randomUUID();
  const url = new URL(req.url);

  return {
    traceId,
    end(status: number, extra?: Record<string, unknown>) {
      log({
        traceId,
        method: req.method,
        path: url.pathname,
        status,
        durationMs: Date.now() - start,
        userId,
        ...extra,
      });
    },
    error(err: unknown, status = 500) {
      log({
        traceId,
        method: req.method,
        path: url.pathname,
        status,
        durationMs: Date.now() - start,
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    },
  };
}
