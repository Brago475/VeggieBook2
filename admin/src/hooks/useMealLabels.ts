import { useCallback, useEffect, useRef, useState } from 'react'
import { itemKey, sortMeals } from '../components/playlists/playlistFormat'
import type { LabelItem, MealKey, MealLabelsResponse } from '../types/playlists'
import { fetchMealLabels, saveMealLabels } from '../utils/playlistsApi'

// Loads the Meal labels screen and saves one chip at a time. A tap shows
// right away and is undone if the save fails. One save per item at a time.

export function useMealLabels() {
  const [data, setData] = useState<MealLabelsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const busy = useRef<Set<string>>(new Set())

  useEffect(() => {
    let live = true
    fetchMealLabels()
      .then((d) => live && setData(d))
      .catch((err) => live && setError((err as Error).message))
    return () => {
      live = false
    }
  }, [])

  const update = useCallback((item: LabelItem, meals: MealKey[]) => {
    setData((prev) => {
      if (!prev) return prev
      const swap = (list: LabelItem[]) =>
        list.map((i) => (i.kind === item.kind && i.id === item.id ? { ...i, meals } : i))
      return item.kind === 'recipe' ? { ...prev, recipes: swap(prev.recipes) } : { ...prev, tips: swap(prev.tips) }
    })
  }, [])

  const mark = useCallback((key: string, on: boolean) => {
    if (on) busy.current.add(key)
    else busy.current.delete(key)
    setPending(new Set(busy.current))
  }, [])

  const toggle = useCallback(
    async (item: LabelItem, meal: MealKey) => {
      const key = itemKey(item.kind, item.id)
      if (busy.current.has(key)) return

      const next = sortMeals(
        item.meals.includes(meal) ? item.meals.filter((m) => m !== meal) : [...item.meals, meal],
      )
      mark(key, true)
      update(item, next)
      try {
        const saved = await saveMealLabels(item.kind, item.id, next)
        update(item, saved.meals)
        setError(null)
      } catch (err) {
        update(item, item.meals)
        setError((err as Error).message)
      } finally {
        mark(key, false)
      }
    },
    [mark, update],
  )

  return { data, error, pending, toggle }
}