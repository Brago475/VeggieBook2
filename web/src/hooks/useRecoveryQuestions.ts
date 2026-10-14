import { useEffect, useState } from 'react'
import { RULES } from '../i18n/strings/rules'
import { useStrings } from '../i18n/useStrings'
import { getRecoveryQuestions, type RecoveryQuestion } from '../utils/authApi'

// The list of security questions, loaded once for a form.

export function useRecoveryQuestions() {
  const t = useStrings(RULES)
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([])
  const [failed, setFailed] = useState<{ message: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    getRecoveryQuestions()
      .then((list) => {
        if (!cancelled) setQuestions(list)
      })
      .catch((err) => {
        if (!cancelled) setFailed({ message: err instanceof Error ? err.message : null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const error = failed ? (failed.message ?? t.questionsError) : null

  return { questions, error }
}