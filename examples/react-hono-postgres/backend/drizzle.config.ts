import { defineConfig } from "drizzle-kit";

// `npm run db:generate` compares src/db/schema.ts with the migrations in
// drizzle/ and writes a new SQL file for the difference. It needs no database.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
