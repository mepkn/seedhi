import { headers } from "next/headers";
import type { ApiErrorBody } from "./contract.ts";
import { AppError } from "./errors.ts";
import { logger, type Logger } from "./logger.ts";

export type RequestContext = { requestId: string; ip: string; log: Logger };

// The request ID that proxy.ts put on the request, the visitor's IP and a
// child logger that adds the ID to every line. Works in Route Handlers,
// Server Actions and Server Components alike.
export async function requestContext(): Promise<RequestContext> {
  const h = await headers();
  const requestId = h.get("x-request-id") ?? crypto.randomUUID();
  // Behind Cloudflare and Caddy the socket address is the proxy's, so prefer
  // the header Cloudflare sets with the visitor's address.
  const ip =
    h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { requestId, ip, log: logger.child({ requestId }) };
}

// Expected errors are answered as they are; anything else is a bug: log it in
// full, but tell the client only that something went wrong and the request ID.
export function errorBody(
  err: unknown,
  ctx: RequestContext,
): { status: number; body: ApiErrorBody } {
  let known: AppError;
  if (err instanceof AppError) {
    ctx.log.warn({ code: err.code, fields: err.fields }, err.message);
    known = err;
  } else {
    ctx.log.error({ err }, "unhandled error");
    known = new AppError(500, "INTERNAL", "Something went wrong.");
  }
  return {
    status: known.status,
    body: {
      error: {
        code: known.code,
        message: known.message,
        requestId: ctx.requestId,
        fields: known.fields,
      },
    },
  };
}

// Wraps a Route Handler: errors become the standard body, and one `request`
// line per request records method, path, status and time.
export function route(handler: (req: Request, ctx: RequestContext) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const started = performance.now();
    const ctx = await requestContext();
    let res: Response;
    try {
      res = await handler(req, ctx);
    } catch (err) {
      const { status, body } = errorBody(err, ctx);
      res = Response.json(body, { status });
    }
    ctx.log.info(
      {
        method: req.method,
        path: new URL(req.url).pathname,
        status: res.status,
        ms: Math.round(performance.now() - started),
      },
      "request",
    );
    return res;
  };
}
