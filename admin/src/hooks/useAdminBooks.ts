import { useCallback, useEffect, useState } from 'react'
import type { BooksResponse } from '../types/books'
import { api } from '../utils/api'

// Loads the Books page: every book in the study data, or only the books of
// one study (study = its number). Changing the study loads again.
//
// Each result is kept with the study it belongs to, so switching studies
// never shows the other study's books for a moment.

type Loaded = { study: number | null; data: BooksResponse }

export function useAdminBooks(study: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const path = study === null ? '/admin/books' : `/admin/books?study=${study}`
      setLoaded({ study, data: await api<BooksResponse>(path) })
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