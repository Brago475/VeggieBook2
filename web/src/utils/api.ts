// The one place that talks to the API.
//
// Every request goes to the same site (/api/...), so the browser sends the
// session cookie automatically. Page code never sees that cookie: it is
// HttpOnly, which is the point.
//
// The API reports problems as { error: "message" }, written for the user,
// and some also carry { status: "code" }, such as "locked" or "pinClosed".
// apiFetch throws an ApiError with the message, the status code, and that
// short code, so a screen can show the message as is, or react to a code.

export class ApiError extends Error {
  status: number
  code: string | null

  constructor(status: number, message: string, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Used when a response has no message of its own, for example the rate
// limiter's 429 or a size error from nginx.
const FALLBACK: Record<number, string> = {
  401: 'Please sign in again.',
  413: 'That photo is too large.',
  429: 'Too many attempts. Wait a minute and try again.',
}

// PUT replaces something that already exists, such as a saved book's cover.
type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body } = options

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      0,
      'Could not reach VeggieBook. Check your connection and try again.',
    )
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      errorMessage(data) ??
        FALLBACK[res.status] ??
        'Something went wrong. Please try again.',
      errorCode(data),
    )
  }

  return data as T
}

function errorMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'error' in data) {
    const error = (data as { error: unknown }).error
    if (typeof error === 'string') return error
  }
  return null
}

function errorCode(data: unknown): string | null {
  if (data && typeof data === 'object' && 'status' in data) {
    const status = (data as { status: unknown }).status
    if (typeof status === 'string') return status
  }
  return null
}