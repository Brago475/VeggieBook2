import { useCallback, useEffect, useState } from 'react'
import type { StudiesResponse, StudySummary } from '../types/studies'
import { api } from '../utils/api'

// Loads the Studies page and switches a study on or off.
//
// After switching, the whole page loads again, so the list, the numbers,
// and the preview all agree with the server. A failed switch keeps the page
// as it was and returns the API's message for the dialog to show.

export function useStudies() {
  const [data, setData] = useState<StudiesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api<StudiesResponse>('/admin/studies'))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Returns null when it worked, or the error message.
  const switchStudy = useCallback(
    async (on: boolean): Promise<string | null> => {
      try {
        await api<StudySummary>(on ? '/admin/studies/start' : '/admin/studies/stop', { method: 'POST' })
        await load()
        return null
      } catch (err) {
        await load()
        return (err as Error).message
      }
    },
    [load],
  )

  return { data, error, loading, reload: load, switchStudy }
}