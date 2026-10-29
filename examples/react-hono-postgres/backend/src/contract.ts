import { z } from "zod";

// The API contract: request and response shapes. The frontend imports this
// file too, so the form and the API validate with exactly the same rules.
// Keep it free of server-only imports.

export const NAME_MAX = 40;
export const MESSAGE_MAX = 280;

export const NewEntry = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(MESSAGE_MAX, `Message must be at most ${MESSAGE_MAX} characters`),
});
export type NewEntry = z.infer<typeof NewEntry>;

export type Entry = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
};

export type Health = {
  ok: boolean;
  db: "up" | "down";
  track: string;
  env: string;
  version: string;
};

export type ErrorCode = "VALIDATION_FAILED" | "RATE_LIMITED" | "NOT_FOUND" | "INTERNAL";

// Every error response has this shape, whatever went wrong.
export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    fields?: Record<string, string>;
  };
};

// First message per field, e.g. { name: "Name is required" }.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message;
  }
  return fields;
}
