import { useEffect, useState } from 'react'
import { useLang } from '../i18n/languageContext'
import type { Question, Vegetable } from '../types'

// Loads the two lists the flow needs up front, in the current language.
// Both are small and static, so fetching them together avoids a spinner
// between screens. A language change reloads them; the previous lists stay
// on screen until the new ones arrive.

export function useVeggieBookData() {
  const { lang } = useLang()
  const [vegetables, setVegetables] = useState<Vegetable[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true

    Promise.all([
      fetch(`/api/vegetables?lang=${lang}`).then((r) => {
        if (!r.ok) throw new Error(`vegetables: HTTP ${r.status}`)
        return r.json()
      }),
      fetch(`/api/questions?lang=${lang}`).then((r) => {
        if (!r.ok) throw new Error(`questions: HTTP ${r.status}`)
        return r.json()
      }),
    ])
      .then(([vegs, qs]) => {
        if (!current) return
        setVegetables(vegs)
        setQuestions(qs)
        setError(null)
      })
      .catch((err) => {
        if (current) setError(String(err))
      })

    return () => {
      current = false
    }
  }, [lang])

  const loading = !error && vegetables.length === 0

  return { vegetables, questions, error, loading }
}