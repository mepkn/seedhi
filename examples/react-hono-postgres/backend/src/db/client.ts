import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env.ts";
import { logger } from "../lib/logger.ts";

// One pool for the whole process: connections are reused, not opened per
// request. A small max keeps Postgres memory low on a 1 GB server.
export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });

// An idle connection can drop (Postgres restarted); log it instead of crashing.
pool.on("error", (err) => logger.error({ err }, "idle database connection failed"));

export const db = drizzle({ client: pool });

export async function databaseIsUp(): Promise<boolean> {
  try {
    await pool.query("select 1");
    return true;
  } catch {
    return false;
  }
}
