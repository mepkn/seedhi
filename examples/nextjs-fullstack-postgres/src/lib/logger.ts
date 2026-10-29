import { pino } from "pino";
import { env, TRACK } from "./env.ts";

// One JSON object per line, so logs can be filtered with jq on the server and
// searched in Grafana later. Every line carries the track, environment and
// version; request logs add a requestId (see request.ts).
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { track: TRACK, env: env.APP_ENV, version: env.APP_VERSION },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
