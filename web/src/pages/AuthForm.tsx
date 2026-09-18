import { useState, type FormEvent } from 'react'

// Sign in and create account share this form. Only the wording, the password
// hint, and the browser autofill hints differ.
//
// autoComplete matters: "current-password" lets password managers fill in a
// saved password, and "new-password" lets them suggest a strong one.
//
// Errors from the API are already written for the user (see utils/api.ts),
// so they are shown as they come.

export type AuthMode = 'signin' | 'register'

type Props = {
  mode: AuthMode
  // Shown under the title, for example when a guest is saving a finished book.
  note?: string
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchMode: () => void
}

const MIN_PASSWORD = 12

function MailIcon() {
  return (
    <svg
      className="pill-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      className="pill-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function AuthForm({ mode, note, onSubmit, onSwitchMode }: Props) {
  const register = mode === 'register'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      await onSubmit(email.trim(), password)
      // On success the parent moves on to another screen.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
      setBusy(false)
    }
  }

  return (
    <form className="auth-screen" onSubmit={submit} noValidate>
      <div className="auth-head">
        <h1 className="auth-greeting">
          {register ? 'Create account' : 'Sign in'}
        </h1>
        <p className="auth-sub">
          {register
            ? 'Your books are kept in your account.'
            : 'Welcome back. Your books are waiting.'}
        </p>
        {note && <p className="auth-sub">{note}</p>}
      </div>

      <div className="auth-fields">
        <div className="pill-field">
          <label className="pill-label" htmlFor="auth-email">
            Email
          </label>
          <div className="pill-wrap">
            <MailIcon />
            <input
              id="auth-email"
              className="pill-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="pill-field">
          <label className="pill-label" htmlFor="auth-password">
            Password
          </label>
          <div className="pill-wrap">
            <LockIcon />
            <input
              id="auth-password"
              className="pill-input has-action"
              type={showPassword ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'}
              maxLength={128}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="pill-action"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-controls="auth-password"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {register && (
            <p className="field-hint">
              At least 12 characters. A few words together are easy to remember,
              like "green garden table lamp".
            </p>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="create-btn" disabled={busy}>
          {busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}
        </button>
      </div>

      <div className="auth-alt">
        <button type="button" className="link-btn" onClick={onSwitchMode}>
          {register
            ? 'Already have an account? Sign in'
            : 'New here? Create an account'}
        </button>
      </div>
    </form>
  )
}