import { useCallback, useEffect, useState } from 'react'
import { getCustomFoods, removeCustomFood, type CustomFood } from '../api/customFoodsApi'

// The account's own foods.

export function useCustomFoods() {
  const [foods, setFoods] = useState<CustomFood[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setFoods(await getCustomFoods())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remove = useCallback(
    async (id: number) => {
      await removeCustomFood(id)
      await load()
    },
    [load],
  )

  return { foods, error, reload: load, remove }
}