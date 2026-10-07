import { useState, type ReactNode } from 'react'
import { NavIcon } from '../icons/NavIcons'
import { navGroups, navLabel, type AdminTab } from './navigation'
import '../../styles/shell.css'

// The frame around every admin screen: the sidebar with every section, who
// is signed in, and Sign out.
//
// On a wide screen the sidebar is always shown. On a narrow one it hides,
// and the menu button in the top bar slides it in.
//
// The Admin badge is gold for the root admin and green for every other
// admin.

export type { AdminTab }

type Props = {
  email: string
  isRoot: boolean
  tab: AdminTab
  onTab: (tab: AdminTab) => void
  onSignOut: () => Promise<void>
  children: ReactNode
}

export function AdminShell({ email, isRoot, tab, onTab, onSignOut, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  function choose(next: AdminTab) {
    onTab(next)
    setMenuOpen(false)
  }

  return (
    <div className="shell">
      <aside className={menuOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/brand/logo-positive-en.png" alt="VeggieBook" />
          <span className={isRoot ? 'shell-badge is-root' : 'shell-badge'}>Admin</span>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <NavIcon name="close" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin sections">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-group-label">{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === tab ? 'nav-item is-active' : 'nav-item'}
                  aria-current={item.id === tab ? 'page' : undefined}
                  onClick={() => choose(item.id)}
                >
                  <NavIcon name={item.icon} />
                  <span className="nav-label">{item.label}</span>
                  {!item.ready && <span className="nav-soon">Soon</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-email">{email}</span>
          <button type="button" className="nav-item" onClick={() => void onSignOut()}>
            <NavIcon name="signout" />
            <span className="nav-label">Sign out</span>
          </button>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="shell-body">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <NavIcon name="menu" />
          </button>
          <span className="topbar-title">{navLabel(tab)}</span>
        </header>

        <main className="shell-main">{children}</main>
      </div>
    </div>
  )
}