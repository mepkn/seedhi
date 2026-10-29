import type { ErrorCode } from "./contract.ts";

// An expected error: bad input, too many requests, not found. Thrown from
// lib/entries.ts and turned into the standard error body by errorBody() in
// request.ts. Anything else that is thrown is unexpected and becomes a 500.
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
