import type { Health } from '@contract'
import { useEffect, useState } from 'react'
import { api } from '../api.ts'

// Which track, environment and version is live: the quickest way to check
// that a deploy really happened.
export function Footer() {
  const [health, setHealth] = useState<Health | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.health().then(setHealth, () => setFailed(true))
  }, [])

  return (
    <footer className="mt-12 border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800">
      {health ? (
        <span className="font-mono">
          {health.track} · {health.env} · {health.version} · db {health.db}
        </span>
      ) : failed ? (
        <span>API unreachable</span>
      ) : (
        <span>Checking API…</span>
      )}
    </footer>
  )
}
