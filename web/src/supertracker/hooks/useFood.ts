import { useCallback, useEffect, useState } from 'react'
import { getFood, setFavorite, type FoodDetail } from '../api/foodLogApi'

// One food's portions, per-100 g amounts and favorite star.

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

  const toggleFavorite = useCallback(async () => {
    if (!food) return
    const res = await setFavorite(food.id, !food.isFavorite)
    setFood({ ...food, isFavorite: res.isFavorite })
  }, [food])

  return { food, error, toggleFavorite }
}