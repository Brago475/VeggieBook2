import { useState } from 'react'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountForm } from '../components/DeleteAccountForm'

// Account settings: sign out, change password, delete account.
//
// Each section is its own component with its own error message, so a
// problem in one never hides another.

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
    <>
      <div className="account-page">
        <h1 className="account-title">Your account</h1>
        <p className="account-text">Signed in as {email}</p>
        <button type="button" className="account-btn" onClick={signOut} disabled={busy}>
          {busy ? 'Signing out...' : 'Sign out'}
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <ChangePasswordForm email={email} onChangePassword={onChangePassword} />
      <DeleteAccountForm onDeleteAccount={onDeleteAccount} />
    </>
  )
}