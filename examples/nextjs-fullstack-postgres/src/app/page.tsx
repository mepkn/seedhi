import { EntryForm } from "../components/EntryForm.tsx";
import { EntryList, type ListState } from "../components/EntryList.tsx";
import { Footer } from "../components/Footer.tsx";
import { listEntries } from "../lib/entries.ts";
import { errorBody, requestContext } from "../lib/request.ts";

// Render on every request: the entries change all the time.
export const dynamic = "force-dynamic";

// A Server Component: it runs on the server, queries the database and sends
// HTML that already contains the entries. No fetch, no loading state.
export default async function Home() {
  const ctx = await requestContext();
  let list: ListState;
  try {
    list = { status: "ready", entries: await listEntries() };
  } catch (err) {
    list = { status: "error", error: errorBody(err, ctx).body.error };
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Guestbook</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">
          Leave a note for whoever comes next.
        </p>
      </header>
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <EntryForm />
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-stone-500 uppercase">
          Latest entries
        </h2>
        <EntryList state={list} />
      </section>
      <Footer />
    </main>
  );
}
