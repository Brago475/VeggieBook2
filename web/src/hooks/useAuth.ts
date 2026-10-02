import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

// Who is using the site, as the API sees it.
//
//   loading    the first check has not answered yet
//   visitor    nobody signed in: Welcome is shown
//   guest      a temporary guest account (see Auth/GuestAccounts.cs). Books
//              save like an account's, and are deleted on sign out or after
//              24 hours.
//   signedIn   a real account, with its username and roles: ["User"] or
//              ["User", "Admin"]
//
// The session itself is the HttpOnly cookie the API sets. This hook only
// mirrors what the API says.
//
// A guest has no email, so each guest session gets its own random key. The
// book list uses it to know whose books it holds, so one guest's books are
// never shown to the next guest on the same device, not even for a moment.
//
// Every action throws an ApiError on failure, with a message written for the
// user, so screens can catch it and display it.

export type AuthState =
  | { status: 'loading' }
  | { status: 'visitor' }
  | { status: 'guest'; key: string }
  | { status: 'signedIn'; email: string; displayName: string | null; roles: string[] }

// Everything the Create Account form sends. displayName is the username;
// blank means the API makes one up.
export type RegisterForm = {
  firstName: string
  lastName: string
  displayName: string
  email: string
  password: string
  ageRange: string
  pin: string
  questionId: number
  answer: string
  agreeToTerms: boolean
  keepGuestBooks: boolean
}

type MeResponse = { email: string | null; roles: string[]; displayName?: string | null }

export function isAdmin(auth: AuthState): boolean {
  return auth.status === 'signedIn' && auth.roles.includes('Admin')
}

function newGuestKey() {
  return `guest:${crypto.randomUUID()}`
}

function fromMe(me: MeResponse): AuthState {
  const roles = me.roles ?? []
  if (me.email)
    return { status: 'signedIn', email: me.email, displayName: me.displayName ?? null, roles }
  if (roles.includes('Guest')) return { status: 'guest', key: newGuestKey() }
  return { status: 'visitor' }
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    apiFetch<MeResponse>('/auth/me')
      .then((me) => {
        if (!cancelled) setAuth(fromMe(me))
      })
      .catch(() => {
        // If the API cannot be reached, the site still works for browsing.
        // Saving will show its own error.
        if (!cancelled) setAuth({ status: 'visitor' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function startGuest() {
    const me = await apiFetch<MeResponse>('/auth/guest', { method: 'POST' })
    setAuth(fromMe(me))
  }

  // Creating an account signs in right away. A guest's books either move
  // into the new account or are deleted, as the guest chose.
  async function register(form: RegisterForm) {
    const me = await apiFetch<MeResponse>('/auth/register', {
      method: 'POST',
      body: form,
    })
    setAuth(fromMe(me))
  }

  async function signIn(email: string, password: string, keepGuestBooks: boolean) {
    const me = await apiFetch<MeResponse>('/auth/signin', {
      method: 'POST',
      body: { email, password, keepGuestBooks },
    })
    setAuth(fromMe(me))
  }

  // For a guest, this also deletes the guest account and its books.
  async function signOut() {
    await apiFetch<void>('/auth/signout', { method: 'POST' })
    setAuth({ status: 'visitor' })
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
    setAuth({ status: 'visitor' })
  }

  // Called when any request comes back 401 mid-visit, for example after the
  // password was changed on another device, or a guest's time ran out. The
  // cookie is already invalid, so this only brings the page up to date.
  const sessionEnded = useCallback(() => {
    setAuth({ status: 'visitor' })
  }, [])

  return {
    auth,
    startGuest,
    register,
    signIn,
    signOut,
    changePassword,
    deleteAccount,
    sessionEnded,
  }
}