import { useCallback, useEffect, useState } from 'react'
import type { Me } from '../types/admin'
import { api } from '../utils/api'

// Who is signed in to the admin site.
//
// Only an account with the Admin role counts as signed in here. If someone
// without it signs in, they are signed straight back out, so a normal user's
// session never stays open on the admin site.

export type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'admin'; email: string }

const NotAdmin = 'This account does not have admin access.'

function isAdmin(me: Me) {
  return me.email !== null && me.roles.includes('Admin')
}

export function useSession() {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    api<Me>('/auth/me')
      .then((me) => {
        if (cancelled) return
        setSession(isAdmin(me) ? { status: 'admin', email: me.email! } : { status: 'signedOut' })
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

    setSession({ status: 'admin', email: me.email! })
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