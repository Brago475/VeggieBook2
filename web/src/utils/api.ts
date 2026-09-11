// The one place that talks to the API.
//
// Every request goes to the same site (/api/...), so the browser sends the
// session cookie automatically. Page code never sees that cookie: it is
// HttpOnly, which is the point.
//
// The API reports problems as { error: "message" }, written for the user.
// apiFetch throws an ApiError carrying that message and the status code, so
// a screen can show the message as is, or react to a status such as 401.

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Used when a response has no message of its own, for example the rate
// limiter's 429 or a size error from nginx.
const FALLBACK: Record<number, string> = {
  401: 'Please sign in again.',
  413: 'That photo is too large.',
  429: 'Too many attempts. Wait a minute and try again.',
}

type Options = {
  method?: 'GET' | 'POST' | 'DELETE'
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