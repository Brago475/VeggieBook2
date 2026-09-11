import { useState, type FormEvent } from 'react'

// Change password, on the account settings screen.
//
// On success the API gives this device a fresh session and signs out every
// other one. The fields clear and a confirmation shows.

type Props = {
  email: string
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const MIN_PASSWORD = 12

export function ChangePasswordForm({ email, onChangePassword }: Props) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setDone(false)

    if (next.length < MIN_PASSWORD) {
      setError(`New password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onChangePassword(current, next)
      setCurrent('')
      setNext('')
      setDone(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="account-page" onSubmit={submit} noValidate>
      <h2 className="account-section-title">Change password</h2>

      {/* Lets password managers save the new password under this email. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />

      <div className="field">
        <label className="field-label" htmlFor="current-password">
          Current password
        </label>
        <input
          id="current-password"
          className="field-input"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="new-password">
          New password
        </label>
        <input
          id="new-password"
          className="field-input"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <p className="field-hint">
          At least 12 characters. Changing it signs you out on your other devices.
        </p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="form-success" role="status">
          Password changed. You were signed out on your other devices.
        </p>
      )}

      <button type="submit" className="account-btn" disabled={busy}>
        {busy ? 'Changing...' : 'Change password'}
      </button>
    </form>
  )
}