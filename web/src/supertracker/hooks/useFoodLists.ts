import { useCallback, useEffect, useState } from 'react'
import { getFavoriteFoods, getRecentFoods, type FoodHit } from '../api/foodLogApi'

// The account's recent foods and favorites, shown before any search.

export function useFoodLists() {
  const [recent, setRecent] = useState<FoodHit[]>([])
  const [favorites, setFavorites] = useState<FoodHit[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [r, f] = await Promise.all([getRecentFoods(), getFavoriteFoods()])
      setRecent(r)
      setFavorites(f)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { recent, favorites, error, reload: load }
}