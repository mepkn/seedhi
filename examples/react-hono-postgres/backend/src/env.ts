import { z } from "zod";

// Runtime configuration, read once at startup. In development it comes from
// .env (node --env-file-if-exists=.env); on the server from the environment
// Docker Compose passes in. A missing or invalid value stops the process here
// with a readable message instead of failing on the first request.
const Env = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  APP_VERSION: z.string().min(1).default("dev"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;

// Which example this is, for the footer and for telling tracks apart in logs.
export const TRACK = "react-hono-postgres";
