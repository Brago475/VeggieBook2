import { useState } from 'react'
import { api } from '../../utils/api'
import { SettingsCard } from './SettingsCard'

// The signed-in admin: sign out here, or everywhere.

type Props = {
  email: string
  isRoot: boolean
  onSignOut: () => Promise<void>
}

export function YourAccountSection({ email, isRoot, onSignOut }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function everywhere() {
    setBusy(true)
    setError(null)
    try {
      await api('/admin/settings/signout-everywhere', { method: 'POST' })
      window.location.reload()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <SettingsCard id="account" title="Your account">
      <div className="se-me">
        <div className="se-me-who">
          <span className={isRoot ? 'se-avatar is-dark is-root' : 'se-avatar is-dark'}>{email.charAt(0).toUpperCase()}</span>
          <span className="se-admin-text">
            <strong>{email}</strong>
            <span className={isRoot ? 'se-label is-root' : 'se-label'}>ADMIN</span>
          </span>
        </div>
        <div className="se-me-actions">
          <button type="button" className="se-btn" onClick={() => void onSignOut()}>
            Sign out
          </button>
          <button type="button" className="se-btn" disabled={busy} onClick={() => void everywhere()}>
            {busy ? 'Signing out...' : 'Sign out on every device'}
          </button>
        </div>
      </div>
      {error && (
        <p className="error se-pad" role="alert">
          {error}
        </p>
      )}
    </SettingsCard>
  )
}