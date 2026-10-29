import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { MESSAGE_MAX, NAME_MAX } from "../contract.ts";

// The source of truth for the database shape. Change it, then run
// `npm run db:generate` to write the migration, and commit both.
export const entries = pgTable("entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: NAME_MAX }).notNull(),
  message: varchar("message", { length: MESSAGE_MAX }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
