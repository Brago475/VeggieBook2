import { useCallback, useEffect, useState } from 'react'
import type { ActivityResponse } from '../types/activity'
import { api } from '../utils/api'

// Loads the activity history, optionally limited to one study.
// Results are keyed by study so a stale response is never shown.

type Loaded = { study: number | null; data: ActivityResponse }

export function useActivity(study: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const path = study === null ? '/admin/activity' : `/admin/activity?study=${study}`
      setLoaded({ study, data: await api<ActivityResponse>(path) })
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [study])

  useEffect(() => {
    void load()
  }, [load])

  const data = loaded !== null && loaded.study === study ? loaded.data : null

  return { data, error, loading, reload: load }
}