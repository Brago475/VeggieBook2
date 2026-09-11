import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

// The covers offered while browsing one vegetable on the cover screen: its
// own cover, any shared covers, then its recipes' photos. The same catalog
// checks the cover when the book is saved (api/Covers/CoverCatalog.cs).
//
// Each vegetable's list is fetched once and kept for the rest of the visit,
// so switching back and forth between vegetables is instant.

type CoversResponse = { vegetable: string; covers: string[] }
type Loaded = { code: string; covers: string[] }
type Failed = { code: string; message: string }

const cache = new Map<string, string[]>()

export function useCovers(vegetableCode: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState<Failed | null>(null)

  useEffect(() => {
    if (cache.has(vegetableCode)) return
    let cancelled = false

    apiFetch<CoversResponse>(`/covers?vegetable=${encodeURIComponent(vegetableCode)}`)
      .then((res) => {
        cache.set(vegetableCode, res.covers)
        if (!cancelled) setLoaded({ code: vegetableCode, covers: res.covers })
      })
      .catch((err) => {
        if (!cancelled) {
          setFailed({
            code: vegetableCode,
            message: err instanceof Error ? err.message : 'Could not load covers.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [vegetableCode])

  const covers =
    cache.get(vegetableCode) ??
    (loaded?.code === vegetableCode ? loaded.covers : null)
  const error = !covers && failed?.code === vegetableCode ? failed.message : null

  return { covers, error }
}