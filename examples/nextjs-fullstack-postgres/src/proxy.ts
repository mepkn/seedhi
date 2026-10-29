import { type NextRequest, NextResponse } from "next/server";

// Runs before every page, API route and Server Action. Reuse the X-Request-Id
// Caddy sent, or make one; pass it on to the app (lib/request.ts reads it) and
// send it back in the response header.
export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

// Not for built assets and static files: they need no ID.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"],
};
