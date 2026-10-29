import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { AppError } from "./errors.ts";

const LIMIT = 5;
const WINDOW_MS = 60_000;

// Posts per IP in the current one-minute window. Kept in memory: fine for one
// API process, reset on restart.
const hits = new Map<string, { count: number; resetAt: number }>();

// Behind Cloudflare and Caddy the socket address is the proxy's, so prefer
// the header Cloudflare sets with the visitor's address.
function clientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    getConnInfo(c).remote.address ??
    "unknown"
  );
}

export const rateLimit = createMiddleware(async (c, next) => {
  const now = Date.now();
  const ip = clientIp(c);

  let hit = hits.get(ip);
  if (!hit || hit.resetAt <= now) {
    hit = { count: 0, resetAt: now + WINDOW_MS };
    hits.set(ip, hit);
  }
  hit.count += 1;
  if (hit.count > LIMIT) {
    throw new AppError(429, "RATE_LIMITED", "Too many posts. Try again in a minute.");
  }

  if (hits.size > 10_000) {
    for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
  }
  await next();
});
