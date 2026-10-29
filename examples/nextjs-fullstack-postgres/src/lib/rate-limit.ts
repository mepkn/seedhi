import { AppError } from "./errors.ts";

const LIMIT = 5;
const WINDOW_MS = 60_000;

// Posts per IP in the current one-minute window. Kept in memory: fine for one
// Next.js process, reset on restart. The API route and the Server Action both
// count here, so the form can't be used to get around the limit.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string): void {
  const now = Date.now();

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
}
