import { useEffect, useState } from 'react'
import { searchFoods, type FoodHit } from '../api/foodLogApi'

// Food search that waits for typing to pause. Needs 2 or more letters.

const WAIT_MS = 250

export function useFoodSearch(query: string, category: string | null) {
  const [results, setResults] = useState<FoodHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let live = true
    setLoading(true)
    const timer = window.setTimeout(() => {
      searchFoods(q, category)
        .then((items) => {
          if (!live) return
          setResults(items)
          setError(null)
        })
        .catch((err) => live && setError(err instanceof Error ? err.message : ''))
        .finally(() => live && setLoading(false))
    }, WAIT_MS)

    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [query, category])

  return { results, loading, error }
}