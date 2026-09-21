import { useEffect, useState } from 'react'
import type { RecipeDetail } from '../types'

// Loads one recipe's full content. The review flow shows recipes one at a
// time, so fetching per card avoids pulling detail for recipes the user
// drops without ever seeing.
//
// Every result is stored with the id it belongs to, and only returned
// while that id is still the one asked for. Before this, moving to a new
// recipe cleared the old content inside the effect, which runs after the
// screen has already drawn: for one frame the new title showed over the
// previous recipe's ingredients and photos, then flicked to the skeleton.
// Now a different id simply has no content yet, from the first frame.

type Loaded = {
  id: number
  detail: RecipeDetail | null
  error: string | null
}

export function useRecipeDetail(id: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (id === null) return

    let cancelled = false

    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: RecipeDetail) => {
        if (!cancelled) setLoaded({ id, detail: data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ id, detail: null, error: String(err) })
      })

    // Guards against a slow response for a recipe the user already passed.
    return () => {
      cancelled = true
    }
  }, [id])

  const current = loaded !== null && loaded.id === id ? loaded : null

  return {
    detail: current?.detail ?? null,
    error: current?.error ?? null,
  }
}