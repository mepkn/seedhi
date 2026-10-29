import { Hono } from "hono";
import { requestId, type RequestIdVariables } from "hono/request-id";
import type { ApiErrorBody } from "./contract.ts";
import { AppError } from "./lib/errors.ts";
import { logger, type Logger } from "./lib/logger.ts";
import { entries } from "./routes/entries.ts";
import { health } from "./routes/health.ts";

export type AppEnv = { Variables: RequestIdVariables & { log: Logger } };

export const app = new Hono<AppEnv>();

// Reuse the X-Request-Id the proxy sent, or make one, and send it back in the
// response header. Every log line for this request carries it.
app.use(requestId());

app.use(async (c, next) => {
  const started = performance.now();
  c.set("log", logger.child({ requestId: c.var.requestId }));
  await next();
  c.var.log.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: Math.round(performance.now() - started),
    },
    "request",
  );
});

app.route("/api/health", health);
app.route("/api/entries", entries);

function errorBody(requestId: string, err: AppError): ApiErrorBody {
  return {
    error: { code: err.code, message: err.message, requestId, fields: err.fields },
  };
}

app.notFound((c) =>
  c.json(errorBody(c.var.requestId, new AppError(404, "NOT_FOUND", "Not found.")), 404),
);

// Expected errors are answered as they are; anything else is a bug: log it in
// full, but tell the client only that something went wrong and the request ID.
app.onError((err, c) => {
  const log = c.var.log ?? logger;
  if (err instanceof AppError) {
    log.warn({ code: err.code, fields: err.fields }, err.message);
    return c.json(errorBody(c.var.requestId, err), err.status);
  }
  log.error({ err }, "unhandled error");
  const internal = new AppError(500, "INTERNAL", "Something went wrong.");
  return c.json(errorBody(c.var.requestId, internal), 500);
});
