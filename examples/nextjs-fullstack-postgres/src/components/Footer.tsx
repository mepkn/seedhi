import { health } from "../lib/health.ts";

// Which track, environment and version is live: the quickest way to check
// that a deploy really happened. Rendered on the server, so no request.
export async function Footer() {
  const h = await health();
  return (
    <footer className="mt-12 border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800">
      <span className="font-mono">
        {h.track} · {h.env} · {h.version} · db {h.db}
      </span>
    </footer>
  );
}
