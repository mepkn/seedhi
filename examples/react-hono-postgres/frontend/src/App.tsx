import type { Entry } from '@contract'
import { useCallback, useEffect, useState } from 'react'
import { api } from './api.ts'
import { EntryForm } from './components/EntryForm.tsx'
import { EntryList, type ListState } from './components/EntryList.tsx'
import { Footer } from './components/Footer.tsx'

export function App() {
  const [list, setList] = useState<ListState>({ status: 'loading' })

  const fetchEntries = useCallback(() => {
    api.entries().then(
      (entries) => setList({ status: 'ready', entries }),
      (error) => setList({ status: 'error', error }),
    )
  }, [])

  useEffect(fetchEntries, [fetchEntries])

  function retry() {
    setList({ status: 'loading' })
    fetchEntries()
  }

  function added(entry: Entry) {
    setList((state) =>
      state.status === 'ready' ? { status: 'ready', entries: [entry, ...state.entries] } : state,
    )
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Guestbook</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">Leave a note for whoever comes next.</p>
      </header>
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <EntryForm onCreated={added} />
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-stone-500 uppercase">Latest entries</h2>
        <EntryList state={list} onRetry={retry} />
      </section>
      <Footer />
    </main>
  )
}
