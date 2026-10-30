import { useLang } from '../../i18n/languageContext'
import { AUTH } from '../../i18n/strings/auth'
import { questionText } from '../../i18n/strings/questions'
import { useStrings } from '../../i18n/useStrings'
import type { RecoveryQuestion } from '../../utils/authApi'
import { MAX_ANSWER, type RecoveryValue } from '../../utils/recoveryRules'
import { PillSelect } from '../forms/PillSelect'
import { PinField } from '../forms/PinField'
import { TextPillField } from '../forms/TextPillField'

// The PIN, confirm PIN, security question, and answer. Used on Create
// Account and at the end of Forgot password.

type Props = {
  idPrefix: string
  value: RecoveryValue
  onChange: (value: RecoveryValue) => void
  questions: RecoveryQuestion[]
}

export function RecoveryFields({ idPrefix, value, onChange, questions }: Props) {
  const { lang } = useLang()
  const t = useStrings(AUTH)

  function set<K extends keyof RecoveryValue>(key: K, next: RecoveryValue[K]) {
    onChange({ ...value, [key]: next })
  }

  return (
    <>
      <PinField
        id={`${idPrefix}-pin`}
        label={t.pin}
        value={value.pin}
        onChange={(v) => set('pin', v)}
        hint={t.pinHint}
      />
      <PinField
        id={`${idPrefix}-pin-again`}
        label={t.confirmPin}
        value={value.pinAgain}
        onChange={(v) => set('pinAgain', v)}
      />
      <PillSelect
        id={`${idPrefix}-question`}
        label={t.securityQuestion}
        value={value.questionId}
        onChange={(v) => set('questionId', v)}
        placeholder={questions.length ? t.chooseQuestion : t.loadingQuestions}
        options={questions.map((q) => ({
          value: String(q.id),
          label: questionText(lang, q.id, q.text),
        }))}
      />
      <TextPillField
        id={`${idPrefix}-answer`}
        label={t.answer}
        value={value.answer}
        onChange={(v) => set('answer', v)}
        autoComplete="off"
        maxLength={MAX_ANSWER}
        hint={t.answerHint}
      />
    </>
  )
}