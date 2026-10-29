// Runs once when the server starts, before it answers any request. Importing
// env.ts here checks the configuration at startup (see lib/env.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("./lib/logger.ts");
    logger.info("server starting");
  }
}
