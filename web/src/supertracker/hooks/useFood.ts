import { useEffect, useState } from 'react'
import { getFood, type FoodDetail } from '../api/foodLogApi'

// One food's portions and per-100 g amounts, loaded when an id is set.

export function useFood(id: number | null) {
  const [food, setFood] = useState<FoodDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFood(null)
    setError(null)
    if (id === null) return

    let live = true
    getFood(id)
      .then((item) => live && setFood(item))
      .catch((err) => live && setError(err instanceof Error ? err.message : ''))
    return () => {
      live = false
    }
  }, [id])

  return { food, error }
}