"use client";

import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "../lib/contract.ts";

export type ShownError = Pick<ApiErrorBody["error"], "message"> & { requestId?: string };

// A failed request, with the request ID to quote: it finds the matching log
// lines on the server. "Try again" re-renders the page on the server.
export function ErrorNote({ error, retry = false }: { error: ShownError; retry?: boolean }) {
  const router = useRouter();
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p>{error.message}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs opacity-80">
        {error.requestId && <span className="font-mono">ref {error.requestId}</span>}
        {retry && (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="font-medium underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
