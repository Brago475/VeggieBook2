import { useCallback, useEffect, useState } from 'react'
import type { StudiesResponse, StudySummary } from '../types/studies'
import { api } from '../utils/api'

// Loads the Studies page, switches a study on or off, and renames or
// deletes a study.
//
// After each change, the whole page loads again, so the list, the numbers,
// and the preview all agree with the server. A failed change keeps the page
// as it was and returns the API's message for the page to show.

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

  // Runs one change, then loads again. Returns null when it worked, or the
  // error message.
  const change = useCallback(
    async (run: () => Promise<unknown>): Promise<string | null> => {
      try {
        await run()
        await load()
        return null
      } catch (err) {
        await load()
        return (err as Error).message
      }
    },
    [load],
  )

  const switchStudy = useCallback(
    (on: boolean) =>
      change(() => api<StudySummary>(on ? '/admin/studies/start' : '/admin/studies/stop', { method: 'POST' })),
    [change],
  )

  // An empty name goes back to plain "Study N".
  const renameStudy = useCallback(
    (id: number, name: string) =>
      change(() => api<StudySummary>(`/admin/studies/${id}/name`, { method: 'POST', body: { name } })),
    [change],
  )

  // confirm is what the admin typed; it must match the study's name.
  const deleteStudy = useCallback(
    (id: number, confirm: string) =>
      change(() => api(`/admin/studies/${id}`, { method: 'DELETE', body: { confirm } })),
    [change],
  )

  return { data, error, loading, reload: load, switchStudy, renameStudy, deleteStudy }
}