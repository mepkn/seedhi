import { ApiError } from '../api.ts'

// A failed request, with the request ID to quote: it finds the matching log
// lines on the server.
export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  const ref = error instanceof ApiError && error.requestId !== 'none' ? error.requestId : null
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p>{message}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs opacity-80">
        {ref && <span className="font-mono">ref {ref}</span>}
        {onRetry && (
          <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
