import type { Entry } from "../lib/contract.ts";
import { ErrorNote, type ShownError } from "./ErrorNote.tsx";

// No 'loading': the server renders the list before the page is sent.
export type ListState =
  | { status: "error"; error: ShownError }
  | { status: "ready"; entries: Entry[] };

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

// Timestamps are stored in UTC. This runs on the server, so the relative time
// is right but the hover title is in the server's time zone.
function ago(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

export function EntryList({ state }: { state: ListState }) {
  if (state.status === "error") return <ErrorNote error={state.error} retry />;
  if (state.entries.length === 0) {
    return <p className="py-8 text-center text-stone-500">No entries yet. Be the first to sign.</p>;
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
  );
}
