import { health } from "../../../lib/health.ts";
import { route } from "../../../lib/request.ts";

// What uptime monitors check: 200 when the app and database are up, 503 when
// the database is not.
export const GET = route(async () => {
  const body = await health();
  return Response.json(body, { status: body.db === "up" ? 200 : 503 });
});
