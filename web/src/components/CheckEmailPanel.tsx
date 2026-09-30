import { useState } from 'react'

// After Create account. The wording is the same whether the email was new
// or already had an account (that person gets a different email), so this
// screen never reveals who is signed up.

type Props = {
  email: string
  keptBooks: boolean
  onResend: () => Promise<void>
  onDone: () => void
}

export function CheckEmailPanel({ email, keptBooks, onResend, onDone }: Props) {
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function resend() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onResend()
      setResent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <>
      <div className="auth-head">
        <h1 className="auth-greeting">Check your email</h1>
        <p className="auth-sub">
          We sent an email to <strong>{email}</strong>. Follow the link in it to
          finish. The link expires in 3 hours.
        </p>
        {keptBooks && (
          <p className="auth-sub">
            Your guest books move into your account as soon as you confirm. Until
            then, do not end your guest visit, or they will be deleted.
          </p>
        )}
      </div>

      <div className="auth-fields">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {resent ? (
          <p className="auth-note">Sent again. It can take a minute to arrive.</p>
        ) : (
          <button type="button" className="auth-secondary" onClick={resend} disabled={busy}>
            {busy ? 'Please wait...' : 'Did not get it? Send it again'}
          </button>
        )}

        <p className="auth-switch">
          <button type="button" className="link-btn" onClick={onDone}>
            Back to home
          </button>
        </p>
      </div>
    </>
  )
}