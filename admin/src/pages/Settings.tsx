import { useState } from 'react'
import { AccountsTab } from '../components/settings/AccountsTab'
import { SiteSettingsTab } from '../components/settings/SiteSettingsTab'
import { useHeld } from '../hooks/useHeld'
import { useSiteSettings } from '../hooks/useSiteSettings'
import '../styles/studies.css'
import '../styles/books.css'
import '../styles/settings.css'

// Admin Settings: Accounts and Site settings. What each admin sees depends
// on their role; the API enforces the same rules.

type Tab = 'accounts' | 'site'

type Props = {
  email: string
  isRoot: boolean
  onSignOut: () => Promise<void>
}

export function Settings({ email, isRoot, onSignOut }: Props) {
  const [tab, setTab] = useState<Tab>('accounts')
  const { data, error, reload } = useSiteSettings()
  const ready = !useHeld(!data && !error)

  return (
    <div>
      <div className="se-tabs" role="tablist" aria-label="Settings">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'accounts'}
          className={tab === 'accounts' ? 'se-tab is-on' : 'se-tab'}
          onClick={() => setTab('accounts')}
        >
          Accounts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'site'}
          className={tab === 'site' ? 'se-tab is-on' : 'se-tab'}
          onClick={() => setTab('site')}
        >
          Site settings
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {tab === 'accounts' && (
        <AccountsTab info={ready ? data : null} isRoot={isRoot} currentEmail={email} onChanged={() => void reload()} />
      )}
      {tab === 'site' && (
        <SiteSettingsTab
          info={data}
          ready={ready}
          isRoot={isRoot}
          email={email}
          onChanged={() => void reload()}
          onSignOut={onSignOut}
        />
      )}
    </div>
  )
}