import { useState, type ReactNode } from 'react'
import { NavIcon } from '../icons/NavIcons'
import { navGroups, navLabel, type AdminTab } from './navigation'
import '../../styles/shell.css'

// The frame around every admin screen: the sidebar with every section, the
// signed-in account, and Sign out.
//
// On a wide screen the sidebar is always shown. On a narrow one it hides,
// and the menu button in the top bar slides it in. Sections that are not
// built yet are dimmed but still open their "coming" page.
//
// Gold marks the root admin (badge and avatar); every other admin is green.

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
              {group.items.map((item) => {
                const classes = ['nav-item']
                if (item.id === tab) classes.push('is-active')
                else if (!item.ready) classes.push('is-soon')
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={classes.join(' ')}
                    aria-current={item.id === tab ? 'page' : undefined}
                    onClick={() => choose(item.id)}
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className={isRoot ? 'avatar is-root' : 'avatar'} aria-hidden="true">
            {email.charAt(0).toUpperCase()}
          </span>
          <div className="sidebar-user-text">
            <span className="sidebar-email" title={email}>
              {email}
            </span>
            <span className="sidebar-role">Administrator</span>
          </div>
          <button
            type="button"
            className="signout-button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void onSignOut()}
          >
            <NavIcon name="signout" />
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