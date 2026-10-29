import { env } from "../env.ts";
import { logger } from "../lib/logger.ts";
import { db, pool } from "./client.ts";
import { entries } from "./schema.ts";

// Fills a development database with sample entries. Never a migration, and
// refuses to run anywhere but development.
if (env.APP_ENV !== "development") {
  logger.error(`db:seed only runs with APP_ENV=development (got ${env.APP_ENV})`);
  process.exit(1);
}

const samples = [
  ["Asha", "Hello from Raipur!"],
  ["Ben", "Found this through the guide. Nice and simple."],
  ["Chen", "Deployed my first app today 🎉"],
  ["Divya", "Testing the form with a longer message to see how the list wraps text that goes on for a while."],
  ["Emre", "Greetings from Istanbul"],
  ["Fatima", "The request ID in the error message is a nice touch."],
] as const;

const now = Date.now();
await db.insert(entries).values(
  samples.map(([name, message], i) => ({
    name,
    message,
    createdAt: new Date(now - (samples.length - i) * 3_600_000),
  })),
);
logger.info({ count: samples.length }, "seeded entries");
await pool.end();
