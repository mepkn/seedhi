import { AppError } from "../../../lib/errors.ts";
import { route } from "../../../lib/request.ts";

// Any other /api path answers with the standard error body, not an HTML page.
const notFound = route(async () => {
  throw new AppError(404, "NOT_FOUND", "Not found.");
});

export {
  notFound as DELETE,
  notFound as GET,
  notFound as PATCH,
  notFound as POST,
  notFound as PUT,
};
