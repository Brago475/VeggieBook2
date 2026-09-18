import { useState } from 'react'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountForm } from '../components/DeleteAccountForm'

// Account settings: sign out, change password, delete account.
//
// Each section is its own component with its own error message, so a
// problem in one never hides another.
//
// Those components each render their own .account-page. Rather than edit
// all three, this wrapper turns each block into a card, which is what was
// missing: three sections stacked with matching padding read as six loose
// items, not three things.
//
// Deleting the account is wrapped separately so it can be marked as the one
// irreversible thing on the screen instead of sitting in the same rhythm as
// signing out.

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

      <div className="account-card">
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
      </div>

      <ChangePasswordForm email={email} onChangePassword={onChangePassword} />

      <div className="account-danger">
        <DeleteAccountForm onDeleteAccount={onDeleteAccount} />
      </div>
    </div>
  )
}