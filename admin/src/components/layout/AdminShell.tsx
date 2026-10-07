import type { ReactNode } from 'react'
import '../../styles/shell.css'

// The frame around every admin screen: the title, the tabs, who is signed
// in, and Sign out.

export type AdminTab = 'overview' | 'accounts' | 'studies' | 'reports'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'studies', label: 'Studies' },
  { id: 'reports', label: 'Reports' },
]

type Props = {
  email: string
  tab: AdminTab
  onTab: (tab: AdminTab) => void
  onSignOut: () => Promise<void>
  children: ReactNode
}

export function AdminShell({ email, tab, onTab, onSignOut, children }: Props) {
  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-brand">
          <span className="shell-title">VeggieBook</span>
          <span className="shell-badge">Admin</span>
        </div>

        <nav className="shell-tabs" aria-label="Admin sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'shell-tab is-active' : 'shell-tab'}
              aria-current={t.id === tab ? 'page' : undefined}
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="shell-user">
          <span className="shell-email">{email}</span>
          <button type="button" className="shell-signout" onClick={() => void onSignOut()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="shell-main">{children}</main>
    </div>
  )
}