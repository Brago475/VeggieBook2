import { useState, type FormEvent } from 'react'
import '../styles/signin.css'

// Sign in to the admin site with a VeggieBook2 account that has the Admin
// role. Same email and password as the public site, so a forgotten password
// is reset there.

type Props = {
  onSignIn: (email: string, password: string) => Promise<void>
}

const RESET_URL = 'https://veggiebook2.com/forgot-password'

export function SignIn({ onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onSignIn(email.trim(), password)
      // On success the parent switches to the admin screens.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="signin">
      <form className="signin-card" onSubmit={submit}>
        <div className="signin-brand">
          <span className="signin-name">VeggieBook</span>
          <span className="signin-badge">Admin</span>
        </div>

        <div className="signin-head">
          <h1 className="signin-title">Sign in</h1>
          <p className="signin-sub">For the VeggieBook2 research team.</p>
        </div>

        <div className="signin-fields">
          <label className="signin-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="signin-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {error && (
          <p className="signin-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="signin-submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="signin-note">
          Admin accounts only. Forgot your password? Reset it on{' '}
          <a href={RESET_URL} target="_blank" rel="noopener noreferrer">
            veggiebook2.com
          </a>
          .
        </p>
      </form>
    </div>
  )
}