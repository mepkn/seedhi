import type { ApiErrorBody, Entry, Health, NewEntry } from '@contract'

// Any failed request, in one shape the UI can show: a message, the request ID
// to quote when reporting it, and per-field messages for the form.
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string
  readonly fields: Record<string, string>

  constructor(status: number, code: string, message: string, requestId: string, fields = {}) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
    this.fields = fields
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach the server. Check your connection.', 'none')
  }
  if (res.ok) return res.json() as Promise<T>

  // Our API always answers errors with ApiErrorBody. A proxy in front of it
  // (502 while the API restarts) may not, so fall back to the status.
  const requestId = res.headers.get('x-request-id') ?? 'unknown'
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null
  if (body?.error) {
    const { code, message, fields } = body.error
    throw new ApiError(res.status, code, message, body.error.requestId ?? requestId, fields)
  }
  throw new ApiError(res.status, 'INTERNAL', `Server error (${res.status}).`, requestId)
}

export const api = {
  entries: () => request<Entry[]>('/api/entries'),
  createEntry: (entry: NewEntry) =>
    request<Entry>('/api/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
    }),
  health: () => request<Health>('/api/health'),
}
