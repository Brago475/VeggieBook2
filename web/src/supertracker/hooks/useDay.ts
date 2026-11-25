import { useCallback, useEffect, useState } from 'react'
import { deleteEntry, getDay, type Day } from '../api/foodLogApi'

// One day of the food log, reloaded after every change.

export function useDay(date: string) {
  const [day, setDay] = useState<Day | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      setDay(await getDay(date))
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load])

  const remove = useCallback(
    async (id: number) => {
      await deleteEntry(id)
      await load()
    },
    [load],
  )

  return { day, error, reload: load, remove }
}