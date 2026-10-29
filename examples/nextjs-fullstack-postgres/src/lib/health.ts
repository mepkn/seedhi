import type { Health } from "./contract.ts";
import { databaseIsUp } from "../db/client.ts";
import { env, TRACK } from "./env.ts";

// Read by /api/health (uptime monitors) and by the footer.
export async function health(): Promise<Health> {
  const db = (await databaseIsUp()) ? "up" : "down";
  return { ok: db === "up", db, track: TRACK, env: env.APP_ENV, version: env.APP_VERSION };
}
