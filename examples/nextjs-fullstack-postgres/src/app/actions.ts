"use server";

import { revalidatePath } from "next/cache";
import type { ApiErrorBody, Entry } from "../lib/contract.ts";
import { createEntry } from "../lib/entries.ts";
import { errorBody, requestContext } from "../lib/request.ts";

export type SignResult = { ok: true; entry: Entry } | { ok: false; error: ApiErrorBody["error"] };

// The form's Server Action: the browser calls it like a function, Next.js
// sends it as a POST to the page. It does exactly what POST /api/entries does
// and answers errors in the same shape, but returns them instead of a status.
export async function signGuestbook(input: unknown): Promise<SignResult> {
  const ctx = await requestContext();
  try {
    const entry = await createEntry(input, ctx);
    // Re-render the page on the server, so the list includes the new entry.
    revalidatePath("/");
    return { ok: true, entry };
  } catch (err) {
    return { ok: false, error: errorBody(err, ctx).body.error };
  }
}
