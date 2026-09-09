import { useEffect, useState } from 'react'
import type { RecipeDetail } from '../types'

// Loads one recipe's full content. The review flow shows recipes one at a
// time, so fetching per card avoids pulling detail for recipes the user
// drops without ever seeing.

export function useRecipeDetail(id: number | null) {
  const [detail, setDetail] = useState<RecipeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id === null) return

    let cancelled = false
    setDetail(null)
    setError(null)

    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })

    // Guards against a slow response for a recipe the user already passed.
    return () => {
      cancelled = true
    }
  }, [id])

  return { detail, error }
}