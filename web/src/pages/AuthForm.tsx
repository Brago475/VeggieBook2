import { useState, type FormEvent } from 'react'
import { ArrowIcon, EyeIcon, LockIcon, MailIcon } from '../components/AuthIcons'
import { SafeImage } from '../components/SafeImage'
import { BackArrowIcon } from '../components/StepIcons'
import { AUTH_PHOTO } from '../utils/authPhoto'
import { coverSrc } from '../utils/coverSrc'

// Sign in and create account share this form. Only the wording, the password
// hint, and the browser autofill hints differ.
//
// autoComplete matters: "current-password" lets password managers fill in a
// saved password, and "new-password" lets them suggest a strong one.
//
// Errors from the API are already written for the user (see utils/api.ts),
// so they are shown as they come.
//
// The masthead is hidden on this screen (see App.tsx), so the photograph
// takes the top of the screen, the logo sits under it, and Back rides over
// the photograph in the same white pill the header uses.

export type AuthMode = 'signin' | 'register'

type Props = {
  mode: AuthMode
  // Shown under the title, for example when a guest is saving a finished book.
  note?: string
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchMode: () => void
  // The masthead is hidden here, so back is rendered in the page instead.
  onBack?: () => void
}

const MIN_PASSWORD = 12

export function AuthForm({ mode, note, onSubmit, onSwitchMode, onBack }: Props) {
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
      <div className="auth-hero">
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack}>
            <BackArrowIcon />
            Back
          </button>
        )}
        <SafeImage src={coverSrc(AUTH_PHOTO)} loading="eager" />
      </div>

      <div className="auth-main">
        <img
          className="auth-logo"
          src="/brand/logo-positive-en.png"
          alt="VeggieBook, Quick Help for Meals"
        />

        <div className="auth-head">
          <h1 className="auth-greeting">
            {register ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="auth-sub">
            {register
              ? 'Your books are kept in your account, on any device.'
              : 'Sign in to get back to the books you saved.'}
          </p>
          {note && <p className="auth-sub">{note}</p>}
        </div>

        <div className="auth-fields">
          <div className="pill-field">
            <label className="pill-label" htmlFor="auth-email">
              Email address
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
            {register && (
              <p className="field-hint">
                At least 12 characters. A few words together are easy to
                remember, like "green garden table lamp".
              </p>
            )}
          </div>

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
      </div>
    </form>
  )
}