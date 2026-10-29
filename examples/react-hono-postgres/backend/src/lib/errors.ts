import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ErrorCode } from "../contract.ts";

// An expected error: bad input, too many requests, not found. Thrown from
// handlers and turned into the standard error response by app.onError.
// Anything else that is thrown is unexpected and becomes a 500.
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(
    status: ContentfulStatusCode,
    code: ErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
