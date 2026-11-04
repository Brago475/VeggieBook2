import {
  FALLBACK_ES,
  translateServerMessage,
} from '../i18n/strings/serverMessages'

// The one place that talks to the API.
//
// Every request goes to the same site (/api/...), so the browser sends the
// session cookie automatically. Page code never sees that cookie: it is
// HttpOnly, which is the point.
//
// The API reports problems as { error, code }: error is the English text,
// code a fixed name (api/Auth/ErrorCodes.cs). Some also carry values (the
// numbers in a message) and status ("locked", "pinClosed"). In Spanish the
// message is looked up by code; without a code or a Spanish line, the
// English is shown. apiFetch throws an ApiError with the message, the HTTP
// status, and the status code, so a screen can show the message as is, or
// react to the code.
//
// A 401 outside /auth/ means the session ended mid-visit. apiFetch then
// fires SESSION_ENDED once so useAuth can sign the page out, whichever
// screen made the request.

export const SESSION_ENDED = 'veggiebook:session-ended'

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

// The page language, kept on <html lang> by LanguageProvider and index.html.
function spanish(): boolean {
  return typeof document !== 'undefined' && document.documentElement.lang === 'es'
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
      spanish()
        ? FALLBACK_ES.offline
        : 'Could not reach VeggieBook. Check your connection and try again.',
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
    if (res.status === 401) reportSessionEnded(path)
    throw new ApiError(res.status, message(res.status, data), statusCode(data))
  }

  return data as T
}

// Sign-in screens answer 401 for a wrong password, so they are left out.
export function reportSessionEnded(path: string) {
  if (path.startsWith('/auth/')) return
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_ENDED))
}

// The message to show for a failed response, in the page language.
function message(httpStatus: number, data: unknown): string {
  const english = field(data, 'error')

  if (spanish()) {
    const code = field(data, 'code')
    const translated = code ? translateServerMessage(code, values(data)) : null
    if (translated) return translated
    if (english) return english
    const fallback = FALLBACK_ES[httpStatus as keyof typeof FALLBACK_ES]
    return typeof fallback === 'string' ? fallback : FALLBACK_ES.generic
  }

  return english ?? FALLBACK[httpStatus] ?? 'Something went wrong. Please try again.'
}

function field(data: unknown, key: string): string | null {
  if (data && typeof data === 'object' && key in data) {
    const value = (data as Record<string, unknown>)[key]
    if (typeof value === 'string') return value
  }
  return null
}

function values(data: unknown): Record<string, number | string> | null {
  if (data && typeof data === 'object' && 'values' in data) {
    const v = (data as { values: unknown }).values
    if (v && typeof v === 'object') return v as Record<string, number | string>
  }
  return null
}

// The short code some answers carry, such as "locked" or "pinClosed".
function statusCode(data: unknown): string | null {
  return field(data, 'status')
}