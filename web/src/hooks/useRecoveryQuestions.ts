import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../i18n/languageContext'
import { questionText } from '../i18n/strings/questions'
import { RULES } from '../i18n/strings/rules'
import { useStrings } from '../i18n/useStrings'
import { getRecoveryQuestions, type RecoveryQuestion } from '../utils/authApi'

// The list of security questions, loaded once for a form, with each
// question's text in the site language.

export function useRecoveryQuestions() {
  const { lang } = useLang()
  const t = useStrings(RULES)
  const [loaded, setLoaded] = useState<RecoveryQuestion[]>([])
  const [failed, setFailed] = useState<{ message: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    getRecoveryQuestions()
      .then((list) => {
        if (!cancelled) setLoaded(list)
      })
      .catch((err) => {
        if (!cancelled) setFailed({ message: err instanceof Error ? err.message : null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const questions = useMemo(
    () => loaded.map((q) => ({ ...q, text: questionText(lang, q.id, q.text) })),
    [loaded, lang],
  )

  const error = failed ? (failed.message ?? t.questionsError) : null

  return { questions, error }
}