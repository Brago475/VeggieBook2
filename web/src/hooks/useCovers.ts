import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../utils/api'

// The covers offered while browsing one vegetable on the cover screen: its
// own cover, any shared covers, then its recipes' photos. The same catalog
// checks the cover when the book is saved (api/Covers/CoverCatalog.cs).
//
// Each vegetable's list is fetched once per visit to the cover screen and
// kept while the screen is open, so switching back and forth between
// vegetables is instant. The cache lives with the hook rather than in the
// module, so it is dropped when the screen closes: a cover added or a
// recipe photo changed on the server shows up the next time the screen is
// opened, without a page reload.

type CoversResponse = { vegetable: string; covers: string[] }
type Failed = { code: string; message: string }

export function useCovers(vegetableCode: string) {
  const cache = useRef(new Map<string, string[]>())
  const [, bump] = useState(0)
  const [failed, setFailed] = useState<Failed | null>(null)

  useEffect(() => {
    if (cache.current.has(vegetableCode)) return
    let cancelled = false

    apiFetch<CoversResponse>(`/covers?vegetable=${encodeURIComponent(vegetableCode)}`)
      .then((res) => {
        // A response that arrives after the screen has moved on is still
        // worth keeping: it is this vegetable's list, correct whenever the
        // user comes back to it.
        cache.current.set(vegetableCode, res.covers)
        if (!cancelled) bump((n) => n + 1)
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

  const covers = cache.current.get(vegetableCode) ?? null
  const error = !covers && failed?.code === vegetableCode ? failed.message : null

  return { covers, error }
}