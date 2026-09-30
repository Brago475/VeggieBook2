import { useEffect, useState, type FormEvent } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthPasswordField } from '../components/AuthPasswordField'
import { AuthShell } from '../components/AuthShell'
import { resetPassword } from '../utils/authApi'
import { clearLinkParams, readLinkParams } from '../utils/linkParams'

// Choose a new password, opened from the link in the reset email.
//
// Afterward every device is signed out (the API replaces the account's
// security stamp), and the user signs in with the new password.

type Props = {
  onSignIn: () => void
  onForgotPassword: () => void
}

const MIN_PASSWORD = 12

export function ResetPassword({ onSignIn, onForgotPassword }: Props) {
  const [params] = useState(readLinkParams)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    clearLinkParams()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !params) return

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await resetPassword(params.userId, params.token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  if (!params) {
    return (
      <AuthShell>
        <div className="auth-head">
          <h1 className="auth-greeting">This link did not work</h1>
          <p className="auth-sub">
            Reset links expire after 3 hours and can only be used once. You can
            ask for a new one.
          </p>
        </div>
        <div className="auth-fields">
          <button type="button" className="auth-primary" onClick={onForgotPassword}>
            Send a new link
            <ArrowIcon />
          </button>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell>
        <div className="auth-head">
          <h1 className="auth-greeting">Password changed</h1>
          <p className="auth-sub">
            You are signed out everywhere. Sign in with your new password.
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

  return (
    <AuthShell>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">Choose a new password</h1>
        </div>

        <div className="auth-fields">
          <AuthPasswordField
            id="reset-password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint='At least 12 characters. A few words together are easy to remember, like "green garden table lamp".'
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-primary" disabled={busy}>
            {busy ? 'Please wait...' : 'Save new password'}
            {!busy && <ArrowIcon />}
          </button>

          <p className="auth-switch">
            Link expired?{' '}
            <button type="button" className="link-btn" onClick={onForgotPassword}>
              Send a new one
            </button>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}