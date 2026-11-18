import { useState, type FormEvent } from 'react'
import { useRecoveryQuestions } from '../../hooks/useRecoveryQuestions'
import { useLang } from '../../i18n/languageContext'
import { ACCOUNT } from '../../i18n/strings/account'
import { AUTH } from '../../i18n/strings/auth'
import { COMMON } from '../../i18n/strings/common'
import { questionText } from '../../i18n/strings/questions'
import { useStrings } from '../../i18n/useStrings'
import { saveRecoverySettings, type RecoverySettings } from '../../utils/authApi'
import {
  checkRecovery,
  EMPTY_RECOVERY,
  MAX_ANSWER,
  toNewRecovery,
  type RecoveryValue,
} from '../../utils/recoveryRules'
import { PasswordField } from '../forms/PasswordField'
import { PinField } from '../forms/PinField'
import '../../styles/recovery-card.css'

// The change PIN and question form inside SecurityCard. Asks for the
// current password first, in a box the browser does not fill in on its own.
// The PIN and question are saved together. The answer always starts empty.
//
// Saving also clears a locked password reset (see AccountRecovery.cs),
// since knowing the password proves it is their account.

type Props = {
  onSaved: (settings: RecoverySettings) => void
  onCancel: () => void
}

export function RecoveryForm({ onSaved, onCancel }: Props) {
  const { lang } = useLang()
  const t = useStrings(ACCOUNT)
  const auth = useStrings(AUTH)
  const common = useStrings(COMMON)
  const { questions } = useRecoveryQuestions()

  const [current, setCurrent] = useState('')
  const [value, setValue] = useState<RecoveryValue>(EMPTY_RECOVERY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof RecoveryValue>(key: K, next: RecoveryValue[K]) {
    setValue((v) => ({ ...v, [key]: next }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const problem = (current ? null : t.enterCurrent) ?? checkRecovery(value, lang)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await saveRecoverySettings(current, toNewRecovery(value))
      const chosen = questions.find((q) => String(q.id) === value.questionId)
      onSaved({
        hasPin: true,
        questionId: Number(value.questionId),
        question: chosen?.text ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
      setBusy(false)
    }
  }

  return (
    <form className="security-form recovery-form" onSubmit={submit} noValidate>
      <PasswordField
        id="recovery-current-password"
        label={t.currentPassword}
        autoComplete="off"
        value={current}
        onChange={setCurrent}
        noAutofill
      />

      <PinField
        id="recovery-pin"
        label={t.rcNewPin}
        value={value.pin}
        onChange={(v) => set('pin', v)}
        hint={t.rcPinHint}
        variant="card"
      />

      <PinField
        id="recovery-pin-again"
        label={auth.confirmPin}
        value={value.pinAgain}
        onChange={(v) => set('pinAgain', v)}
        variant="card"
      />

      <div className="field">
        <label className="field-label" htmlFor="recovery-question">
          {auth.securityQuestion}
        </label>
        <select
          id="recovery-question"
          className="field-input field-select"
          value={value.questionId}
          onChange={(e) => set('questionId', e.target.value)}
        >
          <option value="" disabled>
            {questions.length ? auth.chooseQuestion : auth.loadingQuestions}
          </option>
          {questions.map((q) => (
            <option key={q.id} value={String(q.id)}>
              {questionText(lang, q.id, q.text)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="recovery-answer">
          {auth.answer}
        </label>
        <input
          id="recovery-answer"
          className="field-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_ANSWER}
          value={value.answer}
          onChange={(e) => set('answer', e.target.value)}
          aria-describedby="recovery-answer-hint"
        />
        <p className="field-hint" id="recovery-answer-hint">
          {auth.answerHint}
        </p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="recovery-actions">
        <button type="submit" className="account-primary" disabled={busy}>
          {busy ? t.saving : t.rcSave}
        </button>
        <button type="button" className="link-btn" onClick={onCancel} disabled={busy}>
          {common.cancel}
        </button>
      </div>
    </form>
  )
}