import { useCallback, useEffect, useState } from 'react'
import type { QaData } from '../types/questions'
import { api } from '../utils/api'

// Loads Question Analytics data, optionally limited to one study.
// Results are keyed by study so a stale response is never shown.

type Loaded = { study: number | null; data: QaData }

export function useQuestionData(study: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const path = study === null ? '/admin/question-analytics' : `/admin/question-analytics?study=${study}`
      setLoaded({ study, data: await api<QaData>(path) })
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