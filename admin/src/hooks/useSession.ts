import { useCallback, useEffect, useState } from 'react'
import type { AdminSessionInfo, Me } from '../types/admin'
import { api } from '../utils/api'

// Who is signed in to the admin site.
//
// Only an account with the Admin role counts as signed in here. If someone
// without it signs in, they are signed straight back out, so a normal user's
// session never stays open on the admin site.
//
// Once an admin is confirmed, /api/admin/session says whether they are the
// root admin, which the header shows with its own badge color.

export type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'admin'; email: string; isRoot: boolean }

const NotAdmin = 'This account does not have admin access.'

function isAdmin(me: Me) {
  return me.email !== null && me.roles.includes('Admin')
}

async function loadAdmin(): Promise<Session> {
  const info = await api<AdminSessionInfo>('/admin/session')
  return { status: 'admin', email: info.email, isRoot: info.isRootAdmin }
}

export function useSession() {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    api<Me>('/auth/me')
      .then((me) => (isAdmin(me) ? loadAdmin() : ({ status: 'signedOut' } as Session)))
      .then((s) => {
        if (!cancelled) setSession(s)
      })
      .catch(() => {
        if (!cancelled) setSession({ status: 'signedOut' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const me = await api<Me>('/auth/signin', {
      method: 'POST',
      body: { email, password },
    })

    if (!isAdmin(me)) {
      await api('/auth/signout', { method: 'POST' })
      throw new Error(NotAdmin)
    }

    setSession(await loadAdmin())
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api('/auth/signout', { method: 'POST' })
    } finally {
      setSession({ status: 'signedOut' })
    }
  }, [])

  return { session, signIn, signOut }
}