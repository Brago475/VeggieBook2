import { useState } from 'react'
import { AccountHub } from '../components/account/AccountHub'
import { AdminDeleteNote } from '../components/account/AdminDeleteNote'
import { DeleteAccountForm } from '../components/account/DeleteAccountForm'
import { ProfileCard } from '../components/account/ProfileCard'
import { ResearchCard } from '../components/account/ResearchCard'
import { SecurityCard } from '../components/account/SecurityCard'
import { SettingsPage } from '../components/account/SettingsPage'
import { SignOutIcon } from '../components/icons/AccountIcons'
import { LeafDecor } from '../components/layout/LeafDecor'
import { ACCOUNT } from '../i18n/strings/account'
import { COMMON } from '../i18n/strings/common'
import { HOME } from '../i18n/strings/home'
import { SETTINGS } from '../i18n/strings/settings'
import { useStrings } from '../i18n/useStrings'
import type { AccountSection } from '../utils/routes'

// Profile and settings. With no section open: a green cover with the
// username and email, a list of settings, and sign out below it. With a
// section open: that setting on its own screen (username, password and
// recovery, help with research, or delete account), each with a link back
// to the list. Each setting is its existing card, with its own error
// message. Sign out is also in the home screen's Menu.
//
// Admin accounts see a note instead of Delete account; the API refuses it.

type Props = {
  email: string
  isAdmin: boolean
  section: AccountSection | null
  onOpenSection: (section: AccountSection | null) => void
  onSignOut: () => Promise<void>
  onChangePassword: (ticket: string, newPassword: string) => Promise<void>
  onDeleteAccount: (password: string) => Promise<void>
}

export function AccountSettings({
  email,
  isAdmin,
  section,
  onOpenSection,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
}: Props) {
  const t = useStrings(ACCOUNT)
  const s = useStrings(SETTINGS)
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

  if (section) {
    const title =
      section === 'username'
        ? t.username
        : section === 'security'
          ? s.security
          : section === 'research'
            ? t.rsTitle
            : t.delTitle

    return (
      <SettingsPage
        kicker={s.settings}
        title={title}
        backLabel={s.profile}
        danger={section === 'delete'}
        onBack={() => onOpenSection(null)}
      >
        {section === 'username' && <ProfileCard />}
        {section === 'security' && <SecurityCard email={email} onChangePassword={onChangePassword} />}
        {section === 'research' && <ResearchCard />}
        {section === 'delete' &&
          (isAdmin ? <AdminDeleteNote /> : <DeleteAccountForm onDeleteAccount={onDeleteAccount} />)}
      </SettingsPage>
    )
  }

  return (
    <div className="account-screen settings-hub">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <AccountHub email={email} isAdmin={isAdmin} onOpen={onOpenSection} />

      <hr className="account-divider" />

      <button type="button" className="account-signout" onClick={signOut} disabled={busy}>
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