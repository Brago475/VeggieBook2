import { useCallback, useEffect, useState } from 'react'
import { getCombos, removeCombo, type Combo } from '../api/combosApi'

// The account's saved combos.

export function useCombos() {
  const [combos, setCombos] = useState<Combo[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setCombos(await getCombos())
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
      await removeCombo(id)
      await load()
    },
    [load],
  )

  return { combos, error, reload: load, remove }
}