import { useState } from 'react'
import { SignOutIcon, UserIcon } from '../components/AccountIcons'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountForm } from '../components/DeleteAccountForm'
import { LeafDecor } from '../components/LeafDecor'

// Account settings: who is signed in, change password, delete account, and
// sign out.
//
// Change password and delete account are each a card, with their own error
// message, so a problem in one never hides another. Sign out sits below
// them on its own: it is one button with no settings behind it.
//
// The two faint leaves in the bottom corner are decoration only.

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
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <div className="account-hero">
        <span className="account-avatar">
          <UserIcon />
        </span>
        <div className="account-hero-text">
          <h1 className="account-title">Your account</h1>
          <p className="account-email">{email}</p>
          <p className="account-tagline">Manage your account and preferences.</p>
        </div>
      </div>

      <ChangePasswordForm email={email} onChangePassword={onChangePassword} />

      <DeleteAccountForm onDeleteAccount={onDeleteAccount} />

      <hr className="account-divider" />

      <button
        type="button"
        className="account-signout"
        onClick={signOut}
        disabled={busy}
      >
        <SignOutIcon />
        {busy ? 'Signing out...' : 'Sign out'}
      </button>
      <p className="account-signout-note">You'll be signed out on this device.</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}