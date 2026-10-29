import { z } from "zod";

// Runtime configuration, read once at startup. `next dev` reads .env itself,
// db:migrate and db:seed use node --env-file-if-exists=.env, and on the server
// it comes from the environment Docker Compose passes in. instrumentation.ts
// imports this file when the server starts, so a missing or invalid value
// stops the process there with a readable message, not on the first request.
const Env = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  APP_VERSION: z.string().min(1).default("dev"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

// `next build` loads route modules too, without any runtime environment
// (images are built once and get their config when they start). Check only
// that the shape is right there.
const building = process.env.NEXT_PHASE === "phase-production-build";
const parsed = Env.safeParse(
  building ? { DATABASE_URL: "postgres://build", ...process.env } : process.env,
);
if (!parsed.success) {
  console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;

// Which example this is, for the footer and for telling tracks apart in logs.
export const TRACK = "nextjs-fullstack-postgres";
