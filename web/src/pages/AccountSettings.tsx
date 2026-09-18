import { useState } from 'react'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountForm } from '../components/DeleteAccountForm'

// Account settings: sign out, change password, delete account.
//
// Each section is its own component with its own error message, so a
// problem in one never hides another.
//
// Those components each render their own .account-page. Rather than edit
// all three, this wrapper turns each block into a card.
//
// Sign out is deliberately not a card: it is one button with no settings
// behind it, and wrapping it put a bordered button inside a bordered box.
//
// Deleting the account is wrapped separately so it can be marked as the one
// irreversible thing on the screen.

type Props = {
  email: string
  onSignOut: () => Promise<void>
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  onDeleteAccount: (password: string) => Promise<void>
}

export function AccountSettings({
  email,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signOut() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onSignOut()
      // On success the parent leaves this screen.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="account-screen">
      <div className="account-head">
        <h1 className="account-title">Your account</h1>
        <p className="account-sub">{email}</p>
      </div>

      <button
        type="button"
        className="account-btn"
        onClick={signOut}
        disabled={busy}
      >
        {busy ? 'Signing out...' : 'Sign out'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <ChangePasswordForm email={email} onChangePassword={onChangePassword} />

      <div className="account-danger">
        <DeleteAccountForm onDeleteAccount={onDeleteAccount} />
      </div>
    </div>
  )
}