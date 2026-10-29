import { Hono } from "hono";
import type { Health } from "../contract.ts";
import { databaseIsUp } from "../db/client.ts";
import { env, TRACK } from "../env.ts";

// What uptime monitors check: 200 when the API and database are up, 503 when
// the database is not.
export const health = new Hono().get("/", async (c) => {
  const db = (await databaseIsUp()) ? "up" : "down";
  const body: Health = {
    ok: db === "up",
    db,
    track: TRACK,
    env: env.APP_ENV,
    version: env.APP_VERSION,
  };
  return c.json(body, db === "up" ? 200 : 503);
});
