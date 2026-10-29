import { desc } from "drizzle-orm";
import { type Entry, fieldErrors, NewEntry } from "./contract.ts";
import { db } from "../db/client.ts";
import { entries as entriesTable } from "../db/schema.ts";
import { AppError } from "./errors.ts";
import { rateLimit } from "./rate-limit.ts";
import type { RequestContext } from "./request.ts";

// Reading and writing entries, used by the page, the API route and the
// Server Action alike, so all three behave the same.

const LATEST = 50;

function toEntry(row: typeof entriesTable.$inferSelect): Entry {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function listEntries(): Promise<Entry[]> {
  const rows = await db
    .select()
    .from(entriesTable)
    .orderBy(desc(entriesTable.createdAt))
    .limit(LATEST);
  return rows.map(toEntry);
}

export async function createEntry(input: unknown, ctx: RequestContext): Promise<Entry> {
  rateLimit(ctx.ip);

  // Never trust the client: the form validated already, validate again.
  const parsed = NewEntry.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      400,
      "VALIDATION_FAILED",
      "Check the highlighted fields.",
      fieldErrors(parsed.error),
    );
  }

  const [row] = await db.insert(entriesTable).values(parsed.data).returning();
  ctx.log.info({ entryId: row.id }, "entry created");
  return toEntry(row);
}
