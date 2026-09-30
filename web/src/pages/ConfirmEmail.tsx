import { useEffect, useRef, useState } from 'react'
import { ArrowIcon } from '../components/AuthIcons'
import { AuthShell } from '../components/AuthShell'
import { confirmEmail } from '../utils/authApi'
import { clearLinkParams, readLinkParams } from '../utils/linkParams'

// Opened from the link in the confirmation email. Confirms right away,
// with no button, then offers Sign in. Confirming never signs anyone in by
// itself, so a forwarded or leaked link cannot open the account.
//
// If the new account kept a guest's books, the API moves them now, which
// ends that guest session. onConfirmed rechecks who is signed in so this
// page catches up.

type Props = {
  onConfirmed: () => void
  onSignIn: () => void
  onHome: () => void
}

type State =
  | { step: 'working' }
  | { step: 'done' }
  | { step: 'failed'; message: string }

const INVALID = 'This link is invalid or has expired.'

export function ConfirmEmail({ onConfirmed, onSignIn, onHome }: Props) {
  const [params] = useState(readLinkParams)
  const [state, setState] = useState<State>(
    params ? { step: 'working' } : { step: 'failed', message: INVALID },
  )
  // React runs effects twice in development. The link is sent only once.
  const started = useRef(false)

  useEffect(() => {
    clearLinkParams()
    if (!params || started.current) return
    started.current = true

    confirmEmail(params.userId, params.token)
      .then(() => {
        setState({ step: 'done' })
        onConfirmed()
      })
      .catch((err) =>
        setState({ step: 'failed', message: err instanceof Error ? err.message : INVALID }),
      )
  }, [params, onConfirmed])

  if (state.step === 'working') {
    return (
      <AuthShell>
        <div className="auth-head">
          <h1 className="auth-greeting">Confirming your email...</h1>
        </div>
      </AuthShell>
    )
  }

  if (state.step === 'done') {
    return (
      <AuthShell>
        <div className="auth-head">
          <h1 className="auth-greeting">Your email is confirmed</h1>
          <p className="auth-sub">
            You can sign in now. If you kept books from a guest visit, they are
            waiting in your account.
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
      <div className="auth-head">
        <h1 className="auth-greeting">This link did not work</h1>
        <p className="auth-sub">{state.message}</p>
        <p className="auth-sub">
          Links expire after 3 hours. Try signing in, and if your email still
          needs confirming, you can ask for a new link there.
        </p>
      </div>
      <div className="auth-fields">
        <button type="button" className="auth-primary" onClick={onSignIn}>
          Go to sign in
          <ArrowIcon />
        </button>
        <p className="auth-switch">
          <button type="button" className="link-btn" onClick={onHome}>
            Back to home
          </button>
        </p>
      </div>
    </AuthShell>
  )
}