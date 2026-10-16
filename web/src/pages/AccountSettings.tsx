import { useState } from 'react'
import { SignOutIcon, UserIcon } from '../components/icons/AccountIcons'
import { ChangePasswordForm } from '../components/account/ChangePasswordForm'
import { DeleteAccountForm } from '../components/account/DeleteAccountForm'
import { LeafDecor } from '../components/layout/LeafDecor'
import { ProfileCard } from '../components/account/ProfileCard'
import { RecoveryCard } from '../components/account/RecoveryCard'
import { ResearchCard } from '../components/account/ResearchCard'
import { ACCOUNT } from '../i18n/strings/account'
import { COMMON } from '../i18n/strings/common'
import { HOME } from '../i18n/strings/home'
import { useStrings } from '../i18n/useStrings'

// Profile and settings: the profile (name and username), change password,
// password recovery (PIN and security question), help with research
// (research tracking), delete account, and sign out.
//
// Each section is a card, with its own error message, so a problem in one
// never hides another. Sign out sits below them on its own: it is one
// button with no settings behind it. It is also in the home screen's Menu.
//
// The two faint leaves in the bottom corner are decoration only.

type Props = {
  email: string
  onSignOut: () => Promise<void>
  onChangePassword: (ticket: string, newPassword: string) => Promise<void>
  onDeleteAccount: (password: string) => Promise<void>
}

export function AccountSettings({
  email,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
}: Props) {
  const t = useStrings(ACCOUNT)
  const home = useStrings(HOME)
  const common = useStrings(COMMON)

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
      setError(err instanceof Error ? err.message : common.somethingWrong)
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
          <h1 className="account-title">{home.profile}</h1>
          <p className="account-email">{email}</p>
          <p className="account-tagline">{t.tagline}</p>
        </div>
      </div>

      <ProfileCard />

      <ChangePasswordForm email={email} onChangePassword={onChangePassword} />

      <RecoveryCard />

      <ResearchCard />

      <DeleteAccountForm onDeleteAccount={onDeleteAccount} />

      <hr className="account-divider" />

      <button
        type="button"
        className="account-signout"
        onClick={signOut}
        disabled={busy}
      >
        <SignOutIcon />
        {busy ? t.signingOut : home.signOut}
      </button>
      <p className="account-signout-note">{t.signOutNote}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}