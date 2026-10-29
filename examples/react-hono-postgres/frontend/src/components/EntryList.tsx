import type { Entry } from '@contract'
import { ErrorNote } from './ErrorNote.tsx'

export type ListState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; entries: Entry[] }

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

// Timestamps are stored and sent in UTC; show them in the visitor's own time.
function ago(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour')
  return relative.format(Math.round(hours / 24), 'day')
}

export function EntryList({ state, onRetry }: { state: ListState; onRetry: () => void }) {
  if (state.status === 'loading') {
    return (
      <ul aria-busy="true" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-20 animate-pulse rounded-lg bg-stone-200/70 dark:bg-stone-800/70" />
        ))}
      </ul>
    )
  }
  if (state.status === 'error') return <ErrorNote error={state.error} onRetry={onRetry} />
  if (state.entries.length === 0) {
    return <p className="py-8 text-center text-stone-500">No entries yet. Be the first to sign.</p>
  }
  return (
    <ul className="space-y-3">
      {state.entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">{entry.name}</span>
            <time
              dateTime={entry.createdAt}
              title={new Date(entry.createdAt).toLocaleString()}
              className="shrink-0 text-xs text-stone-500"
            >
              {ago(entry.createdAt)}
            </time>
          </div>
          <p className="mt-1 break-words whitespace-pre-line text-stone-700 dark:text-stone-300">
            {entry.message}
          </p>
        </li>
      ))}
    </ul>
  )
}
