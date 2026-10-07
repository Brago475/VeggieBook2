import { useState, type FormEvent } from 'react'
import '../styles/signin.css'

// Sign in to the admin site with a VeggieBook2 account that has the Admin
// role. Same email and password as the public site.

type Props = {
  onSignIn: (email: string, password: string) => Promise<void>
}

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
      <form className="card signin-card" onSubmit={submit}>
        <h1 className="signin-title">
          VeggieBook <span className="shell-badge">Admin</span>
        </h1>
        <p className="muted">Sign in with an admin account.</p>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}