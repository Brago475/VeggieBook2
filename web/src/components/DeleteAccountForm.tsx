import { useState, type FormEvent } from 'react'
import { TrashIcon } from './AccountIcons'
import { PasswordField } from './PasswordField'

// Delete account, on the account settings screen.
//
// Two steps: the first click opens a password field, so the account cannot
// be deleted by one stray tap, or by someone using a device its owner left
// signed in. The API then removes the account, every book, and every
// uploaded photo in one step.

type Props = {
  onDeleteAccount: (password: string) => Promise<void>
}

export function DeleteAccountForm({ onDeleteAccount }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    if (!password) {
      setError('Enter your password to confirm.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onDeleteAccount(password)
      // On success the parent leaves this screen.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
      setBusy(false)
    }
  }

  function cancel() {
    setConfirming(false)
    setPassword('')
    setError(null)
  }

  return (
    <form className="account-card" onSubmit={submit} noValidate>
      <div className="account-card-head">
        <span className="account-card-icon is-danger">
          <TrashIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">Delete account</h2>
          <p className="account-card-text">
            This permanently deletes your account, all of your books, and any
            photos you uploaded. It cannot be undone.
          </p>
        </div>

        {!confirming && (
          <button
            type="button"
            className="account-danger-btn"
            onClick={() => setConfirming(true)}
          >
            Delete my account
          </button>
        )}
      </div>

      {confirming && (
        <>
          {/* Focused as soon as it appears, so the next step is obvious. */}
          <PasswordField
            id="delete-password"
            label="Enter your password to confirm"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            autoFocus
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="account-danger-btn is-filled"
            disabled={busy}
          >
            {busy ? 'Deleting...' : 'Permanently delete my account'}
          </button>
          <button type="button" className="link-btn" onClick={cancel}>
            Cancel
          </button>
        </>
      )}
    </form>
  )
}