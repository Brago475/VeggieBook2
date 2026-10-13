import { useCallback, useEffect, useState } from 'react'
import type { ContentLibrary } from '../types/content'
import { api } from '../utils/api'

// The full content library with kept and taken-out counts. A failed reload
// keeps the last data on screen.

export function useContentLibrary() {
  const [data, setData] = useState<ContentLibrary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await api<ContentLibrary>('/admin/content/library')
      setData(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the content.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, loading, reload: load }
}