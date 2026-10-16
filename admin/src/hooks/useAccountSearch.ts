import { useEffect, useState } from 'react'
import type { AccountFilter, AccountSearchResponse } from '../types/settings'
import { api } from '../utils/api'

// Account search for Settings. Typing waits briefly before asking the
// server, and only the newest answer is shown.

const WAIT_MS = 250

export function useAccountSearch(search: string, filter: AccountFilter, take: number, refreshKey: number) {
  const [data, setData] = useState<AccountSearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ q: search.trim(), take: String(take) })
    if (filter !== 'all') params.set('filter', filter)

    const timer = window.setTimeout(() => {
      api<AccountSearchResponse>(`/admin/accounts?${params.toString()}`)
        .then((next) => {
          if (cancelled) return
          setData(next)
          setError(null)
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, WAIT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search, filter, take, refreshKey])

  return { data, error, loading }
}