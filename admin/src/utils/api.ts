// One way to call the API from the admin site.
//
// Paths are given without /api (api('/admin/overview')). The session is the
// same HttpOnly cookie the public site uses, sent automatically because the
// API is on the same origin, so no token is ever handled here.
//
// On an error the API's own message ({ error: "..." }) is thrown, so screens
// can show it as is.

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const hasBody = options.body !== undefined

  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const data = await res.json()
      if (typeof data?.error === 'string') message = data.error
    } catch {
      // No JSON body, keep the general message.
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}