import { useState, type FormEvent } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthPasswordField } from '../components/AuthPasswordField'
import { AuthShell } from '../components/AuthShell'
import { EmailField } from '../components/EmailField'
import { GuestBooksChoice } from '../components/GuestBooksChoice'

// Sign in. Create Account has its own page (CreateAccount.tsx), since it
// asks for much more.
//
// A guest with saved books chooses what happens to them (GuestBooksChoice).
//
// Errors from the API are already written for the user (see utils/api.ts),
// so they are shown as they come.

type Props = {
  // A guest's saved books. 0 for everyone else, which hides the choice.
  guestBookCount: number
  onSubmit: (email: string, password: string, keepGuestBooks: boolean) => Promise<void>
  onForgotPassword: () => void
  onCreateAccount: () => void
  onBack?: () => void
}

export function AuthForm({
  guestBookCount,
  onSubmit,
  onForgotPassword,
  onCreateAccount,
  onBack,
}: Props) {
  const hasGuestBooks = guestBookCount > 0

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepBooks, setKeepBooks] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

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
          <h1 className="auth-greeting">Welcome back</h1>
          <p className="auth-sub">Sign in to get back to the books you saved.</p>
        </div>

        <div className="auth-fields">
          <EmailField id="auth-email" value={email} onChange={setEmail} />

          <AuthPasswordField
            id="auth-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <p className="auth-forgot">
            <button type="button" className="link-btn" onClick={onForgotPassword}>
              Forgot your password?
            </button>
          </p>

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
            {busy ? 'Please wait...' : 'Sign in'}
            {!busy && <ArrowIcon />}
          </button>

          <p className="auth-switch">
            New here?{' '}
            <button type="button" className="link-btn" onClick={onCreateAccount}>
              Create an account
            </button>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}