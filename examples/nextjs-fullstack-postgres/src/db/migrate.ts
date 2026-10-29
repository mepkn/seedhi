import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "../lib/env.ts";
import { logger } from "../lib/logger.ts";

// Applies the migrations in drizzle/ that this database has not run yet
// (Drizzle records applied ones in drizzle.__drizzle_migrations), then exits.
// Locally: npm run db:migrate. On the server: a one-off container before the
// new app version starts.
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 1 });

try {
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: path.resolve(import.meta.dirname, "../../drizzle"),
  });
  logger.info("migrations applied");
} catch (err) {
  logger.error({ err }, "migration failed");
  process.exitCode = 1;
} finally {
  await pool.end();
}
