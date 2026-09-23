import { useState, type FormEvent } from 'react'
import { LockIcon } from './LibraryIcons'
import { PasswordField } from './PasswordField'

// Change password, on the account settings screen.
//
// On success the API gives this device a fresh session and signs out every
// other one. The fields clear and a confirmation says so.

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
    <form className="account-card" onSubmit={submit} noValidate>
      <div className="account-card-head">
        <span className="account-card-icon">
          <LockIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">Change password</h2>
          <p className="account-card-text">Keep your account secure.</p>
        </div>
      </div>

      {/* Lets password managers save the new password under this email. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />

      <PasswordField
        id="current-password"
        label="Current password"
        autoComplete="current-password"
        value={current}
        onChange={setCurrent}
      />

      <PasswordField
        id="new-password"
        label="New password"
        autoComplete="new-password"
        placeholder="Enter a new password"
        hint={`Use at least ${MIN_PASSWORD} characters.`}
        value={next}
        onChange={setNext}
      />

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

      <button type="submit" className="account-primary" disabled={busy}>
        {busy ? 'Changing...' : 'Change password'}
      </button>
    </form>
  )
}