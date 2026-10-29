"use client";

import { useState, type FormEvent } from "react";
import { signGuestbook } from "../app/actions.ts";
import { fieldErrors, MESSAGE_MAX, NAME_MAX, NewEntry } from "../lib/contract.ts";
import { ErrorNote, type ShownError } from "./ErrorNote.tsx";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 aria-invalid:border-red-500 dark:border-stone-700 dark:bg-stone-950";

// A Client Component: it runs in the browser too, for instant validation and
// the character counters. Submitting calls the Server Action.
export function EntryForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<ShownError | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // Same schema as the API, so most mistakes are caught before sending.
    const parsed = NewEntry.safeParse({ name, message });
    if (!parsed.success) {
      setFields(fieldErrors(parsed.error));
      return;
    }
    setFields({});
    setSending(true);
    try {
      // Runs on the server. On success the server has already re-rendered the
      // page, so the new entry shows up in the list without more code here.
      const result = await signGuestbook(parsed.data);
      if (result.ok) setMessage("");
      else if (result.error.code === "VALIDATION_FAILED") setFields(result.error.fields ?? {});
      else setError(result.error);
    } catch {
      setError({ message: "Could not reach the server. Check your connection." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Name" error={fields.name} count={name.length} max={NAME_MAX}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(fields.name)}
          autoComplete="name"
          className={inputClass}
        />
      </Field>
      <Field label="Message" error={fields.message} count={message.length} max={MESSAGE_MAX}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={Boolean(fields.message)}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </Field>
      {error !== null && <ErrorNote error={error} />}
      <button
        type="submit"
        disabled={sending}
        className="rounded-lg bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {sending ? "Signing…" : "Sign the guestbook"}
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  error?: string;
  count: number;
  max: number;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-sm font-medium">
        {props.label}
        <span className={props.count > props.max ? "text-red-600" : "text-stone-400"}>
          {props.count}/{props.max}
        </span>
      </span>
      {props.children}
      {props.error && <span className="mt-1 block text-sm text-red-600">{props.error}</span>}
    </label>
  );
}
