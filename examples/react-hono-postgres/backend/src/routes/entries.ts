import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { type Entry, fieldErrors, NewEntry } from "../contract.ts";
import { db } from "../db/client.ts";
import { entries as entriesTable } from "../db/schema.ts";
import type { AppEnv } from "../app.ts";
import { AppError } from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";

const LATEST = 50;

function toEntry(row: typeof entriesTable.$inferSelect): Entry {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export const entries = new Hono<AppEnv>()
  .get("/", async (c) => {
    const rows = await db
      .select()
      .from(entriesTable)
      .orderBy(desc(entriesTable.createdAt))
      .limit(LATEST);
    return c.json(rows.map(toEntry));
  })
  .post("/", rateLimit, async (c) => {
    // Never trust the client: the form validated already, validate again.
    const body = await c.req.json().catch(() => null);
    const parsed = NewEntry.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_FAILED", "Check the highlighted fields.", fieldErrors(parsed.error));
    }

    const [row] = await db.insert(entriesTable).values(parsed.data).returning();
    c.var.log.info({ entryId: row.id }, "entry created");
    return c.json(toEntry(row), 201);
  });
