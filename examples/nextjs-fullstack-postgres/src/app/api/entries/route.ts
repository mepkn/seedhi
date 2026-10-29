import { createEntry, listEntries } from "../../../lib/entries.ts";
import { route } from "../../../lib/request.ts";

// GET and POST /api/entries. The page and the form don't use these (they call
// lib/entries.ts directly); they are the public API, for curl and other clients.

export const GET = route(async () => Response.json(await listEntries()));

export const POST = route(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  return Response.json(await createEntry(body, ctx), { status: 201 });
});
