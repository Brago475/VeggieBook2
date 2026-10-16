import { useEffect, useState, type FormEvent } from 'react'
import { useHeld } from '../../hooks/useHeld'
import { useRecoveryQuestions } from '../../hooks/useRecoveryQuestions'
import { useLang } from '../../i18n/languageContext'
import { ACCOUNT } from '../../i18n/strings/account'
import { AUTH } from '../../i18n/strings/auth'
import { COMMON } from '../../i18n/strings/common'
import { questionText } from '../../i18n/strings/questions'
import { useStrings } from '../../i18n/useStrings'
import {
  getRecoverySettings,
  saveRecoverySettings,
  type RecoverySettings,
} from '../../utils/authApi'
import {
  checkRecovery,
  EMPTY_RECOVERY,
  MAX_ANSWER,
  toNewRecovery,
  type RecoveryValue,
} from '../../utils/recoveryRules'
import { KeyIcon } from '../icons/LibraryIcons'
import { PasswordField } from '../forms/PasswordField'
import { PinField } from '../forms/PinField'
import { AccountCardSkeleton, AccountTextSkeleton } from './AccountCardSkeleton'
import '../../styles/recovery-card.css'

// Password recovery, on the account settings screen: shows whether a PIN
// and security question are set, and which question, and lets the owner
// change them. Asks for the current password first, in a box the browser
// does not fill in on its own. Outlines show while the settings load.
//
// Saving also clears a locked password reset (see AccountRecovery.cs),
// since knowing the password proves it is their account.

export function RecoveryCard() {
  const { lang } = useLang()
  const t = useStrings(ACCOUNT)
  const auth = useStrings(AUTH)
  const common = useStrings(COMMON)
  const { questions } = useRecoveryQuestions()

  const [settings, setSettings] = useState<RecoverySettings | null>(null)
  const [loadFailed, setLoadFailed] = useState<{ message: string | null } | null>(null)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [value, setValue] = useState<RecoveryValue>(EMPTY_RECOVERY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const held = useHeld(settings === null && loadFailed === null)
  const loadError = loadFailed ? (loadFailed.message ?? t.loadCardError) : null

  useEffect(() => {
    let cancelled = false
    getRecoverySettings()
      .then((s) => {
        if (!cancelled) setSettings(s)
      })
      .catch((err) => {
        if (!cancelled) setLoadFailed({ message: err instanceof Error ? err.message : null })
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
      setSettings({
        hasPin: true,
        questionId: Number(value.questionId),
        question: chosen?.text ?? null,
      })
      close()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
    } finally {
      setBusy(false)
    }
  }

  const isSet = settings !== null && settings.hasPin && settings.question !== null

  // The question in the site language, by its id.
  const questionShown =
    isSet && settings.questionId !== null
      ? questionText(lang, settings.questionId, settings.question ?? '')
      : (settings?.question ?? null)

  const summary = settings === null ? t.rcLoading : isSet ? t.rcSet : t.rcNotSet

  return (
    <div className="account-card recovery-card" aria-busy={held}>
      <div className="account-card-head">
        <span className="account-card-icon">
          <KeyIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">{t.rcTitle}</h2>
          {held ? <AccountTextSkeleton lines={2} /> : <p className="account-card-text">{summary}</p>}
        </div>
      </div>

      {held && <AccountCardSkeleton />}

      {isSet && !held && (
        <p className="recovery-question">
          {t.rcYourQuestion} {questionShown}
        </p>
      )}

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}
      {done && (
        <p className="form-success" role="status">
          {t.rcSaved}
        </p>
      )}

      {!open && settings !== null && !held && (
        <button
          type="button"
          className="account-primary"
          onClick={() => {
            setOpen(true)
            setDone(false)
          }}
        >
          {isSet ? t.rcChange : t.rcSetButton}
        </button>
      )}

      {open && (
        <form className="recovery-form" onSubmit={submit} noValidate>
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
                  {q.text}
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
            <button type="button" className="link-btn" onClick={close} disabled={busy}>
              {common.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}