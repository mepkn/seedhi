import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { env } from "./env.ts";
import { logger } from "./lib/logger.ts";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port }, "listening");
});
