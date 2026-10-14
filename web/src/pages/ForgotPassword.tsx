import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowIcon } from '../components/icons/AuthIcons'
import { AuthPasswordField } from '../components/forms/AuthPasswordField'
import { AuthShell } from '../components/auth/AuthShell'
import { EmailField } from '../components/forms/EmailField'
import { LegalContact } from '../components/layout/LegalPage'
import { PinField } from '../components/forms/PinField'
import { RecoveryFields } from '../components/auth/RecoveryFields'
import { TextPillField } from '../components/forms/TextPillField'
import { useRecoveryQuestions } from '../hooks/useRecoveryQuestions'
import { useLang } from '../i18n/languageContext'
import { AUTH } from '../i18n/strings/auth'
import { COMMON } from '../i18n/strings/common'
import { FORGOT } from '../i18n/strings/forgot'
import { useStrings } from '../i18n/useStrings'
import { ApiError } from '../utils/api'
import {
  checkRecoveryAnswer,
  checkRecoveryPin,
  finishPasswordReset,
  getQuestionFor,
  type RecoveryQuestion,
} from '../utils/authApi'
import { checkPassword, passwordHint } from '../utils/passwordRule'
import { checkRecovery, EMPTY_RECOVERY, MAX_ANSWER, toNewRecovery } from '../utils/recoveryRules'

// Forgot password, without email. One page, several steps:
//
//   email     which account
//   pin       the 6-digit PIN (3 tries a day)
//   question  the security question, if they forgot the PIN or used up
//             their PIN tries (3 tries a day)
//   reset     a new password, a new PIN, and a new question
//   done      sign in with the new password
//   locked    3 wrong answers: password reset is locked until the admin
//             unlocks it. Signing in with the password still works.

type Props = {
  onBack?: () => void
  onSignIn: () => void
}

type Step = 'email' | 'pin' | 'question' | 'reset' | 'done' | 'locked'

export function ForgotPassword({ onBack, onSignIn }: Props) {
  const { lang } = useLang()
  const t = useStrings(FORGOT)
  const auth = useStrings(AUTH)
  const common = useStrings(COMMON)
  const { questions } = useRecoveryQuestions()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [question, setQuestion] = useState<RecoveryQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [ticket, setTicket] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [recovery, setRecovery] = useState(EMPTY_RECOVERY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const address = email.trim()

  function message(err: unknown) {
    return err instanceof Error ? err.message : common.somethingWrong
  }

  function go(next: Step) {
    setError(null)
    setStep(next)
  }

  function startOver() {
    setPin('')
    setAnswer('')
    setNotice(null)
    setTicket(null)
    setPassword('')
    setPasswordAgain('')
    setRecovery(EMPTY_RECOVERY)
    go('email')
  }

  // Loads this email's question, then shows the question step.
  async function openQuestion(note: string | null) {
    try {
      setQuestion(await getQuestionFor(address))
      setAnswer('')
      setNotice(note)
      go('question')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'locked') go('locked')
      else setError(message(err))
    }
  }

  // Runs one request, and handles the answers every step shares.
  async function run(task: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'locked') go('locked')
      else if (err instanceof ApiError && err.code === 'pinClosed') await openQuestion(err.message)
      else setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!address) {
      setError(auth.enterEmail)
      return
    }
    setPin('')
    go('pin')
  }

  function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pin.length !== 6) {
      setError(t.enterPin)
      return
    }
    void run(async () => {
      setTicket(await checkRecoveryPin(address, pin))
      go('reset')
    })
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!answer.trim()) {
      setError(t.enterAnswer)
      return
    }
    void run(async () => {
      setTicket(await checkRecoveryAnswer(address, answer))
      go('reset')
    })
  }

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ticket) {
      startOver()
      return
    }
    const problem =
      checkPassword(password, lang) ??
      (password === passwordAgain ? null : auth.passwordsDiffer) ??
      checkRecovery(recovery, lang)
    if (problem) {
      setError(problem)
      return
    }
    void run(async () => {
      await finishPasswordReset(address, ticket, password, toNewRecovery(recovery))
      go('done')
    })
  }

  const errorLine = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  )

  function submitButton(label: string): ReactNode {
    return (
      <button type="submit" className="auth-primary" disabled={busy}>
        {busy ? common.pleaseWait : label}
        {!busy && <ArrowIcon />}
      </button>
    )
  }

  if (step === 'done') {
    return (
      <AuthShell>
        <div className="auth-head">
          <h1 className="auth-greeting">{t.doneTitle}</h1>
          <p className="auth-sub">{t.doneSub}</p>
        </div>
        <div className="auth-fields">
          <button type="button" className="auth-primary" onClick={onSignIn}>
            {auth.signIn}
            <ArrowIcon />
          </button>
        </div>
      </AuthShell>
    )
  }

  if (step === 'locked') {
    return (
      <AuthShell onBack={onBack}>
        <div className="auth-head">
          <h1 className="auth-greeting">{t.lockedTitle}</h1>
          <p className="auth-sub">{t.lockedSub}</p>
        </div>
        <div className="auth-fields">
          <div className="auth-contact">
            <LegalContact />
          </div>
          <button type="button" className="auth-primary" onClick={onSignIn}>
            {t.backToSignIn}
            <ArrowIcon />
          </button>
        </div>
      </AuthShell>
    )
  }

  if (step === 'pin') {
    return (
      <AuthShell onBack={() => go('email')}>
        <form className="auth-form" onSubmit={submitPin} noValidate>
          <div className="auth-head">
            <h1 className="auth-greeting">{t.pinTitle}</h1>
            <p className="auth-sub">
              {t.pinSubBefore}
              <strong>{address}</strong>.
            </p>
          </div>
          <div className="auth-fields">
            <PinField id="forgot-pin" label={t.recoveryPin} value={pin} onChange={setPin} />
            {errorLine}
            {submitButton(t.continue)}
            <p className="auth-switch">
              <button
                type="button"
                className="link-btn"
                disabled={busy}
                onClick={() => void run(() => openQuestion(null))}
              >
                {t.noPin}
              </button>
            </p>
          </div>
        </form>
      </AuthShell>
    )
  }

  if (step === 'question') {
    return (
      <AuthShell onBack={() => go('pin')}>
        <form className="auth-form" onSubmit={submitAnswer} noValidate>
          <div className="auth-head">
            <h1 className="auth-greeting">{t.questionTitle}</h1>
            {notice && <p className="auth-notice">{notice}</p>}
          </div>
          <div className="auth-fields">
            <p className="auth-question">{question?.text}</p>
            <TextPillField
              id="forgot-answer"
              label={auth.answer}
              value={answer}
              onChange={setAnswer}
              autoComplete="off"
              maxLength={MAX_ANSWER}
              hint={auth.answerHint}
            />
            {errorLine}
            {submitButton(t.continue)}
          </div>
        </form>
      </AuthShell>
    )
  }

  if (step === 'reset') {
    return (
      <AuthShell onBack={startOver}>
        <form className="auth-form" onSubmit={submitReset} noValidate>
          <div className="auth-head">
            <h1 className="auth-greeting">{t.resetTitle}</h1>
            <p className="auth-sub">{t.resetSub}</p>
          </div>
          <div className="auth-fields">
            {/* Lets password managers save the new password under this email. */}
            <input type="email" autoComplete="username" value={address} readOnly hidden />

            <AuthPasswordField
              id="forgot-new-password"
              label={t.newPassword}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint={passwordHint(lang)}
            />
            <AuthPasswordField
              id="forgot-new-password-again"
              label={t.confirmNewPassword}
              value={passwordAgain}
              onChange={setPasswordAgain}
              autoComplete="new-password"
            />

            <h2 className="auth-section-title">{auth.recoveryTitle}</h2>
            <RecoveryFields
              idPrefix="forgot"
              value={recovery}
              onChange={setRecovery}
              questions={questions}
            />

            {errorLine}
            {submitButton(t.saveFinish)}
            {error && (
              <p className="auth-switch">
                {t.takingLong}{' '}
                <button type="button" className="link-btn" onClick={startOver}>
                  {t.startAgain}
                </button>
              </p>
            )}
          </div>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell onBack={onBack}>
      <form className="auth-form" onSubmit={submitEmail} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">{t.emailTitle}</h1>
          <p className="auth-sub">{t.emailSub}</p>
        </div>
        <div className="auth-fields">
          <EmailField id="forgot-email" value={email} onChange={setEmail} />
          {errorLine}
          {submitButton(t.continue)}
        </div>
      </form>
    </AuthShell>
  )
}