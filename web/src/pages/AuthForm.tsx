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
    <form className="account-page" onSubmit={submit} noValidate>
      <h1 className="account-title">{register ? 'Create account' : 'Sign in'}</h1>
      {note && <p className="account-text">{note}</p>}

      <div className="field">
        <label className="field-label" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          className="field-input"
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

      <div className="field">
        <label className="field-label" htmlFor="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          className="field-input"
          type={showPassword ? 'text' : 'password'}
          autoComplete={register ? 'new-password' : 'current-password'}
          maxLength={128}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {register && (
          <p className="field-hint">
            At least 12 characters. A few words together are easy to remember,
            like "green garden table lamp".
          </p>
        )}
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
        />
        Show password
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="create-btn" disabled={busy}>
        {busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}
      </button>

      <button type="button" className="link-btn" onClick={onSwitchMode}>
        {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </form>
  )
}