import { useCallback, useEffect, useState } from 'react'
import type { ParticipantsResponse } from '../types/participants'
import { api } from '../utils/api'

// Loads the Participants page, and turns a person's tracking off or back on
// (an admin's turn-off only; someone who turned it off themselves can only
// turn it back on in Settings).
//
// After a change the whole page loads again, so the counts, tabs, and cards
// agree with the server. A failed change returns the API's message.

export function useParticipants() {
  const [data, setData] = useState<ParticipantsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api<ParticipantsResponse>('/admin/participants'))
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
  const setTracking = useCallback(
    async (researchId: string, on: boolean): Promise<string | null> => {
      try {
        const path = `/admin/participants/${encodeURIComponent(researchId)}/${on ? 'tracking-on' : 'tracking-off'}`
        await api(path, { method: 'POST' })
        await load()
        return null
      } catch (err) {
        await load()
        return (err as Error).message
      }
    },
    [load],
  )

  return { data, error, loading, reload: load, setTracking }
}