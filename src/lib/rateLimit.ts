/**
 * Simple sliding-window rate limiter.
 *
 * Production swap: replace the in-memory Map with an Upstash Redis client
 * (upstash/ratelimit) — the interface is identical.
 *
 * Usage:
 *   const result = await rateLimit(ip, { limit: 5, windowMs: 60_000 });
 *   if (!result.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface Window {
  count:    number;
  resetAt:  number;
}

// In-memory store — replaced by Redis in production
const store = new Map<string, Window>();

// Purge stale entries every 5 minutes to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  ok:        boolean;
  remaining: number;
  resetAt:   number; // Unix ms timestamp
}

export async function rateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    // New or expired window
    const win: Window = { count: 1, resetAt: now + windowMs };
    store.set(identifier, win);
    return { ok: true, remaining: limit - 1, resetAt: win.resetAt };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Extract the real client IP from Next.js request headers.
 * Respects X-Forwarded-For (set by Vercel / reverse proxies).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}