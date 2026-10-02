import { useEffect, useState, type FormEvent } from 'react'
import { useRecoveryQuestions } from '../hooks/useRecoveryQuestions'
import {
  getRecoverySettings,
  saveRecoverySettings,
  type RecoverySettings,
} from '../utils/authApi'
import {
  checkRecovery,
  EMPTY_RECOVERY,
  MAX_ANSWER,
  toNewRecovery,
  type RecoveryValue,
} from '../utils/recoveryRules'
import { KeyIcon } from './LibraryIcons'
import { PasswordField } from './PasswordField'
import '../styles/recovery-card.css'

// Password recovery, on the account settings screen: shows whether a PIN
// and security question are set, and which question, and lets the owner
// change them. Asks for the current password first.
//
// Saving also clears a locked password reset (see AccountRecovery.cs),
// since knowing the password proves it is their account.

export function RecoveryCard() {
  const { questions } = useRecoveryQuestions()

  const [settings, setSettings] = useState<RecoverySettings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [value, setValue] = useState<RecoveryValue>(EMPTY_RECOVERY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRecoverySettings()
      .then((s) => {
        if (!cancelled) setSettings(s)
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Could not load this card.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function set<K extends keyof RecoveryValue>(key: K, next: RecoveryValue[K]) {
    setValue((v) => ({ ...v, [key]: next }))
  }

  function close() {
    setOpen(false)
    setCurrent('')
    setValue(EMPTY_RECOVERY)
    setError(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const problem = (current ? null : 'Enter your current password.') ?? checkRecovery(value)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await saveRecoverySettings(current, toNewRecovery(value))
      const chosen = questions.find((q) => String(q.id) === value.questionId)
      setSettings({
        hasPin: true,
        questionId: Number(value.questionId),
        question: chosen?.text ?? null,
      })
      close()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const isSet = settings !== null && settings.hasPin && settings.question !== null

  const summary = settings === null
    ? 'Loading...'
    : isSet
      ? 'Your recovery PIN and security question are set. You use them if you forget your password.'
      : 'Set a recovery PIN and security question so you can reset a forgotten password.'

  return (
    <div className="account-card recovery-card">
      <div className="account-card-head">
        <span className="account-card-icon">
          <KeyIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">Password recovery</h2>
          <p className="account-card-text">{summary}</p>
        </div>
      </div>

      {isSet && <p className="recovery-question">Your question: {settings.question}</p>}

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}
      {done && (
        <p className="form-success" role="status">
          Saved. Use your new PIN and question if you forget your password.
        </p>
      )}

      {!open && settings !== null && (
        <button
          type="button"
          className="account-primary"
          onClick={() => {
            setOpen(true)
            setDone(false)
          }}
        >
          {isSet ? 'Change PIN and question' : 'Set PIN and question'}
        </button>
      )}

      {open && (
        <form className="recovery-form" onSubmit={submit} noValidate>
          <PasswordField
            id="recovery-current-password"
            label="Current password"
            autoComplete="current-password"
            value={current}
            onChange={setCurrent}
          />

          <div className="field">
            <label className="field-label" htmlFor="recovery-pin">
              New 6-digit PIN
            </label>
            <input
              id="recovery-pin"
              className="field-input recovery-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={6}
              value={value.pin}
              onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
              aria-describedby="recovery-pin-hint"
            />
            <p className="field-hint" id="recovery-pin-hint">
              Avoid easy ones like 123456 or 111111.
            </p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="recovery-pin-again">
              Confirm PIN
            </label>
            <input
              id="recovery-pin-again"
              className="field-input recovery-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={6}
              value={value.pinAgain}
              onChange={(e) =>
                set('pinAgain', e.target.value.replace(/\D/g, '').slice(0, 6))
              }
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="recovery-question">
              Security question
            </label>
            <select
              id="recovery-question"
              className="field-input field-select"
              value={value.questionId}
              onChange={(e) => set('questionId', e.target.value)}
            >
              <option value="" disabled>
                {questions.length ? 'Choose a question' : 'Loading questions...'}
              </option>
              {questions.map((q) => (
                <option key={q.id} value={String(q.id)}>
                  {q.text}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="recovery-answer">
              Your answer
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
              Capital letters and extra spaces don't matter.
            </p>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="recovery-actions">
            <button type="submit" className="account-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Save PIN and question'}
            </button>
            <button type="button" className="link-btn" onClick={close} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}