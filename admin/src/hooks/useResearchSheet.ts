import { useEffect, useState } from 'react'
import type { ResearchFilters, Sheet, SheetName } from '../types/research'
import { api } from '../utils/api'
import { researchQuery } from '../utils/researchQuery'

// Loads one research sheet with the page's filters.
//
// Each result is kept with the request it answers. While a new request is
// loading, the previous sheet stays on screen (with loading set), so the
// table doesn't flash empty every time a filter changes.
//
// `version` is bumped by the page's Refresh button to load again.

type Loaded = {
  key: string
  sheet: Sheet | null
  error: string | null
}

export function useResearchSheet(name: SheetName, filters: ResearchFilters, version: number) {
  const query = researchQuery(name, filters)
  const key = `${name}${query}#${version}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    api<Sheet>(`/admin/research/${name}${query}`)
      .then((sheet) => {
        if (!cancelled) setLoaded({ key, sheet, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setLoaded({ key, sheet: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [key, name, query])

  const current = loaded !== null && loaded.key === key ? loaded : null

  return {
    sheet: current?.sheet ?? loaded?.sheet ?? null,
    error: current?.error ?? null,
    loading: current === null,
  }
}