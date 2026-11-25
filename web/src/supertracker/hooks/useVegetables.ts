import { useEffect, useState } from 'react'
import { getVegetables, type VegetableChoice } from '../api/foodLogApi'

// The VeggieBook vegetables with their per-cup amounts, loaded once.

export function useVegetables() {
  const [list, setList] = useState<VegetableChoice[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    getVegetables()
      .then((items) => live && setList(items))
      .catch((err) => live && setError(err instanceof Error ? err.message : ''))
    return () => {
      live = false
    }
  }, [])

  return { list, error }
}