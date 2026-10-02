import type { RecoveryQuestion } from '../utils/authApi'
import { MAX_ANSWER, type RecoveryValue } from '../utils/recoveryRules'
import { PillSelect } from './PillSelect'
import { PinField } from './PinField'
import { TextPillField } from './TextPillField'

// The PIN, confirm PIN, security question, and answer. Used on Create
// Account and at the end of Forgot password.

type Props = {
  idPrefix: string
  value: RecoveryValue
  onChange: (value: RecoveryValue) => void
  questions: RecoveryQuestion[]
}

export function RecoveryFields({ idPrefix, value, onChange, questions }: Props) {
  function set<K extends keyof RecoveryValue>(key: K, next: RecoveryValue[K]) {
    onChange({ ...value, [key]: next })
  }

  return (
    <>
      <PinField
        id={`${idPrefix}-pin`}
        label="6-digit recovery PIN"
        value={value.pin}
        onChange={(v) => set('pin', v)}
        hint="You'll use this if you forget your password. Avoid easy ones like 123456."
      />
      <PinField
        id={`${idPrefix}-pin-again`}
        label="Confirm PIN"
        value={value.pinAgain}
        onChange={(v) => set('pinAgain', v)}
      />
      <PillSelect
        id={`${idPrefix}-question`}
        label="Security question"
        value={value.questionId}
        onChange={(v) => set('questionId', v)}
        placeholder={questions.length ? 'Choose a question' : 'Loading questions...'}
        options={questions.map((q) => ({ value: String(q.id), label: q.text }))}
      />
      <TextPillField
        id={`${idPrefix}-answer`}
        label="Your answer"
        value={value.answer}
        onChange={(v) => set('answer', v)}
        autoComplete="off"
        maxLength={MAX_ANSWER}
        hint="Capital letters and extra spaces don't matter."
      />
    </>
  )
}