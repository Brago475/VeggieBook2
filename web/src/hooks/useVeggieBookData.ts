import { useEffect, useState } from 'react'
import type { Question, Vegetable } from '../types'

// Loads the two lists the flow needs up front. Both are small and static,
// so fetching them together on mount avoids a spinner between screens.

export function useVeggieBookData() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/vegetables').then((r) => {
        if (!r.ok) throw new Error(`vegetables: HTTP ${r.status}`)
        return r.json()
      }),
      fetch('/api/questions').then((r) => {
        if (!r.ok) throw new Error(`questions: HTTP ${r.status}`)
        return r.json()
      }),
    ])
      .then(([vegs, qs]) => {
        setVegetables(vegs)
        setQuestions(qs)
      })
      .catch((err) => setError(String(err)))
  }, [])

  const loading = !error && vegetables.length === 0

  return { vegetables, questions, error, loading }
}