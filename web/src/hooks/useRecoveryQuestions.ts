import { useEffect, useState } from 'react'
import { getRecoveryQuestions, type RecoveryQuestion } from '../utils/authApi'

// The list of security questions, loaded once for a form.
export function useRecoveryQuestions() {
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getRecoveryQuestions()
      .then((list) => {
        if (!cancelled) setQuestions(list)
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Could not load the questions.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { questions, error }
}