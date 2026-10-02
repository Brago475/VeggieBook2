import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthPasswordField } from '../components/AuthPasswordField'
import { AuthShell } from '../components/AuthShell'
import { EmailField } from '../components/EmailField'
import { LegalContact } from '../components/LegalPage'
import { PinField } from '../components/PinField'
import { RecoveryFields } from '../components/RecoveryFields'
import { TextPillField } from '../components/TextPillField'
import { useRecoveryQuestions } from '../hooks/useRecoveryQuestions'
import { ApiError } from '../utils/api'
import {
  checkRecoveryAnswer,
  checkRecoveryPin,
  finishPasswordReset,
  getQuestionFor,
  type RecoveryQuestion,
} from '../utils/authApi'
import { checkPassword, PASSWORD_HINT } from '../utils/passwordRule'
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

function message(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

export function ForgotPassword({ onBack, onSignIn }: Props) {
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
      setError('Enter your email address.')
      return
    }
    setPin('')
    go('pin')
  }

  function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pin.length !== 6) {
      setError('Enter your 6-digit PIN.')
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
      setError('Enter your answer.')
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
      checkPassword(password) ??
      (password === passwordAgain ? null : 'The two passwords do not match.') ??
      checkRecovery(recovery)
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
        {busy ? 'Please wait...' : label}
        {!busy && <ArrowIcon />}
      </button>
    )
  }

  if (step === 'done') {
    return (
      <AuthShell>
        <div className="auth-head">
          <h1 className="auth-greeting">Password changed</h1>
          <p className="auth-sub">
            You are signed out on your other devices. Sign in with your new password.
          </p>
        </div>
        <div className="auth-fields">
          <button type="button" className="auth-primary" onClick={onSignIn}>
            Sign in
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
          <h1 className="auth-greeting">Password reset is locked</h1>
          <p className="auth-sub">
            There were too many wrong answers, so password reset is locked for this
            account to keep it safe. If you still know your password, you can sign in
            as usual. Otherwise, please contact the VeggieBook admin.
          </p>
        </div>
        <div className="auth-fields">
          <div className="auth-contact">
            <LegalContact />
          </div>
          <button type="button" className="auth-primary" onClick={onSignIn}>
            Back to sign in
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
            <h1 className="auth-greeting">Enter your PIN</h1>
            <p className="auth-sub">
              Enter the 6-digit recovery PIN you chose for <strong>{address}</strong>.
            </p>
          </div>
          <div className="auth-fields">
            <PinField id="forgot-pin" label="Recovery PIN" value={pin} onChange={setPin} />
            {errorLine}
            {submitButton('Continue')}
            <p className="auth-switch">
              <button
                type="button"
                className="link-btn"
                disabled={busy}
                onClick={() => void run(() => openQuestion(null))}
              >
                I don't remember my PIN
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
            <h1 className="auth-greeting">Answer your security question</h1>
            {notice && <p className="auth-notice">{notice}</p>}
          </div>
          <div className="auth-fields">
            <p className="auth-question">{question?.text}</p>
            <TextPillField
              id="forgot-answer"
              label="Your answer"
              value={answer}
              onChange={setAnswer}
              autoComplete="off"
              maxLength={MAX_ANSWER}
              hint="Capital letters and extra spaces don't matter."
            />
            {errorLine}
            {submitButton('Continue')}
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
            <h1 className="auth-greeting">Set up your account again</h1>
            <p className="auth-sub">
              Choose a new password, a new PIN, and a new security question. Your new
              password can't be the same as your old one.
            </p>
          </div>
          <div className="auth-fields">
            {/* Lets password managers save the new password under this email. */}
            <input type="email" autoComplete="username" value={address} readOnly hidden />

            <AuthPasswordField
              id="forgot-new-password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint={PASSWORD_HINT}
            />
            <AuthPasswordField
              id="forgot-new-password-again"
              label="Confirm new password"
              value={passwordAgain}
              onChange={setPasswordAgain}
              autoComplete="new-password"
            />

            <h2 className="auth-section-title">Account recovery</h2>
            <RecoveryFields
              idPrefix="forgot"
              value={recovery}
              onChange={setRecovery}
              questions={questions}
            />

            {errorLine}
            {submitButton('Save and finish')}
            {error && (
              <p className="auth-switch">
                Taking too long?{' '}
                <button type="button" className="link-btn" onClick={startOver}>
                  Start again
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
          <h1 className="auth-greeting">Forgot your password?</h1>
          <p className="auth-sub">
            Enter your email. Then you'll use your recovery PIN, or your security
            question, to choose a new password.
          </p>
        </div>
        <div className="auth-fields">
          <EmailField id="forgot-email" value={email} onChange={setEmail} />
          {errorLine}
          {submitButton('Continue')}
        </div>
      </form>
    </AuthShell>
  )
}