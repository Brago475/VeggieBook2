import { useState, type FormEvent } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthPasswordField } from '../components/AuthPasswordField'
import { AuthShell } from '../components/AuthShell'
import { EmailField } from '../components/EmailField'
import { GuestBooksChoice } from '../components/GuestBooksChoice'

// Sign in and create account share this form. Only the wording, the password
// hint, and the browser autofill hints differ. Both sign in right away on
// success, and the parent moves on to the home screen.
//
// A guest with saved books chooses what happens to them (GuestBooksChoice).
//
// Errors from the API are already written for the user (see utils/api.ts),
// so they are shown as they come.

export type AuthMode = 'signin' | 'register'

type Props = {
  mode: AuthMode
  // A guest's saved books. 0 for everyone else, which hides the choice.
  guestBookCount: number
  onSubmit: (email: string, password: string, keepGuestBooks: boolean) => Promise<void>
  onForgotPassword: () => void
  onSwitchMode: () => void
  onBack?: () => void
}

const MIN_PASSWORD = 12

export function AuthForm({
  mode,
  guestBookCount,
  onSubmit,
  onForgotPassword,
  onSwitchMode,
  onBack,
}: Props) {
  const register = mode === 'register'
  const hasGuestBooks = guestBookCount > 0

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepBooks, setKeepBooks] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    // Checked here so the user hears about it right away. The API enforces
    // the same rule either way.
    if (register && password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSubmit(email.trim(), password, hasGuestBooks && keepBooks)
      // On success the parent moves on to the home screen.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
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
              whenMoved="right away"
            />
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

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