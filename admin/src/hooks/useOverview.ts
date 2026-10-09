import { useCallback, useEffect, useState } from 'react'
import type { Overview } from '../types/admin'
import { api } from '../utils/api'

// Loads the Overview data and loads it again every minute, so the page
// stays current while it is open. A failed refresh keeps the last numbers
// on screen; only a failed first load shows an error.
//
// Refreshing pauses while the browser tab is hidden and catches up as soon
// as it is shown again.

const REFRESH_MS = 60_000

export function useOverview() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const next = await api<Overview>('/admin/overview')
      setData(next)
      setError(null)
      setUpdatedAt(new Date())
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  return { data, error, updatedAt, refresh: load }
}