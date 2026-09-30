import { useState, type FormEvent } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthPasswordField } from '../components/AuthPasswordField'
import { AuthShell } from '../components/AuthShell'
import { CheckEmailPanel } from '../components/CheckEmailPanel'
import { EmailField } from '../components/EmailField'
import { GuestBooksChoice } from '../components/GuestBooksChoice'
import { ApiError } from '../utils/api'

// Sign in and create account share this form. Only the wording, the password
// hint, and the browser autofill hints differ.
//
// Create account ends on "Check your email": the account cannot be used
// until its email is confirmed. Sign in with an unconfirmed email answers
// 403, and the form offers to send the link again.
//
// A guest with saved books chooses what happens to them (GuestBooksChoice).
//
// Errors from the API are already written for the user (see utils/api.ts),
// so they are shown as they come.

export type AuthMode = 'signin' | 'register'
export type AuthOutcome = 'checkEmail' | 'signedIn'

type Props = {
  mode: AuthMode
  // A guest's saved books. 0 for everyone else, which hides the choice.
  guestBookCount: number
  onSubmit: (email: string, password: string, keepGuestBooks: boolean) => Promise<AuthOutcome>
  onResendConfirmation: (email: string) => Promise<void>
  onForgotPassword: () => void
  onSwitchMode: () => void
  // Leaving the Check your email screen.
  onDone: () => void
  onBack?: () => void
}

const MIN_PASSWORD = 12

export function AuthForm({
  mode,
  guestBookCount,
  onSubmit,
  onResendConfirmation,
  onForgotPassword,
  onSwitchMode,
  onDone,
  onBack,
}: Props) {
  const register = mode === 'register'
  const hasGuestBooks = guestBookCount > 0

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepBooks, setKeepBooks] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConfirmed, setNotConfirmed] = useState(false)
  const [resent, setResent] = useState(false)
  // Set after Create account: the address the email went to.
  const [sentTo, setSentTo] = useState<string | null>(null)

  const keep = hasGuestBooks && keepBooks

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    // Checked here so the user hears about it right away. The API enforces
    // the same rule either way.
    if (register && password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    const address = email.trim()
    setBusy(true)
    setError(null)
    setNotConfirmed(false)
    setResent(false)
    try {
      const outcome = await onSubmit(address, password, keep)
      if (outcome === 'checkEmail') {
        setSentTo(address)
        setBusy(false)
      }
      // Signed in: the parent moves on to another screen.
    } catch (err) {
      if (!register && err instanceof ApiError && err.status === 403) {
        setNotConfirmed(true)
      }
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  async function resend() {
    try {
      await onResendConfirmation(email.trim())
      setResent(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (sentTo) {
    return (
      <AuthShell>
        <CheckEmailPanel
          email={sentTo}
          keptBooks={keep}
          onResend={() => onResendConfirmation(sentTo)}
          onDone={onDone}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell onBack={onBack}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">{register ? 'Create an account' : 'Welcome back'}</h1>
          <p className="auth-sub">
            {register
              ? 'Your books are kept in your account, on any device.'
              : 'Sign in to get back to the books you saved.'}
          </p>
        </div>

        <div className="auth-fields">
          <EmailField id="auth-email" value={email} onChange={setEmail} />

          <AuthPasswordField
            id="auth-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={register ? 'new-password' : 'current-password'}
            hint={
              register
                ? 'At least 12 characters. A few words together are easy to remember, like "green garden table lamp".'
                : undefined
            }
          />

          {!register && (
            <p className="auth-forgot">
              <button type="button" className="link-btn" onClick={onForgotPassword}>
                Forgot your password?
              </button>
            </p>
          )}

          {hasGuestBooks && (
            <GuestBooksChoice
              count={guestBookCount}
              keep={keepBooks}
              onChange={setKeepBooks}
              whenMoved={register ? 'once you confirm your email' : 'right away'}
            />
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {notConfirmed &&
            (resent ? (
              <p className="auth-note">A new link is on its way.</p>
            ) : (
              <button type="button" className="auth-secondary" onClick={resend}>
                Send the confirmation email again
              </button>
            ))}

          <button type="submit" className="auth-primary" disabled={busy}>
            {busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}
            {!busy && <ArrowIcon />}
          </button>

          {/* The other door, under a thin line rather than an "or", so it
              reads as a way out of this form, not a third choice in it. */}
          <p className="auth-switch">
            {register ? 'Already have an account? ' : 'New here? '}
            <button type="button" className="link-btn" onClick={onSwitchMode}>
              {register ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}