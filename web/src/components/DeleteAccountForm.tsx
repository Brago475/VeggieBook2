import { useState, type FormEvent } from 'react'

// Delete account, on the account settings screen.
//
// Two steps: a first click reveals a password field, so the account cannot
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
    <form className="account-page" onSubmit={submit} noValidate>
      <h2 className="account-section-title">Delete account</h2>
      <p className="account-text">
        This permanently deletes your account, all of your books, and any
        photos you uploaded. It cannot be undone.
      </p>

      {!confirming && (
        <button
          type="button"
          className="account-btn is-danger"
          onClick={() => setConfirming(true)}
        >
          Delete my account
        </button>
      )}

      {confirming && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="delete-password">
              Enter your password to confirm
            </label>
            <input
              id="delete-password"
              className="field-input"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="account-btn is-danger" disabled={busy}>
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