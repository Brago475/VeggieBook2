import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

// Who is using the site: still being checked, a guest, or signed in.
//
// The session itself is the HttpOnly cookie the API sets. This hook only
// mirrors what the API says. On load it asks /api/auth/me, which answers
// { email: null } for a visitor who is not signed in. That is not an error.
//
// "guest" here simply means not signed in. Whether that visitor has chosen
// Continue as guest, or still needs the welcome screen, is App's decision.
//
// Every action throws an ApiError on failure, with a message written for the
// user, so screens can catch it and display it.

export type AuthState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'signedIn'; email: string }

type MeResponse = { email: string | null }

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    apiFetch<MeResponse>('/auth/me')
      .then((me) => {
        if (cancelled) return
        setAuth(
          me.email ? { status: 'signedIn', email: me.email } : { status: 'guest' },
        )
      })
      .catch(() => {
        // If the API cannot be reached, the site still works for browsing.
        // Saving will show its own error.
        if (!cancelled) setAuth({ status: 'guest' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function register(email: string, password: string) {
    const me = await apiFetch<MeResponse>('/auth/register', {
      method: 'POST',
      body: { email, password },
    })
    setAuth({ status: 'signedIn', email: me.email ?? email })
  }

  async function signIn(email: string, password: string) {
    const me = await apiFetch<MeResponse>('/auth/signin', {
      method: 'POST',
      body: { email, password },
    })
    setAuth({ status: 'signedIn', email: me.email ?? email })
  }

  async function signOut() {
    await apiFetch<void>('/auth/signout', { method: 'POST' })
    setAuth({ status: 'guest' })
  }

  // Signs out every other device. This one stays signed in.
  async function changePassword(currentPassword: string, newPassword: string) {
    await apiFetch<void>('/auth/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    })
  }

  async function deleteAccount(password: string) {
    await apiFetch<void>('/auth/delete', {
      method: 'POST',
      body: { password },
    })
    setAuth({ status: 'guest' })
  }

  // Called when any request comes back 401 mid-visit, for example after the
  // password was changed on another device. The cookie is already invalid,
  // so this only brings the page up to date.
  function sessionEnded() {
    setAuth({ status: 'guest' })
  }

  return {
    auth,
    register,
    signIn,
    signOut,
    changePassword,
    deleteAccount,
    sessionEnded,
  }
}