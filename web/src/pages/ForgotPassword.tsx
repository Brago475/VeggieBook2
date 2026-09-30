import { useState, type FormEvent } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthShell } from '../components/AuthShell'
import { EmailField } from '../components/EmailField'
import { requestPasswordReset } from '../utils/authApi'

// Ask for a password reset link. The answer is the same whether or not the
// email has an account, so this page never reveals who is signed up.

type Props = {
  onBack?: () => void
  onSignIn: () => void
}

export function ForgotPassword({ onBack, onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const address = email.trim()
    if (!address) {
      setError('Enter your email address.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await requestPasswordReset(address)
      setSentTo(address)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  if (sentTo) {
    return (
      <AuthShell onBack={onBack}>
        <div className="auth-head">
          <h1 className="auth-greeting">Check your email</h1>
          <p className="auth-sub">
            If <strong>{sentTo}</strong> has a VeggieBook account, a link to choose
            a new password is on its way. It expires in 3 hours.
          </p>
        </div>
        <div className="auth-fields">
          <button type="button" className="auth-primary" onClick={onSignIn}>
            Back to sign in
            <ArrowIcon />
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell onBack={onBack}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">Forgot your password?</h1>
          <p className="auth-sub">
            Enter your email and we will send you a link to choose a new one.
          </p>
        </div>

        <div className="auth-fields">
          <EmailField id="forgot-email" value={email} onChange={setEmail} />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-primary" disabled={busy}>
            {busy ? 'Please wait...' : 'Send reset link'}
            {!busy && <ArrowIcon />}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}